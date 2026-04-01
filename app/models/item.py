from sqlalchemy import Boolean, Column, Integer, Text, Numeric, ForeignKey, JSON
from app.core.database import Base


class Item(Base):
    __tablename__ = "itens"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    id_categoria = Column(Integer, ForeignKey("categorias.id", ondelete="SET NULL"), nullable=True)
    nome = Column(Text, nullable=False)
    descricao = Column(Text, nullable=True)
    preco = Column(Numeric(10, 2), nullable=False)
    disponibilidade_horarios = Column(Text, nullable=True)
    img = Column(Text, nullable=True)
    numero_pedidos = Column(Integer, default=0, nullable=False)
    tipo_produto = Column(Text, nullable=True)
    configuracao = Column(JSON, nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)