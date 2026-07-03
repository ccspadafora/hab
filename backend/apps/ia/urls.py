from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BaseConocimientoIAViewSet, PromptIAViewSet, ConfiguracionAgenteViewSet

router = DefaultRouter()
router.register('conocimiento', BaseConocimientoIAViewSet,   basename='conocimiento-ia')
router.register('prompts',      PromptIAViewSet,             basename='prompt-ia')
router.register('agentes',      ConfiguracionAgenteViewSet,  basename='agente-ia')

urlpatterns = [path('', include(router.urls))]
