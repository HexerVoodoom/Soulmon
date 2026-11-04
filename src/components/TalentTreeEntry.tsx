/**
 * A ENTRADA da árvore de talentos na `StatsPage` (Santuário do Vínculo, 04/11/2026, pedido do dono): no lugar da árvore INLINE (que ocupava a
 * tela toda de rolagem) fica um cartão curto — o título, quantos pontos há para gastar e um botão que abre a árvore em TELA CHEIA.
 * Com pontos livres o cartão acende um indicador (o mesmo ícone do disco sobre o prédio, `nav/LotIndicator`). A árvore em si (`TalentTreeCard` →
 * `TalentTree`) segue `lazy`: nada dela entra no chunk da página até a pessoa abrir. O voltar do sistema e o Esc fecham a tela cheia.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { talentPointsFree } from '../utils/lotIndicators';
import { useBackLayer } from '../utils/backStack';
import { Icon } from './ui/Icon';
import { LotIndicator } from './nav/LotIndicator';
import { ScreenSkeleton } from './ui/ScreenSkeleton';

const TalentTreeCard = lazy(() => import('./TalentTreeCard'));

export default function TalentTreeEntry({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => opener.current?.focus()); };
  useBackLayer(open, close);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  if (!ctx) return null; // sem save (demo, testes): não há o que gastar
  const isPt = language === 'pt-BR';
  const free = talentPointsFree(ctx.gameState);
  const title = isPt ? 'Talentos do Vínculo' : 'Bond talents';

  return (
    <section className="sm2-stats-card" aria-labelledby="sm2-talent-entry" data-talent-entry>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <p id="sm2-talent-entry" className="sm2-stats-lab" style={{ margin: 0, flex: 1 }}>{title}</p>
        {free > 0 && <LotIndicator kind="talent" isPt={isPt} size={28} />}
      </div>
      <p className="sm2-stats-s" data-talent-free aria-live="polite">
        {free > 0
          ? (isPt ? `${free} ${free === 1 ? 'ponto disponível' : 'pontos disponíveis'}` : `${free} ${free === 1 ? 'point' : 'points'} available`)
          : (isPt ? 'Nenhum ponto livre agora.' : 'No free points right now.')}
      </p>
      <button ref={opener} type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" data-talent-open aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {isPt ? 'Abrir árvore de talentos' : 'Open talent tree'}
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={title} data-talent-fullscreen
          style={{ position: 'fixed', inset: 0, zIndex: 7000, display: 'flex', flexDirection: 'column', background: 'var(--sm2-bg)', color: 'var(--sm2-ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--sm2-line)', flex: 'none' }}>
            <button type="button" data-talent-close className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-quiet" onClick={close}
              aria-label={isPt ? 'Voltar' : 'Back'} style={{ minWidth: 44, minHeight: 44 }} autoFocus>
              <Icon name="arrow_back" size={24} />
            </button>
            <span className="sm2-stats-lab" style={{ margin: 0, flex: 1 }}>{title}</span>
            {free > 0 && <span className="sm2-stats-s sm2-num" data-talent-free-top>{isPt ? `${free} livre${free === 1 ? '' : 's'}` : `${free} free`}</span>}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
            <Suspense fallback={<ScreenSkeleton language={isPt ? 'pt-BR' : 'en-US'} variant="inline" />}>
              <TalentTreeCard language={language} />
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}
