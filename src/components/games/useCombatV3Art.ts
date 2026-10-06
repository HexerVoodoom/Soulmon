import { useEffect, useState } from 'react';
import { combatV3ArtNow, loadCombatV3Art } from '../../utils/combatV3Art';

/**
 * As URLs das peças pedidas, assim que carregam (PR11). Enquanto a imagem não chega — ou se ela não existe —
 * o valor é `undefined` e o chamador desenha o fallback em CSS. Pede só o que está na lista, uma vez cada.
 */
export function useCombatV3Art(ids: readonly (string | null | undefined)[]): Record<string, string | undefined> {
  const key = ids.filter(Boolean).join('|');
  const [, bump] = useState(0);
  useEffect(() => {
    let live = true;
    const want = key ? key.split('|') : [];
    for (const id of want) {
      if (combatV3ArtNow(id) !== undefined) continue;
      void loadCombatV3Art(id).then((url) => { if (live && url) bump((n) => n + 1); });
    }
    return () => { live = false; };
  }, [key]);
  const out: Record<string, string | undefined> = {};
  for (const id of key ? key.split('|') : []) out[id] = combatV3ArtNow(id);
  return out;
}
