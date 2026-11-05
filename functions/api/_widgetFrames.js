// MOLDURAS DO WIDGET V-PET — o SERVIDOR é a autoridade da posse (04/11/2026, decisão do dono "endurecer já").
//
// Antes: `POST /api/save` aceitava `widgetFramesOwned` do cliente (só a forma), então um save forjado liberava as 20 molduras
// sem pagar. Agora o que vale vem de duas fontes, e só:
//  1. COMPRA (dinheiro real): vive SÓ no entitlement (`ent.frames`, concedido pelo webhook/verificação de compra em `_billing.js` /
//     `_entitlements.js`). O save nunca a carrega e nada que o cliente mande no save a concede.
//  2. EVOLUÇÃO: `widgetFramesOwned` do save = (o que o servidor JÁ tinha gravado, intersectado com o catálogo) ∪ (a moldura do
//     elemento BASE do pet, derivada do save recebido, só para quem já evoluiu). O que o cliente manda a mais é descartado.
//
// LIMITE HONESTO: não existe no servidor um registro autoritativo de evolução (`unlockedEvolutions`/`soulmonMeta` são escritos pelo
// cliente, como o resto do save). Um save forjado ainda pode "evoluir" no papel, mas só ganha a moldura do PRÓPRIO elemento do pet (1 de 20),
// que é o que a evolução real daria — não as outras 19 e nunca as pagas. Cosmético puro; não entra em economia nem combate.
import { COUNTER_RING, baseDominante } from './_elementoBase.js';
import { petElementDeSave } from './_duel.js';

/** Lista do cliente/gravada reduzida ao catálogo, sem repetição. */
export function onlyCatalogFrames(raw) {
  return Array.isArray(raw) ? [...new Set(raw.filter(v => typeof v === 'string' && COUNTER_RING.includes(v)))] : [];
}

/** A moldura que a evolução do pet libera segundo o SAVE recebido, ou `null` (não evoluiu, neutro, elemento desconhecido). Espelho de `grantFrameOnEvolution`. */
export function evolutionFrameOf(state) {
  if (!state || typeof state !== 'object') return null;
  const evo = state.unlockedEvolutions;
  if (!Array.isArray(evo) || evo.length <= 1) return null;
  const { el, neutro, base: baseReg } = petElementDeSave(state);
  if (neutro) return null;
  const potion = typeof state.potionElement === 'string' && COUNTER_RING.includes(baseDominante(state.potionElement)) ? state.potionElement : null;
  const base = !potion && baseReg ? baseReg : baseDominante(potion ?? el ?? '');
  return COUNTER_RING.includes(base) ? base : null;
}

/** A posse gravada no save: `gravado` (já aceito antes) ∪ a de evolução. O `veio` do cliente NÃO entra. */
export function enforceWidgetFramesOwned(state, gravado) {
  const out = onlyCatalogFrames(gravado);
  const ev = evolutionFrameOf(state);
  if (ev && !out.includes(ev)) out.push(ev);
  return out;
}
