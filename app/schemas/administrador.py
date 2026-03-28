from typing import Optional

from pydantic import BaseModel, EmailStr


class AdministradorBase(BaseModel):
    email: EmailStr
    token: Optional[str] = None
    ip: Optional[str] = None


class AdministradorCreate(AdministradorBase):
    senha: str


class AdministradorLogin(BaseModel):
    email: EmailStr
    senha: str


class AdministradorRead(AdministradorBase):
    id: int

    model_config = {'from_attributes': True}


class AdministradorAuthResponse(BaseModel):
    access_token: str
    administrador: AdministradorRead
