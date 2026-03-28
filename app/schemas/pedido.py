from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PedidoBase(BaseModel):
    id_empresa: int
    id_usuario: int
    total: float
    status: str
    endereco_rua: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None


class PedidoCreate(PedidoBase):
    pass


class PedidoStatusUpdate(BaseModel):
    status: str


class PedidoRead(PedidoBase):
    id: int
    data_pedido: datetime
    cliente_nome: Optional[str] = None
    usuario_nome: Optional[str] = None
    total_itens: Optional[int] = None

    model_config = {'from_attributes': True}
