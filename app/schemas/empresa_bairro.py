from pydantic import BaseModel

class EmpresaBairroBase(BaseModel):
    id_empresa: int
    id_bairro: int

class EmpresaBairroCreate(EmpresaBairroBase):
    pass

class EmpresaBairroRead(EmpresaBairroBase):
    id: int

    model_config = {"from_attributes": True}