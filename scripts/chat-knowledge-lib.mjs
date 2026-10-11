// Constrói o índice compacto de conhecimento do chat a partir de docs/manual/.
// Puro (recebe os textos, devolve chunks) para o teste poder reconstruir e
// comparar com o arquivo gerado. Dono do formato: functions/api/_chatKnowledge.js.
import { createHash } from 'node:crypto';

export const SOURCES = ['docs/manual/02-REGRAS-DE-NEGOCIO.md', 'docs/manual/11-GLOSSARIO.md'];
export const OUT_FILE = 'functions/api/_chatKnowledge.data.js';
/** Marca (em qualquer linha do trecho) para tirar o trecho do chat: spoiler/lore secreto. */
export const SECRET_MARK = /kb:secret|\[spoiler\]|🔒\s*spoiler/i;
/** Assunto de bastidor: não é "como o jogo funciona" para quem joga. */
const BACKSTAGE = /\b(Travessias?|Passeios?|admin|administrador|ADMIN_EMAILS|GM\b|KV\b|D1\b|Worker|Firebase|endpoint|purchaseToken|service account|NÃO implementada)\b|⚰️/i;
const MAX_RULE = 520;
const MAX_TERM = 380;

export function clean(md) {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function cut(s, n) {
  if (s.length <= n) return s;
  const c = s.slice(0, n);
  const i = Math.max(c.lastIndexOf('. '), c.lastIndexOf('; '));
  return (i > n * 0.5 ? c.slice(0, i + 1) : c.replace(/\s+\S*$/, '')) + (i > n * 0.5 ? '' : '…');
}

/** Seções `## N. Título` do 02: "Em uma frase" + 1º parágrafo de prosa depois. */
export function chunkRules(md) {
  md = md.split(String.fromCharCode(13)).join('');
  const out = [];
  const parts = md.split(/\n(?=## )/);
  for (const sec of parts) {
    const m = /^## (\d+(?:-[A-Z])?)\.\s+(.+)\n/.exec(sec);
    if (!m) continue;
    if (SECRET_MARK.test(sec.slice(0, 4000))) continue;
    const title = clean(m[2]).replace(/^[^\p{L}\p{N}]+/u, '');
    const body = sec.slice(m[0].length);
    const one = /\*\*Em uma frase\.\*\*\s*([\s\S]*?)(?:\n\n|$)/.exec(body);
    if (!one) continue;
    let text = clean(one[1]);
    const rest = body.slice(one.index + one[0].length);
    for (const para of rest.split(/\n\n/)) {
      const p = para.trim();
      if (!p || /^(```|\||#|-|\d+\.|>)/.test(p)) continue;
      const c = clean(p.replace(/^\*\*A regra\.\*\*\s*/, ''));
      if (c.length > 40 && !c.endsWith(":") && !/[a-z][A-Z]|[A-Z_]{5,}/.test(c)) { text += ' ' + c; break; }
    }
    text = cut(text, MAX_RULE);
    if (BACKSTAGE.test(text) || BACKSTAGE.test(title)) continue;
    out.push({ id: `regra-${m[1].toLowerCase()}`, t: title, x: text });
  }
  return out;
}

/** Linhas `| **Termo** | O que é | ... |` do glossário. */
export function chunkGlossary(md) {
  md = md.split(String.fromCharCode(13)).join('');
  const out = [];
  const seen = new Set();
  for (const line of md.split('\n')) {
    const m = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|/.exec(line);
    if (!m) continue;
    if (SECRET_MARK.test(line)) continue;
    const term = clean(m[1]);
    let def = clean(m[2]);
    if (def.length < 25 || /^Ver\b/i.test(def)) continue;
    if (BACKSTAGE.test(def) || BACKSTAGE.test(term) || /^[a-z]+[A-Z]/.test(term)) continue; // identificador de código
    def = cut(def, MAX_TERM);
    const id = 'termo-' + term.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, t: term, x: def });
  }
  return out;
}

export function buildChunks(files) {
  return [...chunkRules(files[SOURCES[0]] ?? ''), ...chunkGlossary(files[SOURCES[1]] ?? '')];
}

export function renderModule(chunks) {
  const hash = createHash('sha256').update(JSON.stringify(chunks)).digest('hex').slice(0, 16);
  return `// GERADO por scripts/gen-chat-knowledge.mjs — NÃO EDITE À MÃO.
// Fontes: ${SOURCES.join(', ')}
// Regerar: npm run gen:chat-kb  (o teste chatKnowledge.stale reprova se ficar velho)
export const KNOWLEDGE_HASH = '${hash}';
export const KNOWLEDGE = ${JSON.stringify(chunks, null, 0).replace(/\},\{/g, '},\n{')};
`;
}
