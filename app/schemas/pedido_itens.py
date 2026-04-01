from typing import Optional

from pydantic import BaseModel


class PedidoItemBase(BaseModel):
    id_pedido: int
    id_item: int
    quantidade: int
    preco_unitario: float
    nome_item: Optional[str] = None
    observacao: Optional[str] = None
    tamanho: Optional[str] = None
    sabores: Optional[list[str]] = None
    complementos: Optional[dict] = None


class PedidoItemCreate(PedidoItemBase):
    pass


class PedidoItemRead(PedidoItemBase):
    id: int

    model_config = {'from_attributes': True}
