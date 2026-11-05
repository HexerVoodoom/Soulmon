-- Volta atras (executar a mao: wrangler d1 execute DB --file migrations/0001_inscritos.down.sql). Destroi os dados.
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS limite_ip;
DROP TABLE IF EXISTS inscritos;
