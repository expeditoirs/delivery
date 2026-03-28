from typing import Any, Optional

from pydantic import BaseModel, Field


class ItemBase(BaseModel):
    id_empresa: int
    id_categoria: Optional[int] = None
    nome: str
    descricao: Optional[str] = None
    preco: float
    disponibilidade_horarios: Optional[str] = None
    img: Optional[str] = None
    numero_pedidos: Optional[int] = 0
    tipo_produto: Optional[str] = None
    configuracao: dict[str, Any] = Field(default_factory=dict)


class ItemCreate(ItemBase):
    pass


class ItemRead(ItemBase):
    id: int

    model_config = {'from_attributes': True}
