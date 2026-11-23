/**
 * Textos da HEXSMITH (01/11/2026). Inglês primeiro, par PT-BR via `isPt`. Regras e números vêm de `hexsmith.ts` (nada de literal aqui).
 * Leis de escrita (`docs/NARRATIVA-E-UNIVERSO.md`): o texto descreve o ATO e o efeito na Malha; recusa é convite, nunca cobrança.
 */
import type { SpecialFamily } from './combate/specials';
import type { HexCrownEffect, HexRefusal, HexSlot, HexStrike } from './hexsmith';

type Par = { en: string; pt: string };
const p = (en: string, pt: string): Par => ({ en, pt });
export const tx = (par: Par, isPt: boolean) => (isPt ? par.pt : par.en);

export const HEX_SLOT_COPY: Readonly<Record<HexSlot, { name: Par; port: Par; effect: Par; line: Par; desc: Par }>> = {
  coroa: { name: p('Crown', 'Coroa'), port: p('Crown Port', 'Porta da Coroa'), effect: p('Special family', 'Família do especial'), line: p('Special', 'Especial'), desc: p('Changes the type of special', 'Troca o tipo de especial') },
  amuleto: { name: p('Amulet', 'Amuleto'), port: p('Amulet Port', 'Porta do Amuleto'), effect: p('Special element', 'Elemento do especial'), line: p('Special element', 'Elemento do especial'), desc: p('Swap this chip, swap the special’s element', 'Troca esse chip, troca o elemento do especial') },
  garra: { name: p('Claw', 'Garra'), port: p('Claw Port', 'Porta da Garra'), effect: p('Basic attack element', 'Elemento do ataque básico'), line: p('Basic', 'Básico'), desc: p('Swap this chip, swap the basic attack’s element', 'Troca esse chip, troca o elemento do ataque básico') },
  couraca: { name: p('Cuirass', 'Couraça'), port: p('Cuirass Port', 'Porta da Couraça'), effect: p('Element when defending (only the damage it takes)', 'Elemento na defesa (só o dano que recebe)'), line: p('Defense', 'Defesa'), desc: p('Changes your element only for damage you take', 'Troca seu elemento só para o dano que você recebe') },
  luvas: { name: p('Gloves', 'Luvas'), port: p('Gloves Port', 'Porta das Luvas'), effect: p('Basic attack type (looks only)', 'Tipo do ataque básico (só visual)'), line: p('Attack', 'Ataque'), desc: p('Changes how the basic attack looks, not its power', 'Muda o visual do ataque básico, não a força') },
};

/** O nome do item: um HEX (dono, 01/11/2026). "HEX de Água" / "Water HEX". */
export const hexName = (value: string, isPt: boolean) => (isPt ? `HEX de ${value}` : `${value} HEX`);

export const HEX_FAMILY_COPY: Readonly<Record<SpecialFamily, Par>> = {
  direct: p('Direct strike', 'Golpe direto'),
  dot: p('Lingering damage', 'Dano contínuo'),
  heal: p('Healing', 'Cura'),
  shield: p('Shield', 'Escudo'),
  atkBuff: p('Attack boost', 'Reforço de ataque'),
  defDebuff: p('Armor break', 'Quebra de defesa'),
  spdBuff: p('Speed boost', 'Reforço de velocidade'),
  defBuff: p('Guard boost', 'Reforço de defesa'),
  atkDebuff: p('Weaken', 'Enfraquecer'),
  spdDebuff: p('Hobble', 'Entrave'),
};

/** Coroas de EFEITO (`HEX_CROWN_EFFECTS`): nome do valor. Descrição honesta: o que o efeito faz e onde. */
export const HEX_CROWN_EFFECT_COPY: Readonly<Record<HexCrownEffect, { name: Par; desc: Par }>> = {
  hot: { name: p('Mending', 'Cura contínua'), desc: p('A shield that heals you in three pulses.', 'Um escudo que cura você em três pulsos.') },
  slow: { name: p('Slowing', 'Lentidão'), desc: p('Breaks the foe’s guard and slows its strikes.', 'Quebra a guarda do alvo e atrasa os golpes dele.') },
  silence: { name: p('Silencing', 'Silêncio'), desc: p('Breaks the foe’s guard and keeps its special quiet for a few strikes.', 'Quebra a guarda do alvo e cala o especial dele por alguns golpes.') },
};

