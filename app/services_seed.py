from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.administrador import Administrador
from app.models.bairro import Bairro
from app.models.categoria import Categoria
from app.models.cidade import Cidade
from app.models.empresa import Empresa
from app.models.item import Item
from app.models.pedido import Pedido
from app.models.publicacao_cliente import PublicacaoCliente
from app.models.story_empresa import StoryEmpresa
from app.models.usuario import Usuario

_pwd = CryptContext(schemes=['argon2'], deprecated='auto')


PIZZA_CONFIG = {
    'tipo_produto': 'pizza',
    'permite_observacao': True,
    'tamanhos': [
        {'nome': 'Pequena', 'preco': 29.9, 'min_sabores': 1, 'max_sabores': 1},
        {'nome': 'Media', 'preco': 39.9, 'min_sabores': 2, 'max_sabores': 2},
        {'nome': 'Grande', 'preco': 49.9, 'min_sabores': 2, 'max_sabores': 2},
    ],
    'adicionais': [
        {'nome': 'Borda recheada', 'preco': 8.0},
        {'nome': 'Queijo extra', 'preco': 5.0},
    ],
    'grupos_opcoes': [
        {
            'nome': 'Sabores',
            'tipo_grupo': 'sabores',
            'min': 1,
            'max': 2,
            'obrigatorio': True,
            'divisivel': True,
            'regra_preco': 'maior_preco',
            'itens': [
                {'nome': 'Calabresa', 'preco': 29.9, 'precos_por_tamanho': {'Pequena': 29.9, 'Media': 39.9, 'Grande': 49.9}},
                {'nome': 'Frango com catupiry', 'preco': 31.9, 'precos_por_tamanho': {'Pequena': 31.9, 'Media': 43.9, 'Grande': 53.9}},
                {'nome': 'Portuguesa', 'preco': 33.9, 'precos_por_tamanho': {'Pequena': 33.9, 'Media': 45.9, 'Grande': 55.9}},
                {'nome': 'Marguerita', 'preco': 30.9, 'precos_por_tamanho': {'Pequena': 30.9, 'Media': 41.9, 'Grande': 51.9}},
                {'nome': '4 queijos', 'preco': 35.9, 'precos_por_tamanho': {'Pequena': 35.9, 'Media': 47.9, 'Grande': 57.9}},
            ],
        }
    ],
}

ACAI_CONFIG = {
    'tipo_produto': 'acai',
    'permite_observacao': True,
    'tamanhos': [
        {'nome': 'Pequeno', 'preco': 12.0},
        {'nome': 'Medio', 'preco': 16.0},
        {'nome': 'Grande', 'preco': 20.0},
    ],
    'adicionais': [
        {'nome': 'Leite condensado', 'preco': 2.5},
        {'nome': 'Granola', 'preco': 2.0},
    ],
}

NORTHEAST_CITIES = [
    {'uf': 'AL', 'nome': 'Maceio', 'bairros': ['Centro', 'Ponta Verde', 'Jatiuca', 'Farol', 'Mangabeiras']},
    {'uf': 'BA', 'nome': 'Salvador', 'bairros': ['Barra', 'Pituba', 'Itapua', 'Brotas', 'Rio Vermelho']},
    {'uf': 'CE', 'nome': 'Fortaleza', 'bairros': ['Aldeota', 'Meireles', 'Benfica', 'Messejana', 'Centro']},
    {'uf': 'MA', 'nome': 'Sao Luis', 'bairros': ['Renascenca', 'Cohama', 'Centro', 'Turu', 'Calhau']},
    {'uf': 'PB', 'nome': 'Joao Pessoa', 'bairros': ['Tambau', 'Manaira', 'Bessa', 'Centro', 'Bancarios']},
    {'uf': 'PE', 'nome': 'Recife', 'bairros': ['Boa Viagem', 'Casa Forte', 'Madalena', 'Boa Vista', 'Pina']},
    {'uf': 'PE', 'nome': 'Custodia', 'bairros': ['Centro', 'Redencao', 'Rodoviaria', 'Capoeiras', 'Vila da Cohab']},
    {'uf': 'PI', 'nome': 'Teresina', 'bairros': ['Centro', 'Jockey', 'Ilhotas', 'Dirceu', 'Ininga']},
    {'uf': 'RN', 'nome': 'Natal', 'bairros': ['Ponta Negra', 'Tirol', 'Petropolis', 'Alecrim', 'Cidade Alta']},
    {'uf': 'SE', 'nome': 'Aracaju', 'bairros': ['Atalaia', 'Jardins', '13 de Julho', 'Siqueira Campos', 'Centro']},
]


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


