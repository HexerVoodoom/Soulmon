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
 *
 * CANVAS RITUAIS (`MarcoCerimonia`, D-R3/D-R10, X1/X3/X5; DECISÕES §21):
 *  · a cerimônia é um `.dlg` com `role="dialog"` + `aria-labelledby` e o
 *    trap/Escape do `useDialogA11y` (STATUS f: antes o Tab vazava para o
 *    check-in sob o véu); Escape = o mesmo `onDone`. O véu mantém o
 *    `role="status"` — é anunciada E é diálogo;
 *  · o pixel do marco mora no VIDRO 208×144: sprite 256² a **128** (0,5×, o
 *    mesmo do palco) + o emblema do tier 64² a **64** (1×) no canto —
 *    `emblemFor(tier)` (`habit-7` broto · `habit-21` arvoreta · `habit-66`
 *    árvore), nunca 0,75×;
 *  · fora do vidro, aparelho: `eco` 48 FILL .34/.67/1 (o tier, o mesmo glifo
 *    da lista), Fredoka 20, a frase SEM emoji, a data 12 `muted`, um único
 *    `primary` relacional. Sem ×: a saída é o botão (V1).
 */
import { useEffect } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { TIER_FILL } from './HabitConstancy';
import { emblemFor } from '../utils/emblemArt';
import { RitualDialog, RitualGlass, ritualTitle } from './ritual/RitualKit';
import type { Language } from '../utils/i18n';

interface MilestoneCeremonyProps {
  /** O tier alcançado (`habitTier`): `sprout` · `sapling` · `tree`. */
  tier: string;
  /** Nome do hábito que cruzou o marco. */
  habitName: string;
  /** A frase do marco (já no idioma, sem emoji). */
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
  tier, habitName, text, spriteUrl, language, dateLabel, reducedMotion = false, onDone,
}: MilestoneCeremonyProps) {
  const isPt = language === 'pt-BR';
  const emblem = emblemFor(tier);

  useEffect(() => {
    // Háptico curto: é pontuação, não alarme. Falha em silêncio onde não há.
    if (!reducedMotion) { try { navigator.vibrate?.([30, 40, 60]); } catch { /* noop */ } }
  }, [reducedMotion]);

  return (
    <RitualDialog
      labelledBy="mc-title"
      onClose={onDone}
      // 300: acima do pesadelo (210) e dos intersticiais (200).
      zIndex={300}
      maxWidth={340}
      veilRole="status"
      style={{ textAlign: 'center', alignItems: 'center' }}
    >
      {/* O VIDRO do marco: o palco em miniatura, com o emblema no canto. */}
      {(spriteUrl || emblem) && (
        <RitualGlass width={208} height={144} align="end" style={{ position: 'relative' }}>
          {spriteUrl && (
            <img
              src={spriteUrl}
              alt=""
              width={128}
              height={128}
              data-milestone-sprite
              className={reducedMotion ? undefined : 'sm-milestone-pop'}
              style={{ width: 128, height: 128, display: 'block', margin: '0 0 4px -40px' }}
            />
          )}
          {emblem && (
            <img
              src={emblem}
              alt=""
              width={64}
              height={64}
              data-milestone-emblem
              style={{ position: 'absolute', right: 8, top: 8, width: 64, height: 64, display: 'block' }}
            />
          )}
        </RitualGlass>
      )}
      <Icon name="eco" size={48} fill={TIER_FILL[tier] ?? 0} tone="primary" />
      <p id="mc-title" style={ritualTitle}>{habitName}</p>
      <p style={{ ...sm2Text, margin: 0 }}>{text}</p>
      {dateLabel && <p style={sm2Hint}>{dateLabel}</p>}
      {/* A saída é relacional, e é a metade do desenho que o dossiê achou em
          comum nos onze apps: o marco não é um aviso que se dispensa, é uma
          coisa que os dois fizeram. */}
      <button
        type="button"
        onClick={onDone}
        style={{ ...sm2Button('primary'), marginTop: 4, minWidth: 200 }}
      >
        {isPt ? 'Seguimos juntos' : 'We keep going together'}
      </button>
    </RitualDialog>
  );
}

export default MilestoneCeremony;
