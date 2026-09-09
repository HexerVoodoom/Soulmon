/**
 * 🔗 Nível de Vínculo — a trilha unificadora (docs/PLANO-PRODUTO.md, Parte 4).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A REGRA DE DESENHO QUE TORNA ISTO SEGURO:
 *
 *   **A trilha NÃO pode pedir nenhuma ação nova.**
 *
 * O Vínculo só RELÊ, num número único, o esforço que as 8 trilhas já registram
 * (evolução, marcos de hábito, Sonhos, missões, faixas do torneio, masmorra,
 * loja/decoração, troféus de season). Não existe evento aqui que só exista
 * para alimentar o Vínculo — se um dia alguém acrescentar um, a trilha deixou
 * de ser leitura e virou cobrança.
 *
 * É essa regra que separa o Vínculo do Habitica: no estudo de campo sobre
 * efeitos contraproducentes da gamificação, TODOS os participantes relataram
 * algum efeito negativo, com destaque para serem punidos pelo app justamente
 * em dias produtivos.
 *
 * FANTASIA: "Vínculo" mede a RELAÇÃO dono↔pet, não o desempenho do dono. É o
 * que torna aceitável um número que nunca desce.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INVARIANTES (há teste travando cada um):
 *
 * 1. Nenhuma função aqui devolve XP negativo. Falha não pune — derrota de
 *    torneio RENDE XP (menos que a vitória, mas rende).
 * 2. O teto diário é SUAVE: ao bater, simplesmente PARA de somar, exatamente
 *    como o limite de comida ("o pet está satisfeito"). Nunca um contador que
 *    desce, nunca um aviso vermelho.
 * 3. Recompensas são 100% COSMÉTICAS: decoração/cenário que já existem em
 *    `utils/shop.ts`, sonhos do `DREAM_CATALOG` e títulos (string sob o nome
 *    do pet). NUNCA Bits/Emblemas/Créditos (as três moedas não se misturam),
 *    nunca HP, energia, perfectDays ou vantagem de combate.
 * 4. **O NÍVEL NUNCA É PERSISTIDO.** Ele é derivado de `totalXP`, sempre, por
 *    esta função. Guardar `bondLevel` no save é o footgun 9 (regra copiada
 *    diverge em silêncio) — o save e a fórmula divergiriam sem erro nenhum.
 *    A ÚNICA coisa nova no GameState é `bondRewardsClaimed?: string[]`.
 * 5. Progresso DOTADO (Nunes & Drèze): um save existente, que já acumulou
 *    `totalXP` alimentando o pet, nasce em nível > 1 de graça, por construção.
 *    Ninguém começa em 0%.
 *
 * Módulo PURO: sem React, sem localStorage, sem `Date.now()`. Quem chama
 * passa o estado e recebe números de volta.
 */
import { HABIT_TIER_BONUS } from '../types/taskModel';
import type { HabitTier } from '../types/taskModel';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tabela de XP — todos os eventos JÁ EXISTEM no jogo.
// ─────────────────────────────────────────────────────────────────────────────

/** XP base por UNIDADE DE PESO DE ESFORÇO concluída (hábito = 1, tarefa = effort 1–3). */
export const XP_PER_EFFORT = 10;
/** ⭐ Dia perfeito (utils/dailyReset.ts). */
export const XP_PERFECT_DAY = 50;
/** 🛏️ Noite deitada dentro da janela de descanso (utils/restWindow.ts). */
export const XP_REST_NIGHT = 15;
/** 🌠 Sonho ainda não coletado (dexProgress cresce). */
export const XP_NEW_DREAM = 25;
/** 😱 Pesadelo vencido (utils/nightmares.ts). */
export const XP_NIGHTMARE_CLEARED = 10;
/** ⚔️ Andar de masmorra limpo. */
export const XP_DUNGEON_FLOOR = 10;
/** ⚔️ Run completa (os 5 andares). */
export const XP_DUNGEON_RUN = 60;
/** 🎪 Partida de torneio — DERROTA TAMBÉM RENDE. Falha não pune. */
export const XP_TOURNAMENT_WIN = 15;
export const XP_TOURNAMENT_LOSS = 8;
/** 🌳 Marcos de hábito (HABIT_MILESTONES = 7/21/66 dias efetivos). */
export const XP_HABIT_MILESTONE: Record<number, number> = { 7: 100, 21: 200, 66: 400 };
/** 🧹 Fila de triagem concluída (planejar é o que alivia — Masicampo & Baumeister). */
export const XP_TRIAGE_CLEARED = 30;
/** ☀️ Check-in do dia. */
export const XP_CHECK_IN = 10;

