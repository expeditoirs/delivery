from sqlalchemy import Column, Integer, Numeric, ForeignKey, JSON, String, Text
from app.core.database import Base


class PedidoItem(Base):
    __tablename__ = "pedido_itens"

    id = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    id_item = Column(Integer, ForeignKey("itens.id", ondelete="CASCADE"), nullable=False)
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    nome_item = Column(String(100), nullable=True)
    observacao = Column(Text, nullable=True)
    tamanho = Column(String(50), nullable=True)
    sabores = Column(JSON, nullable=True)
