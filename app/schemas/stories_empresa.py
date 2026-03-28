from datetime import datetime
from pydantic import BaseModel


class StoryEmpresaBase(BaseModel):
    id_empresa: int
    imagem_url: str


class StoryEmpresaCreate(StoryEmpresaBase):
    pass


class StoryEmpresaRead(StoryEmpresaBase):
    id: int
    criado_em: datetime

    model_config = {'from_attributes': True}


class StoryFeedRead(StoryEmpresaRead):
    empresa_nome: str
    categoria_empresa: str | None = None
