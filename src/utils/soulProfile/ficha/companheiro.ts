// ---------------------------------------------------------------------------
// O COMPANHEIRO, visível e nomeado — decisão 2 do dono (PLANO-ORACULO.md §9,
// 28/09/2026): "Companheiro vira parceiro visível e nomeado (Home/masmorra)".
//
// A captura em si é mecânica real do class-system (`capture.ts`,
// `selectCompanion`: Evocação + afinidade elemental contra `poderBase`), e
// até a Fase 3 o resultado virava só a última frase da bio do reveal — com o
// nome em PT nas duas línguas ("Bonded with a Lobo Cinzento companion").
//
// Este módulo é o DONO do nome PT+EN do companheiro e da manifestação dele
// na Ficha (`PetPage`). O que ele NÃO expõe, de propósito: `poderBase`,
// `afinidades`, `familia` — números e taxonomia do class-system são ficha
// invisível (decisão 3; "nada dela vira número visível", §3).
//
// PT vem AO VIVO do snapshot (`CLASS_DATA.criaturas[id].nome`) — zero cópia.
// EN é tradução própria do Soulmon, por `id` (o mesmo padrão de
// `CLASS_TITLE_EN` e `PROFISSAO_EN`), e é a parte que precisa viver aqui
// porque o class-system é PT-only. Há teste exigindo 1 EN por criatura.
// ---------------------------------------------------------------------------

import type { LText } from '../../oracle';
import type { CapturaAvaliacao } from './capture';
import { CLASS_DATA } from './buildSheet';

export const COMPANHEIRO_EN: Record<string, string> = {
  lobo: 'Grey Wolf',
  urso: 'Cave Bear',
  felino: 'Shadow Panther',
  javali: 'Tusked Boar',
  falcao: 'Royal Falcon',
  coruja: 'Arcane Owl',
  serpente_marinha: 'Sea Serpent',
  tubarao: 'Abyssal Shark',
  salamandra: 'Salamander',
  cao_de_lava: 'Lava Hound',
  fenix_menor: 'Lesser Phoenix',
  ghoul: 'Ghoul',
  cavaleiro_morto: 'Dead Knight',
  sombra_rastejante: 'Crawling Shadow',
  olho_vil: 'Vile Eye',
  trevo_carnivoro: 'Carnivorous Clover',
  ent: 'Elder Treant',
  fada: 'Glimmering Fae',
  anjo_menor: 'Lesser Angel',
  espectro: 'Wandering Specter',
  golem_pedra: 'Stone Golem',
  automato: 'Voltaic Automaton',
  imp: 'Imp',
  demonio_maior: 'Greater Demon',
  wyvern: 'Wyvern',
  dragao_jovem: 'Young Dragon',
  troll_montanhes: 'Mountain Troll',
  ciclope_forjador: 'Forge Cyclops',
  gosma_acida: 'Acid Ooze',
  slime_cristalino: 'Crystal Slime',
  batedor_orc: 'Orc Scout',
  arauto_elfico: 'Elven Herald',
};

/** O que o jogador vê do companheiro — e SÓ isso. */
export interface CompanheiroVisivel {
  id: string;
  nome: LText;
}

/** Nome PT+EN de uma criatura do registro do class-system, pelo `id`. */
export function companheiroNome(id: string): LText {
  const pt = CLASS_DATA.criaturas[id as keyof typeof CLASS_DATA.criaturas]?.nome ?? id;
  return { pt, en: COMPANHEIRO_EN[id] ?? pt };
}

/** Reduz a avaliação de captura (mecânica) ao que se mostra (identidade). */
export function companheiroVisivel(captura: CapturaAvaliacao | null): CompanheiroVisivel | undefined {
  if (!captura) return undefined;
  return { id: captura.id, nome: companheiroNome(captura.id) };
}
