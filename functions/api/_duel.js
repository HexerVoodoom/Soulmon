/**
 * DUELO FANTASMA — o PvP do Torneio em que os pets lutam SOZINHOS e o dono
 * TORCE (benchmark `docs/BENCHMARK-COMBATE.md`, ideia C; Digimon World 1 /
 * Next Order / Yo-kai Watch). Dono único da regra do duelo.
 *
 * `.js` pelo mesmo motivo do `_pushCopy.js`: roda no servidor (Pages
 * Function, que DECIDE) e no cliente (que só ANIMA a mesma luta). Uma regra,
 * um arquivo — duas cópias divergiriam em silêncio (footgun 9).
 *
 * Como a luta é justa sem o cliente decidir nada:
 *  - a semente NÃO é escolhida pelo cliente NEM conhecida de antemão: ela é
 *    sorteada no servidor em `duelStart`, DEPOIS de a partida ser gasta, e o
 *    `match` usa a guardada — nunca uma enviada. Sem isso um cliente editado
 *    simulava os 3 oponentes e escolhia o que vence;
 *  - DESISTÊNCIA = DERROTA: a cota é gasta na abertura; sair antes do fim,
 *    fechar o app ou passar de `DUEL_PENDING_MS` fecha o duelo como derrota
 *    (`forfeitPending`, `community.js`). Não existe como perder de graça;
 *  - a torcida só SOMA: sem torcer, o pet ataca normal (q = 0 → ×1). Mandar
 *    torcidas perfeitas forjadas rende exatamente o que um jogador com timing
 *    perfeito já rende — esse é o teto do que um cliente editado ganha.
 *
 * Perder não custa coração nem nada do pet (mesma regra da Masmorra/Arena).
 */

export const DUEL_MAX_TURNS = 12;
/** Quanto tempo um duelo aberto vale: passou disso, o `match` conta como desistência. */
export const DUEL_PENDING_MS = 5 * 60 * 1000;
/** Os turnos do DONO DA TELA em que ele pode torcer (índice do golpe dele: 0, 1, 2…). */
export const DUEL_CHEER_STRIKES = [1, 3, 5];
export const DUEL_PERFECT_CHEER = 0.92;
export const DUEL_CHEER_GAIN = 0.25;  // q = 1 → ×1,25
export const DUEL_PERFECT_MULT = 1.35; // q ≥ 0,92

const STAGE_POWER = { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 };
function stagePowerOf(stage) {
  return STAGE_POWER[String(stage || '').split('-')[0]] ?? 1;
}

/** Ficha de luta pública: SÓ números derivados, nunca os atributos crus. */
export function duelStats(profile) {
  const sp = stagePowerOf(profile?.stage);
  const a = profile?.attrs || {};
  const attrSum = (+a.power || 0) + (+a.harmony || 0) + (+a.benevolence || 0);
  return {
    hp: 70 + sp * 6,
    atk: Math.round((10 + sp * 1.2 + Math.min(2, attrSum / 50)) * 10) / 10,
  };
}

/** FNV-1a 32 bits — síncrono e igual nos dois lados (sem crypto). */
export function duelSeed(...parts) {
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Higieniza a torcida vinda da rede: 3 números em [0,1], o resto vira 0. */
export function sanitizeCheers(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return DUEL_CHEER_STRIKES.map((_, i) => {
    const q = Number(arr[i]);
    return Number.isFinite(q) ? Math.min(1, Math.max(0, q)) : 0;
  });
}

export function cheerMultiplier(q) {
  if (q >= DUEL_PERFECT_CHEER) return DUEL_PERFECT_MULT;
  return 1 + DUEL_CHEER_GAIN * Math.min(1, Math.max(0, q));
}

/**
 * A luta inteira, PURA e determinística. `cheers[i]` vale para o golpe
 * `DUEL_CHEER_STRIKES[i]` do jogador "me".
 * Devolve os eventos (para animar) e o vencedor. Sem nocaute em
 * `DUEL_MAX_TURNS`, vence quem tiver a MAIOR fração de vida.
 */
export function simulateDuel({ me, opp, seed, cheers }) {
  const rng = mulberry32(seed);
  const q = sanitizeCheers(cheers);
  let hpMe = me.hp, hpOpp = opp.hp;
  let turn = me.atk > opp.atk ? 'me' : me.atk < opp.atk ? 'opp' : (rng() < 0.5 ? 'me' : 'opp');
  let myStrike = 0;
  const events = [];
  for (let t = 0; t < DUEL_MAX_TURNS && hpMe > 0 && hpOpp > 0; t++) {
    const atk = turn === 'me' ? me.atk : opp.atk;
    let mult = 0.5 + rng();
    let cheer = null;
    if (turn === 'me') {
      const slot = DUEL_CHEER_STRIKES.indexOf(myStrike);
      if (slot >= 0) { cheer = q[slot]; mult *= cheerMultiplier(cheer); }
      myStrike++;
    }
    const dmg = Math.max(1, Math.round(atk * mult));
    if (turn === 'me') hpOpp = Math.max(0, hpOpp - dmg); else hpMe = Math.max(0, hpMe - dmg);
    events.push({ actor: turn, dmg, cheer, hpMe, hpOpp });
    turn = turn === 'me' ? 'opp' : 'me';
  }
  const won = hpOpp <= 0 ? true : hpMe <= 0 ? false : hpMe / me.hp >= hpOpp / opp.hp;
  return { events, won, hpMe, hpOpp };
}
