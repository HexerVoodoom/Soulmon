/**
 * COMPANHEIRO INVOCADO no combate v3 (PR 2, 16/11/2026) — a regra pura, sem estado, que `fight.ts` e `group.ts` aplicam no
 * `cast` de quem INVOCA (`FightSide.invoca`). Espelho em `functions/api/_combate.js` (`planoInvocacao`), travado por
 * `functions/api/combate.parity.test.js`: mudou uma constante ou a regra de um lado, mude os dois.
 *
 * REGRA DO DONO (16/11/2026): quando um evocador solta o ESPECIAL, o companheiro (uma das 32 criaturas) fica em cena por
 * `COMPANHEIRO_TURNOS` turnos e cumpre uma FUNÇÃO MISTA:
 *  · especial de ATAQUE (`direct`, `dot`): o companheiro ataca nos 3 turnos, "como um DoT normal", sem outro efeito. É o DoT de
 *    sempre (mesma duração, mesmo orçamento `E`, mesmos ticks no turno de quem apanha, mesmo escudo e `dotResist`); no `direct`
 *    o dano é o MESMO total `E`, só que entregue em 3 golpes do companheiro em vez de 1 golpe imediato;
 *  · especial de EFEITO (`atkBuff`, `spdBuff`, `defDebuff`, `shield` sem cura contínua): no turno da invocação o companheiro
 *    EXECUTA o especial do jogador (o mesmo efeito da família, só `COMPANHEIRO_EFEITO_FATOR` do tamanho normal) e nos DOIS
 *    turnos seguintes ATACA (`COMPANHEIRO_ATAQUE_FATOR` de um tick de DoT do mesmo orçamento);
 *  · especial de CURA (`heal`, ou `shield` com `effect: 'hot'`): NÃO invoca. Decisão do dono ("tira função de cura de evocação em
 *    tudo"): o especial roda normal, sem companheiro e sem cena. Não existe papel de cura própria do companheiro.
 *
 * CALIBRAÇÃO. Unidade do ataque = um tick de DoT do orçamento BASE (`SPECIAL_BUDGET_HITS · escala / DOT_TICKS`, sem o `power` da
 *  família: o `power` de `spdBuff` é 2 e inflaria o ataque; medido: +20pp de vitória). Medido em 1v1 (teste): vitória invocada − normal entre −7 e +6pp por família/nível. Valor da versão invocada sobre a normal:
 *    `EFEITO_FATOR + ATAQUE_FATOR · (turnos de ataque / 3) / power` = 0,80 + 0,17 / power = ~0,97 (atkBuff/defDebuff/shield) e 0,88
 *  (spdBuff); o especial de ataque (`direct`/`dot`) vale 1,00 por construção. Teto declarado do dono: ~110% (`COMPANHEIRO_VALOR_MAXIMO`).
 *  Os fatores são CONSERVADORES: o efeito é "um pouco menor" (80%) e o ataque do companheiro fica bem abaixo de um tick (25%).
 *  A prova por simulação (vitória da versão invocada contra a normal, mesmas sementes, 1v1 e grupo) está em `companheiro.test.ts`.
 * Nada pago dá vantagem de combate: a regra não lê nenhum dado de compra.
 */
import { SPECIAL_BUDGET_HITS, type Special } from './specials';

/** Turnos em cena (o de invocação conta como o 1º). Igual a `DOT_TICKS` de `fight.ts` (o teste trava). */
export const COMPANHEIRO_TURNOS = 3;
/** O efeito do especial executado no turno da invocação vale esta fração do normal ("um pouco menor"). */
export const COMPANHEIRO_EFEITO_FATOR = 0.8;
/** O ataque do companheiro (nos turnos de ataque da função mista) vale esta fração de um tick de DoT do mesmo orçamento ("mais baixo que um tick"). */
export const COMPANHEIRO_ATAQUE_FATOR = 0.25;
/** Teto de valor da versão invocada sobre a normal (decisão do dono, ~110%); o teste confere o valor nominal e a simulação. */
export const COMPANHEIRO_VALOR_MAXIMO = 1.1;

export type PapelInvocacao = 'ataque' | 'misto';

/** O que a invocação faz em um `cast`: o efeito (escala 0 = nenhum) e o ataque do companheiro (orçamento total e turnos). */
export interface PlanoInvocacao {
  readonly papel: PapelInvocacao;
  /** Multiplicador do `cast` do efeito normal da família; 0 = nenhum efeito (especial de ataque). */
  readonly escalaEfeito: number;
  /** Orçamento `E` do DoT do companheiro (cada tick vale `ataqueE / COMPANHEIRO_TURNOS`). */
  readonly ataqueE: number;
  /** Quantos ticks o companheiro dá (3 num especial de ataque; 2 na função mista, o 1º turno é o do efeito). */
  readonly turnosAtaque: number;
}

/** A invocação se aplica a este especial? Cura (`heal`, ou `shield` com cura contínua) nunca invoca. */
export function especialInvoca(sp: Pick<Special, 'family' | 'effect'> | null | undefined): boolean {
  if (!sp) return false;
  if (sp.family === 'heal') return false;
  if (sp.family === 'shield' && sp.effect === 'hot') return false;
  return true;
}

/** O plano de uma invocação, ou `null` quando o especial não invoca (cura) — o especial roda normal. */
export function planoInvocacao(sp: Pick<Special, 'family' | 'effect' | 'power'> | null | undefined, scale: number): PlanoInvocacao | null {
  if (!sp || !especialInvoca(sp)) return null;
  const E = SPECIAL_BUDGET_HITS * sp.power * scale;
  if (sp.family === 'direct' || sp.family === 'dot') {
    return { papel: 'ataque', escalaEfeito: 0, ataqueE: E, turnosAtaque: COMPANHEIRO_TURNOS };
  }
  return { papel: 'misto', escalaEfeito: scale * COMPANHEIRO_EFEITO_FATOR, ataqueE: SPECIAL_BUDGET_HITS * scale * COMPANHEIRO_ATAQUE_FATOR, turnosAtaque: COMPANHEIRO_TURNOS - 1 };
}

/** Valor nominal da invocação em frações do especial normal (a conta da calibração acima). */
export function valorNominalInvocacao(sp: Pick<Special, 'family' | 'effect' | 'power'>, scale = 1): number | null {
  const p = planoInvocacao(sp, scale);
  if (!p) return null;
  const E = SPECIAL_BUDGET_HITS * sp.power * scale;
  const efeitoE = SPECIAL_BUDGET_HITS * sp.power * p.escalaEfeito;
  return (efeitoE + (p.ataqueE * p.turnosAtaque) / COMPANHEIRO_TURNOS) / E;
}
