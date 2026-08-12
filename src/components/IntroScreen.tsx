import { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import introVideo from '../assets/brand/intro.mp4';

/**
 * Splash screen shown briefly on every cold start, before the onboarding
 * gate / main app render. Purely cosmetic — self-dismisses via onFinish.
 * Plays the brand intro video; falls back to the plain wordmark if the
 * video fails to load (e.g. unsupported format on an old WebView).
 */
export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFinish = (totalMs: number) => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    leaveTimerRef.current = setTimeout(() => setLeaving(true), Math.max(totalMs - 400, 0));
    doneTimerRef.current = setTimeout(onFinish, totalMs);
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

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: '#0b0d16',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#ffffff',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: leaving ? 'none' : 'auto',
        overflow: 'hidden',
      }}
    >
      {!videoFailed ? (
        <video
          src={introVideo}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={e => {
            const dur = e.currentTarget.duration;
            if (isFinite(dur) && dur > 0) scheduleFinish(dur * 1000);
          }}
          onEnded={onFinish}
          onError={() => { setVideoFailed(true); scheduleFinish(1500); }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #8b7ae0 0%, #6d5bd0 45%, #55449f 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: 'rgba(255,255,255,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'sm-intro-logo-in 0.6s cubic-bezier(.2,.9,.3,1.3)',
          }}>
            <Sparkles size={52} color="#ffffff" strokeWidth={1.6} />
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 800, letterSpacing: -0.5, margin: '18px 0 0',
            animation: 'sm-intro-wordmark-in 0.5s ease 0.25s both',
          }}>
            Soulmon
          </h1>
        </div>
      )}
    </div>
  );
}
