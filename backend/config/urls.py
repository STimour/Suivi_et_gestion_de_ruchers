from django.contrib import admin
from django.urls import include, path

from core import swagger_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('swagger/', swagger_views.swagger_ui, name='swagger-ui'),
    path('swagger/openapi.json', swagger_views.openapi_json, name='swagger-openapi'),
]
