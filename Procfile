web: python manage.py collectstatic --noinput && python manage.py migrate && gunicorn app_studio.wsgi --bind 0.0.0.0:$PORT --log-file -
