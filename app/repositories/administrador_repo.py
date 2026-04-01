from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from sqlalchemy.orm import Session

from app.models.administrador import Administrador

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


def criar(db: Session, data: dict) -> Administrador:
    payload = dict(data)
    payload['senha'] = hash_senha(payload['senha'])
    db_admin = Administrador(**payload)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin


def listar(db: Session) -> list[Administrador]:
    return db.query(Administrador).order_by(Administrador.id.desc()).all()


def buscar_por_id(db: Session, admin_id: int) -> Administrador | None:
    return db.query(Administrador).filter(Administrador.id == admin_id).first()


def buscar_por_email(db: Session, email: str) -> Administrador | None:
    return db.query(Administrador).filter(Administrador.email == email).first()


def login_admin(db: Session, email: str, senha: str) -> Administrador | None:
    admin = buscar_por_email(db, email)
    if not admin or not admin.senha or not verificar_senha(senha, admin.senha):
        return None
    try:
        if not _pwd.identify(admin.senha):
            admin.senha = hash_senha(senha)
            db.commit()
            db.refresh(admin)
    except (ValueError, TypeError):
        admin.senha = hash_senha(senha)
        db.commit()
        db.refresh(admin)
    return admin


def atualizar_senha_por_email(db: Session, email: str, nova_senha: str) -> Administrador | None:
    admin = buscar_por_email(db, email)
    if not admin:
        return None
    admin.senha = hash_senha(nova_senha)
    db.commit()
    db.refresh(admin)
    return admin