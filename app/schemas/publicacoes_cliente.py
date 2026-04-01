from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PublicacaoClienteBase(BaseModel):
    id_pedido: int
    id_usuario: int
    imagem_url: str
    descricao: Optional[str] = None
    aprovado: Optional[bool] = False


class PublicacaoClienteCreate(PublicacaoClienteBase):
    pass


class PublicacaoClienteRead(PublicacaoClienteBase):
    id: int
    criado_em: datetime

    model_config = {'from_attributes': True}


class PublicacaoFeedRead(PublicacaoClienteRead):
    usuario_nome: str
    empresa_nome: Optional[str] = None
    id_empresa: Optional[int] = None
    total_pedido: Optional[float] = None
    feed_score: Optional[float] = None