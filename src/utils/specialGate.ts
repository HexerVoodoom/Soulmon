/**
 * O PORTÃO DO ESPECIAL — serialização de TEMPO DE CENA (11/10/2026, pedido do dono).
 *
 * "Quando há dois especiais muito próximos, um atrapalha o outro: enquanto rola um especial, PARE os ataques dos
 * dois e retome depois. Especiais são usados UM DE CADA VEZ."
 *
 * Isto é ENCENAÇÃO, não regra. O núcleo (`utils/combate/`, `functions/api/_combate.js`) decide quem bate quando e
 * quanto; os eventos dele saem com o instante `t` da simulação, e nada aqui os reordena, adianta ou descarta — o
 * resultado do duelo e a paridade com o servidor são os mesmos com ou sem o portão. O que o portão decide é só o
 * RELÓGIO DE EXIBIÇÃO do `DuelScreen`: ao chegar ao `cast` de um especial, o relógio PARA (nenhum golpe, de nenhum
 * dos dois lados, começa nem chega) pelo tempo da cena (`leadMs`: nome + trajeto até a batida), o golpe do especial
 * é aplicado, e o relógio continua parado por mais `tailMs` (o efeito termina de aparecer) antes de RETOMAR —
 * recuado em `respiroS` para o primeiro golpe seguinte ter a animação inteira, em vez de ser cortado.
 * Um segundo `cast` próximo simplesmente espera o seu `t` no relógio já recuado: nunca dois ao mesmo tempo.
 *
 * (A Arena/Masmorra/Pesadelo — `useGroupBattle` — já são sequenciais: o `cast` pausa o relógio. Lá a mesma
 * janela entra como `specialTailMs` depois da batida; este portão é só do Duelo, que corre por relógio de parede.)
 *
 * Função pura de estado, sem timers, sem React: o teste (`specialGate.test.ts`) e o `DuelScreen` usam a mesma.
 */

export type FasePortao = 'lead' | 'tail';

export interface Portao {
  fase: FasePortao;
  /** Quanto falta da fase corrente, em ms. */
  faltaMs: number;
  /** Índice do evento `cast` que prendeu o relógio. */
  idx: number;
  /** Instante de simulação (s) do `cast`. */
  t: number;
}

export interface ConfigDoPortao {
  leadMs: number;
  tailMs: number;
  /** Quanto o relógio recua ao soltar (s): a animação do próximo golpe cabe inteira. */
  respiroS: number;
}

/** Fecha o portão no `cast`: o relógio passa a valer `min(relogio, t)` (não passa do instante do especial). */
export function fechar(idx: number, t: number, relogioS: number, cfg: ConfigDoPortao): { portao: Portao; relogioS: number } {
  return { portao: { fase: 'lead', faltaMs: cfg.leadMs, idx, t }, relogioS: Math.min(relogioS, t) };
}

export interface PassoDoPortao {
  portao: Portao | null;
  /** O relógio de exibição (s): parado enquanto o portão existe; recuado no instante em que ele abre. */
  relogioS: number;
  /** `true` no passo em que o golpe do especial deve ser APLICADO (fim da cena, começo da cauda). */
  bateu: boolean;
  /** `true` no passo em que o portão abriu (fim da cauda): o jogo volta a andar. */
  soltou: boolean;
}

/** Avança o portão `dtMs` de tempo de PAREDE. O relógio da luta não anda enquanto ele existe. */
export function avancar(p: Portao, dtMs: number, relogioS: number, cfg: ConfigDoPortao): PassoDoPortao {
  let fase = p.fase;
  let falta = p.faltaMs - dtMs;
  let bateu = false;
  if (fase === 'lead' && falta <= 0) {
    fase = 'tail';
    falta = cfg.tailMs; // a sobra do dt é descartada de propósito: a cauda é um tempo de cena inteiro
    bateu = true;
  } else if (fase === 'tail' && falta <= 0) {
    return { portao: null, relogioS: Math.max(0, p.t - cfg.respiroS), bateu: false, soltou: true };
  }
  return { portao: { ...p, fase, faltaMs: falta }, relogioS, bateu, soltou: false };
}

/** Enquanto o portão está na cena (`lead`), eventos a partir do `cast` NÃO se aplicam; na cauda os do mesmo instante sim. */
export function bloqueiaAplicar(p: Portao | null, idxDoEvento: number): boolean {
  return p !== null && p.fase === 'lead' && idxDoEvento >= p.idx;
}

