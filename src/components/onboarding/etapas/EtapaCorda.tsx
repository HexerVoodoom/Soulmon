import { useRef } from 'react';
import type { Language } from '../../../utils/i18n';
import { ArteIntro } from '../sequencia/ArteIntro';
import { FALANTE, INTRO, t as tx, UI } from '../sequencia/copy';

/** Cena 6 (D-10): a voz de cima (balão no ALTO da cena) e UM botão, "Subir". Sem outra saída. */
export function EtapaCorda({ onDone, language = 'pt-BR' }: { onDone: () => void; language?: Language }) {
  const feito = useRef(false);
  const subir = () => { if (!feito.current) { feito.current = true; onDone(); } };
  return (
    <div data-etapa="corda" style={{ position: 'absolute', inset: 0, overflow: 'hidden', color: '#f2f2f2' }}>
      <ArteIntro k="bg-penhasco-topo" language={language} extra={{ position: 'absolute', inset: 0 }} />
      <div role="status" aria-live="polite" data-testid="balao-alto"
        style={{ position: 'absolute', top: 24, left: 16, right: 16, padding: '12px 14px', background: 'rgba(0,0,0,.72)', border: '1px solid #3b4a4f', borderRadius: 6, fontSize: 'var(--sm2-text-md)', lineHeight: 1.4 }}>
        <b style={{ display: 'block', fontSize: 'var(--sm2-text-xs)', letterSpacing: '0.06em', marginBottom: 4 }}>{tx(FALANTE.mao, language)}</b>
        <p style={{ margin: 0 }}>{tx(INTRO.suba, language)}</p>
      </div>
      <button type="button" onClick={subir}
        style={{ position: 'absolute', left: '50%', bottom: 32, transform: 'translateX(-50%)', minHeight: 52, minWidth: 160, borderRadius: 8, border: '1px solid #4a6068', background: '#1d2b2f', color: '#f2f2f2', fontSize: 'var(--sm2-text-lg)' }}>
        {tx(UI.subir, language)}
      </button>
    </div>
  );
}

export default EtapaCorda;
