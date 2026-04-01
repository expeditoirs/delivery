import asyncio
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.cache import publish_json
from app.core.security import decode_token
from app.dependencies import get_db
from app.repositories import item_repo, pedido_item_repo, pedido_repo, usuario_repo
from app.schemas.pedido import PedidoCreate, PedidoRead, PedidoStatusUpdate
from app.schemas.pedido_itens import PedidoItemRead

router = APIRouter()

STATUS_FLOW = {
    'pendente': {'aceito'},
    'aceito': {'em preparo'},
    'em preparo': {'aguardando retirada'},
    'aguardando retirada': {'saiu para entrega', 'entregue'},
    'saiu para entrega': {'entregue'},
    'entregue': set(),
}


class PedidoEnderecoPayload(BaseModel):
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str


class PedidoItemPayload(BaseModel):
    id_item: int
    quantidade: int = Field(gt=0)
    preco: float = Field(gt=0)
    observacao: Optional[str] = None
    tamanho: Optional[str] = None
    sabores: list[str] = Field(default_factory=list)
    complementos: dict = Field(default_factory=dict)


class PedidoCheckout(BaseModel):
    id_empresa: int
    id_usuario: int
    itens: List[PedidoItemPayload]
    endereco: PedidoEnderecoPayload
    status: Optional[str] = 'pendente'


class PedidoCheckoutResponse(BaseModel):
    id: int
    id_empresa: int
    id_usuario: int
    total: float
    status: str
    endereco_rua: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    data_pedido: Optional[datetime] = None

    model_config = {'from_attributes': True}


def _build_order_event(pedido, event_type: str):
    return {
        'type': event_type,
        'order_id': pedido.id,
        'status': pedido.status,
        'store_id': pedido.id_empresa,
        'user_id': pedido.id_usuario,
        'updated_at': datetime.utcnow().isoformat(),
    }


def _publish_order_event(pedido, event_type: str):
    payload = _build_order_event(pedido, event_type)
    publish_json(f'orders:user:{pedido.id_usuario}', payload)
    publish_json(f'orders:store:{pedido.id_empresa}', payload)
    publish_json('orders:admin', payload)


def _get_stream_auth(token: str | None, expected_role: str | None = None):
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token não informado')
    auth = decode_token(token)
    if expected_role and auth['role'] != expected_role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Você não tem permissão para acessar este stream')
    return auth


async def _redis_event_stream(channel: str, heartbeat_payload: dict):
    from app.core.cache import get_redis_client

    client = get_redis_client()
    if not client:
        while True:
            yield f"event: heartbeat\ndata: {json.dumps(heartbeat_payload)}\n\n"
            await asyncio.sleep(20)

    pubsub = client.pubsub(ignore_subscribe_messages=True)
    await asyncio.to_thread(pubsub.subscribe, channel)

    try:
        yield f"event: heartbeat\ndata: {json.dumps(heartbeat_payload)}\n\n"
        while True:
            message = await asyncio.to_thread(pubsub.get_message, timeout=15.0)
            if message and message.get('type') == 'message':
                data = message.get('data')
                if isinstance(data, bytes):
                    data = data.decode('utf-8')
                yield f"event: order-update\ndata: {data}\n\n"
                continue
            yield f"event: heartbeat\ndata: {json.dumps(heartbeat_payload)}\n\n"
            await asyncio.sleep(0.1)
    finally:
        await asyncio.to_thread(pubsub.close)


def _serialize_order(db: Session, pedido):
    usuario = usuario_repo.buscar_usuario(db, pedido.id_usuario)
    itens = pedido_item_repo.listar_por_pedido(db, pedido.id)
    payload = PedidoRead.model_validate(pedido).model_dump()
    payload['cliente_nome'] = getattr(usuario, 'nome', None)
    payload['usuario_nome'] = getattr(usuario, 'nome', None)
    payload['total_itens'] = sum(int(item.quantidade or 0) for item in itens)
    return payload


