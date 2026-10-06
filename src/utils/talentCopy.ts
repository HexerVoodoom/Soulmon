/**
 * Combate v3 / PR7 — os TEXTOS dos nós da árvore de talentos (EN e PT-BR). Separados de `talents.ts` de propósito: só a
 * `TalentTreeCard` (carregada `lazy`) os lê, e `talents.ts` entra no chunk de entrada (orçamento de bytes). Neutro
 * (`copy.semFomo`): sem contagem que apressa. "Vínculo", nunca "nível".
 */
import { PVP_STEP, PVE_STEP, RESPEC_STEP, CHEER_STEP } from './talents';

export interface TalentCopy {
  readonly namePt: string;
  readonly nameEn: string;
  readonly descPt: string;
  readonly descEn: string;
}

const pct = (f: number, pt: boolean) => `${(f * 100).toFixed(1).replace(/\.0$/, '').replace('.', pt ? ',' : '.')}%`;
const dpt = (f: number, onde: string) => `${onde}: ${pct(f, true)} por grau, dentro do teto único de 5%.`;
const den = (f: number, where: string) => `${where}: ${pct(f, false)} per rank, inside the single 5% cap.`;
const CAP_PT = ' A soma dos três canais do Duelo (ataque, defesa e ritmo) com o resto para em 5%.';
const CAP_EN = ' The three Duel channels (attack, defense and rhythm) together with the rest stop at 5%.';
const SOON_ENGINE_PT = 'Chega com o gancho do motor.';
const SOON_ENGINE_EN = 'Arrives with the engine hook.';

export const TALENT_COPY: Readonly<Record<string, TalentCopy>> = {
  'tal-pvp-01': { namePt: 'Ponta de lança', nameEn: 'Spearpoint', descPt: dpt(PVP_STEP, 'Ataque no Duelo, mais dano dado') + CAP_PT, descEn: den(PVP_STEP, 'Attack in the Duel, more damage dealt') + CAP_EN },
  'tal-pvp-02': { namePt: 'Braçadeira', nameEn: 'Bracer', descPt: dpt(PVP_STEP, 'Defesa no Duelo, menos dano recebido') + CAP_PT, descEn: den(PVP_STEP, 'Defense in the Duel, less damage taken') + CAP_EN },
  'tal-pvp-03': { namePt: 'Investida', nameEn: 'Charge', descPt: dpt(PVP_STEP, 'Ritmo no Duelo, golpes mais seguidos') + CAP_PT, descEn: den(PVP_STEP, 'Rhythm in the Duel, quicker blows') + CAP_EN },
  'tal-pvp-04': { namePt: 'Faísca inicial', nameEn: 'Starting spark',
    descPt: `A luta começa com parte da energia do especial. ${SOON_ENGINE_PT}`, descEn: `The fight starts with part of the special energy. ${SOON_ENGINE_EN}` },
  'tal-pvp-05': { namePt: 'Mão aberta', nameEn: 'Open hand',
    descPt: `Sua torcida rende ${pct(CHEER_STEP, true)} mais energia por grau no Duelo. Só vale quando você torce, e só para o seu lado.`,
    descEn: `Your cheer yields ${pct(CHEER_STEP, false)} more energy per rank in the Duel. Only when you cheer, and only for your side.` },
  'tal-pvp-06': { namePt: 'Brasa abafada', nameEn: 'Smothered ember',
    descPt: `Menos dano de efeito contínuo. ${SOON_ENGINE_PT}`, descEn: `Less damage from over-time effects. ${SOON_ENGINE_EN}` },
  'tal-pvp-07': { namePt: 'Coroa do duelista', nameEn: "Duelist's crown", descPt: `+1 turno de reforço. ${SOON_ENGINE_PT}`, descEn: `+1 buff turn. ${SOON_ENGINE_EN}` },
  'tal-pve-01': { namePt: 'Garra da fenda', nameEn: 'Rift claw',
    descPt: dpt(PVE_STEP, 'Mais dano na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More damage in the Arena, Dungeon and Nightmare') },
  'tal-pve-02': { namePt: 'Muro da fenda', nameEn: 'Rift wall',
    descPt: dpt(PVE_STEP, 'Mais firmeza na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More steadiness in the Arena, Dungeon and Nightmare') },
  'tal-pve-03': { namePt: 'Gota subindo', nameEn: 'Rising droplet', descPt: `Mais cura recebida. ${SOON_ENGINE_PT}`, descEn: `More healing received. ${SOON_ENGINE_EN}` },
  'tal-pve-04': { namePt: 'Agulha de bússola', nameEn: 'Compass needle', descPt: 'Mais Bits da fenda. Chega com o gancho da economia.', descEn: 'More rift Bits. Arrives with the economy hook.' },
  'tal-pve-05': { namePt: 'Lua com olho', nameEn: 'Eyed moon', descPt: `Mais força contra o Pesadelo. ${SOON_ENGINE_PT}`, descEn: `More strength against the Nightmare. ${SOON_ENGINE_EN}` },
  'tal-pve-06': { namePt: 'Arco de luz', nameEn: 'Arc of light', descPt: `Escudo do especial mais forte. ${SOON_ENGINE_PT}`, descEn: `Stronger special shield. ${SOON_ENGINE_EN}` },
  'tal-pve-07': { namePt: 'Arco coroado', nameEn: 'Crowned arc', descPt: `Começa a luta com um escudo leve. ${SOON_ENGINE_PT}`, descEn: `Starts the fight with a light shield. ${SOON_ENGINE_EN}` },
  'tal-com-01': { namePt: 'Etiqueta', nameEn: 'Price tag', descPt: 'Equipamento mais barato. Chega com o equipamento.', descEn: 'Cheaper equipment. Arrives with equipment.' },
  'tal-com-02': { namePt: 'Fragmentos', nameEn: 'Fragments', descPt: 'Mais fragmentos. Chega com o equipamento.', descEn: 'More fragments. Arrives with equipment.' },
  'tal-com-03': { namePt: 'Ampulheta de moeda', nameEn: 'Coin hourglass',
    descPt: `Refazer a árvore custa ${Math.round(RESPEC_STEP * 100)}% menos por grau. É preço, não combate.`,
    descEn: `Rebuilding the tree costs ${Math.round(RESPEC_STEP * 100)}% less per rank. It is price, not combat.` },
  'tal-com-04': { namePt: 'Bolsa com alça', nameEn: 'Strapped pouch', descPt: '+1 espaço na mochila. Chega com o equipamento.', descEn: '+1 pack slot. Arrives with equipment.' },
  'tal-com-05': { namePt: 'Balança', nameEn: 'Scales',
    descPt: 'Refazer UM ponto à sua escolha, em vez da árvore toda, pelo preço de um ponto (Bits que você ganhou jogando). É conveniência, não combate.',
    descEn: 'Take back ONE point of your choice instead of the whole tree, at the price of one point (Bits you earned by playing). Convenience, not combat.' },
  'tal-com-06': { namePt: 'Pergaminho enrolado', nameEn: 'Rolled scroll', descPt: 'Mais Bits nas missões. Chega com o gancho da economia.', descEn: 'More Bits from missions. Arrives with the economy hook.' },
  'tal-com-07': { namePt: 'Moeda coroada', nameEn: 'Crowned coin', descPt: 'Desconto rotativo fixo. Chega com o equipamento.', descEn: 'A fixed rotating discount. Arrives with equipment.' },
};
