from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.cache import cached, invalidate_prefix
from app.core.security import criar_token, get_current_auth, require_store
from app.dependencies import get_db
from app.models.usuario import Usuario
from app.repositories import empresa_repo, item_repo
from app.schemas.empresa import EmpresaAuthResponse, EmpresaCreate, EmpresaLogin, EmpresaRead, EmpresaUpdate
from app.schemas.item import ItemCreate, ItemRead

router = APIRouter()


@router.post('/', response_model=EmpresaRead, status_code=status.HTTP_201_CREATED)
def criar(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    if empresa.email and empresa_repo.buscar_por_email(db, empresa.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email da loja já cadastrado')
    created = empresa_repo.criar(db, empresa)
    invalidate_prefix('empresas')
    return created


@router.post('/login', response_model=EmpresaAuthResponse)
def login_loja(dados: EmpresaLogin, db: Session = Depends(get_db)):
    empresa = empresa_repo.login_empresa(db, dados.email, dados.senha)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais da loja inválidas')
    return EmpresaAuthResponse(access_token=criar_token(empresa.id, 'store'), empresa=empresa)


@router.get('/me', response_model=EmpresaRead)
def minha_loja(auth: dict = Depends(get_current_auth), db: Session = Depends(get_db)):
    empresa_id = auth['entity_id'] if auth['role'] == 'store' else None
    if empresa_id is None and auth['role'] == 'user':
        usuario = db.query(Usuario).filter(Usuario.id == auth['entity_id']).first()
        empresa_id = usuario.id_empresa if usuario and usuario.nivel_usuario == 1 else None
    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Acesso restrito à loja')
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Loja não encontrada')
    return empresa


@router.put('/me', response_model=EmpresaRead)
def atualizar_minha_loja(data: EmpresaUpdate, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    empresa = empresa_repo.atualizar(db, auth['entity_id'], data.model_dump(exclude_none=True))
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Loja não encontrada')
    invalidate_prefix('empresas')
    return empresa


@router.get('/', response_model=list[EmpresaRead])
@cached('empresas:list', ttl=180)
def listar(db: Session = Depends(get_db)):
    return empresa_repo.listar(db)


@router.get('/{empresa_id}', response_model=EmpresaRead)
def buscar(empresa_id: int, db: Session = Depends(get_db)):
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa não encontrada')
    return empresa


@router.get('/{empresa_id}/cardapio')
def cardapio(empresa_id: int, db: Session = Depends(get_db)):
    empresa = empresa_repo.buscar_por_id(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa não encontrada')
    return empresa_repo.cardapio_completo(db, empresa_id)


@router.get('/{empresa_id}/itens', response_model=list[ItemRead])
def itens_empresa(empresa_id: int, db: Session = Depends(get_db)):
    return item_repo.listar_por_empresa(db, empresa_id)


@router.post('/{empresa_id}/itens', response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def criar_item_loja(empresa_id: int, data: ItemCreate, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    if auth['entity_id'] != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Você não pode cadastrar itens para essa loja')
    payload = data.model_dump()
    payload['id_empresa'] = empresa_id
    item = item_repo.criar(db, payload)
    invalidate_prefix('empresas')
    return item


@router.delete('/{empresa_id}/itens/{item_id}', status_code=status.HTTP_204_NO_CONTENT)
def excluir_item_loja(empresa_id: int, item_id: int, auth: dict = Depends(require_store), db: Session = Depends(get_db)):
    if auth['entity_id'] != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Você não pode excluir itens dessa loja')
    item = item_repo.buscar_por_id(db, item_id)
    if not item or item.id_empresa != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Item não encontrado')
    item_repo.deletar(db, item_id)
    invalidate_prefix('empresas')
