import { describe, it, expect } from 'vitest';
import { ECO_START_LENGTH, ECO_MAX_BITS, ecoBits, playbackIntervalMs } from './eco';
import {
  BOLHAS_FOCO_DURATION_MS, BOLHAS_MAX_BITS, bolhasBits, initialStaircase, recordOutcome, spawnBubble,
} from './bolhas';
import { seededRng } from './eco';
import { TROCA_DECK_SIZE, TROCA_MAX_BITS, TROCA_SESSION_MS, trocaBits } from './troca';
import { PICROSS_BITS_BY_SIZE, PICROSS_DAILY_BONUS, PICROSS_MAX_BITS, picrossBits } from './picross';
import { REVIEW_SESSION_BITS, REVIEW_SESSION_SIZE } from './revisao';
import { MATCH_POINTS, WINS_NEEDED } from '../../components/RPSGame';
import { MINIGAME_BITS_PER_DAY } from '../currencies';

/**
 * O BALANÇO DOS MINIJOGOS LEVES (30/09/2026, `docs/BALANCO-MINIJOGOS.md`).
 *
 * A pergunta que esta régua responde: **quanto cada jogo paga por MINUTO de
 * jogo**, para um jogador típico e um experiente. O princípio: nenhum jogo
 * leve deve ser escolhido pelo que paga — se um rende o dobro dos outros por
 * minuto, ele vira "o jogo de fazer Bits" e os outros viram decoração. Por
 * isso a faixa é a MESMA para Salão e Ateliê.
 *
 * Os modelos são SUPOSIÇÕES declaradas (tempo por toque, acerto, duração de
 * uma corrida) — não medição de gente real, que ainda não existe (ninguém usa
 * o app em produção). Quando houver telemetria, é ESTA tabela que se confronta.
 * A Masmorra, a Arena e o Pesadelo ficam FORA: são jogos longos com outra
 * economia (e a Masmorra sozinha passa do teto diário — pendência do dono).
 */

interface Perfil { nome: 'típico' | 'experiente'; }
const TIPICO: Perfil = { nome: 'típico' };
const EXPERIENTE: Perfil = { nome: 'experiente' };

interface Medida { jogo: string; perfil: string; bits: number; minutos: number; porMinuto: number }
const medir = (jogo: string, p: Perfil, bits: number, ms: number): Medida =>
  ({ jogo, perfil: p.nome, bits, minutos: ms / 60_000, porMinuto: bits / (ms / 60_000) });

// ── Eco: span típico 6, experiente 9 (span visuoespacial adulto ~5–7) ──────
const ECO_TOQUE_MS = { típico: 650, experiente: 420 } as const;
const ECO_SPAN = { típico: 6, experiente: 9 } as const;
function eco(p: Perfil): Medida {
  const span = ECO_SPAN[p.nome];
  let ms = 0;
  // Cada nível L: 500 ms de entrada + reprodução + resposta + ~700 ms de respiro.
  for (let L = ECO_START_LENGTH; L <= span + 1; L++) {
    const falha = L === span + 1;
    const resposta = falha ? Math.ceil(L / 2) : L; // erra no meio da primeira que não sabe
    ms += 500 + L * playbackIntervalMs(L) + resposta * ECO_TOQUE_MS[p.nome] + 700;
  }
  return medir('Eco do Pet', p, ecoBits(span), ms);
}

// ── Bolhas foco: simulação com as funções REAIS (ritmo + escada) ───────────
const BOLHAS_ACERTO = { típico: 0.85, experiente: 0.97 } as const;
/** Sonhos estourados numa rodada; a MEDIANA de 41 sementes (a escada tem
 *  muita variância: um começo ruim desacelera o ritmo e a rodada rende menos). */
