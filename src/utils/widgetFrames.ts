import { useSyncExternalStore } from 'react';
import { BASE_ELEMENT_IDS } from './elementDex';
import { elementLabel } from './elementLabels';
import { baseDominanteDoElemento } from './soulProfile/ficha/elementoNome';
import { petElementOf } from './starterElements';
import type { Language } from './i18n';

/**
 * MOLDURAS DO WIDGET V-PET (dono, 04/11/2026) — UMA moldura por elemento BASE (20), mais a moldura padrão (grátis, sempre).
 *
 * Não confundir com `utils/frames.ts` (moldura do AVATAR, Bits/rank). Esta é o casco do widget Android "Soulmon V-Pet".
 *
 * Regras de posse (decisão do dono):
 *  a) vem SOZINHA quando o Soulmon do jogador evolui para um Soulmon daquele elemento (`grantFrameOnEvolution`);
 *  b) qualquer moldura ainda não liberada pode ser COMPRADA com DINHEIRO REAL (produto permanente da Play, id
 *     `moldura_<elemento>`), mesmo antes de evoluir. Comprar sombra e depois evoluir para sombra não reembolsa: ok.
 *
 * Duas fontes de posse, de propósito:
 *  · `GameState.widgetFramesOwned` — as ganhas por evolução (o save do cliente basta: é cosmético puro);
 *  · `ent.frames` no SERVIDOR — as compradas (dinheiro real vive no entitlement, nunca no save do cliente; espelho em
 *    `paidWidgetFrames` abaixo). A posse efetiva é a UNIÃO (`effectiveOwnedFrames`).
 * COSMÉTICA PURA: nenhuma moldura muda luta, ganho, XP, Bits ou evolução (régua em `widgetFrames.test.ts`).
 *
 * ARTE: `android/app/src/main/res/drawable-nodpi/moldura_vpet_<elemento>.png`, 576x384, mesma ABERTURA LCD do casco
 * padrão (`vpet_moldura.png`, ver `WidgetVpet.kt`). Arquivo ausente = o widget cai no casco padrão (nunca quebra).
 */

/** Os 20 elementos base, na ordem do anel/catálogo. */
export const WIDGET_FRAME_ELEMENTS: readonly string[] = BASE_ELEMENT_IDS;

const IDS: ReadonlySet<string> = new Set(WIDGET_FRAME_ELEMENTS);

/** Prefixo do produto no Play Console (e no catálogo do servidor `_billing.js`): `moldura_<elemento>`. */
export const WIDGET_FRAME_PRODUCT_PREFIX = 'moldura_';

export const isWidgetFrameId = (id: unknown): id is string => typeof id === 'string' && IDS.has(id);

export const widgetFrameProductId = (element: string): string => WIDGET_FRAME_PRODUCT_PREFIX + element;

/** Nome do arquivo (sem extensão) do drawable Android da moldura. */
export const widgetFrameDrawableName = (element: string): string => `moldura_vpet_${element}`;

/** Lista de posse vinda do save/servidor: só ids do catálogo, sem repetição, na ordem em que vieram. Lixo vira `[]`. */
export function sanitizeOwnedWidgetFrames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) if (isWidgetFrameId(id) && !out.includes(id)) out.push(id);
  return out;
}

/** A moldura escolhida no save: id do catálogo ou `null` (= padrão). Lixo vira `null`. */
export function sanitizeSelectedWidgetFrame(raw: unknown): string | null {
  return isWidgetFrameId(raw) ? raw : null;
}

/** O elemento BASE do Soulmon: o de combate (`petElementOf`) reduzido à base dominante. `undefined` = sem elemento (neutro/desconhecido). */
export function widgetFrameElementOfPet(state: Parameters<typeof petElementOf>[0]): string | undefined {
  const el = petElementOf(state);
  if (!el || el === 'neutro') return undefined;
  const base = baseDominanteDoElemento(el);
  return isWidgetFrameId(base) ? base : undefined;
}

/**
 * LIBERAÇÃO NA EVOLUÇÃO. Devolve a MESMA referência quando não há nada a somar (sem re-render, sem escrita no save).
 * Só vale para quem JÁ evoluiu (`unlockedEvolutions` > 1): os 5 iniciais não evoluem e não ganham moldura de graça.
 * Idempotente: nunca duplica. Roda sobre o estado ATUAL, então também cobre quem evoluiu antes desta versão.
 */
