# app/models/story_empresa.py
from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, func
from app.core.database import Base

class StoryEmpresa(Base):
    __tablename__ = "stories_empresa"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    imagem_url = Column(String(255), nullable=False)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)