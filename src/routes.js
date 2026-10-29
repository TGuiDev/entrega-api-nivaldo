const { Router } = require('express');
const livroController = require('./controllers/LivroController');
const emprestimoController = require('./controllers/EmprestimoController');
const authController = require('./controllers/AuthController');
const usuarioRepository = require('./repositories/UsuarioRepository');
const autorRepository = require('./repositories/AutorRepository');
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

// Empréstimos (/atrasados vem antes de /:id para não ser confundido com um id)
rotas.get('/emprestimos', emprestimoController.listar);
rotas.get('/emprestimos/atrasados', soBibliotecario, emprestimoController.listarAtrasados);
rotas.post('/emprestimos', emprestimoController.realizar);
rotas.put('/emprestimos/:id/devolucao', emprestimoController.devolver);

// Consultas auxiliares
rotas.get('/usuarios', soBibliotecario, async (req, res) => res.json(await usuarioRepository.findAll()));
rotas.get('/autores', async (req, res) => res.json(await autorRepository.findAll()));
rotas.get('/categorias', async (req, res) => res.json(await categoriaRepository.findAll()));

module.exports = rotas;
