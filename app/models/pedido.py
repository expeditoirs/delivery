from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, ForeignKey, func
from app.core.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    id_empresa = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False)
    endereco_rua = Column(String(150), nullable=True)
    endereco_numero = Column(String(20), nullable=True)
    endereco_complemento = Column(String(150), nullable=True)
    endereco_bairro = Column(String(100), nullable=True)
    endereco_cidade = Column(String(100), nullable=True)
    endereco_estado = Column(String(2), nullable=True)
    data_pedido = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
