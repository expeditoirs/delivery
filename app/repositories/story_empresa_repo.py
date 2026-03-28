from sqlalchemy.orm import Session
from app.models.story_empresa import StoryEmpresa

def listar(db: Session):
    return db.query(StoryEmpresa).all()

def buscar_por_id(db: Session, story_id: int):
    return db.query(StoryEmpresa).filter(StoryEmpresa.id == story_id).first()

def listar_por_empresa(db: Session, empresa_id: int):
    return db.query(StoryEmpresa).filter(StoryEmpresa.id_empresa == empresa_id).all()

def criar(db: Session, data: dict):
    story = StoryEmpresa(**data)
    db.add(story)
    db.commit()
    db.refresh(story)
    return story

def deletar(db: Session, story_id: int):
    story = db.query(StoryEmpresa).filter(StoryEmpresa.id == story_id).first()
    if not story:
        return None
    db.delete(story)
    db.commit()
    return story