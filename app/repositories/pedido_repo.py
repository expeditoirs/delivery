from sqlalchemy.orm import Session
from app.models.pedido import Pedido


def listar(db: Session):
    return db.query(Pedido).order_by(Pedido.id.desc()).all()


def buscar_por_id(db: Session, pedido_id: int):
    return db.query(Pedido).filter(Pedido.id == pedido_id).first()


def listar_por_empresa(db: Session, empresa_id: int):
    return db.query(Pedido).filter(Pedido.id_empresa == empresa_id).order_by(Pedido.id.desc()).all()


def listar_por_usuario(db: Session, usuario_id: int):
    return db.query(Pedido).filter(Pedido.id_usuario == usuario_id).order_by(Pedido.id.desc()).all()


def criar(db: Session, data: dict):
    pedido = Pedido(**data)
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return pedido


def atualizar(db: Session, pedido_id: int, data: dict):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        return None
    for key, value in data.items():
        setattr(pedido, key, value)
    db.commit()
    db.refresh(pedido)
    return pedido


def deletar(db: Session, pedido_id: int):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        return None
    db.delete(pedido)
    db.commit()
    return pedido
