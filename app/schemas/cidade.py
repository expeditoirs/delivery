from pydantic import BaseModel

class CidadeBase(BaseModel):
    nome: str
    uf: str  # "SP", "RJ", etc.

class CidadeCreate(CidadeBase):
    pass

class CidadeRead(CidadeBase):
    id: int

    class Config:
        orm_mode = True
    