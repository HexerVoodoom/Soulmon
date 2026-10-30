import { useEffect, useState } from 'react';
import type { Language } from '../utils/i18n';
import type { EvoRecap } from '../utils/evoRecap';
import { sm2Button, sm2Hint } from './form/FormKit';
import { RitualDialog, ritualLabel } from './ritual/RitualKit';
import barraMoldura from '../assets/soulmon/evo/barra-moldura.png';
import lanterna1 from '../assets/soulmon/evo/lanterna-1.png';
import lanterna2 from '../assets/soulmon/evo/lanterna-2.png';
import lanterna3 from '../assets/soulmon/evo/lanterna-3.png';

/** O ícone da evolução É A LANTERNA do corvo (30/10/2026, dono): a chama cresce com a barra até o Soulmon evoluir. */
export const lanternaDaEvolucao = (pct: number): string => (pct < 34 ? lanterna1 : pct < 67 ? lanterna2 : lanterna3);

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
      {/* A lanterna do corvo: a chama de dentro acompanha a barra (pequena, média, grande). */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <img src={lanternaDaEvolucao(shown)} alt="" aria-hidden="true" data-evo-recap-icon width={56} height={56} style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 6px rgba(63,240,224,.55))' }} />
      </div>
      {/* A barra (30/10/2026, dono): moldura de cobre em PNG (480×128, canal interno x 44–453, y 52–68) e o preenchimento turquesa
          com glow dentro do canal. As porcentagens abaixo são as do canal medido na arte. */}
      <div
        role="progressbar"
        aria-label={headline}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={recap.afterPct}
        data-evo-recap-track
        style={{ position: 'relative', width: '100%', aspectRatio: '480 / 128', margin: '-14px 0' }}
      >
        <img src={barraMoldura} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none' }} />
        <div aria-hidden="true" style={{ position: 'absolute', left: '9.17%', right: '5.62%', top: '40.6%', height: '13.3%', borderRadius: 3, overflow: 'visible' }}>
          <div
            aria-hidden="true"
            data-evo-recap-fill
            data-filled={filled ? 'true' : 'false'}
            className={filled ? 'sm2-evo-recap-fill sm2-evo-recap-glow' : 'sm2-evo-recap-fill'}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${shown}%`, borderRadius: 3 }}
          />
        </div>
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
