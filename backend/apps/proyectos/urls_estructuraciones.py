from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EstructuracionProyectoViewSet

router = DefaultRouter()
router.register('', EstructuracionProyectoViewSet, basename='estructuracion')

urlpatterns = [path('', include(router.urls))]
