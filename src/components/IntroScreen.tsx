import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import introVideo from '../assets/brand/intro.mp4';
import introPoster from '../assets/brand/intro-poster.webp';
import { resolveLanguage } from '../utils/i18n';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

/**
 * A INTRO é a continuação do boot (canvas Onboarding-funil ONB-03/04,
 * DECISÕES §23, D-O3 revista na rodada 2 / X4): o MESMO `.sm2-splash` da
 * splash do `index.html` — full-bleed, paleta do visor (`.sm2-visor`, D-O16)
 * — com o vídeo de marca em `cover` dentro. Sem anel, sem janela: a splash
 * liga o visor, a intro continua nele, o portão é o aparelho.
 *
 * A superfície inteira é o alvo "Skip intro" (`role=button` + Enter/Espaço,
 * O5/B4) e diz "TAP TO SKIP" em Silkscreen 14 no pé. Se o vídeo falhar
 * (WebView antigo), o quadro vira o corvo-mascote a 128 direto sobre o vidro
 * (ilustração 512² a 0,25×, `image-rendering: auto` — sem a placa 96² que
 * era ícone em box) + "SOULMON" em Silkscreen 20, e sai sozinho em 1,5 s.
 * Os literais `#0b0d16` e o gradiente Tailwind saíram: tudo é token.
 */
export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const isPt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
  const [leaving, setLeaving] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  /* O navegador recusou o autoplay (ou o WebView o adiou): em vez do botão de
     play CINZA nativo, a tela mostra o PÔSTER da marca e o convite é nosso. */
  const [blocked, setBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFinish = (totalMs: number) => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setLeaving(true), Math.max(totalMs - 400, 0));
    doneTimerRef.current = setTimeout(onFinish, totalMs);
  };

  // Toque/tecla em qualquer lugar: pula direto pro app, com o mesmo fade de
  // saída (400ms) que o fim natural do vídeo já usa.
  const skip = () => {
    // Autoplay recusado: o primeiro toque é o gesto que o libera — toca o vídeo em vez de pular.
    const v = videoRef.current;
    if (blocked && v) {
      setBlocked(false);
      v.play().catch(() => scheduleFinish(400));
      return;
    }
    scheduleFinish(400);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); skip(); }
  };

  useEffect(() => {
    // Fallback timing (used if the video fails, or as a safety net if
    // `loadedmetadata`/`ended` never fire). Video duration takes over once known.
    scheduleFinish(1500);
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFinish]);

  // Autoplay mudo costuma passar; se não passar, o `play()` rejeita e é aqui que sabemos.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || typeof v.play !== 'function') return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => setBlocked(true));
  }, []);

  const skipLabel = isPt ? 'Pular introdução' : 'Skip intro';
  /* ONB-04 (erro) é o mesmo quadro SEM alvo — sai sozinho (fidelidade ao
     canvas): o `role=button` só existe enquanto o vídeo é a estrutura. */
  const alvo = videoFailed ? {} : { role: 'button' as const, tabIndex: 0, 'aria-label': skipLabel, onClick: skip, onKeyDown };

  return (
    <div
      {...alvo}
      className="sm2-visor sm2-splash"
      data-testid="intro-screen"
      style={{
        zIndex: 500,
        /* O único `opacity` aqui é o FADE DE SAÍDA da tela inteira (movimento
           de transição), não um estado visual — nada dentro esmaece. */
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: leaving ? 'none' : 'auto',
      }}
    >
      {!videoFailed ? (
        <video
          ref={videoRef}
          src={introVideo}
          /* PÔSTER = o 1º quadro do próprio vídeo (a marca). Sem ele o WebView do
             Android desenha o pôster PADRÃO dele — o triângulo de play cinza que
             aparecia entre o ícone e a intro enquanto o vídeo baixava. */
          poster={introPoster}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noremoteplayback"
          className="sm2-splash-video"
          onLoadedMetadata={e => {
            const dur = e.currentTarget.duration;
            if (isFinite(dur) && dur > 0) scheduleFinish(dur * 1000);
          }}
          onEnded={onFinish}
          onError={() => { setVideoFailed(true); scheduleFinish(1500); }}
        />
      ) : (
        <>
          <img src={ravenMascot} alt="" width={128} height={128} className="sm2-splash-raven" draggable={false} />
          <p className="sm2-splash-wordmark">Soulmon</p>
        </>
      )}
      <span className="sm2-viewport-glass" aria-hidden="true" />
      {!videoFailed && (
        <span className="sm2-splash-tap" aria-hidden="true">
          <span className="sm2-splash-pix">
            {blocked ? (isPt ? 'Toque para começar' : 'Tap to start') : (isPt ? 'Toque para pular' : 'Tap to skip')}
          </span>
        </span>
      )}
    </div>
  );
}
