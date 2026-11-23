/**
 * UM MOTIVO DE TEMPO POR CRIATURA (dono, 13/11/2026, REGISTRO §324) — dono único da regra.
 *
 * Criatura de tempo saía coberta de ampulhetas E relógios ao mesmo tempo, e os dois juntos ficam estranhos. Regra: cada criatura leva
 * OU ampulheta OU relógio (mostrador/ponteiros), nunca os dois, e no máximo UM motivo pequeno, sem repetir pelo corpo. A espécie e o
 * elemento mandam, não a decoração. Areia solta ("drifting sand", a palavra-chave do tempo) não é motivo: pode ir com qualquer um.
 *
 * Quem escolhe (estável, nunca sorteio de momento):
 *   1. o elemento, quando a variante dele pende para um lado (`motivoTempoDoElemento` em `elementoCombinado.ts`: areia, ruína e decadência
 *      → ampulheta; mecânico e velocidade → relógio; o kit de arte do próprio elemento já desenhado vence);
 *   2. senão, o motivo que o prompt da criatura JÁ tem (o Oráculo escolhe um por criatura);
 *   3. senão, o hash estável da semente da criatura (`motivoTempoPorSemente`): a mesma criatura sempre cai no mesmo lado.
 * Só texto de prompt de gerações FUTURAS: nenhuma arte existente é refeita. Puro e idempotente (rodar duas vezes = no-op).
 */
import { hashString, mulberry32 } from './oracle/base';

export type MotivoTempo = 'ampulheta' | 'relogio';

/** O motivo pedido no prompt, em inglês (o que a cláusula e as trocas usam). */
export const MOTIVO_TEMPO_EN: Readonly<Record<MotivoTempo, string>> = {
  ampulheta: 'hourglass',
  relogio: 'clockwork dial',
};

/** Palavras de cada família. Relógio inclui mostrador, ponteiros, relógio de bolso, relógio de sol e pêndulo. */
const RE_AMPULHETA = /hourglass/i;
const RE_RELOGIO = /\bclock|\bwatch(?:es)?\b|sundial|pendulum/i;

/** Trocas de texto de uma família para a outra (mais longas primeiro). `$1` não é usado: o resultado é sempre o motivo escolhido. */
const PARA_AMPULHETA: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bclock-faced\b/gi, 'hourglass-marked'],
  [/\bclock-hand blades\b/gi, 'hourglass-shaped blades'],
  [/\b(?:brass )?clock hands and numerals\b/gi, 'a brass hourglass'],
  [/\bclock(?:work)?[ -]?(?:faces?|dials?|hands?|panels?)\b/gi, 'hourglass'],
  [/\bpocket watch(?:es)?\b/gi, 'hourglass'],
  [/\bwatch(?:es)?\b/gi, 'hourglass'],
  [/\b(?:arcane )?sundial(?: marks)?\b/gi, 'a small hourglass mark'],
  [/\b(?:swinging )?pendulums?\b/gi, 'hourglass'],
  [/\bclockwork motifs?\b/gi, 'hourglass motif'],
  [/\bclockwork\b/gi, 'hourglass'],
  [/\bclocks?\b/gi, 'hourglass'],
];
const PARA_RELOGIO: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bhourglass sand(?: grains)?\b/gi, 'sand grains'],
  [/\bhourglass-shaped\b/gi, 'dial-shaped'],
  [/\bhourglass motifs?\b/gi, 'clockwork dial motif'],
  [/\bhourglass(?:es)?\b/gi, 'clockwork dial'],
];

/** Início fixo da cláusula (o teste e a limpeza procuram por ele). */
export const CLAUSULA_TEMPO_INICIO = 'Time motif:';
/** A instrução negativa: no máximo UM motivo pequeno, nunca os dois. */
export const clausulaTempo = (m: MotivoTempo): string =>
  `${CLAUSULA_TEMPO_INICIO} at most ONE small ${MOTIVO_TEMPO_EN[m]} on the creature, never both an hourglass and a clock on the same creature, ` +
  'not repeated and not scattered over the body; the species and its element lead, not the decoration.';
const RE_CLAUSULA = / ?Time motif: at most ONE small [^;]*; the species and its element lead, not the decoration\./g;

/** O prompt sem a cláusula de tempo (o que o teste mede). */
export const semClausulaTempo = (prompt: string): string => prompt.replace(RE_CLAUSULA, '');

/** Quais famílias o texto cita (fora da cláusula). */
export function motivosNoTexto(prompt: string): MotivoTempo[] {
  const t = semClausulaTempo(prompt);
  return [...(RE_AMPULHETA.test(t) ? ['ampulheta' as const] : []), ...(RE_RELOGIO.test(t) ? ['relogio' as const] : [])];
}

/** Regra 3: o hash estável da semente decide (metade de baixo = ampulheta, de cima = relógio). FNV puro tem o bit baixo fraco: passa pelo mulberry32. */
export const motivoTempoPorSemente = (semente: string): MotivoTempo => (mulberry32(hashString(`${semente}|motivo-tempo`))() < 0.5 ? 'ampulheta' : 'relogio');

/** Corrige artigos depois da troca ("a hourglass" → "an hourglass", "an clockwork" → "a clockwork"). */
const artigos = (t: string): string => t.replace(/\b([Aa]) (hourglass)/g, '$1n $2').replace(/\b([Aa])n (clockwork|dial)/g, '$1 $2');

/**
 * Deixa o prompt com UM motivo de tempo só. `preferido` (regra 1) vence; senão o que o texto já tem (regra 2); senão a semente (regra 3).
 * Sem motivo nenhum no texto e sem `forcar`: devolve o prompt sem mudar. Com motivo (ou `forcar`, para elemento de tempo): troca as
 * palavras da outra família e acrescenta a cláusula negativa no fim, uma vez só.
 */
export function umMotivoDeTempo(prompt: string, opts: { preferido?: MotivoTempo; semente: string; forcar?: boolean }): string {
  const limpo = semClausulaTempo(prompt);
  const tem = motivosNoTexto(limpo);
  if (tem.length === 0 && !opts.forcar) return limpo;
  const escolhido = opts.preferido ?? (tem.length === 1 ? tem[0] : motivoTempoPorSemente(opts.semente));
  // O texto antigo do Oráculo pedia os dois numa frase só (prompts já salvos ainda o têm): vira UM motivo pequeno, sem "X and X".
  let t = limpo.replace(/\b(?:hourglass and clockwork|clockwork and hourglass) motifs\b/gi, `a single small ${MOTIVO_TEMPO_EN[escolhido]} motif`);
  if (tem.some(m => m !== escolhido)) {
    for (const [re, por] of escolhido === 'ampulheta' ? PARA_AMPULHETA : PARA_RELOGIO) t = t.replace(re, por);
    t = artigos(t);
  }
  return `${t} ${clausulaTempo(escolhido)}`;
}
