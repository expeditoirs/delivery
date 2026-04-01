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
from app.api.v1.router import api_router
from app.services_seed import seed_demo_data

_rate_limit_attempts = defaultdict(deque)


def _ensure_database_compatibility():
    db_url = str(engine.url)

    if db_url.startswith('sqlite'):
        statements = [
            'ALTER TABLE empresas ADD COLUMN categoria_empresa VARCHAR(100)',
            'ALTER TABLE empresas ADD COLUMN categorias_empresa TEXT',
            'ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT 1',
            'ALTER TABLE empresas ADD COLUMN cache_version INTEGER DEFAULT 1',
            'ALTER TABLE usuarios ADD COLUMN nivel_usuario SMALLINT DEFAULT 0',
            'ALTER TABLE usuarios ADD COLUMN id_empresa INTEGER',
            'ALTER TABLE itens ADD COLUMN tipo_produto VARCHAR(50)',
            'ALTER TABLE itens ADD COLUMN configuracao JSON',
            'ALTER TABLE itens ADD COLUMN ativo BOOLEAN DEFAULT 1',
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
            'ALTER TABLE pedido_itens ADD COLUMN complementos JSON',
            'CREATE INDEX idx_itens_empresa_ativo ON itens (id_empresa, ativo)',
            'CREATE INDEX idx_itens_categoria_ativo ON itens (id_categoria, ativo)',
            'CREATE INDEX idx_categorias_empresa ON categorias (id_empresa)',
            'CREATE INDEX idx_pedidos_empresa_data ON pedidos (id_empresa, data_pedido)',
            'CREATE INDEX idx_pedidos_usuario_data ON pedidos (id_usuario, data_pedido)',
            'CREATE INDEX idx_pedidos_status_data ON pedidos (status, data_pedido)',
            'CREATE INDEX idx_publicacoes_aprovado_criado ON publicacoes_cliente (aprovado, criado_em)',
            'CREATE INDEX idx_stories_empresa_criado ON stories_empresa (id_empresa, criado_em)',
        ]
    elif db_url.startswith('postgresql'):
        statements = [
            'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS categoria_empresa VARCHAR(100)',
            'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS categorias_empresa TEXT',
            'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE',
            'ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cache_version INTEGER DEFAULT 1',
            'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_usuario SMALLINT DEFAULT 0',
            'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_empresa INTEGER',
            'ALTER TABLE itens ADD COLUMN IF NOT EXISTS tipo_produto VARCHAR(50)',
            'ALTER TABLE itens ADD COLUMN IF NOT EXISTS configuracao JSONB',
            'ALTER TABLE itens ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE',
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
            'ALTER TABLE pedido_itens ADD COLUMN IF NOT EXISTS complementos JSONB',
            'ALTER TABLE itens ALTER COLUMN nome TYPE TEXT',
            'ALTER TABLE itens ALTER COLUMN descricao TYPE TEXT',
            'ALTER TABLE itens ALTER COLUMN disponibilidade_horarios TYPE TEXT',
            'ALTER TABLE itens ALTER COLUMN img TYPE TEXT',
            'ALTER TABLE itens ALTER COLUMN tipo_produto TYPE TEXT',
            'ALTER TABLE publicacoes_cliente ALTER COLUMN imagem_url TYPE TEXT',
            'ALTER TABLE publicacoes_cliente ALTER COLUMN descricao TYPE TEXT',
            'CREATE INDEX IF NOT EXISTS idx_itens_empresa_ativo ON itens (id_empresa, ativo)',
            'CREATE INDEX IF NOT EXISTS idx_itens_categoria_ativo ON itens (id_categoria, ativo)',
            'CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias (id_empresa)',
            'CREATE INDEX IF NOT EXISTS idx_pedidos_empresa_data ON pedidos (id_empresa, data_pedido DESC)',
            'CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_data ON pedidos (id_usuario, data_pedido DESC)',
            'CREATE INDEX IF NOT EXISTS idx_pedidos_status_data ON pedidos (status, data_pedido DESC)',
            'CREATE INDEX IF NOT EXISTS idx_publicacoes_aprovado_criado ON publicacoes_cliente (aprovado, criado_em DESC)',
            'CREATE INDEX IF NOT EXISTS idx_stories_empresa_criado ON stories_empresa (id_empresa, criado_em DESC)',
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

allowed_hosts = settings.ALLOWED_HOSTS or ['*']
if '*' not in allowed_hosts:
    allowed_hosts = [*allowed_hosts, 'localhost', '127.0.0.1']

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
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


# Rotas legadas em singular, mantidas por compatibilidade com o frontend atual.
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

# Rotas v1 canonicas em plural, incluindo empresa-bairros.
app.include_router(api_router, prefix='/api/v1')
