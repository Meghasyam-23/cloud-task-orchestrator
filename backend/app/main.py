from fastapi import Depends, FastAPI, HTTPException, status
from redis.exceptions import RedisError

from app.job_store import JobNotFoundError, JobStore
from app.models import (
    ErrorResponse,
    HealthResponse,
    JobCreateRequest,
    JobCreateResponse,
    JobListResponse,
    JobResponse,
)
from app.redis_client import RedisConfigError, get_redis_client


app = FastAPI(
    title="Cloud Task Orchestrator API",
    version="0.1.0",
    description="Backend API for queueing asynchronous cloud tasks.",
)


def get_job_store() -> JobStore:
    try:
        return JobStore(get_redis_client())
    except RedisConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis configuration is invalid",
        ) from exc


@app.get(
    "/health",
    response_model=HealthResponse,
    responses={500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
def health_check() -> HealthResponse:
    try:
        get_redis_client().ping()
    except RedisConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis configuration is invalid",
        ) from exc
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Redis is unavailable",
        ) from exc

    return HealthResponse(status="ok", redis="ok")


@app.post(
    "/jobs",
    response_model=JobCreateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
def create_job(
    request: JobCreateRequest,
    store: JobStore = Depends(get_job_store),
) -> JobCreateResponse:
    try:
        job = store.create_job(request)
    except RedisConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis configuration is invalid",
        ) from exc
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to enqueue job",
        ) from exc

    return JobCreateResponse(job_id=job.job_id, status=job.status)


@app.get(
    "/jobs",
    response_model=JobListResponse,
    responses={500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
def list_jobs(store: JobStore = Depends(get_job_store)) -> JobListResponse:
    try:
        jobs = store.list_jobs()
    except RedisConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis configuration is invalid",
        ) from exc
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve jobs",
        ) from exc

    return JobListResponse(jobs=jobs)


@app.get(
    "/jobs/{job_id}",
    response_model=JobResponse,
    responses={
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
def get_job(job_id: str, store: JobStore = Depends(get_job_store)) -> JobResponse:
    try:
        return store.get_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        ) from exc
    except RedisConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis configuration is invalid",
        ) from exc
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to retrieve job",
        ) from exc
