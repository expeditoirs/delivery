from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    id_bairro: Optional[int] = None
    numero: Optional[str] = None

    model_config = {'from_attributes': True}


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    numero: Optional[str] = None
    cpf: Optional[str] = None
    id_bairro: Optional[int] = None


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    id_bairro: Optional[int] = None
    numero: Optional[str] = None
    nivel_usuario: int
    id_empresa: Optional[int] = None

    model_config = {'from_attributes': True}


class UsuarioAuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    usuario: UsuarioResponse
