from pydantic import BaseModel
class BairroBase(BaseModel):
    nome: str
    id_cidade: int

class BairroCreate(BairroBase):
    pass

class BairroRead(BairroBase):
    id: int

    model_config = {"from_attributes": True}