const emprestimoRepository = require('../repositories/EmprestimoRepository');
const usuarioRepository = require('../repositories/UsuarioRepository');
const livroRepository = require('../repositories/LivroRepository');
const livroService = require('./LivroService');
const Emprestimo = require('../models/Emprestimo');
const StatusEmprestimo = require('../models/StatusEmprestimo');
const Perfil = require('../models/Perfil');
const HttpError = require('../utils/HttpError');

class EmprestimoService {
  constructor() {
    this.emprestimoRepository = emprestimoRepository;
    this.livroService = livroService;
  }

  async listarTodos(filtros) {
    await this.atualizarAtrasados();
    return this.emprestimoRepository.findAll(filtros);
  }

  async realizarEmprestimo(usuarioId, livroId) {
    const usuario = await usuarioRepository.findById(usuarioId);
    if (!usuario) throw new HttpError(404, 'Usuário não encontrado');

    const emAberto = await this.emprestimoRepository.findEmAbertoPorUsuario(usuario.id);
    if (!usuario.podeEmprestar(emAberto.length)) {
      throw new HttpError(422, 'Usuário atingiu o limite de empréstimos em aberto');
    }

    const livro = await this.livroService.buscarPorId(livroId);
    if (!livro.estaDisponivel()) {
      throw new HttpError(422, 'Livro indisponível no momento');
    }

    livro.diminuirEstoque();
    await livroRepository.save(livro);
    const emprestimo = new Emprestimo({ usuarioId: usuario.id, livroId: livro.id });
    return this.emprestimoRepository.save(emprestimo);
  }

  // Leitor só pode devolver os próprios empréstimos; bibliotecário devolve qualquer um
  async registrarDevolucao(id, solicitante) {
    const emprestimo = await this.emprestimoRepository.findById(id);
    if (!emprestimo) throw new HttpError(404, 'Empréstimo não encontrado');
    if (solicitante.perfil !== Perfil.BIBLIOTECARIO && emprestimo.usuarioId !== solicitante.id) {
      throw new HttpError(403, 'Você só pode devolver os seus próprios empréstimos');
    }
    if (emprestimo.status === StatusEmprestimo.DEVOLVIDO) {
      throw new HttpError(422, 'Este empréstimo já foi devolvido');
    }

    emprestimo.registrarDevolucao();
    const livro = await this.livroService.buscarPorId(emprestimo.livroId);
    livro.aumentarEstoque();
    await livroRepository.save(livro);
    return this.emprestimoRepository.save(emprestimo);
  }

  async buscarAtrasados() {
    await this.atualizarAtrasados();
    return this.emprestimoRepository.findByStatus(StatusEmprestimo.ATRASADO);
  }

  // Marca como ATRASADO todo empréstimo ativo que passou da data prevista
  async atualizarAtrasados() {
    for (const emprestimo of await this.emprestimoRepository.findByStatus(StatusEmprestimo.ATIVO)) {
      if (emprestimo.estaAtrasado()) {
        emprestimo.status = StatusEmprestimo.ATRASADO;
        await this.emprestimoRepository.save(emprestimo);
      }
    }
  }
}

module.exports = new EmprestimoService();
