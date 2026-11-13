-- Medicao agregada do site (relatorio de funil 13/11/2026): visitas, aparelho, pais, origem, rolagem, tempo e secoes vistas.
-- Uma linha por (dia, evento, idioma, aparelho, pais, utm, referrer). Sem IP, cookie, e-mail ou identificador: nao precisa de banner.
-- Reversivel: DROP TABLE eventos_site;
CREATE TABLE IF NOT EXISTS eventos_site (
  dia TEXT NOT NULL,
  evento TEXT NOT NULL,
  idioma TEXT NOT NULL,
  aparelho TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  ref TEXT NOT NULL DEFAULT '',
  n INTEGER NOT NULL,
  PRIMARY KEY (dia, evento, idioma, aparelho, pais, utm_source, utm_medium, utm_campaign, ref)
);
