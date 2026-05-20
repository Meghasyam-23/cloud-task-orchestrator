import os
from functools import lru_cache

import redis


class RedisConfigError(ValueError):
    pass


@lru_cache(maxsize=1)
def get_redis_client() -> redis.Redis:
    host = os.getenv("REDIS_HOST", "localhost")
    port = _get_redis_port()

    return redis.Redis(
        host=host,
        port=port,
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
    )


def _get_redis_port() -> int:
    value = os.getenv("REDIS_PORT", "6379")
    try:
        return int(value)
    except ValueError as exc:
        raise RedisConfigError("REDIS_PORT must be an integer") from exc
