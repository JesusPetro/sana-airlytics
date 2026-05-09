from __future__ import annotations


class AqiThresholds:
    """
    Umbrales de calidad del aire hardcodeados basados en guias OMS 2021.
    Usados por el caso de uso get_zone_health para clasificar el veredicto.
    Unidades: ug/m3 para PM, ppm para CO2, indice para VOC/NOx.
    """

    PM2_5_GOOD       = 15.0   # por debajo: bueno
    PM2_5_MODERATE   = 37.0   # por debajo: moderado; por encima: malo

    PM10_GOOD        = 45.0
    PM10_MODERATE    = 75.0

    CO2_GOOD         = 1000.0
    CO2_MODERATE     = 2000.0

    VOC_GOOD         = 150.0
    VOC_MODERATE     = 300.0

    _THRESHOLDS: dict[str, tuple[float, float]] = {
        "PM2_5":     (PM2_5_GOOD,   PM2_5_MODERATE),
        "PM10":      (PM10_GOOD,    PM10_MODERATE),
        "CO2":       (CO2_GOOD,     CO2_MODERATE),
        "VOC_INDEX": (VOC_GOOD,     VOC_MODERATE),
    }

    @classmethod
    def classify(cls, variable_code: str, avg_value: float) -> str:
        """
        Clasifica un valor promedio segun los umbrales OMS 2021.
        Retorna 'unknown' si la variable no tiene umbral definido.
        La logica de clasificacion existe una sola vez — la tabla
        _THRESHOLDS es el unico punto de configuracion.
        """
        thresholds = cls._THRESHOLDS.get(variable_code.upper())
        if thresholds is None:
            return "unknown"
        good_limit, moderate_limit = thresholds
        if avg_value <= good_limit:
            return "good"
        if avg_value <= moderate_limit:
            return "moderate"
        return "poor"
