import { useEffect, useState } from 'react';
import { PixelIcon } from '../ui/PixelIcon';
import { SM2_SHADOW_CARD } from '../form/FormKit';

/**
 * Modal entre rodadas da Arena (04/11/2026, dono): identidade do Soulmon no lugar da caixa crua.
 * Fundo = o próprio cenário da run, só escurecido (nada de tela preta). A vida aparece como 3 corações
 * (cada um = 1/3 do HP) que enchem do "antes" ao "depois", e o botão é o chamado para a próxima luta.
 */
const HEARTS = 3;
const CSS = `
@keyframes arena-cura-in{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes arena-cura-bg{from{opacity:0}to{opacity:1}}
@keyframes arena-cura-pulse{0%,100%{transform:scale(1)}40%{transform:scale(1.18)}}
@keyframes arena-cura-cta{0%,100%{box-shadow:0 0 0 0 rgba(63,210,217,.55)}50%{box-shadow:0 0 0 8px rgba(63,210,217,0)}}
@media (prefers-reduced-motion: reduce){[data-arena-cura-modal] *{animation:none!important;transition:none!important}}
`;

interface Props {
  isPt: boolean;
  /** HP em fração (0..1) antes e depois do fôlego. */
  antes: number;
  depois: number;
  /** HP recuperado em pontos. */
  pontos: number;
  scene?: string;
  rodada: number;
  totalRodadas: number;
  onNext: () => void;
}

export function ArenaCuraModal({ isPt, antes, depois, pontos, scene, rodada, totalRodadas, onNext }: Props) {
  const [cheio, setCheio] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCheio(true), 350); return () => clearTimeout(t); }, []);
  const hp = cheio ? depois : antes;
  const fill = (k: number) => Math.max(0, Math.min(1, hp * HEARTS - k));
  return (
    <div data-arena-cura-modal data-cena={scene || undefined} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      background: scene ? `linear-gradient(rgba(6,12,16,.5), rgba(6,12,16,.72)), url(${scene}) center/cover #0b1220` : 'rgba(6,12,16,.72)', animation: 'arena-cura-bg .25s ease-out both' }}>
      <style>{CSS}</style>
      <div role="dialog" aria-modal="true" aria-labelledby="arena-cura-titulo"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 320, padding: '20px 18px 18px', borderRadius: 16,
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--sm2-surface) 92%, #3fd2d9), var(--sm2-surface))',
          border: '1px solid color-mix(in srgb, var(--sm2-line) 50%, #3fd2d9)', boxShadow: `${SM2_SHADOW_CARD}, 0 0 28px rgba(63,210,217,.18)`, animation: 'arena-cura-in .35s ease-out both' }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--sm2-ink-2, var(--sm2-ink))', opacity: .75 }}>
          {isPt ? `Rodada ${rodada} de ${totalRodadas} vencida` : `Round ${rodada} of ${totalRodadas} cleared`}
        </p>
        <p id="arena-cura-titulo" style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--sm2-ink)', textAlign: 'center' }}>
          {isPt ? 'Fôlego recuperado' : 'Second wind'}
        </p>
        <div role="img" aria-label={isPt ? `Vida em ${Math.round(depois * 100)}%` : `Health at ${Math.round(depois * 100)}%`} data-arena-cura-coracoes
          style={{ display: 'flex', gap: 10, padding: '4px 0' }}>
          {Array.from({ length: HEARTS }, (_, k) => {
            const f = fill(k);
            const ganhou = cheio && fill(k) > Math.max(0, Math.min(1, antes * HEARTS - k)) + 1e-6;
            return (
              <span key={k} data-heart-fill={f.toFixed(2)} style={{ position: 'relative', width: 44, height: 44, lineHeight: 0,
                animation: ganhou ? `arena-cura-pulse .45s ease-out ${0.9 + k * 0.12}s both` : undefined }}>
                <PixelIcon name="hp" size={44} style={{ position: 'absolute', inset: 0, filter: 'grayscale(1) brightness(.32)' }} />
                <span style={{ position: 'absolute', inset: 0, clipPath: `inset(${(1 - f) * 100}% 0 0 0)`, transition: `clip-path .9s cubic-bezier(.3,.7,.2,1) ${k * 0.12}s` }}>
                  <PixelIcon name="hp" size={44} />
                </span>
              </span>
            );
          })}
        </div>
        <p className="sm2-num" style={{ margin: 0, fontSize: 15, color: 'var(--sm2-ink)', textAlign: 'center' }}>
          {isPt ? <>Você recuperou <b style={{ color: '#ff6b7a' }}>+{pontos}</b> de vida</> : <>You recovered <b style={{ color: '#ff6b7a' }}>+{pontos}</b> health</>}
        </p>
        <button type="button" data-arena-proxima onClick={onNext} aria-label={isPt ? 'Pronto pro combate' : 'Ready to fight'}
          style={{ marginTop: 4, width: '100%', minHeight: 52, border: 0, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'linear-gradient(180deg, #4fe3ea, #1f9aa3)', color: '#04161a', fontFamily: 'var(--sm2-font-display)', fontWeight: 800, fontSize: 17, letterSpacing: '.1em', textTransform: 'uppercase',
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.45)', animation: 'arena-cura-cta 1.6s ease-in-out 1.2s infinite' }}>
          <span aria-hidden="true">⚔</span>
          {isPt ? 'Pronto pro combate' : 'Ready to fight'}
        </button>
      </div>
    </div>
  );
}
