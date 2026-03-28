from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories import cidade_repo
from app.schemas.cidade import CidadeCreate, CidadeRead

router = APIRouter()


@router.post("/", response_model=CidadeRead, status_code=status.HTTP_201_CREATED)
def criar(cidade: CidadeCreate, db: Session = Depends(get_db)):
    return cidade_repo.criar(db, cidade.model_dump() if hasattr(cidade, 'model_dump') else cidade.dict())


@router.get("/", response_model=list[CidadeRead])
def listar(uf: str | None = Query(default=None), db: Session = Depends(get_db)):
    return cidade_repo.listar(db, uf=uf)


@router.get("/{cidade_id}", response_model=CidadeRead)
def buscar(cidade_id: int, db: Session = Depends(get_db)):
    cidade = cidade_repo.buscar_por_id(db, cidade_id)
    if not cidade:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cidade não encontrada")
    return cidade


@router.delete("/{cidade_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(cidade_id: int, db: Session = Depends(get_db)):
    cidade_repo.deletar(db, cidade_id)
