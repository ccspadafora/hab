from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from apps.accounts.views import UserViewSet, PermisoModuloView

urlpatterns = [
    path('login/',   TokenObtainPairView.as_view(),           name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(),               name='auth-refresh'),
    path('logout/',  TokenBlacklistView.as_view(),             name='auth-logout'),
    path('me/',      UserViewSet.as_view({'get': 'me'}),       name='auth-me'),
    path('permisos/',              PermisoModuloView.as_view(), name='permisos-list'),
    path('permisos/<str:role>/',   PermisoModuloView.as_view(), name='permisos-role'),
]
