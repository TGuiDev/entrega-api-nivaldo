const Repository = require('./Repository');
const Usuario = require('../models/Usuario');
const db = require('../db');

class UsuarioRepository extends Repository {
  constructor() {
    super('usuarios', Usuario, {
      nome: 'nome',
      email: 'email',
      telefone: 'telefone',
      senhaHash: 'senha_hash',
      perfil: 'perfil',
    });
  }

  async findByEmail(email) {
    const { rows } = await db.query(`${this.selectBase()} WHERE lower(email) = lower($1)`, [email]);
    return rows[0] ? this.paraEntidade(rows[0]) : null;
  }
}

module.exports = new UsuarioRepository();
