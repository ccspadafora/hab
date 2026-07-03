from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversacionViewSet

router = DefaultRouter()
router.register('', ConversacionViewSet, basename='conversacion')

urlpatterns = [path('', include(router.urls))]
