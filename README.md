# Cloud Task Orchestrator

Cloud Task Orchestrator is a small cloud-native task orchestration platform with a FastAPI backend, Redis queue, and Python worker service.

## Run Locally With Docker Compose

Build and start the full local stack:

```bash
docker compose up --build
```

This starts:

- Redis on the internal Compose network
- Backend API on `http://localhost:8000`
- Worker service connected to the Redis `job_queue`

In another terminal, run the smoke test:

```bash
./scripts/smoke_test.sh
```

Stop the stack:

```bash
docker compose down
```

## API Quick Check

Health:

```bash
curl http://localhost:8000/health
```

Create a `text_transform` job:

```bash
curl -X POST http://localhost:8000/jobs \
  -H "Content-Type: application/json" \
  -d '{"task_type":"text_transform","payload":{"text":"cloud task orchestrator"}}'
```

List jobs:

```bash
curl http://localhost:8000/jobs
```

## Configuration

The backend and worker read Redis connection settings from environment variables:

- `REDIS_HOST`
- `REDIS_PORT`

Docker Compose sets these to `redis` and `6379` for container-to-container networking.
