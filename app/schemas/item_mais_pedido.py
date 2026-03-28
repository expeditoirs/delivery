from pydantic import BaseModel
from typing import Optional


class ItemMaisPedidoRead(BaseModel):
    id: int
    id_empresa: int
    id_categoria: Optional[int] = None
    nome: str
    descricao: Optional[str] = None
    preco: float
    disponibilidade_horarios: Optional[str] = None
    img: Optional[str] = None
    numero_pedidos: int

    model_config = {'from_attributes': True}
