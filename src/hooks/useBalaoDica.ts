/**
 * A AGENDA DOS BALÕES DE DICA (§333, `utils/balaoDica.ts`).
 *
 *  · `useDicaVistas`: o registro "quando cada dica apareceu" NESTE aparelho (`STORAGE_KEYS.BALAO_DICAS_VISTAS`). Conveniência de UI,
 *    fora do save: no pior caso uma dica repete num aparelho novo.
 *  · `useDicaDourada`: escolhe a dica DOURADA da vez quando nada bloqueia (Home na tela, nenhum balão dourado de evento na vez), grava
 *    a aparição (o cooldown conta dali) e a tira do visor depois de `DICA_DOURADA_VISIVEL_MS`. Sai antes se a condição acabar.
 *    Sem intervalo próprio: reavalia quando o App re-renderiza (troca de tela, energia, fome, resposta do Grove).
 */
import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readJson, writeJson } from '../utils/safeStorage';
import {
  DICA_DOURADA_VISIVEL_MS, escolherDica, marcarVista, sanitizeDicaVistas,
  type DicaDouradaTipo, type DicaTipo, type DicaVistas,
} from '../utils/balaoDica';

export function useDicaVistas(): [DicaVistas, (tipo: DicaTipo) => void] {
  const [vistas, setVistas] = useState<DicaVistas>(() => sanitizeDicaVistas(readJson<unknown>(STORAGE_KEYS.BALAO_DICAS_VISTAS, {})));
  const marcar = useCallback((tipo: DicaTipo) => {
    setVistas(prev => {
      const next = marcarVista(prev, tipo, Date.now());
      writeJson(STORAGE_KEYS.BALAO_DICAS_VISTAS, next, { silent: true });
      return next;
    });
  }, []);
  return [vistas, marcar];
}

export function useDicaDourada({ presentes, vistas, bloqueado, onMostrar }: {
  presentes: Partial<Record<DicaTipo, boolean>>;
  vistas: DicaVistas;
  /** Fora da Home, ou com um balão dourado de evento na vez: nenhuma dica entra (nunca empilha). */
  bloqueado: boolean;
  onMostrar: (tipo: DicaTipo) => void;
}): { ativa: DicaDouradaTipo | null; encerrar: () => void } {
  const [ativa, setAtiva] = useState<DicaDouradaTipo | null>(null);
  const escolhida = bloqueado || ativa ? null : (escolherDica(presentes, vistas, Date.now(), 'dourada') as DicaDouradaTipo | null);
  useEffect(() => {
    if (!escolhida) return;
    setAtiva(escolhida);
    onMostrar(escolhida);
  }, [escolhida, onMostrar]);
  useEffect(() => {
    if (!ativa) return;
    const id = setTimeout(() => setAtiva(null), DICA_DOURADA_VISIVEL_MS);
    return () => clearTimeout(id);
  }, [ativa]);
  const encerrar = useCallback(() => setAtiva(null), []);
  return { ativa: ativa && !bloqueado && presentes[ativa] === true ? ativa : null, encerrar };
}