def _to_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _find_size(configuracao: dict, nome_tamanho: str | None):
    if not nome_tamanho:
        return None
    return next((t for t in configuracao.get('tamanhos') or [] if str(t.get('nome')) == str(nome_tamanho)), None)


def _find_flavor_group(configuracao: dict):
    grupos = configuracao.get('grupos_opcoes') or []
    grupo = next((item for item in grupos if item.get('tipo_grupo') == 'sabores'), None)
    if grupo:
        return grupo

    sabores_disponiveis = configuracao.get('sabores_disponiveis') or []
    if sabores_disponiveis:
        return {
            'nome': 'Sabores',
            'tipo_grupo': 'sabores',
            'min': (configuracao.get('sabores') or {}).get('min', 1),
            'max': (configuracao.get('sabores') or {}).get('max', 2),
            'regra_preco': 'maior_preco',
            'itens': [{'nome': nome, 'preco': 0} for nome in sabores_disponiveis],
        }

    return None


def _resolve_flavor_price(option: dict, tamanho: dict | None, fallback: float) -> float:
    size_name = (tamanho or {}).get('nome')
    if size_name and option.get('precos_por_tamanho') and option['precos_por_tamanho'].get(size_name) is not None:
        return _to_float(option['precos_por_tamanho'].get(size_name))
    if option.get('preco') is not None:
        return _to_float(option.get('preco'))
    return fallback


def _validar_complementos(configuracao: dict, complementos: dict):
    adicionais_catalogo = {item['nome']: item for item in (configuracao.get('adicionais') or []) if item.get('nome')}
    grupos_catalogo = {
        grupo['nome']: grupo
        for grupo in (configuracao.get('grupos_opcoes') or [])
        if grupo.get('nome') and grupo.get('tipo_grupo') != 'sabores'
    }

    normalized_adicionais = []
    adicionais_total = 0.0
    for adicional in complementos.get('adicionais') or []:
        nome = str(adicional.get('nome') or '').strip()
        quantidade = int(adicional.get('quantidade') or 0)
        if not nome or quantidade < 1:
            continue
        base = adicionais_catalogo.get(nome)
        if not base:
            raise HTTPException(status_code=400, detail=f'Adicional "{nome}" não encontrado.')
        preco = _to_float(base.get('preco'))
        adicionais_total += preco * quantidade
        normalized_adicionais.append({'nome': nome, 'preco': preco, 'quantidade': quantidade})

    grupos_payload = {grupo.get('grupo_nome'): grupo for grupo in (complementos.get('grupos') or []) if grupo.get('grupo_nome')}
    normalized_grupos = []
    grupos_total = 0.0

    for grupo_nome, grupo_cfg in grupos_catalogo.items():
        selecionado = grupos_payload.get(grupo_nome, {'itens': []})
        itens_payload = selecionado.get('itens') or []
        min_items = int(grupo_cfg.get('min') or 0)
        max_items = int(grupo_cfg.get('max') or 0)
        obrigatorio = bool(grupo_cfg.get('obrigatorio'))

        if obrigatorio and len(itens_payload) < max(min_items, 1):
            raise HTTPException(status_code=400, detail=f'Selecione as opções obrigatórias de "{grupo_nome}".')
        if min_items and len(itens_payload) < min_items:
            raise HTTPException(status_code=400, detail=f'O grupo "{grupo_nome}" exige pelo menos {min_items} opções.')
        if max_items and len(itens_payload) > max_items:
            raise HTTPException(status_code=400, detail=f'O grupo "{grupo_nome}" aceita no máximo {max_items} opções.')

        opcoes_catalogo = {item['nome']: item for item in (grupo_cfg.get('itens') or []) if item.get('nome')}
        itens_normalizados = []
        for item in itens_payload:
            nome = str(item.get('nome') or '').strip()
            if not nome:
                continue
            base = opcoes_catalogo.get(nome)
            if not base:
                raise HTTPException(status_code=400, detail=f'Opção "{nome}" não encontrada no grupo "{grupo_nome}".')
            preco = _to_float(base.get('preco'))
            grupos_total += preco
            itens_normalizados.append({'nome': nome, 'preco': preco})

        if itens_normalizados:
            normalized_grupos.append({'grupo_nome': grupo_nome, 'itens': itens_normalizados})

    return adicionais_total + grupos_total, {
        'adicionais': normalized_adicionais,
        'grupos': normalized_grupos,
    }


