from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.cache import cached, invalidate_prefix
from app.dependencies import get_db
from app.models.pedido import Pedido
from app.models.publicacao_cliente import PublicacaoCliente
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.schemas.publicacoes_cliente import PublicacaoClienteCreate, PublicacaoClienteRead, PublicacaoFeedRead

router = APIRouter()


@router.post('/', response_model=PublicacaoClienteRead)
def criar_publicacao(data: PublicacaoClienteCreate, db: Session = Depends(get_db)):
    publicacao = PublicacaoCliente(**data.model_dump())
    db.add(publicacao)
    db.commit()
    db.refresh(publicacao)
    invalidate_prefix('feed:publicacoes')
    return publicacao


@router.get('/', response_model=list[PublicacaoFeedRead])
@cached('feed:publicacoes', ttl=90)
def listar_publicacoes(db: Session = Depends(get_db)):
    rows = (
        db.query(PublicacaoCliente, Usuario, Pedido, Empresa)
        .join(Usuario, Usuario.id == PublicacaoCliente.id_usuario)
        .join(Pedido, Pedido.id == PublicacaoCliente.id_pedido)
        .join(Empresa, Empresa.id == Pedido.id_empresa)
        .filter(PublicacaoCliente.aprovado == True)
        .order_by(PublicacaoCliente.criado_em.desc())
        .all()
    )
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
        )
        for publicacao, usuario, pedido, empresa in rows
    ]
