from django.urls import path

from .views import (
    AdminMarketplaceDashboardView,
    AdminPublicacionesPendientesView,
    AdminSolicitudesView,
)

urlpatterns = [
    path('dashboard/', AdminMarketplaceDashboardView.as_view(), name='mp-admin-dashboard'),
    path('publicaciones/pendientes/', AdminPublicacionesPendientesView.as_view(), name='mp-admin-pubs'),
    path('solicitudes/', AdminSolicitudesView.as_view(), name='mp-admin-solicitudes'),
]
