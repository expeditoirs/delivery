from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.repositories import administrador_repo
from app.schemas.administrador import AdministradorCreate, AdministradorRead

router = APIRouter(prefix="/administradores", tags=["Administradores"])

@router.post("/", response_model=AdministradorRead)
def criar_administrador(admin: AdministradorCreate, db: Session = Depends(get_db)):
    existing = administrador_repo.buscar_por_email(db, admin.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    return administrador_repo.criar(db, admin)

@router.get("/", response_model=list[AdministradorRead])
def listar_administradores(db: Session = Depends(get_db)):
    return administrador_repo.listar(db)

@router.get("/{admin_id}", response_model=AdministradorRead)
def buscar_administrador(admin_id: int, db: Session = Depends(get_db)):
    admin = administrador_repo.buscar_por_id(db, admin_id)
    if not admin:
        raise HTTPException(status_code=404, detail="Administrador não encontrado")
    return admin