import { readFlag, writeFlag } from '../../../utils/safeStorage';
import { STORAGE_KEYS } from '../../../utils/storageKeys';

// Regras de entrada da cinemática, separadas do componente: o App decide se toca a intro na 1ª pintura,
// mas o componente (painéis, música, copy — ~10 KB) só precisa carregar quando ela de fato vai tocar.
/** Já viu a introdução (só a primeira abertura, antes do login, a toca sozinha). */
export const introVista = (): boolean => readFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA);
export const marcarIntroVista = (): void => { writeFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA, true, { silent: true }); };
/** O opening toca sozinho? Só na 1ª abertura de quem é novo (save ainda sem onboarding), antes do login. Independe de ONBOARDING_VELADO (dono, 05/11/2026). */
export const deveTocarIntro = (onboardingCompleto: boolean): boolean => !onboardingCompleto && !introVista();
