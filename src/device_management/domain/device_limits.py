from __future__ import annotations


class DeviceConfigLimits:
    """
    Límites operativos de configuración para devices SANA.
    Fuente: restricciones de diseño del sistema (frecuencia de red, batería, broker).
    """

    SAMPLING_INTERVAL_MIN_SECONDS: int = 30
    SAMPLING_INTERVAL_DEFAULT_SECONDS: int = 60

    TRANSMISSION_INTERVAL_MIN_SECONDS: int = 150
    TRANSMISSION_INTERVAL_DEFAULT_SECONDS: int = 300
