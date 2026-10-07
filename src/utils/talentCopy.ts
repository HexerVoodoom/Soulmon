/**
 * Combate v3 / PR7 — os TEXTOS dos nós da árvore de talentos (EN e PT-BR). Separados de `talents.ts` de propósito: só a
 * `TalentTreeCard` (carregada `lazy`) os lê, e `talents.ts` entra no chunk de entrada (orçamento de bytes). Neutro
 * (`copy.semFomo`): sem contagem que apressa. "Vínculo", nunca "nível".
 */
import { PVP_STEP, PVE_STEP, RESPEC_STEP, CHEER_STEP, START_ENERGY_STEP, DOT_RESIST_STEP, CROWN_STEP, HEAL_BOOST_STEP, RIFT_BITS_STEP, START_SHIELD_STEP, NIGHTMARE_STEP, ARC_STEP } from './talents';
import { PRICE_STEP, FRAGMENT_GAIN_STEP, BACKPACK_BASE, BACKPACK_STEP, MISSION_BITS_STEP, WEEKLY_DISCOUNT } from './equipment';

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

export const TALENT_COPY: Readonly<Record<string, TalentCopy>> = {
  'tal-pvp-01': { namePt: 'Ponta de lança', nameEn: 'Spearpoint', descPt: dpt(PVP_STEP, 'Ataque no Duelo, mais dano dado') + CAP_PT, descEn: den(PVP_STEP, 'Attack in the Duel, more damage dealt') + CAP_EN },
  'tal-pvp-02': { namePt: 'Braçadeira', nameEn: 'Bracer', descPt: dpt(PVP_STEP, 'Defesa no Duelo, menos dano recebido') + CAP_PT, descEn: den(PVP_STEP, 'Defense in the Duel, less damage taken') + CAP_EN },
  'tal-pvp-03': { namePt: 'Investida', nameEn: 'Charge', descPt: dpt(PVP_STEP, 'Ritmo no Duelo, golpes mais seguidos') + CAP_PT, descEn: den(PVP_STEP, 'Rhythm in the Duel, quicker blows') + CAP_EN },
  'tal-pvp-04': { namePt: 'Faísca inicial', nameEn: 'Starting spark',
    descPt: `A luta do Duelo começa com ${START_ENERGY_STEP} de energia do especial por grau (de 100). É largada, não força: o especial continua o mesmo.`,
    descEn: `The Duel starts with ${START_ENERGY_STEP} special energy per rank (out of 100). A head start, not strength: the special stays the same.` },
  'tal-pvp-05': { namePt: 'Mão aberta', nameEn: 'Open hand',
    descPt: `Sua torcida rende ${pct(CHEER_STEP, true)} mais energia por grau no Duelo. Só vale quando você torce, e só para o seu lado.`,
    descEn: `Your cheer yields ${pct(CHEER_STEP, false)} more energy per rank in the Duel. Only when you cheer, and only for your side.` },
  'tal-pvp-06': { namePt: 'Brasa abafada', nameEn: 'Smothered ember',
    descPt: `O dano de efeito contínuo que você recebe no Duelo é ${Math.round(DOT_RESIST_STEP * 100)}% menor por grau. Só reduz o que chega até você.`,
    descEn: `The over-time damage you take in the Duel drops ${Math.round(DOT_RESIST_STEP * 100)}% per rank. It only trims what reaches you.` },
  'tal-pvp-07': { namePt: 'Coroa do duelista', nameEn: "Duelist's crown",
    descPt: `${pct(CROWN_STEP, true)} em cada um dos três canais do Duelo (ataque, defesa e ritmo), dentro do teto único de 5%.`,
    descEn: `${pct(CROWN_STEP, false)} in each of the three Duel channels (attack, defense and rhythm), inside the single 5% cap.` },
  'tal-pve-01': { namePt: 'Garra da fenda', nameEn: 'Rift claw',
    descPt: dpt(PVE_STEP, 'Mais dano na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More damage in the Arena, Dungeon and Nightmare') },
  'tal-pve-02': { namePt: 'Muro da fenda', nameEn: 'Rift wall',
    descPt: dpt(PVE_STEP, 'Mais firmeza na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More steadiness in the Arena, Dungeon and Nightmare') },
  'tal-pve-03': { namePt: 'Gota subindo', nameEn: 'Rising droplet',
    descPt: `A cura entre os andares da Masmorra sobe ${pct(HEAL_BOOST_STEP, true)} do HP máximo por grau.`,
    descEn: `The healing between Dungeon layers grows by ${pct(HEAL_BOOST_STEP, false)} of max HP per rank.` },
  'tal-pve-04': { namePt: 'Agulha de bússola', nameEn: 'Compass needle',
    descPt: `${pct(RIFT_BITS_STEP, true)} mais Bits por grau nos que você ganha na fenda. Não cria fonte nova: só rende mais do que a fenda já dava.`,
    descEn: `${pct(RIFT_BITS_STEP, false)} more Bits per rank on the ones you earn in the rift. No new source: it only adds to what the rift already gave.` },
  'tal-pve-05': { namePt: 'Lua com olho', nameEn: 'Eyed moon',
    descPt: dpt(NIGHTMARE_STEP, 'Mais dano só no Pesadelo'),
    descEn: den(NIGHTMARE_STEP, 'More damage in the Nightmare only') },
  'tal-pve-06': { namePt: 'Arco de luz', nameEn: 'Arc of light',
    descPt: dpt(ARC_STEP, 'Mais dano na Arena, na Masmorra e no Pesadelo'),
    descEn: den(ARC_STEP, 'More damage in the Arena, Dungeon and Nightmare') },
  'tal-pve-07': { namePt: 'Arco coroado', nameEn: 'Crowned arc',
    descPt: `A primeira luta de cada andar da fenda começa com um escudo leve, ${Math.round(START_SHIELD_STEP * 100)}% do seu HP.`,
    descEn: `The first fight of each rift floor starts with a light shield, ${Math.round(START_SHIELD_STEP * 100)}% of your HP.` },
  'tal-com-01': { namePt: 'Etiqueta', nameEn: 'Price tag', descPt: `Equipamento ${pct(PRICE_STEP, true)} mais barato em Bits por grau. É preço, não combate.`, descEn: `Equipment ${pct(PRICE_STEP, false)} cheaper in Bits per rank. It is price, not combat.` },
  'tal-com-02': { namePt: 'Fragmentos', nameEn: 'Fragments', descPt: `${pct(FRAGMENT_GAIN_STEP, true)} mais fragmentos por grau, até +25%. É moeda ganha, não combate.`, descEn: `${pct(FRAGMENT_GAIN_STEP, false)} more fragments per rank, up to +25%. Earned currency, not combat.` },
  'tal-com-03': { namePt: 'Ampulheta de moeda', nameEn: 'Coin hourglass',
    descPt: `Refazer a árvore custa ${Math.round(RESPEC_STEP * 100)}% menos por grau. É preço, não combate.`,
    descEn: `Rebuilding the tree costs ${Math.round(RESPEC_STEP * 100)}% less per rank. It is price, not combat.` },
  'tal-com-04': { namePt: 'Bolsa com alça', nameEn: 'Strapped pouch', descPt: `+${BACKPACK_STEP} espaço por grau na mochila (peças guardadas fora dos slots; a mochila começa com ${BACKPACK_BASE}). É capacidade, não combate.`, descEn: `+${BACKPACK_STEP} pack slot per rank (pieces kept outside the slots; the pack starts with ${BACKPACK_BASE}). Capacity, not combat.` },
  'tal-com-05': { namePt: 'Balança', nameEn: 'Scales',
    descPt: 'Refazer UM ponto à sua escolha, em vez da árvore toda, pelo preço de um ponto (Bits que você ganhou jogando). É conveniência, não combate.',
    descEn: 'Take back ONE point of your choice instead of the whole tree, at the price of one point (Bits you earned by playing). Convenience, not combat.' },
  'tal-com-06': { namePt: 'Pergaminho enrolado', nameEn: 'Rolled scroll', descPt: `${pct(MISSION_BITS_STEP, true)} mais Bits por grau no dia completo, até +25%. Não cria Bits novos: só rende mais do que o dia já dava. É moeda, não combate.`, descEn: `${pct(MISSION_BITS_STEP, false)} more Bits per rank on a complete day, up to +25%. No new source of Bits: it only adds to what the day already gave. Currency, not combat.` },
  'tal-com-07': { namePt: 'Moeda coroada', nameEn: 'Crowned coin', descPt: `Toda semana UMA peça do equipamento fica ${Math.round(WEEKLY_DISCOUNT * 100)}% mais barata em Bits. A peça vem de uma ordem fixa (a mesma para todos, sem acaso), a semana seguinte é só a próxima da ordem e nada some se você não comprar. É preço, não combate.`, descEn: `Every week ONE piece of equipment is ${Math.round(WEEKLY_DISCOUNT * 100)}% cheaper in Bits. The piece follows a fixed order (the same for everyone, nothing random); next week is just the next in line and nothing goes away if you do not buy. Price, not combat.` },
};
