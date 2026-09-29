/**
 * A CERIMÔNIA DO MARCO DO BOSQUE (`docs/PLANO-GUILDA.md` §4, `NARRATIVA-COPY-GUILDA.md` §5).
 *
 * É a irmã da `MilestoneCeremony` do hábito e obedece às mesmas regras, que
 * custaram caro lá: **espera o gesto** (um botão, sem auto-fechar), a DATA como
 * saída relacional, z-index **300** (acima da fila de intersticiais, que é 200),
 * e **movimento reduzido reduz o MOVIMENTO, nunca a pausa** — a cerimônia é a
 * mesma; só a animação e o háptico somem.
 *
 * O texto vem de `guildCopy` (`guild.marco.*`): a frase do MUNDO manda, e a fala
 * do pet vem embaixo, em voz mais baixa. Nada de "parabéns", nada de número, nada
 * de "você fez o bosque crescer" — o bosque cresceu, e a frase constata (L12).
 * O vidro mostra o cenário do estágio novo com a criatura de quem olha.
 *
 * SAÍDAS (L3-codigo B3, decidido): o botão, o **Escape** e o **voltar do sistema**. Todas são gestos da
 * pessoa — "espera o gesto" veta o auto-fechar, não o Escape, que é o contrato de qualquer diálogo modal
 * (`useDialogA11y`) e a única saída de quem navega por teclado sem chegar ao botão. O véu NÃO fecha ao
 * toque (não há `onClick` nele): quem encosta fora sem querer não perde o marco.
 */
import { useEffect } from 'react';
import { useBackLayer } from '../../utils/backStack';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { Icon } from '../ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { RitualDialog, RitualGlass, ritualTitle } from '../ritual/RitualKit';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { GROUND_Y } from '../../utils/petStage';
import { groveStageName, groveMarcoText, guildCoreText, type GroveMarcoStage } from '../../utils/guildCopyCore';
import type { GroveStageId } from '../../utils/guildRules';
import type { Language } from '../../utils/i18n';

interface GroveMilestoneCeremonyProps {
  /** O estágio novo (a Ramagem em diante). */
  stage: GroveMarcoStage;
  /** A criatura de quem olha, no estágio dela. */
  spriteUrl: string;
  /** A data do marco, já formatada no idioma ('' = ilegível: a linha some). */
  dateLabel: string;
  /** O cenário já entrou entre os cenários da pessoa (`guild.marco.cenario`). */
  sceneGranted: boolean;
  language: Language;
  /** Override (teste); sem ele, o hook acompanha a preferência do sistema AO VIVO (`matchMedia` change — L3 B4). */
  reducedMotion?: boolean;
  onDone: () => void;
}

export function GroveMilestoneCeremony({
  stage, spriteUrl, dateLabel, sceneGranted, language, reducedMotion: reducedOverride, onDone,
}: GroveMilestoneCeremonyProps) {
  const reducedSistema = usePrefersReducedMotion();
  const reducedMotion = reducedOverride ?? reducedSistema;
  // O voltar do sistema (botão do Android, `popstate`) fecha a cerimônia como fecha as outras camadas (QA L3 B6).
  useBackLayer(true, onDone);
  const bg = PET_BACKGROUNDS[`bg-guild-${stage satisfies GroveStageId}`];
  const nome = groveStageName(language, stage);

  useEffect(() => {
    // Háptico curto e opcional, como o do marco de hábito; sem movimento, sem vibração.
    if (!reducedMotion) { try { navigator.vibrate?.([30, 40, 60]); } catch { /* noop */ } }
  }, [reducedMotion]);

  return (
    <RitualDialog labelledBy="gmc-title" onClose={onDone} zIndex={300} maxWidth={340} veilRole="status"
      style={{ textAlign: 'center', alignItems: 'center' }}>
      <RitualGlass width={208} height={144} align="end" style={{ position: 'relative', background: bg?.css, backgroundColor: bg?.baseColor }}>
        <img
          src={spriteUrl}
          alt=""
          width={128}
          height={128}
          data-grove-ceremony-sprite
          className={reducedMotion ? undefined : 'sm-milestone-pop'}
          style={{ width: 128, height: 128, display: 'block', marginBottom: `${100 - GROUND_Y - 10}%` }}
        />
      </RitualGlass>
      <Icon name="eco" size={32} fill={1} tone="primary" />
      <p id="gmc-title" style={ritualTitle}>{groveMarcoText(language, stage, 'mundo')}</p>
      <p style={{ ...sm2Text, margin: 0 }}>{groveMarcoText(language, stage, 'pet')}</p>
      {dateLabel && <p style={sm2Hint}>{dateLabel}</p>}
      {sceneGranted && <p style={sm2Hint}>{guildCoreText(language, 'guild.marco.cenario', { estagio: nome })}</p>}
      <button type="button" onClick={onDone} style={{ ...sm2Button('primary'), marginTop: 4, minWidth: 200 }}>
        {guildCoreText(language, 'guild.marco.botao')}
      </button>
    </RitualDialog>
  );
}

export default GroveMilestoneCeremony;
