/**
 * Textos da HEXSMITH (01/11/2026). Inglês primeiro, par PT-BR via `isPt`. Regras e números vêm de `hexsmith.ts` (nada de literal aqui).
 * Leis de escrita (`docs/NARRATIVA-E-UNIVERSO.md`): o texto descreve o ATO e o efeito na Malha; recusa é convite, nunca cobrança.
 */
import type { SpecialFamily } from './combate/specials';
import type { HexRefusal, HexSlot, HexStrike } from './hexsmith';

type Par = { en: string; pt: string };
const p = (en: string, pt: string): Par => ({ en, pt });
export const tx = (par: Par, isPt: boolean) => (isPt ? par.pt : par.en);

export const HEX_SLOT_COPY: Readonly<Record<HexSlot, { name: Par; effect: Par; line: Par }>> = {
  coroa: { name: p('Crown', 'Coroa'), effect: p('Special family', 'Família do especial'), line: p('Special', 'Especial') },
  amuleto: { name: p('Amulet', 'Amuleto'), effect: p('Special element', 'Elemento do especial'), line: p('Special element', 'Elemento do especial') },
  garra: { name: p('Claw', 'Garra'), effect: p('Basic attack element', 'Elemento do ataque básico'), line: p('Basic', 'Básico') },
  couraca: { name: p('Cuirass', 'Couraça'), effect: p('Element when defending (only the damage it takes)', 'Elemento na defesa (só o dano que recebe)'), line: p('Defense', 'Defesa') },
  luvas: { name: p('Gloves', 'Luvas'), effect: p('Basic attack reach (looks only)', 'Alcance do ataque básico (só visual)'), line: p('Reach', 'Alcance') },
};

export const HEX_FAMILY_COPY: Readonly<Record<SpecialFamily, Par>> = {
  direct: p('Direct strike', 'Golpe direto'),
  dot: p('Lingering damage', 'Dano contínuo'),
  heal: p('Healing', 'Cura'),
  shield: p('Shield', 'Escudo'),
  atkBuff: p('Attack boost', 'Reforço de ataque'),
  defDebuff: p('Armor break', 'Quebra de defesa'),
  spdBuff: p('Speed boost', 'Reforço de velocidade'),
};

export const HEX_STRIKE_COPY: Readonly<Record<HexStrike, Par>> = {
  ranged: p('Ranged', 'Distância'),
  melee: p('Close range', 'Corpo a corpo'),
};

/** O motivo que desabilita "Forjar", em linguagem de convite (o que ainda falta e onde se consegue). */
export function hexRefusalText(r: HexRefusal, isPt: boolean, el?: string): string {
  switch (r) {
    case 'owned': return isPt ? 'Já está na sua coleção.' : 'Already in your collection.';
    case 'potions': return isPt ? `Pede 3 poções de ${el ?? 'elemento'} — o Centro de Evolução, no Laboratório, as fabrica.` : `Takes 3 ${el ?? 'element'} potions — the Evolution Center in the Lab makes them.`;
    case 'fragments': return isPt ? 'Pede mais fragmentos — a Masmorra os deixa a cada profundidade nova.' : 'Takes more fragments — the Dungeon leaves them at each new depth.';
    case 'bits': return isPt ? 'Pede mais Bits ganhos jogando (Bits de Crédito não entram aqui).' : 'Takes more Bits earned by playing (Credit Bits do not count here).';
    default: return isPt ? 'Este item não existe.' : 'This item does not exist.';
  }
}

export const HEX_UI = {
  title: p('Hexsmith', 'Hexsmith'),
  intro: p('Tap a slot to forge or equip. Each slot rewrites one line of your Soulmon\'s hex code; one item per slot, and forged items stay in your collection forever.', 'Toque num encaixe para forjar ou equipar. Cada encaixe reescreve uma linha do código hex do Soulmon; um item por encaixe, e o que você forja fica na coleção para sempre.'),
  code: p('Hex code', 'Código hex'),
  was: p('was', 'era'),
  original: p('original', 'original'),
  empty: p('Empty', 'Vazio'),
  owned: p('Your items', 'Seus itens'),
  noneOwned: p('Nothing forged for this slot yet.', 'Nada forjado para este encaixe ainda.'),
  equip: p('Equip', 'Equipar'),
  equipped: p('Equipped', 'Equipado'),
  clear: p('Empty the slot', 'Esvaziar o encaixe'),
  forge: p('Forge', 'Forjar'),
  catalog: p('Forge', 'Forja'),
  filterHint: p('Filter by up to 3 base elements: only elements that contain all of them are listed. What you can forge comes first.', 'Filtre por até 3 elementos base: aparecem só os elementos que contêm todos eles. O que dá para forjar vem primeiro.'),
  balance: p('You have', 'Você tem'),
  potions: p('potions', 'poções'),
  fragments: p('fragments', 'fragmentos'),
  bitsEarned: p('earned Bits', 'Bits ganhos'),
  forged: p('Forged. The line is rewritten.', 'Forjado. A linha foi reescrita.'),
  close: p('Back to the slots', 'Voltar aos encaixes'),
  noMatch: p('No unlocked element has all these bases yet. Elements unlock in the Drive.', 'Nenhum elemento desbloqueado tem todas essas bases ainda. Os elementos se desbloqueiam no Drive.'),
};
