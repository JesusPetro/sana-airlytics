from __future__ import annotations


class AqiThresholds:
    """
    Umbrales de calidad del aire alineados con el frontend (aqi.ts).
    Cada contaminante tiene una lista de (minValue, nivel) en orden ascendente.
    Unidades: ug/m3 para PM, ppm para CO2, indice para VOC/NOx.
    """

    # Lista de (minValue, verdict) — mismos valores que aqi.ts del frontend
    _THRESHOLDS: dict[str, list[tuple[float, str]]] = {
        "PM2_5": [
            (0.0,   "good"),
            (12.1,  "moderate"),
            (35.5,  "elevated"),
            (55.5,  "unhealthy"),
            (150.5, "critical"),
            (250.5, "hazardous"),
        ],
        "PM10": [
            (0.0,  "good"),
            (55.0, "moderate"),
            (155.0,"elevated"),
            (255.0,"unhealthy"),
            (355.0,"critical"),
            (425.0,"hazardous"),
        ],
        "CO2": [
            (350.0,  "good"),
            (801.0,  "moderate"),
            (1001.0, "elevated"),
            (1501.0, "unhealthy"),
            (2500.0, "critical"),
        ],
        "VOC_INDEX": [
            (1.0,   "good"),
            (151.0, "moderate"),
            (251.0, "elevated"),
            (351.0, "unhealthy"),
        ],
        "NOX_INDEX": [
            (1.0,   "good"),
            (21.0,  "moderate"),
            (51.0,  "elevated"),
            (101.0, "unhealthy"),
            (201.0, "critical"),
        ],
    }

    @classmethod
    def classify(cls, variable_code: str, avg_value: float) -> str:
        """
        Clasifica un valor promedio segun los umbrales del frontend.
        Retorna 'unknown' si la variable no tiene umbral definido.
        """
        levels = cls._THRESHOLDS.get(variable_code.upper())
        if levels is None:
            return "unknown"
        verdict = levels[0][1]
        for min_value, label in levels:
            if avg_value >= min_value:
                verdict = label
        return verdict
