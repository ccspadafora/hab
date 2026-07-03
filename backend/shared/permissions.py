from rest_framework.permissions import BasePermission


PRIVILEGED = ['superadmin', 'admin']


def role_required(allowed_roles):
    """Factory de permisos por rol para usar en ViewSets."""
    # Superadmin y admin siempre incluidos automáticamente
    all_roles = list(set(PRIVILEGED + list(allowed_roles)))

    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            return (
                request.user
                and request.user.is_authenticated
                and request.user.role in all_roles
            )
    return RolePermission


class IsAdmin(role_required(PRIVILEGED)):
    pass


class IsAdminOrGerente(role_required(PRIVILEGED + ['gerente'])):
    pass


class IsAdminOrAnalista(role_required(PRIVILEGED + ['analista', 'estructuracion'])):
    pass


class IsAdminOrAsesor(role_required(PRIVILEGED + ['asesor', 'comercial', 'administrativo'])):
    pass
