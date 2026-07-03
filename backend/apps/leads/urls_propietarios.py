from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropietarioViewSet

router = DefaultRouter()
router.register('', PropietarioViewSet, basename='propietario')

urlpatterns = [path('', include(router.urls))]
