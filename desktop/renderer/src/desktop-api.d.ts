// API exposta pelo preload do Electron (ausente quando aberto num browser puro,
// ex.: teste com Playwright — por isso todo uso é opcional).
interface SoulmonAuthSession {
  token: string;
  email: string;
  exp: number;
}

interface SoulmonDesktopApi {
  setInteractive(on: boolean): void;
  openMenu(centerX?: number): void;
  minimizeMenu(): void;
  openFullApp(): void;
  quit(): void;
  onUpdateReady(cb: () => void): void;
  notifyStateChanged(): void;
  onStateChanged(cb: () => void): void;
  sendEffect(emoji: string, phrase: string): void;
  onEffect(cb: (emoji: string, phrase: string) => void): void;
  getAuth(): Promise<SoulmonAuthSession | null>;
  onAuthChanged(cb: (session: { email: string } | null) => void): void;
}

interface Window {
  soulmonDesktop?: SoulmonDesktopApi;
}
