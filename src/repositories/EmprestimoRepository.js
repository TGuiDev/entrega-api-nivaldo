const Repository = require('./Repository');
const Emprestimo = require('../models/Emprestimo');
const StatusEmprestimo = require('../models/StatusEmprestimo');
const db = require('../db');

class EmprestimoRepository extends Repository {
  constructor() {
    super('emprestimos', Emprestimo, {
      usuarioId: 'usuario_id',
      livroId: 'livro_id',
      dataEmprestimo: 'data_emprestimo',
      dataPrevistaDevolucao: 'data_prevista_devolucao',
      dataDevolucao: 'data_devolucao',
      status: 'status',
    });
  }

  // Filtros: status, usuarioId, livroId
  async findAll({ status, usuarioId, livroId } = {}) {
    const condicoes = [];
    const params = [];
    if (status) condicoes.push(`status = $${params.push(String(status).toUpperCase())}`);
    if (usuarioId) condicoes.push(`usuario_id = $${params.push(Number(usuarioId))}`);
    if (livroId) condicoes.push(`livro_id = $${params.push(Number(livroId))}`);

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await db.query(`${this.selectBase()} ${where} ORDER BY id DESC`, params);
    return rows.map((r) => this.paraEntidade(r));
  }

  async findByStatus(status) {
    const { rows } = await db.query(`${this.selectBase()} WHERE status = $1 ORDER BY id`, [status]);
    return rows.map((r) => this.paraEntidade(r));
  }

  async findEmAbertoPorUsuario(usuarioId) {
    const { rows } = await db.query(
      `${this.selectBase()} WHERE usuario_id = $1 AND status <> $2 ORDER BY id`,
      [Number(usuarioId), StatusEmprestimo.DEVOLVIDO]
    );
    return rows.map((r) => this.paraEntidade(r));
  }
}

module.exports = new EmprestimoRepository();
