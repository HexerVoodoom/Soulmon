import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../utils/i18n';
import { AREAS, areaLabel, type AreaId } from '../../navigation';
import { TopStatusBar } from './TopStatusBar';
import { LockBadge, LockNotice, lockLabel } from '../ui/LockBadge';
import { areaLockedAt, buildingLockLine } from '../../utils/gates';

import bgMapa from '../../assets/soulmon/mapa/bg-mapa.png';
import { MAPA_MUNDO_PINTADO, MAPA_PALCO_CONTAIN_STYLE, MAPA_AJUSTE_ESCALA } from '../../utils/areaLotGeometry';

/**
 * O MAPA — arte real (minimal-ui F3).
 *
 * Fundo 9:16 isométrico (`bg-mapa`, D2: pixel art liberada fora do visor)
 * cobrindo a tela inteira (`object-fit: cover`, centrado); as 6 construções
 * são posicionadas em PORCENTAGEM sobre esse fundo — a mesma técnica do mock
 * aprovado (`product/squad-minimal-ui/propostas/mapa/mock.html`), para a
 * posição não depender do tamanho físico da imagem. Cada construção é um
 * `<button>` (não link) que chama `onOpenArea`; o roteamento em si é de
 * `navigation.ts`, um dono só.
 *
 * O canto SUPERIOR esquerdo é vinhetado (B2, 02/10/2026) (mesmo truque do mock: um gradiente
 * radial escurecendo, para o link da Home — `CornerLink glow` — se destacar
 * sem caixa em volta).
 *
 * O saldo (Corações, Energia, Créditos, Honra, Bits) é a barrinha fixa do topo (`TopStatusBar`, 24/11/2026) — não mais as 3 pílulas do canto inferior direito.
 */
/** O cristal central pintado no mapa-mundo, em % da imagem. */
const CRISTAL = [46, 30, 62, 43] as const;

export function MapPage({ language, onOpenArea, onSecretoGuilda, bits, emblems, credits, energy = 0, maxEnergy = 0, bondLevel }: {
  language: Language;
  /** O Vínculo do usuário: a área só trava se TODOS os prédios dela travam (`areaMinBond`). Sem ele, nada trava. */
  bondLevel?: number;
  onOpenArea: (id: AreaId) => void;
  /** Segurar o cristal central por 3 s (a entrada SECRETA da Guilda dos Mercenários): nenhum feedback, nenhuma pista. */
  onSecretoGuilda?: () => void;
  bits: number;
  emblems: number;
  credits: number;
  /** Energia de agora (+ teto) para a barrinha do topo. */
  energy?: number;
  maxEnergy?: number;
}) {
  const isPt = language === 'pt-BR';
  const [lockNote, setLockNote] = useState<string | null>(null);
  const segurando = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soltar = () => { if (segurando.current) clearTimeout(segurando.current); segurando.current = null; };
  useEffect(() => soltar, []);
  return (
    <section
      aria-labelledby="sm-map-title"
      data-map-page
      style={{
        position: 'relative', zIndex: 0, isolation: 'isolate',
        width: '100%', height: '100%', minHeight: 0,
        margin: 0,
        overflow: 'hidden',
        borderRadius: 0,
      }}
    >
      <h1 id="sm-map-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {isPt ? 'Mapa' : 'Map'}
      </h1>

      {/* Vinheta leve no canto superior esquerdo — onde mora o link da Home (B2). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, width: '48%', height: '28%',
          background: 'radial-gradient(circle at 0% 0%, rgba(4,10,10,.55), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* A BARRINHA DO TOPO (P2, 24/11/2026): Corações | Energia à esquerda; Créditos | Honra | Bits à direita, cada valor na bordinha de bronze (`TopStatusBar`). Ocupou o lugar das 3 pílulas do canto inferior direito (⚰️, #1216). */}
      <TopStatusBar data={{ language, credits, emblems, bits, energy, maxEnergy }} />

      {/* Os distritos vêm pintados no fundo (05/11/2026): cada botão é só o alvo de toque e o rótulo, no palco da imagem. */}
      {/* O espaço livre: do fim da barrinha (`--sm2-topbar-push`) à base da tela (safe-area inferior); a imagem entra inteira (contain) e centrada ali. */}
      <div data-map-livre style={{ position: 'absolute', left: 0, right: 0, top: 'var(--sm2-topbar-push, 0px)', bottom: 'var(--sm2-map-bottom, env(safe-area-inset-bottom, 0px))', containerType: 'size', pointerEvents: 'none' }}>
        {/* O fundo mora DENTRO do palco: imagem e alvos crescem juntos, ancorados na borda direita (simetria lateral, ver MAPA_AJUSTE_ESCALA). */}
        <div style={{ ...MAPA_PALCO_CONTAIN_STYLE, transform: `translate(-50%, -50%) scale(${MAPA_AJUSTE_ESCALA})`, transformOrigin: '100% 50%' }}>
          <img
            src={bgMapa}
            alt=""
            aria-hidden="true"
            data-map-bg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
          />
          {/* Secreto de propósito (dono, 05/11/2026): sem botão, rótulo, cursor ou resposta visual. */}
          <div
            data-map-cristal
            aria-hidden="true"
            onPointerDown={() => { soltar(); segurando.current = setTimeout(() => onSecretoGuilda?.(), 3000); }}
            onPointerUp={soltar}
            onPointerLeave={soltar}
            onPointerCancel={soltar}
            onContextMenu={e => e.preventDefault()}
            style={{ position: 'absolute', left: `${CRISTAL[0]}%`, top: `${CRISTAL[1]}%`, width: `${CRISTAL[2] - CRISTAL[0]}%`, height: `${CRISTAL[3] - CRISTAL[1]}%`, pointerEvents: 'auto', WebkitTouchCallout: 'none', userSelect: 'none' }}
          />
          {AREAS.map(id => {
            const b = MAPA_MUNDO_PINTADO[id];
            const locked = areaLockedAt(id, bondLevel);
            return (
              <button
                key={id}
                type="button"
                data-map-area={id}
                onClick={() => (locked ? setLockNote(buildingLockLine(locked, language)) : onOpenArea(id))}
                aria-label={locked ? `${areaLabel(id, isPt)}. ${lockLabel(locked, language)}` : areaLabel(id, isPt)}
                data-map-locked={locked ?? undefined}
                style={{
                  position: 'absolute', left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2] - b[0]}%`, height: `${b[3] - b[1]}%`,
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
                }}
              >
                {locked && (
                  <span style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                    <LockBadge minBond={locked} language={language} />
                  </span>
                )}
                <span
                  data-map-label
                  style={{
                    position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', width: 'max-content',
                    padding: '2px 9px',
                    borderRadius: 999,
                    background: 'rgba(8,25,26,.82)',
                    border: '1px solid rgba(95,243,224,.35)',
                    fontFamily: 'var(--sm2-font-display)',
                    fontSize: 'var(--sm2-text-xs)',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    // Fixo, não o token de tema: o fundo do rótulo é sempre escuro translúcido, nos dois temas.
                    color: '#E9F5F2',
                    textAlign: 'center',
                  }}
                >
                  {areaLabel(id, isPt)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {lockNote && <LockNotice text={lockNote} onClose={() => setLockNote(null)} closeLabel={isPt ? 'Fechar aviso' : 'Close notice'} />}
    </section>
  );
}
