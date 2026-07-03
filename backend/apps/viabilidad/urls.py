from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnalisisViabilidadViewSet

router = DefaultRouter()
router.register('', AnalisisViabilidadViewSet, basename='analisis-viabilidad')

urlpatterns = [path('', include(router.urls))]
