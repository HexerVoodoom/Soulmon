import { readFlag, writeFlag } from '../../../utils/safeStorage';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { onboardingVeladoLigado } from '../sequencia/flag';

// Regras de entrada da cinemática, separadas do componente: o App decide se toca a intro na 1ª pintura,
// mas o componente (painéis, música, copy — ~10 KB) só precisa carregar quando ela de fato vai tocar.
/** Já viu a introdução (só a primeira abertura, antes do login, a toca sozinha). */
export const introVista = (): boolean => readFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA);
export const marcarIntroVista = (): void => { writeFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA, true, { silent: true }); };
/** Toca sozinha? Flag ligado, primeira abertura e save ainda sem onboarding. */
export const deveTocarIntro = (onboardingCompleto: boolean): boolean => onboardingVeladoLigado() && !onboardingCompleto && !introVista();
