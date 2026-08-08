from django.urls import path

from apps.auth_constructoras.views import (
    ConstructoraLoginView,
    ConstructoraSolicitarOTPView,
    ConstructoraVerificarOTPView,
)

urlpatterns = [
    path('login/', ConstructoraLoginView.as_view(), name='mp-auth-const-login'),
    path('otp/solicitar/', ConstructoraSolicitarOTPView.as_view(), name='mp-auth-const-otp-solicitar'),
    path('otp/verificar/', ConstructoraVerificarOTPView.as_view(), name='mp-auth-const-otp-verificar'),
]
