from sqlalchemy.orm import Session
from app.models.publicacao_cliente import PublicacaoCliente

def listar(db: Session):
    return db.query(PublicacaoCliente).all()

def buscar_por_id(db: Session, publicacao_id: int):
    return db.query(PublicacaoCliente).filter(PublicacaoCliente.id == publicacao_id).first()

def listar_por_usuario(db: Session, usuario_id: int):
    return db.query(PublicacaoCliente).filter(PublicacaoCliente.id_usuario == usuario_id).all()

def listar_por_pedido(db: Session, pedido_id: int):
    return db.query(PublicacaoCliente).filter(PublicacaoCliente.id_pedido == pedido_id).all()

def criar(db: Session, data: dict):
    publicacao = PublicacaoCliente(**data)
    db.add(publicacao)
    db.commit()
    db.refresh(publicacao)
    return publicacao

def atualizar(db: Session, publicacao_id: int, data: dict):
    publicacao = db.query(PublicacaoCliente).filter(PublicacaoCliente.id == publicacao_id).first()
    if not publicacao:
        return None
    for key, value in data.items():
        setattr(publicacao, key, value)
    db.commit()
    db.refresh(publicacao)
    return publicacao

def deletar(db: Session, publicacao_id: int):
    publicacao = db.query(PublicacaoCliente).filter(PublicacaoCliente.id == publicacao_id).first()
    if not publicacao:
        return None
    db.delete(publicacao)
    db.commit()
    return publicacao