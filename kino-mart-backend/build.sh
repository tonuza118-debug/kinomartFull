#!/usr/bin/env bash
# Render build command. Set this repo's "Build Command" to: ./build.sh
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
