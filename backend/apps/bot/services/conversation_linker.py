from django.db.models import Q
from apps.leads.models import Propietario


class ConversationLinker:
    """
    Vincula un número de WhatsApp con un Propietario existente.
    Si no existe, crea un Propietario provisional para enriquecer después.
    """

    @staticmethod
    def vincular_o_crear(wa_phone: str) -> tuple:
        """Retorna (propietario, created)."""
        propietario = Propietario.objects.filter(
            Q(whatsapp_phone=wa_phone) | Q(telefono_principal=wa_phone)
        ).first()

        if propietario:
            return propietario, False

        propietario = Propietario.objects.create(
            nombre=f'Propietario {wa_phone[-4:]}',
            whatsapp_phone=wa_phone,
            telefono_principal=wa_phone,
            fuente_origen='whatsapp_inbound',
        )
        return propietario, True
