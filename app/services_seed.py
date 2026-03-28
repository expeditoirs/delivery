from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.empresa import Empresa
from app.models.categoria import Categoria
from app.models.item import Item
from app.models.usuario import Usuario
from app.models.pedido import Pedido
from app.models.publicacao_cliente import PublicacaoCliente
from app.models.story_empresa import StoryEmpresa

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


PIZZA_CONFIG = {
    'tipo_produto': 'pizza',
    'sabores': {'min': 1, 'max': 4},
    'sabores_disponiveis': ['Calabresa', 'Frango com catupiry', 'Portuguesa', 'Marguerita', '4 queijos'],
    'tamanhos': [
        {'nome': 'Pequena', 'preco': 29.9, 'max_sabores': 2},
        {'nome': 'Média', 'preco': 39.9, 'max_sabores': 3},
        {'nome': 'Grande', 'preco': 49.9, 'max_sabores': 4},
    ],
}

ACAI_CONFIG = {
    'tipo_produto': 'acai',
    'tamanhos': [
        {'nome': 'Pequeno', 'preco': 12.0},
        {'nome': 'Médio', 'preco': 16.0},
        {'nome': 'Grande', 'preco': 20.0},
    ],
}


def _empresa_id(empresas, index=0):
    if not empresas:
        return None
    return empresas[min(index, len(empresas) - 1)].id


def _garantir_item_configuravel(db: Session, item_nome: str, tipo: str, configuracao: dict, preco_base: float):
    item = db.query(Item).filter(Item.nome == item_nome).first()
    if item:
        alterado = False
        if item.tipo_produto != tipo:
            item.tipo_produto = tipo
            alterado = True
        if item.configuracao != configuracao:
            item.configuracao = configuracao
            alterado = True
        if float(item.preco or 0) != float(preco_base):
            item.preco = preco_base
            alterado = True
        if alterado:
            db.flush()



