// Uso:
//   node scripts/proxima-leva.mjs <n> [--marcar] [--leva N] [--remote]   proximos n da fila (so imprime; --marcar grava convidado_em)
//   node scripts/proxima-leva.mjs --optin <email>    marca optin_em (entrou no teste fechado)
//   node scripts/proxima-leva.mjs --ativo <email>    marca ativo_ate = hoje (jogo aberto)
// Convite vale 7 dias: quem tem convidado_em ha mais de 7 dias sem instalou_em aparece como vaga a liberar.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarExecutor, chaveDoEmail, sqlStr } from './_db.mjs';

const MS_DIA = 86400000;

export function proximaLeva(run, n, { marcar = false, leva = null, agora = new Date() } = {}) {
  if (!Number.isInteger(n) || n <= 0 || n > 500) throw new Error('n invalido');
  const limite = new Date(agora.getTime() - 7 * MS_DIA).toISOString();
  const expirados = run(
    'SELECT id, email, convidado_em FROM inscritos WHERE convidado_em IS NOT NULL AND convidado_em < ' + sqlStr(limite) +
    ' AND instalou_em IS NULL ORDER BY convidado_em',
  );
  const fila = run('SELECT id, email, idioma FROM inscritos WHERE convidado_em IS NULL ORDER BY id LIMIT ' + n);
  if (marcar && fila.length) {
    const ids = fila.map((l) => Number(l.id)).join(',');
    run('UPDATE inscritos SET convidado_em = ' + sqlStr(agora.toISOString()) +
      (leva ? ', leva = ' + Number(leva) : '') + ' WHERE id IN (' + ids + ')');
  }
  return {
    fila,
    expirados,
    linhaBetaEmails: fila.map((l) => l.email).join(','),
    marcados: marcar ? fila.length : 0,
  };
}

export async function marcar(run, tipo, email, sal, agora = new Date()) {
  const chave = await chaveDoEmail(email, sal);
  const hoje = agora.toISOString().slice(0, 10);
  const set = tipo === 'optin'
    ? 'optin_em = COALESCE(optin_em, ' + sqlStr(agora.toISOString()) + '), ativo_ate = ' + sqlStr(hoje)
    : 'ativo_ate = ' + sqlStr(hoje);
  run('UPDATE inscritos SET ' + set + ' WHERE chave = ' + sqlStr(chave));
  return run('SELECT COUNT(*) AS n FROM inscritos WHERE chave = ' + sqlStr(chave) + ' AND ativo_ate = ' + sqlStr(hoje))[0].n === 1;
}

async function main() {
  const argv = process.argv.slice(2);
  const run = criarExecutor({ remote: argv.includes('--remote') });
  for (const tipo of ['optin', 'ativo']) {
    const i = argv.indexOf('--' + tipo);
    if (i >= 0) {
      const ok = await marcar(run, tipo, argv[i + 1]);
      console.log(ok ? tipo + ' marcado' : 'e-mail nao encontrado');
      return;
    }
  }
  const n = Number.parseInt(argv.find((a) => /^\d+$/.test(a)), 10);
  const iLeva = argv.indexOf('--leva');
  const r = proximaLeva(run, n, { marcar: argv.includes('--marcar'), leva: iLeva >= 0 ? argv[iLeva + 1] : null });
  console.log('Vagas a liberar (convite > 7 dias sem instalar): ' + r.expirados.length);
  for (const l of r.expirados) console.log('  id ' + l.id + ' ' + l.email + ' convidado em ' + l.convidado_em);
  console.log('\nProximos ' + r.fila.length + ' da fila:');
  for (const l of r.fila) console.log('  id ' + l.id + ' ' + l.email + ' (' + l.idioma + ')');
  console.log('\nLinha para BETA_EMAILS:\n' + r.linhaBetaEmails);
  console.log('\nTexto do convite (o dono envia; vale 7 dias):');
  console.log('Voce se inscreveu no beta do Soulmon neste endereco e sua vaga abriu. Entre pelo link do teste fechado em 7 dias. ' +
    'Se nao foi voce ou quiser sair, responda este e-mail e removemos seus dados.');
  console.log(r.marcados ? '\n' + r.marcados + ' marcados como convidados.' : '\n(nada gravado; use --marcar depois de enviar)');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
