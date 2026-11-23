// Uso: node scripts/exportar.mjs [caminho.csv] [--remote]
// CSV fica FORA do repo (default E:/Soulmon-marketing/inscritos/).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarExecutor } from './_db.mjs';

const COLUNAS = ['id', 'email', 'idioma', 'utm_source', 'utm_medium', 'utm_campaign', 'politica_versao', 'aceite_em',
  'leva', 'convidado_em', 'instalou_em', 'optin_em', 'ativo_ate', 'criado_dia'];
const PERIGOSO = /^[=+\-@\t\r]/;

export function gerarCsv(linhas) {
  const saida = [COLUNAS.join(',')];
  for (const l of linhas) {
    const campos = COLUNAS.map((c) => {
      const v = l[c] === null || l[c] === undefined ? '' : String(l[c]);
      if (PERIGOSO.test(v)) throw new Error('Exportacao abortada: campo ' + c + ' (id ' + l.id + ') comeca com caractere de formula');
      return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    });
    saida.push(campos.join(','));
  }
  return saida.join('\r\n') + '\r\n';
}

const dias = (a, b) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);

// Relogio da Play: 12 testadores por 14 dias continuos. Ativo = jogo aberto ontem ou hoje.
export function resumoRelogio(linhas, hoje) {
  const optin = linhas.filter((l) => l.optin_em);
  const ativos = optin.filter((l) => l.ativo_ate && dias(l.ativo_ate, hoje) <= 1);
  const ativosCom14 = ativos.filter((l) => dias(l.optin_em.slice(0, 10), hoje) >= 14);
  const maisNovo = ativos.length ? Math.min(...ativos.map((l) => dias(l.optin_em.slice(0, 10), hoje))) : 0;
  return [
    'Relogio dos 12 testadores x 14 dias',
    '  opt-in: ' + optin.length + ' | ativos agora: ' + ativos.length + ' | ativos com 14+ dias: ' + ativosCom14.length + '/12',
    '  ' + (ativosCom14.length >= 12 ? 'CRITERIO ATINGIDO' : 'falta(m) ' + Math.max(0, 12 - ativos.length) + ' ativo(s); o mais novo tem ' + maisNovo + ' dia(s)'),
  ].join('\n');
}

// Estados internos: a ordem de inscricao define quem esta na leva; o resto e lista de espera.
export function resumoEstados(linhas, vagas = 50) {
  const c = { aceito: 0, convite: 0, valido: 0, espera: 0 };
  linhas.forEach((l, i) => {
    if (l.optin_em) c.aceito++;
    else if (l.convidado_em) c.convite++;
    else if (i < vagas) c.valido++;
    else c.espera++;
  });
  return 'Estados: aceito ' + c.aceito + ' | convite enviado ' + c.convite + ' | inscrito valido ' + c.valido + ' | lista de espera ' + c.espera;
}

// Contagem agregada de conversao (tabela conversao): tentativas que deram certo x que falharam, por dia.
export function resumoConversao(linhas) {
  if (!linhas.length) return 'Conversao: sem registros ainda';
  const por = new Map();
  for (const l of linhas) {
    const d = por.get(l.dia) || { form_success: 0, form_error: 0 };
    d[l.evento] = Number(l.n);
    por.set(l.dia, d);
  }
  let ok = 0; let err = 0;
  const dias = [...por.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([dia, d]) => {
    ok += d.form_success; err += d.form_error;
    return '  ' + dia + ': sucesso ' + d.form_success + ' | erro ' + d.form_error;
  });
  const total = ok + err;
  return ['Conversao (agregado, sem identificador): sucesso ' + ok + ' | erro ' + err + (total ? ' | ' + Math.round((ok / total) * 100) + '% de sucesso' : ''), ...dias].join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const remote = argv.includes('--remote');
  const alvo = argv.find((a) => !a.startsWith('--'));
  const hoje = new Date().toISOString().slice(0, 10);
  const dir = 'E:/Soulmon-marketing/inscritos/';
  const arq = alvo || path.join(dir, 'inscritos-' + hoje + '.csv');
  const linhas = criarExecutor({ remote })('SELECT * FROM inscritos ORDER BY id');
  const csv = gerarCsv(linhas);
  mkdirSync(path.dirname(arq), { recursive: true });
  writeFileSync(arq, csv, 'utf8');
  console.log(linhas.length + ' inscritos -> ' + arq);
  console.log(resumoEstados(linhas));
  console.log(resumoRelogio(linhas, hoje));
  let conv = [];
  try { conv = criarExecutor({ remote })('SELECT dia, evento, n FROM conversao ORDER BY dia'); }
  catch { console.log('Conversao: tabela ausente (rode a migracao 0002)'); return; }
  console.log(resumoConversao(conv));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
