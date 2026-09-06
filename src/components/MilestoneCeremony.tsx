/**
 * WP2.4 — A CERIMÔNIA DO MARCO.
 *
 * Cruzar 7, 21 ou 66 dias de um hábito era: um som, um toast e uma fala. Três
 * coisas que o app faz o tempo todo por qualquer motivo — ou seja, o momento
 * mais raro da mecânica de constância era indistinguível de concluir uma
 * tarefa qualquer.
 *
 * A ideia (transcrição A2/B5) é reservar COMPLEXIDADE aos marcos: uma pausa
 * curta que obriga a saborear. Três decisões:
 *  · **interrompe, mas não pede nada.** Não há botão: ela some sozinha em
 *    2,5s, e tocar fecha antes. Um marco que exige confirmação vira tarefa.
 *  · **háptico curto, e opcional.** `navigator.vibrate` já é usado em outros
 *    seis pontos do app; onde não existe, simplesmente não vibra.
 *  · **movimento reduzido cai para o toast** — quem pediu menos movimento não
 *    recebe um overlay animado como consolo.
 */
import { useEffect } from 'react';
import { sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface MilestoneCeremonyProps {
  /** Ícone do tier (`HABIT_TIER_ICONS`) — conteúdo do jogo, não ícone de UI. */
  tierIcon: string;
  /** Nome do hábito que cruzou o marco. */
  habitName: string;
  /** A frase do marco (já no idioma). */
  text: string;
  /** Sprite atual do pet, quando existe. */
  spriteUrl?: string | null;
  language: Language;
  onDone: () => void;
}

export const MILESTONE_CEREMONY_MS = 2500;

export function MilestoneCeremony({
  tierIcon, habitName, text, spriteUrl, language, onDone,
}: MilestoneCeremonyProps) {
  const isPt = language === 'pt-BR';

  useEffect(() => {
    // Háptico curto: é pontuação, não alarme. Falha em silêncio onde não há.
    try { navigator.vibrate?.([30, 40, 60]); } catch { /* noop */ }
    const t = setTimeout(onDone, MILESTONE_CEREMONY_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'grid',
        placeItems: 'center',
        // Véu, não bloqueio: a tela continua legível por baixo, porque o que
        // acontece aqui é uma comemoração e não um diálogo.
        backgroundColor: 'rgba(4, 18, 20, .55)',
        cursor: 'pointer',
      }}
    >
      <div style={{ textAlign: 'center', padding: 24 }}>
        {spriteUrl && (
          <img
            src={spriteUrl}
            alt=""
            width={96}
            height={96}
            className="sm-milestone-pop"
            style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'block', margin: '0 auto 8px' }}
          />
        )}
        <div className="sm-milestone-pop" style={{ fontSize: 44, lineHeight: 1 }} aria-hidden="true">
          {tierIcon}
        </div>
        <p style={{ ...sm2Text, color: '#fff', margin: '10px 0 2px', fontWeight: 600 }}>{habitName}</p>
        <p style={{ ...sm2Hint, color: 'rgba(255,255,255,.85)', margin: 0 }}>{text}</p>
        <p style={{ ...sm2Hint, color: 'rgba(255,255,255,.55)', marginTop: 10 }}>
          {isPt ? 'toque para continuar' : 'tap to continue'}
        </p>
      </div>
    </div>
  );
}

export default MilestoneCeremony;
