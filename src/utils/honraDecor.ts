// ---------------------------------------------------------------------------
// DECORAÇÃO DE HONRA — armeiro, estátuas, manequins, bigornas, armas de chão, estandartes,
// pedestais e chãos de arena (lote 14–15/11/2026; plano em `docs/PLANO-HONRA-DECORACAO.md` §2).
//
// Catálogo GERADO, não digitado, no molde de `cosmeticosNovos.ts`: categorias × materiais × a escada
// de preço. A ARTE É A PORTA — a peça só entra na loja de Honra quando existe
// `assets/decor/<id>.webp` (instalador: `tools/instalar-honra-decor.py`). Hoje: bronze, prata e
// mithril; o OURO fica de fora até a arte refeita chegar (basta soltar o arquivo, nada de código).
//
// REGRAS QUE NÃO PODEM CAIR (há teste travando cada uma):
//  · cosmético puro: `kind: 'furniture'`, moeda Honra (`emblems`), sem `attr`, sem `unlock`;
//  · id estável `hon-<categoria>-<peça>-<material>` (o nome do arquivo de arte);
//  · a arma mora DENTRO do espaço `wall` (decisão P1b do dono, 14/11/2026): nenhum espaço novo,
//    nenhum campo novo no save — `equippedDecor.wall` grava o id como qualquer peça;
//  · só Honra (a Serpente da Feira NÃO vende estas peças até o dono decidir P6).
// ---------------------------------------------------------------------------
import type { SlotId } from './petStage';
import type { ShopItem } from './shop';

export type MaterialHonra = 'bronze' | 'prata' | 'ouro' | 'mithril';

/** A escada de Honra por nível (plano §2.2). Constantes nomeadas para recalibrar sem tocar no catálogo. */
export const HONRA_PRECO: Readonly<Record<MaterialHonra, number>> = { bronze: 25, prata: 70, ouro: 180, mithril: 450 };
/** Peça sem nível (chão de arena). */
export const HONRA_PRECO_TAPETE = 40;

export const MATERIAIS_HONRA: readonly MaterialHonra[] = ['bronze', 'prata', 'ouro', 'mithril'];

const MAT: Record<MaterialHonra, { pt: string; en: string }> = {
  bronze: { pt: 'Bronze', en: 'Bronze' },
  prata: { pt: 'Prata', en: 'Silver' },
  ouro: { pt: 'Ouro', en: 'Gold' },
  mithril: { pt: 'Mithril', en: 'Mithril' },
};

export interface HonraDecor extends ShopItem {
  kind: 'furniture';
  currency: 'emblems';
  slot: SlotId;
  categoria: string;
}

type Nome = readonly [pt: string, en: string];
interface Linha { slot: SlotId; icon: string; desc: Nome }

const DESC: Record<string, Nome> = {
  wall: ['Pendurado acima do pet, em qualquer cenário', 'Hangs above the pet, in any scene'],
  'floor-left': ['Ocupa o canto esquerdo — combina com qualquer cenário', 'Takes the left corner — fits any scene'],
  'floor-right': ['Ocupa o canto direito — combina com qualquer cenário', 'Takes the right corner — fits any scene'],
  trophy: ['Vitrine — exibe os troféus que você ganhou de verdade', 'Display case — shows the trophies you actually won'],
  rug: ['Ocupa o chão, no centro — combina com qualquer cenário', 'Takes the floor, centered — fits any scene'],
};
const linha = (slot: SlotId, icon: string): Linha => ({ slot, icon, desc: DESC[slot] });

interface Familia { categoria: string; peca: string; l: Linha; nome: (m: MaterialHonra) => Nome }
const mpt = (m: MaterialHonra) => MAT[m].pt;
const men = (m: MaterialHonra) => MAT[m].en;

