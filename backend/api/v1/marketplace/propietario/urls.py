from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PropietarioDashboardView, PropietarioPublicacionViewSet

router = DefaultRouter()
router.register('publicaciones', PropietarioPublicacionViewSet, basename='mp-prop-publicaciones')

urlpatterns = [
    path('dashboard/', PropietarioDashboardView.as_view(), name='mp-prop-dashboard'),
    path('', include(router.urls)),
]
