# app/models/empresa_bairro.py
from sqlalchemy import Column, Integer, ForeignKey
from app.core.database import Base

class EmpresaBairro(Base):
    __tablename__ = "empresa_bairros"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"))
    id_bairro = Column(Integer, ForeignKey("bairros.id", ondelete="CASCADE"))