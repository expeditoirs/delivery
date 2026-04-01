import json

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

from app.models.empresa import Empresa
from app.repositories import categoria_repo, item_repo

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


def hash_senha(senha: str) -> str:
    return _pwd.hash(senha)


def _normalize_categories(value):
    if value in (None, '', []):
        return []
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                items = parsed
            else:
                items = [parsed]
        except json.JSONDecodeError:
            items = raw.split(',')
        return [item for item in dict.fromkeys(str(item).strip() for item in items) if item]
    if isinstance(value, (list, tuple, set)):
        return [item for item in dict.fromkeys(str(item).strip() for item in value) if item]
    return []


def _prepare_company_payload(payload: dict) -> dict:
    data = dict(payload)
    has_multi_categories = 'categorias_empresa' in data
    categorias = _normalize_categories(data.get('categorias_empresa')) if has_multi_categories else []
    categoria_principal = str(data.get('categoria_empresa') or '').strip()

    if categorias:
        if categoria_principal and categoria_principal not in categorias:
            categorias.insert(0, categoria_principal)
        data['categoria_empresa'] = categoria_principal or categorias[0]
        data['categorias_empresa'] = json.dumps(categorias, ensure_ascii=False)
    elif has_multi_categories:
        data['categoria_empresa'] = categoria_principal or None
        data['categorias_empresa'] = json.dumps([categoria_principal], ensure_ascii=False) if categoria_principal else json.dumps([])
    elif 'categoria_empresa' in data:
        data['categoria_empresa'] = categoria_principal or None
        data['categorias_empresa'] = json.dumps([categoria_principal], ensure_ascii=False) if categoria_principal else json.dumps([])

    return data


def listar(
    db: Session,
    offset: int = 0,
    limit: int | None = None,
    include_inactive: bool = False,
):
    query = db.query(Empresa)
    if not include_inactive:
        query = query.filter(Empresa.ativo.is_(True))
    query = query.order_by(Empresa.id.asc()).offset(offset)
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def contar(db: Session) -> int:
    return db.query(Empresa).count()


def contar_ativas(db: Session) -> int:
    return db.query(Empresa).filter(Empresa.ativo.is_(True)).count()


def contar_inativas(db: Session) -> int:
    return db.query(Empresa).filter(Empresa.ativo.is_(False)).count()


def buscar_por_id(db: Session, empresa_id: int):
    return db.query(Empresa).filter(Empresa.id == empresa_id).first()


def buscar_cache_version(db: Session, empresa_id: int) -> int:
    empresa = db.query(Empresa.cache_version).filter(Empresa.id == empresa_id).first()
    return int(empresa[0]) if empresa and empresa[0] is not None else 1


def buscar_cache_version_global(db: Session) -> int:
    empresas = db.query(Empresa.cache_version).all()
    if not empresas:
        return 1
    return max(int(value[0] or 1) for value in empresas)


def buscar_por_email(db: Session, email: str):
    return db.query(Empresa).filter(Empresa.email == email).first()


def login_empresa(db: Session, email: str, senha: str):
    empresa = buscar_por_email(db, email)
    if not empresa or not empresa.senha:
        return None
    try:
        valido = _pwd.verify(senha, empresa.senha)
    except (ValueError, TypeError, UnknownHashError):
        valido = senha == empresa.senha
    if not valido:
        return None
    try:
        if not _pwd.identify(empresa.senha):
            empresa.senha = hash_senha(senha)
            db.commit()
            db.refresh(empresa)
    except (ValueError, TypeError):
        empresa.senha = hash_senha(senha)
        db.commit()
        db.refresh(empresa)
    return empresa


def criar(db: Session, data):
    payload = data.model_dump() if hasattr(data, 'model_dump') else dict(data)
    payload = _prepare_company_payload(payload)
    if payload.get('senha'):
        payload['senha'] = hash_senha(payload['senha'])
    empresa = Empresa(**payload)
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


def atualizar(db: Session, empresa_id: int, data: dict):
    empresa = buscar_por_id(db, empresa_id)
    if not empresa:
        return None
    payload = _prepare_company_payload(data)
    for key, value in payload.items():
        if value is not None and hasattr(empresa, key):
            setattr(empresa, key, value)
        if value is None and key in {'categoria_empresa', 'categorias_empresa'} and hasattr(empresa, key):
            setattr(empresa, key, value)
    db.commit()
    db.refresh(empresa)
    return empresa


def atualizar_senha_por_email(db: Session, email: str, nova_senha: str):
    empresa = buscar_por_email(db, email)
    if not empresa:
        return None
    empresa.senha = hash_senha(nova_senha)
    db.commit()
    db.refresh(empresa)
    return empresa


def bump_cache_version(db: Session, empresa_id: int) -> Empresa | None:
    empresa = buscar_por_id(db, empresa_id)
    if not empresa:
        return None
    empresa.cache_version = int(empresa.cache_version or 1) + 1
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
    itens_empresa = item_repo.listar_por_empresa(db, empresa_id)
    categorias_ids = {cat.id for cat in categorias}
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
                    'tipo_produto': item.tipo_produto,
                    'configuracao': item.configuracao,
                    'ativo': item.ativo,
                }
                for item in itens
            ]
        })

    itens_sem_categoria = [
        item for item in itens_empresa
        if item.id_categoria not in categorias_ids
    ]
    if itens_sem_categoria:
        resultado.append({
            'id': f'outros-{empresa_id}',
            'nome': 'Outros',
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
                    'tipo_produto': item.tipo_produto,
                    'configuracao': item.configuracao,
                    'ativo': item.ativo,
                }
                for item in itens_sem_categoria
            ],
        })
    return {
        'empresa_id': empresa_id,
        'cache_version': buscar_cache_version(db, empresa_id),
        'categorias': [categoria for categoria in resultado if categoria['itens']],
    }