# Local Demo Flow

This guide walks through a complete local demo of Cloud Task Orchestrator.

## 1. Start the Stack

```bash
docker compose up --build
```

Wait until all services are healthy:

```bash
docker compose ps
```

Expected services:

- `redis`
- `backend`
- `worker`
- `frontend`

## 2. Open the Dashboard

Open:

```text
http://localhost:5173
```

Point out:

- Health summary cards.
- Submit Job form.
- Queue pipeline.
- Worker insights.
- Jobs table.
- System Snapshot panel.
- Theme toggle.

## 3. Submit a Text Transform Job

In the dashboard:

1. Set task type to `text_transform`.
2. Use a payload like:

```json
{
  "text": "Cloud jobs should be observable and reliable."
}
```

3. Click `Submit job`.

Expected result:

- A new job appears in the table.
- Status moves through `QUEUED` and `RUNNING`.
- The worker marks it `COMPLETED`.
- Selecting the row shows uppercase text, reversed text, and word count.

## 4. Submit a Data Cleanup Job

Use task type `data_cleanup`:

```json
{
  "name": "daily-import",
  "owner": "",
  "tags": ["etl", "", null],
  "metadata": {
    "region": "us-central1",
    "notes": null
  }
}
```

Expected result:

- Empty string, null, and empty list values are removed.
- The cleaned payload appears in the inspector result.

## 5. Submit a File Summary Job

Use task type `file_summary`:

```json
{
  "text": "Cloud Task Orchestrator receives jobs through FastAPI. Redis queues job identifiers. Workers process each job and write results for the dashboard to inspect."
}
```

Expected result:

- A short extractive summary appears in the inspector result.
- Sentence and word counts are included.

## 6. Show Observability

Scroll to the observability section.

Point out:

- Throughput chart uses job timestamps.
- Status donut uses real current job statuses.
- Task breakdown uses real task type counts.
- Architecture card explains the system path.

## 7. Run the Smoke Test

In another terminal:

```bash
./scripts/smoke_test.sh
```

Expected result:

- Health check succeeds.
- A `text_transform` job is submitted.
- The script polls until `COMPLETED` or `FAILED`.
- The final job JSON is printed.

## 8. Show Logs

Backend logs:

```bash
docker compose logs backend
```

Worker logs:

```bash
docker compose logs worker
```

Redis logs:

```bash
docker compose logs redis
```

## 9. Shut Down

```bash
docker compose down
```

## Demo Narrative

Use this short explanation:

"Cloud Task Orchestrator accepts asynchronous jobs through a FastAPI backend. The backend stores metadata in Redis and pushes job IDs onto a Redis queue. Python workers claim jobs, update lifecycle status, process payloads, and write results back to Redis. The React dashboard uses the API to show health, queue state, job details, and observability charts from real job data."
