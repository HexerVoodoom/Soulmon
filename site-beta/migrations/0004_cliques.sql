-- Cliques no botao "Entrar no beta" (Google Group), contados por dia e UTM. Agregado, sem identificador nem IP.
-- Reversivel: DROP TABLE cliques_grupo;
CREATE TABLE IF NOT EXISTS cliques_grupo (
  dia TEXT NOT NULL,
  idioma TEXT NOT NULL,
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL,
  PRIMARY KEY (dia, idioma, utm_source, utm_medium, utm_campaign)
);
