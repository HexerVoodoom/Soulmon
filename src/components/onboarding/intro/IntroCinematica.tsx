import { useEffect, useRef, useState } from 'react';
import { entrarNaSuperficie } from '../../../utils/musica';
import { musicaLigada } from '../../../utils/audioBus';
import type { Language } from '../../../utils/i18n';
import { readFlag, writeFlag } from '../../../utils/safeStorage';
import { STORAGE_KEYS } from '../../../utils/storageKeys';
import { onboardingVeladoLigado } from '../sequencia/flag';
import { PLANOS_INTRO } from './copy';

/**
 * Intro v2 (04/11/2026, dono): no lugar do vídeo, 9 PAINÉIS ilustrados (mural de ruína ancestral + monitor CRT retrô),
 * animados no app: pan/zoom lento (alternando o sentido), troca em fusão, e por cima scanlines, vinheta e interferência em CSS.
 * Sem um painel o plano fica preto só com a legenda (fallback).
 */
const PAINEIS_GLOB = import.meta.glob('../../../assets/soulmon/intro/painel-*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PAINEIS: (string | undefined)[] = PLANOS_INTRO.map((_, k) => Object.entries(PAINEIS_GLOB).find(([f]) => f.endsWith(`painel-${k + 1}.webp`))?.[1]);
/** Movimento de câmera de cada plano: de → para (escala, x%, y%). */
const CAMERA: readonly [number, number, number, number, number, number][] = [
  [1.18, 0, 6, 1.04, 0, -4], [1.05, -3, 0, 1.16, 3, 0], [1.2, 0, -6, 1.05, 0, 5], [1.04, 2, 2, 1.15, -2, -3],
  [1.16, 0, 5, 1.04, 0, -5], [1.05, 3, 0, 1.16, -3, 0], [1.18, -2, -4, 1.05, 2, 4], [1.04, 0, 0, 1.2, 0, -2], [1.3, 0, 0, 1.02, 0, 0],
];
const CSS_INTRO = `
@keyframes intro-leg-in{from{opacity:0}to{opacity:1}}
@keyframes intro-leg-out{from{opacity:1}to{opacity:0}}
@keyframes intro-painel-in{from{opacity:0}to{opacity:1}}
@keyframes intro-cam{from{transform:scale(var(--z0)) translate(var(--x0),var(--y0))}to{transform:scale(var(--z1)) translate(var(--x1),var(--y1))}}
@keyframes intro-flicker{0%,100%{opacity:.16}48%{opacity:.22}50%{opacity:.1}52%{opacity:.2}}
@keyframes intro-glitch{0%,86%,100%{transform:translateY(-20vh);opacity:0}87%{opacity:.55}90%{transform:translateY(60vh);opacity:.4}93%{transform:translateY(110vh);opacity:0}}
@keyframes intro-roll{from{background-position:0 0}to{background-position:0 6px}}
@media (prefers-reduced-motion: reduce){[data-intro-cam],[data-intro-glitch],[data-intro-scan]{animation:none!important}}
`;

/** Já viu a introdução (só a primeira abertura, antes do login, a toca sozinha). */
export const introVista = (): boolean => readFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA);
export const marcarIntroVista = (): void => { writeFlag(STORAGE_KEYS.INTRO_CINEMATICA_VISTA, true, { silent: true }); };
/** Toca sozinha? Flag ligado, primeira abertura e save ainda sem onboarding. */
export const deveTocarIntro = (onboardingCompleto: boolean): boolean => onboardingVeladoLigado() && !onboardingCompleto && !introVista();

interface Props { language: Language; onDone: () => void; paineis?: readonly (string | undefined)[] }

