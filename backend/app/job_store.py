import json
from datetime import UTC, datetime
from uuid import uuid4

import redis

from app.models import JobCreateRequest, JobResponse, JobStatus, TaskType


JOB_QUEUE_NAME = "job_queue"
JOB_INDEX_NAME = "jobs:index"
JOB_KEY_PREFIX = "job:"


class JobNotFoundError(Exception):
    pass


class JobStore:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def create_job(self, request: JobCreateRequest) -> JobResponse:
        job_id = str(uuid4())
        now = datetime.now(UTC)
        job = JobResponse(
            job_id=job_id,
            task_type=request.task_type,
            payload=request.payload,
            status=JobStatus.QUEUED,
            created_at=now,
            updated_at=now,
        )

        key = self._job_key(job_id)
        serialized = self._serialize_job(job)

        # Store the job and enqueue its id atomically so workers never see a missing job.
        with self.redis.pipeline(transaction=True) as pipe:
            pipe.hset(key, mapping=serialized)
            pipe.rpush(JOB_INDEX_NAME, job_id)
            pipe.rpush(JOB_QUEUE_NAME, job_id)
            pipe.execute()

        return job

    def list_jobs(self) -> list[JobResponse]:
        job_ids = self.redis.lrange(JOB_INDEX_NAME, 0, -1)
        jobs: list[JobResponse] = []

        for job_id in job_ids:
            job_data = self.redis.hgetall(self._job_key(job_id))
            if job_data:
                jobs.append(self._deserialize_job(job_data))

        return jobs

    def get_job(self, job_id: str) -> JobResponse:
        job_data = self.redis.hgetall(self._job_key(job_id))
        if not job_data:
            raise JobNotFoundError(f"Job '{job_id}' was not found")

        return self._deserialize_job(job_data)

    def _job_key(self, job_id: str) -> str:
        return f"{JOB_KEY_PREFIX}{job_id}"

    def _serialize_job(self, job: JobResponse) -> dict[str, str]:
        return {
            "job_id": job.job_id,
            "task_type": job.task_type.value,
            "payload": json.dumps(job.payload),
            "status": job.status.value,
            "created_at": job.created_at.isoformat(),
            "updated_at": job.updated_at.isoformat(),
        }

    def _deserialize_job(self, data: dict[str, str]) -> JobResponse:
        return JobResponse(
            job_id=data["job_id"],
            task_type=TaskType(data["task_type"]),
            payload=json.loads(data["payload"]),
            status=JobStatus(data["status"]),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )
