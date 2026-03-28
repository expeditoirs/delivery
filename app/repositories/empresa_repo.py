from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.empresa import Empresa
from app.repositories import categoria_repo, item_repo

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


def listar(db: Session):
    return db.query(Empresa).all()


def buscar_por_id(db: Session, empresa_id: int):
    return db.query(Empresa).filter(Empresa.id == empresa_id).first()


def buscar_por_email(db: Session, email: str):
    return db.query(Empresa).filter(Empresa.email == email).first()


def login_empresa(db: Session, email: str, senha: str):
    empresa = buscar_por_email(db, email)
    if not empresa or not empresa.senha or not _pwd.verify(senha, empresa.senha):
        return None
    return empresa


def criar(db: Session, data):
    payload = data.model_dump() if hasattr(data, 'model_dump') else dict(data)
    if payload.get('senha'):
        payload['senha'] = _pwd.hash(payload['senha'])
    empresa = Empresa(**payload)
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


def atualizar(db: Session, empresa_id: int, data: dict):
    empresa = buscar_por_id(db, empresa_id)
    if not empresa:
        return None
    for key, value in data.items():
        if value is not None and hasattr(empresa, key):
            setattr(empresa, key, value)
    db.commit()
    db.refresh(empresa)
    return empresa


def deletar(db: Session, empresa_id: int):
    empresa = buscar_por_id(db, empresa_id)
    if not empresa:
        return None
    db.delete(empresa)
    db.commit()
    return empresa


def cardapio_completo(db, empresa_id):
    categorias = categoria_repo.listar_por_empresa(db, empresa_id)
    resultado = []
    for cat in categorias:
        itens = item_repo.listar_por_categoria(db, cat.id)
        resultado.append({
            'id': cat.id,
            'nome': cat.nome,
            'itens': [
                {
                    'id': item.id,
                    'id_empresa': item.id_empresa,
                    'id_categoria': item.id_categoria,
                    'nome': item.nome,
                    'descricao': item.descricao,
                    'preco': float(item.preco),
                    'img': item.img,
                    'numero_pedidos': item.numero_pedidos,
                }
                for item in itens
            ]
        })
    return {'categorias': resultado}
