const app = require('./app');
const db = require('./db');

const PORTA = process.env.PORT || 3000;

db.init()
  .then(() => {
    app.listen(PORTA, () => {
      console.log(`API de Biblioteca rodando em http://localhost:${PORTA}`);
    });
  })
  .catch((erro) => {
    console.error('Falha ao conectar/inicializar o PostgreSQL:', erro.message);
    process.exit(1);
  });
