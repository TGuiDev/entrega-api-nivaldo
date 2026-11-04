const path = require('path');
const express = require('express');
const rotas = require('./routes');
const HttpError = require('./utils/HttpError');

const app = express();

app.use(express.json());

// Front-end (build do Vite em frontend/dist). A navegação usa hash (#/), então "/" basta.
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// API disponível em /api (usada pelo front) e na raiz (compatível com requisicoes.http/Postman)
app.get('/api/saude', (req, res) => res.json({ ok: true }));
app.use('/api', rotas);
app.use(rotas);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Tratamento central de erros
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erro: err.message });
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

module.exports = app;
