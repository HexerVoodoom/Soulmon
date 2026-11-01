/** O que os itens da Hexsmith equipados reescrevem no Soulmon (`utils/hexsmith.ts`), lido do save. Sem provider (demo, testes) = nada. */
import { useMemo } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { hexOverrides, type HexOverrides } from '../utils/hexsmith';

export function useHexOverrides(): HexOverrides {
  const hx = useGameStateOptional()?.gameState.hexsmith;
  return useMemo(() => hexOverrides(hx), [hx]);
}
