import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Splash screen shown briefly on every cold start, before the onboarding
 * gate / main app render. Purely cosmetic — self-dismisses via onFinish.
 */
export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 1100);
    const doneTimer = setTimeout(onFinish, 1500);
    return () => { clearTimeout(leaveTimer); clearTimeout(doneTimer); };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'linear-gradient(160deg, #8b7ae0 0%, #6d5bd0 45%, #55449f 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#ffffff',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: leaving ? 'none' : 'auto',
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
  );
}
