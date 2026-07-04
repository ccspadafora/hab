from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .models import PermisoModulo, ROLE_CHOICES, MODULO_CHOICES
from .serializers import UserSerializer, UserCreateSerializer, PermisoModuloSerializer
from shared.permissions import IsAdmin

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        # Incluye permisos del rol del usuario
        data = UserSerializer(request.user).data
        data['permisos'] = PermisoModulo.para_role(request.user.role)
        return Response(data)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        password = request.data.get('password', '')
        if len(password) < 8:
            return Response({'error': 'Mínimo 8 caracteres'}, status=400)
        user.set_password(password)
        user.save()
        return Response({'status': 'contraseña actualizada'})

    @action(detail=True, methods=['patch'])
    def toggle_activo(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({'is_active': user.is_active})


class PermisoModuloView(APIView):
    """
    GET  /accounts/permisos/          → todos los permisos agrupados por rol
    POST /accounts/permisos/          → crear/actualizar permiso individual
    GET  /accounts/permisos/{role}/   → permisos de un rol específico
    POST /accounts/permisos/reset/    → restaurar permisos por defecto
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, role=None):
        if role:
            permisos = PermisoModulo.objects.filter(role=role)
            return Response(PermisoModuloSerializer(permisos, many=True).data)
        # Todos los permisos agrupados + metadata de roles y módulos
        todos = PermisoModulo.objects.all()
        return Response({
            'permisos': PermisoModuloSerializer(todos, many=True).data,
            'roles': [{'key': r[0], 'label': r[1]} for r in ROLE_CHOICES],
            'modulos': [{'key': m[0], 'label': m[1]} for m in MODULO_CHOICES],
        })

    def post(self, request, role=None):
        action = request.data.get('action')
        if action == 'reset':
            PermisoModulo.seed_defaults()
            return Response({'status': 'permisos restaurados a valores por defecto'})

        # Actualizar permiso individual
        role_val   = request.data.get('role')
        modulo_val = request.data.get('modulo')
        puede_ver  = request.data.get('puede_ver', False)
        puede_edit = request.data.get('puede_editar', False)
        if not role_val or not modulo_val:
            return Response({'error': 'role y modulo son requeridos'}, status=400)
        p, _ = PermisoModulo.objects.update_or_create(
            role=role_val, modulo=modulo_val,
            defaults={'puede_ver': puede_ver, 'puede_editar': puede_edit},
        )
        return Response(PermisoModuloSerializer(p).data)

    def patch(self, request, role=None):
        """Actualización masiva: recibe lista de permisos."""
        items = request.data.get('permisos', [])
        for item in items:
            PermisoModulo.objects.update_or_create(
                role=item['role'], modulo=item['modulo'],
                defaults={'puede_ver': item.get('puede_ver', False),
                          'puede_editar': item.get('puede_editar', False)},
            )
        return Response({'status': 'ok', 'updated': len(items)})
