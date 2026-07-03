from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FuenteScrapingViewSet, ZonaPOTViewSet

router = DefaultRouter()
router.register('fuentes', FuenteScrapingViewSet, basename='fuente')
router.register('zonas-pot', ZonaPOTViewSet, basename='zona-pot')

urlpatterns = [path('', include(router.urls))]
