import { useState } from 'react';
import { TypewriterText } from '../ui/TypewriterText';

/**
 * O BALÃO DE FALA DO NPC da folha do lote (I1, 02/10/2026): nome + fala que
 * surge letra a letra (`TypewriterText`). Mora aqui, e não dentro do
 * `AreaSheet`, para o estado "ainda falando" não brigar com os hooks da folha
 * (ela retorna `null` fechada) — o balão monta de novo a cada abertura, então
 * a fala é dita UMA vez por abertura e nunca bloqueia o resto da folha.
 *
 * Enquanto fala, o balão aceita toque (completa a fala na hora, sem fechar a
 * folha); terminada a fala ele volta a ser transparente ao toque, como antes
 * (a zona do NPC é `pointer-events: none` — toque ali fecha pelo backdrop).
 */
export function NpcSpeech({ name, line }: { name: string; line: string }) {
  const [done, setDone] = useState(false);
  const [skip, setSkip] = useState(false);
  return (
    <p
      data-area-sheet-npc-line
      onClick={done ? undefined : e => { e.stopPropagation(); setSkip(true); }}
      style={{
        flex: 1, minWidth: 0,
        margin: '0 0 8px',
        padding: '10px 12px',
        background: 'rgba(15,42,41,.96)',
        border: '2px solid var(--sm2-gold-fill)',
        borderRadius: '14px 14px 14px 2px',
        font: '500 13px/1.35 var(--sm2-font-text)',
        color: '#E9F5F2',
        boxShadow: '0 6px 14px rgba(0,0,0,.45)',
        pointerEvents: done ? 'none' : 'auto',
      }}
    >
      <b style={{ display: 'block', marginBottom: 4, fontSize: 12, letterSpacing: '0.06em', color: 'var(--sm2-gold-ink)' }}>
        {name}
      </b>
      <TypewriterText key={line} text={line} instant={skip} onDone={() => setDone(true)} />
    </p>
  );
}
