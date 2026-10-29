const Repository = require('./Repository');
const Autor = require('../models/Autor');

class AutorRepository extends Repository {
  constructor() {
    super('autores', Autor, { nome: 'nome', nacionalidade: 'nacionalidade' });
  }
}

module.exports = new AutorRepository();
