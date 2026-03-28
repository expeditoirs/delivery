# app/models/usuario.py
from sqlalchemy import Column, Integer, String, SmallInteger, ForeignKey
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    id_bairro = Column(Integer, ForeignKey("bairros.id", ondelete="SET NULL"), nullable=True)
    cpf = Column(String(14), nullable=True)
    numero = Column(String(20), nullable=True)
    senha = Column(String(255))
    token = Column(String(255), nullable=True)
    ip = Column(String(45), nullable=True)
    nivel_usuario = Column(SmallInteger, default=0, nullable=False)  # 0=cliente,1=admin_loja,2=admin_plataforma
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True)