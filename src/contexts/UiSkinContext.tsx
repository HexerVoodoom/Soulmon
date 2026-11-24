import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readLocal, writeLocal } from '../utils/safeStorage';
import { parseUiSkin, type UiSkin } from '../utils/uiSkin';

interface UiSkinContextValue {
  skin: UiSkin;
  setSkin: (skin: UiSkin) => void;
}

const UiSkinContext = createContext<UiSkinContextValue | null>(null);

/**
 * O `data-ui` inicial já é setado por um script inline em `index.html` (antes
 * da 1ª pintura, sem flash). Este provider assume o controle depois que o
 * React monta e mantém o atributo sincronizado — mesmo molde do `ThemeProvider`.
 * Storage indisponível ou valor inválido => 'arte'.
 */
export function UiSkinProvider({ children }: { children: ReactNode }) {
  const [skin, setSkinState] = useState<UiSkin>(() => parseUiSkin(readLocal(STORAGE_KEYS.UI_SKIN)));

  useEffect(() => {
    document.documentElement.dataset.ui = skin;
  }, [skin]);

  const setSkin = useCallback((next: UiSkin) => {
    // Preferência cosmética: falhar volta ao padrão na próxima sessão.
    writeLocal(STORAGE_KEYS.UI_SKIN, next, { silent: true });
    setSkinState(next);
  }, []);

  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin]);
  return <UiSkinContext.Provider value={value}>{children}</UiSkinContext.Provider>;
}

export function useUiSkin(): UiSkinContextValue {
  const ctx = useContext(UiSkinContext);
  if (!ctx) throw new Error('useUiSkin must be used within a UiSkinProvider');
  return ctx;
}