def _validar_item_configuravel(item_db, item_payload: PedidoItemPayload):
    configuracao = item_db.configuracao or {}
    tipo_produto = (item_db.tipo_produto or configuracao.get('tipo_produto') or '').lower()
    sabores = item_payload.sabores or []
    complementos = item_payload.complementos or {}
    tamanho_escolhido = _find_size(configuracao, item_payload.tamanho)
    flavor_group = _find_flavor_group(configuracao)
    possui_tamanhos = bool(configuracao.get('tamanhos'))

    if possui_tamanhos and not item_payload.tamanho:
        raise HTTPException(status_code=400, detail=f'Informe o tamanho de "{item_db.nome}".')
    if item_payload.tamanho and not tamanho_escolhido:
        raise HTTPException(status_code=400, detail=f'Tamanho inválido para "{item_db.nome}".')

    preco_esperado = _to_float(configuracao.get('preco_fixo'), _to_float(item_db.preco))
    if tamanho_escolhido:
        preco_esperado = _to_float(tamanho_escolhido.get('preco'), preco_esperado)

    if flavor_group:
        if not sabores:
            raise HTTPException(status_code=400, detail=f'Escolha ao menos um sabor para "{item_db.nome}".')
        min_sabores = int((tamanho_escolhido or {}).get('min_sabores') or flavor_group.get('min') or 1)
        max_sabores = int((tamanho_escolhido or {}).get('max_sabores') or flavor_group.get('max') or 2)
        if len(sabores) < min_sabores or len(sabores) > max_sabores:
            raise HTTPException(status_code=400, detail=f'"{item_db.nome}" precisa de {min_sabores} a {max_sabores} sabores.')
        opcoes = {item['nome']: item for item in (flavor_group.get('itens') or []) if item.get('nome')}
        precos_sabores = []
        for sabor in sabores:
            option = opcoes.get(sabor)
            if not option:
                raise HTTPException(status_code=400, detail=f'Sabor "{sabor}" não encontrado.')
            precos_sabores.append(_resolve_flavor_price(option, tamanho_escolhido, preco_esperado))
        if flavor_group.get('regra_preco') == 'soma_proporcional':
            preco_esperado = sum(precos_sabores) / len(precos_sabores)
        else:
            preco_esperado = max(precos_sabores)
    elif tipo_produto in {'pizza', 'acai'} and possui_tamanhos and not tamanho_escolhido:
        raise HTTPException(status_code=400, detail=f'Informe o tamanho de "{item_db.nome}".')

    extras_total, complementos_normalizados = _validar_complementos(configuracao, complementos)
    preco_esperado = round(preco_esperado + extras_total, 2)

    if round(float(item_payload.preco), 2) != preco_esperado:
        raise HTTPException(status_code=400, detail=f'Preço inválido para "{item_db.nome}".')

    return complementos_normalizados


