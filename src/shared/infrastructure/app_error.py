from __future__ import annotations


class AppError(Exception):
    """Base para todos los errores de dominio esperados del sistema."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: str) -> None:
        self.resource = resource
        self.identifier = identifier
        super().__init__(f"{resource} '{identifier}' not found")


class ValidationError(AppError):
    def __init__(self, field: str, reason: str) -> None:
        self.field = field
        self.reason = reason
        super().__init__(f"Invalid value for '{field}': {reason}")


class ConflictError(AppError):
    def __init__(self, resource: str, identifier: str) -> None:
        self.resource = resource
        self.identifier = identifier
        super().__init__(f"{resource} '{identifier}' already exists")


class UnauthorizedError(AppError):
    def __init__(self, action: str) -> None:
        self.action = action
        super().__init__(f"Not authorized to perform '{action}'")


class MeasurementOutOfRangeError(AppError):
    def __init__(self, unit: str, value: float, min_value: float, max_value: float) -> None:
        self.unit = unit
        self.value = value
        self.min_value = min_value
        self.max_value = max_value
        super().__init__(f"{unit} value {value} out of range [{min_value}, {max_value}]")
