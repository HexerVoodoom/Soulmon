// Configuração compartilhada pelo renderer do desktop.
//
// A URL ainda aponta pro Pages herdado do DigiApp — trocar aqui E em
// `capacitor.config.json` E em `desktop/electron/main.js` quando o domínio
// próprio do Soulmon existir (ver docs/SEPARACAO-DIGIAPP.md, fase 3).
export const APP_URL = 'https://soulmon.mateus-sprnd.workers.dev';

/** Namespace local do desktop — separado do save real de propósito (ver state.ts). */
export const STORAGE_KEY = 'soulmon_desktop_v1';
