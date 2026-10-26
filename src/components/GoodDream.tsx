/**
 * O SONHO BOM — a cada 6 dias de pesadelo, 1 sonho bom (decisão do dono, 15/10/2026).
 *
 * Componente PURO: recebe o prêmio já definido (`GOOD_DREAM_HONOR`) e devolve o gesto por `onClaim`. Quem paga a
 * Honra (a moeda `emblems`, a mesma do Torneio) e reinicia o ciclo é o App, no MESMO updater (`claimGoodDream`,
 * idempotente). Fechar também colhe: é um presente, não uma tarefa — nada aqui pode virar cobrança.
 *
 * Voz: encoraja. Nenhuma linha julga a noite; o texto fala de coragem e de descanso.
 */
import type { CSSProperties } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameVisor, VisorSprite, VisorFx, VisorSparks, DIALOG_VISOR_W, phaseTitle } from './games/GameKit';
import { NIGHTMARE_SCENE } from '../utils/dungeonScenes';
import { getSpriteForStage } from '../utils/sprites';
import { petScaleStyle } from '../utils/spriteScale';
import type { Language } from '../utils/i18n';
/* Rodada 4 (N2): o porte reduzido por estágio vale só na Home e nos combates; no minigame o bicho tem o tamanho cheio. */
const PET_SCALE_MINIGAME = 1;

export interface GoodDreamProps {
  open: boolean;
  /** Honra que o sonho paga. */
  honor: number;
  petStage: string;
  demoCharacterId?: string;
  language: Language;
  /** Colhe o prêmio e fecha (o botão e o × fazem o mesmo). */
  onClaim: () => void;
}

export function GoodDream({ open, honor, petStage, demoCharacterId, language, onClaim }: GoodDreamProps) {
  const petSprite = getSpriteForStage(petStage, demoCharacterId, 256);
  const petScale = PET_SCALE_MINIGAME;
  if (!open) return null;
  const isPt = language === 'pt-BR';
  const title = isPt ? 'Um sonho bom' : 'A good dream';
  const btn: CSSProperties = { ...sm2Button('primary'), width: '100%', maxWidth: 260, alignSelf: 'center' };
  return (
    <RitualDialog
      label={title}
      onClose={onClaim}
      zIndex={210}
      maxWidth={340}
      closeLabel={isPt ? 'Fechar' : 'Close'}
      style={{ alignItems: 'center', textAlign: 'center', gap: 10, paddingTop: 44 }}
    >
      <GameVisor width={DIALOG_VISOR_W} height={72} scene={NIGHTMARE_SCENE.bg}>
        <VisorFx icon="✨" style={{ right: 8, top: 8 }} data-visor-fx="sparkle" />
        <VisorSparks />
        <VisorSprite src={petSprite} alt="" style={{ left: 8, bottom: 8, ...petScaleStyle(petScale) }} data-visor-pet />
      </GameVisor>
      <p style={phaseTitle} data-good-dream>{title}</p>
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'Seis noites seguidas de pesadelo, e você e seu Soulmon ficaram firmes. Hoje a noite é só de sonho bom: respire, você merece o descanso.'
          : 'Six nights of nightmares, and you and your Soulmon stood firm. Tonight is only good dreams: breathe, you deserve the rest.'}
      </p>
      <p className="sm2-num" style={{ ...sm2Text, margin: 0 }} data-good-dream-honor>
        {isPt ? `+${honor} de Honra` : `+${honor} Honor`}
      </p>
      <p style={sm2Hint}>{isPt ? 'Um presente, sem pressa. Amanhã a gente segue junto.' : 'A gift, no rush. Tomorrow we keep going together.'}</p>
      <button type="button" onClick={onClaim} style={btn}>{isPt ? 'Que bom!' : 'How lovely!'}</button>
    </RitualDialog>
  );
}

export default GoodDream;
