import type { Language } from '../../../utils/i18n';

/** Antes do opening, só para quem ainda não escolheu o idioma (dono, 05/11/2026): escolhe e a abertura toca nesse idioma. Sempre em inglês, como o modal do onboarding. */
export function SeletorIdiomaAbertura({ onEscolher }: { onEscolher: (l: Language) => void }) {
  return (
    <div data-testid="abertura-idioma" style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', background: '#000', color: '#fff' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="abertura-idioma-titulo" style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        <h2 id="abertura-idioma-titulo" style={{ margin: 0, fontSize: 22 }}>Choose your language</h2>
        <p style={{ margin: '0 0 6px', opacity: 0.7, fontSize: 14 }}>You can change it later in Settings.</p>
        {(['en-US', 'pt-BR'] as const).map(l => (
          <button key={l} type="button" lang={l === 'pt-BR' ? 'pt' : 'en'} onClick={() => onEscolher(l)}
            style={{ width: '100%', padding: '12px 16px', fontSize: 16, color: '#fff', background: 'transparent', border: '1px solid #fff8', borderRadius: 10, cursor: 'pointer' }}>
            {l === 'pt-BR' ? 'Português' : 'English'}
          </button>
        ))}
      </div>
    </div>
  );
}
