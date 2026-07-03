from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('auth/',              include('apps.accounts.urls.auth')),
        path('users/',             include('apps.accounts.urls.users')),
        path('scraping/',          include('apps.scraping.urls')),
        path('predios/',           include('apps.scraping.urls_predios')),
        path('viabilidad/',        include('apps.viabilidad.urls')),
        path('leads/',             include('apps.leads.urls')),
        path('propietarios/',      include('apps.leads.urls_propietarios')),
        path('bot/',               include('apps.bot.urls')),
        path('conversaciones/',    include('apps.bot.urls_conversaciones')),
        path('proyectos/',         include('apps.proyectos.urls')),
        path('estructuraciones/',  include('apps.proyectos.urls_estructuraciones')),
        path('dashboard/',         include('apps.dashboard.urls')),
        path('config/',            include('apps.configuracion.urls')),
        path('ia/',                include('apps.ia.urls')),
        path('tasks/',             include('shared.urls_tasks')),
    ])),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
