import { useRef } from 'react';
import type { Language } from '../../../utils/i18n';

/** Antes do opening, só para quem ainda não escolheu o idioma (dono, 05/11/2026): escolhe e a abertura toca nesse idioma. Sempre em inglês, como o modal do onboarding.
 *  Alvo >= 48px e estado pressionado no CSS (`.sm2-idioma-opcao`, index.css): o toque precisa responder na hora (bug 13/11/2026). */
/* Pressionado direto no DOM, sem render: o `:active` do toque no Chromium espera a detecção de gesto e pode nem pintar. */
const pressionar = (e: React.PointerEvent<HTMLButtonElement>) => { e.currentTarget.dataset.pressed = ''; };
const soltar = (e: React.PointerEvent<HTMLButtonElement>) => { delete e.currentTarget.dataset.pressed; };
/** O dedo saiu do botão em cima dele? (soltar fora do botão = desistiu, como num botão nativo) */
const soltouDentro = (e: React.PointerEvent<HTMLButtonElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
};

export function SeletorIdiomaAbertura({ onEscolher }: { onEscolher: (l: Language) => void }) {
  /* A escolha vale UMA vez por montagem: o toque chega pelo `pointerup` e depois pelo `click` sintetizado. */
  const escolhido = useRef(false);
  const escolher = (l: Language) => {
    if (escolhido.current) return;
    escolhido.current = true;
    onEscolher(l);
  };
  return (
    <div data-testid="abertura-idioma" style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box', background: '#000', color: '#fff' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="abertura-idioma-titulo" style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
        <h2 id="abertura-idioma-titulo" style={{ margin: 0, fontSize: 'var(--sm2-text-lg)' }}>Choose your language</h2>
        <p style={{ margin: '0 0 6px', opacity: 0.7, fontSize: 'var(--sm2-text-sm)' }}>You can change it later in Settings.</p>
        {(['en-US', 'pt-BR'] as const).map(l => (
          /* Toque escolhe no `pointerup` (bug 13/11/2026, 2ª rodada): o `click` de toque só nasce se o Chromium reconhecer um
             TAP. Dedo que anda além da folga vira gesto de rolagem: chega `pointercancel` e nenhum `click`, e o toque "não pega"
             (medido: 20 px de arrasto = nenhuma escolha). Com `touch-action: none` no botão (index.css) o navegador não toma o
             gesto e o `pointerup` sempre chega. Mouse e teclado continuam pelo `click`. */
          <button key={l} type="button" lang={l === 'pt-BR' ? 'pt' : 'en'} className="sm2-idioma-opcao" onClick={() => escolher(l)}
            onPointerDown={pressionar} onPointerCancel={soltar} onPointerLeave={soltar}
            onPointerUp={e => { soltar(e); if (e.pointerType !== 'mouse' && soltouDentro(e)) escolher(l); }}
            style={{ width: '100%', minHeight: 48, padding: '12px 16px', fontSize: 'var(--sm2-text-md)', color: '#fff', background: 'transparent', border: '1px solid #fff8', borderRadius: 10, cursor: 'pointer' }}>
            {l === 'pt-BR' ? 'Português' : 'English'}
          </button>
        ))}
      </div>
    </div>
  );
}
