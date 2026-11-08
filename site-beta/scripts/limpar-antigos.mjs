// Uso: node scripts/limpar-antigos.mjs [--remote]
// Apaga (DELETE real) cadastros com mais de 12 meses. Imprime so a contagem apagada.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarExecutor } from './_db.mjs';

export const SQL_LIMPAR = "DELETE FROM inscritos WHERE criado_dia < date('now','-12 months')";

export function limparAntigos(run) {
  const antes = Number(run('SELECT COUNT(*) AS n FROM inscritos')[0].n);
  run(SQL_LIMPAR);
  return antes - Number(run('SELECT COUNT(*) AS n FROM inscritos')[0].n);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(limparAntigos(criarExecutor({ remote: process.argv.includes('--remote') })) + ' cadastros apagados'); }
  catch (e) { console.error(e.message); process.exit(1); }
}
