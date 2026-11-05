import { useEffect, useRef, useState } from 'react';
import { entrarNaSuperficie } from '../../../utils/musica';
import { musicaLigada } from '../../../utils/audioBus';
import type { Language } from '../../../utils/i18n';
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
/** Ruído de TV (feTurbulence) em data URI; a posição salta em steps() para "chiar". */
const RUIDO = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
/**
 * Logo final (04/11/2026, dono): vídeo do Gemini com fundo magenta, recortado por chroma-key (ffmpeg colorkey) para VP9 com alfa.
 * Navegador sem VP9-alfa (Safari/iOS) cai no último quadro em webp.
 */
const LOGO_VIDEO: string | undefined = Object.values(import.meta.glob('../../../assets/soulmon/intro/logo-final.webm', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)[0];
const LOGO_IMG: string | undefined = Object.values(import.meta.glob('../../../assets/soulmon/intro/logo-final.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)[0];
/** O vídeo do logo dura 10 s; depois dele segura 1 s. Teto para quando o vídeo não toca. */
const LOGO_SEGURA_S = 1;
const LOGO_TETO_S = 11.5;
/** Duração da "sintonia" (estática entre um plano e outro), em segundos. */
const SINTONIA = 0.55;
const CSS_INTRO = `
@keyframes intro-cam{from{transform:scale(var(--z0)) translate(var(--x0),var(--y0))}to{transform:scale(var(--z1)) translate(var(--x1),var(--y1))}}
@keyframes intro-flicker{0%,100%{opacity:.18}48%{opacity:.26}50%{opacity:.1}52%{opacity:.22}}
@keyframes intro-roll{from{background-position:0 0}to{background-position:0 6px}}
@keyframes intro-chiado{0%{background-position:0 0}20%{background-position:-60px 40px}40%{background-position:70px -30px}60%{background-position:-20px -80px}80%{background-position:90px 60px}100%{background-position:0 0}}
@keyframes intro-sintonia{0%{opacity:1}12%{opacity:.85}18%{opacity:1}30%{opacity:.35}36%{opacity:1}55%{opacity:.9}70%{opacity:.5}78%{opacity:.8}100%{opacity:0}}
@keyframes intro-faixas{0%{transform:translateY(-30%)}100%{transform:translateY(30%)}}
@keyframes intro-sinal{0%{opacity:0;transform:translateX(-14%);filter:contrast(2.4) saturate(3) hue-rotate(80deg) brightness(1.6);clip-path:inset(32% 0 41% 0)}
 14%{opacity:1;transform:translateX(9%);clip-path:inset(0 0 62% 0);filter:contrast(2) hue-rotate(-60deg) brightness(1.3)}
 26%{transform:translateX(-5%);clip-path:inset(48% 0 6% 0);filter:contrast(1.7) invert(.25)}
 38%{transform:translateX(3%);clip-path:inset(0);filter:contrast(1.5) hue-rotate(30deg)}
 50%{transform:translateX(-2%);clip-path:inset(18% 0 22% 0)}
 64%{transform:none;clip-path:inset(0);filter:contrast(1.2)}
 100%{opacity:1;transform:none;clip-path:inset(0);filter:none}}
@keyframes intro-aberr-r{0%,40%,46%,78%,83%,100%{transform:translate(0,0);opacity:0}41%{transform:translate(2.2%,.4%);opacity:.55}44%{transform:translate(-1.4%,0);opacity:.4}79%{transform:translate(3%,-.6%);opacity:.6}82%{transform:translate(1%,0);opacity:.3}}
@keyframes intro-aberr-c{0%,40%,46%,78%,83%,100%{transform:translate(0,0);opacity:0}41%{transform:translate(-2.2%,-.4%);opacity:.55}44%{transform:translate(1.4%,0);opacity:.4}79%{transform:translate(-3%,.6%);opacity:.6}82%{transform:translate(-1%,0);opacity:.3}}
@keyframes intro-rasgo{0%,55%,62%,88%,93%,100%{clip-path:inset(100% 0 0 0);transform:none}56%{clip-path:inset(22% 0 70% 0);transform:translateX(-7%)}58%{clip-path:inset(60% 0 31% 0);transform:translateX(5%)}60%{clip-path:inset(8% 0 86% 0);transform:translateX(-3%)}89%{clip-path:inset(71% 0 17% 0);transform:translateX(9%)}91%{clip-path:inset(40% 0 52% 0);transform:translateX(-6%)}}
@keyframes intro-leg-in{0%{opacity:0;transform:translateX(-6px);letter-spacing:.3em}20%{opacity:1;transform:translateX(4px)}35%{opacity:.4}45%{opacity:1;transform:none;letter-spacing:.1em}100%{opacity:1;transform:none;letter-spacing:.1em}}
@keyframes intro-leg-out{from{opacity:1}to{opacity:0}}
@keyframes intro-leg-rgb{0%,70%,76%,100%{text-shadow:0 2px 10px #000,0 0 0 transparent,0 0 0 transparent}71%{text-shadow:0 2px 10px #000,-3px 0 0 rgba(255,40,90,.85),3px 0 0 rgba(40,230,255,.85)}73%{text-shadow:0 2px 10px #000,4px 1px 0 rgba(255,40,90,.85),-4px -1px 0 rgba(40,230,255,.85)}}
@media (prefers-reduced-motion: reduce){[data-intro-cam],[data-intro-scan],[data-intro-fx],[data-intro-sintonia]{animation:none!important}[data-intro-sintonia],[data-intro-fx]{display:none}}
`;

export { introVista, marcarIntroVista, deveTocarIntro } from './introGate';
import { marcarIntroVista } from './introGate';

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
  /** Autoplay/WebView do Android: sem gesto o áudio nasce suspenso. O 1º toque na tela refaz a entrada na superfície (já dentro do gesto) e destrava. */
  const gestoFeito = useRef(false);
  const aoPrimeiroToque = () => {
    if (gestoFeito.current || !globalLigado || !sairDoSom.current) return;
    gestoFeito.current = true;
    sairDoSom.current(); sairDoSom.current = entrarNaSuperficie('intro');
  };

  /** Depois do último plano entra o logo animado; a intro termina quando ele acaba (ou no teto, se o vídeo não tocar). */
  const [logo, setLogo] = useState(false);
  const [logoSemVideo, setLogoSemVideo] = useState(false);
  const fimRef = useRef(fim);
  fimRef.current = fim;
  useEffect(() => {
    if (logo) return;
    const t = setTimeout(() => {
      if (i + 1 >= PLANOS_INTRO.length) setLogo(true); else setI(i + 1);
    }, PLANOS_INTRO[i].s * 1000);
    return () => clearTimeout(t);
  }, [i, logo]);
  useEffect(() => {
    if (!logo) return;
    const t = setTimeout(() => fimRef.current(), LOGO_TETO_S * 1000);
    return () => clearTimeout(t);
  }, [logo]);

  /** Pré-carrega o próximo painel (a fusão não pisca em rede lenta). */
  useEffect(() => { const nx = paineis[i + 1]; if (nx) { const im = new Image(); im.src = nx; } }, [i, paineis]);

  const plano = PLANOS_INTRO[i];
  return (
    <div data-testid="intro-cinematica" onPointerDown={aoPrimeiroToque} style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
      <style>{CSS_INTRO}</style>
      {!logo && paineis[i] && (() => {
        const [z0, x0, y0, z1, x1, y1] = CAMERA[i % CAMERA.length];
        const cam = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ['--z0' as string]: z0, ['--x0' as string]: `${x0}%`, ['--y0' as string]: `${y0}%`, ['--z1' as string]: z1, ['--x1' as string]: `${x1}%`, ['--y1' as string]: `${y1}%`,
          animation: `intro-cam ${plano.s + SINTONIA}s ease-in-out both` } as const;
        // Copias tingidas da imagem: aberração cromática (vermelho/ciano) e um "rasgo" horizontal, em surtos.
        return (
          <div key={`p${i}`} data-testid="intro-painel" data-plano={i + 1} aria-hidden="true"
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', animation: `intro-sinal ${SINTONIA + 0.15}s steps(1, end) both` }}>
            <div data-intro-fx style={{ position: 'absolute', inset: 0 }}>
              <img data-intro-cam src={paineis[i]} alt="" draggable={false} style={cam} />
              <img data-intro-fx src={paineis[i]} alt="" draggable={false} style={{ ...cam, mixBlendMode: 'screen', filter: 'sepia(1) saturate(9) hue-rotate(-50deg) brightness(.8)', animation: `${cam.animation}, intro-aberr-r ${3.7 + (i % 2)}s steps(1, end) infinite` }} />
              <img data-intro-fx src={paineis[i]} alt="" draggable={false} style={{ ...cam, mixBlendMode: 'screen', filter: 'sepia(1) saturate(9) hue-rotate(150deg) brightness(.8)', animation: `${cam.animation}, intro-aberr-c ${3.7 + (i % 2)}s steps(1, end) infinite` }} />
              <img data-intro-fx src={paineis[i]} alt="" draggable={false} style={{ ...cam, filter: 'contrast(1.6) brightness(1.2)', animation: `${cam.animation}, intro-rasgo ${4.4 + (i % 3) * 0.7}s steps(1, end) infinite` }} />
            </div>
          </div>
        );
      })()}
      {logo && (
        <div data-testid="intro-logo" aria-label="Soulmon" role="img" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {LOGO_VIDEO && !logoSemVideo
            ? <video src={LOGO_VIDEO} poster={LOGO_IMG} autoPlay muted playsInline onError={() => setLogoSemVideo(true)}
                onEnded={() => { setTimeout(() => fimRef.current(), LOGO_SEGURA_S * 1000); }}
                style={{ width: 'min(92vw, 460px)', height: 'auto' }} />
            : LOGO_IMG && <img src={LOGO_IMG} alt="" draggable={false} style={{ width: 'min(92vw, 460px)', height: 'auto', animation: 'intro-sinal .8s steps(1, end) both' }} />}
        </div>
      )}
      {/* Monitor CRT: scanlines rolando, cintilação, chiado constante e vinheta. */}
      <div aria-hidden="true" data-intro-scan style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.55) 0 1px, transparent 1px 3px)', animation: 'intro-flicker 3.2s steps(8) infinite, intro-roll 0.6s linear infinite', mixBlendMode: 'multiply' }} />
      <div aria-hidden="true" data-intro-fx style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: RUIDO, opacity: 0.09, mixBlendMode: 'screen', animation: 'intro-chiado .5s steps(5) infinite' }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.8) 100%)' }} />
      {/* Troca de plano = mau contato: estática cheia, faixas rolando e um clarão, como girar o dial entre estações. */}
      <div key={logo ? 'slogo' : `s${i}`} aria-hidden="true" data-intro-sintonia
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', background: '#0b0d10', backgroundImage: RUIDO, animation: `intro-sintonia ${SINTONIA}s steps(9, end) both, intro-chiado .2s steps(4) infinite` }}>
        <div style={{ position: 'absolute', inset: '-40% 0', background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.22) 0 3px, transparent 3px 19px, rgba(63,210,217,.25) 19px 23px, transparent 23px 41px)', animation: `intro-faixas ${SINTONIA / 2}s steps(6) infinite` }} />
      </div>
      {!logo && <p key={i} data-testid="intro-legenda" data-plano={i + 1} aria-live="polite"
        style={{ position: 'absolute', inset: 0, margin: 0, padding: '0 28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '13vh', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none',
          fontFamily: "var(--sm2-font-display, 'Cinzel'), Georgia, serif", fontWeight: 700, fontSize: 24, lineHeight: 1.45, textTransform: 'uppercase', letterSpacing: '.1em', textWrap: 'balance',
          animation: `intro-leg-in .5s steps(6, end) ${SINTONIA}s both, intro-leg-rgb 2.6s steps(1, end) ${SINTONIA}s infinite, intro-leg-out .3s ease-in ${Math.max(0, plano.s - 0.3)}s forwards` }}>
        {isPt ? plano.pt : plano.en}
      </p>}
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
