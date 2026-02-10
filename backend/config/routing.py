from django.urls import path

from core import consumers

websocket_urlpatterns = [
    path('ws/email-verification', consumers.EmailVerificationConsumer.as_asgi()),
]
