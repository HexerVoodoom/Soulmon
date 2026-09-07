/**
 * WP2.4 — A CERIMÔNIA DO MARCO.
 *
 * Cruzar 7, 21 ou 66 dias de um hábito era: um som, um toast e uma fala. Três
 * coisas que o app faz o tempo todo por qualquer motivo — ou seja, o momento
 * mais raro da mecânica de constância era indistinguível de concluir uma
 * tarefa qualquer.
 *
 * A ideia (transcrição A2/B5) é reservar COMPLEXIDADE aos marcos: uma pausa
 * que obriga a saborear.
 *
 * ⚠️ **A saída é do JOGADOR, e isto mudou em 06/09/2026.** A versão anterior
 * fechava sozinha em 2,5s e não tinha botão, com o argumento de que "um marco
 * que exige confirmação vira tarefa". A auditoria mostrou que era o contrário
 * do aceite escrito no próprio ledger ("o modal não fecha sozinho") e do que o
 * dossiê encontrou em onze apps: o que faz a pessoa REGISTRAR o marco é a
 * saída pertencer a ela. 66 dias efetivos é o evento mais raro do motor de
 * constância — e ele estava sendo comemorado para uma tela que a pessoa podia
 * nem ter olhado.
 *
 * As decisões que ficam:
 *  · **espera o gesto.** Botão com saída relacional ("Seguimos juntos"), e a
 *    DATA, porque marco é permanente e a data é o que o torna memória.
 *  · **z-index acima de todos os intersticiais.** Ela ficava em 60, abaixo do
 *    check-in (200): o marco de 66 dias era comemorado para um véu invisível.
 *  · **háptico curto, e opcional.** `navigator.vibrate` já é usado em outros
 *    seis pontos do app; onde não existe, simplesmente não vibra.
 *  · **movimento reduzido reduz o MOVIMENTO, nunca a pausa.** A versão antiga
 *    caía para um `toast.success` — o mesmo de concluir qualquer tarefa — e
 *    entregava MENOS cerimônia justamente a quem tem mais chance de precisar
 *    de acessibilidade. Agora a cerimônia é a mesma; só as animações somem.
 */
import { useEffect } from 'react';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
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
  /** A data do marco, já formatada no idioma. Marco é permanente; a data é o
   *  que o transforma em memória em vez de notificação. */
  dateLabel?: string;
  /** Quem pediu menos movimento: as animações somem, a cerimônia fica. */
  reducedMotion?: boolean;
  onDone: () => void;
}

export function MilestoneCeremony({
  tierIcon, habitName, text, spriteUrl, language, dateLabel, reducedMotion = false, onDone,
}: MilestoneCeremonyProps) {
  const isPt = language === 'pt-BR';

  useEffect(() => {
    // Háptico curto: é pontuação, não alarme. Falha em silêncio onde não há.
    if (!reducedMotion) { try { navigator.vibrate?.([30, 40, 60]); } catch { /* noop */ } }
  }, [reducedMotion]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        // 300: acima do pesadelo (210) e dos intersticiais (200). Ela ficava em
        // 60 e era comemorada por baixo do check-in.
        zIndex: 300,
        display: 'grid',
        placeItems: 'center',
        // Véu, não bloqueio: a tela continua legível por baixo, porque o que
        // acontece aqui é uma comemoração e não um diálogo.
        backgroundColor: 'rgba(4, 18, 20, .55)',
      }}
    >
      <div style={{ textAlign: 'center', padding: 24 }}>
        {spriteUrl && (
          <img
            src={spriteUrl}
            alt=""
            width={96}
            height={96}
            className={reducedMotion ? undefined : 'sm-milestone-pop'}
            style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'block', margin: '0 auto 8px' }}
          />
        )}
        <div className={reducedMotion ? undefined : 'sm-milestone-pop'} style={{ fontSize: 44, lineHeight: 1 }} aria-hidden="true">
          {tierIcon}
        </div>
        <p style={{ ...sm2Text, color: '#fff', margin: '10px 0 2px', fontWeight: 600 }}>{habitName}</p>
        <p style={{ ...sm2Hint, color: 'rgba(255,255,255,.85)', margin: 0 }}>{text}</p>
        {dateLabel && (
          <p style={{ ...sm2Hint, color: 'rgba(255,255,255,.55)', margin: '10px 0 0' }}>
            {dateLabel}
          </p>
        )}
        {/* A saída é relacional, e é a metade do desenho que o dossiê achou em
            comum nos onze apps: o marco não é um aviso que se dispensa, é uma
            coisa que os dois fizeram. */}
        <button
          type="button"
          onClick={onDone}
          autoFocus
          style={{ ...sm2Button('primary'), marginTop: 16, minWidth: 200 }}
        >
          {isPt ? 'Seguimos juntos' : 'Let’s keep going together'}
        </button>
      </div>
    </div>
  );
}

export default MilestoneCeremony;
