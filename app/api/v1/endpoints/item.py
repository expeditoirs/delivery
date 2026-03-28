from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.cache import get_json, invalidate_prefix, set_json
from app.dependencies import get_db
from app.repositories import item_repo
from app.schemas.item import ItemCreate, ItemRead

router = APIRouter()


@router.post('/', response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def criar_item(data: ItemCreate, db: Session = Depends(get_db)):
    item = item_repo.criar(db, data.model_dump() if hasattr(data, 'model_dump') else data.dict())
    invalidate_prefix('itens:')
    return item


@router.get('/', response_model=list[ItemRead])
def listar_itens(db: Session = Depends(get_db)):
    return item_repo.listar(db)


@router.get('/{item_id}', response_model=ItemRead)
def buscar_item(item_id: int, db: Session = Depends(get_db)):
    item = item_repo.buscar_por_id(db, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Item não encontrado')
    return item


@router.get('/empresa/{empresa_id}', response_model=list[ItemRead])
def listar_por_empresa(empresa_id: int, db: Session = Depends(get_db)):
    cache_key = f'itens:empresa:{empresa_id}'
    cached = get_json(cache_key)
    if cached is not None:
        return cached
    itens = item_repo.listar_por_empresa(db, empresa_id)
    payload = [ItemRead.model_validate(item).model_dump() for item in itens]
    set_json(cache_key, payload, ex=180)
    return payload
