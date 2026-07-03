from django.urls import path
from .views_tasks import TaskStatusView

urlpatterns = [
    path('<str:task_id>/status/', TaskStatusView.as_view(), name='task-status'),
]