function sonhosNaRodada(acerto: number, seed: number): number {
  const rng = seededRng(seed);
  let st = initialStaircase();
  let t = 0; let sonhos = 0; let id = 0;
  while (t < BOLHAS_FOCO_DURATION_MS) {
    const b = spawnBubble(id++, rng, 'foco', t, st.intervalMs);
    const certo = rng() < acerto;
    if (b.kind === 'dream' && certo) sonhos++;
    st = recordOutcome(st, certo);
    t += st.intervalMs;
  }
  return sonhos;
}
function bolhas(p: Perfil): Medida {
  const r = Array.from({ length: 41 }, (_, i) => sonhosNaRodada(BOLHAS_ACERTO[p.nome], i + 1)).sort((a, b) => a - b);
  return medir('Bolhas do Sonho', p, bolhasBits(r[20]), BOLHAS_FOCO_DURATION_MS);
}

// ── Troca: segundos por carta e acerto ────────────────────────────────────
const TROCA_SEG = { típico: 1.8, experiente: 1.1 } as const;
const TROCA_ACERTO = { típico: 0.85, experiente: 0.97 } as const;
function troca(p: Perfil): Medida {
  const cartas = Math.min(TROCA_DECK_SIZE, Math.floor(TROCA_SESSION_MS / 1000 / TROCA_SEG[p.nome]));
  const ms = Math.min(TROCA_SESSION_MS, cartas * TROCA_SEG[p.nome] * 1000);
  return medir('Troca de Regra', p, trocaBits(Math.round(cartas * TROCA_ACERTO[p.nome])), ms);
}

// ── Picross: segundos por casa (a dedução domina, não o toque) ─────────────
const PICROSS_SEG_POR_CASA = { típico: 2.4, experiente: 1.2 } as const;
function picross(p: Perfil, lado: 5 | 7 | 10): Medida {
  const ms = lado * lado * PICROSS_SEG_POR_CASA[p.nome] * 1000;
  return medir(`Picross ${lado}×${lado}`, p, picrossBits(lado, false), ms);
}

// ── Salão (regras de sempre, só para comparar) ────────────────────────────
// Dino: o placar cresce 10/s (`DinoGame`) e paga floor(placar/100).
const DINO_CORRIDA_S = { típico: 60, experiente: 180 } as const;
function dino(p: Perfil): Medida {
  const s = DINO_CORRIDA_S[p.nome];
  return medir('Corrida com obstáculos', p, Math.floor((s * 10) / 100), s * 1000 + 3000);
}
// PPT: sorte pura (50%); ~2,5 s por rodada, ~1/3 de empates.
function ppt(p: Perfil): Medida {
  const rodadas = (WINS_NEEDED * 2 - 1) * 1.5;
  return medir('Pedra, papel e tesoura', p, MATCH_POINTS * 0.5, rodadas * 2500 + 3000);
}

// Revisão: 1×/dia; ~15 s por cartão.
function revisao(p: Perfil): Medida {
  return medir('Revisão da Malha', p, REVIEW_SESSION_BITS, REVIEW_SESSION_SIZE * (p === TIPICO ? 15 : 9) * 1000);
}

const PERFIS = [TIPICO, EXPERIENTE];
const LEVES = PERFIS.flatMap(p => [eco(p), bolhas(p), troca(p), picross(p, 5), picross(p, 7), picross(p, 10), dino(p), ppt(p)]);

/** A faixa de Bits/minuto do jogador TÍPICO nos jogos leves. */
const FAIXA_TIPICA = { min: 2.5, max: 9 };
/** Ninguém, nem o experiente, passa disto por minuto num jogo leve. */
const TETO_EXPERIENTE = 13;

