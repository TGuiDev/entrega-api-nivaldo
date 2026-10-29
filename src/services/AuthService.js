const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/UsuarioRepository');
const Usuario = require('../models/Usuario');
const Perfil = require('../models/Perfil');
const HttpError = require('../utils/HttpError');
const { gerarHash, conferir } = require('../utils/senha');

const SEGREDO = process.env.JWT_SECRET || 'segredo-de-desenvolvimento';
const EXPIRACAO = '8h';

class AuthService {
  async login(email, senha) {
    const usuario = email ? await usuarioRepository.findByEmail(email) : null;
    if (!usuario || !senha || !conferir(senha, usuario.senhaHash)) {
      throw new HttpError(401, 'E-mail ou senha inválidos');
    }
    return { token: this.gerarToken(usuario), usuario };
  }

  // Autocadastro: sempre cria um usuário com perfil LEITOR
  async registrar({ nome, email, telefone, senha }) {
    if (!nome || !email) throw new HttpError(400, 'Nome e e-mail são obrigatórios');
    if (!senha || senha.length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres');
    if (await usuarioRepository.findByEmail(email)) throw new HttpError(409, 'E-mail já cadastrado');

    const usuario = await usuarioRepository.save(
      new Usuario({ nome, email, telefone, senhaHash: gerarHash(senha), perfil: Perfil.LEITOR })
    );
    return { token: this.gerarToken(usuario), usuario };
  }

  gerarToken(usuario) {
    return jwt.sign({ id: usuario.id, perfil: usuario.perfil }, SEGREDO, { expiresIn: EXPIRACAO });
  }

  verificarToken(token) {
    try {
      return jwt.verify(token, SEGREDO);
    } catch {
      throw new HttpError(401, 'Sessão inválida ou expirada');
    }
  }

  async perfilDe(id) {
    const usuario = await usuarioRepository.findById(id);
    if (!usuario) throw new HttpError(401, 'Usuário não existe mais');
    return usuario;
  }
}

module.exports = new AuthService();