def seed_demo_data(db: Session):
    empresas = db.query(Empresa).order_by(Empresa.id.asc()).all()
    if not empresas:
        empresas = [
            Empresa(nome_empresa='Pizza Prime', endereco='Rua das Flores', numero='120', email='loja@pizzaprime.com', senha=_pwd.hash('123456'), categoria_empresa='Pizzaria', horarios_funcionamento='18:00 às 23:30', numero_acessos=128),
            Empresa(nome_empresa='Burger House', endereco='Av. Central', numero='45', email='loja@burgerhouse.com', senha=_pwd.hash('123456'), categoria_empresa='Hamburgueria', horarios_funcionamento='17:00 às 00:00', numero_acessos=96),
            Empresa(nome_empresa='Açaí do Grau', endereco='Praça da Matriz', numero='8', email='loja@acaidograu.com', senha=_pwd.hash('123456'), categoria_empresa='Açaí', horarios_funcionamento='13:00 às 22:00', numero_acessos=80),
        ]
        db.add_all(empresas)
        db.flush()
        empresas = db.query(Empresa).order_by(Empresa.id.asc()).all()

    if db.query(Categoria).count() == 0:
        categorias = [
            Categoria(id_empresa=_empresa_id(empresas, 0), nome='Destaques'),
            Categoria(id_empresa=_empresa_id(empresas, 1), nome='Lanches'),
            Categoria(id_empresa=_empresa_id(empresas, 2), nome='Açaí'),
        ]
        db.add_all(categorias)
        db.flush()
        db.add_all([
            Item(id_empresa=_empresa_id(empresas, 0), id_categoria=categorias[0].id, nome='Pizza calabresa', descricao='Escolha tamanho e até 4 sabores.', preco=29.9, numero_pedidos=30, tipo_produto='pizza', configuracao=PIZZA_CONFIG),
            Item(id_empresa=_empresa_id(empresas, 1), id_categoria=categorias[1].id, nome='Smash bacon', descricao='Burger smash, queijo e bacon', preco=24.9, numero_pedidos=39),
            Item(id_empresa=_empresa_id(empresas, 2), id_categoria=categorias[2].id, nome='Açaí tradicional', descricao='Escolha o tamanho do seu açaí.', preco=12.0, numero_pedidos=29, tipo_produto='acai', configuracao=ACAI_CONFIG),
        ])

    _garantir_item_configuravel(db, 'Pizza calabresa', 'pizza', PIZZA_CONFIG, 29.9)
    _garantir_item_configuravel(db, 'Açaí 500ml', 'acai', ACAI_CONFIG, 12.0)
    _garantir_item_configuravel(db, 'Açaí tradicional', 'acai', ACAI_CONFIG, 12.0)

    primeira_empresa = empresas[0]
    primeira_empresa.email = 'loja@pizzaprime.com'
    primeira_empresa.senha = _pwd.hash('123456')
    if not primeira_empresa.categoria_empresa:
        primeira_empresa.categoria_empresa = 'Loja'

    demos_usuarios = [
        {'nome': 'Maria Clara', 'email': 'maria@email.com', 'numero': '99999-1111', 'nivel_usuario': 0, 'id_empresa': None},
        {'nome': 'João Pedro', 'email': 'joao@email.com', 'numero': '99999-2222', 'nivel_usuario': 0, 'id_empresa': None},
        {'nome': 'Loja Principal', 'email': 'admin@loja.com', 'numero': '99999-3333', 'nivel_usuario': 1, 'id_empresa': primeira_empresa.id},
    ]
    for demo in demos_usuarios:
        existente = db.query(Usuario).filter(Usuario.email == demo['email']).first()
        if not existente:
            db.add(Usuario(nome=demo['nome'], email=demo['email'], senha=_pwd.hash('123456'), numero=demo['numero'], nivel_usuario=demo['nivel_usuario'], id_empresa=demo['id_empresa']))
    db.flush()

    usuarios = db.query(Usuario).order_by(Usuario.id.asc()).all()
    maria = db.query(Usuario).filter(Usuario.email == 'maria@email.com').first() or usuarios[0]
    joao = db.query(Usuario).filter(Usuario.email == 'joao@email.com').first() or usuarios[0]

    if db.query(Pedido).count() == 0:
        db.add_all([
            Pedido(id_empresa=_empresa_id(empresas, 0), id_usuario=maria.id, total=54.9, status='entregue', endereco_rua='Rua das Flores', endereco_numero='90', endereco_bairro='Centro', endereco_cidade='Custódia', endereco_estado='PE'),
            Pedido(id_empresa=_empresa_id(empresas, 1), id_usuario=joao.id, total=29.9, status='em preparo', endereco_rua='Av. Central', endereco_numero='45', endereco_bairro='Centro', endereco_cidade='Custódia', endereco_estado='PE'),
            Pedido(id_empresa=_empresa_id(empresas, 2), id_usuario=maria.id, total=21.9, status='entregue', endereco_rua='Praça da Matriz', endereco_numero='8', endereco_bairro='Centro', endereco_cidade='Custódia', endereco_estado='PE'),
        ])
        db.flush()

    if db.query(StoryEmpresa).count() == 0:
        db.add_all([
            StoryEmpresa(id_empresa=_empresa_id(empresas, 0), imagem_url='promo_pizza'),
            StoryEmpresa(id_empresa=_empresa_id(empresas, 1), imagem_url='promo_burger'),
            StoryEmpresa(id_empresa=_empresa_id(empresas, 2), imagem_url='promo_acai'),
        ])

    pedidos = db.query(Pedido).order_by(Pedido.id.asc()).all()
    if db.query(PublicacaoCliente).count() == 0 and pedidos:
        db.add_all([
            PublicacaoCliente(id_pedido=pedidos[0].id, id_usuario=maria.id, imagem_url='pizza', descricao='A borda veio perfeita e bem recheada. Pedi de novo hoje.', aprovado=True),
            PublicacaoCliente(id_pedido=pedidos[min(1, len(pedidos)-1)].id, id_usuario=joao.id, imagem_url='burger', descricao='Esse smash ficou muito bom, carne no ponto e molho forte.', aprovado=True),
            PublicacaoCliente(id_pedido=pedidos[min(2, len(pedidos)-1)].id, id_usuario=maria.id, imagem_url='acai', descricao='Açaí gelado, chegou rápido e com bastante complemento.', aprovado=True),
        ])

    db.commit()
