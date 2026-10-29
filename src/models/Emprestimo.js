const StatusEmprestimo = require('./StatusEmprestimo');

const PRAZO_DIAS = 7;
const MULTA_POR_DIA = 2.0;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

class Emprestimo {
  constructor({ id, usuarioId, livroId, dataEmprestimo = new Date(), dataPrevistaDevolucao, dataDevolucao = null, status = StatusEmprestimo.ATIVO }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.livroId = livroId;
    this.dataEmprestimo = new Date(dataEmprestimo);
    this.dataPrevistaDevolucao = dataPrevistaDevolucao
      ? new Date(dataPrevistaDevolucao)
      : new Date(this.dataEmprestimo.getTime() + PRAZO_DIAS * UM_DIA_MS);
    this.dataDevolucao = dataDevolucao ? new Date(dataDevolucao) : null;
    this.status = status;
  }

  estaAtrasado() {
    const referencia = this.dataDevolucao || new Date();
    return referencia > this.dataPrevistaDevolucao;
  }

  calcularMulta() {
    if (!this.estaAtrasado()) return 0;
    const referencia = this.dataDevolucao || new Date();
    const diasAtraso = Math.ceil((referencia - this.dataPrevistaDevolucao) / UM_DIA_MS);
    return diasAtraso * MULTA_POR_DIA;
  }

  registrarDevolucao() {
    this.dataDevolucao = new Date();
    this.status = StatusEmprestimo.DEVOLVIDO;
  }

  // Inclui a multa calculada na resposta JSON
  toJSON() {
    return { ...this, multa: this.calcularMulta() };
  }
}

module.exports = Emprestimo;
