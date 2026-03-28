from sqlalchemy.orm import Session
from app.models.item import Item


def listar(db: Session):
    return db.query(Item).order_by(Item.id.asc()).all()


def buscar_por_id(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()


def listar_por_empresa(db: Session, empresa_id: int):
    return db.query(Item).filter(Item.id_empresa == empresa_id).order_by(Item.id.asc()).all()


def listar_por_categoria(db: Session, categoria_id: int):
    return db.query(Item).filter(Item.id_categoria == categoria_id).order_by(Item.id.asc()).all()


def criar(db: Session, data: dict):
    item = Item(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def atualizar(db: Session, item_id: int, data: dict):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None
    for key, value in data.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


def deletar(db: Session, item_id: int):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        return None
    db.delete(item)
    db.commit()
    return item
