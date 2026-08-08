from __future__ import annotations

import logging
import os
from typing import Any

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class WhatsAppClient:
    """
    Stub / thin Meta Cloud API client for outbound WhatsApp messages.
    Logs and no-ops when META credentials are missing.
    """

    def __init__(self) -> None:
        self.token = getattr(settings, 'META_WHATSAPP_TOKEN', '') or os.environ.get(
            'META_WHATSAPP_TOKEN', ''
        )
        self.phone_number_id = getattr(
            settings, 'META_PHONE_NUMBER_ID', ''
        ) or os.environ.get('META_PHONE_NUMBER_ID', '')
        self.api_version = getattr(settings, 'META_API_VERSION', 'v21.0')

    @property
    def _configured(self) -> bool:
        return bool(self.token and self.phone_number_id)

    def send_text(self, to: str, body: str) -> dict[str, Any]:
        """
        Send a plain-text WhatsApp message.
        `to` should be E.164 without spaces (e.g. +573001234567).
        """
        if not to:
            logger.warning('whatsapp.send_text.skip', extra={'reason': 'empty_to'})
            return {'status': 'skipped', 'reason': 'empty_to'}

        if not self._configured:
            logger.info(
                'whatsapp.send_text.noop',
                extra={'to': to[-4:] if len(to) >= 4 else to, 'body_len': len(body)},
            )
            return {'status': 'noop', 'to': to}

        url = (
            f'https://graph.facebook.com/{self.api_version}/'
            f'{self.phone_number_id}/messages'
        )
        payload = {
            'messaging_product': 'whatsapp',
            'to': to.lstrip('+'),
            'type': 'text',
            'text': {'body': body},
        }
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
        }
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()
            logger.info(
                'whatsapp.send_text.done',
                extra={'to': to[-4:], 'message_id': data.get('messages', [{}])[0].get('id')},
            )
            return {'status': 'sent', 'response': data}
        except Exception:
            logger.exception('whatsapp.send_text.error', extra={'to': to[-4:]})
            raise
