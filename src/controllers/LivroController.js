const livroService = require('../services/LivroService');

class LivroController {
  constructor() {
    this.livroService = livroService;
  }

  // GET /livros
  listar = async (req, res) => {
    res.json(await this.livroService.listarTodos(req.query));
  };

  // GET /livros/:id
  buscarPorId = async (req, res) => {
    res.json(await this.livroService.buscarPorId(req.params.id));
  };

  // POST /livros
  cadastrar = async (req, res) => {
    res.status(201).json(await this.livroService.salvar(req.body));
  };

  // PUT /livros/:id
  atualizar = async (req, res) => {
    res.json(await this.livroService.atualizar(req.params.id, req.body));
  };

  // DELETE /livros/:id
  remover = async (req, res) => {
    await this.livroService.excluir(req.params.id);
    res.status(204).send();
  };
}

module.exports = new LivroController();
