/**
 * Combate v3 / PR7 — os TEXTOS dos nós da árvore de talentos (EN e PT-BR). Separados de `talents.ts` de propósito: só a
 * `TalentTreeCard` (carregada `lazy`) os lê, e `talents.ts` entra no chunk de entrada (orçamento de bytes). Neutro
 * (`copy.semFomo`): sem contagem que apressa. "Vínculo", nunca "nível".
 */
import { TALENT_BY_ID, PVP_STEP, PVE_STEP, RESPEC_STEP, CHEER_STEP, START_ENERGY_STEP, DOT_RESIST_STEP, CROWN_STEP, HEAL_BOOST_STEP, RIFT_BITS_STEP, START_SHIELD_STEP, NIGHTMARE_STEP, ARC_STEP } from './talents';
import { ENERGY } from './combate/specials';
import { PRICE_STEP, FRAGMENT_GAIN_STEP, BACKPACK_BASE, BACKPACK_STEP, MISSION_BITS_STEP } from './equipment';

export interface TalentCopy {
  readonly namePt: string;
  readonly nameEn: string;
  readonly descPt: string;
  readonly descEn: string;
}

const pct = (f: number, pt: boolean) => `${(f * 100).toFixed(1).replace(/\.0$/, '').replace('.', pt ? ',' : '.')}%`;
/** Efeito em palavras primeiro, número depois (11/10/2026: "as skills não estão legais" — o número sozinho não dizia o que muda na luta). */
const dpt = (f: number, efeito: string, onde: string, cauda = ', dentro do teto único de 5%') => `${efeito} ${onde}. +${pct(f, true)} por grau${cauda}.`;
const den = (f: number, effect: string, where: string, tail = ', inside the single 5% cap') => `${effect} ${where}. +${pct(f, false)} per rank${tail}.`;
const CAP_PT = ' A soma dos três canais do Duelo (ataque, defesa e ritmo) com o resto para em 5%.';
const CAP_EN = ' The three Duel channels (attack, defense and rhythm) together with the rest stop at 5%.';

