from __future__ import annotations

from datetime import UTC, datetime

from shared.domain.aggregate_root import AggregateRoot
from shared.domain.device_id import DeviceId

from .device_config import DeviceConfig
from .device_events import (
    DeviceClaimedEvent,
    DeviceConfigUpdatedEvent,
    DeviceOfflineEvent,
    DeviceRegisteredEvent,
)
from .device_limits import DeviceConfigLimits
from .device_location import DeviceLocation
from .device_status import DeviceStatus
from .site_type import SiteType


class Device(AggregateRoot):
    """Agregado raiz del bounded context device_management.

    Representa un dispositivo fisico SANA registrado en la plataforma.
    Es el unico punto de entrada para modificar el estado de un device.
    """

    def __init__(
        self,
        id: DeviceId,
        code: str,
        name: str,
        model: str,
        site_type: SiteType | None = None,
        config: DeviceConfig | None = None,
        location: DeviceLocation | None = None,
    ) -> None:
        """Crea un device nuevo y emite DeviceRegisteredEvent.

        Usar Device.reconstitute() para reconstruir desde persistencia.
        """
        super().__init__()

        if not code or not code.strip():
            raise ValueError("Device code cannot be empty")
        if len(code) > 64:
            raise ValueError("Device code cannot exceed 64 characters")
        if not name or not name.strip():
            raise ValueError("Device name cannot be empty")
        if not model or not model.strip():
            raise ValueError("Device model cannot be empty")

        self._id = id
        self._code = code.strip().upper()
        self._name = name.strip()
        self._model = model.strip()
        self._workspace_id: str | None = None
        self._status = DeviceStatus.PENDING
        self._site_type = site_type
        self._config = config or DeviceConfig(
            sampling_interval_seconds=DeviceConfigLimits.SAMPLING_INTERVAL_DEFAULT_SECONDS,
            transmission_interval_seconds=DeviceConfigLimits.TRANSMISSION_INTERVAL_DEFAULT_SECONDS,
        )
        self._location = location
        self._last_seen: datetime | None = None
        self._created_at: datetime = datetime.now(UTC)
        self._deactivated_at: datetime | None = None

        self._record_event(
            DeviceRegisteredEvent(
                device_id=self._id,
                code=self._code,
                model=self._model,
            )
        )

    @classmethod
    def reconstitute(
        cls,
        id: DeviceId,
        code: str,
        name: str,
        model: str,
        workspace_id: str | None,
        status: DeviceStatus,
        site_type: SiteType | None,
        config: DeviceConfig,
        location: DeviceLocation | None,
        created_at: datetime,
        deactivated_at: datetime | None,
    ) -> Device:
        """Reconstruye un Device desde persistencia sin emitir eventos."""
        obj = object.__new__(cls)
        AggregateRoot.__init__(obj)
        obj._id = id
        obj._code = code
        obj._name = name
        obj._model = model
        obj._workspace_id = workspace_id
        obj._status = status
        obj._site_type = site_type
        obj._config = config
        obj._location = location
        obj._last_seen = None
        obj._created_at = created_at
        obj._deactivated_at = deactivated_at
        return obj

    @property
    def id(self) -> DeviceId:
        """Identificador unico del device."""
        return self._id

    @property
    def code(self) -> str:
        """Codigo fisico del device, normalizado a uppercase."""
        return self._code

    @property
    def name(self) -> str:
        """Nombre descriptivo del device."""
        return self._name

    @property
    def model(self) -> str:
        """Modelo de hardware (ej. SEN66+A7670SA)."""
        return self._model

    @property
    def workspace_id(self) -> str | None:
        """Workspace al que pertenece el device. None si aún no fue reclamado."""
        return self._workspace_id

    @property
    def status(self) -> DeviceStatus:
        """Estado actual del device en su ciclo de vida."""
        return self._status

    @property
    def site_type(self) -> SiteType | None:
        """Tipo de emplazamiento del device (INDOOR, OUTDOOR, MOBILE)."""
        return self._site_type

    @property
    def config(self) -> DeviceConfig:
        """Configuracion operativa actual del device."""
        return self._config

    @property
    def location(self) -> DeviceLocation | None:
        """Ubicacion actual del device, si esta disponible."""
        return self._location

    @property
    def last_seen(self) -> datetime | None:
        """Ultimo timestamp de actividad registrado via telemetria."""
        return self._last_seen

    @property
    def created_at(self) -> datetime:
        """Timestamp de registro del device en la plataforma."""
        return self._created_at

    @property
    def deactivated_at(self) -> datetime | None:
        """Timestamp de desactivacion. None si el device esta activo."""
        return self._deactivated_at

    def claim(self, workspace_id: str) -> None:
        """Asigna workspace y transiciona a ACTIVE. Idempotente si ya esta ACTIVE con el mismo workspace."""
        if self._status == DeviceStatus.ACTIVE and self._workspace_id == workspace_id:
            return
        self._workspace_id = workspace_id
        self._status = DeviceStatus.ACTIVE
        self._deactivated_at = None
        self._record_event(DeviceClaimedEvent(device_id=self._id, workspace_id=workspace_id))

    def mark_offline(self) -> None:
        """Transiciona a INACTIVE al recibir LWT del broker. Idempotente."""
        if self._status == DeviceStatus.INACTIVE:
            return
        self._status = DeviceStatus.INACTIVE
        self._deactivated_at = datetime.now(UTC)
        self._record_event(DeviceOfflineEvent(device_id=self._id, last_seen=self._last_seen))

    def deactivate(self) -> None:
        """Soft delete manual: marca el device como inactivo con timestamp."""
        self._status = DeviceStatus.INACTIVE
        self._deactivated_at = datetime.now(UTC)

    def update_config(self, new_config: DeviceConfig) -> None:
        """Actualiza la configuracion operativa del device."""
        self._config = new_config
        self._record_event(
            DeviceConfigUpdatedEvent(
                device_id=self._id,
                new_sampling_interval=new_config.sampling_interval_seconds,
                new_transmission_interval=new_config.transmission_interval_seconds,
            )
        )

    def record_heartbeat(self, timestamp: datetime) -> None:
        """Registra actividad reciente. Reactiva si estaba INACTIVE y ya tiene workspace."""
        self._last_seen = timestamp
        if self._status == DeviceStatus.INACTIVE and self._workspace_id is not None:
            self._status = DeviceStatus.ACTIVE
            self._deactivated_at = None
