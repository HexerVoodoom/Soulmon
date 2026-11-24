// Allowlist UNICA de UTM: o cliente (src/scripts/app.ts) importa este mesmo arquivo.
export const FONTES = ['instagram', 'reddit', 'youtube', 'tiktok', 'discord', 'facebook', 'whatsapp', 'outro'];
export const MEIOS = ['social', 'cpc', 'paid', 'comunidade', 'grupo', 'video', 'shorts', 'outro'];
// Sem @ e sem comecar por - ou _ (o CSV de exportacao recusa campo que comeca com = + - @).
export const CAMPANHA = /^[a-z0-9][a-z0-9_-]{0,39}$/;

const LISTAS = { source: FONTES, medium: MEIOS };

// Fora do padrao vira 'outro'; ausente vira null.
export function limparUtm(utm) {
  const saida = {};
  for (const campo of ['source', 'medium', 'campaign']) {
    const v = utm && typeof utm === 'object' ? utm[campo] : undefined;
    if (v === undefined || v === null || v === '') { saida[campo] = null; continue; }
    const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
    const ok = campo === 'campaign' ? CAMPANHA.test(s) : LISTAS[campo].includes(s);
    saida[campo] = ok ? s : 'outro';
  }
  return saida;
}
