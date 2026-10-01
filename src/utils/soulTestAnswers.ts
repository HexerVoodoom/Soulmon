/**
 * AS 20 RESPOSTAS DO TESTE LONGO NO SAVE (decisão do dono, 01/10/2026).
 *
 * Desde 01/10 todo mundo responde os 20 itens psicométricos no onboarding,
 * inclusive no caminho grátis — e ali elas eram respondidas e DESCARTADAS.
 * Agora elas entram no save (`GameState.soulTestAnswers`), no MESMO formato que
 * o ritual pago usa para montar o perfil de alma (`Answers` de
 * `utils/soulProfile/personality/types.ts`, o que `buildSoulProfile` recebe),
 * e quem compra depois NÃO responde de novo: o ritual de upgrade pula o teste
 * quando as 20 já existem (`SoulmonOnboarding`, prop `savedTestAnswers`).
 *
 * Declarado na política (`public/privacidade.html`, PT e EN).
 *
 * Sanitização ESTRUTURAL de propósito, sem importar o banco de itens: este
 * arquivo é lido no load do save (chunk de entrada), e o banco de perguntas
 * só precisa existir na tela do ritual. Item desconhecido no futuro não quebra
 * nada — o ritual pergunta o que faltar.
 */
import type { Answer, Answers } from './soulProfile/personality/types';

const LIKERT = new Set([1, 2, 3, 4, 5]);

function answerOf(v: unknown): Answer | null {
  if (!v || typeof v !== 'object') return null;
  const a = v as Record<string, unknown>;
  if (a.kind === 'likert' && typeof a.value === 'number' && LIKERT.has(a.value)) {
    return { kind: 'likert', value: a.value as 1 | 2 | 3 | 4 | 5 };
  }
  if (a.kind === 'forced-choice' && (a.choice === 'a' || a.choice === 'b')) {
    return { kind: 'forced-choice', choice: a.choice };
  }
  if (a.kind === 'scenario' && typeof a.optionId === 'string' && a.optionId.length > 0 && a.optionId.length <= 32) {
    return { kind: 'scenario', optionId: a.optionId };
  }
  return null;
}

/**
 * Só respostas bem formadas passam; id de item com teto de tamanho (o save vem
 * da nuvem também). Nada válido → `undefined` (o campo fica AUSENTE, nunca um
 * objeto vazio inventado).
 */
export function sanitizeSoulTestAnswers(v: unknown): Answers | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Answers = {};
  let n = 0;
  for (const [id, raw] of Object.entries(v as Record<string, unknown>)) {
    if (!id || id.length > 32 || n >= 64) continue;
    const a = answerOf(raw);
    if (a) { out[id] = a; n++; }
  }
  return n > 0 ? out : undefined;
}
