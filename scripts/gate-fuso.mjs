#!/usr/bin/env node
/**
 * `npm run gate:fuso` - roda a suíte de datas/hábitos em fusos que o CI (UTC) nunca vê.
 *
 * F1 (beta-play-01): `new Date('YYYY-MM-DD')` é UTC e dava o dia errado no Brasil;
 * o CI rodava só em UTC e nunca pegou. Aqui a mesma suíte (`src/utils`, onde mora
 * toda conta de dia) roda em fuso negativo (Brasil) e positivo (Tóquio).
 *
 * Uso: npm run gate:fuso              (America/Sao_Paulo + Asia/Tokyo)
 *      npm run gate:fuso -- --tudo    (a suíte inteira em America/Sao_Paulo)
 */
import { spawnSync } from 'node:child_process';

const tudo = process.argv.includes('--tudo');
const alvo = tudo ? [] : ['src/utils'];
const fusos = tudo ? ['America/Sao_Paulo'] : ['America/Sao_Paulo', 'Asia/Tokyo'];

let falhou = false;
for (const TZ of fusos) {
  console.log(`\n== vitest em TZ=${TZ} ${alvo.join(' ')}`);
  const r = spawnSync('npx', ['vitest', 'run', ...alvo], {
    stdio: 'inherit', shell: true, env: { ...process.env, TZ },
  });
  if (r.status !== 0) falhou = true;
}
process.exit(falhou ? 1 : 0);