export function grantFrameOnEvolution(
  state: Parameters<typeof petElementOf>[0] & { unlockedEvolutions?: readonly string[]; widgetFramesOwned?: readonly string[] },
): readonly string[] | undefined {
  const owned = state.widgetFramesOwned;
  if ((state.unlockedEvolutions?.length ?? 0) <= 1) return owned;
  const el = widgetFrameElementOfPet(state);
  if (!el || owned?.includes(el)) return owned;
  return [...(owned ?? []), el];
}

/** União da posse: as do save (evolução) + as compradas (servidor). Sem repetição. */
export function effectiveOwnedFrames(saveOwned: readonly string[] | undefined, paid: readonly string[] | undefined): string[] {
  return sanitizeOwnedWidgetFrames([...(saveOwned ?? []), ...(paid ?? [])]);
}

/**
 * O que vai para o widget: o id escolhido SE o jogador ainda o possui; senão `''` (= casco padrão).
 * É o que faz um reembolso (que tira a posse do servidor) devolver o widget ao padrão sem mexer no save.
 */
export function resolveWidgetFrame(selected: unknown, owned: readonly string[]): string {
  return isWidgetFrameId(selected) && owned.includes(selected) ? selected : '';
}

export type WidgetFrameStatus = 'selected' | 'owned' | 'locked';

export interface WidgetFrameRow {
  id: string;
  /** Nome do elemento, no idioma. */
  element: string;
  status: WidgetFrameStatus;
  productId: string;
}

/** As linhas do seletor (padrão fica de fora: é a primeira opção, sempre livre). */
export function widgetFrameRows(owned: readonly string[], selected: string, language: Language): WidgetFrameRow[] {
  const isPt = language === 'pt-BR';
  return WIDGET_FRAME_ELEMENTS.map(id => ({
    id,
    element: elementLabel(id, isPt),
    status: selected === id ? 'selected' : owned.includes(id) ? 'owned' : 'locked',
    productId: widgetFrameProductId(id),
  }));
}

/** Como destravar, na linha trancada. */
export function widgetFrameUnlockHint(element: string, language: Language): string {
  const isPt = language === 'pt-BR';
  const nome = elementLabel(element, isPt);
  return isPt
    ? `Vem sozinha quando seu Soulmon evoluir para ${nome}, ou compre agora.`
    : `Comes free when your Soulmon evolves into ${nome}, or buy it now.`;
}

// ── Espelho das molduras COMPRADAS (vem do servidor; fora do save, como a assinatura) ─────────────────────────────
let paidFrames: readonly string[] = [];
const listeners = new Set<() => void>();

export function getPaidWidgetFrames(): readonly string[] { return paidFrames; }

/** Aplica a resposta do servidor. `null` (offline) mantém o último estado conhecido; o servidor é quem manda. */
export function setPaidWidgetFramesFromEntitlement(ent: object | null): void {
  if (!ent) return;
  const next = sanitizeOwnedWidgetFrames((ent as { frames?: unknown }).frames);
  if (next.length === paidFrames.length && next.every((id, i) => id === paidFrames[i])) return;
  paidFrames = next;
  listeners.forEach(l => l());
}

/** Logout: a posse paga é da conta que saiu. Só para testes/sessão. */
export function clearPaidWidgetFrames(): void {
  paidFrames = [];
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export function usePaidWidgetFrames(): readonly string[] {
  return useSyncExternalStore(subscribe, getPaidWidgetFrames, getPaidWidgetFrames);
}

// ── Prévia no app (opcional): `src/assets/soulmon/widget-molduras/<elemento>.png|webp`; ausente = sem prévia ──────
const PREVIEW_FILES = import.meta.glob<string>('../assets/soulmon/widget-molduras/*.{png,webp}', { eager: true, import: 'default' });
const PREVIEWS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(PREVIEW_FILES).flatMap(([path, url]) => {
    const m = /\/([a-z_]+)\.(?:png|webp)$/.exec(path);
    return m && isWidgetFrameId(m[1]) ? [[m[1], url]] : [];
  }),
);

export function widgetFramePreview(element: string): string | undefined {
  return PREVIEWS[element];
}

/** O que o seletor (components/WidgetFramePicker.tsx) recebe do App: posse efetiva, escolha atual (ja reconferida) e as acoes. */
export interface WidgetFramePickerData {
  owned: readonly string[];
  /** Id do elemento da moldura em uso, ou '' = a padrao. */
  selected: string;
  /** null = a padrao. */
  onSelect: (id: string | null) => void;
  /** Compra com dinheiro real. ok:true so depois do servidor confirmar na Play. */
  onBuy: (element: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
}
