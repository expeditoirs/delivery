from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import criar_token, get_current_user_id, require_user
from app.dependencies import get_db
from app.repositories import usuario_repo
from app.schemas.usuario import LoginRequest, UsuarioAuthResponse, UsuarioCreate, UsuarioResponse, UsuarioUpdate

router = APIRouter()


@router.post('/', response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def criar(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existing = usuario_repo.buscar_por_email(db, usuario.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email já cadastrado')
    return usuario_repo.criar_usuario(db, usuario)


@router.post('/login', response_model=UsuarioAuthResponse)
def login(dados: LoginRequest, db: Session = Depends(get_db)):
    user = usuario_repo.login_usuario(db, dados.email, dados.senha)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Email ou senha incorretos')
    return UsuarioAuthResponse(access_token=criar_token(user.id, 'user'), usuario=user)


@router.get('/me', response_model=UsuarioResponse)
def me(_: dict = Depends(require_user), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    usuario = usuario_repo.buscar_usuario(db, user_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuário não encontrado')
    return usuario


@router.put('/me', response_model=UsuarioResponse)
def atualizar_me(data: UsuarioUpdate, _: dict = Depends(require_user), user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    usuario = usuario_repo.atualizar_usuario(db, user_id, data.model_dump(exclude_none=True))
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuário não encontrado')
    return usuario


@router.get('/', response_model=list[UsuarioResponse])
def listar(db: Session = Depends(get_db)):
    return usuario_repo.listar_usuarios(db)


@router.get('/{user_id}', response_model=UsuarioResponse)
def buscar(user_id: int, db: Session = Depends(get_db)):
    usuario = usuario_repo.buscar_usuario(db, user_id)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuário não encontrado')
    return usuario
