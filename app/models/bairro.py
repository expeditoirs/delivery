# app/models/bairro.py
from sqlalchemy import Column, Integer, String, ForeignKey
from app.core.database import Base

class Bairro(Base):
    __tablename__ = "bairros"

    id = Column(Integer, primary_key=True, index=True)
    id_cidade = Column(Integer, ForeignKey("cidades.id", ondelete="CASCADE"), nullable=False)
    nome = Column(String(100), nullable=False)