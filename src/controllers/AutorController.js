const autorService = require('../services/AutorService');

class AutorController {
  constructor() {
    this.autorService = autorService;
  }

  // GET /autores
  listar = async (req, res) => {
    res.json(await this.autorService.listarTodos());
  };

  // GET /autores/:id
  buscarPorId = async (req, res) => {
    res.json(await this.autorService.buscarPorId(req.params.id));
  };

  // POST /autores
  cadastrar = async (req, res) => {
    res.status(201).json(await this.autorService.salvar(req.body));
  };

  // PUT /autores/:id
  atualizar = async (req, res) => {
    res.json(await this.autorService.atualizar(req.params.id, req.body));
  };

  // DELETE /autores/:id
  remover = async (req, res) => {
    await this.autorService.excluir(req.params.id);
    res.status(204).send();
  };
}

module.exports = new AutorController();
