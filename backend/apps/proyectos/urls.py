from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProyectoViewSet

router = DefaultRouter()
router.register('', ProyectoViewSet, basename='proyecto')

urlpatterns = [path('', include(router.urls))]
