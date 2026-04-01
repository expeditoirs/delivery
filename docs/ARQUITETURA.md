# Documentacao Tecnica do Projeto Delivery

## Visao Geral
Este projeto e uma aplicacao full stack para delivery com tres frentes principais:
- backend em FastAPI
- frontend em React + Vite
- cache distribuido com Redis e cache local no navegador

A aplicacao atende tres perfis principais:
- cliente
- loja
- administrador

O projeto tambem possui uma camada de persistencia local no navegador baseada em IndexedDB, usada por meio de um bridge para manter compatibilidade com chamadas antigas de `localStorage`.

## Estrutura Geral
### Backend
Pasta principal: `app/`

Camadas mais importantes:
- `app/main.py`: sobe a aplicacao FastAPI, configura CORS, hosts, lifespan e compatibilidade de banco
- `app/core/`: configuracoes centrais como banco, seguranca e cache
- `app/models/`: modelos SQLAlchemy
- `app/schemas/`: contratos Pydantic para entrada e saida da API
- `app/repositories/`: acesso e atualizacao de dados
- `app/api/v1/endpoints/`: endpoints REST por dominio
- `app/api/v1/router.py`: roteador principal da API versionada

### Frontend
Pasta principal: `view/src/`

Camadas mais importantes:
- `main.jsx`: bootstrap do app e inicializacao do bridge de IndexedDB
- `App.jsx`: definicao das rotas da aplicacao
- `layouts/`: estrutura visual principal, incluindo `MainLayout`
- `pages/`: telas por area de negocio
- `features/`: componentes e logicas agrupadas por dominio
- `services/`: chamadas HTTP e servicos do frontend
- `utils/`: utilitarios de auth, cache, tema, IndexedDB e afins

## Banco de Dados
### Tecnologia
O backend usa SQLAlchemy.
A conexao e montada em:
- [database.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\core\database.py)

Comportamento atual:
- usa `DATABASE_URL` quando definida
- se a conexao falhar, faz fallback para SQLite local em `app/data/delivery.sqlite.db`
- em Postgres, configura pool de conexoes
- em SQLite, usa `check_same_thread=False`

### Inicializacao
Na subida do app, o backend executa:
- `Base.metadata.create_all(bind=engine)`
- ajustes de compatibilidade em `_ensure_database_compatibility()`
- seed de dados com `seed_demo_data()`

Arquivo principal:
- [main.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\main.py)

### Entidades Principais
Modelos centrais do dominio:
- `Empresa`: lojas
- `Usuario`: clientes e usuarios vinculados a loja
- `Pedido`: pedidos
- `Item`: produtos
- `Categoria`: categorias da loja
- `Bairro` e `Cidade`: cobertura geografica
- `PublicacaoCliente`: social/feed
- `StoryEmpresa`: stories da loja
- `Administrador`: painel administrativo

### Observacoes importantes
- o projeto possui compatibilidade tanto com SQLite quanto com Postgres
- varias colunas e indices sao ajustados automaticamente no startup
- para ambientes de producao, o ideal e consolidar isso em migracoes formais

## API REST
### Tecnologia
A API e feita em FastAPI.

Entrada principal:
- [main.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\main.py)

Router versionado:
- [router.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\api\v1\router.py)

Prefixo principal:
- `/api/v1`

### Organizacao de endpoints
Rotas versionadas principais:
- `/usuarios`
- `/empresas`
- `/itens`
- `/pedidos`
- `/categorias`
- `/cidades`
- `/bairros`
- `/empresa-bairros`
- `/top-itens`
- `/admin`

O projeto tambem mantem algumas rotas legadas em singular por compatibilidade com o frontend atual, por exemplo:
- `/api/v1/empresa`
- `/api/v1/item`
- `/api/v1/pedido`
- `/api/v1/publicacao`

### Autenticacao
A autenticacao e baseada em JWT, com papeis separados:
- `user`
- `store`
- `admin`

Arquivos centrais:
- [security.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\core\security.py)
- `app/api/v1/endpoints/usuario.py`
- `app/api/v1/endpoints/empresa.py`
- `app/api/v1/endpoints/admin.py`

A API usa dependencias para restringir acesso:
- `require_user`
- `require_store`
- `require_admin`

### CORS e Hosts
Configurados em:
- [main.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\main.py)

Pontos principais:
- aceita `localhost`, `127.0.0.1` e IPs `192.168.x.x`
- usa `TrustedHostMiddleware`
- usa `CORSMiddleware`

## Frontend
### Tecnologia
Frontend em React com Vite.

Arquivos principais:
- [main.jsx](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\main.jsx)
- [App.jsx](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\App.jsx)
- [api.js](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\core\api.js)

### Estrutura de rotas
As rotas ficam centralizadas em `App.jsx`.
Principais areas:
- Home delivery
- Social/feed
- Perfil do cliente
- Painel da loja
- Painel admin
- Login e cadastro

### Comunicacao com a API
O frontend usa Axios com configuracao central em:
- [api.js](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\core\api.js)

Comportamento atual:
- `baseURL` por `VITE_API_URL`
- timeout padrao de 15 segundos
- injeta `Authorization: Bearer <token>` quando existe sessao
- limpa auth em respostas `401`

### Organizacao visual e de negocio
Padrao usado no frontend:
- paginas em `pages/`
- componentes de dominio em `features/`
- servicos HTTP em `services/`
- estado local com hooks React
- dados persistidos em auth/cache/browser storage

