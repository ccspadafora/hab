from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ConstructoraMatchViewSet, ConstructoraPerfilView

router = DefaultRouter()
router.register('matches', ConstructoraMatchViewSet, basename='mp-const-matches')

urlpatterns = [
    path('perfil/', ConstructoraPerfilView.as_view(), name='mp-const-perfil'),
    path('', include(router.urls)),
]
