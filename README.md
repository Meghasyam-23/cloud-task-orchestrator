# Cloud Task Orchestrator

Cloud Task Orchestrator is a small cloud-native task orchestration platform with a FastAPI backend, Redis queue, Python worker service, and React dashboard.

## Run Locally With Docker Compose

Build and start the full local stack:

```bash
docker compose up --build
```

This starts:

- Redis on the internal Compose network
- Backend API on `http://localhost:8000`
- Frontend dashboard on `http://localhost:5173`
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

## Frontend Development

The dashboard is a Vite + React app in `frontend/`. Observability charts are rendered with Recharts and are derived from the live `GET /jobs` API response.

Run it through Docker Compose with the full stack:

```bash
docker compose up --build
```

Open:

```text
http://localhost:5173
```

For direct local frontend development:

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

The dashboard uses live API responses only. If the backend is unreachable, it shows an explicit error state instead of fabricated data.

## Configuration

The backend and worker read Redis connection settings from environment variables:

- `REDIS_HOST`
- `REDIS_PORT`

Docker Compose sets these to `redis` and `6379` for container-to-container networking.

The frontend reads the backend URL from:

- `VITE_API_URL`

Docker Compose sets this to `http://localhost:8000` so browser requests go to the API exposed on the host.
