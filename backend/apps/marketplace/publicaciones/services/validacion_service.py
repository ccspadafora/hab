from __future__ import annotations

from typing import Any


class ValidacionPublicacionService:
    """Validaciones de dominio para publicaciones marketplace."""

    CAMPOS_REQUERIDOS = (
        'tipo', 'direccion', 'barrio', 'localidad', 'area_lote', 'estrato',
    )

    def validar_borrador(self, data: dict[str, Any]) -> list[str]:
        errores: list[str] = []
        for campo in self.CAMPOS_REQUERIDOS:
            if data.get(campo) in (None, ''):
                errores.append(f'Campo requerido: {campo}')
        estrato = data.get('estrato')
        if estrato is not None and not (1 <= int(estrato) <= 6):
            errores.append('Estrato debe estar entre 1 y 6')
        return errores

    def puede_enviar_a_revision(self, publicacion: Any) -> tuple[bool, str]:
        if publicacion.estado != 'borrador':
            return False, 'Solo borradores pueden enviarse a revisión'
        if not publicacion.area_lote or not publicacion.estrato:
            return False, 'Área de lote y estrato son obligatorios'
        return True, ''
