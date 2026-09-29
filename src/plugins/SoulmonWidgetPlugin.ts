import { registerPlugin } from '@capacitor/core';
import { soulmonDisplayName } from '../utils/petName';
import { spriteLineOf, CORVO_LINE, type CorvoCarrier } from '../utils/corvoPet';
import { groveStageAt, type GroveLocal } from '../utils/groveLocal';
import { GROVE_STAGES, type GroveStageId } from '../utils/guildRules';

/**
 * O nome que vai para `pet_name` no widget — e é o MESMO da Home.
 *
 * ⚠️ Até 22/09/2026 o `App.tsx` mandava o ESTÁGIO capitalizado ("Rookie",
 * "Champion") enquanto o app inteiro exibe `soulmonDisplayName` — a criatura
 * chamada "Pyraka" na Home aparecia como "Rookie" nos widgets A, B e D.
 * Footgun 9 (regra copiada): o nome tem dono (`utils/petName.ts`) e o bridge
 * tinha reimplementado "nome = estágio". Quem chama o bridge passa por aqui;
 * `widgetNome.contract.test.ts` trava o `App.tsx` nisso.
 */
export function widgetPetName(meta?: { baseName?: string; petName?: string } | null): string {
  return soulmonDisplayName(meta) || 'Soulmon';
}

/**
 * `pet_line` do widget (29/09/2026, decisão do dono): só `'corvo'` ou vazio.
 * O Kotlin só tem uma linha de arte ALÉM da árvore padrão — o corvinho do
 * administrador —, então qualquer outra linha (personagem pronto do demo) vai
 * vazia e o plugin REMOVE a chave. Dono da linha: `spriteLineOf` (corvoPet).
 */
export function widgetPetLine(state: CorvoCarrier): '' | typeof CORVO_LINE {
  return spriteLineOf(state) === CORVO_LINE ? CORVO_LINE : '';
}

/**
 * `grove_stage` do widget: o id do ÚLTIMO estágio do Bosque que este aparelho
 * viu (`groveLocal`), ou vazio. Nunca contagem, nunca presença, nunca membros —
 * só o nome do lugar. O `pending` conta como visto (a memória já o registrou).
 */
export function widgetGroveStage(local: GroveLocal | null): '' | GroveStageId {
  if (!local) return '';
  const idx = Math.max(local.index, local.pending?.index ?? 0);
  const id = groveStageAt(idx);
  return id && (GROVE_STAGES as readonly string[]).includes(id) ? id : '';
}

export interface DigiWidgetData {
  petName: string;
  currentStage: string;
  eggType: string;
  branchType: string;
  completedTasks: number;
  totalTasks: number;
  hp: number;
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  /** True while there's poop on screen that hasn't been cleaned. */
  hasPoop: boolean;
  /* ── WP2.6 — o widget passa a saber de HÁBITO ──────────────────────────
     Ele recebia só tarefas do dia, HP e energia: o motor de constância — a
     peça mais central do produto — era invisível na única superfície que a
     pessoa vê sem abrir o app. As chaves do bridge são CONGELADAS (só se
     acrescenta), então nada aqui renomeia nada.
     Todos opcionais: um app novo falando com um widget velho, ou o contrário,
     não pode quebrar. E `-1`/ausente é "não informado", que é diferente de
     zero — mostrar 0% a quem ainda não tem histórico é a mesma mentira que a
     constância dotada existe para evitar. */
  /**
   * O ritmo está firme? **Uma FAIXA, nunca o percentual.**
   *
   * ⚠️ Aqui existiam quatro campos e a auditoria de 06/09/2026 tirou três
   * (`constancyPct`, `shields`, `bondLevel`) e não substituiu um deles.
   * `shields` e `bondLevel` eram escritos e **nunca lidos** pelo renderer —
   * carga morta —, e os dois primeiros são exatamente o que a spec do dossiê
   * VETOU na tela inicial: percentual cru é linha vermelha do produto, e
   * escudo exposto na home é o `Streak saves 0` do Alma, que transforma a
   * proteção silenciosa em placar.
   *
   * A faixa fica porque o comportamento bom que o número servia — o widget ter
   * algo a dizer num dia sem tarefa — não depende do número. `undefined` =
   * sem histórico, que é diferente de "não está firme".
   */
  habitSteady?: boolean;
  /** Maior marco de hábito atingido (0 = semente … 3 = árvore). */
  habitTierMax?: number;
  /** Alguma coisa faltou 2× seguidas — o widget oferece a versão de 5 min. */
  needsIntervention?: boolean;
  /** `'corvo'` ou `''` (vazio = o plugin remove `pet_line`). Ver `widgetPetLine`. */
  petLine?: '' | typeof CORVO_LINE;
  /** Id do estágio do Bosque ou `''` (vazio = o plugin remove `grove_stage`). Ver `widgetGroveStage`. */
  groveStage?: '' | GroveStageId;
}

export interface SoulmonWidgetPlugin {
  updateWidgetData(data: DigiWidgetData): Promise<void>;
}

const SoulmonWidget = registerPlugin<SoulmonWidgetPlugin>('SoulmonWidget', {
  // No-op web implementation — widget only exists on Android
  web: {
    async updateWidgetData() {},
  },
});

export { SoulmonWidget };
