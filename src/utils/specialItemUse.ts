import { CHIP_BOOST, HEART_HEAL, SPECIAL_ITEMS, type Attr } from './shop';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';

/**
 * O USO de um item especial da pastinha — glitchtama, coraçãozinho, chip.
 *
 * ⚠️ Por que este arquivo existe, e por que NÃO é o `careUpdaters.ts`.
 *
 * O ramo de `SPECIAL_ITEMS` do `handleFeed` carregava **três updaters inline
 * com regra de verdade dentro**: o decremento do inventário (repetido três
 * vezes, palavra por palavra), o `HEART_HEAL`, o `CHIP_BOOST` e o `+1` de
 * `perfectDays`. Regra dentro de updater inline é regra sem teste: nada em
 * `src/utils/*.test.ts` conseguia alcançá-la sem montar o `App.tsx` em jsdom.
 *
 * Não foi para o `careUpdaters.ts` de propósito. Aquele arquivo é dos GESTOS DE
 * CUIDADO COMUNS — carinho e comida —, e a coisa que ele existe para guardar é
 * o TETO (`careCaps`: janela de comida por hora, carinho por dia). Item especial
 * não tem teto nenhum: o próprio `careRules.ts` declara isso por escrito no
 * cabeçalho de `feedFood` ("Itens especiais da loja NÃO passam por aqui: eles
 * têm efeitos próprios e não contam no limite"). Enfiá-los ali reabriria a
 * pergunta "isso conta no teto?" em cima do arquivo cuja razão de ser é
 * responder que sim.
 *
 * Também não foi para o `shop.ts`: aquilo é CATÁLOGO — o que existe, quanto
 * custa, como se chama. Aqui é o que ACONTECE ao usar. Este arquivo consome o
 * catálogo (`SPECIAL_ITEMS`, `CHIP_BOOST`, `HEART_HEAL`) e não o redefine, para
 * os números continuarem tendo um dono só.
 *
 * ⚠️ PROGRESSÃO: `perfectDays`, `totalPerfectDays` e o `CHIP_BOOST` alimentam
 * evolução, que alimenta a árvore e o teto de geração de sprite. Esta extração
 * é aritmeticamente idêntica ao que estava inline — há teste travando cada
 * número (`specialItemUse.test.ts`).
 *
 * O que fica no `App.tsx`: só os efeitos (som por tipo de item, animação de
 * comer, toast do glitchtama) e a decisão de recusar, que dispara sinal na UI e
 * por isso não pode morar dentro de um updater — efeito colateral em updater
 * roda 2× no StrictMode.
 */

export type SpecialRefusal = 'no-stock' | 'already-full' | 'daily-cap';

/**
 * Quantos 🌀 Glitchtama o jogador pode CONSUMIR por dia do jogador.
 *
 * ⚠️ Este teto não é economia, é a espinha da progressão — e ele foi
 * acrescentado depois de uma auditoria fazer a conta (06/09/2026).
 *
 * O Glitchtama dá +1 `perfectDays`, que é a moeda que a escada de evolução
 * consome. Rookie→mega custa 14 dias perfeitos e o Ultra custa mais
 * `ULTRA_PATIENCE_DAYS` (45): **59 no total**. A masmorra declara, por escrito,
 * que não tem limite diário nem gate de entrada, e concluir os 5 andares
 * sempre dropa um Glitchtama — então 59 runs seguidas compravam a escada
 * inteira, e elas cabem num fim de semana.
 *
 * O `progression.ts` justifica os 45 dias do Ultra assim: *"consistência ao
 * longo de semanas, que é o recurso que a pesquisa de v-pet aponta como o
 * único que não cresce indefinidamente"*. Sem este teto, ele crescia.
 *
 * O conserto é um teto por DIA, e não um limite de estoque nem um custo de
 * entrada, por três razões: (a) o item continua caindo e continua valendo —
 * ninguém perde nada do que já tem; (b) o recurso que a tese protege é TEMPO
 * DE CALENDÁRIO, e só um teto por dia converte o atalho de volta em dias; (c) a
 * masmorra segue sem cobrar coração, que é a linha vermelha de verdade.
 *
 * Um por dia significa que o Glitchtama, no melhor caso, DOBRA o ritmo de quem
 * já faz o dia perfeito — é generoso, e é finito.
 */
