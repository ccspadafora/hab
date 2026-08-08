from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CatalogoProyectosViewSet

router = DefaultRouter()
router.register('', CatalogoProyectosViewSet, basename='mp-catalogo')

urlpatterns = [
    path('', include(router.urls)),
]
