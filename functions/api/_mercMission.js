/**
 * Guilda dos Mercenários (plano do onboarding velado §11): espelho de `sanitizeMercMission`
 * (`src/utils/mercMission.ts`; paridade em `mercMission.parity.test.js`). Só a FORMA: o servidor
 * não tem o catálogo e não concede nada com isto (os pontos de tipo vivem no save do cliente).
 * Nunca recusa o save.
 *
 * Tarefa de UM dia (dono, 06/11/2026): o servidor conhece só o MAPA id -> Ordem das tarefas da Guilda
 * (`src/data/mercTarefas.ts`; paridade em `mercMission.parity.test.js`). Proposta PENDENTE (`done` falso) cuja
 * `activityId` não está no mapa, ou é de outra Ordem (save antigo com id de hábito do catálogo geral, ou
 * adulterado), é descartada; o cliente sorteia outra ao abrir a Guilda. Proposta JÁ cumprida (`done`) fica,
 * porque foi paga e apagá-la não desfaz nada.
 */
export const MERC_ORDENS = ['filtrador', 'tecelao', 'rompente'];

/** @type {Readonly<Record<string, string>>} id da tarefa -> Ordem. */
export const MERC_TAREFA_ORDEM = Object.freeze({
  'r-foco': 'rompente',
  'r-adiado': 'rompente',
  'r-novo': 'rompente',
  'r-volta': 'rompente',
  'r-meta': 'rompente',
  'r-serie': 'rompente',
  'r-tres': 'rompente',
  'r-paginas': 'rompente',
  'r-mensagem-pesada': 'rompente',
  'r-fora': 'rompente',
  'r-sem-tela': 'rompente',
  'r-plano': 'rompente',
  't-gaveta': 'tecelao',
  't-pausa': 'tecelao',
  't-planta': 'tecelao',
  't-musica': 'tecelao',
  't-refeicao': 'tecelao',
  't-rabisco': 'tecelao',
  't-janela': 'tecelao',
  't-mesa': 'tecelao',
  't-linhas': 'tecelao',
  't-caixa': 'tecelao',
  't-foto': 'tecelao',
  't-bebida': 'tecelao',
  'f-mensagem': 'filtrador',
  'f-elogio': 'filtrador',
  'f-favor': 'filtrador',
  'f-ligacao': 'filtrador',
  'f-obrigado': 'filtrador',
  'f-escuta': 'filtrador',
  'f-agrado': 'filtrador',
  'f-doar': 'filtrador',
  'f-convite': 'filtrador',
  'f-cumprimento': 'filtrador',
  'f-bilhete': 'filtrador',
  'f-indicacao': 'filtrador',
});

/** @param {unknown} raw */
export function sanitizeMercMission(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = /** @type {Record<string, unknown>} */ (raw);
  if (typeof r.day !== 'string' || r.day.length === 0 || r.day.length > 40) return undefined;
  if (typeof r.ordem !== 'string' || !MERC_ORDENS.includes(r.ordem)) return undefined;
  if (typeof r.activityId !== 'string' || r.activityId.length === 0 || r.activityId.length > 64) return undefined;
  const done = r.done === true;
  if (!done && !Object.prototype.hasOwnProperty.call(MERC_TAREFA_ORDEM, r.activityId)) return undefined;
  if (!done && MERC_TAREFA_ORDEM[r.activityId] !== r.ordem) return undefined;
  return { day: r.day, ordem: r.ordem, activityId: r.activityId, done };
}
