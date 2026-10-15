/**
 * Regras de ENTRADA do tour de boas-vindas e do tutorial do mapa — puras e SEM copy.
 * Separadas de `welcomeTour.ts` (14/10/2026, corte do `index.js`) para o chunk de entrada
 * não carregar a copy dos prédios. Contrato: `src/deploy/entradaEnxuta.contract.test.ts`.
 */

/**
 * Entrada: nunca visto neste aparelho E ainda sem nenhuma conclusão no save.
 * Quem já joga não é interrompido por um tour de boas-vindas — o replay existe
 * em Configurações. `shown` é a flag local (`STORAGE_KEYS.WELCOME_TOUR_SHOWN`).
 */
export function needsWelcomeTour(p: { shown: boolean; jaConcluiuAlgo: boolean }): boolean {
  return !p.shown && !p.jaConcluiuAlgo;
}

/**
 * Valor de `mapTutorialSeen` para um save lido (migração segura, 14/10/2026):
 *  · boolean gravado → respeita;
 *  · ausente + o tour de boas-vindas já visto, ou save com progresso (atividade/tarefa/conclusão/dia completo) → `true`
 *    (quem já joga, ou já passou pelo tour antigo — que explicava o mapa — não é interrompido);
 *  · ausente + save sem progresso → `false` (jogador novo: abre na 1ª abertura do Mapa).
 * O erro seguro é NÃO apresentar de novo.
 */
export function sanitizeMapTutorialSeen(raw: unknown, save: Record<string, any> | null | undefined, welcomeTourShown = false): boolean {
  if (typeof raw === 'boolean') return raw;
  if (welcomeTourShown) return true;
  const s = save ?? {};
  const len = (x: unknown) => (Array.isArray(x) ? x.length : 0);
  return len(s.activities) > 0 || len(s.tasks) > 0 || len(s.completedTasks) > 0 || len(s.activityLog) > 0
    || (typeof s.perfectDays === 'number' && s.perfectDays > 0);
}

/** O tutorial do mapa abre com o Mapa na tela, ainda não visto e sem o tour de boas-vindas na frente. */
export function needsMapTutorial(p: { seen: boolean | undefined; onMap: boolean; welcomeTourOpen: boolean }): boolean {
  return p.seen === false && p.onMap && !p.welcomeTourOpen;
}
