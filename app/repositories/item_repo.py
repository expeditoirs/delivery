from sqlalchemy.orm import Session
from app.models.item import Item


def listar(db: Session, offset: int = 0, limit: int | None = None):
    query = db.query(Item).filter(Item.ativo.is_(True)).order_by(Item.id.asc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def buscar_por_id(db: Session, item_id: int):
    return db.query(Item).filter(Item.id == item_id).first()


def listar_por_empresa(
    db: Session,
    empresa_id: int,
    include_inactive: bool = False,
    offset: int = 0,
    limit: int | None = None,
):
    query = db.query(Item).filter(Item.id_empresa == empresa_id)
    if not include_inactive:
        query = query.filter(Item.ativo.is_(True))
    query = query.order_by(Item.id.asc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def listar_por_categoria(db: Session, categoria_id: int, include_inactive: bool = False):
    query = db.query(Item).filter(Item.id_categoria == categoria_id)
    if not include_inactive:
        query = query.filter(Item.ativo.is_(True))
    return query.order_by(Item.id.asc()).all()


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
