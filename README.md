# Copyright (c) 2026 expeditoirs

- Este software pode ser utilizado apenas mediante atribuição de crédito explícito ao autor original.

- O crédito deve incluir link do projeto original.

- O uso sem atribuição será considerado violação de direitos autorais.

- O uso não autorizado poderá resultar em medidas legais.

# Agradecimentos
Queremos agradecer ao nosso docente Dr. ITALO CESAR DE SOUZA BELO

Discentes:
ANDREI FABRICIO DA SILVA
EMERSON RUAN MARQUES SANTOS 
EXPEDITO IAM REZENDE DOS SANTOS(dono da ideia)
JOSÉ MATHEUS ALMEIDA DA SILVA

# Delivery 4.4

Aplicacao full stack de delivery com:
- backend em FastAPI
- frontend em React + Vite
- banco via VPS
- cache Redis no backend
- persistencia local no navegador com IndexedDB

## Tecnologias
### Backend
- Python
- FastAPI
- SQLAlchemy
- Redis
- JWT

### Frontend
- React
- Vite
- Axios
- React Router

## Pre-requisitos
Instale antes de rodar:
- Python 3.11+ recomendado
- Node.js 18+ recomendado
- npm

Opcional:
- Redis local, se quiser testar cache e pub/sub completos
- PostgreSQL, se quiser rodar no mesmo estilo do ambiente mais proximo de producao

## Estrutura principal
- `app/`: backend
- `view/`: frontend
- `docs/ARQUITETURA.md`: documentacao tecnica detalhada

## Setup rapido
Se voce acabou de clonar o projeto, rode em dois terminais.

### 1. Backend
Na raiz do projeto:

```bash
python -m venv .venv
```

Ative o ambiente virtual.

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:
```bash
source .venv/bin/activate
```

Instale as dependencias:

```bash
pip install -r requirements.txt
```

Crie um arquivo `.env` na raiz do projeto com um exemplo como este:

```env
SECRET_KEY=sua-chave-secreta-aqui
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOWED_HOSTS=localhost,127.0.0.1
VITE_API_URL=http://localhost:8000/api/v1
REDIS_URL=redis://localhost:6379/0
```

### Banco de dados no backend
O projeto suporta dois cenarios:

#### Opcao 1. Rodar local sem configurar Postgres
Se `DATABASE_URL` nao estiver definida, o backend faz fallback para SQLite local automaticamente.

Nesse modo, basta subir o backend.

#### Opcao 2. Rodar com PostgreSQL
Se quiser usar Postgres, adicione no `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/delivery
```

## Subir o backend
Na raiz do projeto:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Teste rapido:
- abra `http://localhost:8000/health`
- resposta esperada: `{"status":"healthy"}`

## 2. Frontend
Abra outro terminal.

Entre na pasta do frontend:

```bash
cd view
```

Instale as dependencias:

```bash
npm install
```

Se quiser, crie um `.env` dentro de `view/` com:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Suba o frontend:

```bash
npm run dev
```

O Vite normalmente sobe em:
- `http://localhost:5173`

## Redis
Redis e usado para:
- cache de respostas no backend
- invalidacao por prefixo
- pub/sub em fluxos como pedidos em tempo real

### Preciso de Redis para rodar?
Nao obrigatoriamente.

Se o Redis nao estiver disponivel:
- o backend continua funcionando
- algumas otimiza��es de cache e pub/sub ficam limitadas

Se quiser rodar Redis localmente com Docker:

```bash
docker run --name delivery-redis -p 6379:6379 redis:7-alpine
```

Ou use o `docker-compose.yml` do projeto, se preferir subir a stack com containers.

## Fluxo recomendado para colegas
Depois de clonar:

```bash
git clone <repo>
cd delivery
python -m venv .venv
```

Depois:
1. ativar venv
2. `pip install -r requirements.txt`
3. criar `.env`
4. subir backend
5. `cd view`
6. `npm install`
7. `npm run dev`

## Variaveis importantes
### Backend
- `DATABASE_URL`
- `SECRET_KEY`
- `ALLOWED_ORIGINS`
- `ALLOWED_HOSTS`
- `REDIS_URL`

### Frontend
- `VITE_API_URL`
- `VITE_TUNNEL_HOST`

## O que o projeto ja possui
- autenticacao com perfis separados: `user`, `store`, `admin`
- protecao de rotas no frontend
- protecao de endpoints no backend
- cache em duas camadas:
  - Redis no backend
  - cache local no navegador
- persistencia local com bridge para IndexedDB
- CORS configurado para ambiente local
- suporte a rotas da loja, cliente, social e admin

## Observacoes importantes
- o backend faz ajustes de compatibilidade no banco ao subir
- o projeto ainda tem partes legadas que usam a interface de `localStorage`, mas hoje essa persistencia passa pelo bridge para IndexedDB
- se algo quebrar so na primeira subida, tente reiniciar backend e frontend apos criar o banco e instalar as dependencias

## Documentacao tecnica
- arquitetura detalhada: [docs/ARQUITETURA.md](docs/ARQUITETURA.md)

## Proximos documentos recomendados
Se quiser evoluir a documentacao depois, os arquivos mais uteis seriam:
- `docs/ENDPOINTS.md`
- `docs/DEPLOY.md`
- `docs/COMO_RODAR.md`
