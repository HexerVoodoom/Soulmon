/**
 * A APRESENTAÇÃO DO PRÉDIO NOVO (08/10/2026, pedido do dono): quando um prédio do Mapa abre porque o Vínculo cresceu,
 * o NPC dele aparece, se apresenta e introduz o prédio (`components/BuildingIntro.tsx`). Aqui mora a REGRA — pura:
 * sem React, sem localStorage, sem `Date`. O texto mora em `buildingIntroCopy.ts`; o NPC (nome/busto) em
 * `areaNpcVoice.ts`/`assets/soulmon/npcs`.
 *
 * ## Fonte única
 * A tabela "qual prédio abre em qual Vínculo" JÁ existe — `BUILDING_GATES` em `utils/gates.ts`, a mesma que o
 * Mapa lê para trancar o lote (`buildingGateFor`). Este módulo NÃO guarda número de prédio nenhum: deriva a
 * lista de lá. Se o dono mover um prédio de nível, a apresentação muda junto, sem tocar aqui
 * (`buildingIntro.test.ts` reprova divergência).
 *
 * ## O que já foi visto: `buildingIntrosSeen`
 * Uma lista de ids de prédio no save. O PENDENTE é "aberto neste Vínculo E ainda não visto". Dois efeitos:
 *  · vários prédios de uma vez (um Vínculo que abre três) viram uma FILA, um por vez, sempre na mesma ordem;
 *  · fechar o app no meio não perde nada — o que não foi visto continua pendente na próxima abertura.
 *
 * ## Save existente NÃO re-dispara (migração por construção)
 * Campo ausente (save velho, ou jogador novo) é lido como "tudo que já está aberto neste Vínculo é conhecido":
 * `sanitizeBuildingIntrosSeen` semeia a lista com os prédios abertos no Vínculo da carga. Quem já usa o Mercado,
 * a Masmorra ou a Arena nunca vê uma apresentação do que já pisou; o jogador novo (Vínculo 1) começa só com os
 * prédios de entrada semeados, e é o crescimento DEPOIS disso que apresenta. Lixo no campo cai no mesmo
 * caminho — o erro seguro é não apresentar, nunca apresentar de novo.
 *
 * ## Nunca cobra
 * "Depois" e "Ir lá" gravam o mesmo "visto": a apresentação não reaparece, não vira pendência, não conta nada.
 * Nenhuma função aqui devolve número que desce nem texto de falta.
 */
import { BUILDING_GATES, type BuildingId } from './gates';
import { AREAS } from '../navigation';

const IDS = Object.keys(BUILDING_GATES) as BuildingId[];
const ID_SET: ReadonlySet<string> = new Set(IDS);

/** O índice da área do prédio no Mapa (a ordem de leitura de `AREAS`). */
function areaIndex(id: BuildingId): number {
  const i = (AREAS as readonly string[]).indexOf(id.split('.')[0]);
  return i < 0 ? AREAS.length : i;
}

/**
 * TODOS os prédios, na ORDEM DA FILA: do Vínculo que abre mais cedo ao mais tarde; no mesmo Vínculo, na ordem do
 * Mapa (área e, dentro dela, a ordem de declaração em `BUILDING_GATES`). Determinística — a fila não troca de
 * lugar entre aberturas do app.
 */
export const BUILDING_INTRO_ORDER: readonly BuildingId[] = [...IDS].sort((a, b) =>
  BUILDING_GATES[a].minBond - BUILDING_GATES[b].minBond
  || areaIndex(a) - areaIndex(b)
  || IDS.indexOf(a) - IDS.indexOf(b));

export function isBuildingId(x: unknown): x is BuildingId {
  return typeof x === 'string' && ID_SET.has(x);
}

function levelOf(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

/**
 * Os prédios que passam a abrir ao ir do Vínculo `prevLevel` ao `level` (exclusivo/inclusivo), na ordem da fila.
 * `prevLevel` 0 = "desde o começo". Vínculo que não sobe (ou desce, lixo) devolve `[]`: nunca "des-abre" nada.
 */
export function buildingsUnlockedBetween(prevLevel: unknown, level: unknown): BuildingId[] {
  const from = typeof prevLevel === 'number' && Number.isFinite(prevLevel) ? Math.max(0, Math.floor(prevLevel)) : 0;
  const to = levelOf(level);
  return BUILDING_INTRO_ORDER.filter(id => BUILDING_GATES[id].minBond > from && BUILDING_GATES[id].minBond <= to);
}

/** A lista de "vistos" de um save que acabou de nascer/ser lido sem o campo: tudo que já está aberto neste Vínculo. */
export function seedBuildingIntrosSeen(bondLevel: unknown): BuildingId[] {
  return buildingsUnlockedBetween(0, bondLevel);
}

/**
 * Higieniza o campo vindo do disco/nuvem. Não-array (ausente, objeto, número, `null`) → semeia pelo Vínculo da
 * carga. Array → só ids de prédio conhecidos, sem repetir, na ordem em que vieram (id velho de prédio que
 * deixou de existir some, sem erro).
 */
export function sanitizeBuildingIntrosSeen(raw: unknown, bondLevel: unknown): BuildingId[] {
  if (!Array.isArray(raw)) return seedBuildingIntrosSeen(bondLevel);
  const out: BuildingId[] = [];
  // `arena.feira` virou `hall.feira` (11/10/2026): quem já viu a apresentação não a vê de novo.
  for (const raw0 of raw) { const x = raw0 === 'arena.feira' ? 'hall.feira' : raw0; if (isBuildingId(x) && !out.includes(x)) out.push(x); }
  return out;
}

/** As apresentações que faltam, na ordem da fila: abertas neste Vínculo e ainda não vistas. */
export function pendingBuildingIntros(seen: unknown, bondLevel: unknown): BuildingId[] {
  const vistos = new Set(Array.isArray(seen) ? seen.filter(isBuildingId) : []);
  return buildingsUnlockedBetween(0, bondLevel).filter(id => !vistos.has(id));
}

/** Marca uma apresentação como vista. Idempotente: já vista devolve a MESMA referência (updater do `setGameState`). */
export function markBuildingIntroSeen(seen: readonly string[] | undefined, id: BuildingId): readonly string[] {
  const atual = Array.isArray(seen) ? seen : [];
  return atual.includes(id) ? atual : [...atual, id];
}

/**
 * Posição na fila de intersticiais, DECLARADA aqui e travada em `filaDeAvisos.contract.test.ts`: a apresentação
 * monta DEPOIS do display de Level Up (`LevelUpOverlay` — outro run; enquanto ele não está na main o chamador
 * passa `levelUpOpen: false`) e só numa tela calma (Home ou Mapa), nunca por cima de um jogo em andamento.
 * O Level Up SOBREPÕE e só sai ao toque; esta apresentação espera ele sair, e o NPC chega logo em seguida.
 */
export const BUILDING_INTRO_AFTER = 'levelUp' as const;

export function buildingIntroReady(p: { pending: readonly BuildingId[]; levelUpOpen: boolean; calmView: boolean }): boolean {
  return p.pending.length > 0 && !p.levelUpOpen && p.calmView;
}
