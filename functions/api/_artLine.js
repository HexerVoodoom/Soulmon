// A LINHA DE ARTE pública de um perfil (D-60, 19/10/2026): só um id de lista FECHADA — sem dado pessoal.
// Existe para o cliente desenhar o oponente com a arte DELE (starter, linha ou o corvinho) e não com a
// árvore genérica descartada. Paridade com `src/utils/sprites.ts` (`DEMO_CHARACTER_IDS` + linhas da masmorra)
// e `corvoPet.ts` travada em `src/utils/artLine.test.ts`.
export const ART_LINE_IDS = new Set([
  'industrial', 'nascente', 'alento', 'vida', 'meteoro',
  'kaelen', 'orrin', 'thalindra', 'igni', 'nautilu', 'astrase',
  // Linhas APOSENTADAS (20/10/2026): aceitas só na LEITURA (perfil/save antigo); o servidor nunca as produz.
  'ignar', 'lumel', 'serah',
  'corvo',
]);

/** Id de linha de arte da lista fechada ou `null`. */
export function artLineOrNull(raw) {
  return typeof raw === 'string' && ART_LINE_IDS.has(raw) ? raw : null;
}
