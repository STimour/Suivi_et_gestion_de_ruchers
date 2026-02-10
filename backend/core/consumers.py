import re
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer


def _normalize_email(email: str) -> str:
    return (email or '').strip().lower()


def _group_name_for_email(email: str) -> str:
    # Group name must be valid: letters, digits, hyphen, underscore, period
    normalized = _normalize_email(email)
    safe = re.sub(r'[^a-zA-Z0-9_.-]', '_', normalized)
    return f"email_verification_{safe}"[:100]


class EmailVerificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = parse_qs(query_string)
        email = params.get('email', [''])[0]
        email = _normalize_email(email)

        if not email:
            await self.close(code=4001)
            return

        self.group_name = _group_name_for_email(email)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({
            'type': 'connected',
            'email': email,
        })

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def email_verified(self, event):
        await self.send_json({
            'type': 'email_verified',
            'email': event.get('email'),
        })
