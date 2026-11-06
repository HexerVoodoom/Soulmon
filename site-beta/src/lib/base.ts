// Site servido em /beta (astro.config base). Todo caminho interno passa por aqui; a API fica na raiz (/api/*).
const RAIZ = import.meta.env.BASE_URL.replace(/\/$/, '');
export const b = (p: string): string => (p.startsWith('/') && !p.startsWith('//') ? RAIZ + p : p);
