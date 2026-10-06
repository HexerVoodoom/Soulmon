import { simulateDungeonRunV3 } from '../src/utils/dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES } from '../src/utils/combate/specials';
import { PROFISSAO_MASMORRA, JEITO_PADRAO, jeitoDaProfissao } from '../src/utils/profissaoMasmorra';
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: SPECIAL_FAMILIES[(s >> 4) % 7] });
const N = 800;
const run = (jeito: any, knobs?: any) => { const t: number[] = []; const w: number[] = []; for (let s = 0; s < N; s++) { const r = simulateDungeonRunV3({ ...cell(s), jeito, knobs }, s, 'media', 3); t.push(...r.timesByFloor.flat()); w.push(r.floorsCleared); } return { t: mean(t), w: mean(w) }; };
const b0 = run(undefined);
console.log('padrao', b0);
for (const k of Object.keys(PROFISSAO_MASMORRA)) { const b = run(jeitoDaProfissao(k)); console.log(k, ((b.t / b0.t - 1) * 100).toFixed(1) + '%', 'andares', b.w.toFixed(2)); }
const raw = run({ ...JEITO_PADRAO, contraAtaque: 10 }, { contraTeto: Infinity }); console.log('contraAtaque 10 sem teto', ((raw.t / b0.t - 1) * 100).toFixed(1) + '%', raw.w.toFixed(2));
const cap = run({ ...JEITO_PADRAO, contraAtaque: 10 }); console.log('contraAtaque 10 com teto', ((cap.t / b0.t - 1) * 100).toFixed(1) + '%', cap.w.toFixed(2));
const al = run(jeitoDaProfissao('alquimista'), { contraTeto: Infinity }); console.log('alquimista sem teto', ((al.t / b0.t - 1) * 100).toFixed(1) + '%');
