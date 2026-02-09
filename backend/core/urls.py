from django.urls import path

from core import auth_views, entreprise_views, iot_views, notification_views

urlpatterns = [
    path('auth/register', auth_views.register, name='auth-register'),
    path('auth/login', auth_views.login, name='auth-login'),
    path('auth/logout', auth_views.logout, name='auth-logout'),
    path('auth/me', auth_views.me, name='auth-me'),
    path('auth/accept-invitation', auth_views.accept_invitation, name='auth-accept-invitation'),
    path('auth/switch-entreprise', auth_views.switch_entreprise, name='auth-switch-entreprise'),
    path('auth/current-entreprise', auth_views.current_entreprise, name='auth-current-entreprise'),
    path('entreprise', entreprise_views.create_entreprise, name='entreprise-create'),
    path('entreprise/invitation', entreprise_views.create_invitation, name='entreprise-invitation'),
    path('entreprises/<uuid:entreprise_id>/checkout/premium', entreprise_views.create_premium_checkout, name='entreprise-checkout-premium'),
    path('entreprises/<uuid:entreprise_id>/offre', entreprise_views.update_entreprise_offre, name='entreprise-update-offre'),
    path('entreprises/<uuid:entreprise_id>/profiles', entreprise_views.update_entreprise_profiles, name='entreprise-update-profiles'),
    path('entreprises/<uuid:entreprise_id>/offre/status', entreprise_views.get_entreprise_offre_status, name='entreprise-offre-status'),
    path('profiles', entreprise_views.list_type_profiles, name='profiles-list'),
    path('stripe/webhook', entreprise_views.stripe_webhook, name='stripe-webhook'),
    path('capteurs/associate', iot_views.associate_capteur, name='capteurs-associate'),
    path('capteurs', iot_views.list_capteurs, name='capteurs-list'),
    path('capteurs/<uuid:capteur_id>', iot_views.update_capteur, name='capteurs-update'),
    path('capteurs/<uuid:capteur_id>/delete', iot_views.delete_capteur, name='capteurs-delete'),
    path('webhooks/intervention-created', notification_views.webhook_intervention_created, name='webhook-intervention-created'),
    path('webhooks/daily-notifications', notification_views.webhook_daily_notifications, name='webhook-daily-notifications'),
]
