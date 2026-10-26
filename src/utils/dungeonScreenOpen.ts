/**
 * A tela da masmorra (`DungeonGame`) está montada? Store minúsculo (módulo) lido pelo App com `useSyncExternalStore`.
 *
 * Por quê: com a tela montada ELA é a dona da conta da descida (`settleDungeonAwayNow` ao entrar + as lutas ao vivo). O retorno
 * automático da Home (`applyDungeonAway` no timer de fim) NÃO pode disparar ao mesmo tempo — creditaria a mesma descida 2×.
 */
let abertas = 0;
const ouvintes = new Set<() => void>();
const avisa = () => ouvintes.forEach(f => f());

/** Chamado pela `DungeonGame` ao montar; devolve o desfazer (desmontar). */
export function marcarTelaMasmorra(): () => void {
  abertas += 1; avisa();
  let feito = false;
  return () => { if (feito) return; feito = true; abertas = Math.max(0, abertas - 1); avisa(); };
}
export const telaMasmorraAberta = (): boolean => abertas > 0;
export function assinarTelaMasmorra(f: () => void): () => void { ouvintes.add(f); return () => { ouvintes.delete(f); }; }
