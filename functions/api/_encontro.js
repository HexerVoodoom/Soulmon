// ---------------------------------------------------------------------------
// O ENCONTRO DA VOLTA (dono, 11/11/2026): toda volta da Missão traz SEMPRE um encontro (nunca vazio, nunca só "Mandar investigar").
// Sorteio determinístico por (conta, dia): reabrir o app não re-sorteia.
//   · MERCADOR  ~8% (12% com o buff "Feira" do clã): a loja rara de `_feiraLoja.js` (chance e oferta INTOCADAS).
//   · DESAFIO   ~25%: um quebra-cabeça rápido que já existe (os jogos da Trilha) e que, cumprido, dá BITS AO TESOURO DO CLÃ
//               (`somarBitsDesafio`: 10 Bits, 1×/dia por pessoa, idempotente), além do Emblema e da seiva de sempre.
//   · CHEFE     o resto (~67%): o chefe do mistério do clã (ou o resgate dele). Descanso e trilha já cumprida NÃO são encontro.
// Se o sorteado não pode abrir (sem chefe com ataque hoje, desafio já cumprido hoje), cai para o próximo que abre; o ACHADO
// (Bits pessoais pequenos, 10 a 20) só vale se NADA mais abrir.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { hash32 } from './_feira.js';
import { haFeiraDeVerdade } from './_feiraLoja.js';

/** Chance do Desafio, em % das voltas (do total, sem o buff do Mercador). */
export const DESAFIO_PCT = 25;
/** `k` sintético do desafio pessoal do dia: acima de qualquer `k` de mistério real (que cresce de 1 em 1). */
export const DESAFIO_K0 = 500000;
export const ACHADO_BITS_MIN = 10;
export const ACHADO_BITS_MAX = 20;

const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** `k` do desafio do dia (único por dia, dentro do limite do sanitizador do cliente). */
export function desafioK(hoje) {
  return DESAFIO_K0 + Math.floor(Date.parse(`${hoje}T00:00:00Z`) / 86400000) % 400000;
}
export const ehDesafioK = k => Number.isInteger(k) && k >= DESAFIO_K0;

/** O que o dado diz, ANTES de ver se abre. Determinístico em (conta, dia, buff). @returns {'mercador'|'desafio'|'chefe'} */
export function sortearEncontro(save, hoje, bonusPct = 0) {
  if (!ISO_DIA.test(hoje)) return 'chefe';
  if (haFeiraDeVerdade(save, hoje, bonusPct)) return 'mercador';
  // Sobra 92% (88% com o buff); o desafio quer 25% do TOTAL: sorteia sobre o que sobra.
  const sobra = 100 - 8 - Math.max(0, bonusPct);
  return hash32(`encontro:${save}:${hoje}:desafio`) % 10000 < Math.round((DESAFIO_PCT / sobra) * 10000) ? 'desafio' : 'chefe';
}

/**
 * Resolve o sorteado contra o que ABRE hoje. Sempre devolve um encontro.
 * @param {'mercador'|'desafio'|'chefe'} sorteado
 * @param {{ mercador: boolean, desafio: boolean, chefe: boolean }} abre
 * @returns {'mercador'|'desafio'|'chefe'|'achado'}
 */
export function resolverEncontro(sorteado, abre) {
  const ordem = sorteado === 'mercador' ? ['mercador', 'desafio', 'chefe'] : sorteado === 'desafio' ? ['desafio', 'chefe'] : ['chefe', 'desafio'];
  return /** @type {'mercador'|'desafio'|'chefe'|'achado'} */ (ordem.find(k => abre[k]) ?? 'achado');
}

/** O achado do dia (último fallback): Bits pessoais pequenos, determinístico. */
export function achadoDoDia(save, hoje) {
  return { bits: ACHADO_BITS_MIN + (hash32(`achado:${save}:${hoje}`) % (ACHADO_BITS_MAX - ACHADO_BITS_MIN + 1)) };
}

/** O `evento` sintético do desafio (o mesmo formato do mistério em Trilha, para o cliente de sempre abrir). */
export function eventoDoDesafio(hoje, level, cumprido = false) {
  return { k: desafioK(hoje), kind: 'trail', level: Math.min(20, Math.max(1, Math.floor(level) || 1)), trail: { pending: !cumprido, cleared: cumprido, marks: 0 } };
}

/** O estado sintético que `iniciarTrilha`/`entregarTrilha` aceitam. */
/** @returns {any} */
export const estadoDoDesafio = (hoje, level) => ({ phase: 'trail', kind: 'trail', desafio: true, k: desafioK(hoje), level: Math.max(1, Math.floor(level) || 1), marks: 0 });

/** O encontro JÁ resolvido da volta de hoje (gravado na volta; os endpoints do desafio conferem aqui, nunca confiam no cliente). */
export const encontroKey = (save, dia) => `encontro:${save}:${dia}`;
export async function lerEncontro(env, save, hoje) {
  try { const v = await kvOrThrow(env).get(encontroKey(save, hoje)); const r = v ? JSON.parse(v) : null; return r && typeof r.tipo === 'string' ? r : null; } catch { return null; }
}
export async function gravarEncontro(env, save, hoje, reg) {
  await kvOrThrow(env).put(encontroKey(save, hoje), JSON.stringify(reg), { expirationTtl: 3 * 24 * 3600 });
}
