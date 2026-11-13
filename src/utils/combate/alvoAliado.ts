/**
 * ALVO ALIADO (§327, dono 13/11/2026): numa luta com aliados, o especial que normalmente vai em quem o solta (escudo, cura,
 * cura contínua, reforço de ataque e de velocidade) pode ir num ALIADO tocado. Regra pura, sem cena:
 *  · só as famílias pessoais (`ALLY_TARGET_FAMILIES`) aceitam aliado; as ofensivas seguem no alvo inimigo;
 *  · sem aliado escolhido (ou o escolhido caiu), o especial vai em quem o soltou, como sempre;
 *  · tocar um aliado apaga a mira no inimigo para aquela ação, e tocar um inimigo apaga a do aliado (uma mira por vez).
 * `aplicarEspecialPessoal` é o efeito em si, o MESMO que `group.ts` aplica no próprio lançador: quem recebe é parâmetro.
 */
import { escolherAlvo, tocarAlvo } from './alvo';
import { SPECIAL_BUDGET_HITS, type Special, type SpecialFamily } from './specials';

const VIVO_EPS = 1e-9;

/** As famílias que vão em quem as solta (e, com aliado tocado, nele). A cura contínua (`effect: 'hot'`) é `shield` no núcleo. */
export const ALLY_TARGET_FAMILIES: readonly SpecialFamily[] = ['heal', 'shield', 'atkBuff', 'spdBuff'];

export function aceitaAliado(family: SpecialFamily | null | undefined): boolean {
  return !!family && ALLY_TARGET_FAMILIES.includes(family);
}

/** A mira do jogador: no máximo UMA das duas fica ligada. `null` = a regra automática daquele lado. */
export interface Mira {
  readonly inimigo: number | null;
  readonly aliado: number | null;
}
export const MIRA_VAZIA: Mira = { inimigo: null, aliado: null };

const vivo = (hp: readonly number[], i: number) => Number.isInteger(i) && i >= 0 && i < hp.length && hp[i] > VIVO_EPS;

/**
 * Toque num aliado. Só liga a mira de aliado quando o especial do jogador aceita aliado e o aliado está vivo; aí a mira no
 * inimigo apaga. Tocar de novo no mesmo aliado desliga (o especial volta para si mesmo). Fora disso, a mira fica como estava.
 */
export function tocarAliado(m: Mira, aliadosHp: readonly number[], tocado: number, family: SpecialFamily | null | undefined): Mira {
  if (!aceitaAliado(family) || !vivo(aliadosHp, tocado)) return m;
  if (m.aliado === tocado) return { ...m, aliado: null };
  return { inimigo: null, aliado: tocado };
}

/**
 * Toque num inimigo vivo: a mira de aliado apaga (a ação volta a ser contra o inimigo) e a escolha do inimigo segue a regra
 * de sempre (`tocarAlvo`: só troca com 2+ inimigos). Toque num inimigo caído ou inválido não muda nada.
 */
export function tocarInimigo(m: Mira, inimigosHp: readonly number[], tocado: number): Mira {
  if (!vivo(inimigosHp, tocado)) return m;
  return { inimigo: tocarAlvo(inimigosHp, m.inimigo, tocado), aliado: null };
}

/** Quem recebe o especial pessoal: o índice do aliado mirado (vivo e família aceita) ou `null` = o próprio lançador. */
export function receptorPessoal(family: SpecialFamily | null | undefined, aliadosHp: readonly number[], aliado: number | null): number | null {
  return aceitaAliado(family) && aliado != null && vivo(aliadosHp, aliado) ? aliado : null;
}

/** O inimigo que a ação mira (a regra de `alvo.ts`). */
export function inimigoMirado(inimigosHp: readonly number[], m: Mira): number {
  return escolherAlvo(inimigosHp, m.inimigo);
}

/** O que um especial pessoal toca em quem o recebe (a mesma forma do lutador de `group.ts`; pontos inteiros). */
export interface ReceptorPessoal {
  readonly pts: number;
  hp: number;
  shield: number;
  nAtk: number;
  nSpd: number;
  next: number;
}

/**
 * Aplica `heal`/`shield`/`atkBuff`/`spdBuff` em `rx` (o lançador OU o aliado mirado). `hitsOnRx` = golpes que o inimigo
 * precisa para derrubar `rx` (cura e escudo valem `E` desses golpes, como sempre); `scale` = o multiplicador do cast;
 * `t0`/`iv` = instante do cast e intervalo de quem RECEBE (o reforço de velocidade adianta o próximo golpe dele).
 * Família que não é pessoal devolve `false` e não muda nada.
 */
export function aplicarEspecialPessoal(
  rx: ReceptorPessoal, sp: Pick<Special, 'family' | 'power'>, scale: number, hitsOnRx: number, t0: number, iv: number,
): boolean {
  const E = SPECIAL_BUDGET_HITS * sp.power * scale;
  switch (sp.family) {
    case 'heal':
      rx.hp = Math.min(rx.pts, Math.round(rx.hp * rx.pts) + Math.round((E / hitsOnRx) * rx.pts)) / rx.pts;
      return true;
    case 'shield':
      rx.shield = (Math.round(rx.shield * rx.pts) + Math.round((E / hitsOnRx) * rx.pts)) / rx.pts;
      return true;
    case 'atkBuff':
      rx.nAtk += E;
      return true;
    case 'spdBuff':
      rx.nSpd += E;
      rx.next = Math.min(rx.next, t0 + iv / 2);
      return true;
    default:
      return false;
  }
}
