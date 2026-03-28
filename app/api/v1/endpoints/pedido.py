from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

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


def _serialize_order(db: Session, pedido):
    usuario = usuario_repo.buscar_usuario(db, pedido.id_usuario)
    itens = pedido_item_repo.listar_por_pedido(db, pedido.id)
    payload = PedidoRead.model_validate(pedido).model_dump()
    payload['cliente_nome'] = getattr(usuario, 'nome', None)
    payload['usuario_nome'] = getattr(usuario, 'nome', None)
    payload['total_itens'] = sum(int(item.quantidade or 0) for item in itens)
    return payload


def _validar_item_configuravel(item_db, item_payload: PedidoItemPayload):
    configuracao = item_db.configuracao or {}
    tipo_produto = (item_db.tipo_produto or configuracao.get('tipo_produto') or '').lower()
    sabores = item_payload.sabores or []

    if tipo_produto == 'pizza':
        tamanhos = configuracao.get('tamanhos') or []
        sabores_cfg = configuracao.get('sabores') or {}
        min_sabores = int(sabores_cfg.get('min', 1))
        max_sabores = int(sabores_cfg.get('max', 4))
        if not item_payload.tamanho:
            raise HTTPException(status_code=400, detail=f'Informe o tamanho da pizza "{item_db.nome}".')
        if len(sabores) < min_sabores or len(sabores) > max_sabores:
            raise HTTPException(status_code=400, detail=f'Pizza "{item_db.nome}" precisa de {min_sabores} a {max_sabores} sabores.')
        tamanho_escolhido = next((t for t in tamanhos if t.get('nome') == item_payload.tamanho), None)
        if not tamanho_escolhido:
            raise HTTPException(status_code=400, detail=f'Tamanho inválido para a pizza "{item_db.nome}".')
        max_sabores_tamanho = int(tamanho_escolhido.get('max_sabores', max_sabores))
        if len(sabores) > max_sabores_tamanho:
            raise HTTPException(status_code=400, detail=f'O tamanho {item_payload.tamanho} aceita até {max_sabores_tamanho} sabores.')
        preco_esperado = float(tamanho_escolhido.get('preco', item_db.preco))
        if round(float(item_payload.preco), 2) != round(preco_esperado, 2):
            raise HTTPException(status_code=400, detail=f'Preço inválido para a pizza "{item_db.nome}".')

    if tipo_produto == 'acai':
        tamanhos = configuracao.get('tamanhos') or []
        if not item_payload.tamanho:
            raise HTTPException(status_code=400, detail=f'Informe o tamanho do açaí "{item_db.nome}".')
        tamanho_escolhido = next((t for t in tamanhos if t.get('nome') == item_payload.tamanho), None)
        if not tamanho_escolhido:
            raise HTTPException(status_code=400, detail=f'Tamanho inválido para o açaí "{item_db.nome}".')
        preco_esperado = float(tamanho_escolhido.get('preco', item_db.preco))
        if round(float(item_payload.preco), 2) != round(preco_esperado, 2):
            raise HTTPException(status_code=400, detail=f'Preço inválido para o açaí "{item_db.nome}".')


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
            _validar_item_configuravel(item_db, item)
            total += float(item.preco) * item.quantidade
            itens_pedido.append({
                'id_item': item.id_item,
                'quantidade': item.quantidade,
                'preco_unitario': float(item.preco),
                'nome_item': item_db.nome,
                'observacao': item.observacao,
                'tamanho': item.tamanho,
                'sabores': item.sabores,
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
        return pedido

    return pedido_repo.criar(db, payload)


@router.get('/', response_model=list[PedidoRead])
def listar_pedidos(db: Session = Depends(get_db)):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar(db)]


@router.get('/empresa/{empresa_id}', response_model=list[PedidoRead])
def listar_pedidos_empresa(empresa_id: int, db: Session = Depends(get_db)):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar_por_empresa(db, empresa_id)]


@router.get('/usuario/{usuario_id}', response_model=list[PedidoRead])
def listar_pedidos_usuario(usuario_id: int, db: Session = Depends(get_db)):
    return [_serialize_order(db, pedido) for pedido in pedido_repo.listar_por_usuario(db, usuario_id)]


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
    return _serialize_order(db, atualizado)
