from sqlalchemy.orm import Session

from app.models.bairro import Bairro
from app.models.empresa_bairro import EmpresaBairro


def vincular(db: Session, vinculo):
    existe = db.query(EmpresaBairro).filter(
        EmpresaBairro.id_empresa == vinculo.id_empresa,
        EmpresaBairro.id_bairro == vinculo.id_bairro,
    ).first()
    if existe:
        return existe

    novo = EmpresaBairro(id_empresa=vinculo.id_empresa, id_bairro=vinculo.id_bairro)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


def listar(db: Session):
    return db.query(EmpresaBairro).all()


def buscar_por_id(db: Session, id_: int):
    return db.query(EmpresaBairro).filter(EmpresaBairro.id == id_).first()


def listar_por_empresa(db: Session, empresa_id: int):
    resultados = db.query(EmpresaBairro, Bairro).join(
        Bairro, EmpresaBairro.id_bairro == Bairro.id
    ).filter(EmpresaBairro.id_empresa == empresa_id).all()

    return [
        {'id': bairro.id, 'nome': bairro.nome, 'id_cidade': bairro.id_cidade}
        for _, bairro in resultados
    ]


def deletar(db: Session, id_: int):
    item = buscar_por_id(db, id_)
    if not item:
        return None
    db.delete(item)
    db.commit()
    return item
