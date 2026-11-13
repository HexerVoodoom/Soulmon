import type { Language } from '../../../utils/i18n';

/** Antes do opening, só para quem ainda não escolheu o idioma (dono, 05/11/2026): escolhe e a abertura toca nesse idioma. Sempre em inglês, como o modal do onboarding.
 *  Alvo >= 48px e estado pressionado no CSS (`.sm2-idioma-opcao`, index.css): o toque precisa responder na hora (bug 13/11/2026). */
/* Pressionado direto no DOM, sem render: o `:active` do toque no Chromium espera a detecção de gesto e pode nem pintar. */
const pressionar = (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.dataset.pressed = ''; };
const soltar = (e: React.PointerEvent<HTMLButtonElement>) => { delete e.currentTarget.dataset.pressed; };

export function SeletorIdiomaAbertura({ onEscolher }: { onEscolher: (l: Language) => void }) {
  return (
    <div data-testid="abertura-idioma" style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', background: '#000', color: '#fff' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="abertura-idioma-titulo" style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        <h2 id="abertura-idioma-titulo" style={{ margin: 0, fontSize: 'var(--sm2-text-lg)' }}>Choose your language</h2>
        <p style={{ margin: '0 0 6px', opacity: 0.7, fontSize: 'var(--sm2-text-sm)' }}>You can change it later in Settings.</p>
        {(['en-US', 'pt-BR'] as const).map(l => (
          <button key={l} type="button" lang={l === 'pt-BR' ? 'pt' : 'en'} className="sm2-idioma-opcao" onClick={() => onEscolher(l)}
            onPointerDown={pressionar} onPointerUp={soltar} onPointerCancel={soltar} onPointerLeave={soltar}
            style={{ width: '100%', minHeight: 48, padding: '12px 16px', fontSize: 'var(--sm2-text-md)', color: '#fff', background: 'transparent', border: '1px solid #fff8', borderRadius: 10, cursor: 'pointer' }}>
            {l === 'pt-BR' ? 'Português' : 'English'}
          </button>
        ))}
      </div>
    </div>
  );
}
