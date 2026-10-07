/**
 * TRAVESSIAS (Crossings) — os TIPOS. Dono único dos tipos e das constantes.
 *
 * Decisão do dono (30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §5.6): a Exploração
 * ganha o Passeio (a Aventura da noite com destino) e as Travessias — desafios da
 * VIDA REAL, opt-in, auto-declarados, que abrem regiões do mapa do Passeio.
 * Proposta e condições: `docs/PROPOSTA-MISSOES-EXPLORACAO.md` +
 * `docs/reviews/2026-09-30-missoes/`.
 *
 * O que NUNCA entra aqui (há contrato): prazo, contagem regressiva, recompensa
 * fora do mapa (HP, energia, atributo, `perfectDays`, evolução, Bits, Emblemas,
 * Créditos, XP de Vínculo, comida), contagem de tarefas, total do mapa.
 */

/** Os oito reinos com superfície (bíblia §7.2). `akasha` não se visita. */
export type RegionId =
  | 'campina' | 'floresta' | 'oceano' | 'deserto'
  | 'picos' | 'pantano' | 'cavernas' | 'gelo';

/** A região de casa — sempre aberta. O reino do pet ainda não mora no save (MIS-9). */
export const HOME_REGION: RegionId = 'campina';

/** Área da vida de um desafio. Três desafios de uma região vêm de áreas diferentes. */
export type CrossingArea = 'corpo' | 'casa' | 'social' | 'aprender' | 'criar' | 'mente' | 'habito';

export interface CrossingChallenge {
  id: string;
  area: CrossingArea;
  /** A versão plena. Inglês primeiro; fala do ATO, nunca do prêmio (R-31). */
  textEn: string;
  textPt: string;
  /**
   * A versão pequena: um ato na VIDA REAL, ≤ 10 min, em casa, sem gasto. Conta
   * EXATAMENTE igual à plena (psicologia R-4) — não existe campo que diferencie.
   */
  smallEn: string;
  smallPt: string;
  /**
   * Piso de idade do desafio (parecer de menores e marca, R-1): todo desafio,
   * pleno e pequeno, tem de ser seguro para quem tem 13 anos e o lê sozinho.
   * O público declarado é 18+, mas a checagem é auto-declaração.
   */
  minAge: 13;
}

/** Um achado da região: postal + lore, 1ª pessoa do pet. Nada material. */
export interface RegionFind {
  id: string;
  emoji: string;
  titleEn: string;
  titlePt: string;
  textEn: string;
  textPt: string;
}

export interface Region {
  id: RegionId;
  nameEn: string;
  namePt: string;
  /** Uma linha do que um viajante veria (bíblia §7.2), para a folha. */
  glimpseEn: string;
  glimpsePt: string;
  /** Id de cenário existente em `utils/backgrounds.ts` para o postal; null = gradiente. */
  bgId: string | null;
  /** Exatamente 3, de áreas diferentes. Vazio só na região de casa. */
  challenges: readonly CrossingChallenge[];
  /** A cena de chegada — o achado da PRIMEIRA noite depois de abrir. */
  arrival: RegionFind;
  /** 4 a 6 achados exclusivos (exceção registrada à regra 4 da Aventura). */
  finds: readonly RegionFind[];
}

/** No máximo uma região se abre por DIA DO JOGADOR (psicologia R-1, linha vermelha R-32). */
export const REGIONS_OPENED_PER_DAY = 1;

/**
 * Chance, por noite, de o Passeio a uma região aberta (≠ casa) trazer um achado
 * EXCLUSIVO dela ainda não coletado; senão vem a Aventura comum. Sorteio
 * determinístico pelo `dayKey` (regra 3 da Aventura) — reabrir nunca re-sorteia.
 */
export const PASSEIO_REGION_FIND_CHANCE = 0.5;

