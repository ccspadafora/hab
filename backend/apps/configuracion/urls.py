from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConfiguracionSistemaViewSet, ConfiguracionScrapingViewSet, ConfiguracionIAView

router = DefaultRouter()
router.register('sistema',   ConfiguracionSistemaViewSet,  basename='config-sistema')
router.register('scraping',  ConfiguracionScrapingViewSet, basename='config-scraping')

urlpatterns = [
    path('', include(router.urls)),
    path('ia/', ConfiguracionIAView.as_view(), name='config-ia'),
]
