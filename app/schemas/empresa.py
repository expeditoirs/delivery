import json
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class EmpresaBase(BaseModel):
    nome_empresa: str
    endereco: Optional[str] = None
    numero: Optional[str] = None
    email: Optional[EmailStr] = None
    plano_contratado: Optional[str] = None
    horarios_funcionamento: Optional[str] = None
    categoria_empresa: Optional[str] = None
    categorias_empresa: list[str] = Field(default_factory=list)
    config_gerais: Optional[str] = None
    numero_acessos: Optional[int] = 0
    ativo: Optional[bool] = True
    token: Optional[str] = None
    ip: Optional[str] = None

    @field_validator('categorias_empresa', mode='before')
    @classmethod
    def parse_categorias_empresa(cls, value):
        if value in (None, '', []):
            return []
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    items = parsed
                else:
                    items = [parsed]
            except json.JSONDecodeError:
                items = raw.split(',')
            return [item for item in dict.fromkeys(str(item).strip() for item in items) if item]
        if isinstance(value, (list, tuple, set)):
            return [item for item in dict.fromkeys(str(item).strip() for item in value) if item]
        return []

    @model_validator(mode='after')
    def sync_categoria_principal(self):
        if self.categorias_empresa:
            self.categoria_empresa = self.categoria_empresa or self.categorias_empresa[0]
        elif self.categoria_empresa:
            self.categorias_empresa = [self.categoria_empresa]
        return self


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
    categorias_empresa: Optional[list[str]] = None
    config_gerais: Optional[str] = None

    @field_validator('categorias_empresa', mode='before')
    @classmethod
    def parse_categorias_empresa(cls, value):
        if value in (None, '', []):
            return [] if value == [] else None
        if isinstance(value, str):
            raw = value.strip()
            if not raw:
                return []
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    items = parsed
                else:
                    items = [parsed]
            except json.JSONDecodeError:
                items = raw.split(',')
            return [item for item in dict.fromkeys(str(item).strip() for item in items) if item]
        if isinstance(value, (list, tuple, set)):
            return [item for item in dict.fromkeys(str(item).strip() for item in value) if item]
        return None


class EmpresaRead(EmpresaBase):
    id: int
    cache_version: int = 1

    model_config = {'from_attributes': True}


class EmpresaAuthResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    empresa: EmpresaRead


class EmpresaStatusUpdate(BaseModel):
    ativo: bool