/** Com o portão fechado (cena ou cauda) NENHUM golpe começa. */
export function bloqueiaComecar(p: Portao | null): boolean {
  return p !== null;
}

/* ── Especiais no MESMO instante (o espelho) ────────────────────────────────── */

/** O mínimo de um evento do núcleo que a reordenação precisa (estrutural: este módulo não importa o motor). */
export interface EventoDeLuta {
  readonly kind: string;
  readonly t: number;
  readonly side: 0 | 1;
  readonly hp: readonly [number, number];
  readonly energy: readonly [number, number];
}

const MESMO_INSTANTE = 1e-9;

/**
 * Dois especiais soltos no MESMO instante da simulação (no espelho os dois lados enchem a energia juntos) saem do
 * núcleo como `cast A, cast B, golpe A, golpe B`: os dois `cast` primeiro, os golpes depois (o núcleo os junta num
 * `flush`). Encenados nessa ordem, o golpe do 1º especial só chegaria depois da CENA do 2º. Esta função devolve a
 * ordem de EXIBIÇÃO `cast A, golpe A, cast B, golpe B` — cada especial com o seu golpe, um de cada vez.
 *
 * É só reordenação de apresentação: o resultado do duelo e o que o servidor decide não passam por aqui. Como cada
 * evento carrega um retrato cumulativo (`hp`, `energy`), reordenar sem cuidado faria a barra de vida SUBIR (o `cast B`,
 * mais antigo, depois do golpe A). Por isso os retratos do trecho reordenado são refeitos por DELTAS: cada evento
 * soma a sua própria variação (retrato menos o retrato do predecessor ORIGINAL) ao retrato anterior da nova ordem,
 * de modo que a soma fecha no mesmo retrato final e nada regride no meio. `fx` (os contadores de status, um par por
 * evento) acompanha a permutação; um selo de status pode aparecer um passo antes do seu `cast` — só visual.
 */
export function serializarEspeciais<T extends EventoDeLuta, F>(events: readonly T[], fx: readonly F[]): { events: T[]; fx: F[] } {
  const n = events.length;
  const ordem: number[] = events.map((_, i) => i);
  let i = 0;
  while (i < n) {
    if (events[i].kind !== 'cast') { i++; continue; }
    const t = events[i].t;
    let j = i;
    while (j < n && events[j].kind === 'cast' && Math.abs(events[j].t - t) < MESMO_INSTANTE) j++;
    if (j - i < 2) { i = j; continue; }
    let k = j;
    while (k < n && events[k].kind === 'attack' && Math.abs(events[k].t - t) < MESMO_INSTANTE) k++;
    const novo: number[] = [];
    const golpes = Array.from({ length: k - j }, (_, q) => j + q);
    for (let c = i; c < j; c++) {
      novo.push(c);
      for (const g of golpes) if (events[g].side === events[c].side) novo.push(g);
    }
    for (const g of golpes) if (!novo.includes(g)) novo.push(g); // golpe de um lado sem cast no grupo: fica no fim
    ordem.splice(i, k - i, ...novo);
    i = k;
  }

  const saida: T[] = events.slice();
  const fxSaida: F[] = fx.slice();
  let p = 0;
  while (p < n) {
    if (ordem[p] === p) { p++; continue; }
    let fim = p;
    while (fim < n && ordem[fim] !== fim) fim++;
    // O trecho [p, fim) foi permutado: refaz os retratos por deltas, a partir do predecessor original.
    const base = events[Math.max(0, p - 1)];
    let hp: [number, number] = [base.hp[0], base.hp[1]];
    let en: [number, number] = [base.energy[0], base.energy[1]];
    for (let q = p; q < fim; q++) {
      const o = ordem[q];
      const ant = events[Math.max(0, o - 1)];
      const e = events[o];
      if (o > 0) {
        hp = [hp[0] + (e.hp[0] - ant.hp[0]), hp[1] + (e.hp[1] - ant.hp[1])];
        en = [en[0] + (e.energy[0] - ant.energy[0]), en[1] + (e.energy[1] - ant.energy[1])];
      }
      saida[q] = { ...e, hp: [hp[0], hp[1]], energy: [en[0], en[1]] } as T;
      fxSaida[q] = fx[o];
    }
    p = fim;
  }
  return { events: saida, fx: fxSaida };
}
