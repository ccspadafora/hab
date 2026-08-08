from django.urls import path

from apps.auth_propietarios.views import (
    LoginPropietarioView,
    RegistroPropietarioView,
    SolicitarOTPView,
    VerificarOTPView,
)

urlpatterns = [
    path('registro/', RegistroPropietarioView.as_view(), name='mp-auth-prop-registro'),
    path('login/', LoginPropietarioView.as_view(), name='mp-auth-prop-login'),
    path('otp/solicitar/', SolicitarOTPView.as_view(), name='mp-auth-prop-otp-solicitar'),
    path('otp/verificar/', VerificarOTPView.as_view(), name='mp-auth-prop-otp-verificar'),
]