## Redis
### Finalidade
Redis e usado no backend para:
- cache compartilhado entre requisicoes
- invalidacao por prefixo
- pub/sub em notificacoes e streams de pedidos

Arquivo central:
- [cache.py](C:\Users\exped\Downloads\delivery4_atualizado\delivery\app\core\cache.py)

### Funcoes principais
- `get_redis_client()`: abre conexao e faz `ping`
- `get_json(key)`: le JSON serializado
- `set_json(key, value, ex=...)`: salva JSON com TTL
- `publish_json(channel, value)`: publica eventos em canal Redis
- `invalidate_prefix(prefix)`: apaga chaves por prefixo
- `cached(...)`: decorator de cache para endpoints

### Comportamento de fallback
Se o Redis nao estiver disponivel:
- a aplicacao nao quebra
- `_CACHE` vira `False`
- o backend segue funcionando sem cache Redis

Isso e util em desenvolvimento local.

### Onde ele aparece na pratica
Exemplos de uso:
- cache de empresas e cardapios
- cache de feed/publicacoes
- stream de pedidos com pub/sub

Arquivo com stream usando Redis:
- `app/api/v1/endpoints/pedido.py`

## IndexedDB no Frontend
### Objetivo
O projeto passou a usar IndexedDB como persistencia principal no navegador, mas sem obrigar reescrever todo o frontend de uma vez.

Arquivo central:
- [indexedDbStorage.js](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\utils\indexedDbStorage.js)

### Como funciona
A estrategia atual e um bridge:
- os dados persistem em IndexedDB
- existe uma `memoryStore` em memoria
- o codigo sobrescreve `window.localStorage.getItem/setItem/removeItem/clear/key`
- chamadas antigas a `localStorage` passam a operar sobre essa camada em memoria + IndexedDB

Fluxo:
1. o app abre o banco IndexedDB `delivery-app`
2. carrega a object store `kv`
3. migra chaves legadas de `localStorage` se necessario
4. instala o bridge
5. o restante do app continua usando a API de `localStorage`, mas os dados persistem em IndexedDB

### Vantagem dessa abordagem
- reduz risco de refatoracao ampla imediata
- preserva compatibilidade com codigo antigo
- prepara o projeto para sair gradualmente de `localStorage`

### Limitacao atual
Mesmo com IndexedDB por baixo, varios modulos ainda chamam `localStorage` diretamente. Eles funcionam por causa do bridge, mas conceitualmente ainda nao estao desacoplados dessa interface.

## Cache no Navegador
Al�m do Redis no backend, o frontend usa cache local com TTL.

Arquivo principal:
- [browserCache.js](C:\Users\exped\Downloads\delivery4_atualizado\delivery\view\src\utils\browserCache.js)

Uso tipico:
- home
- busca
- feed
- cardapio

Essa camada ajuda a reduzir chamadas repetidas e melhorar a sensacao de velocidade.

## Relacao entre Redis, Browser Cache e IndexedDB
### Redis
- cache compartilhado entre usuarios
- vive no backend
- reduz carga no banco
- tambem serve para pub/sub

### Browser Cache
- cache local com TTL no frontend
- acelera leituras de listas e telas frequentes
- usa a interface de `localStorage`, hoje apoiada pelo bridge de IndexedDB

### IndexedDB
- persistencia local real no navegador
- guarda os dados usados pelo bridge
- permite manter sessao, cache e configuracoes com mais flexibilidade do que `localStorage`

Resumo:
- Redis = cache do servidor
- browser cache = cache da interface
- IndexedDB = persistencia local do navegador

## Fluxo resumido de dados
### Exemplo: listagem de lojas
1. frontend chama API via Axios
2. frontend pode consultar cache local antes
3. backend consulta Redis antes de montar resposta
4. se nao houver cache, backend consulta banco via repository
5. resposta volta ao frontend
6. frontend grava cache local com TTL

### Exemplo: autenticacao
1. usuario faz login
2. backend valida credenciais e gera JWT
3. frontend salva sessao em auth
4. auth usa a API de `localStorage`, hoje apoiada pelo bridge para IndexedDB
5. requests seguintes usam `Authorization: Bearer`

## Variaveis de ambiente importantes
### Backend
- `DATABASE_URL`
- `SECRET_KEY`
- `ALLOWED_ORIGINS`
- `ALLOWED_HOSTS`
- `REDIS_URL`

### Frontend
- `VITE_API_URL`
- `VITE_TUNNEL_HOST`

## Pontos de atencao
- o projeto ainda tem bastante codigo legado que le e grava `localStorage` diretamente
- o bridge com IndexedDB resolve a compatibilidade, mas o ideal futuro e migrar modulos gradualmente para uma API propria de storage
- a compatibilidade de banco no startup ajuda muito em desenvolvimento, mas em ambiente mais controlado o recomendado e adotar migracoes formais
- Redis e opcional em desenvolvimento, mas importante para escalar melhor leituras e streams

## Possiveis de evolucao para nossa disciplina
1. criar migracoes formais com Alembic
2. remover acessos diretos a `localStorage` e centralizar storage em uma camada unica
3. documentar endpoint por endpoint com exemplos de request/response
4. separar melhor cache de sessao, cache de tela e preferencias do usuario
5 criar a arquitetura do marchine learning para o feed
