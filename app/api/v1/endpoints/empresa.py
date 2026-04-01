import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.cache import cached, get_json, invalidate_prefix, set_json
from app.core.security import criar_token, get_current_auth, require_store
from app.dependencies import get_db
from app.models.usuario import Usuario
from app.repositories import empresa_repo, item_repo
from app.schemas.auth import PasswordResetRequest
from app.schemas.empresa import EmpresaAuthResponse, EmpresaCreate, EmpresaLogin, EmpresaRead, EmpresaUpdate
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate

router = APIRouter()


@router.post('/', response_model=EmpresaRead, status_code=status.HTTP_201_CREATED)
def criar(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    if empresa.email and empresa_repo.buscar_por_email(db, empresa.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email da loja ja cadastrado')
    created = empresa_repo.criar(db, empresa)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return created


@router.post('/login', response_model=EmpresaAuthResponse)
def login_loja(dados: EmpresaLogin, db: Session = Depends(get_db)):
    empresa = empresa_repo.login_empresa(db, dados.email, dados.senha)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais da loja invalidas')
    return EmpresaAuthResponse(access_token=criar_token(empresa.id, 'store'), empresa=empresa)


@router.post('/reset-senha', status_code=status.HTTP_204_NO_CONTENT)
def resetar_senha_loja(dados: PasswordResetRequest, db: Session = Depends(get_db)):
    empresa = empresa_repo.atualizar_senha_por_email(db, dados.email, dados.nova_senha)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Loja nao encontrada')


@router.get('/me', response_model=EmpresaRead)
def minha_loja(auth: dict = Depends(get_current_auth), db: Session = Depends(get_db)):
    empresa_id = auth['entity_id'] if auth['role'] == 'store' else None
    if empresa_id is None and auth['role'] == 'user':
        usuario = db.query(Usuario).filter(Usuario.id == auth['entity_id']).first()
        empresa_id = usuario.id_empresa if usuario and usuario.nivel_usuario == 1 else None
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Acesso restrito a loja')
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Loja nao encontrada')
    return empresa


@router.put('/me', response_model=EmpresaRead)
def atualizar_minha_loja(data: EmpresaUpdate, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    empresa = empresa_repo.atualizar(db, auth['entity_id'], data.model_dump(exclude_none=True))
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Loja nao encontrada')
    empresa_repo.bump_cache_version(db, auth['entity_id'])
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return empresa


@router.get('/cache/version')
def cache_version(db: Session = Depends(get_db)):
    return {
        'cache_version_global': empresa_repo.buscar_cache_version_global(db),
    }


@router.get('/cache/stream')
async def cache_stream():
    async def event_generator():
        while True:
            db_generator = get_db()
            db = next(db_generator)
            try:
                payload = {
                    'cache_version_global': empresa_repo.buscar_cache_version_global(db),
                }
            finally:
                db_generator.close()

            yield f"event: cache-version\ndata: {json.dumps(payload)}\n\n"
            await asyncio.sleep(10)

    return StreamingResponse(event_generator(), media_type='text/event-stream')


@router.get('/', response_model=list[EmpresaRead])
@cached('empresas:list', ttl=180)
def listar(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return empresa_repo.listar(db, offset=offset, limit=limit)


@router.get('/{empresa_id}', response_model=EmpresaRead)
def buscar(empresa_id: int, db: Session = Depends(get_db)):
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa nao encontrada')
    return empresa


@router.get('/{empresa_id}/cardapio/version')
def cardapio_version(empresa_id: int, db: Session = Depends(get_db)):
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa nao encontrada')
    return {
        'empresa_id': empresa_id,
        'cache_version': int(empresa.cache_version or 1),
    }


@router.get('/{empresa_id}/cardapio')
def cardapio(empresa_id: int, db: Session = Depends(get_db)):
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa nao encontrada')

    cache_version = int(empresa.cache_version or 1)
    cache_key = f'empresas:cardapio:{empresa_id}:v{cache_version}'
    cached_payload = get_json(cache_key)
    if cached_payload is not None:
        return cached_payload

    payload = empresa_repo.cardapio_completo(db, empresa_id)
    set_json(cache_key, payload, ex=300)
    return payload


@router.get('/{empresa_id}/itens', response_model=list[ItemRead])
def itens_empresa(
    empresa_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=60, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return item_repo.listar_por_empresa(db, empresa_id, include_inactive=True, offset=offset, limit=limit)


@router.post('/{empresa_id}/itens', response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def criar_item_loja(empresa_id: int, data: ItemCreate, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    if auth['entity_id'] != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Voce nao pode cadastrar itens para essa loja')
    payload = data.model_dump()
    payload['id_empresa'] = empresa_id
    item = item_repo.criar(db, payload)
    empresa_repo.bump_cache_version(db, empresa_id)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return item


@router.put('/{empresa_id}/itens/{item_id}', response_model=ItemRead)
def atualizar_item_loja(empresa_id: int, item_id: int, data: ItemUpdate, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    if auth['entity_id'] != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Voce nao pode atualizar itens dessa loja')

    item = item_repo.buscar_por_id(db, item_id)
    if not item or item.id_empresa != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Item nao encontrado')

    atualizado = item_repo.atualizar(db, item_id, data.model_dump(exclude_none=True))
    empresa_repo.bump_cache_version(db, empresa_id)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return atualizado


@router.delete('/{empresa_id}/itens/{item_id}', status_code=status.HTTP_204_NO_CONTENT)
def excluir_item_loja(empresa_id: int, item_id: int, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    if auth['entity_id'] != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Voce nao pode excluir itens dessa loja')
    item = item_repo.buscar_por_id(db, item_id)
    if not item or item.id_empresa != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Item nao encontrado')
    item_repo.deletar(db, item_id)
    empresa_repo.bump_cache_version(db, empresa_id)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')