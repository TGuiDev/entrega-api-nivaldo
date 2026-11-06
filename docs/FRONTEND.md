# Front-end

Aplicação de página única (SPA) em **TypeScript puro com Vite**, sem framework. Fica em [`frontend/`](../frontend). É responsiva (celular, tablet e desktop) e acompanha o tema claro ou escuro do sistema.

## Telas

| Rota | Tela | Quem acessa |
|---|---|---|
| `#/entrar` | Login e criação de conta | Público |
| `#/` | **Catálogo**: busca por título, autor ou ISBN, filtro por categoria e por disponibilidade, botão Emprestar | Todos |
| `#/emprestimos` | Empréstimos em aberto e histórico, prazos, multas e devolução | Todos (o leitor vê só os seus) |
| `#/painel` | Estatísticas e lista de empréstimos atrasados com telefone do leitor | Bibliotecário |
| `#/acervo` | Cadastro, edição e exclusão de livros, com cadastro rápido de autor dentro do formulário | Bibliotecário |
| `#/autores` | Cadastro, edição e exclusão de autores, com a contagem de obras de cada um | Bibliotecário |

A navegação usa `#` (hash), então funciona em qualquer servidor estático sem configuração de rotas. Rotas restritas redirecionam o leitor para o catálogo.

## Cadastro de autores

Há dois caminhos:

1. **Tela Autores**: lista com nome, nacionalidade e número de obras. Botão **Novo autor**, edição e exclusão. Se o autor tem livros, a API recusa a exclusão (409) e o front mostra a mensagem.
2. **Cadastro rápido no formulário de livro**: abaixo da lista de autores há um campo para digitar um nome novo. Ao clicar em **Adicionar** (ou Enter), o autor é criado na hora e já aparece marcado, sem sair do formulário.

## Estrutura

```
frontend/
├── index.html
├── Dockerfile               # build + nginx
├── nginx.conf.template      # estáticos + proxy de /api
├── public/favicon.svg
└── src/
    ├── main.ts              # roteador por hash, casca (topo/navegação) e controle de acesso
    ├── api.ts               # cliente HTTP tipado e gestão da sessão (token em localStorage)
    ├── types.ts             # tipos das entidades
    ├── ui.ts                # template seguro, modal, confirmação, toasts, ícones, formatadores
    ├── style.css            # design completo (variáveis de cor, tema escuro, responsivo)
    └── views/               # entrar, catalogo, emprestimos, painel, acervo, autores
```

### Segurança de renderização

As telas montam HTML com a tag `` html`...` `` de [`ui.ts`](../frontend/src/ui.ts). Todo valor interpolado é **escapado automaticamente**; só trechos produzidos pela própria tag passam sem escape. Isso evita XSS com dados vindos do banco (títulos, nomes de autores).

## Design

O visual segue a ideia de **papel e tinta**: fundo cor de papel, texto em tinta quase preta, um único acento carmim e tipografia serifada nos títulos.

- **Capas dos livros** são geradas a partir do título: cada título cai sempre numa de oito cores de encadernação, com filete interno, lombada e o autor em caixa alta. Não há imagens a carregar.
- **Sem gradientes e sem sombras decorativas.** Hierarquia por linhas finas, espaço e tipografia.
- **Tema escuro** automático via `prefers-color-scheme`. Todas as cores são variáveis CSS em `:root`, então ajustar a paleta é editar um bloco.
- **Mobile:** navegação em barra inferior e tabelas que viram listas de rótulo e valor.
- **Acessibilidade:** foco visível, `aria-label` nos botões de ícone, mensagens de erro com `role="alert"` e respeito a `prefers-reduced-motion`.

## Desenvolvimento

```bash
npm install && npm run front:install
npm start                 # API em http://localhost:3000 (terminal 1)
npm run front:dev         # front em http://localhost:5173 (terminal 2)
```

O servidor de desenvolvimento do Vite encaminha `/api` para `http://localhost:3000` (veja [`vite.config.ts`](../frontend/vite.config.ts)). Requer **Node 22.12 ou mais recente** (exigência do Vite 8).

```bash
npm run front:typecheck   # checagem de tipos
npm run build             # gera frontend/dist; a API passa a servir o front em :3000
```
