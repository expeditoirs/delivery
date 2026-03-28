from collections import defaultdict, deque
from contextlib import asynccontextmanager
from time import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models import (
    administrador,
    bairro,
    categoria,
    cidade,
    comentario_empresa,
    empresa,
    empresa_bairro,
    item,
    pedido,
    pedido_item,
    publicacao_cliente,
    story_empresa,
    usuario,
)  # noqa: F401
from app.api.v1.endpoints import (
    bairro,
    categoria,
    cidade,
    empresa,
    item,
    pedido,
    publicacoes_cliente,
    stories_empresa,
    usuario,
    admin,
)
from app.services_seed import seed_demo_data

_rate_limit_attempts = defaultdict(deque)


def _ensure_database_compatibility():
    db_url = str(engine.url)

    if db_url.startswith('sqlite'):
        statements = [
            'ALTER TABLE empresas ADD COLUMN categoria_empresa VARCHAR(100)',
            'ALTER TABLE usuarios ADD COLUMN nivel_usuario SMALLINT DEFAULT 0',
            'ALTER TABLE usuarios ADD COLUMN id_empresa INTEGER',
            'ALTER TABLE itens ADD COLUMN tipo_produto VARCHAR(50)',
            'ALTER TABLE itens ADD COLUMN configuracao JSON',
            'ALTER TABLE pedidos ADD COLUMN endereco_rua VARCHAR(150)',
            'ALTER TABLE pedidos ADD COLUMN endereco_numero VARCHAR(20)',
            'ALTER TABLE pedidos ADD COLUMN endereco_complemento VARCHAR(150)',
            'ALTER TABLE pedidos ADD COLUMN endereco_bairro VARCHAR(100)',
            'ALTER TABLE pedidos ADD COLUMN endereco_cidade VARCHAR(100)',
            'ALTER TABLE pedidos ADD COLUMN endereco_estado VARCHAR(2)',
            'ALTER TABLE pedido_itens ADD COLUMN nome_item VARCHAR(100)',
            'ALTER TABLE pedido_itens ADD COLUMN observacao TEXT',
            'ALTER TABLE pedido_itens ADD COLUMN tamanho VARCHAR(50)',
            'ALTER TABLE pedido_itens ADD COLUMN sabores JSON',
        ]
    elif db_url.startswith('postgresql'):
        statements = [
            'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS categoria_empresa VARCHAR(100)',
            'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_usuario SMALLINT DEFAULT 0',
            'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_empresa INTEGER',
            'ALTER TABLE itens ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50)',
            'ALTER TABLE itens ADD COLUMN IF NOT EXISTS configuracao JSONB',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_rua VARCHAR(150)',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_numero VARCHAR(20)',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_complemento VARCHAR(150)',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_bairro VARCHAR(100)',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_cidade VARCHAR(100)',
            'ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS endereco_estado VARCHAR(2)',
            'ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS nome_item VARCHAR(100)',
            'ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS observacao TEXT',
            'ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS tamanho VARCHAR(50)',
            'ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS sabores JSONB',
        ]
    else:
        return

    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f'Erro ao executar ajuste de banco: {e}')


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_database_compatibility()

    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS or ['*'])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'Accept', 'Origin'],
)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.100:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={'detail': exc.detail})


@app.get('/')
def root():
    return {'status': 'ok', 'docs': '/docs', 'version': settings.APP_VERSION}


@app.get('/health')
def health():
    return {'status': 'healthy'}


app.include_router(cidade.router, prefix='/api/v1/cidade', tags=['Cidade'])
app.include_router(bairro.router, prefix='/api/v1/bairro', tags=['Bairro'])
app.include_router(empresa.router, prefix='/api/v1/empresa', tags=['Empresa'])
app.include_router(pedido.router, prefix='/api/v1/pedido', tags=['Pedido'])
app.include_router(usuario.router, prefix='/api/v1/usuario', tags=['Usuario'])
app.include_router(categoria.router, prefix='/api/v1/categoria', tags=['Categoria'])
app.include_router(item.router, prefix='/api/v1/item', tags=['Item'])
app.include_router(stories_empresa.router, prefix='/api/v1/story', tags=['Stories'])
app.include_router(publicacoes_cliente.router, prefix='/api/v1/publicacao', tags=['Publicacoes'])
app.include_router(admin.router, prefix='/api/v1/admin', tags=['Admin'])
