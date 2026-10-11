/**
 * A PERCUSSÃO DA ARENA — síntese procedural pura (sem Web Audio, sem I/O), 11/10/2026.
 *
 * O pedido do dono foi "pensar numa outra [música] para o combate da Arena" e o gerador de áudio externo
 * não estava disponível. A faixa da Arena é então DERIVADA do que já existe (`trilha.ts`): as duas camadas da
 * trilha a `RAZAO_DA_ARENA` (100 → 120 BPM) mais esta percussão, que dá o pulso de luta. O desenho evita de
 * propósito qualquer coisa com ALTURA MUSICAL (nada de baixo nem de arpejo): as camadas mudam de tom ao acelerar
 * (um `AudioBufferSourceNode` não tem time-stretch), e uma linha melódica nova poderia brigar com a tonalidade
 * delas. Bumbo, caixa e chimbal não têm tonalidade para errar.
 *
 * É um BUFFER de um loop inteiro (12 compassos), não um agendador: começa no mesmo instante das camadas e fecha
 * no mesmo ponto, então fica em fase sem relógio nenhum. Determinístico (o ruído sai de um LCG fixo).
 *
 * Isto NÃO é um asset novo (S9/S6): não há arquivo, hash nem byte no bundle — é código. O nível (peak 0,5 aqui,
 * o resto em `TRIM_FAIXA_ARENA_DB` de `loudness.ts`) é rascunho a ser aprovado na escuta do dono (S8).
 */
import { BPM_DA_TRILHA, COMPASSOS_DA_TRILHA, RAZAO_DA_ARENA } from './sonsAssets';

/** BPM da faixa da Arena e a duração do loop, em segundos — derivados, nunca digitados. */
export const BPM_DA_ARENA = BPM_DA_TRILHA * RAZAO_DA_ARENA;
export const DURACAO_DO_LOOP_DA_ARENA_S = (60 / BPM_DA_ARENA) * 4 * COMPASSOS_DA_TRILHA;

/** Pico do buffer (o nível relativo entre percussão e camadas é de `loudness.ts`). */
const PICO = 0.5;

/** Passos de colcheia por compasso (8) e o padrão de cada peça. */
export const PADRAO_ARENA = {
  bumbo: [1, 0, 0, 0, 1, 0, 0, 1],
  caixa: [0, 0, 1, 0, 0, 0, 1, 0],
  chimbal: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5],
  /** O último compasso de cada 4 troca a caixa por uma virada (passos 5, 6, 7). */
  virada: [0, 0, 0, 0, 0, 1, 1, 1],
} as const;

function lcg(seed: number): () => number {
  let x = seed >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 0x80000000 - 1; };
}

/** Os instantes (s) em que cada peça ataca no loop — para o teste e para a documentação, sem síntese. */
export function ataquesDaArena(): { bumbo: number[]; caixa: number[]; chimbal: number[] } {
  const passo = 60 / BPM_DA_ARENA / 2;
  const out = { bumbo: [] as number[], caixa: [] as number[], chimbal: [] as number[] };
  for (let c = 0; c < COMPASSOS_DA_TRILHA; c++) {
    const viradaNeste = c % 4 === 3;
    for (let p = 0; p < 8; p++) {
      const t = (c * 8 + p) * passo;
      if (PADRAO_ARENA.bumbo[p]) out.bumbo.push(t);
      const caixa = viradaNeste ? PADRAO_ARENA.virada[p] : PADRAO_ARENA.caixa[p];
      if (caixa) out.caixa.push(t);
      if (PADRAO_ARENA.chimbal[p]) out.chimbal.push(t);
    }
  }
  return out;
}

/** Sintetiza o loop inteiro de percussão (mono, `taxa` Hz). */
export function sintetizarPercussaoDaArena(taxa: number): Float32Array<ArrayBuffer> {
  const n = Math.round(DURACAO_DO_LOOP_DA_ARENA_S * taxa);
  const out = new Float32Array(new ArrayBuffer(n * 4));
  const ruido = lcg(0x50554c53);
  const at = ataquesDaArena();

  const somar = (inicio: number, dur: number, f: (t: number) => number, amp: number) => {
    const i0 = Math.round(inicio * taxa);
    const len = Math.min(Math.round(dur * taxa), n - i0);
    for (let i = 0; i < len; i++) out[i0 + i] += amp * f(i / taxa);
  };

  for (const t of at.bumbo) {
    let fase = 0;
    somar(t, 0.25, (s) => {
      fase += (2 * Math.PI * (48 + 120 * Math.exp(-s / 0.03))) / taxa;
      return Math.sin(fase) * Math.exp(-s / 0.11);
    }, 0.9);
  }
  for (const t of at.caixa) {
    somar(t, 0.2, (s) => (ruido() * 0.8 + Math.sin(2 * Math.PI * 190 * s) * 0.5) * Math.exp(-s / 0.06), 0.5);
  }
  let anterior = 0;
  for (let k = 0; k < at.chimbal.length; k++) {
    const t = at.chimbal[k];
    const passo = Math.round((t / (60 / BPM_DA_ARENA / 2))) % 8;
    somar(t, 0.06, (s) => {
      const r = ruido();
      const hp = r - anterior; // passa-altas de 1ª ordem: ruído sem corpo
      anterior = r;
      return hp * Math.exp(-s / 0.02);
    }, 0.22 * PADRAO_ARENA.chimbal[passo]);
  }

  // Normaliza o pico: o nível relativo às camadas é decidido em `loudness.ts`, não aqui.
  let pico = 0;
  for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(out[i]));
  if (pico > 0) for (let i = 0; i < n; i++) out[i] = (out[i] / pico) * PICO;
  return out;
}
