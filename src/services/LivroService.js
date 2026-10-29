const livroRepository = require('../repositories/LivroRepository');
const autorRepository = require('../repositories/AutorRepository');
const categoriaRepository = require('../repositories/CategoriaRepository');
const Livro = require('../models/Livro');
const HttpError = require('../utils/HttpError');

class LivroService {
  constructor() {
    this.livroRepository = livroRepository;
  }

  listarTodos(filtros) {
    return this.livroRepository.findAll(filtros);
  }

  async buscarPorId(id) {
    const livro = await this.livroRepository.findById(id);
    if (!livro) throw new HttpError(404, 'Livro não encontrado');
    return livro;
  }

  async salvar(dados, id = null) {
    await this.validar(dados);
    const livro = new Livro({ ...dados, id: id ? Number(id) : undefined });
    return this.livroRepository.save(livro);
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id); // garante que existe
    return this.salvar(dados, id);
  }

  async excluir(id) {
    await this.buscarPorId(id);
    try {
      await this.livroRepository.deleteById(id);
    } catch (erro) {
      // 23503 = foreign_key_violation (livro com empréstimos)
      if (erro.code === '23503') throw new HttpError(409, 'Livro possui empréstimos e não pode ser excluído');
      throw erro;
    }
  }

  async validar(dados) {
    if (!dados.titulo) throw new HttpError(400, 'O título é obrigatório');
    if (dados.quantidadeDisponivel !== undefined && dados.quantidadeDisponivel < 0) {
      throw new HttpError(400, 'A quantidade disponível não pode ser negativa');
    }
    if (!Array.isArray(dados.autorIds) || dados.autorIds.length === 0) {
      throw new HttpError(400, 'Informe pelo menos um autor em autorIds');
    }
    for (const autorId of dados.autorIds) {
      if (!(await autorRepository.findById(autorId))) throw new HttpError(400, `Autor ${autorId} não existe`);
    }
    if (!(await categoriaRepository.findById(dados.categoriaId))) {
      throw new HttpError(400, 'Categoria inválida');
    }
  }
}

module.exports = new LivroService();