def _garantir_admin_demo(db: Session):
    admin_demo_email = 'admin@loja.com'
    admin_demo_senha = '123456'

    admin = db.query(Administrador).filter(Administrador.email == admin_demo_email).first()
    if not admin:
        db.add(
            Administrador(
                email=admin_demo_email,
                senha=_pwd.hash(admin_demo_senha),
            )
        )
        db.flush()
        return

    if not admin.senha or not _pwd.verify(admin_demo_senha, admin.senha):
        admin.senha = _pwd.hash(admin_demo_senha)
        db.flush()


def _garantir_empresa_demo(db: Session, *, nome_empresa: str, email: str, senha: str, endereco: str, numero: str, categoria: str, horarios: str, numero_acessos: int = 0):
    empresa = db.query(Empresa).filter(Empresa.email == email).first()
    if not empresa:
        empresa = Empresa(
            nome_empresa=nome_empresa,
            endereco=endereco,
            numero=numero,
            email=email,
            senha=_pwd.hash(senha),
            categoria_empresa=categoria,
            horarios_funcionamento=horarios,
            numero_acessos=numero_acessos,
        )
        db.add(empresa)
        db.flush()
        return empresa

    empresa.nome_empresa = nome_empresa
    empresa.endereco = endereco
    empresa.numero = numero
    empresa.email = email
    empresa.senha = _pwd.hash(senha)
    empresa.categoria_empresa = categoria
    empresa.horarios_funcionamento = horarios
    empresa.numero_acessos = numero_acessos
    db.flush()
    return empresa


def _garantir_usuario_demo(db: Session, *, nome: str, email: str, senha: str, numero: str, nivel_usuario: int = 0, id_empresa: int | None = None):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        usuario = Usuario(
            nome=nome,
            email=email,
            senha=_pwd.hash(senha),
            numero=numero,
            nivel_usuario=nivel_usuario,
            id_empresa=id_empresa,
        )
        db.add(usuario)
        db.flush()
        return usuario

    usuario.nome = nome
    usuario.email = email
    usuario.senha = _pwd.hash(senha)
    usuario.numero = numero
    usuario.nivel_usuario = nivel_usuario
    usuario.id_empresa = id_empresa
    db.flush()
    return usuario


def _garantir_cidades_bairros_nordeste(db: Session):
    for cidade_data in NORTHEAST_CITIES:
        cidade = (
            db.query(Cidade)
            .filter(Cidade.nome == cidade_data['nome'], Cidade.uf == cidade_data['uf'])
            .first()
        )
        if not cidade:
            cidade = Cidade(nome=cidade_data['nome'], uf=cidade_data['uf'])
            db.add(cidade)
            db.flush()

        bairros_existentes = {
            bairro.nome
            for bairro in db.query(Bairro).filter(Bairro.id_cidade == cidade.id).all()
        }
        for nome_bairro in cidade_data['bairros']:
            if nome_bairro in bairros_existentes:
                continue
            db.add(Bairro(id_cidade=cidade.id, nome=nome_bairro))
        db.flush()


