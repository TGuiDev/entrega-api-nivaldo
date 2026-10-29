const Repository = require('./Repository');
const Livro = require('../models/Livro');
const db = require('../db');

class LivroRepository extends Repository {
  constructor() {
    super('livros', Livro, {
      titulo: 'titulo',
      isbn: 'isbn',
      anoPublicacao: 'ano_publicacao',
      quantidadeDisponivel: 'quantidade_disponivel',
      categoriaId: 'categoria_id',
    });
  }

  selectBase() {
    return `SELECT livros.*,
      ARRAY(SELECT autor_id FROM livro_autor WHERE livro_id = livros.id ORDER BY autor_id) AS autor_ids
      FROM livros`;
  }

  paraEntidade(row) {
    const livro = super.paraEntidade(row);
    livro.autorIds = row.autor_ids;
    return livro;
  }

  // Filtros: busca (título, ISBN ou nome do autor), categoriaId, autorId, disponivel ('true')
  async findAll({ busca, categoriaId, autorId, disponivel } = {}) {
    const condicoes = [];
    const params = [];
    const p = (valor) => `$${params.push(valor)}`;

    if (busca) {
      const termo = p(`%${busca}%`);
      condicoes.push(`(livros.titulo ILIKE ${termo} OR livros.isbn ILIKE ${termo}
        OR EXISTS (SELECT 1 FROM livro_autor la JOIN autores a ON a.id = la.autor_id
                   WHERE la.livro_id = livros.id AND a.nome ILIKE ${termo}))`);
    }
    if (categoriaId) condicoes.push(`livros.categoria_id = ${p(Number(categoriaId))}`);
    if (autorId) {
      condicoes.push(`EXISTS (SELECT 1 FROM livro_autor la WHERE la.livro_id = livros.id AND la.autor_id = ${p(Number(autorId))})`);
    }
    if (disponivel === 'true') condicoes.push('livros.quantidade_disponivel > 0');

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await db.query(`${this.selectBase()} ${where} ORDER BY livros.titulo`, params);
    return rows.map((r) => this.paraEntidade(r));
  }

  // Salva o livro e a lista de autores na mesma transação
  save(livro) {
    return db.transaction(async (client) => {
      await super.save(livro, client);
      await client.query('DELETE FROM livro_autor WHERE livro_id = $1', [livro.id]);
      await client.query(
        'INSERT INTO livro_autor (livro_id, autor_id) SELECT $1, UNNEST($2::int[])',
        [livro.id, livro.autorIds]
      );
      return livro;
    });
  }
}

module.exports = new LivroRepository();