export const GLITCHTAMA_PER_DAY = 1;

/**
 * O registro do teto, no SAVE (`glitchtamaUse`), nunca no localStorage.
 *
 * Mesmo motivo do `careCaps` e do `poopDrainCharge`: um teto que se fura
 * trocando de aparelho não é um teto. E o DIA aqui é o **dia do jogador**
 * (`playerDayKey` + `playerDayTz`), não o do aparelho — senão dois celulares em
 * fusos diferentes discordariam do nome do dia e o teto valeria duas vezes.
 */
export interface GlitchtamaUse {
  day: string;
  used: number;
}

/** Fatia do GameState que o uso de item especial lê e escreve. */
export interface SpecialItemState {
  healthPoints: number;
  maxHealthPoints: number;
  foodInventory: Record<string, number>;
  perfectDays: number;
  totalPerfectDays?: number;
  /** Dias completos vitalícios PARA AS MISSÕES — real + 🌀 (decisão #41/#60). */
  missionPerfectDays?: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  totalXP: number;
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
  glitchtamaUse?: GlitchtamaUse;
  playerDayTz?: PlayerDayAnchor;
}

/**
 * Quantos Glitchtama já foram usados HOJE. Dia diferente = zero — o registro
 * antigo não é apagado, é simplesmente ignorado, que é o que torna esta leitura
 * idempotente sob a virada.
 */
export function glitchtamaUsedToday(state: SpecialItemState, now: Date): number {
  const hoje = playerDayKey(now, state.playerDayTz);
  const reg = state.glitchtamaUse;
  return reg && reg.day === hoje ? reg.used : 0;
}

/**
 * O uso seria recusado? Separado de `applySpecialItem` pelo mesmo motivo de
 * `rubDecision`: a recusa acende sinal na UI (o coração cheio pisca o
 * `healCapSignal`), e efeito colateral não entra em updater.
 *
 * O `petPassive` não entra aqui de propósito: nenhum traço mexe em item
 * especial hoje. Se um dia mexer, ele vem do ESTADO, como em `rubDecision`.
 */
export function specialRefusal(state: SpecialItemState, emoji: string, now: Date): SpecialRefusal | undefined {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return undefined;
  if ((state.foodInventory[emoji] ?? 0) <= 0) return 'no-stock';
  // O teto do Glitchtama recusa ANTES do decremento: o item volta para a
  // pastinha intacto e vale amanhã. Recusar depois de consumir seria a família
  // de bug do X-6 ao contrário — gastar para não receber nada.
  if (special.kind === 'glitchtama' && glitchtamaUsedToday(state, now) >= GLITCHTAMA_PER_DAY) return 'daily-cap';
  // Só o coraçãozinho recusa por estado: ele é a única cura comprável, e gastar
  // um com a vida cheia queimaria o item por nada.
  if (special.kind === 'heart' && state.healthPoints >= state.maxHealthPoints) return 'already-full';
  return undefined;
}

/**
 * Um item especial usado sobre o `prev`.
 *
 * ⚠️ A recusa é RECONFERIDA aqui, sobre o `prev` — a checagem de fora existe só
 * pelo sinal na UI. É a família de bug do X-6, e ela ESTAVA presente no
 * coraçãozinho: a recusa de vida cheia só era lida do `gameState` de fora, e o
 * updater inline se limitava a clampar a cura com `Math.min`. Dois toques no
 * mesmo lote do React com 4/5 de vida liam o mesmo `gameState` (4 < 5, passa
 * duas vezes), e a segunda passada decrementava o inventário para curar ZERO —
 * um coraçãozinho queimado em silêncio. Aqui a segunda passada já enxerga a
 * vida cheia que a primeira escreveu e devolve `prev` intacto.
 *
 * O estoque também vem do `prev`, e não de fora, pelo mesmo motivo: com UM item
 * no inventário, dois toques no mesmo lote passariam os dois pela checagem
 * externa.
 */
