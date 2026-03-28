from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.repositories import comentario_empresa_repo
from app.schemas.comentarios_empresa import ComentarioEmpresaCreate, ComentarioEmpresaRead

router = APIRouter(prefix="/comentarios_empresa", tags=["ComentariosEmpresa"])

@router.post("/", response_model=ComentarioEmpresaRead)
def criar_comentario(data: ComentarioEmpresaCreate, db: Session = Depends(get_db)):
    return comentario_empresa_repo.criar(db, data.dict())

@router.get("/", response_model=list[ComentarioEmpresaRead])
def listar_comentarios(db: Session = Depends(get_db)):
    return comentario_empresa_repo.listar(db)