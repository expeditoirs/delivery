import sys
import os

# Adiciona a raiz do projeto ao sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.cidade import Cidade
from app.models.administrador import Administrador
from app.models.empresa import Empresa
from app.models.categoria import Categoria
from app.models.item import Item

# ======================================================
# Função para criar o banco (somente para testes)
# ======================================================
def init_db():
    Base.metadata.create_all(bind=engine)

# ======================================================
# Seed de dados
# ======================================================
def seed_data(db: Session):
    # ---------------------------
    # Cidades de Pernambuco
    # ---------------------------
    cidades_pe = [
        ("Recife", "PE"),
        ("Olinda", "PE"),
        ("Caruaru", "PE"),
        ("Petrolina", "PE"),
    ]
    for nome, uf in cidades_pe:
        if not db.query(Cidade).filter_by(nome=nome, uf=uf).first():
            db.add(Cidade(nome=nome, uf=uf))
    db.commit()

    # ---------------------------
    # Administrador
    # ---------------------------
    admin_email = "admin@delivery.com"
    if not db.query(Administrador).filter_by(email=admin_email).first():
        db.add(Administrador(
            email=admin_email,
            senha="123456",  # idealmente hash
            token="",
            ip="127.0.0.1"
        ))
    db.commit()

    # ---------------------------
    # Empresas
    # ---------------------------
    empresas = [
        {"nome_empresa": "Pizzaria do Expedi", "email": "pizzaria@expedi.com"},
        {"nome_empresa": "Lanchonete Berti", "email": "lanche@berti.com"},
    ]
    for emp in empresas:
        if not db.query(Empresa).filter_by(nome_empresa=emp["nome_empresa"]).first():
            db.add(Empresa(
                nome_empresa=emp["nome_empresa"],
                email=emp["email"],
                senha="123456",
                plano_contratado="básico",
                categoria_empresa="Alimentação",
                config_gerais="{}"
            ))
    db.commit()

    # ---------------------------
    # Categorias de itens
    # ---------------------------
    categorias = [
        {"nome": "Pizzas", "descricao": "Pizzas tradicionais"},
        {"nome": "Bebidas", "descricao": "Refrigerantes e sucos"},
    ]
    empresa = db.query(Empresa).first()
    for cat in categorias:
        if not db.query(Categoria).filter_by(nome=cat["nome"], id_empresa=empresa.id).first():
            db.add(Categoria(
                id_empresa=empresa.id,
                nome=cat["nome"],
                descricao=cat["descricao"]
            ))
    db.commit()

    # ---------------------------
    # Itens
    # ---------------------------
    categoria_pizza = db.query(Categoria).filter_by(nome="Pizzas").first()
    categoria_bebida = db.query(Categoria).filter_by(nome="Bebidas").first()

    itens = [
        {"nome": "Pizza Margherita", "descricao": "Mussarela, tomate e manjericão", "preco": 35.50, "categoria": categoria_pizza},
        {"nome": "Coca-Cola 2L", "descricao": "Refrigerante gelado", "preco": 10.00, "categoria": categoria_bebida},
    ]

    for it in itens:
        if not db.query(Item).filter_by(nome=it["nome"], id_empresa=empresa.id).first():
            db.add(Item(
                id_empresa=empresa.id,
                id_categoria=it["categoria"].id,
                nome=it["nome"],
                descricao=it["descricao"],
                preco=it["preco"],
                disponibilidade_horarios="{}",
                img=""
            ))
    db.commit()

# ======================================================
# Teste Pytest para popular o banco
# ======================================================
def test_seed_database():
    init_db()
    db = Session(bind=engine)
    try:
        seed_data(db)
    finally:
        db.close()