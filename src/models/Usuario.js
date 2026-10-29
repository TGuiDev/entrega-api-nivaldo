const Perfil = require('./Perfil');

const LIMITE_EMPRESTIMOS = 3;

class Usuario {
  constructor({ id, nome, email, telefone, senhaHash = null, perfil = Perfil.LEITOR }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.telefone = telefone;
    this.senhaHash = senhaHash;
    this.perfil = perfil;
  }

  // O usuário pode ter no máximo 3 empréstimos em aberto
  podeEmprestar(qtdEmprestimosEmAberto) {
    return qtdEmprestimosEmAberto < LIMITE_EMPRESTIMOS;
  }

  // Nunca expõe o hash da senha nas respostas
  toJSON() {
    const { senhaHash, ...publico } = this;
    return publico;
  }
}

module.exports = Usuario;
