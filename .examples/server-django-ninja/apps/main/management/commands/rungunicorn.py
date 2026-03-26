from django.core.management.base import BaseCommand
from gunicorn.app.base import BaseApplication
from uvicorn.workers import UvicornWorker

class StandaloneApplication(BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        for key, value in self.options.items():
            self.cfg.set(key, value)

    def load(self):
        return self.application

class Command(BaseCommand):
    help = 'Run Gunicorn server with UVicorn worker and auto-reload'

    def handle(self, *args, **options):
        app = "core.asgi:application"
        options = {
            'bind': '0.0.0.0:9000',
            'worker_class': 'uvicorn.workers.UvicornWorker',
            'reload': True
        }
        StandaloneApplication(app, options).run()
