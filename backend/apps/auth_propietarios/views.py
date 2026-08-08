from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth_propietarios.serializers import (
    LoginPropietarioSerializer,
    RegistroPropietarioSerializer,
    SolicitarOTPSerializer,
    VerificarOTPSerializer,
)
from apps.auth_propietarios.services.auth_service import AuthPropietarioService


class RegistroPropietarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroPropietarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = AuthPropietarioService().registrar(
            nombre=data['nombre'],
            telefono=data['telefono'],
            password=data['password'],
            email=data.get('email') or '',
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)

        body = {
            'status': 'registered',
            'portal_user_id': result['portal_user_id'],
            'propietario_id': result['propietario_id'],
            'expires': result['expires'],
        }
        if 'debug_otp' in result:
            body['debug_otp'] = result['debug_otp']
        return Response(body, status=status.HTTP_201_CREATED)


class LoginPropietarioView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginPropietarioSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthPropietarioService().login(
            serializer.validated_data['telefono'],
            serializer.validated_data['password'],
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'status': 'ok',
            'access': result['access'],
            'portal_user_id': result['portal_user_id'],
            'propietario_id': result['propietario_id'],
        })


class SolicitarOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SolicitarOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthPropietarioService().solicitar_otp(serializer.validated_data['telefono'])
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        body = {'status': 'otp_sent', 'expires': result.get('expires')}
        if 'debug_otp' in result:
            body['debug_otp'] = result['debug_otp']
        return Response(body)


class VerificarOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerificarOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthPropietarioService().verificar_otp(
            serializer.validated_data['telefono'],
            serializer.validated_data['code'],
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'status': 'verified',
            'portal_user_id': result['portal_user_id'],
            'propietario_id': result['propietario_id'],
            'access': result['access'],
        })
