release: python manage.py migrate && python manage.py collectstatic --noinput
web: gunicorn app_studio.wsgi --log-file -
