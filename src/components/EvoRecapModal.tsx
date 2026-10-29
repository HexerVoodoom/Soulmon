import { useEffect, useState } from 'react';
import type { Language } from '../utils/i18n';
import type { EvoRecap } from '../utils/evoRecap';
import { sm2Button, sm2Hint } from './form/FormKit';
import { RitualDialog, ritualLabel } from './ritual/RitualKit';
import { SoulFragmentIcon } from './ui/SoulFragmentIcon';

/**
 * O RECAP DA EVOLUÇÃO — a 2ª página do resumo da manhã (REGISTRO §190).
 * Só mostra: a barra sai do que estava ontem, enche com brilho até o de hoje, e três números (antes, ganho, falta).
 * Movimento: a largura transiciona via CSS e o brilho pulsa uma vez (`sm2-evo-recap-*` em index.css); com
 * `prefers-reduced-motion` a regra global do arquivo zera as durações e a barra salta ao valor final.
 * Sem culpa: a tela só existe quando houve progresso (`buildEvoRecap`), então nunca precisa dizer "faltou".
 */
export function EvoRecapModal({ recap, language, onClose }: { recap: EvoRecap; language: Language; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  const shown = filled ? recap.afterPct : recap.beforePct;
  const headline = recap.full
    ? (isPt ? 'Barra cheia!' : 'Bar full!')
    : (isPt ? 'Sua evolução avançou' : 'Your evolution moved forward');
  const tail = recap.full
    ? (isPt ? 'Ela evolui na próxima virada do dia.' : 'It evolves at the next turn of the day.')
    : (isPt ? `Faltam ${recap.left} para evoluir.` : `${recap.left} to go until evolution.`);
  const cell = { display: 'grid', gap: 2, textAlign: 'center' as const };
  const big = { fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-md)', color: 'var(--sm2-ink)', margin: 0 };
  return (
    <RitualDialog label={headline} onClose={onClose} maxWidth={320} closeLabel={isPt ? 'Fechar' : 'Close'} theme="light">
      <p style={{ ...sm2Hint, margin: '0 36px', textAlign: 'center', color: 'var(--sm2-ink)', fontWeight: 500 }}>{headline}</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}><SoulFragmentIcon size={40} /></div>
      <div
        role="progressbar"
        aria-label={headline}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={recap.afterPct}
        data-evo-recap-track
        style={{ position: 'relative', height: 14, borderRadius: 7, overflow: 'hidden', background: 'var(--sm2-surface-2)', border: '1px solid var(--sm2-line)' }}
      >
        <div
          aria-hidden="true"
          data-evo-recap-fill
          data-filled={filled ? 'true' : 'false'}
          className={filled ? 'sm2-evo-recap-fill sm2-evo-recap-glow' : 'sm2-evo-recap-fill'}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${shown}%`, background: 'var(--sm2-primary-fill)', borderRadius: 7 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={cell}>
          <p style={ritualLabel}>{isPt ? 'Ontem' : 'Yesterday'}</p>
          <p style={big} data-evo-recap-before>{recap.beforePct}%</p>
        </div>
        <div style={cell}>
          <p style={ritualLabel}>{isPt ? 'Agora' : 'Now'}</p>
          <p style={{ ...big, color: 'var(--sm2-primary-ink)' }} data-evo-recap-after>{recap.afterPct}%</p>
        </div>
      </div>
      <p style={{ ...sm2Hint, textAlign: 'center', color: 'var(--sm2-primary-ink)', fontWeight: 600 }} data-evo-recap-delta>
        {isPt ? `+${recap.deltaPct}% desde ontem` : `+${recap.deltaPct}% since yesterday`}
      </p>
      <p style={{ ...sm2Hint, textAlign: 'center' }} data-evo-recap-left>{tail}</p>
      <div style={{ paddingTop: 4 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Seguir' : 'Continue'}
        </button>
      </div>
    </RitualDialog>
  );
}

export default EvoRecapModal;
