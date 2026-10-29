# API de Biblioteca – Explicação

A API de Biblioteca é uma API REST que gerencia o acervo de livros e os empréstimos de uma biblioteca. Ela permite cadastrar livros, autores e categorias, controlar o estoque e registrar empréstimos e devoluções feitos pelos usuários.

## Arquitetura em camadas

- **Controller:** recebe as requisições HTTP e devolve as respostas em JSON (ex.: `LivroController`, `EmprestimoController`).
- **Service:** contém as regras de negócio, como verificar se o livro está disponível antes de emprestar e calcular multa por atraso.
- **Repository:** faz o acesso ao banco de dados (salvar, buscar, excluir).
- **Entidades:** representam os dados do sistema: `Usuario`, `Livro`, `Autor`, `Categoria` e `Emprestimo`.

## Relacionamentos principais

- Um **livro** pode ter vários **autores** e um autor pode escrever vários livros (muitos-para-muitos).
- Cada **livro** pertence a uma **categoria**.
- Um **usuário** pode realizar vários **empréstimos**, e cada empréstimo está ligado a um livro.
- O **status** do empréstimo é controlado por uma enumeração: ATIVO, DEVOLVIDO ou ATRASADO.

## Principais endpoints

| Método | Endpoint | Função |
|---|---|---|
| GET | `/livros` | Lista todos os livros |
| GET | `/livros/{id}` | Busca um livro pelo ID |
| POST | `/livros` | Cadastra um novo livro |
| PUT | `/livros/{id}` | Atualiza um livro |
| DELETE | `/livros/{id}` | Remove um livro |
| POST | `/emprestimos` | Realiza um empréstimo |
| PUT | `/emprestimos/{id}/devolucao` | Registra a devolução |
| GET | `/emprestimos/atrasados` | Lista empréstimos atrasados |

## Exemplo de fluxo

Ao fazer `POST /emprestimos`, o `EmprestimoController` chama o `EmprestimoService`. O serviço verifica se o usuário pode emprestar e se o livro tem estoque, diminui a quantidade disponível do livro, cria o empréstimo com status **ATIVO** e o salva pelo `EmprestimoRepository`. Na devolução, o estoque volta a aumentar e, se houver atraso, a multa é calculada.

## Diagrama de Classes

O diagrama está no arquivo `diagrama.mmd` (formato Mermaid). Para gerar a imagem, cole o conteúdo em https://mermaid.live e exporte em PNG/SVG.

## Implementação (Node.js + Express)

A API foi construída em **Node.js** com **Express**, seguindo as mesmas camadas do diagrama. Os dados ficam em um banco **PostgreSQL** (driver `pg`). Na inicialização, o arquivo `schema.sql` cria as tabelas e carrega alguns registros de exemplo, apenas se estiverem vazias.

```
src/
├── server.js            # inicializa o banco e sobe o servidor na porta 3000
├── app.js               # configura o Express e o tratamento de erros
├── routes.js            # define os endpoints
├── db.js                # pool de conexões PostgreSQL, transações e init()
├── schema.sql           # tabelas e dados de exemplo
├── controllers/         # LivroController, EmprestimoController
├── services/            # LivroService, EmprestimoService (regras de negócio)
├── repositories/        # acesso ao banco via SQL (findAll, findById, save, deleteById)
└── models/              # Usuario, Livro, Autor, Categoria, Emprestimo, StatusEmprestimo
```

Os métodos de repositories, services e controllers são assíncronos (`async/await`).

### Banco de dados

Tabelas: `usuarios`, `autores`, `categorias`, `livros`, `livro_autor` (relação muitos-para-muitos entre livros e autores) e `emprestimos`.

A conexão é configurada por variáveis de ambiente, usando `DATABASE_URL` ou `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` e `PGDATABASE`. O arquivo `.env.example` serve de modelo.

### Como executar

```bash
npm install
createdb -U postgres biblioteca      # cria o banco (uma única vez)
cp .env.example .env                 # ajuste PGPASSWORD para a sua senha
node --env-file=.env src/server.js
```

A API fica disponível em `http://localhost:3000`. Se o PostgreSQL não estiver acessível, o servidor exibe o erro e encerra. O arquivo `requisicoes.http` tem exemplos prontos de todas as requisições (extensão **REST Client** do VS Code).

Endpoints auxiliares para consultar os dados de exemplo: `GET /emprestimos`, `GET /usuarios`, `GET /autores`, `GET /categorias`.

### Regras de negócio implementadas

- Um usuário pode ter no máximo **3 empréstimos em aberto**.
- Só é possível emprestar livros com **estoque disponível**.
- O prazo de devolução é de **7 dias**. Depois disso o empréstimo fica **ATRASADO**.
- A multa é de **R$ 2,00 por dia de atraso**.
- Um livro que já tem empréstimos não pode ser excluído (resposta **409**).
