const autorRepository = require('../repositories/AutorRepository');
const Autor = require('../models/Autor');
const HttpError = require('../utils/HttpError');

class AutorService {
  constructor() {
    this.autorRepository = autorRepository;
  }

  listarTodos() {
    return this.autorRepository.findAll();
  }

  async buscarPorId(id) {
    const autor = await this.autorRepository.findById(id);
    if (!autor) throw new HttpError(404, 'Autor não encontrado');
    return autor;
  }

  async salvar(dados, id = null) {
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
    const nacionalidade = typeof dados.nacionalidade === 'string' ? dados.nacionalidade.trim() : '';
    if (!nome) throw new HttpError(400, 'O nome do autor é obrigatório');
    if (nome.length > 150) throw new HttpError(400, 'O nome deve ter no máximo 150 caracteres');
    if (nacionalidade.length > 80) throw new HttpError(400, 'A nacionalidade deve ter no máximo 80 caracteres');

    if (await this.autorRepository.existeComNome(nome, id)) {
      throw new HttpError(409, 'Já existe um autor com este nome');
    }
    const autor = new Autor({ id: id ? Number(id) : undefined, nome, nacionalidade: nacionalidade || null });
    return this.autorRepository.save(autor);
  }

  async atualizar(id, dados) {
    await this.buscarPorId(id);
    return this.salvar(dados, id);
  }

  async excluir(id) {
    await this.buscarPorId(id);
    try {
      await this.autorRepository.deleteById(id);
    } catch (erro) {
      // 23503 = foreign_key_violation (autor vinculado a livros)
      if (erro.code === '23503') throw new HttpError(409, 'Autor possui livros cadastrados e não pode ser excluído');
      throw erro;
    }
  }
}

module.exports = new AutorService();