/** Estado no save. Só acrescenta; `normalizeCrossings` tolera ausência. */
export interface CrossingsState {
  /** Regiões abertas, em ordem de abertura, com o dia do jogador. Casa é implícita. */
  opened: Array<{ region: RegionId; day: string }>;
  /** A Travessia escolhida agora (no máximo uma). Não envelhece: não guarda data. */
  active: { region: RegionId; challenge: string } | null;
  /**
   * "Fiz" já dados que ainda não abriram região (o teto é 1/dia). Nunca expira.
   * A região abre na virada/relatório do próximo dia disponível.
   */
  pending: RegionId[];
  /** Para onde o pet passeia hoje (escolha livre entre as abertas). null = casa. */
  destination: RegionId | null;
  /** Interruptor: esconde a camada inteira de Travessias (MIS-11). O Passeio continua. */
  hidden: boolean;
  /**
   * O dia do jogador (`AAAA-MM-DD`) do último "Fiz". É o relógio da regra
   * "uma vez por dia" (02/10/2026, F5): a Travessia não acaba no "Fiz" —
   * continua ativa e dá para repetir no dia seguinte. Só um dia, nunca um
   * histórico (sem contagem, sem sequência).
   */
  doneDay: string | null;
  /**
   * O dia (`AAAA-MM-DD`) em que `active` foi escolhida (04/10/2026, missões
   * diárias): a ativa vale PARA AQUELE DIA — no dia seguinte saem três
   * propostas novas. null = save antigo, sem dia (a folha trata como "sem
   * missão hoje").
   */
  pickDay: string | null;
  /**
   * O instante (epoch ms) em que `active` foi escolhida (rodada 7, M4,
   * 04/10/2026): a missão escolhida vale por `MISSION_WINDOW_MS` (24 h) e não se
   * troca nesse tempo. Passado isso ela se solta sozinha, sem custo e sem marca,
   * e saem propostas novas. null = save antigo, ou missão já feita (aí vale só
   * o dia, `pickDay`).
   */
  pickAt: number | null;
  /**
   * O REGISTRO das missões feitas (rodada 7, M6): mais recentes por último,
   * guarda só dia + região + id do desafio (nunca texto), no máximo `LOG_MAX`.
   * Sem contagem, sem sequência: é um diário, não um placar.
   */
  log: Array<{ day: string; region: RegionId; challenge: string }>;
  /**
   * MARCOS DE AVENTURA (04/10/2026): quantas missões foram feitas, no total.
   * 1 por "Fiz" e só um "Fiz" por dia, então o contador anda no máximo 1/dia.
   * Só abre postais cosméticos (`MARCO_THRESHOLDS`); nunca paga nada e nunca
   * cai (sem perda por não fazer).
   */
  score: number;
  /**
   * A viagem da noite: a missão feita em `day` leva o Soulmon à região dela, e
   * ele volta no relatório daquele dia com uma historinha. Só dia + região.
   */
  trip: { day: string; region: RegionId } | null;
}

/** Marcos de Aventura: quantas missões feitas abrem um postal cosmético (04/10/2026). */
export const MARCO_THRESHOLDS: readonly number[] = [5, 10, 20];

/** Quantas propostas o jogador vê por dia, entre as quais escolhe UMA. */
export const MISSIONS_OFFERED_PER_DAY = 3;

/** Quanto tempo vale a missão escolhida: 24 h, sem troca (rodada 7, M4). */
export const MISSION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * O passeio leva um tempo (pedido do dono, 07/10/2026): depois de PEGAR a missão,
 * o "Concluir" só abre passados `STROLL_MIN_MINUTES`. O instante de partida é o
 * `pickAt` que já mora no save (sincroniza com a nuvem; `null` = save antigo, sem
 * espera). Dono único do número: ninguém mais escreve 30 nem 1800000.
 */
export const STROLL_MIN_MINUTES = 30;
export const STROLL_MIN_MS = STROLL_MIN_MINUTES * 60 * 1000;

/** Quantas entradas o registro guarda (as mais recentes). */
export const LOG_MAX = 60;

export const CROSSINGS_EMPTY: CrossingsState = {
  opened: [], active: null, pending: [], destination: null, hidden: false, doneDay: null,
  pickDay: null, pickAt: null, log: [], score: 0, trip: null,
};
