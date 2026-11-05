import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../utils/i18n';
import { AREAS, areaLabel, type AreaId } from '../../navigation';
import { bitsStyle, emblemStyle, CREDIT_COLOR } from '../../utils/currencies';
import { BitsAmount } from '../ui/BitsAmount';
import { LockBadge, LockNotice, lockLabel } from '../ui/LockBadge';
import { areaLockedAt, buildingLockLine } from '../../utils/gates';

import bgMapa from '../../assets/soulmon/mapa/bg-mapa.png';
import { CHIP_MOEDA_ART, CHIP_MOEDA_SLICE } from '../../assets/soulmon/icones-ui';
import { MAPA_MUNDO_PINTADO, MAPA_PALCO_STYLE } from '../../utils/areaLotGeometry';

/** A pílula de moeda: moldura `chip-moeda` em 9-slice. A arte tem 256×92 e é
 *  desenhada a 1/3 (tampas de 16px, bordas de 6px) — a altura final fica
 *  ~30px com uma linha de `text-sm`. `fill` pinta o miolo teal escuro. */
const S = CHIP_MOEDA_SLICE;
const CHIP: import('react').CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 88,
  padding: '1px 4px',
  borderStyle: 'solid',
  borderWidth: `${S.top / 3}px ${S.right / 3}px ${S.bottom / 3}px ${S.left / 3}px`,
  borderImage: `url(${CHIP_MOEDA_ART}) ${S.top} ${S.right} ${S.bottom} ${S.left} fill / ${S.top / 3}px ${S.right / 3}px ${S.bottom / 3}px ${S.left / 3}px stretch`,
  lineHeight: 1.2,
};

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
 * O saldo das 3 moedas é um menu discreto no canto inferior direito, dentro da própria cena —
 * não uma lista separada. Formatação e cor vêm de `utils/currencies.ts`
 * (dono único: nenhuma moeda pode ser confundida com outra).
 */
/** O cristal central pintado no mapa-mundo, em % da imagem. */
const CRISTAL = [46, 30, 62, 43] as const;

export function MapPage({ language, onOpenArea, onSecretoGuilda, bits, emblems, credits, bondLevel }: {
  language: Language;
  /** O Vínculo do usuário: a área só trava se TODOS os prédios dela travam (`areaMinBond`). Sem ele, nada trava. */
  bondLevel?: number;
  onOpenArea: (id: AreaId) => void;
  /** Segurar o cristal central por 3 s (a entrada SECRETA da Guilda dos Mercenários): nenhum feedback, nenhuma pista. */
  onSecretoGuilda?: () => void;
  bits: number;
  emblems: number;
  credits: number;
}) {
  const isPt = language === 'pt-BR';
  const [lockNote, setLockNote] = useState<string | null>(null);
  const segurando = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soltar = () => { if (segurando.current) clearTimeout(segurando.current); segurando.current = null; };
  useEffect(() => soltar, []);
  useEffect(() => {
    if (!lockNote) return;
    const t = setTimeout(() => setLockNote(null), 5000);
    return () => clearTimeout(t);
  }, [lockNote]);
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

      {/* Fundo 9:16, cobrindo — object-fit: cover centrado. */}
      <img
        src={bgMapa}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
        }}
      />

      {/* Vinheta leve no canto superior esquerdo — onde mora o link da Home (B2). */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, width: '48%', height: '28%',
          background: 'radial-gradient(circle at 0% 0%, rgba(4,10,10,.55), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Saldo das 3 moedas — canto INFERIOR direito (espelho do link da
          Home, no esquerdo). ⚠️ Morava no canto superior direito e a arte do
          "Jogos" pintava POR CIMA dele (fix1). Cada moeda é uma pílula com a
          moldura `chip-moeda` do squad de arte (cobre + cristais, miolo teal
          escuro opaco) em 9-slice via `border-image` — a pílula estica com o
          texto sem deformar as tampas, e o miolo opaco segura o contraste
          sobre qualquer trecho da arte. É moldura de TEXTO, não de ícone — a
          regra "ícone nunca dentro de box" não se aplica. */}
      <div
        data-map-currencies
        style={{
          position: 'absolute',
          right: 'var(--sm2-space-3)',
          bottom: 'calc(var(--sm2-space-3) + env(safe-area-inset-bottom, 0px))',
          zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          gap: 4,
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.5))',
        }}
      >
        <span data-map-chip aria-label={`${bits} Bits`} style={{ ...CHIP, ...bitsStyle, fontSize: 'var(--sm2-text-sm)' }}>
          <BitsAmount value={bits} size={16} />
        </span>
        <span data-map-chip aria-label={isPt ? `${emblems} de Honra` : `${emblems} Honor`} style={{ ...CHIP, ...emblemStyle, fontSize: 'var(--sm2-text-sm)' }}>
          {/* O número vai na fonte de texto: o 0 do Cinzel é um "O" e lia-se "o Honra" (QA L05-08). */}
          <span style={{ fontFamily: 'var(--sm2-font-text)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{emblems}</span> {isPt ? 'Honra' : 'Honor'}
        </span>
        <span
          data-map-chip
          aria-label={isPt ? `${credits} Créditos` : `${credits} Credits`}
          style={{ ...CHIP, color: CREDIT_COLOR, fontFamily: 'var(--sm2-font-text)', fontWeight: 700, fontSize: 'var(--sm2-text-sm)', fontVariantNumeric: 'tabular-nums' }}
        >
          <span style={{ fontFamily: 'var(--sm2-font-text)', fontVariantNumeric: 'lining-nums tabular-nums' }}>{credits}</span> {isPt ? 'Créditos' : 'Credits'}
        </span>
      </div>

      {/* Os distritos vêm pintados no fundo (05/11/2026): cada botão é só o alvo de toque e o rótulo, no palco da imagem. */}
      <div style={{ position: 'absolute', inset: 0, containerType: 'size', pointerEvents: 'none' }}>
        <div style={MAPA_PALCO_STYLE}>
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
      {lockNote && <LockNotice text={lockNote} />}
    </section>
  );
}
