import json
import logging
import os
import re
import signal
import sys
from datetime import UTC, datetime
from typing import Any

import redis
from redis.exceptions import RedisError


JOB_QUEUE_NAME = "job_queue"
PROCESSING_QUEUE_NAME = "job_queue:processing"
JOB_KEY_PREFIX = "job:"
SUPPORTED_TASK_TYPES = {"text_transform", "data_cleanup", "file_summary"}

logger = logging.getLogger("cloud-task-worker")
shutdown_requested = False


class JobProcessingError(Exception):
    pass


class JobMetadataNotFoundError(JobProcessingError):
    pass


class RedisConfigError(ValueError):
    pass


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        for key in ("job_id", "task_type", "retry_count", "error", "signal"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload)


def configure_logging() -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonLogFormatter())

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO"))


def get_redis_client() -> redis.Redis:
    host = os.getenv("REDIS_HOST", "localhost")
    port = get_redis_port()

    return redis.Redis(
        host=host,
        port=port,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=10,
        health_check_interval=30,
    )


def get_redis_port() -> int:
    value = os.getenv("REDIS_PORT", "6379")
    try:
        return int(value)
    except ValueError as exc:
        raise RedisConfigError("REDIS_PORT must be an integer") from exc


def handle_shutdown(signum: int, _frame: object) -> None:
    global shutdown_requested
    shutdown_requested = True
    logger.info("shutdown_requested", extra={"signal": signum})


def job_key(job_id: str) -> str:
    return f"{JOB_KEY_PREFIX}{job_id}"


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def load_job(redis_client: redis.Redis, job_id: str) -> dict[str, str]:
    job = redis_client.hgetall(job_key(job_id))
    if not job:
        raise JobMetadataNotFoundError("job metadata not found")

    return job


def mark_running(redis_client: redis.Redis, job_id: str, job: dict[str, str]) -> int:
    retry_count = parse_retry_count(job) + 1
    redis_client.hset(
        job_key(job_id),
        mapping={
            "status": "RUNNING",
            "retry_count": str(retry_count),
            "updated_at": utc_now(),
            "error": "",
        },
    )
    return retry_count


def parse_retry_count(job: dict[str, str]) -> int:
    try:
        return int(job.get("retry_count", "0"))
    except ValueError:
        return 0


def mark_completed(redis_client: redis.Redis, job_id: str, result: dict[str, Any]) -> None:
    redis_client.hset(
        job_key(job_id),
        mapping={
            "status": "COMPLETED",
            "result": json.dumps(result),
            "error": "",
            "updated_at": utc_now(),
        },
    )


def mark_failed(redis_client: redis.Redis, job_id: str, error_message: str) -> None:
    redis_client.hset(
        job_key(job_id),
        mapping={
            "status": "FAILED",
            "error": error_message,
            "updated_at": utc_now(),
        },
    )


def acknowledge_job(redis_client: redis.Redis, job_id: str) -> None:
    redis_client.lrem(PROCESSING_QUEUE_NAME, 1, job_id)


def parse_payload(job: dict[str, str]) -> dict[str, Any]:
    try:
        payload = json.loads(job.get("payload", "{}"))
    except json.JSONDecodeError as exc:
        raise JobProcessingError("payload is not valid JSON") from exc

    if not isinstance(payload, dict):
        raise JobProcessingError("payload must be a JSON object")

    return payload


def process_job(job: dict[str, str]) -> dict[str, Any]:
    task_type = job.get("task_type")
    if task_type not in SUPPORTED_TASK_TYPES:
        raise JobProcessingError(f"unsupported task_type '{task_type}'")

    payload = parse_payload(job)

    if task_type == "text_transform":
        return process_text_transform(payload)
    if task_type == "data_cleanup":
        return process_data_cleanup(payload)
    if task_type == "file_summary":
        return process_file_summary(payload)

    raise JobProcessingError(f"unsupported task_type '{task_type}'")


def process_text_transform(payload: dict[str, Any]) -> dict[str, Any]:
    text = payload.get("text")
    if not isinstance(text, str):
        raise JobProcessingError("text_transform payload requires a string 'text' field")

    return {
        "uppercase_text": text.upper(),
        "reversed_text": text[::-1],
        "word_count": len(re.findall(r"\b\w+\b", text)),
    }


def process_data_cleanup(payload: dict[str, Any]) -> dict[str, Any]:
    return {"cleaned_payload": remove_empty_values(payload)}


def remove_empty_values(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: cleaned
            for key, item in value.items()
            if (cleaned := remove_empty_values(item)) not in (None, "", [])
        }

    if isinstance(value, list):
        return [
            cleaned
            for item in value
            if (cleaned := remove_empty_values(item)) not in (None, "", [])
        ]

    return value


def process_file_summary(payload: dict[str, Any]) -> dict[str, Any]:
    text = payload.get("text")
    if not isinstance(text, str):
        raise JobProcessingError("file_summary payload requires a string 'text' field")

    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+", text.strip())
        if sentence.strip()
    ]
    selected_sentences = sentences[:3]
    summary = " ".join(selected_sentences) if selected_sentences else text.strip()

    return {
        "summary": summary,
        "sentence_count": len(sentences),
        "word_count": len(re.findall(r"\b\w+\b", text)),
    }


def process_job_id(redis_client: redis.Redis, job_id: str) -> None:
    try:
        job = load_job(redis_client, job_id)
        retry_count = mark_running(redis_client, job_id, job)
        logger.info(
            "job_started",
            extra={
                "job_id": job_id,
                "task_type": job.get("task_type"),
                "retry_count": retry_count,
            },
        )

        result = process_job(job)
        mark_completed(redis_client, job_id, result)
        logger.info("job_completed", extra={"job_id": job_id})
    except JobMetadataNotFoundError as exc:
        logger.warning("job_metadata_missing", extra={"job_id": job_id, "error": str(exc)})
    except Exception as exc:
        error_message = str(exc)
        logger.exception("job_failed", extra={"job_id": job_id, "error": error_message})

        try:
            mark_failed(redis_client, job_id, error_message)
        except RedisError:
            logger.exception("job_failed_status_update_error", extra={"job_id": job_id})
    finally:
        try:
            acknowledge_job(redis_client, job_id)
        except RedisError:
            logger.exception("job_acknowledge_error", extra={"job_id": job_id})


def run_worker() -> None:
    configure_logging()
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)

    try:
        redis_client = get_redis_client()
    except RedisConfigError:
        logger.exception("redis_configuration_error")
        raise

    logger.info("worker_started")

    while not shutdown_requested:
        try:
            job_id = redis_client.brpoplpush(
                JOB_QUEUE_NAME,
                PROCESSING_QUEUE_NAME,
                timeout=5,
            )
            if job_id is None:
                continue

            process_job_id(redis_client, job_id)
        except RedisError:
            logger.exception("redis_operation_error")
        except Exception:
            logger.exception("worker_loop_error")

    logger.info("worker_stopped")


if __name__ == "__main__":
    run_worker()
