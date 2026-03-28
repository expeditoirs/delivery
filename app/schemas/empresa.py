from pydantic import BaseModel, EmailStr
from typing import Optional


class EmpresaBase(BaseModel):
    nome_empresa: str
    endereco: Optional[str] = None
    numero: Optional[str] = None
    email: Optional[EmailStr] = None
    plano_contratado: Optional[str] = None
    horarios_funcionamento: Optional[str] = None
    categoria_empresa: Optional[str] = None
    config_gerais: Optional[str] = None
    numero_acessos: Optional[int] = 0
    token: Optional[str] = None
    ip: Optional[str] = None


class EmpresaCreate(EmpresaBase):
    senha: str


class EmpresaLogin(BaseModel):
    email: EmailStr
    senha: str


class EmpresaUpdate(BaseModel):
    nome_empresa: Optional[str] = None
    endereco: Optional[str] = None
    numero: Optional[str] = None
    horarios_funcionamento: Optional[str] = None
    categoria_empresa: Optional[str] = None


class EmpresaRead(EmpresaBase):
    id: int

    model_config = {'from_attributes': True}


class EmpresaAuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    empresa: EmpresaRead
