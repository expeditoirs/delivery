# app/models/publicacao_cliente.py
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Boolean, ForeignKey, func
from app.core.database import Base

class PublicacaoCliente(Base):
    __tablename__ = "publicacoes_cliente"

    id = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    imagem_url = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=False)
    criado_em = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    aprovado = Column(Boolean, default=False, nullable=False)