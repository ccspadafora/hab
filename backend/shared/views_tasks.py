from rest_framework.views import APIView
from rest_framework.response import Response
from celery.result import AsyncResult


class TaskStatusView(APIView):
    def get(self, request, task_id):
        result = AsyncResult(task_id)
        return Response({
            'task_id': task_id,
            'status':  result.status,
            'result':  result.result if result.ready() else None,
        })
