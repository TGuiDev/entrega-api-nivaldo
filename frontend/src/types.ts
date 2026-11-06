export type Perfil = 'BIBLIOTECARIO' | 'LEITOR';
export type Status = 'ATIVO' | 'DEVOLVIDO' | 'ATRASADO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  perfil: Perfil;
}

export interface Livro {
  id: number;
  titulo: string;
  isbn?: string | null;
  anoPublicacao?: number | null;
  quantidadeDisponivel: number;
  autorIds: number[];
  categoriaId: number | null;
}

export interface LivroForm {
  titulo: string;
  isbn: string;
  anoPublicacao: number | null;
  quantidadeDisponivel: number;
  autorIds: number[];
  categoriaId: number;
}

export interface Autor {
  id: number;
  nome: string;
  nacionalidade?: string | null;
}

export interface AutorForm {
  nome: string;
  nacionalidade: string;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Emprestimo {
  id: number;
  usuarioId: number;
  livroId: number;
  dataEmprestimo: string;
  dataPrevistaDevolucao: string;
  dataDevolucao: string | null;
  status: Status;
  multa: number;
}

export interface Estatisticas {
  titulos: number;
  exemplaresDisponiveis: number;
  usuarios: number;
  emprestimosAtivos: number;
  emprestimosAtrasados: number;
  multaTotal: number;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}
