# Delivery 4 - integração front + back

Estou usando Postgree na vps(ambiente de desenvolvimento)

o que precisa para rodar:

1. esse o banco:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

no front: pasta view navegue até ela e rode:
1. rode `npm install`
2. rode `npm run dev`

## O que foi ajustado
- front consumindo a API por `VITE_API_URL`
- cache em 2 camadas:
  - Redis no back para feed, stories e empresas
  - cache com TTL no navegador para home, busca e feed
- autenticação mais segura com papéis separados: `user`, `store`, `admin`
- proteção de rotas no front por perfil
- proteção de endpoints administrativos e de loja no back
- headers de segurança no FastAPI
- limitação simples de tentativas de login por IP
- tema principal aplicado com as cores:
  - primária `#3B82F6`
  - secundária `#334155`
  - destaque `#14B8A6`
  - fundo `#0B0F19`
  - superfície `#111827`
  - texto `#CBD5E1`
- configuração do Vite preparada para modo local e túnel

## O que usar para cache
Use os dois.
- Redis é melhor para dados compartilhados entre usuários e para aliviar o banco.
- cache no navegador é melhor para dar sensação de app rápido no dispositivo do usuário.
- Aqui está nível de desencolvimento, ainda aceita poucos acessos
## Variáveis importantes
### Back
- `DATABASE_URL`
- `SECRET_KEY`
- `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `ALLOWED_HOSTS=localhost,127.0.0.1`
- `REDIS_URL=redis://localhost:6379/0`

### Front
- `VITE_API_URL=http://localhost:8000/api/v1`
- `VITE_TUNNEL_HOST=seu-subdominio.ngrok-free.dev` apenas se for usar túnel

