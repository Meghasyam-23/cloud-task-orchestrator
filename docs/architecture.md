# Architecture

Cloud Task Orchestrator is split into independently containerized services that can run through Docker Compose or local Kubernetes. The system models a common cloud-native pattern: an API accepts work, Redis stores queue state, workers process jobs asynchronously, and a dashboard provides operator visibility.

## System Diagram

```mermaid
flowchart LR
  browser["Browser"] --> dashboard["React Dashboard<br/>Vite"]
  dashboard --> backend["FastAPI Backend<br/>REST API"]
  backend --> redis[("Redis 7<br/>job hashes + job_queue")]
  worker["Worker Service<br/>Python"] --> redis
  redis --> worker
  worker --> redis
  dashboard --> backend
```

## Service Responsibilities

### React Dashboard

The dashboard is the operator-facing control plane.

Responsibilities:

- Submit jobs through the backend API.
- Display API and Redis health.
- Show total, queued, running, completed, and failed job counts.
- Render queue pipeline and worker insights.
- Display Recharts visualizations derived from `GET /jobs`.
- Inspect job payload, result, error, retry count, and timestamps.
- Provide light, dark, and system theme modes.

The dashboard reads the API base URL from `VITE_API_URL`.

### FastAPI Backend

The backend owns request validation and job creation.

Responsibilities:

- Expose `GET /health`.
- Expose `POST /jobs`.
- Expose `GET /jobs`.
- Expose `GET /jobs/{job_id}`.
- Validate supported task types with Pydantic models.
- Generate UUID job IDs.
- Store job metadata in Redis.
- Push job IDs into the Redis list queue named `job_queue`.

The backend reads Redis connection settings from `REDIS_HOST` and `REDIS_PORT`.

### Redis Queue

Redis is both the queue and the job metadata store.

Current key patterns:

- `job:<job_id>`: Redis hash containing job metadata.
- `jobs:index`: Redis list used by the backend for job listing.
- `job_queue`: Redis list used as the worker queue.
- `job_queue:processing`: Redis list used by workers while processing claimed jobs.

Redis is internal to the Docker Compose network and is not published to the host by default.

### Worker Service

The worker consumes queued jobs and writes results.

Responsibilities:

- Connect to Redis using `REDIS_HOST` and `REDIS_PORT`.
- Claim job IDs from `job_queue`.
- Mark jobs `RUNNING`.
- Process supported task types.
- Store `result` on success.
- Store `error` on failure.
- Increment `retry_count`.
- Mark jobs `COMPLETED` or `FAILED`.
- Emit structured JSON logs.

Workers can be scaled horizontally because each worker claims job IDs from Redis atomically.

## Docker Compose Networking

Docker Compose creates an internal network where services can reach each other by service name.

```mermaid
flowchart TB
  subgraph compose["Docker Compose network"]
    frontend["frontend:5173"]
    backend["backend:8000"]
    redis["redis:6379"]
    worker["worker"]
  end

  host["Host browser"] -->|localhost:5173| frontend
  host -->|localhost:8000| backend
  frontend -->|VITE_API_URL=http://localhost:8000| backend
  backend -->|REDIS_HOST=redis| redis
  worker -->|REDIS_HOST=redis| redis
```

Important detail: `VITE_API_URL` is used by browser JavaScript, so in local Compose it points to `http://localhost:8000`, not `http://backend:8000`.

## Job Lifecycle

```mermaid
sequenceDiagram
  participant UI as React Dashboard
  participant API as FastAPI Backend
  participant Redis as Redis
  participant Worker as Worker Service

  UI->>API: POST /jobs
  API->>Redis: HSET job:<job_id> status=QUEUED
  API->>Redis: RPUSH job_queue <job_id>
  API-->>UI: job_id, QUEUED
  Worker->>Redis: Claim job_id from job_queue
  Worker->>Redis: HSET status=RUNNING, retry_count+=1
  Worker->>Worker: Process task_type and payload
  alt success
    Worker->>Redis: HSET status=COMPLETED, result=<json>
  else failure
    Worker->>Redis: HSET status=FAILED, error=<message>
  end
  UI->>API: GET /jobs
  API->>Redis: Read job metadata
  API-->>UI: Updated job list
```

State transition:

```mermaid
stateDiagram-v2
  [*] --> QUEUED
  QUEUED --> RUNNING
  RUNNING --> COMPLETED
  RUNNING --> FAILED
```

## Task Types

| Task type | Input | Result |
| --- | --- | --- |
| `text_transform` | `payload.text` string | uppercase text, reversed text, word count |
| `file_summary` | `payload.text` string | simple extractive summary, sentence count, word count |
| `data_cleanup` | JSON object | payload with null, empty string, and empty list values removed |

## Failure Handling

Malformed or unsupported jobs are handled by the worker:

- The worker logs the failure.
- The job is marked `FAILED`.
- The error message is stored in Redis.
- The job is acknowledged from the processing queue.

Backend Redis failures return structured HTTP errors so the dashboard can show an explicit unreachable/error state.
