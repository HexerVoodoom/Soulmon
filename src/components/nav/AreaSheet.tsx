import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import { lotNpcVoice } from '../../utils/areaNpcVoice';
import { NpcSpeech } from './NpcSpeech';
import { useBackLayer } from '../../utils/backStack';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { NPC_MAX_WIDTH_PCT, NPC_BASE_UNDER_SHEET, NPC_TOP_PAD_PX, npcFrameFor, type NpcFrame } from './npcScale';
import { BackCircleButton } from '../ui/BackCircleButton';
import { ModalInfoSlotProvider, useModalInfoSlot } from '../ui/InfoTip';
import { CORNER_RING_TOP, CORNER_RING_SIDE } from './cornerAnchor';
import { ModalFrame } from '../ui/ModalFrame';
import { fundoDoLote } from '../../assets/soulmon/ui/moldura/fundos';
import { CristalChama } from '../ui/CristalChama';
import { Icon } from '../ui/Icon';
import { useBackDimmed } from '../../utils/modalDepth';
import { NavGlyph } from '../ui/NavGlyphs';

/** Moldura da folha (fatiamento vertical, arte aprovada; PLANO-MOLDURAS-MODAIS). `false` volta ao card liso de antes. */
export const MOLDURA_MODAL = true;

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
export function AreaSheet({ areaId, lotId, language, title, closeLabel, open, onClose, npcArt, npcArt2, npcVoice, headSlotRef, closeInSheet = false, hideClose = false, npcFrame, footer, npcOverlay, moldura = 'padrao', titulo = 'placa', children }: {
  /** Ausente só quando `npcArt` + `npcVoice` vêm de fora (NPC de FUNÇÃO, ex.: Ambra nas Missões). */
  areaId?: AreaId;
  /** Id do lote aberto (ex.: `'itens'`, `'torneio'`) — resolve o NPC certo
   *  via `lotNpcArt`. Áreas com folha única (Laboratório/Hall) passam o
   *  próprio id do lote de exemplo. */
  lotId?: string | null;
  /** Idioma da fala do NPC (`areaNpcVoice`). */
  language: Language;
  /** Override explícito do NPC (raro — testes/casos sem lote). Sem ele, usa
   *  `lotNpcArt(areaId, lotId)`. */
  npcArt?: string;
  /** Um SEGUNDO busto, ao lado do primeiro (Restaurante no domingo: os dois chefs, 15/11/2026). Os dois encolhem para dividir a zona do NPC. */
  npcArt2?: string;
  /** Nome + fala do NPC quando ele NÃO é de lote (NPC de função, `functionNpcVoice`). Sem ele, `lotNpcVoice`. */
  npcVoice?: { name: string; line: string };
  title: string;
  /** Rótulo acessível do fechar — PT/EN, decidido por quem chama (a `AreaScene` sabe o idioma). */
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  /** Encaixe no canto DIREITO da linha do título (ex.: o indicador da faixa do
   *  Torneio, que entra por portal). Ref-callback: o conteúdo recebe o elemento. */
  headSlotRef?: (el: HTMLElement | null) => void;
  /** P2 (beta-2): o ✕ mora DENTRO da folha, no canto superior esquerdo acima do título (o mesmo lugar do `ModalSheet`), e não no anel sobre a
   *  cena. Para a folha que faz parte de uma SEQUÊNCIA de `ModalSheet` (a aventura do resumo), onde o fechar não pode mudar de lugar. */
  closeInSheet?: boolean;
  /** Esconde o voltar da folha: o conteúdo (o duelo do Torneio, com o `BattleStage`) traz o PRÓPRIO voltar padrão — duas setas era o bug de 27/10/2026. O voltar do sistema e o Escape seguem fechando. */
  hideClose?: boolean;
  /** Enquadramento do NPC de função (sem lote), no lugar de `npcFrameFor`. */
  npcFrame?: NpcFrame;
  /** Rodapé FIXO da folha (ex.: as ações em lote da caixa de cartas): fica colado embaixo, fora do trecho rolável, com a safe-area. */
  footer?: ReactNode;
  /** Peça por cima da cena, na ZONA DO NPC, entre o NPC e o balão (ex.: o leque de tickets do Salão). Largura zero: o filho se posiciona sozinho. */
  npcOverlay?: ReactNode;
  /** Variante da moldura (só com `MOLDURA_MODAL`). `'aco'` (18/11/2026, decisão do dono: SÓ a Hexsmith) = a moldura de AÇO com runas
   *  (`assets/soulmon/ui/hex-moldura/`): o ✕ entra no disco ESQUERDO do topo, o "i" no direito, o título na placa central e o cristal-chama no encaixe. */
  moldura?: 'padrao' | 'aco';
  /** 23/11/2026 (dono, P3 Passeio): `'inline'` = SEM placa de bronze: o ✕ (`.sm2-popup-fechar`) no canto superior DIREITO e o título logo abaixo, dentro da folha (mesma variante do
   *  `ModalSheet titulo="inline"`). Só com `MOLDURA_MODAL` e sem `aco`; o padrão (`'placa'`) não muda. */
  titulo?: 'placa' | 'inline';
  children?: ReactNode;
}) {
  // O voltar do sistema (botão do Android/navegador) fecha a folha antes de mudar de tela.
  useBackLayer(open, onClose);
  // `aria-modal` é uma promessa ao leitor de tela — o hook a cumpre (QA da Guilda
  // L1 #24): foco inicial no primeiro focável (o fechar), Tab preso, fundo
  // `inert`, Escape e o foco DEVOLVIDO ao lote que abriu, nunca ao `<body>`.
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
  // Com a moldura, o `ModalFrame` é o dono do encaixe do "i" (sobre o ornamento da arte); sem ela, o encaixe da linha do título.
  const { slot, slotRef } = useModalInfoSlot();
  const npcKey = npcArt ?? (areaId ? lotNpcArt(areaId, lotId) : '');
  if (!open) return null;
  const frame = npcFrame ?? npcFrameFor(areaId, lotId);
  const aco = MOLDURA_MODAL && moldura === 'aco';
  const inline = MOLDURA_MODAL && !aco && titulo === 'inline';

  const npcSrc = npcArt ?? (areaId ? lotNpcArt(areaId, lotId) : '');
  const npc = npcVoice ?? (areaId ? lotNpcVoice(areaId, lotId, language) : { name: '', line: '' });

  return (
    <div
      data-area-sheet-backdrop
      className="sm2-sheet-fade"
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 5000,
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
        {!closeInSheet && !hideClose && !aco && !inline && (
          <BackCircleButton
            data-area-sheet-close=""
            onClick={() => onClose()}
            label={closeLabel}
            overScene
            style={{ position: 'absolute', zIndex: 3, top: CORNER_RING_TOP, left: CORNER_RING_SIDE, pointerEvents: 'auto' }}
          />
        )}

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
            // O busto sobe até `NPC_TOP_PAD_PX` (07/10/2026): o ✕ flutua sobre
            // o canto vazio da arte em vez de reservar uma faixa de 60px.
            padding: `calc(env(safe-area-inset-top, 0px) + ${NPC_TOP_PAD_PX}px) 12px 0 12px`,
            boxSizing: 'border-box',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {/* Sem zoom, como antes de 07/10/2026: o <img> direto (a caixa vem da altura da zona); a base entra sob a folha só `NPC_BASE_UNDER_SHEET`. */}
          {[npcSrc, ...(npcArt2 ? [npcArt2] : [])].map((src, i, all) => (
            <img
              key={`${i}:${src}`}
              src={src}
              alt=""
              aria-hidden="true"
              data-area-sheet-npc
              style={{
                height: '100%', width: 'auto', maxWidth: `${all.length > 1 ? NPC_MAX_WIDTH_PCT * 0.45 : NPC_MAX_WIDTH_PCT}%`,
                flex: all.length > 1 ? '0 1 auto' : 'none', minWidth: 0, objectFit: 'contain', objectPosition: 'bottom',
                transform: frame
                  ? `translateY(${100 * (NPC_BASE_UNDER_SHEET + frame.underSheet)}%) scale(${frame.zoom})`
                  : `translateY(${100 * NPC_BASE_UNDER_SHEET}%)`,
                ...(frame ? { transformOrigin: 'left bottom', ...(frame.flushLeft ? { marginLeft: -12 } : {}) } : {}),
                pointerEvents: 'none',
                filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.6))',
              }}
            />
          ))}
          {npcOverlay}
          {/* Balão de fala — a fala surge letra a letra (I1, `NpcSpeech`); a altura final
              já fica reservada, então o balão não cresce enquanto ela é dita. */}
          <NpcSpeech name={npc.name} line={npc.line} speakerKey={npcVoice ? `fn:${npcVoice.name}` : lotId ? `${areaId}:${lotId}` : undefined} />
        </div>

        <SheetShell
          data-area-sheet
          title={inline ? undefined : title}
          fundo={fundoDoLote(areaId, lotId)}
          className={aco ? 'sm2-sheet-rise sm2-moldura-modal--aco' : inline ? 'sm2-sheet-rise sm2-moldura-modal--titulo-inline sm2-area-sheet-inline' : 'sm2-sheet-rise'}
          data-moldura-variante={aco ? 'aco' : undefined}
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
            ...(MOLDURA_MODAL
              // Aço: o cristal-chama sobe para fora do topo (o rolável tem a própria rolagem, então a casca pode transbordar).
              ? { overflow: aco ? 'visible' : 'hidden' }
              : {
                background: 'var(--sm2-surface)',
                borderRadius: '20px 20px 0 0',
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
                boxShadow: '0 -8px 24px rgba(0,0,0,.4)',
                overflow: 'hidden',
              }),
          }}
        >
          {aco && <CristalChama />}
          {aco && !hideClose && <FecharAco label={closeLabel} onClose={onClose} />}
          {closeInSheet && !hideClose && !aco && (
            <div style={MOLDURA_MODAL ? { position: 'absolute', top: 'calc(var(--u) * 3)', left: 'calc(var(--u) * 3)', zIndex: 4 } : { padding: '8px 16px 0', flexShrink: 0 }}>
              <BackCircleButton data-area-sheet-close="" onClick={() => onClose()} label={closeLabel} />
            </div>
          )}
          {/* Com a moldura (`MOLDURA_MODAL`) o TÍTULO mora na PLACA do topo (`ModalFrame title`, serifa dourada, centrado, reticências se longo) e esta
              linha vira só os encaixes (start-slot, head-slot, "i"), pousados POR CIMA da moldura (z 4) sobre a placa e o disco do canto. */}
          <div data-area-sheet-head style={MOLDURA_MODAL
            ? { position: 'absolute', top: 0, left: 0, right: 0, height: aco ? 'calc(var(--u) * 22)' : 'calc(var(--u) * 16.9)', zIndex: 4, display: 'flex', alignItems: 'center', padding: '0 calc(var(--u) * 3)', boxSizing: 'border-box', pointerEvents: 'none' }
            : { display: 'flex', alignItems: 'center', minHeight: 52, padding: '8px 16px 0', boxSizing: 'border-box', backgroundColor: 'var(--sm2-surface)' }}>
            {MOLDURA_MODAL
              ? <span style={{ flex: 1 }} />
              : <h2 style={{ flex: 1, margin: 0, textAlign: 'right', paddingRight: 8, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg)', fontWeight: 700, color: 'var(--sm2-ink)' }}>{title}</h2>}
            {headSlotRef && <span ref={headSlotRef} data-area-sheet-head-slot style={{ display: 'flex', alignItems: 'center', flexShrink: 0, pointerEvents: 'auto' }} />}
            {/* Sem moldura: o "i" ÚNICO da folha (`ModalInfo`) entra aqui, canto direito, na linha do título. Com ela o botão mora no ornamento da arte (`ModalFrame`). */}
            {!MOLDURA_MODAL && <span ref={slotRef} data-modal-info-slot style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: -10, pointerEvents: 'auto' }} />}
          </div>
          {/* H6 (01/10/2026): o rolável começa COLADO no título (sem `padding-top`),
              para o cabeçalho fixo de dentro (abas/filtro, `position: sticky;
              top: 0`) encostar no título sem vão — o conteúdo não aparece mais
              passando por trás numa faixa entre os dois. O respiro de cima é um
              espaçador que rola junto. */}
          {inline && (
            <div data-area-sheet-inline-head style={{ flexShrink: 0, marginTop: 'var(--sm2-moldura-pad-t)', position: 'relative', zIndex: 4 }}>
              {!hideClose && (
                <div className="sm2-popup-fechar-linha">
                  <button type="button" className="sm2-popup-fechar" data-area-sheet-close="" onClick={e => { e.stopPropagation(); onClose(); }} aria-label={closeLabel} title={closeLabel}>
                    <Icon name="close" size={24} tone="inherit" />
                  </button>
                </div>
              )}
              <h2 className="sm2-popup-titulo" data-popup-titulo>{title}</h2>
            </div>
          )}
          <div data-area-sheet-body style={MOLDURA_MODAL
            // Com a moldura: o rolável começa sob a placa e vai até a borda de baixo — por baixo das peças —, com respiro (`--sm2-moldura-pad-*`) para o fim não ficar escondido.
            ? { flex: 1, minHeight: 0, overflowY: 'auto', marginTop: inline ? 0 : 'var(--sm2-moldura-pad-t)', padding: footer ? '0 var(--sm2-moldura-pad-x) 16px' : '0 var(--sm2-moldura-pad-x) calc(var(--sm2-moldura-pad-b) + env(safe-area-inset-bottom, 0px))' }
            : { flex: 1, overflowY: 'auto', padding: footer ? '0 16px 16px' : '0 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <div aria-hidden="true" style={{ height: 8 }} />
            {MOLDURA_MODAL ? children : <ModalInfoSlotProvider slot={slot}>{children}</ModalInfoSlotProvider>}
          </div>
          {footer && (
            <div data-area-sheet-footer style={{ flexShrink: 0, padding: MOLDURA_MODAL ? '10px var(--sm2-moldura-pad-x) calc(var(--sm2-moldura-pad-b) + env(safe-area-inset-bottom, 0px))' : '10px 16px calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--sm2-muted)', background: MOLDURA_MODAL ? 'transparent' : 'var(--sm2-surface)' }}>
              {footer}
            </div>
          )}
        </SheetShell>
      </div>
    </div>
  );
}

