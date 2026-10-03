/**
 * O CONVITE DO SONO (G8, navegação do dono 01/10/2026).
 *
 * Sono automático e Janela de Descanso moravam só nas Configurações, onde
 * quase ninguém chega no começo. O dono pediu um modal que os explica e deixa
 * configurar ALI, na PRIMEIRA abertura do SEGUNDO dia de uso — de manhã,
 * quando a noite anterior é assunto. Se a primeira abertura do 2º dia for
 * depois do meio-dia, mostra assim mesmo (o pedido é a abertura, não a hora).
 *
 * Por que o 2º dia e não o 1º: no dia 1 a pessoa ainda está conhecendo o
 * bicho; perguntar de sono antes de existir uma noite é planejamento no vazio.
 * Por que "2º dia de USO" e não "dia 2 do calendário": quem só volta no dia 5
 * vê o convite no dia 5 — a regra é "primeira abertura depois do dia do
 * nascimento". Uma vez só, com flag persistida (`STORAGE_KEYS.REST_SETUP_SHOWN`).
 *
 * Função PURA: o dia de hoje e o nascimento entram por parâmetro.
 */
import { daysTogether } from './anniversary';

/** O dia de uso em que o convite aparece (1 = o dia do nascimento). */
export const REST_SETUP_DAY = 2;

/** "Manhã" para efeito de texto (o convite aparece de qualquer jeito). */
export const REST_SETUP_MORNING_END_HOUR = 12;

export interface RestSetupInput {
  /** O convite já apareceu neste aparelho. */
  shown: boolean;
  /** `gameState.bornAt` (YYYY-MM-DD). Ausente → cai em `firstOpenKey`. */
  bornAt: string | undefined;
  /** Dia (YYYY-MM-DD) da PRIMEIRA abertura neste aparelho. Rede de segurança
   *  para saves sem `bornAt` (o upgrade e a conta restaurada não o preenchem —
   *  decisão D17, `App.tsx`), que antes nunca viam o convite (auditoria
   *  02/10/2026). Sem os dois, não mostra. */
  firstOpenKey?: string | undefined;
  /** Dia do JOGADOR de hoje (`playerDayKey`). */
  todayKey: string;
}

export function shouldShowRestSetup({ shown, bornAt, firstOpenKey, todayKey }: RestSetupInput): boolean {
  if (shown) return false;
  const day = daysTogether(bornAt ?? firstOpenKey, todayKey);
  if (day === null) return false;
  return day >= REST_SETUP_DAY;
}

/** É manhã? Só muda o "bom dia" do texto, nunca se o convite aparece. */
export function isMorning(now: Date): boolean {
  return now.getHours() < REST_SETUP_MORNING_END_HOUR;
}
