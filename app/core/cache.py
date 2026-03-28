import hashlib
import json
import os
from functools import wraps

import redis
from fastapi.encoders import jsonable_encoder

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
_CACHE = None


def get_redis_client():
    global _CACHE
    if _CACHE is not None:
        return _CACHE
    try:
        client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        client.ping()
        _CACHE = client
        return client
    except Exception:
        _CACHE = False
        return None


def get_json(key: str):
    client = get_redis_client()
    if not client:
        return None
    payload = client.get(key)
    return json.loads(payload) if payload else None


def set_json(key: str, value, ex: int = 120):
    client = get_redis_client()
    if not client:
        return False
    client.set(key, json.dumps(jsonable_encoder(value), ensure_ascii=False), ex=ex)
    return True


def invalidate_prefix(prefix: str):
    client = get_redis_client()
    if not client:
        return 0
    keys = list(client.scan_iter(match=f'{prefix}*'))
    if keys:
        client.delete(*keys)
    return len(keys)


def cache_key(prefix: str, *parts) -> str:
    digest = hashlib.md5(':'.join(map(str, parts)).encode('utf-8')).hexdigest()
    return f'{prefix}:{digest}'


def cached(prefix: str, ttl: int = 120, key_builder=None):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if key_builder:
                key = key_builder(*args, **kwargs)
            else:
                key = cache_key(prefix, func.__name__, kwargs)
            cached_value = get_json(key)
            if cached_value is not None:
                return cached_value
            result = func(*args, **kwargs)
            set_json(key, result, ex=ttl)
            return result

        return wrapper

    return decorator
