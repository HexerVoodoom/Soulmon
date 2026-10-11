/**
 * A DEMO LOCAL — dono único do PREDICADO (07/10/2026, pedido do dono).
 *
 * "Sobre a versão demo: ela salva localmente em cache apenas, não ganha XP, não
 * faz compras e não entra em PvP." São QUATRO regras e UM predicado:
 * `isDemoMode(state)`. Todo ponto que decide uma delas lê ESTA função — nenhum
 * ponto compara `demoLocal` à mão, e nenhum inventa um segundo critério (footgun
 * 9: regra copiada diverge em silêncio). Quem trava isso é
 * `src/utils/demoMode.contract.test.ts`, que lista os pontos de fiação e reprova
 * superfície de compra/PvP/nuvem/XP nova sem o predicado.
 *
 * ⚠️ NÃO É `accountTier: 'demo'`. Aquele é o plano GRÁTIS: conta de verdade, com
 * login, nuvem, XP e a compra à mão. A demo local é outra coisa — um save que
 * nunca sai do aparelho, aberto pelo botão DEMO da home, sem login. Os dois
 * convivem: a demo local grava `accountTier: 'demo'` (nunca 'paid') e SÓ ELA
 * grava `demoLocal: true`.
 *
 * Módulo FOLHA (sem imports), porque `bond.ts` e `cloudSave.ts` o importam e um
 * ciclo aqui derrubaria o carregamento dos dois. O que precisa de `bond.ts`
 * (o XP do nível 5) mora em `demoStart.ts`.
 *
 * Tom: a recusa é CURTA e SEM CULPA — "Not available in the demo." Nada de
 * "você não pode", nada de cobrança.
 */

/** O Vínculo FIXO da demo. O nível nunca é gravado: `demoStart.ts` grava o `totalXP` mínimo desse nível. */
export const DEMO_BOND_LEVEL = 5;

/** A fatia do save que o predicado lê. */
export interface DemoCarrier { demoLocal?: boolean }

/** O save é de uma demo local? (`null`/`undefined` → não.) O ÚNICO critério. */
export function isDemoMode(state: DemoCarrier | null | undefined): boolean {
  return !!state && state.demoLocal === true;
}

/**
 * Os prédios do mapa que são SOCIAIS (PvP, ranking, comunidade) e por isso
 * ficam inertes na demo: Arena — Torneio, Duelo e Feira; Hall — Biblioteca,
 * Círculo de Amigos e Salão da Guilda. O toque mostra `demoRefusalText` na
 * faixa de aviso do mapa (o mesmo canal do cadeado do Vínculo). Dono único da
 * lista: `AreaView` a lê daqui, e a régua de fiação confere os dois lados.
 */
export const DEMO_BLOCKED_LOTS: Readonly<Record<string, readonly string[]>> = {
  arena: ['torneio', 'duelo', 'feira'],
  hall: ['biblioteca', 'amigos', 'guilda'],
};

/** Este prédio é bloqueado na demo? */
export function isDemoBlockedLot(area: string, lotId: string): boolean {
  return (DEMO_BLOCKED_LOTS[area] ?? []).includes(lotId);
}

/** A recusa curta e sem culpa, no idioma do jogador (EN primeiro, PT par). */
export function demoRefusalText(isPt: boolean): string {
  return isPt ? 'Não disponível na demo.' : 'Not available in the demo.';
}
