from __future__ import annotations


class DeviceNotFoundError(Exception):
    """El device solicitado no existe en el sistema."""


class DeviceAlreadyExistsError(Exception):
    """Ya existe un device registrado con ese code."""
