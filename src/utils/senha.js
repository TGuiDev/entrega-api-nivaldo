const crypto = require('crypto');

// Hash de senha com scrypt (nativo do Node), no formato "salt:hash"
function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function conferir(senha, armazenado) {
  if (!armazenado) return false;
  const [salt, hash] = armazenado.split(':');
  const calculado = crypto.scryptSync(senha, salt, 64);
  return crypto.timingSafeEqual(calculado, Buffer.from(hash, 'hex'));
}

module.exports = { gerarHash, conferir };
