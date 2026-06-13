import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("wedding.http")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s → %d  (%.1f ms)  ip=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
            request.client.host if request.client else "?",
        )
        return response
