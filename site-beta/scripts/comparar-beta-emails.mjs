// Compara o secret BETA_EMAILS (valor atual) com a lista de testadores, sem rede.
// Uso: node scripts/comparar-beta-emails.mjs --atual <arq> --testadores <arq> [--saida <pasta>]
// Imprime so contagens e iniciais mascaradas; o detalhe vai para arquivos FORA do repo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Copia fiel de normalizeEmail/canonBetaEmail de functions/api/_betaAccess.js do app.
export const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase();
export function canonBetaEmail(email) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.split('+')[0].replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

export const emailPlausivel = (e) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(e);

export function mascarar(e) {
  const at = e.lastIndexOf('@');
  if (at < 1) return e.slice(0, 1) + '***';
  return e.slice(0, 1) + '***' + e.slice(at);
}

// Aceita virgula/;/espaco/quebra de linha, ou CSV com cabecalho `email`.
export function lerEntradas(texto) {
  const linhas = String(texto ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const cab = linhas[0].split(',').map((s) => s.trim().toLowerCase().replace(/^"|"$/g, ''));
  const col = cab.indexOf('email');
  if (col >= 0 && (cab.length > 1 || linhas.length > 1) && !cab[col].includes('@')) {
    return linhas.slice(1).filter((l) => l.trim()).map((l) => (l.split(',')[col] || '').trim().replace(/^"|"$/g, '')).filter(Boolean);
  }
  return String(texto ?? '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
}

function analisarLista(brutos) {
  const validos = [], invalidos = [];
  for (const b of brutos) (emailPlausivel(normalizeEmail(b)) ? validos : invalidos).push(b);
  const vistos = new Set(), duplicatas = [];
  for (const c of validos.map(canonBetaEmail)) { if (vistos.has(c)) duplicatas.push(c); vistos.add(c); }
  // entradas escritas diferente que viram o mesmo endereco pela regra do Gmail
  const porCanon = new Map();
  for (const b of validos) {
    const c = canonBetaEmail(b);
    if (!porCanon.has(c)) porCanon.set(c, new Set());
    porCanon.get(c).add(normalizeEmail(b));
  }
  const juntadas = [...porCanon].filter(([, s]) => s.size > 1).map(([c]) => c);
  return { conjunto: vistos, duplicatas: [...new Set(duplicatas)], invalidos, juntadas, total: brutos.length };
}

export function comparar(textoAtual, textoTestadores) {
  const a = analisarLista(lerEntradas(textoAtual));
  const t = analisarLista(lerEntradas(textoTestadores));
  const ambos = [...t.conjunto].filter((e) => a.conjunto.has(e));
  const faltam = [...t.conjunto].filter((e) => !a.conjunto.has(e));
  const aMais = [...a.conjunto].filter((e) => !t.conjunto.has(e));
  const uniao = [...new Set([...a.conjunto, ...t.conjunto])].sort();
  return { atual: a, testadores: t, ambos, faltam, aMais, uniao };
}

export function resumo(r) {
  const m = (l) => (l.length ? ' ' + l.slice(0, 5).map(mascarar).join(' ') + (l.length > 5 ? ' ...' : '') : '');
  return [
    `Atual (secret): ${r.atual.total} entradas, ${r.atual.conjunto.size} unicas`,
    `Testadores: ${r.testadores.total} entradas, ${r.testadores.conjunto.size} unicas`,
    `Em ambas: ${r.ambos.length}`,
    `So em testadores (faltam no secret, seriam barrados com 403): ${r.faltam.length}${m(r.faltam)}`,
    `So no atual (a mais): ${r.aMais.length}${m(r.aMais)}`,
    `Duplicatas: atual ${r.atual.duplicatas.length}, testadores ${r.testadores.duplicatas.length}`,
    `Invalidas: atual ${r.atual.invalidos.length}, testadores ${r.testadores.invalidos.length}`,
    `AVISO: a regra do Gmail (sem pontos e sem +tag) pode juntar duas entradas em uma (atual ${r.atual.juntadas.length}, testadores ${r.testadores.juntadas.length}).`,
  ].join('\n');
}

export function detalhe(r) {
  const sec = (t, l) => `## ${t} (${l.length})\n${l.join('\n')}\n`;
  return [
    '# Comparacao BETA_EMAILS (contem e-mails; nao commitar)\n',
    sec('Faltam no secret', r.faltam), sec('A mais no atual', r.aMais), sec('Em ambas', r.ambos),
    sec('Duplicatas atual', r.atual.duplicatas), sec('Duplicatas testadores', r.testadores.duplicatas),
    sec('Invalidas atual', r.atual.invalidos), sec('Invalidas testadores', r.testadores.invalidos),
    sec('Juntadas pela regra do Gmail (atual)', r.atual.juntadas), sec('Juntadas pela regra do Gmail (testadores)', r.testadores.juntadas),
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const fa = arg('--atual'), ft = arg('--testadores');
  if (!fa || !ft) { console.error('uso: comparar-beta --atual <arquivo> --testadores <arquivo> [--saida <pasta>]'); process.exit(1); }
  const r = comparar(readFileSync(fa, 'utf8'), readFileSync(ft, 'utf8'));
  const dir = arg('--saida') || 'E:/Soulmon-marketing/inscritos';
  mkdirSync(dir, { recursive: true });
  const data = new Date().toISOString().slice(0, 10);
  const fd = path.join(dir, `comparacao-${data}.txt`), fs = path.join(dir, `beta-emails-sugerido-${data}.txt`);
  writeFileSync(fd, detalhe(r));
  writeFileSync(fs, r.uniao.join(','));
  console.log(resumo(r));
  console.log(`\nDetalhe completo: ${fd}\nNovo valor sugerido (nao impresso): ${fs}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
