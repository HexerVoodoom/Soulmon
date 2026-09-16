// Peças ESTÁTICAS de ganho e movimento (entrega 2, 15/09/2026): selos de
// ganho (96²) e efeitos de movimento (64²), dentro do visor. Chave = id da
// peça, não emoji — nenhum `Popup` do jogo os usa ainda. Momentos previstos
// (`_gemini_out/entrega2/INSTALAR.md`): `perfectDay` no fecho do dia dentro
// do visor, `levelup` ao subir de andar, `chest` no drop do Glitchtama,
// `evolutionBurst` na cerimônia (hoje vídeo), `heal` no uso do 💗, `poof`
// quando o banho limpa o cocô, `dustPuff` no passo. Mapa pronto; a chamada
// entra quando o canvas do fluxo definir o momento.
import gainPerfectDay from '../assets/soulmon/fx/gain-perfect-day.png';
import gainLevelup from '../assets/soulmon/fx/gain-levelup.png';
import gainChest from '../assets/soulmon/fx/gain-chest.png';
import gainConfetti from '../assets/soulmon/fx/gain-confetti.png';
import gainEvolutionBurst from '../assets/soulmon/fx/gain-evolution-burst.png';
import gainFocusSeal from '../assets/soulmon/fx/gain-focus-seal.png';
import fxHeal from '../assets/soulmon/fx/fx-heal.png';
import moveDustPuff from '../assets/soulmon/fx/move-dust-puff.png';
import moveSpeedLines from '../assets/soulmon/fx/move-speed-lines.png';
import moveJumpArc from '../assets/soulmon/fx/move-jump-arc.png';
import moveLandImpact from '../assets/soulmon/fx/move-land-impact.png';
import moveSleepZ from '../assets/soulmon/fx/move-sleep-z.png';
import moveWakeStretch from '../assets/soulmon/fx/move-wake-stretch.png';
import movePoof from '../assets/soulmon/fx/move-poof.png';

export const GAIN_ART = {
  perfectDay: gainPerfectDay, levelup: gainLevelup, chest: gainChest, confetti: gainConfetti,
  evolutionBurst: gainEvolutionBurst, focusSeal: gainFocusSeal, heal: fxHeal,
} as const;
export const MOVE_ART = {
  dustPuff: moveDustPuff, speedLines: moveSpeedLines, jumpArc: moveJumpArc, landImpact: moveLandImpact,
  sleepZ: moveSleepZ, wakeStretch: moveWakeStretch, poof: movePoof,
} as const;
