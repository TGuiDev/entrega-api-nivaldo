import type {
  Autor, AutorForm, Categoria, Emprestimo, Estatisticas, Livro, LivroForm, Sessao, Usuario,
} from './types.ts';

const CHAVE = 'biblioteca.sessao';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const sessao = {
  ler(): Sessao | null {
    try {
      return JSON.parse(localStorage.getItem(CHAVE) ?? 'null');
    } catch {
      return null;
    }
  },
  salvar(s: Sessao) {
    localStorage.setItem(CHAVE, JSON.stringify(s));
  },
  limpar() {
    localStorage.removeItem(CHAVE);
  },
};

async function req<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const atual = sessao.ler();
  const resp = await fetch(`/api${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined && { 'Content-Type': 'application/json' }),
      ...(atual && { Authorization: `Bearer ${atual.token}` }),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  }).catch(() => {
    throw new ApiError(0, 'Não foi possível conectar à API');
  });

  if (resp.status === 204) return undefined as T;
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    if (resp.status === 401 && atual && caminho !== '/auth/login') {
      sessao.limpar();
      location.hash = '#/entrar';
    }
    throw new ApiError(resp.status, dados.erro ?? 'Erro inesperado');
  }
  return dados as T;
}

export const api = {
  login: (email: string, senha: string) => req<Sessao>('POST', '/auth/login', { email, senha }),
  registrar: (d: { nome: string; email: string; telefone: string; senha: string }) =>
    req<Sessao>('POST', '/auth/registrar', d),

  livros: (f: { busca?: string; categoriaId?: string; disponivel?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (f.busca) q.set('busca', f.busca);
    if (f.categoriaId) q.set('categoriaId', f.categoriaId);
    if (f.disponivel) q.set('disponivel', 'true');
    return req<Livro[]>('GET', `/livros?${q}`);
  },
  criarLivro: (d: LivroForm) => req<Livro>('POST', '/livros', d),
  atualizarLivro: (id: number, d: LivroForm) => req<Livro>('PUT', `/livros/${id}`, d),
  removerLivro: (id: number) => req<void>('DELETE', `/livros/${id}`),

  autores: () => req<Autor[]>('GET', '/autores'),
  criarAutor: (d: AutorForm) => req<Autor>('POST', '/autores', d),
  atualizarAutor: (id: number, d: AutorForm) => req<Autor>('PUT', `/autores/${id}`, d),
  removerAutor: (id: number) => req<void>('DELETE', `/autores/${id}`),
  categorias: () => req<Categoria[]>('GET', '/categorias'),
  usuarios: () => req<Usuario[]>('GET', '/usuarios'),

  emprestimos: (status?: string) =>
    req<Emprestimo[]>('GET', `/emprestimos${status ? `?status=${status}` : ''}`),
  emprestar: (livroId: number, usuarioId?: number) =>
    req<Emprestimo>('POST', '/emprestimos', { livroId, usuarioId }),
  devolver: (id: number) => req<Emprestimo>('PUT', `/emprestimos/${id}/devolucao`),

  estatisticas: () => req<Estatisticas>('GET', '/estatisticas'),
};
