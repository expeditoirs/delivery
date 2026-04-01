from sqlalchemy.orm import Session
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from app.models.usuario import Usuario

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


def hash_senha(senha: str) -> str:
    return _pwd.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    if not senha_hash:
        return False
    try:
        return _pwd.verify(senha, senha_hash)
    except (ValueError, TypeError, UnknownHashError):
        return senha == senha_hash


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
    if not user or not user.senha or not verificar_senha(senha, user.senha):
        return None
    try:
        if not _pwd.identify(user.senha):
            user.senha = hash_senha(senha)
            db.commit()
            db.refresh(user)
    except (ValueError, TypeError):
        user.senha = hash_senha(senha)
        db.commit()
        db.refresh(user)
    return user


def listar_usuarios(db: Session, offset: int = 0, limit: int | None = None):
    query = db.query(Usuario).order_by(Usuario.id.desc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def contar_usuarios(db: Session) -> int:
    return db.query(Usuario).count()


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


def atualizar_senha_por_email(db: Session, email: str, nova_senha: str):
    user = buscar_por_email(db, email)
    if not user:
        return None
    user.senha = hash_senha(nova_senha)
    db.commit()
    db.refresh(user)
    return user


def deletar_usuario(db: Session, user_id: int):
    user = buscar_usuario(db, user_id)
    if user:
        db.delete(user)
        db.commit()
    return user