export const TALENT_COPY: Readonly<Record<string, TalentCopy>> = {
  'tal-pvp-01': { namePt: 'Ponta de lança', nameEn: 'Spearpoint', descPt: dpt(PVP_STEP, 'O seu Soulmon bate mais forte', 'no Duelo e no Torneio (ataque)', '') + CAP_PT, descEn: den(PVP_STEP, 'Your Soulmon hits harder', 'in the Duel and the Tournament (attack)', '') + CAP_EN },
  'tal-pvp-02': { namePt: 'Braçadeira', nameEn: 'Bracer', descPt: dpt(PVP_STEP, 'O seu Soulmon aguenta mais', 'no Duelo e no Torneio (defesa: menos dano recebido)', '') + CAP_PT, descEn: den(PVP_STEP, 'Your Soulmon holds up better', 'in the Duel and the Tournament (defense: less damage taken)', '') + CAP_EN },
  'tal-pvp-03': { namePt: 'Investida', nameEn: 'Charge', descPt: dpt(PVP_STEP, 'Os golpes saem mais seguidos', 'no Duelo e no Torneio (ritmo)', '') + CAP_PT, descEn: den(PVP_STEP, 'Blows come quicker', 'in the Duel and the Tournament (rhythm)', '') + CAP_EN },
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
    descPt: dpt(PVE_STEP, 'O seu Soulmon bate mais forte', 'na Arena, na Fenda e no Pesadelo (ataque)'), descEn: den(PVE_STEP, 'Your Soulmon hits harder', 'in the Arena, Endless Rift and Nightmare (attack)') },
  'tal-pve-02': { namePt: 'Muro da fenda', nameEn: 'Rift wall',
    descPt: `O seu Soulmon aguenta mais. Na Fenda é defesa de verdade (o inimigo precisa de mais golpes); na Arena e no Pesadelo entra no bônus único da fenda. +${pct(PVE_STEP, true)} por grau, dentro do teto único de 5%.`, descEn: `Your Soulmon holds up better. In the Endless Rift it is real defense (foes need more blows); in the Arena and Nightmare it joins the single rift bonus. +${pct(PVE_STEP, false)} per rank, inside the single 5% cap.` },
  'tal-pve-03': { namePt: 'Gota subindo', nameEn: 'Rising droplet',
    descPt: `A cura entre as camadas da Fenda sobe ${pct(HEAL_BOOST_STEP, true)} do HP máximo por grau.`,
    descEn: `The healing between Endless Rift layers grows by ${pct(HEAL_BOOST_STEP, false)} of max HP per rank.` },
  'tal-pve-04': { namePt: 'Agulha de bússola', nameEn: 'Compass needle',
    descPt: `${pct(RIFT_BITS_STEP, true)} mais Bits por grau nos que você ganha na fenda. Não cria fonte nova: só rende mais do que a fenda já dava.`,
    descEn: `${pct(RIFT_BITS_STEP, false)} more Bits per rank on the ones you earn in the rift. No new source: it only adds to what the rift already gave.` },
  'tal-pve-05': { namePt: 'Lua com olho', nameEn: 'Eyed moon',
    descPt: dpt(NIGHTMARE_STEP, 'O seu Soulmon bate mais forte', 'só no Pesadelo (ataque)'),
    descEn: den(NIGHTMARE_STEP, 'Your Soulmon hits harder', 'in the Nightmare only (attack)') },
  'tal-pve-06': { namePt: 'Arco de luz', nameEn: 'Arc of light',
    descPt: `Golpes mais seguidos. Na Fenda é ritmo de verdade (o golpe sai mais cedo); na Arena e no Pesadelo entra no bônus único da fenda. +${pct(ARC_STEP, true)} por grau, dentro do teto único de 5%.`,
    descEn: `Quicker blows. In the Endless Rift it is real rhythm (the blow lands sooner); in the Arena and Nightmare it joins the single rift bonus. +${pct(ARC_STEP, false)} per rank, inside the single 5% cap.` },
  'tal-pve-07': { namePt: 'Arco coroado', nameEn: 'Crowned arc',
    descPt: `A primeira luta de cada andar da fenda começa com um escudo leve, ${Math.round(START_SHIELD_STEP * 100)}% do seu HP.`,
    descEn: `The first fight of each rift floor starts with a light shield, ${Math.round(START_SHIELD_STEP * 100)}% of your HP.` },
  'tal-com-01': { namePt: 'Etiqueta', nameEn: 'Price tag', descPt: `Equipamento ${pct(PRICE_STEP, true)} mais barato em Bits por grau. É preço, não combate.`, descEn: `Equipment ${pct(PRICE_STEP, false)} cheaper in Bits per rank. It is price, not combat.` },
  'tal-com-02': { namePt: 'Fragmentos', nameEn: 'Fragments', descPt: `${pct(FRAGMENT_GAIN_STEP, true)} mais fragmentos por grau, até +25%. É moeda ganha, não combate.`, descEn: `${pct(FRAGMENT_GAIN_STEP, false)} more fragments per rank, up to +25%. Earned currency, not combat.` },
  'tal-com-03': { namePt: 'Ampulheta de moeda', nameEn: 'Coin hourglass',
    descPt: `Refazer a árvore custa ${Math.round(RESPEC_STEP * 100)}% menos por grau. É preço, não combate.`,
    descEn: `Rebuilding the tree costs ${Math.round(RESPEC_STEP * 100)}% less per rank. It is price, not combat.` },
  'tal-com-04': { namePt: 'Bolsa com alça', nameEn: 'Strapped pouch', descPt: `+${BACKPACK_STEP} espaço por grau nos Arquivos (peças guardadas fora dos slots; os Arquivos começam com ${BACKPACK_BASE}). É capacidade, não combate.`, descEn: `+${BACKPACK_STEP} Files slot per rank (pieces kept outside the slots; Files starts with ${BACKPACK_BASE}). Capacity, not combat.` },
  'tal-com-05': { namePt: 'Balança', nameEn: 'Scales',
    descPt: 'Refazer UM ponto à sua escolha, em vez da árvore toda, pelo preço de um ponto (Bits que você ganhou jogando). É conveniência, não combate.',
    descEn: 'Take back ONE point of your choice instead of the whole tree, at the price of one point (Bits you earned by playing). Convenience, not combat.' },
  'tal-com-06': { namePt: 'Pergaminho enrolado', nameEn: 'Rolled scroll', descPt: `${pct(MISSION_BITS_STEP, true)} mais Bits por grau no dia completo, até +25%. Não cria Bits novos: só rende mais do que o dia já dava. É moeda, não combate.`, descEn: `${pct(MISSION_BITS_STEP, false)} more Bits per rank on a complete day, up to +25%. No new source of Bits: it only adds to what the day already gave. Currency, not combat.` },
};

