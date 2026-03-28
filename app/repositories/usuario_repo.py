from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.usuario import Usuario

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


def hash_senha(senha: str) -> str:
    return _pwd.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return _pwd.verify(senha, senha_hash)


def criar_usuario(db: Session, usuario):
    dados = usuario.model_dump() if hasattr(usuario, 'model_dump') else dict(usuario)
    dados['senha'] = hash_senha(dados['senha'])
    novo = Usuario(**dados)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def buscar_por_email(db: Session, email: str):
    return db.query(Usuario).filter(Usuario.email == email).first()


def login_usuario(db: Session, email: str, senha: str):
    user = buscar_por_email(db, email)
    if not user or not verificar_senha(senha, user.senha):
        return None
    return user


def listar_usuarios(db: Session):
    return db.query(Usuario).all()


def buscar_usuario(db: Session, user_id: int):
    return db.query(Usuario).filter(Usuario.id == user_id).first()


def atualizar_usuario(db: Session, user_id: int, data: dict):
    user = buscar_usuario(db, user_id)
    if not user:
        return None
    for key, value in data.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def deletar_usuario(db: Session, user_id: int):
    user = buscar_usuario(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user
