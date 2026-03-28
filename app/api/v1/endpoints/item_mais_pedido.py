from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.item import Item
from app.schemas.item_mais_pedido import ItemMaisPedidoRead

router = APIRouter()


@router.get('/empresa/{empresa_id}', response_model=list[ItemMaisPedidoRead])
def listar_top_itens_por_empresa(empresa_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Item)
        .filter(Item.id_empresa == empresa_id)
        .order_by(Item.numero_pedidos.desc(), Item.id.desc())
        .limit(10)
        .all()
    )
