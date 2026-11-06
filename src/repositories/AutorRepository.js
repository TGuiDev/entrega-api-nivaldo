const Repository = require('./Repository');
const Autor = require('../models/Autor');
const db = require('../db');

class AutorRepository extends Repository {
  constructor() {
    super('autores', Autor, { nome: 'nome', nacionalidade: 'nacionalidade' });
  }

  // Verifica duplicidade de nome (sem diferenciar maiúsculas), ignorando o próprio autor ao editar
  async existeComNome(nome, ignorarId = null) {
    const { rows } = await db.query(
      'SELECT 1 FROM autores WHERE lower(nome) = lower($1) AND ($2::int IS NULL OR id <> $2) LIMIT 1',
      [nome, ignorarId ? Number(ignorarId) : null],
    );
    return rows.length > 0;
  }
}

module.exports = new AutorRepository();
