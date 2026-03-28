from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import criar_token, require_admin
from app.dependencies import get_db
from app.repositories import administrador_repo, empresa_repo, pedido_repo, usuario_repo
from app.schemas.administrador import AdministradorAuthResponse, AdministradorCreate, AdministradorLogin, AdministradorRead

router = APIRouter()


@router.post('/', response_model=AdministradorRead, status_code=status.HTTP_201_CREATED)
def criar_administrador(admin: AdministradorCreate, db: Session = Depends(get_db)):
    existing = administrador_repo.buscar_por_email(db, admin.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email já cadastrado')
    return administrador_repo.criar(db, admin.model_dump())


@router.post('/login', response_model=AdministradorAuthResponse)
def login_admin(dados: AdministradorLogin, db: Session = Depends(get_db)):
    admin = administrador_repo.login_admin(db, dados.email, dados.senha)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais do administrador inválidas')
    return AdministradorAuthResponse(access_token=criar_token(admin.id, 'admin'), administrador=admin)


@router.get('/resumo')
def resumo_admin(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    empresas = empresa_repo.listar(db)
    usuarios = usuario_repo.listar_usuarios(db)
    pedidos = pedido_repo.listar(db)
    faturamento = sum(float(p.total or 0) for p in pedidos)
    return {
        'stats': {
            'empresas': len(empresas),
            'usuarios': len(usuarios),
            'pedidos': len(pedidos),
            'faturamento': round(faturamento, 2),
        },
        'empresas': empresas,
        'usuarios': usuarios,
        'pedidos': pedidos[:20],
    }
