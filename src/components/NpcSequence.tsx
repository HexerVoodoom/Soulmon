import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { TypewriterText } from './ui/TypewriterText';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useBackLayer } from '../utils/backStack';
import type { Language } from '../utils/i18n';

/** Uma fala: quem fala, a arte do NPC (a que já existe em `assets/soulmon/npcs`) e o texto. */
export interface NpcSequenceLine {
  speaker: string;
  art: string;
  text: string;
}

/**
 * A SEQUÊNCIA DE FALAS DE UM NPC, em tela cheia (14/10/2026, pedido do dono por voz): "o NPC bem GRANDE e a janela de
 * texto, SEM aquele modalzinho com 'continuar'/'depois'. Só o personagem com o bloco de texto; ao tocar na tela,
 * avança os diálogos. No canto superior ESQUERDO, texto discreto 'Pular'/'Skip'."
 *
 * É GENÉRICO de propósito: recebe só as falas (`lines`) e devolve como acabou (`onFinish`). A apresentação de prédio
 * novo (`BuildingIntro`) o usa hoje, e o tutorial do mapa pode usá-lo sem mexer aqui.
 *
 *  · tocar em QUALQUER lugar avança para a próxima fala; na última, o toque fecha (`'done'`);
 *  · "Pular"/"Skip" (canto superior esquerdo, alvo ≥ 44 px, respeita a safe-area) encerra a sequência INTEIRA
 *    (`'skip'`); o voltar do Android e o Esc fazem o mesmo;
 *  · teclado: Enter/Espaço avançam (o botão de avançar é o primeiro focável), Esc pula;
 *  · nenhum botão "continuar"/"depois", nenhum timer: só sai por gesto (a regra do `BuildingIntro` de sempre);
 *  · a fala é digitada (`TypewriterText`: movimento reduzido acelera, leitor de tela lê o texto inteiro de uma vez);
 *  · `onFinish` dispara UMA vez, por mais toques que cheguem.
 * Quem usa decide o que "visto" significa (aqui nada é gravado).
 */
export function NpcSequence({ lines, language, onFinish, label }: {
  lines: readonly NpcSequenceLine[];
  language: Language;
  onFinish: (how: 'done' | 'skip') => void;
  /** Nome acessível do diálogo (padrão: o nome de quem fala). */
  label?: string;
}) {
  const isPt = language === 'pt-BR';
  const [i, setI] = useState(0);
  const finished = useRef(false);
  const last = lines.length - 1;
  const line = lines[Math.min(i, last)];

  const finish = useCallback((how: 'done' | 'skip') => {
    if (finished.current) return;
    finished.current = true;
    onFinish(how);
  }, [onFinish]);
  const skip = useCallback(() => finish('skip'), [finish]);
  const advance = useCallback(() => {
    if (i >= last) finish('done');
    else setI(n => Math.min(n + 1, last));
  }, [i, last, finish]);

  useBackLayer(true, skip);
  const dialogRef = useDialogA11y<HTMLDivElement>(true, skip);

  // Enter/Espaço com o foco fora de um botão (o foco inicial já cai no avançar, mas pode ser perdido): avança.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      advance();
    }
  };

  if (!line) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label ?? line.speaker}
      data-npc-sequence
      data-step={i}
      onKeyDown={onKeyDown}
      className="sm2-sheet-fade"
      style={{
        position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden',
        background: 'radial-gradient(120% 90% at 50% 38%, rgba(20,58,56,.96) 0%, rgba(4,16,18,.98) 70%)',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* O NPC, BEM GRANDE: a arte que já existe, ancorada embaixo (o bloco de texto cobre o peito). O botão de
          avançar é o PRIMEIRO focável e cobre a tela inteira — tocar em qualquer lugar avança. */}
      <button
        type="button"
        data-npc-advance
        onClick={advance}
        aria-label={i >= last ? (isPt ? 'Fechar' : 'Close') : (isPt ? 'Avançar' : 'Next')}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, margin: 0,
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          /* o NPC termina onde a caixa de texto começa (caixa ~130px + respiro) */
          boxSizing: 'border-box', paddingBottom: 'calc(138px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <img
          key={line.art}
          className="sm2-sheet-fade"
          src={line.art}
          alt=""
          aria-hidden="true"
          data-npc-art
          draggable={false}
          style={{
            width: 'min(135vw, calc(100dvh - 150px))', height: 'auto', maxWidth: 'none', aspectRatio: '1 / 1',
            objectFit: 'contain', objectPosition: 'bottom',
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.6))',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* A janela de texto, embaixo. Não recebe toque (cai no botão de avançar). */}
      <div
        data-npc-textbox
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 1, pointerEvents: 'none',
          padding: '0 14px calc(18px + env(safe-area-inset-bottom, 0px))',
          display: 'flex', justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 520, boxSizing: 'border-box', minHeight: 112,
            padding: '12px 16px 14px',
            background: 'rgba(15,42,41,.96)',
            border: '2px solid var(--sm2-gold-fill)',
            borderRadius: 16,
            boxShadow: '0 8px 22px rgba(0,0,0,.5)',
            color: '#E9F5F2',
            font: '500 15px/1.4 var(--sm2-font-text)',
            position: 'relative', whiteSpace: 'pre-line',
          }}
        >
          <b data-npc-name style={{ display: 'block', marginBottom: 4, fontSize: 12, letterSpacing: '0.06em', color: 'var(--sm2-gold-ink)' }}>
            {line.speaker}
          </b>
          <TypewriterText key={`${i}|${line.text}`} text={line.text} />
          {/* Dicas discretas: onde está na sequência e que o toque continua (não é um botão). */}
          <span aria-hidden="true" style={{ position: 'absolute', right: 14, bottom: 8, fontSize: 11, opacity: 0.7, letterSpacing: '0.1em' }}>
            {lines.length > 1 ? `${Math.min(i + 1, lines.length)}/${lines.length}  ` : ''}{i >= last ? '' : '▾'}
          </span>
        </div>
      </div>

      {/* Pular: texto discreto, canto superior ESQUERDO, alvo ≥ 44 px, dentro da safe-area. Vem DEPOIS do avançar no foco. */}
      <button
        type="button"
        data-npc-skip
        onClick={skip}
        style={{
          position: 'absolute', zIndex: 2,
          top: 'calc(env(safe-area-inset-top, 0px) + 6px)', left: 'calc(env(safe-area-inset-left, 0px) + 6px)',
          minWidth: 44, minHeight: 44, padding: '0 14px', boxSizing: 'border-box',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(233,245,242,.72)', font: '500 13px/1 var(--sm2-font-text)', letterSpacing: '0.04em',
        }}
      >
        {isPt ? 'Pular' : 'Skip'}
      </button>
    </div>
  );
}
