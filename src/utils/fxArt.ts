// Arte pixel dos EFEITOS de jogo — popups de batalha e partículas de cuidado.
// Fronteira de troca no molde de `itemArt.ts`.
//
// A chave é o EMOJI que o código já usa hoje: `Popup.icon` na Masmorra e no
// Pesadelo é uma string (⚔️ 💥 🛡️ ✨ 💫), e as partículas do HUD idem. Manter a
// string como chave é o que permite trocar a arte sem tocar em nenhuma regra —
// o render consulta o mapa e cai no texto quando não acha, então um popup novo
// com emoji novo nunca quebra, só nasce sem sprite até ganhar um.
import fxAttack from '../assets/soulmon/fx/fx-attack.png';
import fxHit from '../assets/soulmon/fx/fx-hit.png';
import fxShield from '../assets/soulmon/fx/fx-shield.png';
import fxSparkle from '../assets/soulmon/fx/fx-sparkle.png';
import fxDizzy from '../assets/soulmon/fx/fx-dizzy.png';
import fxDefeat from '../assets/soulmon/fx/fx-defeat.png';
import careHeartSolid from '../assets/soulmon/fx/care-heart-solid.png';
import careHeartPair from '../assets/soulmon/fx/care-heart-pair.png';
import careHeartShine from '../assets/soulmon/fx/care-heart-shine.png';
import careHug from '../assets/soulmon/fx/care-hug.png';
import careDrop from '../assets/soulmon/fx/care-drop.png';
import careShower from '../assets/soulmon/fx/care-shower.png';

/** Chave = o `icon` (emoji) que os popups de batalha usam hoje. */
export const FX_ART: Record<string, string> = {
  '⚔️': fxAttack,
  '💥': fxHit,
  '🛡️': fxShield,
  '✨': fxSparkle,
  '💫': fxDizzy,
  '🏳️': fxDefeat,
  // Partículas de cuidado (CompanionHUD): corações do carinho, balão de
  // abraço, gotas e chuveirinho do banho. O 💗 NÃO entra aqui de propósito —
  // ele é chave de ITEM (coraçãozinho da pastinha, utils/itemArt.ts), e o
  // coração-com-brilho do carinho usa a própria chave 💖.
  '❤️': careHeartSolid,
  '💕': careHeartPair,
  '💖': careHeartShine,
  '🤗': careHug,
  '💧': careDrop,
  '🚿': careShower,
};
