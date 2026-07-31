#!/usr/bin/env python
"""
Quick connectivity check for the Neon DB and Cloudflare R2 bucket.
Run this from the kino-mart-backend/ folder, with your real .env in place:

    pip install -r requirements.txt
    python test_connections.py

(Can't be run from Claude's sandbox — Neon and R2 aren't reachable from
there, only from your own machine or from Render once deployed.)
"""
import os
import sys

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kino_mart_backend.settings')
django.setup()

from django.conf import settings
from django.db import connection

ok = True

print('--- Database (Neon) ---')
try:
    with connection.cursor() as c:
        c.execute('SELECT version();')
        print('OK:', c.fetchone()[0])
except Exception as e:
    ok = False
    print('FAILED:', type(e).__name__, e)

print('\n--- Storage (Cloudflare R2) ---')
try:
    import boto3

    client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name='auto',
    )
    resp = client.list_objects_v2(Bucket=settings.AWS_STORAGE_BUCKET_NAME, MaxKeys=1)
    print(f'OK: bucket "{settings.AWS_STORAGE_BUCKET_NAME}" reachable, '
          f'{resp.get("KeyCount", 0)} object(s) sampled')

    # round-trip: upload a tiny test file, confirm it's there, clean up
    key = '_connection_test.txt'
    client.put_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key, Body=b'ok')
    client.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
    client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
    print('OK: put/head/delete round-trip succeeded')
except Exception as e:
    ok = False
    print('FAILED:', type(e).__name__, e)

sys.exit(0 if ok else 1)
