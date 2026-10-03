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
 *  - a torcida só SOMA: sem torcer, o pet ataca normal (×1). Mandar torcida
 *    forjada rende no máximo o que a torcida cheia já rende — esse é o teto do
 *    que um cliente editado ganha (`DUEL_TAPS_CAP` por janela, 3 janelas, no máximo 3 especiais).
 *
 * ── TORCIDA POR TOQUES (decisão do dono, 02/10/2026) ──────────────────────
 * Torcer é TOCAR EM QUALQUER LUGAR da tela durante a luta. Cada toque enche um
 * GAUGE de `DUEL_TAPS_FULL` toques; quando o pet chega num golpe de torcida
 * (`DUEL_CHEER_STRIKES`) com o gauge cheio, ele GASTA o gauge num golpe
 * ESPECIAL (×`DUEL_SPECIAL_MULT`). Sem gauge cheio o golpe é o normal. O que o
 * cliente manda é quantos toques deu em cada JANELA (o tempo até cada golpe de
 * torcida); o servidor higieniza (`sanitizeTaps`: inteiros em [0, CAP]) e
 * recalcula tudo (`specialSlots`) — toque ilimitado não rende mais que o teto.
 * A mecânica ANTIGA (timing do anel, `cheerMultiplier`) segue no arquivo atrás
 * de `TIMING_CHEER_ENABLED = false`, sem nenhum caminho de UI: reaproveitar em
 * outro lugar depois.
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

/**
 * Torcida por TIMING (anel que fecha sobre o alvo): DESATIVADA em 02/10/2026 —
 * o dono trocou por toques livres + gauge. O código antigo (`cheerMultiplier`,
 * `sanitizeCheers`, a janela de ±400 ms em `DuelScreen`) fica aqui para
 * reaproveitar em outro lugar depois; nenhum caminho de UI o usa.
 */
export const TIMING_CHEER_ENABLED = false;

/**
 * Toques que enchem o gauge de torcida. 16 desde 02/10/2026 (rodada 5, I10): eram
 * 8 e a luta passava rápido demais. A 3 toques/s (ritmo normal) são ~6 s de toque
 * para encher, e a luta animada dura ~17 s (`STAGE_STEP_MS` em `utils/combatFx`):
 * o primeiro especial sai por volta dos 10 s. Vale também para o Duelo da Arena
 * (`utils/torcida.ts` importa daqui); o PvE (Pesadelo/Masmorra) ficou em 8
 * (`TORCIDA_PVE_TAPS_FULL`) até a cena nova chegar neles.
 */
export const DUEL_TAPS_FULL = 16;
/**
 * Teto de toques contados por janela (≥ FULL: o excedente não vale nada). 20 =
 * ~6,7 toques/s numa janela de 3 s: acima do que um dedo faz e abaixo do
 * auto-clique. O TETO DE GANHO não mudou: 3 janelas, no máximo 3 especiais
 * (CAP ≥ FULL ⇒ uma janela sozinha já enche o gauge; forjar não passa disso).
 */
export const DUEL_TAPS_CAP = 20;
/**
 * Força do golpe ESPECIAL. É o mesmo ×1,35 da torcida perfeita antiga: com o
 * gauge cheio nas 3 janelas o duelo rende exatamente o que o timing perfeito
 * rendia (mesmo estágio ~50% → ~80%), e sem torcer é o golpe base de sempre.
 */
export const DUEL_SPECIAL_MULT = DUEL_PERFECT_MULT;

/** Higieniza os toques vindos da rede: 3 inteiros em [0, CAP], o resto vira 0. */
export function sanitizeTaps(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return DUEL_CHEER_STRIKES.map((_, i) => {
    const n = Math.floor(Number(arr[i]));
    return Number.isFinite(n) ? Math.min(DUEL_TAPS_CAP, Math.max(0, n)) : 0;
  });
}

/**
 * Em quais golpes de torcida o pet solta o ESPECIAL. O gauge acumula entre as
 * janelas (limitado a FULL) e zera ao ser gasto — a MESMA conta que a tela faz
 * toque a toque.
 */
export function specialSlots(taps) {
  const t = sanitizeTaps(taps);
  let g = 0;
  return t.map((n) => {
    g = Math.min(DUEL_TAPS_FULL, g + n);
    if (g < DUEL_TAPS_FULL) return false;
    g = 0;
    return true;
  });
}

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

/** (Torcida por TIMING, desativada — ver `TIMING_CHEER_ENABLED`.) 3 números em [0,1]. */
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
  // `cheers` = toques por janela (padrão) ou q de timing (só com a flag ligada).
  const q = TIMING_CHEER_ENABLED ? sanitizeCheers(cheers) : null;
  const special = TIMING_CHEER_ENABLED ? null : specialSlots(cheers);
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
      if (slot >= 0) {
        if (q) { cheer = q[slot]; mult *= cheerMultiplier(cheer); }
        else { const sp = !!special?.[slot]; cheer = sp ? 1 : 0; if (sp) mult *= DUEL_SPECIAL_MULT; }
      }
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
