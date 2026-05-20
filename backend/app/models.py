from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class TaskType(str, Enum):
    TEXT_TRANSFORM = "text_transform"
    FILE_SUMMARY = "file_summary"
    DATA_CLEANUP = "data_cleanup"


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class JobCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    task_type: TaskType
    payload: dict[str, Any] = Field(default_factory=dict)


class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus


class JobResponse(BaseModel):
    job_id: str
    task_type: TaskType
    payload: dict[str, Any]
    status: JobStatus
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    jobs: list[JobResponse]


class HealthResponse(BaseModel):
    status: str
    redis: str


class ErrorResponse(BaseModel):
    detail: str
