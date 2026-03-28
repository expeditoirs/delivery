from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.repositories import pedido_item_repo
from app.schemas.pedido_itens import PedidoItemCreate, PedidoItemRead

router = APIRouter(prefix="/pedido_itens", tags=["PedidoItens"])

@router.post("/", response_model=PedidoItemRead)
def criar_pedido_item(data: PedidoItemCreate, db: Session = Depends(get_db)):
    return pedido_item_repo.criar(db, data.dict())

@router.get("/", response_model=list[PedidoItemRead])
def listar_pedido_itens(db: Session = Depends(get_db)):
    return pedido_item_repo.listar(db)