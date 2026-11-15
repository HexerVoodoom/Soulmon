/**
 * 🔓 Elemento da forma nova é desbloqueado SOZINHO na evolução (15/11/2026, dono: "se o Soulmon evolui para um elemento composto ou
 * qualquer elemento que seja, esse elemento tem que ser desbloqueado. Automaticamente").
 *
 * A porta única do desbloqueio de elemento continua sendo `applyElementsDefeated` (`elementDex.ts`, lista `defeatedElements`): esta
 * função só decide QUAL id passa por ela, o elemento efetivo do Soulmon (`petElementOf`, o leitor único). Mesma regra do dex: um
 * composto libera SÓ o composto (as bases componentes seguem pelo próprio caminho: vencer, essência). Idempotente: elemento já
 * desbloqueado, 'neutro' (corvinho) ou desconhecido devolvem o MESMO objeto. Sem campo novo no save, sem espelho no servidor
 * (`defeatedElements` já é sanitizado lá).
 */
import { applyElementsDefeated, isLibraryElement } from './elementDex';
import { petElementOf } from './starterElements';

export function applyElementUnlockOnEvolve<T extends Parameters<typeof petElementOf>[0] & { defeatedElements?: string[] }>(s: T): T {
  const id = petElementOf(s);
  return isLibraryElement(id) ? applyElementsDefeated(s, [id]) : s;
}
