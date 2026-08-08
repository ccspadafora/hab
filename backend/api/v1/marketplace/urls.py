from django.urls import path, include

urlpatterns = [
    # Auth endpoints (public — no token required)
    path('auth/propietario/', include('api.v1.marketplace.auth_propietarios.urls')),
    path('auth/constructora/', include('api.v1.marketplace.auth_constructoras.urls')),

    # Propietario endpoints
    path('propietario/', include('api.v1.marketplace.propietario.urls')),

    # Constructora endpoints
    path('constructoras/solicitud/', include('api.v1.marketplace.solicitudes.urls')),
    path('constructora/', include('api.v1.marketplace.constructora.urls')),
    path('proyectos/', include('api.v1.marketplace.catalogo.urls')),

    # HAB internal marketplace endpoints
    path('admin/', include('api.v1.marketplace.admin.urls')),
]
