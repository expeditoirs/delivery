from fastapi import APIRouter
from app.api.v1.endpoints import (
    usuario,
    empresa,
    item,
    pedido,
    categoria,
    cidade,
    bairro,
    empresa_bairro,
    item_mais_pedido,
    admin
)

api_router = APIRouter()

api_router.include_router(usuario.router, prefix="/usuarios", tags=["Usuarios"])
api_router.include_router(empresa.router, prefix="/empresas", tags=["Empresas"])
api_router.include_router(item.router, prefix="/itens", tags=["Itens"])
api_router.include_router(pedido.router, prefix="/pedidos", tags=["Pedidos"])
api_router.include_router(categoria.router, prefix="/categorias", tags=["Categorias"])
api_router.include_router(cidade.router, prefix="/cidades", tags=["Cidades"])
api_router.include_router(bairro.router, prefix="/bairros", tags=["Bairros"])
api_router.include_router(empresa_bairro.router, prefix="/empresa-bairros", tags=["EmpresaBairros"])
api_router.include_router(item_mais_pedido.router, prefix="/top-itens", tags=["TopItens"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

