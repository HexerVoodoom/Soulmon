import type { ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import type { AreaId } from '../../navigation';
import { areaNpcVoice } from '../../utils/areaNpcVoice';
import { AREA_NPC_ART } from '../../assets/soulmon/npcs';

/**
 * O MOLDE DE UMA ÁREA (minimal-ui F4) — reusado pelas 6 áreas do Mapa.
 *
 * Espelha `.cena-area`/`.lote`/`.npc-fala` dos mocks aprovados
 * (`product/squad-minimal-ui/propostas/<area>/mock.html`): a área é uma cena
 * cheia (a `AreaTopBar` já entra pelo `App.tsx`, então aqui só o corpo); os
 * "lotes" são construções clicáveis posicionadas em % sobre o fundo; o NPC
 * anfitrião aparece no rodapé, com balão de fala — a fala vem de
 * `areaNpcVoice` (dono único da copy), nunca escrita aqui.
 *
 * `AreaScene` NÃO decide o conteúdo de cada `AreaSheet` — isso é F5. Aqui só
 * o molde: fundo + lotes + NPC + o encaixe do `AreaSheet` quando aberto.
 */
export interface AreaLot {
  id: string;
  /** Rótulo curto sobre o lote (ex.: "ITENS", "TORNEIO"). */
  label: string;
  /** Posição do CENTRO da base do lote, em % da cena. */
  left: string;
  top: string;
  /** O que o leitor de tela anuncia ao focar o botão. */
  ariaLabel: string;
  onOpen: () => void;
  /** Arte isométrica do lote (alfa real). Sem ela, o bloco neutro do molde F4. */
  art?: string;
}

export function AreaScene({ areaId, language, lots, background, children }: {
  areaId: AreaId;
  language: Language;
  lots: AreaLot[];
  /** Fundo pintado da área (9:16, `cover` centrado — minimal-ui F5). Sem ele,
   *  o degradê de tokens do molde F4. */
  background?: string;
  /** O `AreaSheet` aberto, se houver — filho para ficar no mesmo empilhamento da cena. */
  children?: ReactNode;
}) {
  const isPt = language === 'pt-BR';
  const npc = areaNpcVoice(areaId, language);
  return (
    <div
      data-area-scene={areaId}
      style={{
        position: 'relative',
        margin: 'calc(var(--sm2-space-4) * -1)',
        width: 'calc(100% + var(--sm2-space-4) * 2)',
        minHeight: 'calc(100dvh - 96px)',
        overflow: 'hidden',
        // Sem arte de fundo própria ainda (F5/backlog de créditos, ver
        // `docs/design/minimal-ui/BACKLOG-CREDITOS.md`): um degradê dos
        // tokens da própria área faz as vezes de cena até a arte chegar —
        // nunca uma cor inventada fora de `--sm2-*`.
        background: background
          ? `url(${background}) center / cover no-repeat, var(--sm2-bg)`
          : 'radial-gradient(circle at 50% 20%, var(--sm2-surface-2), var(--sm2-bg) 75%)',
      }}
    >
      {/* Os "lotes" — construções clicáveis, uma delas prova o molde (F4); o
          conteúdo completo por área é F5. */}
      {lots.map(lot => (
        <button
          key={lot.id}
          type="button"
          data-area-lot={lot.id}
          onClick={lot.onOpen}
          aria-label={lot.ariaLabel}
          style={{
            position: 'absolute',
            left: lot.left, top: lot.top,
            transform: 'translate(-50%, -80%)',
            width: '38%',
            minWidth: 120,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          {lot.art ? (
            <img
              src={lot.art}
              alt=""
              aria-hidden="true"
              data-area-lot-art
              style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.55))' }}
            />
          ) : <span
            aria-hidden="true"
            style={{
              width: '100%', aspectRatio: '1 / 1',
              borderRadius: 'var(--sm2-radius-md)',
              border: '2px solid var(--sm2-line)',
              background: 'var(--sm2-surface)',
              boxShadow: '0 6px 6px rgba(0,0,0,.35)',
            }}
          />}
          <span
            data-area-lot-label
            style={{
              marginTop: -4,
              padding: '2px 9px',
              borderRadius: 999,
              background: 'rgba(8,25,26,.85)',
              border: '1px solid rgba(95,243,224,.35)',
              fontFamily: 'var(--sm2-font-display)',
              fontSize: 'var(--sm2-text-xs)',
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: '#E9F5F2',
              textAlign: 'center',
            }}
          >
            {lot.label}
          </span>
        </button>
      ))}

      {/* NPC anfitrião + balão de fala, no rodapé da cena — mesma posição do
          mock (`.npc-fala`). Fica ATRÁS do `AreaSheet` (z-index menor). */}
      <div
        data-area-npc
        style={{
          position: 'absolute', zIndex: 1,
          left: 12, right: 12, bottom: 16,
          display: 'flex', alignItems: 'flex-end', gap: 8,
        }}
      >
        <img
          src={AREA_NPC_ART[areaId]}
          alt=""
          aria-hidden="true"
          style={{
            width: 180, flex: 'none',
            marginLeft: -14, marginRight: -20,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.6))',
          }}
        />
        <p
          style={{
            position: 'relative', zIndex: 1,
            margin: '0 0 60px',
            padding: '14px 16px',
            background: 'rgba(15,42,41,.96)',
            border: '2px solid var(--sm2-gold-fill)',
            borderRadius: '14px 14px 14px 2px',
            font: '500 15px/1.45 var(--sm2-font-text)',
            color: '#E9F5F2',
            boxShadow: '0 6px 14px rgba(0,0,0,.45)',
          }}
        >
          <b style={{ display: 'block', marginBottom: 4, fontSize: 13, letterSpacing: '0.06em', color: 'var(--sm2-gold-ink)' }}>
            {npc.name}
          </b>
          {npc.line}
        </p>
      </div>

      {lots.length === 0 && (
        <p
          style={{
            position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
            width: '80%', textAlign: 'center',
            color: 'var(--sm2-muted, var(--sm2-ink))', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
          }}
        >
          {isPt ? 'Em breve, mais coisas por aqui.' : 'More things coming here soon.'}
        </p>
      )}

      {children}
    </div>
  );
}