export function applySpecialItem<T extends SpecialItemState>(
  prev: T,
  emoji: string,
  now: Date,
): { state: T; refused?: SpecialRefusal } {
  const special = SPECIAL_ITEMS[emoji];
  if (!special) return { state: prev };

  const refused = specialRefusal(prev, emoji, now);
  if (refused) return { state: prev, refused };

  // Decremento do inventário — era esta a linha copiada três vezes inline.
  const count = prev.foodInventory[emoji] ?? 0;
  const foodInventory = { ...prev.foodInventory, [emoji]: count - 1 };
  if (foodInventory[emoji] === 0) delete foodInventory[emoji];

  if (special.kind === 'glitchtama') {
    // 🌀 Glitchtama: cai zerando as 5 salas da masmorra e vale 1 dia perfeito —
    // isto é PONTO DE EVOLUÇÃO, não enfeite. `perfectDays` é o contador que a
    // escada consome.
    //
    // ⚠️ DECISÃO DO DONO #41/#60 (22/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
    // *"🌀 Glitchtama **não conta** para conquistas: `totalPerfectDays` só por
    // dia completo real (segue contando para a missão)"*.
    //
    // O que isto conserta (QA rodada 2, §2.6): o perfil G — zero hábitos, uma
    // run de masmorra por dia — terminava 90 dias com `totalPerfectDays = 90`
    // e **nenhum** dia completo de verdade, abrindo `perfect-day` e
    // `dias-completos-30` sem nunca ter cumprido uma meta. `dias-completos-30`
    // é justamente a conquista que substituiu `tasks-100` para deixar de
    // premiar CONTAGEM (linha vermelha #16); um minijogo inflando o contador
    // reabria o veto pela porta dos fundos.
    //
    // Por isso o 🌀 escreve agora `missionPerfectDays` — contador separado,
    // lido SÓ por `utils/missions.ts` (`mission-perfect-30`), que a decisão
    // manda continuar contando o item. `totalPerfectDays` volta a significar
    // uma coisa só: dias completos REAIS, e é ele que `achievements.ts` e
    // `seasons.ts` leem. Duas perguntas diferentes, dois contadores — em vez de
    // um número com dois significados (footgun 9 ao contrário).
    //
    // `computeDailyReset` incrementa os DOIS num dia completo real, então a
    // missão nunca anda para trás nem fica mais difícil do que era.
    //
    // O contador do teto é escrito no MESMO retorno que dá o ponto: um lote do
    // React que aplicasse o ponto sem gravar o uso deixaria o próximo toque
    // passar de novo, que é exatamente o furo do X-6.
    return {
      state: {
        ...prev,
        foodInventory,
        perfectDays: prev.perfectDays + 1,
        // #41/#60: o vitalício REAL não é tocado — só o da missão.
        missionPerfectDays: (prev.missionPerfectDays ?? prev.totalPerfectDays ?? 0) + 1,
        glitchtamaUse: {
          day: playerDayKey(now, prev.playerDayTz),
          used: glitchtamaUsedToday(prev, now) + 1,
        },
      },
    };
  }

  if (special.kind === 'heart') {
    // A única cura comprável. O `Math.min` continua aqui como segunda trava,
    // mas quem barra o desperdício agora é a recusa acima.
    return {
      state: {
        ...prev,
        foodInventory,
        healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + HEART_HEAL),
      },
    };
  }

  // Chip: só atributo, sem energia. Os três atributos são escritos por extenso
  // em vez de por chave computada porque a chave computada obriga o retorno a
  // largar o tipo do estado — e era exatamente disso que o updater inline vivia.
  const attr = special.attr as Attr;
  const boost = (a: Attr) => (attr === a ? CHIP_BOOST : 0);
  const since = prev.attributesSinceLastEvolution;
  return {
    state: {
      ...prev,
      foodInventory,
      virusPoints: prev.virusPoints + boost('virus'),
      dataPoints: prev.dataPoints + boost('data'),
      vaccinePoints: prev.vaccinePoints + boost('vaccine'),
      totalXP: prev.totalXP + CHIP_BOOST * 10,
      attributesSinceLastEvolution: {
        virus: (since?.virus ?? 0) + boost('virus'),
        data: (since?.data ?? 0) + boost('data'),
        vaccine: (since?.vaccine ?? 0) + boost('vaccine'),
      },
    },
  };
}
