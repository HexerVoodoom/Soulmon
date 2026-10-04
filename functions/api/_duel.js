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
 *    que um cliente editado ganha (`DUEL_TAPS_CAP` por janela; ver a ENERGIA abaixo, 04/10/2026).
 *
 * ── TORCIDA POR TOQUES (decisão do dono, 02/10/2026; refeita pela ENERGIA em 04/10) ──────────────────────
 * Torcer é TOCAR EM QUALQUER LUGAR da tela durante a luta. Cada toque enche um
 * GAUGE de `DUEL_TAPS_FULL` toques; quando o pet chega num golpe de torcida
 * (`DUEL_CHEER_STRIKES`) com o gauge cheio, ele GASTA o gauge num golpe
 * ESPECIAL (×`DUEL_SPECIAL_MULT`). Sem gauge cheio o golpe é o normal. O que o
 * cliente manda é quantos toques deu em cada JANELA (o tempo até cada golpe de
 * torcida); o servidor higieniza (`sanitizeTaps`: inteiros em [0, CAP]) e
 * recalcula tudo (`cheerDischarges`) — toque ilimitado não rende mais que o teto.
 * A mecânica ANTIGA (timing do anel, `cheerMultiplier`) segue no arquivo atrás
 * de `TIMING_CHEER_ENABLED = false`, sem nenhum caminho de UI: reaproveitar em
 * outro lugar depois.
 *
 * ── ENERGIA (decisão do dono, 04/10/2026 — REGISTRO §20.10) ────────────────
 * Cada lutador tem UMA barra de ENERGIA (0..`DUEL_ENERGY_MAX`) que enche por
 * três fatores: cada ataque DADO (`DUEL_ENERGY_DEALT`), cada ataque SOFRIDO
 * (`DUEL_ENERGY_TAKEN`) e, só para o dono da tela, o CHEER: a "barra de cheer" é
 * o medidor de TOQUES (`DUEL_TAPS_FULL`) que, ao encher, DESPEJA
 * `DUEL_ENERGY_CHEER` de energia no pet e zera (o excedente fica). Energia cheia =
 * o lutador solta o ESPECIAL no golpe seguinte (×`DUEL_SPECIAL_MULT`) e gasta a
 * barra. No PvP NÃO há mecânica de uso nem de defesa: o especial sai DIRETO.
 * O cliente manda quantos toques deu em cada JANELA (uma por golpe do dono, até
 * `DUEL_CHEER_WINDOWS`); o servidor higieniza (`sanitizeTaps`: inteiros em
 * [0, `DUEL_TAPS_CAP`]) e recalcula TUDO — toque forjado ou ilimitado rende no
 * máximo `DUEL_CHEER_WINDOWS × DUEL_TAPS_CAP` toques no jogo todo.
 *
 * ── DURAÇÃO (04/10/2026) ───────────────────────────────────────────────────
 * Até 26 golpes (`DUEL_MAX_TURNS`), a ~1,6 s cada na tela (`DUEL_STEP_MS`):
 * ~35–42 s. O servidor segue com o teto de `DUEL_PENDING_MS` (5 min, forfeit).
 *
 * Perder não custa coração nem nada do pet (mesma regra da Masmorra/Arena).
 */

export const DUEL_MAX_TURNS = 26;
/** Quanto tempo um duelo aberto vale: passou disso, o `match` conta como desistência. */
export const DUEL_PENDING_MS = 5 * 60 * 1000;
/** (Legado do timing, desligado) Os golpes do dono em que a torcida por TIMING valia. */
export const DUEL_CHEER_STRIKES = [1, 3, 5];
/** Janelas de toque: UMA por golpe do dono da tela (os dois alternam, então metade dos turnos). */
export const DUEL_CHEER_WINDOWS = DUEL_MAX_TURNS / 2;
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
 * Toques que enchem a barra de CHEER. 24 desde 04/10/2026 (eram 16, e 8 antes): a
 * barra deve DEMORAR a carregar. A 3 toques/s são ~8 s de toque para despejar a
 * energia no pet; a luta dura ~40 s.
 */
