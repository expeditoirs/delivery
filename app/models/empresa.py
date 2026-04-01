# app/models/empresa.py
from sqlalchemy import Boolean, Column, Integer, String, Text
from app.core.database import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome_empresa = Column(String(150), nullable=False)
    endereco = Column(String(150), nullable=True)
    numero = Column(String(10), nullable=True)
    email = Column(String(100), nullable=True)
    senha = Column(String(255), nullable=True)
    plano_contratado = Column(String(50), nullable=True)
    horarios_funcionamento = Column(Text, nullable=True)
    categoria_empresa = Column(String(100), nullable=True)
    categorias_empresa = Column(Text, nullable=True)
    config_gerais = Column(Text, nullable=True)
    numero_acessos = Column(Integer, default=0)
    ativo = Column(Boolean, default=True, nullable=False)
    cache_version = Column(Integer, default=1, nullable=False)
    token = Column(String(255), nullable=True)
    ip = Column(String(45), nullable=True)