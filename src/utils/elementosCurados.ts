/**
 * ELEMENTOS CURADOS NA BIBLIOTECA (01/11/2026, pergunta do dono "os novos elementos e Soulmon foram adicionados na Biblioteca?").
 * Os 50 elementos dos lotes 1–3 (números 212–261, `elementosLote{1,2,3}.data.ts`) já tinham Soulmon no roster (aba Selvagem),
 * mas NÃO estavam no dex de elementos (`elementDex.ts` só conhecia 20 base + 190 derivados). Aqui eles entram no dex da
 * Biblioteca, mais o `neutro` (o corvo, §211). Ficam FORA de `ALL_ELEMENT_IDS` de propósito: aquela lista também é o catálogo
 * da Loja de Essências e da Poção (com espelho no servidor), e esses dois não mudam com esta entrada.
 * Dados puros; nomes próprios PT/EN em `CURATED_ELEMENT_NAMES` (01/11/2026).
 */
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';

export interface ElementoCurado { num: string; id: string; componentes: readonly string[] }

export const ELEMENTOS_CURADOS: readonly ElementoCurado[] = [...COMBINADOS_LOTE1_DATA, ...COMBINADOS_LOTE2_DATA, ...COMBINADOS_LOTE3_DATA]
  .map(([num, id, , ...componentes]) => ({ num, id, componentes }))
  .sort((a, b) => Number(a.num) - Number(b.num));

/** Os 50 curados (212–261) e, por último, o neutro do corvo. */
export const CURATED_ELEMENT_IDS: readonly string[] = [...ELEMENTOS_CURADOS.map(e => e.id), 'neutro'];

const CURADO = new Map(ELEMENTOS_CURADOS.map(e => [e.id, e]));
export const isCuratedElement = (id: unknown): id is string => typeof id === 'string' && (CURADO.has(id) || id === 'neutro');
export const curatedComponents = (id: string): readonly string[] | undefined => CURADO.get(id)?.componentes;

/** Nomes próprios PT/EN (01/11/2026, proposta para o dono; tom dos 210 de `derivedElements`/`essenceLabels`). Lista também em `E:/tmp/nomes-elementos.md`. */
export const CURATED_ELEMENT_NAMES: Readonly<Record<string, { pt: string; en: string }>> = {
  geiser: { pt: 'Gêiser', en: 'Geyser' },
  vulcao: { pt: 'Vulcão', en: 'Volcano' },
  deserto: { pt: 'Deserto', en: 'Desert' },
  relampago_seco: { pt: 'Relâmpago Seco', en: 'Dry Lightning' },
  supernova: { pt: 'Supernova', en: 'Supernova' },
  nevasca: { pt: 'Nevasca', en: 'Blizzard' },
  permafrost: { pt: 'Permafrost', en: 'Permafrost' },
  monsoes: { pt: 'Monções', en: 'Monsoon' },
  peste_negra: { pt: 'Peste Negra', en: 'Black Plague' },
  coro_dos_afogados: { pt: 'Coro dos Afogados', en: 'Choir of the Drowned' },
  ossario_vivo: { pt: 'Ossário Vivo', en: 'Living Ossuary' },
  jardim_eterno: { pt: 'Jardim Eterno', en: 'Eternal Garden' },
  aurora_boreal: { pt: 'Aurora Boreal', en: 'Northern Lights' },
  duelista_temporal: { pt: 'Duelista Temporal', en: 'Time Duelist' },
  pulso_cosmico: { pt: 'Pulso Cósmico', en: 'Cosmic Pulse' },
  sabbat: { pt: 'Sabá', en: 'Sabbath' },
  hipnose: { pt: 'Hipnose', en: 'Hypnosis' },
  materia_escura: { pt: 'Matéria Escura', en: 'Dark Matter' },
  milagre: { pt: 'Milagre', en: 'Miracle' },
  memoria: { pt: 'Memória', en: 'Memory' },
  coral_celeste: { pt: 'Coral Celeste', en: 'Celestial Choir' },
  via_lactea: { pt: 'Via Láctea', en: 'Milky Way' },
  delirio: { pt: 'Delírio', en: 'Delirium' },
  cacador_de_almas: { pt: 'Caçador de Almas', en: 'Soul Hunter' },
  presagio: { pt: 'Presságio', en: 'Omen' },
  horizonte_de_eventos: { pt: 'Horizonte de Eventos', en: 'Event Horizon' },
  lamina_do_juizo: { pt: 'Lâmina do Juízo', en: 'Blade of Judgment' },
  bencao_marcial: { pt: 'Bênção Marcial', en: 'Martial Blessing' },
  arauto: { pt: 'Arauto', en: 'Herald' },
  farol: { pt: 'Farol', en: 'Beacon' },
  carniceiro: { pt: 'Carniceiro', en: 'Butcher' },
  entropia_final: { pt: 'Entropia Final', en: 'Final Entropy' },
  gladiador: { pt: 'Gladiador', en: 'Gladiator' },
  punho_gravitico: { pt: 'Punho Gravítico', en: 'Gravity Fist' },
  avatar_elemental: { pt: 'Avatar Elemental', en: 'Elemental Avatar' },
  titano_forjado: { pt: 'Titã Forjado', en: 'Forged Titan' },
  cataclismo: { pt: 'Cataclismo', en: 'Cataclysm' },
  sopro_do_dragao: { pt: 'Sopro do Dragão', en: "Dragon's Breath" },
  ragnarok: { pt: 'Ragnarök', en: 'Ragnarök' },
  genesis: { pt: 'Gênesis', en: 'Genesis' },
  tempestade_perfeita: { pt: 'Tempestade Perfeita', en: 'Perfect Storm' },
  leviata: { pt: 'Leviatã', en: 'Leviathan' },
  senhor_da_praga: { pt: 'Senhor da Praga', en: 'Plague Lord' },
  sinfonia_do_caos: { pt: 'Sinfonia do Caos', en: 'Symphony of Chaos' },
  vontade_absoluta: { pt: 'Vontade Absoluta', en: 'Absolute Will' },
  arquiteto_da_realidade: { pt: 'Arquiteto da Realidade', en: 'Reality Architect' },
  ceifador_estelar: { pt: 'Ceifador Estelar', en: 'Star Reaper' },
  renascimento: { pt: 'Renascimento', en: 'Rebirth' },
  juizo_final: { pt: 'Juízo Final', en: 'Last Judgment' },
  cavaleiro_absoluto: { pt: 'Cavaleiro Absoluto', en: 'Absolute Knight' },
  neutro: { pt: 'Neutro', en: 'Neutral' },
};

/** Nome exibido (o fallback do slug só existe para id fora da tabela, que o teste proíbe). */
export function curatedElementName(id: string, isPt: boolean): string {
  const n = CURATED_ELEMENT_NAMES[id];
  if (n) return isPt ? n.pt : n.en;
  const s = id.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
