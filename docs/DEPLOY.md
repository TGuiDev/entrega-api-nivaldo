# Deploy

Este projeto roda no **Dokploy** (Docker Swarm + Traefik), com **dois serviços** no mesmo projeto, mais um PostgreSQL:

```mermaid
flowchart LR
    U([Usuário]) --> CF[Cloudflare<br/>HTTPS]
    CF -->|túnel| T[Traefik]
    T -->|biblioteca.…| F[Frontend<br/>nginx :80]
    T -->|api-biblioteca-nivaldo.…| A[API<br/>Node :3000]
    F -->|/api/* proxy interno| A
    A --> P[(PostgreSQL)]
```

| Serviço | Origem | Domínio | Porta |
|---|---|---|---|
| **Api** | [`Dockerfile`](../Dockerfile) na raiz | `api-biblioteca-nivaldo.servidorcaseiro.online` | 3000 |
| **Frontend** | [`frontend/Dockerfile`](../frontend/Dockerfile), caminho de build `/frontend` | `biblioteca.servidorcaseiro.online` | 80 |
| **PostgreSQL** | Banco do Dokploy | só rede interna | 5432 |

O front acessa a API por caminho relativo (`/api`). O nginx do container do front repassa essas chamadas para o serviço da API pela rede interna, então **não há CORS** a configurar e o navegador só conhece um domínio.

## Variáveis de ambiente da API

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim* | String de conexão, ex. `postgresql://usuario:senha@host:5432/banco` |
| `JWT_SECRET` | **sim em produção** | Segredo de assinatura dos tokens. Gere com `openssl rand -hex 32`. Sem ele, a API não inicia com `NODE_ENV=production` |
| `PORT` | não | Porta HTTP (padrão `3000`) |

\* Alternativa: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

O container do front aceita `API_UPSTREAM` (padrão `nivaldo-api-qgvvjr:3000`): o `host:porta` interno da API na rede do Dokploy. Se o nome do serviço da API mudar, ajuste esta variável.

## Passo a passo no Dokploy

1. **Banco.** Crie um PostgreSQL no projeto e anote o host interno (o nome do serviço), usuário, senha e banco.
2. **API.** Crie uma aplicação, fonte **GitHub** (repositório e branch `main`), tipo de build **Dockerfile** (`Dockerfile`, contexto na raiz). Em *Environment*, defina `DATABASE_URL` e `JWT_SECRET`.
3. **Frontend.** Crie outra aplicação com o mesmo repositório, tipo de build **Dockerfile**, e em *Build Path* informe `/frontend`. Se o nome interno da API não for `nivaldo-api-qgvvjr`, defina `API_UPSTREAM`.
4. **Domínios.** Na aba *Domains* de cada serviço, adicione o domínio e a porta (3000 na API, 80 no front).
5. **Auto deploy.** Mantenha ligado: cada push na `main` dispara um novo deploy. O front usa `watchPaths` em `frontend/**` e só republica quando algo no front muda.

Ao subir, a API cria as tabelas e os dados de exemplo sozinha (veja [Banco de dados](BANCO-DE-DADOS.md)).

## Rodando localmente com Docker

```bash
docker network create biblioteca
docker run -d --name pg --network biblioteca -e POSTGRES_PASSWORD=pg -e POSTGRES_DB=biblioteca postgres:18

docker build -t biblioteca-api .
docker run -d --name api --network biblioteca -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:pg@pg:5432/biblioteca \
  -e JWT_SECRET=$(openssl rand -hex 32) biblioteca-api
```

A imagem da raiz já inclui o front compilado: abra <http://localhost:3000>. Para testar o container separado do front, construa `frontend/` e rode-o na mesma rede com `API_UPSTREAM=api:3000`.

## Como as imagens são construídas

**API** (`Dockerfile`), em dois estágios:

1. `node:22-slim` instala as dependências do front (`npm ci --include=dev`) e compila o Vite.
2. Imagem final `node:22-slim` com só as dependências de produção da API, o código de `src/` e o `frontend/dist` do estágio anterior. Roda como usuário `node`, sem privilégios de root.

**Frontend** (`frontend/Dockerfile`): compila com `node:22-slim` e serve o resultado com `nginx:1.27-alpine`. O arquivo `nginx.conf.template` resolve o endereço da API por requisição, então o nginx sobe mesmo que a API esteja fora do ar no momento.

> Por que Dockerfile em vez de Nixpacks? O Vite 8 usa o `rolldown`, que traz binários nativos. Com o Node do Nix, o npm não escolhia o binário certo para Linux e o build falhava. A imagem oficial do Node não tem esse problema, e o build fica reproduzível.

## Segurança

- **Defina `JWT_SECRET` forte** em produção. É o que impede a falsificação de tokens de bibliotecário.
- **Troque a senha da conta de demonstração** (`ana@email.com` / `123456`, bibliotecária) ou apague-a. Enquanto ela existir com a senha de exemplo, qualquer pessoa pode administrar o acervo. A dica de login na tela de entrada deve ser removida junto.
- A senha do banco e o `JWT_SECRET` ficam apenas nas variáveis de ambiente do Dokploy, nunca no repositório (o `.env` está no `.gitignore`).
- O HTTPS é feito pela Cloudflare, na frente do servidor.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| API reinicia em loop com `Defina a variável de ambiente JWT_SECRET` | Falta `JWT_SECRET` nas variáveis do serviço |
| `Falha ao conectar/inicializar o PostgreSQL` | `DATABASE_URL` com host errado. Use o nome interno do serviço do banco, não `localhost` |
| Front abre mas as telas dão "Não foi possível conectar à API" | O nginx não alcança a API: confira `API_UPSTREAM` e se os dois serviços estão na mesma rede do Dokploy |
| `502 Bad Gateway` no domínio | Porta do domínio errada no Dokploy (API 3000, front 80) ou container ainda subindo |
