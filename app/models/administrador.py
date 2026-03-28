# app/models/administrador.py
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Administrador(Base):
    __tablename__ = "administradores"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False)
    senha = Column(String(255), nullable=False)
    token = Column(String(255), nullable=True)
    ip = Column(String(45), nullable=True)