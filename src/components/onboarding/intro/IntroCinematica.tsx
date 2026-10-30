import { useEffect, useState } from 'react';
import type { Language } from '../../../utils/i18n';
import { readFlag, writeFlag } from '../../../utils/safeStorage';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { onboardingVeladoLigado } from '../sequencia/flag';
import { PLANOS_INTRO } from './copy';

/** O vídeo ainda não existe: com ele ausente o glob devolve {} e a tela fica preta com as legendas. */
const VIDEOS = import.meta.glob('../../../assets/soulmon/intro/intro-parede.mp4', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const VIDEO_SRC: string | undefined = Object.values(VIDEOS)[0];

/** Já viu a introdução (só a primeira abertura, antes do login, a toca sozinha). */
export const introVista = (): boolean => readFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA);
export const marcarIntroVista = (): void => { writeFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA, true, { silent: true }); };
/** Toca sozinha? Flag ligado, primeira abertura e save ainda sem onboarding. */
export const deveTocarIntro = (onboardingCompleto: boolean): boolean => onboardingVeladoLigado() && !onboardingCompleto && !introVista();

interface Props { language: Language; onDone: () => void; videoSrc?: string }

export function IntroCinematica({ language, onDone, videoSrc = VIDEO_SRC }: Props) {
  const isPt = language === 'pt-BR';
  const [i, setI] = useState(0);
  const fim = () => { marcarIntroVista(); onDone(); };

  useEffect(() => {
    const t = setTimeout(() => {
      if (i + 1 >= PLANOS_INTRO.length) { marcarIntroVista(); onDone(); } else setI(i + 1);
    }, PLANOS_INTRO[i].s * 1000);
    return () => clearTimeout(t);
  }, [i, onDone]);

  const plano = PLANOS_INTRO[i];
  return (
    <div data-testid="intro-cinematica" style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      {videoSrc && <video src={videoSrc} autoPlay muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      <p data-testid="intro-legenda" data-plano={i + 1} aria-live="polite" style={{ position: 'relative', margin: 0, padding: '0 24px 96px', textAlign: 'center', fontSize: 18, textShadow: '0 1px 4px #000' }}>
        {isPt ? plano.pt : plano.en}
      </p>
      <button type="button" data-testid="intro-pular" onClick={fim}
        style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', color: '#fff', border: '1px solid #fff8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
        {isPt ? 'Pular' : 'Skip'}
      </button>
    </div>
  );
}
