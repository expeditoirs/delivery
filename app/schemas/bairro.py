from pydantic import BaseModel
class BairroBase(BaseModel):
    nome: str
    id_cidade: int

class BairroCreate(BairroBase):
    pass

class BairroRead(BairroBase):
    id: int

    class Config:
        orm_mode = True