from sqlalchemy.orm import Session
from app.models.bairro import Bairro


def listar(db: Session, cidade_id: int | None = None):
    query = db.query(Bairro)
    if cidade_id is not None:
        query = query.filter(Bairro.id_cidade == cidade_id)
    return query.order_by(Bairro.nome.asc()).all()


def buscar_por_id(db: Session, bairro_id: int):
    return db.query(Bairro).filter(Bairro.id == bairro_id).first()


def listar_por_cidade(db: Session, cidade_id: int):
    return db.query(Bairro).filter(Bairro.id_cidade == cidade_id).order_by(Bairro.nome.asc()).all()


def criar(db: Session, data: dict):
    bairro = Bairro(**data)
    db.add(bairro)
    db.commit()
    db.refresh(bairro)
    return bairro


def atualizar(db: Session, bairro_id: int, data: dict):
    bairro = db.query(Bairro).filter(Bairro.id == bairro_id).first()
    if not bairro:
        return None
    for key, value in data.items():
        setattr(bairro, key, value)
    db.commit()
    db.refresh(bairro)
    return bairro


def deletar(db: Session, bairro_id: int):
    bairro = db.query(Bairro).filter(Bairro.id == bairro_id).first()
    if not bairro:
        return None
    db.delete(bairro)
    db.commit()
    return bairro
