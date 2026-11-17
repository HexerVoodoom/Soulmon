/**
 * INÍCIO BB (dono, 17/11/2026; REGISTRO §472). Dono único das regras do começo novo:
 *
 *  · Todo save NOVO nasce BB (`bbStage.initialStageForNewSave`). Pago (ou BETA_EMAILS) = BB EXCLUSIVO gerado
 *    (`bbNascimento.gerarBBExclusivo`, D31), com o pool de reserva; quem recusa assinar = BB do POOL (D30) e um
 *    inicial pronto (`StarterId`) como rookie.
 *  · O onboarding termina numa tela "pronto em breve" e o jogo abre NA HORA, com o Soulmon no cristal. Quando o BB fica
 *    pronto, a Home abre o CHOCAR em tela cheia (`components/ChocarBB.tsx`); a apresentação só aparece com a arte carregada.
 *  · O "ainda vai chocar" é POR APARELHO (`STORAGE_KEYS.BB_NASCIMENTO`), sem campo novo no save: outro aparelho já vê o BB.
 *  · BB → rookie é grátis para todos; rookie → champion pede conta paga (D8, `evolutionPaywall.ts`), também para o inicial
 *    que nasceu BB. A marca de "nasceu BB" é o próprio save (`unlockedEvolutions` contém `'bb'`), sem campo novo.
 */
import { isBBStage, BB_STAGE } from './bbStage';
import { evolutionPaywalled } from './evolutionPaywall';
import { isStarterId, STARTER_IDS, type StarterId } from './sprites';
import { STARTER_ELEMENT } from './starterElements';
import { readJson, removeLocal, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** O save nasceu BB? Saves de antes do Início BB nunca têm `'bb'` em `unlockedEvolutions`. */
export function nasceuBB(s: { unlockedEvolutions?: readonly string[] | null; evolutionStage?: unknown }): boolean {
  return isBBStage(s.evolutionStage) || (s.unlockedEvolutions ?? []).includes(BB_STAGE);
}

/**
 * D8 para quem nasceu BB (ou com o interruptor do Velado): grátis evolui BB → rookie; do rookie em diante pede conta paga.
 * Quem NÃO nasceu BB e não tem o interruptor fica como sempre (nunca travado por aqui).
 */
export function evolucaoPaga(veladoOn: boolean, s: { accountTier?: 'demo' | 'paid'; evolutionStage: string; unlockedEvolutions?: readonly string[] | null }): boolean {
  return evolutionPaywalled({ velado: veladoOn || nasceuBB(s), accountTier: s.accountTier, evolutionStage: s.evolutionStage });
}

/** Os 5 iniciais não evoluem (um sprite só, 14/10/2026), EXCETO o BB que vai virar o inicial (BB → rookie). */
export function inicialNaoEvolui(demoCharacterId: unknown, stage: unknown): boolean {
  return isStarterId(demoCharacterId) && !isBBStage(stage);
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** O inicial que o BB grátis vira no rookie: determinístico pela semente (e-mail/nome), para a mesma conta cair no mesmo. */
export function inicialDoBB(semente: string): StarterId {
  return STARTER_IDS[hash32(`inicio-bb:${semente}`) % STARTER_IDS.length];
}

/** O elemento do inicial, que filtra o sorteio do BB do pool (o BB tem o elemento do rookie que ele vai virar). */
export function elementoDoInicial(id: StarterId): string {
  return STARTER_ELEMENT[id];
}

export interface BBNascimento {
  /** Entrou pagando (compra confirmada pelo servidor ou BETA_EMAILS): pede o BB exclusivo. */
  pago: boolean;
  /** O prompt do estágio bb (`creature.bbPrompts`), só no pago. */
  prompts?: { imagePrompt: string; imagePromptFallback: string };
}

/** Leitura tolerante do marcador (localStorage é dado não confiável). Lixo = `null` (nada a chocar). */
export function sanitizeBBNascimento(raw: unknown): BBNascimento | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const p = r.prompts as Record<string, unknown> | undefined;
  const prompts = p && typeof p.imagePrompt === 'string' && p.imagePrompt
    ? { imagePrompt: p.imagePrompt, imagePromptFallback: typeof p.imagePromptFallback === 'string' ? p.imagePromptFallback : p.imagePrompt }
    : undefined;
  return { pago: r.pago === true, ...(prompts ? { prompts } : {}) };
}

export function lerBBNascimento(): BBNascimento | null {
  return sanitizeBBNascimento(readJson<unknown>(STORAGE_KEYS.BB_NASCIMENTO, null));
}
export function gravarBBNascimento(v: BBNascimento): void {
  writeJson(STORAGE_KEYS.BB_NASCIMENTO, v);
}
export function limparBBNascimento(): void {
  removeLocal(STORAGE_KEYS.BB_NASCIMENTO, { silent: true });
}

/** O Soulmon ainda está no cristal esperando o chocar (com ou sem a arte do BB pronta). */
export function aguardandoChocar(marcador: BBNascimento | null, stage: unknown): boolean {
  return !!marcador && isBBStage(stage);
}

/** A Home abre o chocar em tela cheia: esperando E com a arte do BB já no acervo. */
export function prontoParaChocar(marcador: BBNascimento | null, stage: unknown, spriteBB: string | undefined | null): boolean {
  return aguardandoChocar(marcador, stage) && !!spriteBB;
}
