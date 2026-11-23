// Uso: node scripts/remover.mjs <email> [--remote]   (DELETE real; backup D1 de 7 dias esta na politica)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarExecutor, chaveDoEmail, sqlStr } from './_db.mjs';

export async function remover(run, email, sal) {
  const chave = await chaveDoEmail(email, sal);
  run('DELETE FROM inscritos WHERE chave = ' + sqlStr(chave));
  return run('SELECT COUNT(*) AS n FROM inscritos WHERE chave = ' + sqlStr(chave))[0].n === 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const email = argv.find((a) => !a.startsWith('--'));
  if (!email) { console.error('uso: remover <email> [--remote]'); process.exit(1); }
  remover(criarExecutor({ remote: argv.includes('--remote') }), email)
    .then((ok) => { console.log(ok ? 'removido (linha apagada)' : 'FALHOU: ainda existe'); process.exit(ok ? 0 : 1); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
