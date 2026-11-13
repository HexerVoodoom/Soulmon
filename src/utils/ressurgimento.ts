import type { CatalogItem } from '../types/activityCatalog';
import { localDayKey, parseLocalDay, type Purpose } from './purpose';

/**
 * O CAMINHO RESSURGIMENTO: as SUGESTÕES de tarefas (12/11/2026, `docs/design/RESSURGIMENTO-PESQUISA.md`, PLANO §2b).
 *
 * A carta SÓ orienta a escolha das tarefas: sequência, corações, revisões e falas são os mesmos dos outros caminhos (decisão do dono).
 * Aqui mora a lista-base de 22 cuidados (12 ids que já existiam no catálogo + os 10 `ressurg-*` de `data/ressurgimentoCatalog.ts`),
 * a ENTRADA GRADUAL (3-4 itens de 2 minutos nas semanas 1-2; depois mais alguns por vez, só quando a pessoa pede; teto de 7 ativos)
 * e o cartão da rede de apoio (convite, nunca tarefa; silencia depois de 2 dispensas).
 * Cancelado pelo dono: o convite automático de 6 semanas para subir de caminho e as revisões "versão leve".
 */

/** Teto de itens ativos sugerido no Ressurgimento (a pesquisa pede 6-7). */
export const RESSURG_ACTIVE_CAP = 7;
/** Quantos itens entram por vez depois do conjunto inicial. */
export const RESSURG_STEP = 2;
/** Dispensas do cartão da rede de apoio até silenciar. */
export const SUPPORT_CARD_MAX_DISMISSALS = 2;

/** Fases (semana em que o grupo pode ser sugerido). A ordem dentro do grupo é a da pesquisa (§2). */
export const RESSURG_PHASES: ReadonlyArray<{ fromWeek: number; ids: readonly string[] }> = [
  // semanas 1-2: 3-4 itens diários de 2 minutos
  { fromWeek: 0, ids: ['corpo-beber-agua', 'ressurg-comer-algo', 'ressurg-luz-do-dia', 'ressurg-dentes'] },
  // semanas 3-4
  { fromWeek: 2, ids: ['ressurg-cama', 'relacoes-mensagem', 'ressurg-banho'] },
  // semanas 5-6
  { fromWeek: 4, ids: ['ressurg-ar-livre', 'ressurg-trocar-roupa', 'mente-ativacao-comportamental'] },
  // a partir da semana 4: os semanais, nunca no primeiro conjunto
  { fromWeek: 3, ids: ['ressurg-aparencia', 'ressurg-lixo', 'casa-arrumar-10min', 'relacoes-tempo-com-alguem'] },
  // o resto, um por vez e só se a pessoa pediu
  { fromWeek: 6, ids: ['corpo-caminhar', 'sono-preparar-quarto', 'corpo-alongar', 'mente-respiracao', 'mente-autocompaixao', 'proposito-planejar-dia', 'ressurg-rede-apoio'] },
];

/** Os 22 ids da lista-base, sem repetir. */
export const RESSURG_BASE_IDS: readonly string[] = [...new Set(RESSURG_PHASES.flatMap(p => p.ids))];

/** Itens de TCC NUNCA entram (V1): rede de segurança contra edição futura da lista. */
const VETADOS = new Set(['mente-registro-pensamentos', 'mente-exposicao-leve']);

const byId = (catalog: readonly CatalogItem[]) => new Map(catalog.map(i => [i.id, i]));

/** Semanas inteiras desde que o caminho foi escolhido (0 se não sabemos). */
export function weeksOnPath(p: Purpose | undefined, today: Date): number {
  const d = p?.pathAt ? parseLocalDay(p.pathAt) : null;
  if (!d) return 0;
  const days = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - d.getTime()) / 86_400_000);
  return Math.max(0, Math.floor(days / 7));
}

/** O conjunto INICIAL (semanas 1-2): 4 itens diários de 2 minutos, em ordem. */
export function ressurgInitialSet(catalog: readonly CatalogItem[]): CatalogItem[] {
  const m = byId(catalog);
  return RESSURG_PHASES[0].ids.map(id => m.get(id)).filter((i): i is CatalogItem => !!i && !VETADOS.has(i.id));
}

/**
 * O que sugerir DEPOIS: itens da lista-base ainda não ativos, cujo grupo já chegou (por semana), no máximo `RESSURG_STEP`
 * por vez e respeitando o teto de ativos. Só entra mais quando a pessoa pede ("quero mais"): quem chama decide quando perguntar.
 */
export function ressurgNextSuggestions(
  catalog: readonly CatalogItem[],
  activeCatalogIds: ReadonlySet<string> | readonly string[],
  weeks: number,
): CatalogItem[] {
  const active = new Set(activeCatalogIds);
  const room = RESSURG_ACTIVE_CAP - [...active].filter(id => RESSURG_BASE_IDS.includes(id)).length;
  if (room <= 0) return [];
  const m = byId(catalog);
  const out: CatalogItem[] = [];
  const phases = [...RESSURG_PHASES].filter(p => p.fromWeek <= weeks).sort((a, b) => a.fromWeek - b.fromWeek);
  for (const ph of phases) {
    for (const id of ph.ids) {
      const it = m.get(id);
      if (!it || active.has(id) || VETADOS.has(id) || out.some(o => o.id === id)) continue;
      out.push(it);
      if (out.length >= Math.min(RESSURG_STEP, room)) return out;
    }
  }
  return out;
}

/** O cartão "Quer pensar em alguém para quem mandar um oi?": do 3º semana em diante, só em Ressurgimento, some após 2 dispensas. */
export function showSupportCard(p: Purpose | undefined, today: Date): boolean {
  if (p?.path !== 'ressurgimento') return false;
  if ((p.supportDismissed ?? 0) >= SUPPORT_CARD_MAX_DISMISSALS) return false;
  return weeksOnPath(p, today) >= 2;
}

export function dismissSupportCard(p: Purpose | undefined): Purpose | undefined {
  return p ? { ...p, supportDismissed: Math.min(SUPPORT_CARD_MAX_DISMISSALS, (p.supportDismissed ?? 0) + 1) } : p;
}

/** Textos (PT/EN). Vetos da pesquisa §3: sem rótulo clínico, sem promessa, sem culpa, sem pressão de rede. */
export const RESSURG_COPY = {
  supportCard: { pt: 'Quer pensar em alguém para quem mandar um oi?', en: 'Want to think of someone to send a hi to?' },
  supportYes: { pt: 'Pode ser', en: 'Maybe' },
  supportNo: { pt: 'Agora não', en: 'Not now' },
  supportToast: { pt: 'Um oi já conta. Você não precisa explicar tudo.', en: 'A hi already counts. You do not need to explain everything.' },
  supportPro: { pt: 'Se fizer sentido, também dá para falar com um profissional (UBS, CAPS, psicólogo).', en: 'If it makes sense, you can also talk to a professional (a clinic, a counselor).' },
  footer: { pt: 'Se estiver difícil demais, o CVV atende 24 h, de graça, no 188.', en: 'If it is too hard right now, a crisis line is open any time: findahelpline.com lists the one for your country.' },
  more: { pt: 'Quero mais', en: 'I want more' },
  suggestTitle: { pt: 'Vamos devagar', en: 'Let us go slowly' },
  suggestHint: { pt: 'Só o pequeno já vale. Fique com o que fizer sentido para você.', en: 'Just the small version counts. Keep what makes sense for you.' },
} satisfies Record<string, { pt: string; en: string }>;

export const todayKey = (d = new Date()): string => localDayKey(d);
