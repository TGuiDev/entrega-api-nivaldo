const authService = require('../services/AuthService');

class AuthController {
  // POST /auth/login  { "email": "...", "senha": "..." }
  login = async (req, res) => {
    const { email, senha } = req.body;
    res.json(await authService.login(email, senha));
  };

  // POST /auth/registrar  { "nome", "email", "telefone", "senha" }
  registrar = async (req, res) => {
    res.status(201).json(await authService.registrar(req.body));
  };

  // GET /auth/me
  me = async (req, res) => {
    res.json(await authService.perfilDe(req.usuario.id));
  };
}

module.exports = new AuthController();