/** Descrição das Coroas de FAMÍLIA (as 7 de sempre + as 3 novas, `ALL_SPECIAL_FAMILIES`): o que fazem, em linguagem de convite. Sem número nem vantagem prometida. */
export const HEX_CROWN_FAMILY_DESC: Readonly<Record<SpecialFamily, Par>> = {
  direct: p('A single clean blow of damage.', 'Um golpe limpo de dano, de uma vez.'),
  dot: p('Damage that keeps working over your next strikes.', 'Dano que segue agindo nos seus próximos golpes.'),
  heal: p('Mends you right away.', 'Cura você na hora.'),
  shield: p('A barrier that takes the blows for you.', 'Uma barreira que recebe os golpes por você.'),
  atkBuff: p('Your strikes land stronger for a while.', 'Seus golpes batem mais forte por um tempo.'),
  defDebuff: p('Breaks the foe’s guard so it takes more damage.', 'Quebra a guarda do alvo, e ele recebe mais dano.'),
  spdBuff: p('Your strikes come faster for a while.', 'Seus golpes vêm mais rápido por um tempo.'),
  defBuff: p('Your guard rises: the next blows you take hurt less.', 'Sua guarda sobe: os próximos golpes que você recebe doem menos.'),
  atkDebuff: p('The foe’s next blows land weaker.', 'Os próximos golpes do alvo batem mais fraco.'),
  spdDebuff: p('The foe strikes later, blow after blow.', 'O alvo ataca mais devagar, golpe após golpe.'),
};

/** O que a Coroa FAZ (efeito ou família); `undefined` só para valor desconhecido (ex.: o original da ficha). */
export function hexCrownValueDesc(value: string): Par | undefined {
  return (HEX_CROWN_EFFECT_COPY as Record<string, { desc: Par } | undefined>)[value]?.desc ?? (HEX_CROWN_FAMILY_DESC as Record<string, Par | undefined>)[value];
}

/** Nome legível do valor de uma Coroa (família ou efeito). `undefined` = valor desconhecido (ex.: o original da ficha). */
export function hexCrownValueCopy(value: string): Par | undefined {
  return (HEX_FAMILY_COPY as Record<string, Par | undefined>)[value] ?? (HEX_CROWN_EFFECT_COPY as Record<string, { name: Par } | undefined>)[value]?.name;
}

export const HEX_STRIKE_COPY: Readonly<Record<HexStrike, Par>> = {
  magic: p('Magic', 'Magia'),
  'ranged-slash': p('Ranged Slash', 'Corte à distância'),
  'melee-slash': p('Melee Slash', 'Corte corpo a corpo'),
  'melee-smash': p('Melee Smash', 'Esmagamento'),
};

/** Legenda curta (texto, sem ícone dentro de box) do que o ataque das Luvas desenha: alcance + acabamento. */
export const HEX_STRIKE_LEGEND: Readonly<Record<HexStrike, Par>> = {
  magic: p('From afar, bursts on impact', 'De longe, explode no impacto'),
  'ranged-slash': p('From afar, a cutting arc', 'De longe, um arco cortante'),
  'melee-slash': p('Up close, a blade cut', 'De perto, um corte de lâmina'),
  'melee-smash': p('Up close, a crushing blow', 'De perto, um golpe de impacto'),
};

/** O motivo que desabilita "Forjar", em linguagem de convite (o que ainda falta e onde se consegue). */
export function hexRefusalText(r: HexRefusal, isPt: boolean, el?: string): string {
  switch (r) {
    case 'owned': return isPt ? 'Já está na sua coleção.' : 'Already in your collection.';
    case 'potions': return isPt ? `Pede 1 poção de ${el ?? 'elemento'} — o Centro de Evolução, no Laboratório, as fabrica.` : `Takes 1 ${el ?? 'element'} potion — the Evolution Center in the Lab makes them.`;
    case 'fragments': return isPt ? 'Pede mais fragmentos — a Masmorra os deixa a cada profundidade nova.' : 'Takes more fragments — the Dungeon leaves them at each new depth and run.';
    case 'bits': return isPt ? 'Ainda faltam Bits.' : 'Not enough Bits yet.';
    default: return isPt ? 'Este HEX não existe.' : 'This HEX does not exist.';
  }
}

