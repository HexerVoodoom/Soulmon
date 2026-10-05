import type { ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import { lotNpcVoice } from '../../utils/areaNpcVoice';
import { NpcSpeech } from './NpcSpeech';
import { useBackLayer } from '../../utils/backStack';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { NPC_MAX_WIDTH_PCT } from './npcScale';
import { Icon } from '../ui/Icon';
import { ModalInfoSlotProvider, useModalInfoSlot } from '../ui/InfoTip';
import { CORNER_RING_TOP, CORNER_RING_SIDE } from './cornerAnchor';

/**
 * A FOLHA DE UM LOTE (minimal-ui F4) — bottom-sheet que abre ao tocar um
 * `.lote` da `AreaScene`. Espelha `.modal-backdrop`/`.modal-sheet` dos mocks
 * aprovados, com a proporção redecidida pelo dono em 28/09/2026: a folha
 * ocupa **2/3 da tela** (`height`, fixo — não é mais um range de
 * min/max-height), e o **1/3 de cima da tela** fica FORA do card, transparente,
 * com o NPC da sub-loja + balão de fala; o card é só título + conteúdo
 * rolável. O NPC não é um ÚNICO anfitrião da área — é o de CADA lote
 * (`lotNpcArt`).
 *
 * **Só o molde.** O conteúdo de cada folha (abas por moeda, listas, etc.)
 * vem de quem chama (F5: Mercado e Arena em `App.tsx`); o molde só garante
 * abrir/fechar, o NPC certo, a fala e a proporção.
 */
export function AreaSheet({ areaId, lotId, language, title, closeLabel, open, onClose, npcArt, headSlotRef, children }: {
  areaId: AreaId;
  /** Id do lote aberto (ex.: `'itens'`, `'torneio'`) — resolve o NPC certo
   *  via `lotNpcArt`. Áreas com folha única (Laboratório/Hall) passam o
   *  próprio id do lote de exemplo. */
  lotId?: string | null;
  /** Idioma da fala do NPC (`areaNpcVoice`). */
  language: Language;
  /** Override explícito do NPC (raro — testes/casos sem lote). Sem ele, usa
   *  `lotNpcArt(areaId, lotId)`. */
  npcArt?: string;
  title: string;
  /** Rótulo acessível do fechar — PT/EN, decidido por quem chama (a `AreaScene` sabe o idioma). */
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  /** Encaixe no canto DIREITO da linha do título (ex.: o indicador da faixa do
   *  Torneio, que entra por portal). Ref-callback: o conteúdo recebe o elemento. */
  headSlotRef?: (el: HTMLElement | null) => void;
  children?: ReactNode;
}) {
  // O voltar do sistema (botão do Android/navegador) fecha a folha antes de mudar de tela.
  useBackLayer(open, onClose);
  // `aria-modal` é uma promessa ao leitor de tela — o hook a cumpre (QA da Guilda
  // L1 #24): foco inicial no primeiro focável (o fechar), Tab preso, fundo
  // `inert`, Escape e o foco DEVOLVIDO ao lote que abriu, nunca ao `<body>`.
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
  const { slot, slotRef } = useModalInfoSlot();

  if (!open) return null;

  const npcSrc = npcArt ?? lotNpcArt(areaId, lotId);
  const npc = lotNpcVoice(areaId, lotId, language);

  return (
    <div
      data-area-sheet-backdrop
      className="sm2-sheet-fade"
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(4,10,10,.6)',
      }}
    >
      {/* O DIÁLOGO é a moldura inteira (fechar + NPC + folha): o ✕ mora no
          canto superior ESQUERDO, acima do NPC (H4, 01/10/2026), e precisa
          continuar DENTRO do diálogo para o foco preso do `useDialogA11y`
          alcançá-lo. A moldura não recebe toque (`pointer-events: none`) — o
          toque fora da folha cai no backdrop e fecha, como antes. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-area-sheet-frame
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <button
          type="button"
          data-area-sheet-close
          onClick={e => { e.stopPropagation(); onClose(); }}
          aria-label={closeLabel}
          title={closeLabel}
          className="sm2-area-back"
          style={{
            position: 'absolute', zIndex: 3,
            top: CORNER_RING_TOP, left: CORNER_RING_SIDE,
            width: 44, height: 44, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, cursor: 'pointer', pointerEvents: 'auto',
            // O MESMO anel do voltar das áreas (`AreaTopBar` overScene), com
            // miolo escuro translúcido: o ✕ fica sobre a arte do NPC/cena.
            background: 'rgba(8,25,26,.72)',
            border: '2px solid rgba(233,245,242,.6)',
            borderRadius: '50%',
            color: '#E9F5F2',
          }}
        >
          <Icon name="close" size={24} tone="inherit" />
        </button>

        {/* O 1/3 de cima da TELA, FORA do card e transparente: o NPC da
            sub-loja + o balão de fala dele. Nunca a área inteira — cada lote
            tem o seu (`lotNpcArt`). Toque aqui cai no backdrop e fecha.
            H3 (01/10/2026): a zona ENCOLHE antes de invadir a folha
            (`flex-shrink` 1, `min-height` 0) e fica num plano ABAIXO dela
            (`z-index` 0 × 1) — a arte nunca passa por cima do texto dos itens. */}
        <div
          data-area-sheet-npc-zone
          style={{
            flex: '0 1 33.3333dvh',
            minHeight: 0,
            zIndex: 0,
            position: 'relative',
            display: 'flex', alignItems: 'flex-end', gap: 8,
            // O topo reserva a faixa do ✕ (44 + 12 de margem + 4): o NPC
            // começa ABAIXO dele, nunca atrás.
            padding: 'calc(env(safe-area-inset-top, 0px) + 60px) 12px 4px 12px',
            boxSizing: 'border-box',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <img
            src={npcSrc}
            alt=""
            aria-hidden="true"
            data-area-sheet-npc
            style={{
              height: '100%', width: 'auto', maxWidth: `${NPC_MAX_WIDTH_PCT}%`,
              flex: 'none', objectFit: 'contain', objectPosition: 'bottom',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.6))',
            }}
          />
          {/* Balão de fala — a fala surge letra a letra (I1, `NpcSpeech`); a altura final
              já fica reservada, então o balão não cresce enquanto ela é dita. */}
          <NpcSpeech name={npc.name} line={npc.line} speakerKey={lotId ? `${areaId}:${lotId}` : undefined} />
        </div>

        <div
          data-area-sheet
          className="sm2-sheet-rise"
          // Toque dentro da folha não deve fechar (só o backdrop fecha).
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
            width: '100%',
            // 2/3 da tela, fixo (decisão do dono 28/09/2026) — não é mais um
            // range min/max: o 1/3 de cima da TELA, acima da folha, é do NPC.
            height: '66.6667dvh',
            flex: 'none',
            background: 'var(--sm2-surface)',
            borderRadius: '20px 20px 0 0',
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            boxShadow: '0 -8px 24px rgba(0,0,0,.4)',
            overflow: 'hidden',
          }}
        >
          <div data-area-sheet-head style={{ display: 'flex', alignItems: 'center', minHeight: 52, padding: '8px 16px 0', boxSizing: 'border-box', backgroundColor: 'var(--sm2-surface)' }}>
            <h2 style={{ flex: 1, margin: 0, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg)', fontWeight: 700, color: 'var(--sm2-ink)' }}>
              {title}
            </h2>
            {headSlotRef && <span ref={headSlotRef} data-area-sheet-head-slot style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} />}
            {/* O "i" ÚNICO da folha (`ModalInfo`) entra aqui: canto direito, na linha do título. */}
            <span ref={slotRef} data-modal-info-slot style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: -10 }} />
          </div>
          {/* H6 (01/10/2026): o rolável começa COLADO no título (sem `padding-top`),
              para o cabeçalho fixo de dentro (abas/filtro, `position: sticky;
              top: 0`) encostar no título sem vão — o conteúdo não aparece mais
              passando por trás numa faixa entre os dois. O respiro de cima é um
              espaçador que rola junto. */}
          <div data-area-sheet-body style={{ flex: 1, overflowY: 'auto', padding: '0 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <div aria-hidden="true" style={{ height: 8 }} />
            <ModalInfoSlotProvider slot={slot}>{children}</ModalInfoSlotProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
