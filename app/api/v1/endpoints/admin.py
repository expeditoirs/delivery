from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.cache import invalidate_prefix
from app.core.security import criar_token, require_admin
from app.dependencies import get_db
from app.repositories import administrador_repo, bairro_repo, cidade_repo, empresa_repo, pedido_repo, usuario_repo
from app.schemas.administrador import AdministradorAuthResponse, AdministradorCreate, AdministradorLogin, AdministradorRead
from app.schemas.auth import PasswordResetRequest
from app.schemas.bairro import BairroCreate, BairroRead
from app.schemas.empresa import EmpresaRead, EmpresaStatusUpdate

router = APIRouter()
TAXA_POR_PEDIDO = 0.5


@router.post('/', response_model=AdministradorRead, status_code=status.HTTP_201_CREATED)
def criar_administrador(admin: AdministradorCreate, db: Session = Depends(get_db)):
    existing = administrador_repo.buscar_por_email(db, admin.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email ja cadastrado')
    return administrador_repo.criar(db, admin.model_dump())


@router.post('/login', response_model=AdministradorAuthResponse)
def login_admin(dados: AdministradorLogin, db: Session = Depends(get_db)):
    admin = administrador_repo.login_admin(db, dados.email, dados.senha)
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Credenciais do administrador invalidas')
    return AdministradorAuthResponse(access_token=criar_token(admin.id, 'admin'), administrador=admin)


@router.post('/reset-senha', status_code=status.HTTP_204_NO_CONTENT)
def resetar_senha_admin(dados: PasswordResetRequest, db: Session = Depends(get_db)):
    admin = administrador_repo.atualizar_senha_por_email(db, dados.email, dados.nova_senha)
    if not admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Administrador nao encontrado')


@router.get('/resumo')
def resumo_admin(
    empresas_limit: int = Query(default=20, ge=1, le=100),
    usuarios_limit: int = Query(default=10, ge=1, le=50),
    pedidos_limit: int = Query(default=20, ge=1, le=100),
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    reference = datetime.now()
    empresas = empresa_repo.listar(db, limit=empresas_limit, include_inactive=True)
    usuarios = usuario_repo.listar_usuarios(db, limit=usuarios_limit)
    pedidos_recentes = pedido_repo.listar(db, limit=pedidos_limit)
    total_pedidos = pedido_repo.contar(db)
    faturamento = pedido_repo.total_faturamento(db)
    bairros = bairro_repo.listar(db)
    cidades = cidade_repo.listar(db)

    cidades_por_id = {cidade.id: cidade for cidade in cidades}
    resumo_pedidos_por_empresa = {
        int(item.empresa_id): {
            'total_pedidos': int(item.total_pedidos or 0),
            'faturamento': float(item.faturamento or 0),
        }
        for item in pedido_repo.resumo_por_empresa(db)
    }
    resumo_mes_por_empresa = {
        int(item.empresa_id): {
            'total_pedidos_mes': int(item.total_pedidos_mes or 0),
            'faturamento_mes': float(item.faturamento_mes or 0),
        }
        for item in pedido_repo.resumo_mes_por_empresa(db, reference=reference)
    }

    empresas_detalhadas = []
    for empresa in empresas:
        resumo_empresa = resumo_pedidos_por_empresa.get(empresa.id, {})
        resumo_mes = resumo_mes_por_empresa.get(empresa.id, {})
        pedidos_mes = int(resumo_mes.get('total_pedidos_mes', 0))
        empresas_detalhadas.append({
            'id': empresa.id,
            'nome_empresa': empresa.nome_empresa,
            'email': empresa.email,
            'categoria_empresa': empresa.categoria_empresa,
            'categorias_empresa': empresa.categorias_empresa,
            'numero_acessos': empresa.numero_acessos,
            'ativo': bool(empresa.ativo),
            'total_pedidos': int(resumo_empresa.get('total_pedidos', 0)),
            'faturamento': round(float(resumo_empresa.get('faturamento', 0)), 2),
            'pedidos_mes': pedidos_mes,
            'taxa_por_pedido': TAXA_POR_PEDIDO,
            'taxa_pagar': round(pedidos_mes * TAXA_POR_PEDIDO, 2),
        })

    bairros_detalhados = []
    for bairro in bairros:
        cidade = cidades_por_id.get(bairro.id_cidade)
        bairros_detalhados.append({
            'id': bairro.id,
            'nome': bairro.nome,
            'id_cidade': bairro.id_cidade,
            'cidade_nome': cidade.nome if cidade else None,
            'cidade_uf': cidade.uf if cidade else None,
        })

    return {
        'stats': {
            'empresas': empresa_repo.contar(db),
            'empresas_ativas': empresa_repo.contar_ativas(db),
            'empresas_inativas': empresa_repo.contar_inativas(db),
            'usuarios': usuario_repo.contar_usuarios(db),
            'pedidos': total_pedidos,
            'faturamento': round(faturamento, 2),
            'bairros': len(bairros),
            'taxa_por_pedido': TAXA_POR_PEDIDO,
            'mes_referencia': reference.strftime('%m/%Y'),
        },
        'empresas': empresas_detalhadas,
        'usuarios': usuarios,
        'pedidos': pedidos_recentes,
        'bairros': bairros_detalhados,
        'cidades': cidades,
    }


@router.post('/bairros', response_model=BairroRead, status_code=status.HTTP_201_CREATED)
def criar_bairro_admin(
    bairro: BairroCreate,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    payload = bairro.model_dump() if hasattr(bairro, 'model_dump') else bairro.dict()
    return bairro_repo.criar(db, payload)


@router.delete('/bairros/{bairro_id}', status_code=status.HTTP_204_NO_CONTENT)
def deletar_bairro_admin(
    bairro_id: int,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    bairro = bairro_repo.deletar(db, bairro_id)
    if not bairro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Bairro nao encontrado')


@router.patch('/empresas/{empresa_id}/status', response_model=EmpresaRead)
def atualizar_status_empresa(
    empresa_id: int,
    data: EmpresaStatusUpdate,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    empresa = empresa_repo.atualizar(db, empresa_id, {'ativo': data.ativo})
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa nao encontrada')
    empresa_repo.bump_cache_version(db, empresa_id)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return empresa


@router.delete('/empresas/{empresa_id}', status_code=status.HTTP_204_NO_CONTENT)
def deletar_empresa_admin(
    empresa_id: int,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    empresa = empresa_repo.deletar(db, empresa_id)
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Empresa nao encontrada')
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')