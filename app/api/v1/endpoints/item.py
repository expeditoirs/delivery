from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.cache import get_json, invalidate_prefix, set_json
from app.dependencies import get_db
from app.repositories import empresa_repo, item_repo
from app.schemas.item import ItemCreate, ItemRead

router = APIRouter()


@router.post('/', response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def criar_item(data: ItemCreate, db: Session = Depends(get_db)):
    item = item_repo.criar(db, data.model_dump() if hasattr(data, 'model_dump') else data.dict())
    empresa_repo.bump_cache_version(db, item.id_empresa)
    invalidate_prefix('itens:')
    invalidate_prefix('empresas')
    return item


@router.get('/', response_model=list[ItemRead])
def listar_itens(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=300),
    db: Session = Depends(get_db),
):
    cache_version = empresa_repo.buscar_cache_version_global(db)
    cache_key = f'itens:list:v{cache_version}:o{offset}:l{limit}'
    cached = get_json(cache_key)
    if cached is not None:
        return cached
    itens = item_repo.listar(db, offset=offset, limit=limit)
    payload = [ItemRead.model_validate(item).model_dump() for item in itens]
    set_json(cache_key, payload, ex=180)
    return payload


@router.get('/{item_id}', response_model=ItemRead)
def buscar_item(item_id: int, db: Session = Depends(get_db)):
    item = item_repo.buscar_por_id(db, item_id)
    if not item or not item.ativo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Item não encontrado')
    return item


@router.get('/empresa/{empresa_id}', response_model=list[ItemRead])
def listar_por_empresa(empresa_id: int, db: Session = Depends(get_db)):
    version = empresa_repo.buscar_cache_version(db, empresa_id)
    cache_key = f'itens:empresa:{empresa_id}:v{version}'
    cached = get_json(cache_key)
    if cached is not None:
        return cached
    itens = item_repo.listar_por_empresa(db, empresa_id)
    payload = [ItemRead.model_validate(item).model_dump() for item in itens]
    set_json(cache_key, payload, ex=180)
    return payload
