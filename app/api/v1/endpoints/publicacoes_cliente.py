from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.cache import invalidate_prefix
from app.core.security import get_current_user_id, require_user
from app.dependencies import get_db
from app.models.empresa import Empresa
from app.models.pedido import Pedido
from app.models.publicacao_cliente import PublicacaoCliente
from app.models.usuario import Usuario
from app.schemas.publicacoes_cliente import PublicacaoClienteCreate, PublicacaoClienteRead, PublicacaoFeedRead
from app.utils.content_moderation import contains_profanity
from app.utils.image_codec import pack_image_payload

router = APIRouter()

FINAL_STATUS = 'entregue'


def _build_feed_score(publicacao, pedido, empresa_id: int, order_affinity: dict[int, int]) -> float:
    now = datetime.now(timezone.utc)
    criado_em = publicacao.criado_em or now
    if criado_em.tzinfo is None:
        criado_em = criado_em.replace(tzinfo=timezone.utc)
    hours_old = max(0.0, (now - criado_em).total_seconds() / 3600)
    recency_score = max(0.0, 96 - hours_old) / 24
    affinity_score = float(order_affinity.get(empresa_id, 0)) * 2.5
    order_value_score = min(float(pedido.total or 0) / 40.0, 3.0)
    freshness_bonus = 1.5 if hours_old <= 12 else 0.0
    return round(recency_score + affinity_score + order_value_score + freshness_bonus, 4)


@router.post('/', response_model=PublicacaoClienteRead, status_code=status.HTTP_201_CREATED)
def criar_publicacao(
    data: PublicacaoClienteCreate,
    _: dict = Depends(require_user),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if data.id_usuario != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Voce nao pode publicar em nome de outro usuario')

    pedido = db.query(Pedido).filter(Pedido.id == data.id_pedido).first()
    if not pedido or pedido.id_usuario != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Pedido nao encontrado para este usuario')

    if str(pedido.status or '').lower().strip() != FINAL_STATUS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='So e possivel publicar pedidos finalizados e entregues')

    descricao = (data.descricao or '').strip() or 'Compartilhando meu pedido'
    if contains_profanity(descricao):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Remova palavroes ou ofensas antes de publicar')

    publicacao_existente = (
        db.query(PublicacaoCliente)
        .filter(PublicacaoCliente.id_pedido == pedido.id, PublicacaoCliente.id_usuario == user_id)
        .first()
    )
    if publicacao_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Este pedido ja foi publicado no feed')

    try:
        imagem_payload = pack_image_payload(data.imagem_url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    publicacao = PublicacaoCliente(
        id_pedido=data.id_pedido,
        id_usuario=user_id,
        imagem_url=imagem_payload,
        descricao=descricao,
        aprovado=True,
    )
    db.add(publicacao)
    try:
        db.commit()
    except DataError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='A imagem ficou grande demais para salvar. Tente uma foto menor.') from exc
    db.refresh(publicacao)
    invalidate_prefix('feed:publicacoes')
    return publicacao


@router.get('/', response_model=list[PublicacaoFeedRead])
def listar_publicacoes(
    limit: int = Query(default=30, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    empresa_id: int | None = Query(default=None, ge=1),
    viewer_user_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
):
    query = (
        db.query(PublicacaoCliente, Usuario, Pedido, Empresa)
        .join(Usuario, Usuario.id == PublicacaoCliente.id_usuario)
        .join(Pedido, Pedido.id == PublicacaoCliente.id_pedido)
        .join(Empresa, Empresa.id == Pedido.id_empresa)
        .filter(PublicacaoCliente.aprovado == True)
    )
    if empresa_id is not None:
        query = query.filter(Empresa.id == empresa_id)

    rows = query.all()

    order_affinity = {}
    if viewer_user_id is not None:
        user_orders = db.query(Pedido.id_empresa).filter(Pedido.id_usuario == viewer_user_id).all()
        for order in user_orders:
            order_affinity[order.id_empresa] = order_affinity.get(order.id_empresa, 0) + 1

    rows_with_scores = [
        (
            publicacao,
            usuario,
            pedido,
            empresa,
            _build_feed_score(publicacao, pedido, empresa.id, order_affinity),
        )
        for publicacao, usuario, pedido, empresa in rows
    ]
    rows_with_scores.sort(key=lambda item: (item[4], item[0].criado_em), reverse=True)
    rows_with_scores = rows_with_scores[offset:offset + limit]

    return [
        PublicacaoFeedRead(
            id=publicacao.id,
            id_pedido=publicacao.id_pedido,
            id_usuario=publicacao.id_usuario,
            imagem_url=publicacao.imagem_url,
            descricao=publicacao.descricao,
            aprovado=publicacao.aprovado,
            criado_em=publicacao.criado_em,
            usuario_nome=usuario.nome,
            empresa_nome=empresa.nome_empresa,
            id_empresa=empresa.id,
            total_pedido=float(pedido.total),
            feed_score=score,
        )
        for publicacao, usuario, pedido, empresa, score in rows_with_scores
    ]
