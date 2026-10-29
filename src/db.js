const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Usa DATABASE_URL ou as variáveis padrão do PostgreSQL (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT)
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'biblioteca',
      }
);

const query = (sql, params) => pool.query(sql, params);

// Executa fn(client) dentro de uma transação
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

// Cria as tabelas e os dados de exemplo
async function init() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);

  // Usuários de exemplo ainda sem senha recebem a senha padrão "123456"
  const { gerarHash } = require('./utils/senha');
  const { rows } = await pool.query('SELECT id FROM usuarios WHERE senha_hash IS NULL');
  for (const { id } of rows) {
    await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [gerarHash('123456'), id]);
  }
}

module.exports = { pool, query, transaction, init };
