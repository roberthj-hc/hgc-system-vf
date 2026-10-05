from pydantic import BaseModel, Field, ConfigDict


class InferenceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    id_sucursal: int | None = Field(None, ge=1)
    id_cliente: int | None = Field(None, ge=1)
    id_producto: int | None = Field(None, ge=1)
    weeks: int = Field(4, ge=1, le=12)
    demand_factor: float = Field(1, ge=0.1, le=2)
    orders: int | None = Field(None, ge=1, le=1000000)
    price_change: float = Field(0, ge=-0.1, le=0.1)
    recency: int | None = Field(None, ge=0, le=180)
    frequency: int | None = Field(None, ge=1, le=10000)
    monetary: float | None = Field(None, ge=0, le=10000000)
