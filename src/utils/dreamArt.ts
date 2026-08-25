// Arte pixel das 30 cenas do Dex de Sonhos (geradas via Gemini; ver
// `docs/BACKLOG-ARTE-GERAR.md`). Fronteira de troca, no mesmo molde de
// `utils/decorArt.ts`: quem desenha o dex importa daqui e nao conhece PNG
// nenhum.
//
// Por que existe em vez de o PNG entrar direto no `DREAM_CATALOG`
// (`utils/restWindow.ts`): aquele modulo e de funcoes PURAS, sem React e sem
// bundler — e o teste dele roda em Node. Um `import ... from '*.png'` ali
// amarraria a regra do sono ao pipeline do Vite. O `emoji` FICA no catalogo
// pelo mesmo motivo pratico: e o unico glifo que cabe num push, num titulo de
// notificacao ou num log, onde nao existe `<img>`.
import dreamAurora from '../assets/soulmon/dreams/dream-aurora.png';
import dreamBetweenStars from '../assets/soulmon/dreams/dream-between-stars.png';
import dreamCampfire from '../assets/soulmon/dreams/dream-campfire.png';
import dreamCometTail from '../assets/soulmon/dreams/dream-comet-tail.png';
import dreamDewSprout from '../assets/soulmon/dreams/dream-dew-sprout.png';
import dreamEmberCircle from '../assets/soulmon/dreams/dream-ember-circle.png';
import dreamFireflyJar from '../assets/soulmon/dreams/dream-firefly-jar.png';
import dreamFlowerField from '../assets/soulmon/dreams/dream-flower-field.png';
import dreamLanternRiver from '../assets/soulmon/dreams/dream-lantern-river.png';
import dreamLittleBoat from '../assets/soulmon/dreams/dream-little-boat.png';
import dreamMossyStone from '../assets/soulmon/dreams/dream-mossy-stone.png';
import dreamNightTrain from '../assets/soulmon/dreams/dream-night-train.png';
import dreamOldCouch from '../assets/soulmon/dreams/dream-old-couch.png';
import dreamOnTheMoon from '../assets/soulmon/dreams/dream-on-the-moon.png';
import dreamPaperKite from '../assets/soulmon/dreams/dream-paper-kite.png';
import dreamPaperUmbrella from '../assets/soulmon/dreams/dream-paper-umbrella.png';
import dreamPillowCloud from '../assets/soulmon/dreams/dream-pillow-cloud.png';
import dreamPlanetarium from '../assets/soulmon/dreams/dream-planetarium.png';
import dreamQuietLibrary from '../assets/soulmon/dreams/dream-quiet-library.png';
import dreamQuiltFort from '../assets/soulmon/dreams/dream-quilt-fort.png';
import dreamRainyWindow from '../assets/soulmon/dreams/dream-rainy-window.png';
import dreamSeaGlass from '../assets/soulmon/dreams/dream-sea-glass.png';
import dreamSnowHollow from '../assets/soulmon/dreams/dream-snow-hollow.png';
import dreamSnowglobe from '../assets/soulmon/dreams/dream-snowglobe.png';
import dreamStormLantern from '../assets/soulmon/dreams/dream-storm-lantern.png';
import dreamTidePool from '../assets/soulmon/dreams/dream-tide-pool.png';
import dreamTreetopNest from '../assets/soulmon/dreams/dream-treetop-nest.png';
import dreamWarmBlanket from '../assets/soulmon/dreams/dream-warm-blanket.png';
import dreamWhaleSky from '../assets/soulmon/dreams/dream-whale-sky.png';
import dreamWindowSun from '../assets/soulmon/dreams/dream-window-sun.png';

/** Chave = `Dream.id` do `DREAM_CATALOG` (utils/restWindow.ts). */
export const DREAM_ART: Record<string, string> = {
  'dream-aurora': dreamAurora,
  'dream-between-stars': dreamBetweenStars,
  'dream-campfire': dreamCampfire,
  'dream-comet-tail': dreamCometTail,
  'dream-dew-sprout': dreamDewSprout,
  'dream-ember-circle': dreamEmberCircle,
  'dream-firefly-jar': dreamFireflyJar,
  'dream-flower-field': dreamFlowerField,
  'dream-lantern-river': dreamLanternRiver,
  'dream-little-boat': dreamLittleBoat,
  'dream-mossy-stone': dreamMossyStone,
  'dream-night-train': dreamNightTrain,
  'dream-old-couch': dreamOldCouch,
  'dream-on-the-moon': dreamOnTheMoon,
  'dream-paper-kite': dreamPaperKite,
  'dream-paper-umbrella': dreamPaperUmbrella,
  'dream-pillow-cloud': dreamPillowCloud,
  'dream-planetarium': dreamPlanetarium,
  'dream-quiet-library': dreamQuietLibrary,
  'dream-quilt-fort': dreamQuiltFort,
  'dream-rainy-window': dreamRainyWindow,
  'dream-sea-glass': dreamSeaGlass,
  'dream-snow-hollow': dreamSnowHollow,
  'dream-snowglobe': dreamSnowglobe,
  'dream-storm-lantern': dreamStormLantern,
  'dream-tide-pool': dreamTidePool,
  'dream-treetop-nest': dreamTreetopNest,
  'dream-warm-blanket': dreamWarmBlanket,
  'dream-whale-sky': dreamWhaleSky,
  'dream-window-sun': dreamWindowSun,
};
