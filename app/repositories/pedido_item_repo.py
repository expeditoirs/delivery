from sqlalchemy.orm import Session
from app.models.pedido_item import PedidoItem


def listar(db: Session):
    return db.query(PedidoItem).order_by(PedidoItem.id.desc()).all()


def buscar_por_id(db: Session, pedido_item_id: int):
    return db.query(PedidoItem).filter(PedidoItem.id == pedido_item_id).first()


def listar_por_pedido(db: Session, pedido_id: int):
    return db.query(PedidoItem).filter(PedidoItem.id_pedido == pedido_id).order_by(PedidoItem.id.asc()).all()


def criar(db: Session, data: dict):
    pedido_item = PedidoItem(**data)
    db.add(pedido_item)
    db.commit()
    db.refresh(pedido_item)
    return pedido_item


def criar_lote(db: Session, itens: list[dict]):
    objetos = [PedidoItem(**item) for item in itens]
    db.add_all(objetos)
    db.commit()
    for obj in objetos:
        db.refresh(obj)
    return objetos


def atualizar(db: Session, pedido_item_id: int, data: dict):
    pedido_item = db.query(PedidoItem).filter(PedidoItem.id == pedido_item_id).first()
    if not pedido_item:
        return None
    for key, value in data.items():
        setattr(pedido_item, key, value)
    db.commit()
    db.refresh(pedido_item)
    return pedido_item


def deletar(db: Session, pedido_item_id: int):
    pedido_item = db.query(PedidoItem).filter(PedidoItem.id == pedido_item_id).first()
    if not pedido_item:
        return None
    db.delete(pedido_item)
    db.commit()
    return pedido_item