export const DUEL_TAPS_FULL = 24;
/**
 * Teto de toques contados por janela (uma janela = um golpe do dono ≈ 3,2 s na tela).
 * 16 = ~5 toques/s: acima do que um dedo faz de forma sustentada e abaixo do auto-clique.
 * O TETO DE GANHO do jogo todo é `DUEL_CHEER_WINDOWS × DUEL_TAPS_CAP` toques (208):
 * forjar não passa disso.
 */
export const DUEL_TAPS_CAP = 16;
/** A barra de energia de cada lutador. */
export const DUEL_ENERGY_MAX = 100;
/** Energia por ataque DADO. */
export const DUEL_ENERGY_DEALT = 9;
/** Energia por ataque SOFRIDO. */
export const DUEL_ENERGY_TAKEN = 7;
/** Energia que uma barra de cheer cheia despeja no pet (maior que um ataque dado/sofrido). */
export const DUEL_ENERGY_CHEER = 36;
/**
 * Força do golpe ESPECIAL (energia cheia). No PvP vale para os DOIS lutadores: sem
 * torcer a luta segue ~50% no mesmo estágio; o cheer só adianta o especial do dono.
 */
export const DUEL_SPECIAL_MULT = 2;
/** Meia-largura do sorteio do dano por golpe: `1 ± DUEL_DMG_SPREAD` (era ±0,5 com 12 golpes; mais golpes pedem mais variância para a mesma incerteza). */
export const DUEL_DMG_SPREAD = 0.74;

/** Higieniza os toques vindos da rede: `DUEL_CHEER_WINDOWS` inteiros em [0, CAP], o resto vira 0. */
export function sanitizeTaps(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: DUEL_CHEER_WINDOWS }, (_, i) => {
    const n = Math.floor(Number(arr[i]));
    return Number.isFinite(n) ? Math.min(DUEL_TAPS_CAP, Math.max(0, n)) : 0;
  });
}

/**
 * Em quais janelas a barra de CHEER despeja energia no pet (CAP < FULL: no máximo uma
 * por janela). O medidor acumula entre as janelas e o excedente fica — a MESMA conta
 * que a tela faz toque a toque.
 */
export function cheerDischarges(taps) {
  const t = sanitizeTaps(taps);
  let m = 0;
  return t.map((n) => {
    m += n;
    if (m < DUEL_TAPS_FULL) return false;
    m -= DUEL_TAPS_FULL;
    return true;
  });
}

/** Vida do duelo: o dobro da de antes (70 + 6/estágio) — a luta passou de 12 para 26 golpes (04/10/2026). */
export const DUEL_HP_BASE = 140;
export const DUEL_HP_PER_STAGE = 12;
const STAGE_POWER = { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 };
function stagePowerOf(stage) {
  // Propriedade PRÓPRIA: `stage` é texto livre do perfil, e 'constructor'/'__proto__'
  // achavam um valor herdado do Object (não-nulo) → NaN na ficha → duelo sem golpes.
  const key = String(stage || '').split('-')[0];
  return Object.prototype.hasOwnProperty.call(STAGE_POWER, key) ? STAGE_POWER[key] : 1;
}

