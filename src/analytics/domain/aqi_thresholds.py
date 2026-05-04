from __future__ import annotations


class AqiThresholds:
    """
    Umbrales de calidad del aire hardcodeados basados en guias OMS 2021.
    Usados por el caso de uso get_zone_health para clasificar el veredicto.
    Unidades: ug/m3 para PM, ppm para CO2, indice para VOC/NOx.
    """

    PM2_5_GOOD       = 15.0   # por debajo: bueno
    PM2_5_MODERATE   = 45.0   # por debajo: moderado; por encima: malo

    PM10_GOOD        = 45.0
    PM10_MODERATE    = 100.0

    CO2_GOOD         = 1000.0
    CO2_MODERATE     = 2000.0

    VOC_GOOD         = 150.0
    VOC_MODERATE     = 300.0

    @classmethod
    def classify(cls, variable_code: str, avg_value: float) -> str:
        """
        Clasifica un valor promedio como 'good', 'moderate' o 'poor'
        segun la variable observada. Retorna 'unknown' si la variable
        no tiene umbral definido.
        """
        code = variable_code.upper()
        if code == "PM2_5":
            if avg_value <= cls.PM2_5_GOOD:
                return "good"
            if avg_value <= cls.PM2_5_MODERATE:
                return "moderate"
            return "poor"
        if code == "PM10":
            if avg_value <= cls.PM10_GOOD:
                return "good"
            if avg_value <= cls.PM10_MODERATE:
                return "moderate"
            return "poor"
        if code == "CO2":
            if avg_value <= cls.CO2_GOOD:
                return "good"
            if avg_value <= cls.CO2_MODERATE:
                return "moderate"
            return "poor"
        if code == "VOC_INDEX":
            if avg_value <= cls.VOC_GOOD:
                return "good"
            if avg_value <= cls.VOC_MODERATE:
                return "moderate"
            return "poor"
        return "unknown"