/**
 * A LINHA "Agora / No grau máximo" do modal do nó (11/10/2026): o efeito do nó TRADUZIDO em unidade de jogo, no grau atual e no máximo
 * — para a pessoa ver o que o ponto muda em vez de um "+0,4% por grau" solto. Só os nós de combate e da fenda (o Comércio já traz o
 * número na própria descrição e não é combate). `null` = sem linha. Os números vêm das MESMAS constantes do dono (`talents.ts`).
 */
export function talentEffectLine(id: string, rank: number, isPt: boolean): string | null {
  const node = TALENT_BY_ID.get(id);
  if (!node) return null;
  const e = node.effect;
  const at = (g: number): string | null => {
    switch (e.kind) {
      case 'combatBonus': {
        const what = e.scope === 'nightmare'
          ? (isPt ? 'de dano no Pesadelo' : 'damage in the Nightmare')
          : e.attr === 'def' ? (isPt ? 'de defesa' : 'defense') : e.attr === 'spd' ? (isPt ? 'de ritmo' : 'rhythm') : (isPt ? 'de dano' : 'damage');
        return `+${pct(e.perRank * g, isPt)} ${what}`;
      }
      case 'allAttr': return isPt ? `+${pct(e.perRank * g, true)} em cada canal` : `+${pct(e.perRank * g, false)} in each channel`;
      case 'startEnergy': {
        const n = e.perRank * g;
        return isPt ? `${n} de energia do especial já na largada (≈ ${(n / ENERGY.perSecond).toFixed(1).replace('.', ',')} s a menos de espera)` : `${n} special energy from the start (≈ ${(n / ENERGY.perSecond).toFixed(1)} s less waiting)`;
      }
      case 'cheerBoost': return isPt ? `+${pct(e.perRank * g, true)} de energia da torcida` : `+${pct(e.perRank * g, false)} cheer energy`;
      case 'dotResist': return isPt ? `${pct(e.perRank * g, true)} menos dano de efeito contínuo` : `${pct(e.perRank * g, false)} less over-time damage`;
      case 'healBoost': return isPt ? `+${pct(e.perRank * g, true)} do HP máximo na cura entre andares` : `+${pct(e.perRank * g, false)} of max HP in the between-floor heal`;
      case 'riftBits': return isPt ? `+${pct(e.perRank * g, true)} de Bits ganhos na fenda` : `+${pct(e.perRank * g, false)} Bits earned in the rift`;
      case 'startShield': return isPt ? `escudo de ${pct(e.perRank * g, true)} do HP no começo da luta` : `a shield worth ${pct(e.perRank * g, false)} of HP at the start of the fight`;
      default: return null;
    }
  };
  const max = at(node.maxRank);
  if (max === null) return null;
  const now = rank > 0 ? at(rank)! : (isPt ? 'nada ainda' : 'nothing yet');
  return isPt ? `Agora: ${now} · No grau máximo: ${max}.` : `Now: ${now} · At top rank: ${max}.`;
}
