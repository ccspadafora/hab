from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth_constructoras.serializers import (
    ConstructoraLoginSerializer,
    ConstructoraOTPSerializer,
)
from apps.auth_constructoras.services.auth_service import AuthConstructoraService


class ConstructoraLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConstructoraLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthConstructoraService().login(
            serializer.validated_data['email'],
            serializer.validated_data['password'],
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'status': 'ok',
            'access': result['access'],
            'portal_user_id': result['portal_user_id'],
            'constructora_id': result['constructora_id'],
            'perfil_id': result.get('perfil_id'),
            'email': result['email'],
        })


class ConstructoraSolicitarOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConstructoraOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = AuthConstructoraService().solicitar_otp(
            serializer.validated_data['telefono'],
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        body = {'status': 'otp_sent', 'expires': result.get('expires')}
        if 'debug_otp' in result:
            body['debug_otp'] = result['debug_otp']
        return Response(body)


class ConstructoraVerificarOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConstructoraOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data.get('code')
        if not code:
            return Response(
                {'error': 'code requerido'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = AuthConstructoraService().verificar_otp(
            serializer.validated_data['telefono'],
            code,
        )
        if not result.get('ok'):
            return Response({'error': result.get('error')}, status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'status': 'verified',
            'access': result['access'],
            'portal_user_id': result['portal_user_id'],
            'constructora_id': result['constructora_id'],
            'perfil_id': result.get('perfil_id'),
        })
