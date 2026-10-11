// A ficha de luta de um jogador, DERIVADA DO SAVE no KV (combate v3, PR5). Dono único: `community.js`
// (duelo fantasma) e `_guerra.js` (guerra de guilda) leem DAQUI — duas cópias divergiriam em silêncio.
// O level é derivado de `evolutionStage` + `perfectDays` e LIMITADO pelo teto S1 (no máximo 1 level por dia
// de servidor desde a 1ª gravação do save, `metadata.f`). Save ausente/ilegível/gigante = `null` ("não luta").
import { kvOrThrow } from './_kv.js';
import { duelSide, maxLevelFor, DUEL_SAVE_MAX_CHARS } from './_duel.js';

const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;

export async function loadDuelSide(env, saveId) {
  if (!VALID_ID.test(saveId || '')) return null;
  try {
    const { value, metadata } = await kvOrThrow(env).getWithMetadata(saveId);
    if (!value) return null;
    // PR13 (ALTO-3): save acima do teto = "este lado não luta", ANTES do parse (CPU do worker).
    if (typeof value !== 'string' || value.length > DUEL_SAVE_MAX_CHARS) {
      console.warn('duel: save grande demais para lutar', { saveIdPrefix: String(saveId).slice(0, 8), chars: String(value?.length) });
      return null;
    }
    const state = JSON.parse(value);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    return duelSide(state, { maxLevel: maxLevelFor(metadata?.f, Date.now()) });
  } catch (err) {
    console.warn('duel: ficha indisponível', { saveIdPrefix: String(saveId).slice(0, 8), err: String(err) });
    return null;
  }
}
