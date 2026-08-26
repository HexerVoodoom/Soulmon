// A FRONTEIRA DE CUIDADO DO DESKTOP.
//
// Por que este arquivo existe, e por que ele é fininho de propósito:
//
// O `menu.ts` é um módulo de DOM — ele faz `document.getElementById` no topo,
// então nenhum teste em `node` consegue importá-lo. Enquanto a decisão de
// cuidado morava lá dentro, ela era, na prática, INTESTÁVEL: foi assim que o
// `{ date: day, healed: 0 }` fixo (menu.ts:412) sobreviveu à fatia 2 inteira
// enquanto o app consertava exatamente o mesmo defeito no achado X-6.
//
// Aqui NÃO se decide nada de cuidado. Cada função é um adaptador: pega o
// GameState cru que veio do servidor (ou o estado local do overlay), veste ele
// no formato que as regras do app pedem, e chama a regra do app. As regras
// continuam inteiras em `src/utils/careRules.ts`, `careCaps.ts`,
// `careUpdaters.ts` e `playerDay.ts` — este arquivo só liga os fios.
//
// ⚠️ Footgun 9 do CLAUDE.md: regra copiada diverge em silêncio. Foi o que
// aconteceu com o teto de carinho. A resposta NÃO é copiar melhor, é não
// copiar: tudo abaixo importa do app.
import { applyRub, applyFeed, type CareCapsState } from '../../../src/utils/careUpdaters';
import {
  rubRefusal, rubHealRecordFor, RUB_HEAL_STEP,
  type RubHealRecord, type FeedRefusal, type RubRefusal,
} from '../../../src/utils/careRules';
import { playerDayKey, sanitizePlayerDayAnchor } from '../../../src/utils/playerDay';

/** O GameState como ele chega do servidor: JSON cru, sem tipo. */
export type RemoteState = Record<string, unknown>;

/**
 * O DIA DO JOGADOR do save remoto.
 *
 * Lê a âncora de fuso que o app grava no save (`playerDayTz`) e devolve a chave
 * na MESMA forma que o app usa (`toDateString()`, "Wed Aug 26 2026").
 *
 * Isto é uma restrição de FORMATO, não de estética: o desktop passou a gravar
 * `careCaps.rubHeal.date` no save que o celular lê. Se o desktop escrevesse a
 * chave antiga do overlay (`YYYY-MM-DD`, `state.ts:todayKey`), o
 * `rubHealRecordFor` do app receberia uma data que o `Date.parse` também
 * entende, mas de UM ANO ERRADO — e o registro do dia viraria "dia à frente"
 * para sempre, congelando o teto do celular. Divergir de formato quebra em
 * silêncio; é a restrição número 1 desta fronteira.
 *
 * Sem âncora no save, `playerDayKey` devolve `now.toDateString()` byte a byte —
 * o comportamento antigo, que é o que mantém save não-migrado funcionando.
 */
export function remoteDayKey(remote: RemoteState, now: Date): string {
  return playerDayKey(now, sanitizePlayerDayAnchor(remote.playerDayTz));
}

export type CareOutcome<R> =
  | { next: RemoteState; refused?: undefined }
  | { next: null; refused: R };

/**
 * Um carinho aplicado ao save REAL.
 *
 * O que este wrapper conserta, e o dano concreto: o `menu.ts` passava
 * `{ date: day, healed: 0 }` FIXO para `rubHeal`. Com o registro sempre zerado,
 * o ramo `daily-cap` de `rubRefusal` NUNCA disparava e o desktop também nunca
 * gravava o gasto de volta no save. Resultado medido em regra: o teto do
 * carinho era POR APARELHO — o jogador curava 1 coração no celular e mais 1 no
 * desktop, todo dia, e o teto de 1/dia do produto simplesmente não existia para
 * quem tem o overlay aberto. `applyRub` lê o registro de `prev.careCaps` e o
 * escreve de volta, que é o conserto do X-6 já pronto no app.
 */
export function remoteRub(remote: RemoteState, now: Date): CareOutcome<RubRefusal> {
  const day = remoteDayKey(remote, now);
  const r = applyRub(remote as unknown as CareCapsState, day);
  if (r.refused) return { next: null, refused: r.refused };
  return { next: r.state as unknown as RemoteState };
}

/**
 * Uma comida aplicada ao save REAL.
 *
 * Mesmo defeito, outro contador: a janela de 1h vinha de `state.feedTimes`, o
 * `localStorage` DO OVERLAY, e voltava para lá — nunca para `careCaps.feedTimes`
 * do save. Era o D-33 ("2 corações/dia e 12 comidas/hora em vez de 1 e 6")
 * intacto no desktop, meses depois de o app tê-lo fechado. `applyFeed` lê e
 * grava a janela no save.
 */
export function remoteFeed(remote: RemoteState, foodEmoji: string, now: number): CareOutcome<FeedRefusal> {
  const f = applyFeed(remote as unknown as CareCapsState, foodEmoji, now);
  if (f.refused) return { next: null, refused: f.refused };
  return { next: f.state as unknown as RemoteState };
}

// ───────────────────────────────────────────── caminho local (sem conta)

/** A fatia do estado do overlay que o carinho local lê e escreve. */
export interface LocalHearts {
  hearts: number;
  maxHearts: number;
  rubHeal?: RubHealRecord;
}

/**
 * Carinho SEM conta sincronizada, aplicado só ao estado do overlay.
 *
 * Continua existindo porque sem conta não há save onde escrever — é o único
 * jeito de o overlay fazer alguma coisa. Mas a CURA agora sai de `rubHeal`, a
 * regra do app, e não de um `hearts + 0.5` escrito à mão: o passo (`RUB_HEAL_STEP`)
 * e o teto (`RUB_HEAL_DAILY_CAP`, mais o traço Carinhoso) passam a ser os do
 * jogo. A chave do dia é `toDateString()`, o mesmo formato do save, para o
 * registro local poder ser comparado com o remoto sem tradução.
 */
export function localRub(
  local: LocalHearts,
  now: Date,
): { hearts: number; rubHeal: RubHealRecord | undefined; refused?: RubRefusal } {
  const day = playerDayKey(now, undefined);
  // `rubRefusal` e `RUB_HEAL_STEP`, e não `rubHeal`: o overlay sem conta não tem
  // um `CareState` (não há inventário, atributo nem estágio aqui dentro), só
  // corações. Chamar a DECISÃO do app com os números que existem é mais honesto
  // que fabricar um estado falso para caber na assinatura — e mantém o passo, o
  // teto e o traço Carinhoso vindos de lá, que era o que faltava.
  const record = rubHealRecordFor(local.rubHeal ?? null, day);
  const refused = rubRefusal(local.hearts, local.maxHearts, record, day);
  // Na recusa devolve a entrada INTACTA, igual aos updaters do app: quem chama
  // pode atribuir o resultado sem antes olhar o `refused` e nada anda para trás.
  if (refused) return { hearts: local.hearts, rubHeal: local.rubHeal, refused };
  return {
    hearts: Math.min(local.maxHearts, local.hearts + RUB_HEAL_STEP),
    rubHeal: { date: day, healed: record.healed + RUB_HEAL_STEP },
  };
}
