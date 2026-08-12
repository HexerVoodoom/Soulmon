import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  const raw = localStorage.getItem(STORAGE_KEYS.THEME);
  // Chave reaproveitada do antigo seletor de skin (default/win98/glitch,
  // removido) — qualquer valor que não seja um modo válido vira 'system'.
  return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
}

/** O visual do jogo (moldura cobre, teal escuro — ver as 4 referências do
 *  "Soul Mon UI Design Kit") só existe pensado pro tema escuro. Sem
 *  preferência salva pelo usuário, o padrão é escuro — não segue o SO, que
 *  faria a metade dos aparelhos abrir no tema claro que ninguém desenhou. */
function resolveSystemPreference(): ResolvedTheme {
  return 'dark';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? resolveSystemPreference() : mode;
}

/**
 * O `data-theme` inicial já é setado por um script inline em `index.html`
 * (roda antes do primeiro paint, evita FOUC) — este provider só assume o
 * controle depois que o React monta, e mantém o atributo sincronizado quando
 * o modo muda ou (em 'system') quando o SO troca de tema em tempo real.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolve(mode));

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    setResolvedTheme(resolve(mode));
    if (mode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolvedTheme(resolveSystemPreference());
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    localStorage.setItem(STORAGE_KEYS.THEME, next);
    setModeState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
