from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.administrador import Administrador

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


def hash_senha(senha: str) -> str:
    return _pwd.hash(senha)


def verificar_senha(senha: str, senha_hash: str) -> bool:
    return _pwd.verify(senha, senha_hash)


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
    return admin