@router.post('/', response_model=PedidoCheckoutResponse, status_code=status.HTTP_201_CREATED)
def criar_pedido(data: PedidoCreate | PedidoCheckout, db: Session = Depends(get_db)):
    payload = data.model_dump() if hasattr(data, 'model_dump') else data.dict()

    if 'itens' in payload:
        total = 0.0
        itens_pedido = []
        for item in data.itens:
            item_db = item_repo.buscar_por_id(db, item.id_item)
            if not item_db:
                raise HTTPException(status_code=404, detail=f'Item {item.id_item} não encontrado.')
            if item_db.id_empresa != data.id_empresa:
                raise HTTPException(status_code=400, detail='Carrinho possui item de outra loja.')

            complementos_normalizados = _validar_item_configuravel(item_db, item)
            total += float(item.preco) * item.quantidade
            itens_pedido.append({
                'id_item': item.id_item,
                'quantidade': item.quantidade,
                'preco_unitario': float(item.preco),
                'nome_item': item_db.nome,
                'observacao': item.observacao,
                'tamanho': item.tamanho,
                'sabores': item.sabores,
                'complementos': complementos_normalizados,
            })

        pedido = pedido_repo.criar(db, {
            'id_empresa': data.id_empresa,
            'id_usuario': data.id_usuario,
            'total': round(total, 2),
            'status': data.status or 'pendente',
            'endereco_rua': data.endereco.rua,
            'endereco_numero': data.endereco.numero,
            'endereco_complemento': data.endereco.complemento,
            'endereco_bairro': data.endereco.bairro,
            'endereco_cidade': data.endereco.cidade,
            'endereco_estado': data.endereco.estado,
        })
        pedido_item_repo.criar_lote(db, [{**item, 'id_pedido': pedido.id} for item in itens_pedido])
        _publish_order_event(pedido, 'created')
        return pedido

    pedido = pedido_repo.criar(db, payload)
    _publish_order_event(pedido, 'created')
    return pedido


@router.get('/', response_model=list[PedidoRead])
def listar_pedidos(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar(db, offset=offset, limit=limit)]


@router.get('/empresa/{empresa_id}', response_model=list[PedidoRead])
def listar_pedidos_empresa(
    empresa_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar_por_empresa(db, empresa_id, offset=offset, limit=limit)]


@router.get('/usuario/{usuario_id}', response_model=list[PedidoRead])
def listar_pedidos_usuario(
    usuario_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar_por_usuario(db, usuario_id, offset=offset, limit=limit)]


@router.get('/stream/usuario')
async def stream_pedidos_usuario(token: str = Query(default=None)):
    auth = _get_stream_auth(token, expected_role='user')
    return StreamingResponse(
        _redis_event_stream(
            f"orders:user:{auth['entity_id']}",
            {'scope': 'user', 'user_id': auth['entity_id']},
        ),
        media_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive'},
    )


@router.get('/stream/loja')
async def stream_pedidos_loja(token: str = Query(default=None)):
    auth = _get_stream_auth(token, expected_role='store')
    return StreamingResponse(
        _redis_event_stream(
            f"orders:store:{auth['entity_id']}",
            {'scope': 'store', 'store_id': auth['entity_id']},
        ),
        media_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive'},
    )


@router.get('/stream/admin')
async def stream_pedidos_admin(token: str = Query(default=None)):
    auth = _get_stream_auth(token, expected_role='admin')
    return StreamingResponse(
        _redis_event_stream(
            'orders:admin',
            {'scope': 'admin', 'admin_id': auth['entity_id']},
        ),
        media_type='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'Connection': 'keep-alive'},
    )


@router.get('/{pedido_id}', response_model=PedidoRead)
def buscar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = pedido_repo.buscar_por_id(db, pedido_id)
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido não encontrado')
    return _serialize_order(db, pedido)


@router.get('/{pedido_id}/itens', response_model=list[PedidoItemRead])
def buscar_itens_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = pedido_repo.buscar_por_id(db, pedido_id)
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido não encontrado')
    return pedido_item_repo.listar_por_pedido(db, pedido_id)


@router.put('/{pedido_id}/status', response_model=PedidoRead)
def atualizar_status_pedido(pedido_id: int, data: PedidoStatusUpdate, db: Session = Depends(get_db)):
    pedido = pedido_repo.buscar_por_id(db, pedido_id)
    if not pedido:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido não encontrado')

    atual = str(pedido.status or '').lower().strip()
    novo = str(data.status or '').lower().strip()
    if atual == novo:
        return _serialize_order(db, pedido)
    permitidos = STATUS_FLOW.get(atual, set())
    if novo not in permitidos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Transição inválida de {atual} para {novo}')

    atualizado = pedido_repo.atualizar(db, pedido_id, {'status': novo})
    _publish_order_event(atualizado, 'status_changed')
    return _serialize_order(db, atualizado)