/** Ficha de luta pública: SÓ números derivados, nunca os atributos crus. */
export function duelStats(profile) {
  const sp = stagePowerOf(profile?.stage);
  const a = profile?.attrs || {};
  // Piso 0 e só finitos: atributo negativo/infinito do perfil não derruba o ataque nem gera NaN.
  const pos = (v) => (Number.isFinite(+v) ? Math.max(0, +v) : 0);
  const attrSum = pos(a.power) + pos(a.harmony) + pos(a.benevolence);
  return {
    hp: DUEL_HP_BASE + sp * DUEL_HP_PER_STAGE,
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
 * A luta inteira, PURA e determinística. `cheers[i]` = toques da janela `i` (o
 * i-ésimo golpe do jogador "me"). Devolve os eventos (para animar) e o vencedor. Sem
 * nocaute em `DUEL_MAX_TURNS`, vence quem tiver a MAIOR fração de vida.
 *
 * Cada evento leva a ENERGIA dos dois ANTES (`preMe`, `preOpp`) e DEPOIS do golpe (`energyMe`,
 * `energyOpp`), o medidor de cheer (`meter`, já depois do despejo) e se o golpe foi o ESPECIAL (`special`).
 */
export function simulateDuel({ me, opp, seed, cheers }) {
  const rng = mulberry32(seed);
  // `cheers` = toques por janela (padrão) ou q de timing (só com a flag ligada).
  const q = TIMING_CHEER_ENABLED ? sanitizeCheers(cheers) : null;
  const taps = TIMING_CHEER_ENABLED ? null : sanitizeTaps(cheers);
  let hpMe = me.hp, hpOpp = opp.hp;
  let turn = me.atk > opp.atk ? 'me' : me.atk < opp.atk ? 'opp' : (rng() < 0.5 ? 'me' : 'opp');
  let myStrike = 0;
  let enMe = 0, enOpp = 0, meter = 0;
  const events = [];
  for (let t = 0; t < DUEL_MAX_TURNS && hpMe > 0 && hpOpp > 0; t++) {
    const atk = turn === 'me' ? me.atk : opp.atk;
    let mult = 1 - DUEL_DMG_SPREAD + 2 * DUEL_DMG_SPREAD * rng();
    let cheer = null;
    let special = false;
    if (turn === 'me') {
      if (q) {
        const slot = DUEL_CHEER_STRIKES.indexOf(myStrike);
        if (slot >= 0) { cheer = q[slot]; mult *= cheerMultiplier(cheer); }
      } else {
        // 1) o cheer: os toques da janela enchem o medidor; cheio, despeja energia no pet.
        meter += (taps ? taps[myStrike] : 0) ?? 0;
        if (meter >= DUEL_TAPS_FULL) { meter -= DUEL_TAPS_FULL; enMe = Math.min(DUEL_ENERGY_MAX, enMe + DUEL_ENERGY_CHEER); }
        // 2) energia cheia: o golpe é o ESPECIAL e gasta a barra.
        if (enMe >= DUEL_ENERGY_MAX) { special = true; enMe -= DUEL_ENERGY_MAX; mult *= DUEL_SPECIAL_MULT; }
        cheer = special ? 1 : 0;
      }
      myStrike++;
    } else if (!q && enOpp >= DUEL_ENERGY_MAX) {
      special = true; enOpp -= DUEL_ENERGY_MAX; mult *= DUEL_SPECIAL_MULT;
    }
    // A energia ANTES do golpe (já com o cheer despejado e ainda com a barra cheia que dispara o especial): é o que a tela mostra no começo da ação.
    const preMe = special && turn === 'me' ? enMe + DUEL_ENERGY_MAX : enMe;
    const preOpp = special && turn === 'opp' ? enOpp + DUEL_ENERGY_MAX : enOpp;
    const dmg = Math.max(1, Math.round(atk * mult));
    if (turn === 'me') hpOpp = Math.max(0, hpOpp - dmg); else hpMe = Math.max(0, hpMe - dmg);
    if (!q) {
      // 3) dado e sofrido enchem as duas barras.
      if (turn === 'me') { enMe = Math.min(DUEL_ENERGY_MAX, enMe + DUEL_ENERGY_DEALT); enOpp = Math.min(DUEL_ENERGY_MAX, enOpp + DUEL_ENERGY_TAKEN); }
      else { enOpp = Math.min(DUEL_ENERGY_MAX, enOpp + DUEL_ENERGY_DEALT); enMe = Math.min(DUEL_ENERGY_MAX, enMe + DUEL_ENERGY_TAKEN); }
    }
    events.push({ actor: turn, dmg, cheer, special, hpMe, hpOpp, preMe, preOpp, energyMe: enMe, energyOpp: enOpp, meter });
    turn = turn === 'me' ? 'opp' : 'me';
  }
  const won = hpOpp <= 0 ? true : hpMe <= 0 ? false : hpMe / me.hp >= hpOpp / opp.hp;
  return { events, won, hpMe, hpOpp };
}
