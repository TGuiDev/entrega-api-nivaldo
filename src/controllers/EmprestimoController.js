const emprestimoService = require('../services/EmprestimoService');
const Perfil = require('../models/Perfil');

const ehBibliotecario = (req) => req.usuario.perfil === Perfil.BIBLIOTECARIO;

class EmprestimoController {
  constructor() {
    this.emprestimoService = emprestimoService;
  }

  // GET /emprestimos?status=&usuarioId=&livroId=
  // Leitor só enxerga os próprios empréstimos
  listar = async (req, res) => {
    const filtros = { ...req.query };
    if (!ehBibliotecario(req)) filtros.usuarioId = req.usuario.id;
    res.json(await this.emprestimoService.listarTodos(filtros));
  };

  // POST /emprestimos  { "livroId": 2, "usuarioId": 1 }
  // Leitor empresta sempre para si; bibliotecário pode informar o usuarioId
  realizar = async (req, res) => {
    const { livroId } = req.body;
    const usuarioId = ehBibliotecario(req) && req.body.usuarioId ? req.body.usuarioId : req.usuario.id;
    res.status(201).json(await this.emprestimoService.realizarEmprestimo(usuarioId, livroId));
  };

  // PUT /emprestimos/:id/devolucao
  devolver = async (req, res) => {
    res.json(await this.emprestimoService.registrarDevolucao(req.params.id, req.usuario));
  };

  // GET /emprestimos/atrasados
  listarAtrasados = async (req, res) => {
    res.json(await this.emprestimoService.buscarAtrasados());
  };
}

module.exports = new EmprestimoController();
