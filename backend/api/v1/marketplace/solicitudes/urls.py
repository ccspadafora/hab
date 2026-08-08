from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SolicitudCertificacionViewSet

router = DefaultRouter()
router.register('', SolicitudCertificacionViewSet, basename='mp-solicitudes')

urlpatterns = [
    path('', include(router.urls)),
]
