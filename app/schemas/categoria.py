from pydantic import BaseModel, EmailStr
from typing import Optional

class CategoriaBase(BaseModel):
    id_empresa: int
    nome: str
    descricao: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaRead(CategoriaBase):
    id: int

    class Config:
        orm_mode = True