from sqlalchemy.orm import Session
from app.models.comentario_empresa import ComentarioEmpresa

def listar(db: Session):
    return db.query(ComentarioEmpresa).all()

def buscar_por_id(db: Session, comentario_id: int):
    return db.query(ComentarioEmpresa).filter(ComentarioEmpresa.id == comentario_id).first()

def listar_por_empresa(db: Session, empresa_id: int):
    return db.query(ComentarioEmpresa).filter(ComentarioEmpresa.id_empresa == empresa_id).all()

def criar(db: Session, data: dict):
    comentario = ComentarioEmpresa(**data)
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    return comentario

def atualizar(db: Session, comentario_id: int, data: dict):
    comentario = db.query(ComentarioEmpresa).filter(ComentarioEmpresa.id == comentario_id).first()
    if not comentario:
        return None
    for key, value in data.items():
        setattr(comentario, key, value)
    db.commit()
    db.refresh(comentario)
    return comentario

def deletar(db: Session, comentario_id: int):
    comentario = db.query(ComentarioEmpresa).filter(ComentarioEmpresa.id == comentario_id).first()
    if not comentario:
        return None
    db.delete(comentario)
    db.commit()
    return comentario