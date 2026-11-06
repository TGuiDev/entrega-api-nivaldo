const { Router } = require('express');
const livroController = require('./controllers/LivroController');
const emprestimoController = require('./controllers/EmprestimoController');
const authController = require('./controllers/AuthController');
const autorController = require('./controllers/AutorController');
const livroRepository = require('./repositories/LivroRepository');
const emprestimoService = require('./services/EmprestimoService');
const usuarioRepository = require('./repositories/UsuarioRepository');
const categoriaRepository = require('./repositories/CategoriaRepository');
const { autenticar, exigirPerfil } = require('./middlewares/auth');
const Perfil = require('./models/Perfil');

const rotas = Router();
const soBibliotecario = exigirPerfil(Perfil.BIBLIOTECARIO);

// Autenticação (públicas, exceto /me)
rotas.post('/auth/login', authController.login);
rotas.post('/auth/registrar', authController.registrar);
rotas.get('/auth/me', autenticar, authController.me);

// Tudo abaixo exige estar logado
rotas.use(autenticar);

// Livros: qualquer usuário consulta; só bibliotecário altera
rotas.get('/livros', livroController.listar);
rotas.get('/livros/:id', livroController.buscarPorId);
rotas.post('/livros', soBibliotecario, livroController.cadastrar);
rotas.put('/livros/:id', soBibliotecario, livroController.atualizar);
rotas.delete('/livros/:id', soBibliotecario, livroController.remover);

// Autores: qualquer usuário consulta; só bibliotecário altera
rotas.get('/autores', autorController.listar);
rotas.get('/autores/:id', autorController.buscarPorId);
rotas.post('/autores', soBibliotecario, autorController.cadastrar);
rotas.put('/autores/:id', soBibliotecario, autorController.atualizar);
rotas.delete('/autores/:id', soBibliotecario, autorController.remover);

// Empréstimos (/atrasados vem antes de /:id para não ser confundido com um id)
rotas.get('/emprestimos', emprestimoController.listar);
rotas.get('/emprestimos/atrasados', soBibliotecario, emprestimoController.listarAtrasados);
rotas.post('/emprestimos', emprestimoController.realizar);
rotas.put('/emprestimos/:id/devolucao', emprestimoController.devolver);

// Painel do bibliotecário
rotas.get('/estatisticas', soBibliotecario, async (req, res) => {
  const [livros, usuarios, emprestimos] = await Promise.all([
    livroRepository.findAll(),
    usuarioRepository.findAll(),
    emprestimoService.listarTodos({}),
  ]);
  res.json({
    titulos: livros.length,
    exemplaresDisponiveis: livros.reduce((soma, l) => soma + l.quantidadeDisponivel, 0),
    usuarios: usuarios.length,
    emprestimosAtivos: emprestimos.filter((e) => e.status === 'ATIVO').length,
    emprestimosAtrasados: emprestimos.filter((e) => e.status === 'ATRASADO').length,
    multaTotal: emprestimos.reduce((soma, e) => soma + e.calcularMulta(), 0),
  });
});

// Consultas auxiliares
rotas.get('/usuarios', soBibliotecario, async (req, res) => res.json(await usuarioRepository.findAll()));
rotas.get('/categorias', async (req, res) => res.json(await categoriaRepository.findAll()));

module.exports = rotas;