export const HEX_UI = {
  title: p('Hexsmith', 'Hexsmith'),
  intro: p('Tap a Port to forge or equip a HEX. Each Port rewrites one line of your Soulmon\'s hex code; one HEX per Port, and forged HEXes stay in your collection forever.', 'Toque numa Porta para forjar ou equipar um HEX. Cada Porta reescreve uma linha do código hex do Soulmon; um HEX por Porta, e os HEXes forjados ficam na coleção para sempre.'),
  code: p('Hex code', 'Código hex'),
  was: p('was', 'era'),
  original: p('original', 'original'),
  empty: p('Empty', 'Vazio'),
  owned: p('Your HEXes', 'Seus HEXes'),
  noneOwned: p('No HEX forged for this Port yet.', 'Nenhum HEX forjado para esta Porta ainda.'),
  equip: p('Equip', 'Equipar'),
  equipped: p('Equipped', 'Equipado'),
  /** 13/11/2026 (dono): o "Esvaziar a porta" saiu; o próprio botão do HEX equipado desequipa. */
  unequip: p('Unequip', 'Desequipar'),
  /** 23/11/2026: texto do status sr-only ao alternar ("X: equipado"). */
  equippedMsg: p('equipped', 'equipado'),
  unequippedMsg: p('unequipped', 'desequipado'),
  forge: p('Forge', 'Forjar'),
  catalog: p('Forge', 'Forja'),
  filterHint: p('Filter by up to 3 base elements: only elements that contain all of them are listed. What you can forge comes first.', 'Filtre por até 3 elementos base: aparecem só os elementos que contêm todos eles. O que dá para forjar vem primeiro.'),
  balance: p('You have', 'Você tem'),
  potions: p('potions', 'poções'),
  colItem: p('Item', 'Item'),
  colCost: p('Cost', 'Custo'),
  potionTipLabel: p('How to get this potion', 'Como conseguir esta poção'),
  fragments: p('fragments', 'fragmentos'),
  bitsEarned: p('Bits', 'Bits'),
  /** Aviso calmo na Coroa equipada, só para quem evoca: a invocação descansa enquanto a Coroa troca o especial. */
  companionRests: p('While the Crown is equipped, your companion rests.', 'Com a Coroa equipada, o companheiro descansa.'),
  forged: p('Forged. The line is rewritten.', 'Forjado. A linha foi reescrita.'),
  forging: p('Forging…', 'Forjando…'),
  forgeOffline: p('No connection. The HEX is forged on the server; nothing was charged. Try again when you are online.', 'Sem conexão. O HEX é forjado no servidor; nada foi cobrado. Tente de novo quando estiver online.'),
  forgeFailed: p('The forge did not answer. Nothing was charged; try again.', 'A forja não respondeu. Nada foi cobrado; tente de novo.'),
  forgeNoFunds: p('The server did not find the balance for this HEX. Nothing was charged.', 'O servidor não encontrou saldo para este HEX. Nada foi cobrado.'),
  close: p('Back to the Ports', 'Voltar às Portas'),
  noMatch: p('No unlocked element has all these bases yet. Elements unlock in the Drive.', 'Nenhum elemento desbloqueado tem todas essas bases ainda. Os elementos se desbloqueiam no Drive.'),
};

