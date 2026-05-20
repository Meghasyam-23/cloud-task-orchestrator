#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-2}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"

echo "Checking backend health..."
curl --fail --silent --show-error "${API_BASE_URL}/health"
echo

echo "Submitting text_transform job..."
CREATE_RESPONSE="$(
  curl --fail --silent --show-error \
    -X POST "${API_BASE_URL}/jobs" \
    -H "Content-Type: application/json" \
    -d '{"task_type":"text_transform","payload":{"text":"cloud task orchestrator smoke test"}}'
)"
echo "${CREATE_RESPONSE}"

JOB_ID="$(
  CREATE_RESPONSE="${CREATE_RESPONSE}" python3 -c 'import json, os; print(json.loads(os.environ["CREATE_RESPONSE"])["job_id"])'
)"

echo "Polling job list for job ${JOB_ID}..."

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  JOBS_RESPONSE="$(curl --fail --silent --show-error "${API_BASE_URL}/jobs")"
  FINAL_JOB="$(
    JOBS_RESPONSE="${JOBS_RESPONSE}" JOB_ID="${JOB_ID}" python3 -c '
import json
import os

jobs = json.loads(os.environ["JOBS_RESPONSE"]).get("jobs", [])
job = next((item for item in jobs if item.get("job_id") == os.environ["JOB_ID"]), None)
if job and job.get("status") in {"COMPLETED", "FAILED"}:
    print(json.dumps(job))
'
  )"

  if [[ -n "${FINAL_JOB}" ]]; then
    echo "Final job result:"
    FINAL_JOB="${FINAL_JOB}" python3 -c '
import json
import os

print(json.dumps(json.loads(os.environ["FINAL_JOB"]), indent=2))
'
    exit 0
  fi

  echo "Attempt ${attempt}/${MAX_ATTEMPTS}: job still pending"
  sleep "${POLL_INTERVAL_SECONDS}"
done

echo "Timed out waiting for job ${JOB_ID} to complete" >&2
exit 1
