from sqlalchemy.orm import Session
from app.models.cidade import Cidade


def listar(db: Session, uf: str | None = None):
    query = db.query(Cidade)
    if uf:
        query = query.filter(Cidade.uf == uf.upper())
    return query.order_by(Cidade.nome.asc()).all()


def buscar_por_id(db: Session, cidade_id: int):
    return db.query(Cidade).filter(Cidade.id == cidade_id).first()


def criar(db: Session, data: dict):
    if data.get('uf'):
        data['uf'] = data['uf'].upper()
    cidade = Cidade(**data)
    db.add(cidade)
    db.commit()
    db.refresh(cidade)
    return cidade


def atualizar(db: Session, cidade_id: int, data: dict):
    cidade = db.query(Cidade).filter(Cidade.id == cidade_id).first()
    if not cidade:
        return None
    if data.get('uf'):
        data['uf'] = data['uf'].upper()
    for key, value in data.items():
        setattr(cidade, key, value)
    db.commit()
    db.refresh(cidade)
    return cidade


def deletar(db: Session, cidade_id: int):
    cidade = db.query(Cidade).filter(Cidade.id == cidade_id).first()
    if not cidade:
        return None
    db.delete(cidade)
    db.commit()
    return cidade
