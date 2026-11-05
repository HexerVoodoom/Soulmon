/**
 * PROMPTS DOS SIMULADOS, SAÍDOS DO ORÁCULO REAL (REGISTRO §234). Sem texto de estilo próprio.
 *
 * O mesmo pipeline do onboarding (`buildSoulProfile` + `generateOracleComplete`), com entrada determinística por id:
 * elemento e alinhamento vão como override, o ajuste manual que o jogador também tem; o secundário fica automático (decisão do dono).
 * Sem os 20 itens do teste os traços ficam neutros, caminho previsto no onboarding.
 *
 * Rodar: `node scripts/simulados-prompts-run.mjs [--out <pasta>]`. Só escreve em disco:
 *   prompts.json     { id: { forma: { prompt, fallback } } }, lido pela fila local;
 *   prompts-kv.json  [{ key, value }], para `wrangler kv bulk put` nas chaves `sim:prompt:<id>:<forma>`. Semear é passo manual.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSoulProfile, generateOracleComplete } from '../src/utils/soulProfile';
import { ORACLE_QUESTIONS, creatureFormId, type ElementId, type AlignmentId, type OracleInput } from '../src/utils/oracle';
import { SIMULADOS } from '../functions/api/_simulados.data.js';
import { formasDaLinha, SAIDA_PADRAO } from './simulados-sprites-fila.mjs';

type Perfil = { id: string; petName: string; element: string; line: string };
export type PromptsDaForma = { prompt: string; fallback: string };

const respostasDa = (linha: string): Record<string, string> => {
  const r: Record<string, string> = {};
  for (const q of ORACLE_QUESTIONS) {
    let melhor = q.options[0];
    let nota = -Infinity;
    for (const o of q.options) {
      const v = (o.effects.alignments as Record<string, number> | undefined)?.[linha] ?? 0;
      if (v > nota) { nota = v; melhor = o; }
    }
    r[q.id] = melhor.id;
  }
  return r;
};

/** Pessoa fictícia estável: o mesmo id dá sempre a mesma entrada. */
export function entradaDoSimulado(p: Perfil): OracleInput {
  const n = Number(p.id.slice(4));
  const base = {
    fullName: p.petName,
    birthDate: `199${n % 10}-0${1 + (n % 9)}-1${n % 9}`,
    birthTime: '12:00',
    birthPlace: 'São Paulo, Brasil',
  };
  const soulProfile = buildSoulProfile({
    ...base, timeUnknown: false, placeLabel: base.birthPlace, latitude: -23.55, longitude: -46.63, timeZone: 'America/Sao_Paulo',
  }, {});
  return { ...base, answers: respostasDa(p.line), soulProfile };
}

/** Os prompts das 5 formas da linha do simulado. Falta de forma é erro: nunca gera com prompt inventado. */
export async function promptsDoSimulado(p: Perfil): Promise<Record<string, PromptsDaForma>> {
  const { result } = await generateOracleComplete(entradaDoSimulado(p), Number(p.id.slice(4)), {
    dominantElement: p.element as ElementId, dominantAlignment: p.line as AlignmentId,
  });
  const out: Record<string, PromptsDaForma> = {};
  for (const forma of formasDaLinha(p.line)) {
    const s = result.creature.stages.find((st) => creatureFormId(st) === forma);
    if (!s?.imagePrompt) throw new Error(`${p.id}: Oráculo sem a forma ${forma}`);
    out[forma] = { prompt: s.imagePrompt, fallback: s.imagePromptFallback };
  }
  return out;
}

export async function main(argv: string[]) {
  const i = argv.indexOf('--out');
  const pasta = i >= 0 ? argv[i + 1] : SAIDA_PADRAO;
  const todos: Record<string, Record<string, PromptsDaForma>> = {};
  for (const p of SIMULADOS) todos[p.id] = await promptsDoSimulado(p);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'prompts.json'), JSON.stringify(todos, null, 1));
  const kv = Object.entries(todos).flatMap(([id, formas]) => Object.entries(formas).map(([forma, v]) => ({ key: `sim:prompt:${id}:${forma}`, value: JSON.stringify(v) })));
  writeFileSync(join(pasta, 'prompts-kv.json'), JSON.stringify(kv));
  console.log(`${Object.keys(todos).length} simulados, ${kv.length} prompts em ${pasta}. Nada foi gravado no KV.`);
}
