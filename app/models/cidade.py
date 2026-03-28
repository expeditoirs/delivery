# app/models/cidade.py
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Cidade(Base):
    __tablename__ = "cidades"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    uf = Column(String(2), nullable=False)