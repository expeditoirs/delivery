from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.cache import invalidate_prefix
from app.dependencies import get_db
from app.repositories import categoria_repo, empresa_repo
from app.schemas.categoria import CategoriaCreate, CategoriaRead

router = APIRouter()


@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def criar(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    criada = categoria_repo.criar(db, categoria)
    empresa_repo.bump_cache_version(db, criada.id_empresa)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
    return criada


@router.get("/", response_model=list[CategoriaRead])
def listar(
    empresa_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
):
    if empresa_id is not None:
        return categoria_repo.listar_por_empresa(db, empresa_id)
    return categoria_repo.listar(db)


@router.get("/{categoria_id}", response_model=CategoriaRead)
def buscar(categoria_id: int, db: Session = Depends(get_db)):
    categoria = categoria_repo.buscar_por_id(db, categoria_id)
    if not categoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada")
    return categoria


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar(categoria_id: int, db: Session = Depends(get_db)):
    categoria = categoria_repo.buscar_por_id(db, categoria_id)
    if categoria:
        empresa_repo.bump_cache_version(db, categoria.id_empresa)
    categoria_repo.deletar(db, categoria_id)
    invalidate_prefix('empresas')
    invalidate_prefix('itens:')
