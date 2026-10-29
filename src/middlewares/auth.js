const authService = require('../services/AuthService');
const HttpError = require('../utils/HttpError');

// Exige "Authorization: Bearer <token>" e preenche req.usuario = { id, perfil }
function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new HttpError(401, 'Autenticação necessária'));
  try {
    const { id, perfil } = authService.verificarToken(token);
    req.usuario = { id, perfil };
    next();
  } catch (erro) {
    next(erro);
  }
}

// Restringe a rota a um ou mais perfis
const exigirPerfil = (...perfis) => (req, res, next) => {
  if (!perfis.includes(req.usuario.perfil)) {
    return next(new HttpError(403, 'Você não tem permissão para esta ação'));
  }
  next();
};

module.exports = { autenticar, exigirPerfil };
