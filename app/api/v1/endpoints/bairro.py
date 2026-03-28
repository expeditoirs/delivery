from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories import bairro_repo
from app.schemas.bairro import BairroCreate, BairroRead

router = APIRouter()


@router.post("/", response_model=BairroRead, status_code=status.HTTP_201_CREATED)
def criar(bairro: BairroCreate, db: Session = Depends(get_db)):
    payload = bairro.model_dump() if hasattr(bairro, 'model_dump') else bairro.dict()
    return bairro_repo.criar(db, payload)


@router.get("/", response_model=list[BairroRead])
def listar(cidade_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return bairro_repo.listar(db, cidade_id=cidade_id)


@router.get("/{bairro_id}", response_model=BairroRead)
def buscar(bairro_id: int, db: Session = Depends(get_db)):
    bairro = bairro_repo.buscar_por_id(db, bairro_id)
    if not bairro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bairro não encontrado")
    return bairro


@router.delete("/{bairro_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(bairro_id: int, db: Session = Depends(get_db)):
    bairro_repo.deletar(db, bairro_id)