def seed_demo_data(db: Session):
    _garantir_admin_demo(db)
    _garantir_cidades_bairros_nordeste(db)

    _garantir_empresa_demo(
        db,
        nome_empresa='Pizza Prime',
        email='loja@pizzaprime.com',
        senha='123456',
        endereco='Rua das Flores',
        numero='120',
        categoria='Pizzaria',
        horarios='18:00 as 23:30',
        numero_acessos=128,
    )
    _garantir_empresa_demo(
        db,
        nome_empresa='Burger House',
        email='loja@burgerhouse.com',
        senha='123456',
        endereco='Av. Central',
        numero='45',
        categoria='Hamburgueria',
        horarios='17:00 as 00:00',
        numero_acessos=96,
    )
    _garantir_empresa_demo(
        db,
        nome_empresa='Acai do Grau',
        email='loja@acaidograu.com',
        senha='123456',
        endereco='Praca da Matriz',
        numero='8',
        categoria='Acai',
        horarios='13:00 as 22:00',
        numero_acessos=80,
    )

    empresas = db.query(Empresa).order_by(Empresa.id.asc()).all()

    if db.query(Categoria).count() == 0:
        categorias = [
            Categoria(id_empresa=_empresa_id(empresas, 0), nome='Destaques'),
            Categoria(id_empresa=_empresa_id(empresas, 1), nome='Lanches'),
            Categoria(id_empresa=_empresa_id(empresas, 2), nome='Acai'),
        ]
        db.add_all(categorias)
        db.flush()
        db.add_all([
            Item(
                id_empresa=_empresa_id(empresas, 0),
                id_categoria=categorias[0].id,
                nome='Pizza calabresa',
                descricao='Escolha tamanho e ate 4 sabores.',
                preco=29.9,
                numero_pedidos=30,
                tipo_produto='pizza',
                configuracao=PIZZA_CONFIG,
            ),
            Item(
                id_empresa=_empresa_id(empresas, 1),
                id_categoria=categorias[1].id,
                nome='Smash bacon',
                descricao='Burger smash, queijo e bacon',
                preco=24.9,
                numero_pedidos=39,
            ),
            Item(
                id_empresa=_empresa_id(empresas, 2),
                id_categoria=categorias[2].id,
                nome='Acai tradicional',
                descricao='Escolha o tamanho do seu acai.',
                preco=12.0,
                numero_pedidos=29,
                tipo_produto='acai',
                configuracao=ACAI_CONFIG,
            ),
        ])

    _garantir_item_configuravel(db, 'Pizza calabresa', 'pizza', PIZZA_CONFIG, 29.9)
    _garantir_item_configuravel(db, 'Acai 500ml', 'acai', ACAI_CONFIG, 12.0)
    _garantir_item_configuravel(db, 'Acai tradicional', 'acai', ACAI_CONFIG, 12.0)

    primeira_empresa = db.query(Empresa).filter(Empresa.email == 'loja@pizzaprime.com').first() or empresas[0]
    if not primeira_empresa.categoria_empresa:
        primeira_empresa.categoria_empresa = 'Loja'

    _garantir_usuario_demo(
        db,
        nome='Maria Clara',
        email='maria@email.com',
        senha='123456',
        numero='99999-1111',
        nivel_usuario=0,
        id_empresa=None,
    )
    _garantir_usuario_demo(
        db,
        nome='Joao Pedro',
        email='joao@email.com',
        senha='123456',
        numero='99999-2222',
        nivel_usuario=0,
        id_empresa=None,
    )
    _garantir_usuario_demo(
        db,
        nome='Loja Principal',
        email='admin@loja.com',
        senha='123456',
        numero='99999-3333',
        nivel_usuario=1,
        id_empresa=primeira_empresa.id,
    )

    usuarios = db.query(Usuario).order_by(Usuario.id.asc()).all()
    maria = db.query(Usuario).filter(Usuario.email == 'maria@email.com').first() or usuarios[0]
    joao = db.query(Usuario).filter(Usuario.email == 'joao@email.com').first() or usuarios[0]

    if db.query(Pedido).count() == 0:
        db.add_all([
            Pedido(
                id_empresa=_empresa_id(empresas, 0),
                id_usuario=maria.id,
                total=54.9,
                status='entregue',
                endereco_rua='Rua das Flores',
                endereco_numero='90',
                endereco_bairro='Centro',
                endereco_cidade='Custodia',
                endereco_estado='PE',
            ),
            Pedido(
                id_empresa=_empresa_id(empresas, 1),
                id_usuario=joao.id,
                total=29.9,
                status='em preparo',
                endereco_rua='Av. Central',
                endereco_numero='45',
                endereco_bairro='Centro',
                endereco_cidade='Custodia',
                endereco_estado='PE',
            ),
            Pedido(
                id_empresa=_empresa_id(empresas, 2),
                id_usuario=maria.id,
                total=21.9,
                status='entregue',
                endereco_rua='Praca da Matriz',
                endereco_numero='8',
                endereco_bairro='Centro',
                endereco_cidade='Custodia',
                endereco_estado='PE',
            ),
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
            PublicacaoCliente(
                id_pedido=pedidos[0].id,
                id_usuario=maria.id,
                imagem_url='pizza',
                descricao='A borda veio perfeita e bem recheada. Pedi de novo hoje.',
                aprovado=True,
            ),
            PublicacaoCliente(
                id_pedido=pedidos[min(1, len(pedidos) - 1)].id,
                id_usuario=joao.id,
                imagem_url='burger',
                descricao='Esse smash ficou muito bom, carne no ponto e molho forte.',
                aprovado=True,
            ),
            PublicacaoCliente(
                id_pedido=pedidos[min(2, len(pedidos) - 1)].id,
                id_usuario=maria.id,
                imagem_url='acai',
                descricao='Acai gelado, chegou rapido e com bastante complemento.',
                aprovado=True,
            ),
        ])

    db.commit()
