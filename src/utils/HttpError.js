// Erro com código HTTP, usado pelos services para avisar o controller do problema
class HttpError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

module.exports = HttpError;
