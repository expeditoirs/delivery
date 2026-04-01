from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.empresa import Empresa
from app.models.pedido import Pedido


def listar(db: Session, offset: int = 0, limit: int | None = None):
    query = db.query(Pedido).order_by(Pedido.id.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def contar(db: Session) -> int:
    return db.query(Pedido).count()


def total_faturamento(db: Session) -> float:
    return float(db.query(func.coalesce(func.sum(Pedido.total), 0)).scalar() or 0)


def total_faturamento_por_empresa(db: Session, empresa_id: int) -> float:
    return float(
        db.query(func.coalesce(func.sum(Pedido.total), 0))
        .filter(Pedido.id_empresa == empresa_id)
        .scalar()
        or 0
    )


def resumo_por_empresa(db: Session):
    return (
        db.query(
            Empresa.id.label('empresa_id'),
            func.count(Pedido.id).label('total_pedidos'),
            func.coalesce(func.sum(Pedido.total), 0).label('faturamento'),
        )
        .outerjoin(Pedido, Pedido.id_empresa == Empresa.id)
        .group_by(Empresa.id)
        .all()
    )


def resumo_mes_por_empresa(db: Session, reference: datetime | None = None):
    current = reference or datetime.now()
    month_start = current.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return (
        db.query(
            Pedido.id_empresa.label('empresa_id'),
            func.count(Pedido.id).label('total_pedidos_mes'),
            func.coalesce(func.sum(Pedido.total), 0).label('faturamento_mes'),
        )
        .filter(Pedido.data_pedido >= month_start)
        .group_by(Pedido.id_empresa)
        .all()
    )


def buscar_por_id(db: Session, pedido_id: int):
    return db.query(Pedido).filter(Pedido.id == pedido_id).first()


def listar_por_empresa(db: Session, empresa_id: int, offset: int = 0, limit: int | None = None):
    query = db.query(Pedido).filter(Pedido.id_empresa == empresa_id).order_by(Pedido.id.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def contar_por_empresa(db: Session, empresa_id: int) -> int:
    return db.query(Pedido).filter(Pedido.id_empresa == empresa_id).count()


def listar_por_usuario(db: Session, usuario_id: int, offset: int = 0, limit: int | None = None):
    query = db.query(Pedido).filter(Pedido.id_usuario == usuario_id).order_by(Pedido.id.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def contar_por_usuario(db: Session, usuario_id: int) -> int:
    return db.query(Pedido).filter(Pedido.id_usuario == usuario_id).count()


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