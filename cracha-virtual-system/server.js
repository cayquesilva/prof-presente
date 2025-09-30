const app = require('./src/app');
const { disconnectDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Permitir acesso externo

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📚 Documentação da API: http://${HOST}:${PORT}/api`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  
  server.close(async () => {
    console.log('✅ Servidor HTTP encerrado');
    
    try {
      await disconnectDatabase();
      console.log('✅ Conexão com banco de dados encerrada');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao encerrar conexão com banco:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  
  server.close(async () => {
    console.log('✅ Servidor HTTP encerrado');
    
    try {
      await disconnectDatabase();
      console.log('✅ Conexão com banco de dados encerrada');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao encerrar conexão com banco:', error);
      process.exit(1);
    }
  });
});

// Tratar erros não capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

module.exports = server;

