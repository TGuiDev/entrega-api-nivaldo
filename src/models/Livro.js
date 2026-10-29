class Livro {
  // autorIds: um livro tem 1 ou mais autores (muitos-para-muitos)
  // categoriaId: cada livro pertence a 1 categoria
  constructor({ id, titulo, isbn, anoPublicacao, quantidadeDisponivel = 0, autorIds = [], categoriaId = null }) {
    this.id = id;
    this.titulo = titulo;
    this.isbn = isbn;
    this.anoPublicacao = anoPublicacao;
    this.quantidadeDisponivel = quantidadeDisponivel;
    this.autorIds = autorIds;
    this.categoriaId = categoriaId;
  }

  estaDisponivel() {
    return this.quantidadeDisponivel > 0;
  }

  diminuirEstoque() {
    if (!this.estaDisponivel()) {
      throw new Error('Livro sem estoque');
    }
    this.quantidadeDisponivel--;
  }

  aumentarEstoque() {
    this.quantidadeDisponivel++;
  }
}

module.exports = Livro;
