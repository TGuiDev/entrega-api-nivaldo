const Repository = require('./Repository');
const Categoria = require('../models/Categoria');

class CategoriaRepository extends Repository {
  constructor() {
    super('categorias', Categoria, { nome: 'nome' });
  }
}

module.exports = new CategoriaRepository();
