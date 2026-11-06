# Referência da API

API REST em JSON. Em produção: `https://api-biblioteca-nivaldo.servidorcaseiro.online`. Localmente: `http://localhost:3000`.

Todas as rotas respondem na raiz (`/livros`) e também sob o prefixo `/api` (`/api/livros`), que é o usado pelo front-end.

- [Convenções](#convenções)
- [Autenticação](#autenticação)
- [Livros](#livros)
- [Autores](#autores)
- [Categorias](#categorias)
- [Empréstimos](#empréstimos)
- [Usuários e painel](#usuários-e-painel)
- [Saúde](#saúde)
- [Regras de negócio](#regras-de-negócio)
- [Códigos de erro](#códigos-de-erro)

## Convenções

**Formato.** Requisições com corpo usam `Content-Type: application/json`. Todas as respostas são JSON, exceto `204 No Content`.

**Autenticação.** Exceto `/auth/login`, `/auth/registrar` e `/api/saude`, toda rota exige o cabeçalho:

```http
Authorization: Bearer <token>
```

**Perfis.**

| Perfil | Quem é | O que pode |
|---|---|---|
| `LEITOR` | Qualquer pessoa que se cadastra | Consultar livros e autores, pegar e devolver **os próprios** empréstimos |
| `BIBLIOTECARIO` | Equipe da biblioteca | Tudo o que o leitor faz, mais cadastro de livros e autores, empréstimos de qualquer usuário, atrasados, usuários e estatísticas |

**Erros.** Sempre no formato `{ "erro": "mensagem em português" }`, com o status HTTP adequado (veja [Códigos de erro](#códigos-de-erro)).

## Autenticação

### `POST /auth/login`

Entra com e-mail e senha. Devolve um token JWT válido por **8 horas**.

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@email.com","senha":"123456"}'
```

```json
{
  "token": "eyJhbGciOi...",
  "usuario": { "id": 1, "nome": "Ana Souza", "email": "ana@email.com", "telefone": "(19) 99999-1111", "perfil": "BIBLIOTECARIO" }
}
```

| Status | Quando |
|---|---|
| `200` | Credenciais corretas |
| `401` | `{ "erro": "E-mail ou senha inválidos" }` |

### `POST /auth/registrar`

Cria uma conta de **leitor** e já devolve um token. O perfil não pode ser escolhido no cadastro.

```json
{ "nome": "Maria Oliveira", "email": "maria@email.com", "telefone": "(19) 99999-3333", "senha": "senha123" }
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `nome` | sim | |
| `email` | sim | único, sem diferenciar maiúsculas |
| `senha` | sim | mínimo de 6 caracteres |
| `telefone` | não | |

Respostas: `201` com `{ token, usuario }`; `400` (campos faltando ou senha curta); `409` (`E-mail já cadastrado`).

### `GET /auth/me`

Devolve o usuário do token atual.

```json
{ "id": 1, "nome": "Ana Souza", "email": "ana@email.com", "telefone": "(19) 99999-1111", "perfil": "BIBLIOTECARIO" }
```

## Livros

Objeto **Livro**:

```json
{
  "id": 2,
  "titulo": "Clean Code",
  "isbn": "978-0132350884",
  "anoPublicacao": 2008,
  "quantidadeDisponivel": 2,
  "autorIds": [2],
  "categoriaId": 2
}
```

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/livros` | qualquer | Lista livros, ordenados por título |
| `GET` | `/livros/{id}` | qualquer | Busca um livro |
| `POST` | `/livros` | bibliotecário | Cadastra |
| `PUT` | `/livros/{id}` | bibliotecário | Substitui os dados |
| `DELETE` | `/livros/{id}` | bibliotecário | Remove |

### `GET /livros`

Filtros opcionais na query string, combináveis:

| Parâmetro | Efeito |
|---|---|
| `busca` | Procura (sem diferenciar maiúsculas) no título, no ISBN e no **nome dos autores** |
| `categoriaId` | Só livros da categoria |
| `autorId` | Só livros do autor |
| `disponivel=true` | Só livros com estoque maior que zero |

```bash
curl 'http://localhost:3000/livros?busca=clean&disponivel=true' -H "Authorization: Bearer $TOKEN"
```

### `POST /livros` e `PUT /livros/{id}`

```json
{
  "titulo": "A Hora da Estrela",
  "isbn": "978-8532508126",
  "anoPublicacao": 1977,
  "quantidadeDisponivel": 2,
  "categoriaId": 1,
  "autorIds": [5]
}
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `titulo` | sim | |
| `autorIds` | sim | lista com **pelo menos um** id de autor existente |
| `categoriaId` | sim | categoria existente |
| `quantidadeDisponivel` | não | não pode ser negativa (padrão `0`) |
| `isbn`, `anoPublicacao` | não | |

Respostas: `201` (POST) ou `200` (PUT) com o livro; `400` para dados inválidos (`O título é obrigatório`, `Informe pelo menos um autor em autorIds`, `Autor 99 não existe`, `Categoria inválida`); `404` se o livro do PUT não existir.

### `DELETE /livros/{id}`

`204` em caso de sucesso, `404` se não existir, `409` (`Livro possui empréstimos e não pode ser excluído`) se o livro já foi emprestado alguma vez.

## Autores

Objeto **Autor**:

```json
{ "id": 5, "nome": "Clarice Lispector", "nacionalidade": "Brasileira" }
```

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/autores` | qualquer | Lista todos os autores |
| `GET` | `/autores/{id}` | qualquer | Busca um autor |
| `POST` | `/autores` | bibliotecário | Cadastra |
| `PUT` | `/autores/{id}` | bibliotecário | Atualiza |
| `DELETE` | `/autores/{id}` | bibliotecário | Remove |

### `POST /autores` e `PUT /autores/{id}`

```bash
curl -X POST http://localhost:3000/autores \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"nome":"Clarice Lispector","nacionalidade":"Brasileira"}'
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `nome` | sim | até 150 caracteres; espaços nas pontas são removidos; **único** sem diferenciar maiúsculas |
| `nacionalidade` | não | até 80 caracteres |

| Status | Quando |
|---|---|
| `201` / `200` | Autor salvo (devolve o objeto) |
| `400` | `O nome do autor é obrigatório` ou limites de tamanho excedidos |
| `403` | Usuário é leitor |
| `404` | `Autor não encontrado` (PUT) |
| `409` | `Já existe um autor com este nome` |

### `DELETE /autores/{id}`

`204` em caso de sucesso, `404` se não existir e `409` (`Autor possui livros cadastrados e não pode ser excluído`) se algum livro ainda o referencia. Para excluir, remova antes o autor desses livros (`PUT /livros/{id}`).

## Categorias

### `GET /categorias`

Somente leitura.

```json
[{ "id": 1, "nome": "Literatura Brasileira" }, { "id": 2, "nome": "Programação" }]
```

## Empréstimos

Objeto **Empréstimo**:

```json
{
  "id": 2,
  "usuarioId": 1,
  "livroId": 2,
  "dataEmprestimo": "2026-11-06T18:00:02.117Z",
  "dataPrevistaDevolucao": "2026-11-13T18:00:02.117Z",
  "dataDevolucao": null,
  "status": "ATIVO",
  "multa": 0
}
```

`status` é `ATIVO`, `ATRASADO` ou `DEVOLVIDO`. `multa` é calculada na hora (R$ 2,00 por dia de atraso).

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `GET` | `/emprestimos` | qualquer | Lista. **Leitor só vê os próprios** |
| `GET` | `/emprestimos/atrasados` | bibliotecário | Lista os atrasados |
| `POST` | `/emprestimos` | qualquer | Realiza um empréstimo |
| `PUT` | `/emprestimos/{id}/devolucao` | qualquer* | Registra a devolução |

\* O leitor só devolve os próprios empréstimos; o bibliotecário devolve qualquer um.

### `GET /emprestimos`

Filtros opcionais: `status` (`ATIVO`, `ATRASADO`, `DEVOLVIDO`), `usuarioId`, `livroId`. Antes de responder, a API marca como `ATRASADO` todo empréstimo ativo vencido.

### `POST /emprestimos`

```json
{ "livroId": 2 }
```

O leitor empresta sempre para si. O bibliotecário pode informar `usuarioId` para emprestar em nome de outra pessoa. Ao emprestar, o estoque do livro diminui em um.

| Status | Quando |
|---|---|
| `201` | Empréstimo criado, prazo de 7 dias |
| `404` | Usuário ou livro não encontrado |
| `422` | `Usuário atingiu o limite de empréstimos em aberto` ou `Livro indisponível no momento` |

### `PUT /emprestimos/{id}/devolucao`

Sem corpo. Devolve o empréstimo com `status: "DEVOLVIDO"`, `dataDevolucao` preenchida e a multa final. O estoque do livro aumenta em um.

| Status | Quando |
|---|---|
| `200` | Devolvido |
| `403` | `Você só pode devolver os seus próprios empréstimos` |
| `404` | Empréstimo não encontrado |
| `422` | `Este empréstimo já foi devolvido` |

## Usuários e painel

### `GET /usuarios` (bibliotecário)

Lista todos os usuários. O hash da senha nunca é exposto.

### `GET /estatisticas` (bibliotecário)

```json
{
  "titulos": 4,
  "exemplaresDisponiveis": 8,
  "usuarios": 3,
  "emprestimosAtivos": 1,
  "emprestimosAtrasados": 0,
  "multaTotal": 60
}
```

## Saúde

### `GET /api/saude` (pública)

Usada para verificar se a API está de pé.

```json
{ "ok": true }
```

## Regras de negócio

- Um usuário pode ter no máximo **3 empréstimos em aberto** (ativos ou atrasados).
- Só é possível emprestar livros com **estoque disponível**.
- O prazo de devolução é de **7 dias**; depois disso o empréstimo fica `ATRASADO`.
- A multa é de **R$ 2,00 por dia de atraso** (dias incompletos contam como dia cheio) e continua crescendo até a devolução.
- Um livro que já teve empréstimos **não pode ser excluído**; um autor que ainda tem livros também não.
- Cada livro tem **pelo menos um autor** e exatamente uma categoria.
- Contas criadas por `/auth/registrar` são sempre `LEITOR`. Só um banco de dados editado diretamente cria bibliotecários.

## Códigos de erro

| Status | Significado | Exemplo |
|---|---|---|
| `400` | Dados inválidos | `O título é obrigatório` |
| `401` | Sem token, token inválido/expirado ou login errado | `Autenticação necessária` |
| `403` | Perfil sem permissão | `Você não tem permissão para esta ação` |
| `404` | Recurso inexistente | `Livro não encontrado`, `Rota não encontrada` |
| `409` | Conflito com o estado atual | `Já existe um autor com este nome` |
| `422` | Regra de negócio violada | `Livro indisponível no momento` |
| `500` | Erro interno | `Erro interno do servidor` |

## Testando

- [`requisicoes.http`](../requisicoes.http): exemplos prontos para a extensão **REST Client** do VS Code, com login automático.
- [`postman/`](../postman/API_Biblioteca.postman_collection.json): coleção com testes automatizados (31 requisições, 52 verificações). Pode rodar pelo Postman ou pela linha de comando:

```bash
docker run --rm --network host -v "$PWD/postman":/etc/newman postman/newman \
  run API_Biblioteca.postman_collection.json --env-var baseUrl=http://localhost:3000
```