export type BondEvent =
  /** Conclusão de hábito/tarefa. `weight` = PESO DE ESFORÇO (nunca contagem de itens). */
  | { kind: 'completion'; weight: number; habitTier?: HabitTier }
  | { kind: 'perfectDay' }
  | { kind: 'restNight' }
  | { kind: 'dreamNew' }
  | { kind: 'nightmareCleared' }
  | { kind: 'dungeonFloor' }
  | { kind: 'dungeonRun' }
  | { kind: 'tournamentMatch'; won: boolean }
  | { kind: 'habitMilestone'; days: number }
  | { kind: 'triageCleared' }
  | { kind: 'checkIn' };

/** Clamp defensivo: save corrompido/NaN nunca vira XP negativo nem NaN. */
function safe(n: unknown, fallback = 0): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

/**
 * XP BRUTO de um evento, antes do teto diário.
 *
 * Sempre ≥ 0. O multiplicador do tier do hábito reusa `HABIT_TIER_BONUS`
 * (`types/taskModel.ts`) — não existe segunda tabela de tiers neste arquivo,
 * pelo mesmo motivo do footgun 9. Multiplicador SEMPRE ≥ 1: esforço antigo
 * vale MAIS, nunca menos.
 */
export function bondXP(event: BondEvent): number {
  switch (event.kind) {
    case 'completion': {
      const weight = Math.max(0, safe(event.weight));
      const mult = 1 + (event.habitTier ? HABIT_TIER_BONUS[event.habitTier] : 0);
      return Math.max(0, Math.round(XP_PER_EFFORT * weight * mult));
    }
    case 'perfectDay': return XP_PERFECT_DAY;
    case 'restNight': return XP_REST_NIGHT;
    case 'dreamNew': return XP_NEW_DREAM;
    case 'nightmareCleared': return XP_NIGHTMARE_CLEARED;
    case 'dungeonFloor': return XP_DUNGEON_FLOOR;
    case 'dungeonRun': return XP_DUNGEON_RUN;
    // Derrota rende. É a regra, não um detalhe de balanceamento.
    case 'tournamentMatch': return event.won ? XP_TOURNAMENT_WIN : XP_TOURNAMENT_LOSS;
    case 'habitMilestone': return XP_HABIT_MILESTONE[safe(event.days, -1)] ?? 0;
    case 'triageCleared': return XP_TRIAGE_CLEARED;
    case 'checkIn': return XP_CHECK_IN;
    default: return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Teto diário SUAVE nas fontes repetíveis.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * As fontes que a pessoa pode repetir à vontade num dia — e só elas.
 * Conclusão, dia perfeito, noite, sonho, marco, triagem e check-in NÃO têm
 * teto: são naturalmente limitados pela vida real, que é o ponto do app.
 */
export type BondCapSource = 'dungeon' | 'tournament';

export const BOND_DAILY_CAP: Record<BondCapSource, number> = {
  dungeon: 120,
  tournament: 60,
};

/** Ledger do dia. Só campos das fontes com teto; zera na virada, como a energia. */
export type BondDailyXP = Partial<Record<BondCapSource, number>>;

/** A qual teto o evento pertence (ou `null` = sem teto). */
export function bondCapSource(event: BondEvent): BondCapSource | null {
  switch (event.kind) {
    case 'dungeonFloor':
    case 'dungeonRun': return 'dungeon';
    case 'tournamentMatch': return 'tournament';
    default: return null;
  }
}

export interface BondGain {
  /** XP realmente concedido (já com o teto aplicado). Sempre ≥ 0. */
  xp: number;
  /** Novo ledger do dia. NUNCA tem valor menor que o anterior. */
  spent: BondDailyXP;
  /** Bateu o teto e parou de somar. É informação para o texto fofo
   *  ("o pet já está satisfeito"), NUNCA para um aviso vermelho. */
  capped: boolean;
}

/**
 * Aplica o teto diário suave.
 *
 * Ao bater o teto a soma simplesmente PARA — igual ao limite de comida. Não
 * existe subtração, não existe contador regressivo, não existe penalidade por
 * jogar demais: o excedente é ignorado em silêncio e o jogo continua inteiro
 * (a masmorra segue dando Bits, o torneio segue dando Emblemas).
 */
export function applyBondXP(event: BondEvent, spent: BondDailyXP = {}): BondGain {
  const raw = bondXP(event);
  const source = bondCapSource(event);
  if (!source) return { xp: raw, spent: { ...spent }, capped: false };

  const cap = BOND_DAILY_CAP[source];
  const used = Math.max(0, safe(spent[source]));
  const room = Math.max(0, cap - used);
  const xp = Math.min(raw, room);
  return {
    xp,
    spent: { ...spent, [source]: used + xp },
    capped: xp < raw,
  };
}

/** Dobra uma lista de eventos do dia respeitando os tetos. Sempre ≥ 0. */
export function bondXPForDay(
  events: readonly BondEvent[],
  spent: BondDailyXP = {},
): { xp: number; spent: BondDailyXP } {
  let total = 0;
  let ledger: BondDailyXP = { ...spent };
  for (const ev of events) {
    const gain = applyBondXP(ev, ledger);
    total += gain.xp;
    ledger = gain.spent;
  }
  return { xp: total, spent: ledger };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. A curva. ESTE é o ponto crítico — recalibrado na rodada 2.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A curva original proposta (`200×n×(n+1)/2`, nível 10 em ~2 meses) foi
 * calibrada para o MEIO-JOGO DE UM USUÁRIO QUE NÃO EXISTE: com D30 de 12%,
 * 88% das pessoas nunca chegam perto do nível 10.
 *
 * **Os únicos níveis que importam economicamente são 1 a 4, na primeira
 * semana.** A primeira recompensa cosmética visível tem que cair no DIA 1 e a
 * segunda no DIA 3. Assim o Vínculo deixa de ser meta-progressão e vira
 * mecanismo de retenção D7 — que é o pré-requisito do D30.
 *
 * Perfil de referência usado para calibrar (o mesmo do teste):
 *   dia bom   ≈ 165 XP (check-in 10 + peso 6 de conclusões 60 + dia perfeito 50
 *                       + noite 15 + sonho novo 25 + pesadelo 10 ≈ 170)
 *   dia mínimo ≈ 25 XP (check-in 10 + um hábito 10 + ... )
 *
 * Onde cada nível cai (cumulativo):
 *
 * Perfil misto = 165 no dia 1, depois 25/25/165 alternando
 * (cumulativo: 165, 190, 215, 380, 405, 570, 595).
 *
 *   | Nível | XP total | Dia bom (165/dia) | Perfil misto |
 *   |-------|---------:|-------------------|--------------|
 *   |   1   |        0 | dia 1 (nasce)     | dia 1        |
 *   |   2   |       75 | **dia 1**         | **dia 1**    |
 *   |   3   |      200 | dia 2             | **dia 3**    |
 *   |   4   |      400 | dia 3             | dia 5        |
 *   |   5   |      700 | dia 5             | dia 8        |
 *   |   6   |     1100 | dia 7             | ~dia 12      |
 *
 * Ou seja: o nível 2 (primeira recompensa visível) cai no DIA 1 nos dois
 * perfis e o nível 3 (segunda recompensa) cai no dia 2–3. É exatamente o alvo
 * da rodada 2 — e é por isso que a curva NÃO é a original.
 *
 * Sem cap de nível: acima do 6 o passo cresce linearmente (curva quadrática),
 * então sempre há próximo nível — só cada vez mais raro, como deve ser para os
 * 12% que ficam.
 */
const BOND_EARLY_STEPS = [75, 125, 200, 300, 400] as const;
/** Passo além da tabela inicial: cresce +100 por nível. */
const BOND_STEP_BASE = 400;
const BOND_STEP_GROWTH = 100;

/** XP necessário para SAIR do nível `level` (ou seja, chegar em `level + 1`). */
function stepFor(level: number): number {
  if (level <= 0) return 0;
  if (level <= BOND_EARLY_STEPS.length) return BOND_EARLY_STEPS[level - 1];
  return BOND_STEP_BASE + BOND_STEP_GROWTH * (level - BOND_EARLY_STEPS.length);
}

/**
 * XP total acumulado necessário para ESTAR no nível `n`. `xpForLevel(1) === 0`
 * — ninguém começa devendo. Monótona e sempre ≥ 0.
 */
/**
 * TETO DE NÍVEL — e ele existe por CUSTO DE CPU, não por balanceamento.
 *
 * `totalXP` mora no save, e o save é escrito pelo cliente. Sem teto, um
 * `totalXP` forjado fazia o servidor girar um laço quadrático: medido em
 * 08/09/2026, `bondLevelFor(1e10)` custava **183 ms de CPU numa chamada**, e a
 * curva é quadrática (1e12 daria ~18 s). O caminho é o `action=profile` do
 * `community.js`, que roda a CADA cloud save.
 *
 * O comentário que estava aqui afirmava que o laço "converge em poucas dezenas
 * de voltas mesmo para um save absurdo". A medição diz o contrário — é o tipo
 * de afirmação que um teste teria derrubado, e é por isso que agora existe um.
 *
 * 1000 é generoso ao ponto de ser inalcançável: exige ~5×10⁷ de XP, ou seja
 * mais de um século jogando 1000 XP por dia. Nível nenhum de jogador real
 * encosta nisso, e o gate de PvP vive no 5.
 */
export const BOND_MAX_LEVEL = 1000;

export function xpForLevel(n: number): number {
  const level = Math.min(BOND_MAX_LEVEL, Math.max(1, Math.floor(safe(n, 1))));
  let total = 0;
  for (let k = 1; k < level; k++) total += stepFor(k);
  return total;
}

/**
 * O nível derivado de `totalXP`. **Única fonte da verdade do nível** — não
 * existe `bondLevel` no save (footgun 9).
 *
 * Um save antigo, que só acumulou XP alimentando o pet (+10 por ponto de
 * atributo, `careRules.ts`), já nasce em nível > 1 sem fazer nada: é o
 * progresso dotado de Nunes & Drèze, de graça e por construção.
 */
export function bondLevelFor(totalXP: number): number {
  const xp = Math.max(0, safe(totalXP));
  // ACUMULA em vez de recalcular. `xpForLevel` é O(nível), então chamá-la
  // dentro do laço fazia o custo total ser O(nível²) — e `totalXP` vem do
  // save, que o cliente escreve. Somar o degrau a cada volta dá o MESMO
  // número em O(nível), e o teto (`BOND_MAX_LEVEL`) fecha a conta.
  let level = 1;
  let acumulado = 0;
  while (level < BOND_MAX_LEVEL) {
    acumulado += stepFor(level);     // == xpForLevel(level + 1)
    if (xp < acumulado) break;
    level++;
  }
  return level;
}

export interface BondProgress {
  level: number;
  /** XP já acumulado DENTRO do nível atual. Sempre ≥ 0. */
  into: number;
  /** XP que o nível atual custa por inteiro. Sempre > 0. */
  need: number;
  /** `into / need`, em [0, 1) — a barra da UI. Nunca negativa, nunca > 1. */
  ratio: number;
}

/** Tudo que a UI precisa. Nenhum número aqui pode diminuir com XP maior. */
export function bondProgress(totalXP: number): BondProgress {
  const xp = Math.max(0, safe(totalXP));
  const level = bondLevelFor(xp);
  const floor = xpForLevel(level);
  const need = stepFor(level);
  const into = Math.max(0, xp - floor);
  return { level, into, need, ratio: Math.min(1, Math.max(0, into / need)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Recompensas — 100% COSMÉTICAS.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `decor` e `bg` referenciam ids REAIS de `utils/shop.ts`; `dream` referencia
 * ids REAIS de `DREAM_CATALOG` (`utils/restWindow.ts`). `title` é uma string
 * exibida sob o nome do pet e não existe em lugar nenhum além daqui.
 *
 * **Não existe — e não pode passar a existir — um kind de moeda, HP, energia,
 * perfectDay ou stat de combate.** Bits/Emblemas/Créditos são três moedas que
 * nunca se misturam (`utils/currencies.ts`); dar qualquer uma delas aqui
 * misturaria as fronteiras que os testes de `currencies` travam. Há teste
 * neste módulo travando isso também.
 */
export type BondRewardKind = 'title' | 'decor' | 'bg' | 'dream';

export interface BondReward {
  /** Id estável — é o que entra em `bondRewardsClaimed` no GameState. */
  id: string;
  level: number;
  kind: BondRewardKind;
  /** Id do item em `utils/shop.ts` (decor/bg) ou do sonho em `DREAM_CATALOG`.
   *  Ausente em `title`, cujo texto vem de `bondTitle`. */
  refId?: string;
  namePt: string;
  nameEn: string;
}

/**
 * Títulos — o par EN/PT vive AQUI e é lido por `bondTitle`.
 * Um título é puro texto sob o nome do pet: zero efeito de jogo.
 */
/**
 * WP4.3 — A ESCADA CONTINUA DEPOIS DO 13.
 *
 * `bondRewardFor` devolvia `null` a partir do nível 14, e o L13 cai por volta
 * do dia 25–35: exatamente quando o jogador provou que fica, o Vínculo — o
 * sistema que existe para dizer "estamos juntos há tempo" — parava de dizer
 * qualquer coisa. Um sistema de relação que trava é uma relação que acabou.
 *
 * A continuação é por TÍTULO, de três em três níveis até o 31, e nada mais:
 * tudo cosmético, como a régua das moedas já obriga. Um título é a recompensa
 * certa aqui porque ele não compete com a loja (que a essa altura já foi
 * esvaziada) nem infla economia nenhuma — ele só nomeia o tempo.
 */
const BOND_TITLES: ReadonlyArray<{ level: number; en: string; pt: string }> = [
  { level: 2, en: 'Companion', pt: 'Companheiro' },
  { level: 6, en: 'Confidant', pt: 'Confidente' },
  { level: 10, en: 'Kindred Spirit', pt: 'Alma Irmã' },
  { level: 13, en: 'Lifelong Bond', pt: 'Vínculo de uma Vida' },
  // ── Depois do 13: de três em três, até o 31. ──────────────────────────
  { level: 16, en: 'Keeper of Days', pt: 'Guardião dos Dias' },
  { level: 19, en: 'Old Friend', pt: 'Velho Amigo' },
  { level: 22, en: 'Weathered Together', pt: 'Curtidos Juntos' },
  { level: 25, en: 'Two of a Kind', pt: 'Dois de Um Só' },
  { level: 28, en: 'Written in Us', pt: 'Escrito na Gente' },
  { level: 31, en: 'Beyond Counting', pt: 'Além da Conta' },
];

/** O último nível com título. Depois dele a escada acaba de verdade — e acabar
 *  num lugar declarado é diferente de parar sem aviso no 14. */
export const BOND_LAST_TITLED_LEVEL = 31;

/**
 * A escada de recompensas.
 *
 * O nível 2 (dia 1) e o nível 3 (dia 3) são os dois que decidem a retenção —
 * por isso o primeiro é um TÍTULO — que desde 06/09/2026 (WP3.3) realmente
 * aparece na home, sob o nome do pet, sem precisar abrir nada. Até então esta
 * frase era falsa: `bondTitle` só era lido em Estatísticas e no Torneio, telas
 * que quem está no dia 1 não abre — e o nome do pet sequer existia no
 * `CompanionHUD`. Quem prova a frase hoje é
 * `CompanionHUD.vinculo.render.test.tsx` e o segundo é o vaso de planta, a única decoração que
 * `fits: 'any'` no espaço `floor-right` — ou seja, visível em QUALQUER cenário,
 * inclusive o `bg-room` grátis que todo mundo tem.
 */
const BOND_REWARDS: readonly BondReward[] = [
  { id: 'bond-2-title', level: 2, kind: 'title', namePt: 'Título: Companheiro', nameEn: 'Title: Companion' },
  { id: 'bond-3-plant', level: 3, kind: 'decor', refId: 'furn-plant', namePt: 'Vaso de Planta', nameEn: 'Potted Plant' },
  { id: 'bond-4-forest', level: 4, kind: 'bg', refId: 'bg-forest', namePt: 'Floresta Nativa', nameEn: 'Native Forest' },
  { id: 'bond-5-boat', level: 5, kind: 'dream', refId: 'dream-little-boat', namePt: 'Sonho: À deriva num barquinho', nameEn: 'Dream: Adrift on a little boat' },
  { id: 'bond-6-title', level: 6, kind: 'title', namePt: 'Título: Confidente', nameEn: 'Title: Confidant' },
  { id: 'bond-7-picture', level: 7, kind: 'decor', refId: 'furn-picture', namePt: 'Quadro do Soulmon', nameEn: 'Soulmon Portrait' },
  { id: 'bond-8-sakura', level: 8, kind: 'bg', refId: 'bg-sakura', namePt: 'Cerejeira', nameEn: 'Cherry Blossom' },
  { id: 'bond-9-lantern', level: 9, kind: 'dream', refId: 'dream-lantern-river', namePt: 'Sonho: Entre lanternas flutuantes', nameEn: 'Dream: Among floating lanterns' },
  { id: 'bond-10-title', level: 10, kind: 'title', namePt: 'Título: Alma Irmã', nameEn: 'Title: Kindred Spirit' },
  { id: 'bond-11-rug', level: 11, kind: 'decor', refId: 'furn-rug', namePt: 'Tapete de Patinhas', nameEn: 'Paw Print Rug' },
  { id: 'bond-12-train', level: 12, kind: 'dream', refId: 'dream-night-train', namePt: 'Sonho: No trem noturno', nameEn: 'Dream: On the night train' },
  { id: 'bond-13-title', level: 13, kind: 'title', namePt: 'Título: Vínculo de uma Vida', nameEn: 'Title: Lifelong Bond' },
];

/** A recompensa daquele nível, ou `null` se o nível não dá nada. */
export function bondRewardFor(level: number): BondReward | null {
  const n = Math.floor(safe(level, 0));
  const daLista = BOND_REWARDS.find((r) => r.level === n);
  if (daLista) return daLista;
  /* WP4.3 — depois do 13, os títulos novos também SÃO recompensa.
     Sem isto, `bondRewardFor` continuaria devolvendo `null` a partir do 14 e
     a trilha do Vínculo terminaria em silêncio no dia 25–35 — bem quando o
     jogador acabou de provar que fica. */
  const titulo = BOND_TITLES.find((t) => t.level === n);
  if (!titulo) return null;
  return {
    id: `bond-${n}-title`,
    level: n,
    kind: 'title',
    namePt: `Título: ${titulo.pt}`,
    nameEn: `Title: ${titulo.en}`,
  };
}

/** Toda a escada, para a UI da trilha (mostrar o que vem a seguir). */
export function bondRewardLadder(): readonly BondReward[] {
  return BOND_REWARDS;
}

/**
 * O título exibido sob o nome do pet: o mais alto já alcançado.
 * `null` antes do nível 2 — ninguém carrega um título vazio.
 */
export function bondTitle(level: number, language: string): string | null {
  const n = Math.floor(safe(level, 1));
  let found: { en: string; pt: string } | null = null;
  for (const t of BOND_TITLES) if (n >= t.level) found = t;
  if (!found) return null;
  return language === 'pt-BR' ? found.pt : found.en;
}

/**
 * As recompensas já conquistadas (nível ≤ atual) que ainda não foram entregues.
 *
 * Modelo de estado que o dono da fiação vai ligar:
 *   `bondRewardsClaimed?: string[]` no GameState  ← a ÚNICA coisa persistida.
 * O nível NUNCA vai para o save: é sempre `bondLevelFor(totalXP)`.
 */
export function unclaimedBondRewards(
  totalXP: number,
  claimed: readonly string[] = [],
): readonly BondReward[] {
  const level = bondLevelFor(totalXP);
  const done = new Set(claimed);
  return BOND_REWARDS.filter((r) => r.level <= level && !done.has(r.id));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. A FIAÇÃO — o funil único por onde o XP entra em produção.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * O ledger do dia, do jeito que ele mora no save.
 *
 * `day` é a chave do DIA DO JOGADOR (`utils/playerDay.ts`), nunca a do
 * aparelho: dois celulares em fusos diferentes discordariam do nome do dia e o
 * teto valeria duas vezes — o mesmo furo que `careCaps` fechou.
 *
 * O ledger guarda SÓ o dia corrente e as fontes com teto. Não é histórico, não
 * é streak, não é saldo: na virada ele é DESCARTADO e o `totalXP` não é tocado.
 */
export interface BondDailyLedger {
  day: string;
  spent: BondDailyXP;
}

/** A fatia do GameState que a fiação lê e escreve. */
export interface BondState {
  totalXP: number;
  bondDaily?: BondDailyLedger;
}

/**
 * Concede o XP de UM evento — **o único caminho de produção**.
 *
 * Função PURA, como o resto do módulo: recebe o estado e a chave do dia do
 * jogador, devolve o estado novo. Quem chama (App.tsx) só passa o evento que já
 * aconteceu — a trilha continua sem pedir nenhuma ação nova.
 *
 * Três coisas que ela NÃO faz, e é por isso que ela existe:
 *  · não subtrai nada de `totalXP` em situação nenhuma (invariante 1);
 *  · não expira, não decai e não zera XP na virada — a virada troca só o
 *    LEDGER do teto (invariante do desenho: sem streak, sem decaimento);
 *  · não persiste nível (invariante 4) — nível é sempre `bondLevelFor`.
 */
export function awardBondXP<T extends BondState>(state: T, event: BondEvent, dayKey: string): T {
  // Dia diferente = ledger novo. O que zera é o TETO, nunca o acumulado.
  const spent = state.bondDaily?.day === dayKey ? state.bondDaily.spent : {};
  const gain = applyBondXP(event, spent);
  return {
    ...state,
    totalXP: Math.max(0, safe(state.totalXP)) + gain.xp,
    bondDaily: { day: dayKey, spent: gain.spent },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. O gate de PvP — o ÚNICO destrave não-cosmético, e ele é social.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nível mínimo para LIGAR o PvP: **5**.
 *
 * Não é número escolhido: os níveis 1–4 são o funil de retenção D1–D7 declarado
 * na própria curva (seção 3), e o 5 é o primeiro degrau FORA dele — 700 XP,
 * ~uma semana de uso real nos dois perfis de referência, que é exatamente a
 * janela da métrica-norte. Pôr o gate dentro do funil contaminaria a calibração
 * de retenção com um objetivo social; pôr depois transformaria o Vínculo em
 * grind. Derivação completa em `level-de-conta.md` §6.
 *
 * **Todo destrave social futuro reusa ESTE nível.** Uma escada de gates sociais
 * é grind com outro nome — o Vínculo destrava cosmético e superfície social, e
 * NUNCA capacidade de cuidar do bicho.
 */
export const BOND_PVP_MIN_LEVEL = 5;

/**
 * O Vínculo já é suficiente para o PvP?
 *
 * É um LIMIAR, não uma manutenção: como `bondLevelFor` é monótona e `totalXP`
 * nunca desce (nenhum caminho de regressão o toca — `dailyReset.ts` mexe em
 * estágio, dias perfeitos e HP), quem cruzou uma vez cruzou para sempre. Não há
 * janela, decaimento nem "proteção de nível" a manter.
 *
 * O nível NÃO substitui o consentimento: ele só torna o PvP DISPONÍVEL. Ligar
 * continua sendo um ato explícito, com o aviso de que o nick vai para uma lista
 * pública.
 */
export function meetsPvpBond(totalXP: number): boolean {
  return bondLevelFor(Math.max(0, safe(totalXP))) >= BOND_PVP_MIN_LEVEL;
}

/** Quanto falta para o PvP ficar disponível. `0` quando já está. Nunca negativo. */
export function xpToPvpBond(totalXP: number): number {
  return Math.max(0, xpForLevel(BOND_PVP_MIN_LEVEL) - Math.max(0, safe(totalXP)));
}

// ─────────────────────────────────────────────────────────────────────────────
// A ENTREGA DA ESCADA (WP4.15)
//
// `BOND_REWARDS` e `unclaimedBondRewards` foram escritos, testados e ficaram
// **sem consumidor**: `bondRewardsClaimed` nunca era escrito por ninguém, e as
// doze recompensas dos níveis 2 a 13 nunca chegavam ao jogador. O que chegava
// era só o `bondTitle`, que é derivado e por isso funcionava sozinho. Um
// jogador no nível 11 tinha três decorações, dois cenários e três sonhos
// esperando por ele desde sempre, e não sabia.
//
// Estender essa escada (WP4.3) antes de entregá-la seria estender código morto,
// e é por isso que este pacote vem antes.
// ─────────────────────────────────────────────────────────────────────────────

/** O mínimo do GameState que a entrega toca. */
export interface BondRewardTarget {
  totalXP?: number;
  bondRewardsClaimed?: string[];
  ownedFurniture?: string[];
  ownedBackgrounds?: string[];
  /* Só o campo que a entrega toca. Nada de `Record<string, unknown>` aqui:
     interface não ganha índice implícito em TS, e o `GameState` deixaria de
     casar com este alvo — o genérico cairia para o tipo largo e o `setGameState`
     do chamador pararia de compilar. */
  rest?: { dreams?: string[] };
}

/**
 * Entrega o que o nível do Vínculo já garantiu, e devolve o MESMO objeto
 * quando não há nada a entregar.
 *
 * **Idempotente por construção**, e isso não é elegância: o chamador é um
 * `setGameState`, o StrictMode invoca updater duas vezes (footgun 6), e uma
 * entrega que duplicasse itens ali seria invisível em desenvolvimento e
 * permanente no save de quem joga.
 *
 * **Item já possuído marca `claimed` do mesmo jeito, e não devolve Bits.** É a
 * ressalva da linha vermelha: quem comprou a plantinha antes de chegar ao nível
 * 3 não recebe 100 Bits de troco — recebe o registro de que aquele degrau está
 * cumprido. Reembolso transformaria a escada num gerador de moeda.
 *
 * `title` não entrega nada: o título é `bondTitle(totalXP)`, derivado na
 * leitura. Ele entra em `claimed` só para a UI saber que já foi anunciado.
 */
export function applyBondRewards<T extends BondRewardTarget>(
  prev: T,
): { state: T; delivered: readonly BondReward[] } {
  const claimed = Array.isArray(prev.bondRewardsClaimed) ? prev.bondRewardsClaimed : [];
  const pending = unclaimedBondRewards(safe(prev.totalXP ?? 0), claimed);
  if (pending.length === 0) return { state: prev, delivered: [] };

  const furniture = new Set(Array.isArray(prev.ownedFurniture) ? prev.ownedFurniture : []);
  const backgrounds = new Set(Array.isArray(prev.ownedBackgrounds) ? prev.ownedBackgrounds : []);
  const dreams = new Set(Array.isArray(prev.rest?.dreams) ? prev.rest!.dreams! : []);

  for (const r of pending) {
    if (!r.refId) continue;              // `title` — nada a entregar
    if (r.kind === 'decor') furniture.add(r.refId);
    else if (r.kind === 'bg') backgrounds.add(r.refId);
    else if (r.kind === 'dream') dreams.add(r.refId);
  }

  return {
    // O `as T`: o spread produz um objeto estruturalmente igual, mas o TS não
    // consegue provar que ele ainda é o `T` do chamador. Mesmo padrão dos
    // outros aplicadores puros do projeto.
    state: {
      ...prev,
      bondRewardsClaimed: [...claimed, ...pending.map((r) => r.id)],
      ownedFurniture: [...furniture],
      ownedBackgrounds: [...backgrounds],
      // `rest` pode não existir num save antigo: nesse caso o sonho não tem
      // onde morar, e inventar um `rest` aqui seria este módulo virando dono de
      // um estado que é do `restWindow`. O degrau conta como cumprido de todo
      // jeito — o alternativo é ficar tentando entregar para sempre.
      ...(prev.rest ? { rest: { ...prev.rest, dreams: [...dreams] } } : {}),
    } as T,
    delivered: pending,
  };
}