const ARMAS: Array<[string, string, string, string]> = [
  ['lanca', 'Lança', 'Spear', '🔱'], ['espada', 'Espada', 'Sword', '🗡️'], ['escudo', 'Escudo', 'Shield', '🛡️'],
  ['machado', 'Machado', 'Axe', '🪓'], ['arco', 'Arco', 'Bow', '🏹'], ['cajado', 'Cajado', 'Staff', '🪄'],
];
const ESTATUAS: Array<[string, string, string]> = [
  ['guerreiro', 'do Guerreiro', 'Warrior'], ['mago', 'do Mago', 'Mage'],
  ['guardiao', 'do Guardião', 'Guardian'], ['arqueira', 'da Arqueira', 'Archer'],
];
const CHAO: Array<[string, string, string, string]> = [
  ['espada-pedra', 'Espada na Pedra', 'Sword in the Stone', '🗡️'],
  ['cajado', 'Cajado no Pedestal', 'Staff on a Pedestal', '🪄'],
  ['escudo', 'Escudo de Guarda', 'Guard Shield', '🛡️'],
  ['lancas', 'Feixe de Lanças', 'Spear Rack', '🔱'],
];
const MANEQUIM: Record<MaterialHonra, Nome> = {
  bronze: ['Manequim do Recruta', "Recruit's Mannequin"], prata: ['Manequim do Cavaleiro', "Knight's Mannequin"],
  ouro: ['Manequim do Campeão', "Champion's Mannequin"], mithril: ['Manequim Lendário', 'Legendary Mannequin'],
};
const BIGORNA: Record<MaterialHonra, Nome> = {
  bronze: ['Bigorna do Aprendiz', "Apprentice's Anvil"], prata: ['Bigorna do Armeiro', "Armorer's Anvil"],
  ouro: ['Bigorna Rúnica', 'Runic Anvil'], mithril: ['Bigorna de Mithril', 'Mithril Anvil'],
};

const FAMILIAS: Familia[] = [
  ...ARMAS.map(([p, pt, en, icon]): Familia => ({
    categoria: 'arma', peca: p, l: linha('wall', icon),
    nome: m => [`${pt} de ${mpt(m)}`, `${men(m)} ${en}`],
  })),
  ...ESTATUAS.map(([p, pt, en]): Familia => ({
    categoria: 'estatua', peca: p, l: linha('floor-left', '🗿'),
    nome: m => [`Estátua de ${mpt(m)} ${pt}`, `${men(m)} ${en} Statue`],
  })),
  ...CHAO.map(([p, pt, en, icon]): Familia => ({
    categoria: 'chao', peca: p, l: linha('floor-right', icon),
    nome: m => [`${pt} de ${mpt(m)}`, `${men(m)} ${en}`],
  })),
  { categoria: 'manequim', peca: '', l: linha('floor-left', '🥋'), nome: m => MANEQUIM[m] },
  { categoria: 'bigorna', peca: '', l: linha('floor-right', '⚒️'), nome: m => BIGORNA[m] },
  { categoria: 'estandarte', peca: '', l: linha('wall', '🎌'), nome: m => [`Estandarte de ${mpt(m)} da Ordem`, `${men(m)} Order Banner`] },
  { categoria: 'pedestal', peca: '', l: linha('trophy', '🏆'), nome: m => [`Pedestal de ${mpt(m)}`, `${men(m)} Plinth`] },
];

const TAPETES: Array<[string, Nome]> = [
  ['circulo-duelo', ['Círculo de Duelo', 'Duel Circle']],
  ['lajes-arena', ['Lajes da Arena', 'Arena Flagstones']],
  ['passadeira', ['Passadeira do Campeão', "Champion's Runner"]],
];

const idDe = (cat: string, peca: string, mat: string) => ['hon', cat, peca, mat].filter(Boolean).join('-');

function build(): HonraDecor[] {
  const out: HonraDecor[] = [];
  const mk = (id: string, categoria: string, l: Linha, nome: Nome, price: number): HonraDecor => ({
    id, categoria, kind: 'furniture', currency: 'emblems', icon: l.icon, slot: l.slot, fits: 'any',
    namePt: nome[0], nameEn: nome[1], descPt: l.desc[0], descEn: l.desc[1], price,
  });
  for (const f of FAMILIAS) {
    for (const m of MATERIAIS_HONRA) out.push(mk(idDe(f.categoria, f.peca, m), f.categoria, f.l, f.nome(m), HONRA_PRECO[m]));
  }
  for (const [p, nome] of TAPETES) out.push(mk(idDe('tapete', p, ''), 'tapete', linha('rug', '🟫'), nome, HONRA_PRECO_TAPETE));
  return out;
}

/** O catálogo inteiro planejado (inclui peça ainda sem arte, como o ouro). */
export const HONRA_DECOR_PLANEJADA: readonly HonraDecor[] = build();

const ARTE = import.meta.glob('../assets/decor/hon-*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const idDoArquivo = (p: string): string => /\/([a-z0-9-]+)\.webp$/.exec(p)![1];
export const ARTE_DECOR_HONRA: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(ARTE).map(([p, u]) => [idDoArquivo(p), u]));

/** As peças com arte instalada — só estas existem para o jogo (entram em `TOURNAMENT_ITEMS`). */
export const HONRA_DECOR: readonly HonraDecor[] = HONRA_DECOR_PLANEJADA.filter(c => !!ARTE_DECOR_HONRA[c.id]);