export function IntroCinematica({ language, onDone, paineis = PAINEIS }: Props) {
  const isPt = language === 'pt-BR';
  const [i, setI] = useState(0);
  /** Trilha 'A Parede': NASCE LIGADA (decisão do dono, 02/11/2026; exceção à S2, como o tema). O navegador só libera o áudio no 1º gesto; o botão desliga/religa. Respeita o interruptor global de música. */
  const globalLigado = musicaLigada();
  const [som, setSom] = useState(globalLigado);
  const sairDoSom = useRef<(() => void) | null>(null);
  const alternarSom = () => {
    if (sairDoSom.current) { sairDoSom.current(); sairDoSom.current = null; setSom(false); return; }
    sairDoSom.current = entrarNaSuperficie('intro');
    setSom(true);
  };
  useEffect(() => {
    if (globalLigado) sairDoSom.current = entrarNaSuperficie('intro');
    return () => { sairDoSom.current?.(); sairDoSom.current = null; };
  }, [globalLigado]);
  const fim = () => { marcarIntroVista(); onDone(); };

  useEffect(() => {
    const t = setTimeout(() => {
      if (i + 1 >= PLANOS_INTRO.length) { marcarIntroVista(); onDone(); } else setI(i + 1);
    }, PLANOS_INTRO[i].s * 1000);
    return () => clearTimeout(t);
  }, [i, onDone]);

  /** Pré-carrega o próximo painel (a fusão não pisca em rede lenta). */
  useEffect(() => { const nx = paineis[i + 1]; if (nx) { const im = new Image(); im.src = nx; } }, [i, paineis]);

  const plano = PLANOS_INTRO[i];
  return (
    <div data-testid="intro-cinematica" style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <style>{CSS_INTRO}</style>
      {paineis[i] && (() => {
        const [z0, x0, y0, z1, x1, y1] = CAMERA[i % CAMERA.length];
        return (
          <div key={`p${i}`} data-testid="intro-painel" data-plano={i + 1} aria-hidden="true"
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: 'intro-painel-in 1.2s ease-out both' }}>
            <img data-intro-cam src={paineis[i]} alt="" draggable={false}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ['--z0' as string]: z0, ['--x0' as string]: `${x0}%`, ['--y0' as string]: `${y0}%`, ['--z1' as string]: z1, ['--x1' as string]: `${x1}%`, ['--y1' as string]: `${y1}%`,
                animation: `intro-cam ${plano.s + 1.2}s ease-in-out both` }} />
          </div>
        );
      })()}
      {/* Monitor CRT: scanlines rolando, cintilação, vinheta e uma faixa de interferência de vez em quando. */}
      <div aria-hidden="true" data-intro-scan style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 1px, transparent 1px 3px)', animation: 'intro-flicker 3.2s steps(8) infinite, intro-roll 0.6s linear infinite', mixBlendMode: 'multiply' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.75) 100%)' }} />
      <div aria-hidden="true" data-intro-glitch style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '7vh', pointerEvents: 'none', background: 'linear-gradient(180deg, transparent, rgba(63,210,217,.35) 40%, rgba(255,255,255,.25) 50%, rgba(63,210,217,.3) 60%, transparent)', mixBlendMode: 'screen', animation: 'intro-glitch 7s linear infinite' }} />
      <p key={i} data-testid="intro-legenda" data-plano={i + 1} aria-live="polite"
        style={{ position: 'absolute', inset: 0, margin: 0, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '14vh', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none', fontSize: 30, lineHeight: 1.4, textShadow: '0 2px 8px #000',
          animation: `intro-leg-in 0.9s ease-out both, intro-leg-out 0.9s ease-in ${Math.max(0, plano.s - 0.9)}s forwards` }}>
        {isPt ? plano.pt : plano.en}
      </p>
      {globalLigado && (
        <button type="button" data-testid="intro-som" aria-pressed={som} onClick={alternarSom}
          aria-label={som ? (isPt ? 'Desligar o som' : 'Turn sound off') : (isPt ? 'Ligar o som' : 'Turn sound on')}
          style={{ position: 'absolute', top: 16, left: 16, background: 'transparent', color: '#fff', border: '1px solid #fff8', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', opacity: 0.85, font: '18px/1 system-ui, sans-serif' }}>
          {som ? '🔊' : '🔇'}
        </button>
      )}
      <button type="button" data-testid="intro-pular" onClick={fim}
        style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', color: '#fff', border: '1px solid #fff8', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
        {isPt ? 'Pular' : 'Skip'}
      </button>
    </div>
  );
}
