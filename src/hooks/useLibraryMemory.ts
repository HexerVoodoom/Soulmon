/**
 * MEMÓRIA DA BIBLIOTECA (10/11/2026) — porta única de leitura/escrita dos "já vistos" (H17) e das formas vistas.
 * Com o provider do jogo: a fonte é `GameState.librarySeen`/`libraryForms` (vai no save em nuvem; só grava quando MUDA — os
 * updaters devolvem o mesmo objeto se nada mudou, então não há save à toa). Sem provider (testes/uso isolado): cai na chave
 * local de antes, com o mesmo comportamento.
 */
import { useCallback, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { addSeenId, addSeenToState, readSeenIds } from '../utils/librarySeen';
import { readAllForms, recordForms, recordFormsInState, type SeenForm } from '../utils/libraryForms';
import { writeJson } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

const VAZIO: string[] = [];
const VAZIO_FORMS: Record<string, SeenForm[]> = {};

export function useLibraryMemory() {
  const ctx = useGameStateOptional();
  const [localSeen, setLocalSeen] = useState<string[]>(readSeenIds);
  const [localForms, setLocalForms] = useState<Record<string, SeenForm[]>>(readAllForms);

  const seen = ctx ? (ctx.gameState.librarySeen ?? VAZIO) : localSeen;
  const formsMap = ctx ? (ctx.gameState.libraryForms ?? VAZIO_FORMS) : localForms;
  const setGameState = ctx?.setGameState;

  const markSeen = useCallback((id: string) => {
    if (setGameState) { setGameState(prev => addSeenToState(prev, id)); return; }
    setLocalSeen(prev => {
      if (prev.includes(id)) return prev;
      const next = [...addSeenId(prev, id)];
      writeJson(STORAGE_KEYS.LIBRARY_SEEN, next);
      return next;
    });
  }, [setGameState]);

  const record = useCallback((id: string, forms: readonly unknown[]) => {
    if (setGameState) { setGameState(prev => recordFormsInState(prev, id, forms)); return; }
    recordForms(id, forms);
    setLocalForms(readAllForms());
  }, [setGameState]);

  return { seen, formsMap, markSeen, record };
}
