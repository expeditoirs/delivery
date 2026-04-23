from pydantic import BaseModel
from datetime import datetime
class ComentarioEmpresaBase(BaseModel):
    id_empresa: int
    id_usuario: int
    comentario: str
    estrelas: int

class ComentarioEmpresaCreate(ComentarioEmpresaBase):
    pass

class ComentarioEmpresaRead(ComentarioEmpresaBase):
    id: int
    criado_em: datetime

    model_config = {"from_attributes": True}