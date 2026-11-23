/**
 * OS BUFFS DO CLÃ (pedido do dono, 10/11/2026; substituem a Loja do clã). Espelho do servidor
 * (`functions/api/_buffsCla.js`): o servidor decide preço, saldo, quem compra e a duração (7 dias desde a compra);
 * o cliente só desenha e aplica, onde a regra é client-side, o EFEITO do buff que o clã tem ativo.
 *
 * Os efeitos moram onde a regra mora (cada um tem UM ponto):
 *   gauge   → `evolutionGauge.ts › aplicarBuffClaGauge` (×1,05 no crédito diário, NUNCA acima do teto diário do estágio)
 *   feira   → servidor (`_feiraLoja.js`: 8% → 12% na chance da Feira de verdade)
 *   drop    → `dungeonBase.ts › rollDungeonHeartDrop` (×1,10 na chance de drop, mantido o teto diário)
 *   energia → `hunger.ts › regenPoints` (+10% na velocidade de regeneração, multiplicando junto do bônus de sono)
 *
 * O app guarda o ÚLTIMO estado de buffs visto (vem da vista da Guilda) para o efeito valer fora da folha; cada buff
 * vence sozinho (`ate`), então um estado velho nunca vale além de 7 dias. Leitura tolerante: lixo vira "sem buff".
 * Sem nada por pessoa: o buff é do clã inteiro.
 */
import { GUILD_MAX_MEMBERS, CASA_BITS_POR_DIA } from './guildRules';
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson, removeLocal } from './safeStorage';
import type { Language } from './i18n';

export const BUFF_IDS = ['gauge', 'feira', 'drop', 'energia'] as const;
export type BuffId = (typeof BUFF_IDS)[number];

export const BUFF_DIAS = 7;
export const BUFF_MS = BUFF_DIAS * 86400000;
/** 90% da doação semanal máxima de um clã cheio: round(0,9 × 12 × 100 × 7) = 7560. */
export const BUFF_PRECO_FRACAO = 0.9;
export const BUFF_PRECO = Math.round(BUFF_PRECO_FRACAO * GUILD_MAX_MEMBERS * CASA_BITS_POR_DIA * BUFF_DIAS);

export const BUFF_GAUGE_MULT = 1.05;
export const BUFF_DROP_MULT = 1.1;
export const BUFF_ENERGIA_PCT = 10;

export interface BuffAtivo { desde: number; ate: number }
export type BuffsAtivos = Partial<Record<BuffId, BuffAtivo>>;

/** Dado não confiável (KV do app ou resposta do servidor): só ids do catálogo com janela válida passam. */
export function sanitizeBuffsAtivos(raw: unknown): BuffsAtivos {
  const out: BuffsAtivos = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of BUFF_IDS) {
    const b = (raw as Record<string, unknown>)[id];
    if (!b || typeof b !== 'object') continue;
    const { desde, ate } = b as Record<string, unknown>;
    if (typeof ate === 'number' && Number.isFinite(ate) && ate > 0) {
      out[id] = { desde: typeof desde === 'number' && Number.isFinite(desde) && desde >= 0 ? desde : Math.max(0, ate - BUFF_MS), ate };
    }
  }
  return out;
}

let cache: BuffsAtivos | null = null;
const lido = (): BuffsAtivos => (cache ??= sanitizeBuffsAtivos(readJson<unknown>(STORAGE_KEYS.CLAN_BUFFS, null)));

/** Lembra os buffs que a vista da Guilda acabou de trazer. */
export function rememberClanBuffs(ativos: BuffsAtivos): void {
  cache = sanitizeBuffsAtivos(ativos);
  writeJson(STORAGE_KEYS.CLAN_BUFFS, cache);
}
/** Saiu do clã (ou não há clã): nenhum buff vale. */
export function clearClanBuffs(): void { cache = {}; removeLocal(STORAGE_KEYS.CLAN_BUFFS); }
/** Só para teste. */
export function resetClanBuffsCache(): void { cache = null; }

/** O buff `id` vale em `nowMs`? */
export function clanBuffActive(id: BuffId, nowMs: number): boolean {
  const b = lido()[id];
  return !!b && nowMs >= b.desde && nowMs < b.ate;
}
export const clanBuffWindow = (id: BuffId): BuffAtivo | undefined => lido()[id];

/** Copy dos Buffs (EN primeiro, PT-BR depois). Sem urgência, sem cobrança, sem nada por pessoa. */
const BUFF_COPY = {
  titulo: ['Clan Buffs', 'Buffs do clã'],
  linha: ['The clan’s Bits become a boost for everyone for {dias} days.', 'Os Bits do clã viram um impulso para todos por {dias} dias.'],
  saldo: ['Clan Bits to use', 'Bits do clã para usar'],
  preco: ['Each Buff', 'Cada Buff'],
  comprar: ['Get for the clan', 'Levar para o clã'],
  renovar: ['Add {dias} more days', 'Mais {dias} dias'],
  ativo: ['Active until {quando}', 'Ativo até {quando}'],
  soAnfitriao: ['The host picks the clan’s Buffs.', 'Quem recebe a roda escolhe os Buffs do clã.'],
  ok: ['The clan has a new Buff.', 'O clã ganhou um Buff.'],
  'gauge.nome': ['Steady growth', 'Crescimento firme'],
  'gauge.desc': ['A little more evolution progress each day.', 'Um pouco mais de progresso de evolução por dia.'],
  'feira.nome': ['Fair luck', 'Sorte de feira'],
  'feira.desc': ['The real Fair is likelier on the Mission’s return.', 'A Feira de verdade aparece mais na volta da Missão.'],
  'drop.nome': ['Lucky finds', 'Achados'],
  'drop.desc': ['Items drop a little more in the dungeon.', 'Os itens caem um pouco mais na masmorra.'],
  'energia.nome': ['Quick rest', 'Descanso rápido'],
  'energia.desc': ['Energy comes back a little faster.', 'A energia volta um pouco mais rápido.'],
} as const;
export type BuffCopyKey = keyof typeof BUFF_COPY;
export const BUFF_COPY_TABLE = BUFF_COPY;
export function buffText(language: Language, key: BuffCopyKey, vars?: Record<string, string | number>): string {
  const [en, pt] = BUFF_COPY[key];
  const base: string = language === 'pt-BR' ? pt : en;
  return vars ? base.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? '')) : base;
}
