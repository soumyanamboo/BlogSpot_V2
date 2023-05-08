from celery import Celery
from flask import current_app as app

celery = Celery("Application Jobs")

#Create subtask of the task
#that wraps the task execution in the application context, so that it is available

class ContextTask(celery.Task):
    def __call__(self, *args, **kwargs):
        with app.app_context():
            return self.run(*args, **kwargs)