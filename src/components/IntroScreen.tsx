import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import introVideo from '../assets/brand/intro.mp4';
import introPoster from '../assets/brand/intro-poster.webp';
import { resolveLanguage } from '../utils/i18n';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { iniciarTemaNoGesto } from '../utils/tema';
import { IntroWelcomePill } from './ui/IntroWelcomePill';

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
/**
 * SEM TELA DE "TAP TO START" (11/11/2026, pedido do dono, REGISTRO §292): ela existia só
 * para dar um gesto ao áudio (o WebView/navegador só libera a música-tema depois de um
 * toque, S17). Agora a intro (vídeo + "Carregando dados...") abre DIRETO e o áudio é
 * desbloqueado pelo ouvinte passivo único de `armarTemaNoPrimeiroGesto` (main.tsx):
 * o primeiro toque/tecla em QUALQUER lugar (intro, login, Home) liga o tema. O toque que
 * pula a intro também chama `iniciarTemaNoGesto` (idempotente) por garantia.
 */
export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  return <IntroVideo onFinish={onFinish} />;
}

function IntroVideo({ onFinish }: { onFinish: () => void }) {
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
    iniciarTemaNoGesto();
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
      {!videoFailed && <IntroWelcomePill />}
      {!videoFailed && <IntroLoading isPt={isPt} ms={INTRO_VIDEO_MS} />}
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

/** Duração do vídeo da intro (10,01 s): a barra de carregamento enche neste tempo. */
const INTRO_VIDEO_MS = 10000;

/**
 * Texto de carregamento DESENHADO no app (21/10/2026, L11-08): o vídeo e o pôster não
 * trazem mais texto assado. "Carregando dados…" + barra enchendo no tempo da intro +
 * "Vínculo de alma estabelecido" ao fim. Decorativo (`aria-hidden`): o alvo do pai dá
 * o nome. `prefers-reduced-motion`: a barra já aparece cheia e o selo final visível.
 */
function IntroLoading({ isPt, ms }: { isPt: boolean; ms: number }) {
  return (
    <span className="sm2-intro-stage" aria-hidden="true" data-testid="intro-loading-stage">
      <span className="sm2-intro-art">
        <span className="sm2-intro-load" style={{ ['--intro-ms' as string]: `${ms}ms` }}>
          <span className="sm2-intro-load-label" data-testid="intro-loading-label">{isPt ? 'Carregando dados...' : 'Loading data...'}</span>
          <span className="sm2-intro-bar"><span className="sm2-intro-bar-fill" /></span>
          <span className="sm2-intro-load-done" data-testid="intro-loading-done">{isPt ? 'Vínculo de alma estabelecido' : 'Soul link established'}</span>
        </span>
      </span>
    </span>
  );
}