/** Renomear na Hexsmith (11/11/2026): lápis = nome do Soulmon, chama = nome do especial. O preço vem de `HEX_RENAME_COST`. */
export const HEX_RENAME_COPY = {
  pet: {
    btn: p('Rename your Soulmon', 'Trocar o nome do Soulmon'),
    title: p('Rename your Soulmon', 'Trocar o nome do Soulmon'),
    hint: p('The name shown on the Home screen and in the community.', 'O nome mostrado na tela principal e na comunidade.'),
  },
  especial: {
    btn: p('Rename your special', 'Trocar o nome do especial'),
    title: p('Rename your special', 'Trocar o nome do especial'),
    hint: p('Anyone who duels you sees this name.', 'Quem duelar contra você vê este nome.'),
  },
  label: p('New name', 'Novo nome'),
  rules: p('Up to 20 characters: letters, numbers and spaces, no bad words.', 'Até 20 caracteres: letras, números e espaço, sem palavrões.'),
  cost: p('Cost', 'Custo'),
  confirm: p('Change name', 'Trocar nome'),
  confirmAsk: p('Spend {n} Bits to change the name?', 'Gastar {n} Bits para trocar o nome?'),
  yes: p('Yes, spend', 'Sim, gastar'),
  no: p('Back', 'Voltar'),
  working: p('Changing…', 'Trocando…'),
  done: p('Name changed.', 'Nome trocado.'),
  offline: p('No connection. The server charges and saves the name; nothing was charged. Try again when you are online.', 'Sem conexão. O servidor cobra e grava o nome; nada foi cobrado. Tente de novo quando estiver online.'),
  failed: p('The server did not answer. Nothing was charged; try again.', 'O servidor não respondeu. Nada foi cobrado; tente de novo.'),
  noFunds: p('The server did not find enough Bits. Nothing was charged.', 'O servidor não encontrou Bits suficientes. Nada foi cobrado.'),
  rejected: p('That name was not accepted. Try another.', 'Esse nome não foi aceito. Tente outro.'),
  refusal: {
    empty: p('Type a name.', 'Digite um nome.'),
    invalid: p('Use only letters, numbers and spaces, no bad words.', 'Use só letras, números e espaço, sem palavrões.'),
    same: p('That is already the current name.', 'Esse já é o nome atual.'),
    bits: p('Not enough Bits yet.', 'Ainda faltam Bits.'),
  },
  readonlyHint: p('Change it at the Hexsmith.', 'Troque na Hexsmith.'),
} as const;

/**
 * COMO CONSEGUIR uma poção de elemento (tooltip da tabela de custo da Hexsmith, 12/11/2026). Base: 100 essências do próprio elemento no
 * Centro de Evolução (a Vesca avisa ao juntar) ou à venda na Feira. Composto: 1 poção de cada base + 50 essências do composto.
 * `name` resolve o nome do elemento; `bases` são os ids base do composto (vazio/1 = base). Números de `elementPotion.ts` (`POTION_COSTS`).
 */
export function potionHowTo(isPt: boolean, name: string, baseNames: readonly string[], costs: { baseOwn: number; compositeFinal: number }): string {
  if (baseNames.length < 2) {
    return isPt
      ? `Junte ${costs.baseOwn} essências de ${name} (elas caem de inimigos desse elemento) e a Vesca faz a poção no Centro de Evolução, no Laboratório. Às vezes a Vitra a vende na Feira.`
      : `Gather ${costs.baseOwn} ${name} essences (they drop from foes of that element) and Vesca brews the potion at the Evolution Center in the Lab. Vitra sometimes sells it at the Fair.`;
  }
  const list = baseNames.join(', ');
  return isPt
    ? `No Centro de Evolução, no Laboratório: 1 poção de cada elemento base (${list}) + ${costs.compositeFinal} essências de ${name}. Cada poção base se faz com essências ou se compra na Feira.`
    : `At the Evolution Center in the Lab: 1 potion of each base element (${list}) + ${costs.compositeFinal} ${name} essences. Each base potion is brewed from essences or bought at the Fair.`;
}

/** Tooltip curto "como conseguir" dos itens do custo que não são poção (fragmentos e Bits). */
export function hexCostHowTo(kind: 'fragments' | 'bits', isPt: boolean): string {
  return kind === 'fragments'
    ? (isPt ? 'Fragmentos de Alma: a Masmorra os deixa a cada profundidade nova.' : 'Soul Fragments: the Dungeon leaves them at each new depth.')
    : (isPt ? 'Bits: concluindo hábitos, dias completos e minijogos, ou em pacotes no Cambista.' : 'Bits: completing habits, full days and minigames, or in packs at the Exchanger.');
}
export function hexCostTipLabel(kind: 'fragments' | 'bits', isPt: boolean): string {
  return kind === 'fragments' ? (isPt ? 'Como conseguir fragmentos' : 'How to get fragments') : (isPt ? 'Como conseguir Bits' : 'How to get Bits');
}
