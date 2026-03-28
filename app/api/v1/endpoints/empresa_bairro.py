from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.repositories import empresa_bairro_repo
from app.schemas.empresa_bairro import EmpresaBairroCreate, EmpresaBairroRead

router = APIRouter()

@router.post("/", response_model=EmpresaBairroRead, status_code=status.HTTP_201_CREATED)
def vincular(vinculo: EmpresaBairroCreate, db: Session = Depends(get_db)):
    return empresa_bairro_repo.vincular(db, vinculo)

@router.get("/", response_model=list[EmpresaBairroRead])
def listar(db: Session = Depends(get_db)):
    return empresa_bairro_repo.listar(db)

@router.get("/{id}", response_model=EmpresaBairroRead)
def buscar(id: int, db: Session = Depends(get_db)):
    item = empresa_bairro_repo.buscar_por_id(db, id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado")
    return item

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(id: int, db: Session = Depends(get_db)):
    empresa_bairro_repo.deletar(db, id)