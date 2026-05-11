from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.ports.repositories import ObservationReadRepository
from .dtos import AggregationBucketDTO


class GetAggregationsUseCase:
    """Caso de uso: obtener agregaciones temporales de un datastream."""

    VALID_BUCKETS = {"5m", "15m", "30m", "1h", "6h", "1d"}

    def __init__(self, repo: ObservationReadRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        datastream_id: str,
        from_dt: datetime,
        to_dt: datetime,
        bucket: str = "1h",
    ) -> list[AggregationBucketDTO]:
        """
        Retorna agregaciones avg/min/max/count por bucket.
        Lanza ValueError si el bucket no es valido.
        """
        if bucket not in self.VALID_BUCKETS:
            raise ValueError(f"Bucket invalido: {bucket!r}. Usar: {self.VALID_BUCKETS}")

        rows = await self._repo.find_aggregations(
            datastream_id=UUID(datastream_id),
            from_dt=from_dt,
            to_dt=to_dt,
            bucket=bucket,
        )
        return [
            AggregationBucketDTO(
                bucket=r["bucket"],
                avg_value=r["avg_value"],
                min_value=r["min_value"],
                max_value=r["max_value"],
                sample_count=r["sample_count"],
            )
            for r in rows
        ]
