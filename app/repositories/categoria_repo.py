from sqlalchemy.orm import Session
from app.models.categoria import Categoria

def listar(db: Session):
    return db.query(Categoria).all()

def buscar_por_id(db: Session, categoria_id: int):
    return db.query(Categoria).filter(Categoria.id == categoria_id).first()

def listar_por_empresa(db: Session, empresa_id: int):
    return db.query(Categoria).filter(Categoria.id_empresa == empresa_id).all()

def criar(db: Session, data: dict):
    categoria = Categoria(**data)
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria

def atualizar(db: Session, categoria_id: int, data: dict):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        return None
    for key, value in data.items():
        setattr(categoria, key, value)
    db.commit()
    db.refresh(categoria)
    return categoria

def deletar(db: Session, categoria_id: int):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        return None
    db.delete(categoria)
    db.commit()
    return categoria