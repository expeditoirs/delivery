# app/models/comentario_empresa.py
from sqlalchemy import Column, Integer, Text, SmallInteger, TIMESTAMP, ForeignKey, func
from app.core.database import Base

class ComentarioEmpresa(Base):
    __tablename__ = "comentarios_empresa"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    comentario = Column(Text, nullable=True)  # opcional
    estrelas = Column(SmallInteger, nullable=False)  # obrigatório, 1 a 5
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)