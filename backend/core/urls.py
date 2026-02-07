from django.urls import path

from core import auth_views, entreprise_views

urlpatterns = [
    path('auth/register', auth_views.register, name='auth-register'),
    path('auth/login', auth_views.login, name='auth-login'),
    path('auth/logout', auth_views.logout, name='auth-logout'),
    path('auth/me', auth_views.me, name='auth-me'),
    path('auth/accept-invitation', auth_views.accept_invitation, name='auth-accept-invitation'),
    path('auth/switch-entreprise', auth_views.switch_entreprise, name='auth-switch-entreprise'),
    path('entreprise', entreprise_views.create_entreprise, name='entreprise-create'),
    path('entreprise/invitation', entreprise_views.create_invitation, name='entreprise-invitation'),
    path('entreprises/<uuid:entreprise_id>/checkout/premium', entreprise_views.create_premium_checkout, name='entreprise-checkout-premium'),
    path('stripe/webhook', entreprise_views.stripe_webhook, name='stripe-webhook'),
]