describe('balanço dos minijogos leves (Bits por minuto)', () => {
  it('imprime a tabela quando pedido (BALANCO_PRINT=1)', () => {
    if (process.env.BALANCO_PRINT) {
      console.table([...LEVES, ...PERFIS.map(revisao)].map(m => ({
        jogo: m.jogo, perfil: m.perfil, bits: +m.bits.toFixed(1), min: +m.minutos.toFixed(2), 'Bits/min': +m.porMinuto.toFixed(1),
      })));
    }
    expect(LEVES.length).toBeGreaterThan(0);
  });

  it(`o jogador típico ganha entre ${FAIXA_TIPICA.min} e ${FAIXA_TIPICA.max} Bits/min em TODO jogo leve — nenhum vira "o jogo de fazer Bits"`, () => {
    for (const m of LEVES.filter(m => m.perfil === 'típico')) {
      expect(m.porMinuto, m.jogo).toBeGreaterThanOrEqual(FAIXA_TIPICA.min);
      expect(m.porMinuto, m.jogo).toBeLessThanOrEqual(FAIXA_TIPICA.max);
    }
  });

  it(`o experiente nunca passa de ${TETO_EXPERIENTE} Bits/min`, () => {
    for (const m of LEVES.filter(m => m.perfil === 'experiente')) {
      expect(m.porMinuto, m.jogo).toBeLessThanOrEqual(TETO_EXPERIENTE);
    }
  });

  it('o teto que a folha anuncia é ALCANÇÁVEL (anunciar "até 10" que ninguém vê é promessa falsa)', () => {
    expect(ecoBits(ECO_START_LENGTH + ECO_MAX_BITS)).toBe(ECO_MAX_BITS);
    expect(bolhas(EXPERIENTE).bits).toBe(BOLHAS_MAX_BITS);
    expect(trocaBits(TROCA_DECK_SIZE)).toBe(TROCA_MAX_BITS);
    expect(picrossBits(10, true)).toBe(PICROSS_MAX_BITS);
  });

  it('o típico nas três grades do Picross fica na faixa — grade grande não paga menos por minuto a ponto de ser evitada', () => {
    const t = ([5, 7, 10] as const).map(l => picross(TIPICO, l).porMinuto);
    expect(Math.max(...t) / Math.min(...t)).toBeLessThan(2);
    expect(PICROSS_BITS_BY_SIZE[10] + PICROSS_DAILY_BONUS).toBe(PICROSS_MAX_BITS);
  });

  it('o teto diário de minijogo continua sendo a trava: nenhum jogo leve chega perto dele numa rodada', () => {
    for (const m of LEVES) expect(m.bits, m.jogo).toBeLessThan(MINIGAME_BITS_PER_DAY / 5);
  });
});

// ── Os jogos LONGOS contra o teto diário (decisão do dono, 30/09/2026) ─────
import { buildDungeonWave, DUNGEON_BITS_FACTOR } from '../dungeon';
import { clearBonus, MAX_FLOORS } from '../../components/DungeonGame';
import { ARENA_ROUNDS, buildArenaRound } from '../arena';

function masmorraRunCompleta(nivel: number, estagio: string): number {
  let total = 0;
  for (let f = 1; f <= MAX_FLOORS; f++) {
    total += buildDungeonWave(nivel + f - 1, estagio).reduce((s, e) => s + e.points, 0) + clearBonus(f);
  }
  return total;
}

describe('jogos longos × teto diário de minijogo', () => {
  it('uma run COMPLETA da Masmorra fica perto do teto (60%–120%), nunca 2–3× ele como antes do fator', () => {
    expect(DUNGEON_BITS_FACTOR).toBe(0.4);
    for (const [nivel, estagio] of [[1, 'rookie'], [3, 'champion-power'], [5, 'mega-power']] as const) {
      const run = masmorraRunCompleta(nivel, estagio);
      expect(run, `nível ${nivel}`).toBeGreaterThanOrEqual(MINIGAME_BITS_PER_DAY * 0.6);
      expect(run, `nível ${nivel}`).toBeLessThanOrEqual(MINIGAME_BITS_PER_DAY * 1.2);
    }
  });

  it('o bônus de andar da Masmorra é 4/6/8/10/12', () => {
    expect(Array.from({ length: MAX_FLOORS }, (_, i) => clearBonus(i + 1))).toEqual([4, 6, 8, 10, 12]);
  });

  it('uma run completa da Arena (dificuldade 1, a do jogo) paga no máximo metade do teto', () => {
    let total = 0;
    for (let r = 1; r <= ARENA_ROUNDS; r++) total += buildArenaRound(r, 1, () => 0.5, []).reduce((s, e) => s + e.points, 0);
    expect(total).toBe(50);
    expect(total).toBeLessThanOrEqual(MINIGAME_BITS_PER_DAY / 2);
  });
});
