const db = require('../db');

// Repositório genérico sobre PostgreSQL.
// Implementa os métodos da "interface" Repository do diagrama.
//   tabela:  nome da tabela
//   Modelo:  classe da entidade
//   colunas: { campoDoModelo: 'coluna_no_banco' } (sem o id)
class Repository {
  constructor(tabela, Modelo, colunas) {
    this.tabela = tabela;
    this.Modelo = Modelo;
    this.colunas = colunas;
  }

  // SELECT base; subclasses podem sobrescrever para juntar dados extras
  selectBase() {
    return `SELECT * FROM ${this.tabela}`;
  }

  paraEntidade(row) {
    const dados = { id: row.id };
    for (const [campo, coluna] of Object.entries(this.colunas)) dados[campo] = row[coluna];
    return new this.Modelo(dados);
  }

  async findAll() {
    const { rows } = await db.query(`${this.selectBase()} ORDER BY id`);
    return rows.map((r) => this.paraEntidade(r));
  }

  async findById(id) {
    if (!Number.isInteger(Number(id))) return null;
    const { rows } = await db.query(`${this.selectBase()} WHERE ${this.tabela}.id = $1`, [Number(id)]);
    return rows[0] ? this.paraEntidade(rows[0]) : null;
  }

  // Insere (sem id) ou atualiza/insere (com id). `client` opcional para uso em transação.
  async save(entidade, client = db) {
    const campos = Object.keys(this.colunas);
    const colunas = campos.map((c) => this.colunas[c]);
    const valores = campos.map((c) => entidade[c]);
    if (entidade.id) {
      colunas.unshift('id');
      valores.unshift(entidade.id);
    }
    const marcadores = valores.map((_, i) => `$${i + 1}`).join(', ');
    const atualizacao = campos.map((c) => `${this.colunas[c]} = EXCLUDED.${this.colunas[c]}`).join(', ');
    const sql = entidade.id
      ? `INSERT INTO ${this.tabela} (${colunas.join(', ')}) VALUES (${marcadores})
         ON CONFLICT (id) DO UPDATE SET ${atualizacao} RETURNING id`
      : `INSERT INTO ${this.tabela} (${colunas.join(', ')}) VALUES (${marcadores}) RETURNING id`;
    const { rows } = await client.query(sql, valores);
    entidade.id = rows[0].id;
    return entidade;
  }

  async deleteById(id) {
    if (!Number.isInteger(Number(id))) return;
    await db.query(`DELETE FROM ${this.tabela} WHERE id = $1`, [Number(id)]);
  }
}

module.exports = Repository;
