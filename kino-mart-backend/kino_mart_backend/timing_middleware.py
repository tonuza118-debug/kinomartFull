import time

from django.conf import settings
from django.db import connection


class RequestTimingMiddleware:
    """DEBUG-only: logs how long each request took and how many DB queries it
    ran, straight to the runserver console. Not used in production (only
    wired in when DJANGO_DEBUG=True) — just a way to see where local dev lag
    is actually coming from instead of guessing.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.monotonic()
        queries_before = len(connection.queries)
        response = self.get_response(request)
        duration_ms = (time.monotonic() - start) * 1000
        query_count = len(connection.queries) - queries_before
        query_time_ms = sum(float(q['time']) for q in connection.queries[queries_before:]) * 1000

        if settings.DEBUG:
            print(
                f'[timing] {request.method} {request.path} -> '
                f'{duration_ms:.0f}ms total | {query_count} queries ({query_time_ms:.0f}ms) | '
                f'{duration_ms - query_time_ms:.0f}ms app/network overhead'
            )
        return response