/** O medalhão ✕ da moldura de AÇO (SÓ o glifo, alvo transparente ≥ 44 px). Fica SEMPRE no disco ESQUERDO e SEMPRE fecha a folha inteira (24/11/2026,
 *  dono): telas internas (Porta da Hexsmith etc.) não o trocam por "voltar" nem o movem; o Voltar delas mora no corpo. Ele só esmaece se abrir um modal
 *  de FORA desta folha (as telas internas moram dentro do `[data-area-sheet]` e não contam). */
const dentroDaFolha = (el: Element | null): Element | null => el?.closest('[data-area-sheet]') ?? null;
function FecharAco({ label, onClose }: { label: string; onClose: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const dimmed = useBackDimmed(ref, dentroDaFolha);
  return (
    <button ref={ref} type="button" className="sm2-moldura-aco__fechar" data-aco-medalhao="" data-area-sheet-close="" aria-label={label} title={label}
      disabled={dimmed} data-modal-dimmed={dimmed ? '' : undefined} onClick={e => { e.stopPropagation(); onClose(); }}>
      <Icon name="close" size={20} tone="inherit" />
    </button>
  );
}

/** Casca da folha: moldura 9-slice (ligada por `MOLDURA_MODAL`) ou o `div` liso de antes. */
function SheetShell({ fundo, title, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & { 'data-area-sheet'?: boolean | string; 'data-moldura-variante'?: string; fundo?: string; title?: string }) {
  return MOLDURA_MODAL ? <ModalFrame fundo={fundo} title={title || undefined} {...props} /> : <div {...props} />;
}
