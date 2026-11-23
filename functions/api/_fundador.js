// CONJUNTO FUNDADOR no servidor (23/11/2026) — espelho de `src/utils/fundador.ts` (paridade testada em `fundador.parity.test.js`).
// Cosmético puro: o servidor só garante a FORMA e que nada é perdido. `fundadorPremios` é UNIÃO (cliente antigo pode regravar sem o campo),
// `fundadorDias` nunca diminui e `fundadorUltimoDia` nunca anda para trás. Nada aqui toca economia.
export const FUNDADOR_PREMIOS = ['founder-fundo', 'founder-moldura', 'founder-retrato', 'furn-cristal-fundador'];
export const FUNDADOR_DIAS_MAX = 100000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const dias = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(FUNDADOR_DIAS_MAX, Math.max(0, Math.floor(v))) : 0);
const ultimo = (v) => (typeof v === 'string' && ISO.test(v) ? v : undefined);
const premios = (v) => (Array.isArray(v) ? FUNDADOR_PREMIOS.filter((id) => v.includes(id)) : []);

/**
 * Aplica ao `state` que vai ser gravado a regra monotônica contra o `gravado` (objeto do save já no KV, ou undefined).
 * Só age se um dos dois lados tem algum campo do Fundador; sem nenhum, o save segue intacto (não inventa o campo).
 */
export function enforceFundador(state, gravado) {
  const temEntrada = 'fundadorDias' in state || 'fundadorUltimoDia' in state || 'fundadorPremios' in state;
  const temGravado = !!gravado && ('fundadorDias' in gravado || 'fundadorUltimoDia' in gravado || 'fundadorPremios' in gravado);
  if (!temEntrada && !temGravado) return state;
  const d = Math.max(dias(state.fundadorDias), dias(gravado?.fundadorDias));
  const u = [ultimo(state.fundadorUltimoDia), ultimo(gravado?.fundadorUltimoDia)].filter(Boolean).sort().pop();
  const novoP = premios(state.fundadorPremios);
  const velhoP = premios(gravado?.fundadorPremios);
  const p = FUNDADOR_PREMIOS.filter((id) => novoP.includes(id) || velhoP.includes(id));
  // Campo ausente nos DOIS lados = conta existente (o cliente concede na carga): continua ausente.
  const temPremiosEmAlgum = Array.isArray(state.fundadorPremios) || Array.isArray(gravado?.fundadorPremios);
  state.fundadorDias = d;
  if (u) state.fundadorUltimoDia = u; else delete state.fundadorUltimoDia;
  if (temPremiosEmAlgum) state.fundadorPremios = p; else delete state.fundadorPremios;
  return state;
}

const com = (l, id) => { const a = Array.isArray(l) ? l.filter((x) => typeof x === 'string') : []; return a.includes(id) ? a : [...a, id]; };

/** CONCEDENTE DEV (só o dono, `save.js` › `fundadorGrant`): os 4 prêmios + posse. Idempotente: `already` = nada mudou. */
export function grantFundadorOnServer(stored) {
  const ja = premios(stored.fundadorPremios);
  const completo = FUNDADOR_PREMIOS.every((id) => ja.includes(id))
    && stored.ownedBackgrounds?.includes?.('founder-fundo') && stored.ownedFrames?.includes?.('founder-moldura') && stored.ownedFurniture?.includes?.('furn-cristal-fundador');
  if (completo) return { already: true, state: stored };
  return {
    already: false,
    state: {
      ...stored,
      fundadorPremios: [...FUNDADOR_PREMIOS],
      fundadorDias: Math.max(dias(stored.fundadorDias), 5),
      ownedBackgrounds: com(stored.ownedBackgrounds, 'founder-fundo'),
      ownedFrames: com(stored.ownedFrames, 'founder-moldura'),
      ownedFurniture: com(stored.ownedFurniture, 'furn-cristal-fundador'),
    },
  };
}
