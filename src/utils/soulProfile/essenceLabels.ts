// ---------------------------------------------------------------------------
// Nomes de essência em EN — o par de idioma dos elementos do class-system.
//
// O class-system é PT-only; o Soulmon exige PT+EN em tudo que chega ao
// usuário. Os nomes PT vivem em `derivedElements.ts` (mantido idêntico ao
// laboratório de propósito, para sincronizar por diff) — por isso o EN mora
// AQUI, num mapa separado por id, em vez de dentro daquele arquivo.
// `essenceLabel()` é o único ponto de exibição.
// ---------------------------------------------------------------------------

import type { DominantElementCandidate } from './derivedElements';
import { BASE_ELEMENT_LABELS } from './derivedElements';

const BASE_EN: Record<string, string> = {
  fogo: 'Fire', agua: 'Water', terra: 'Earth', ar: 'Air', eletricidade: 'Lightning',
  arcano: 'Arcane', sombra: 'Shadow', luz: 'Light', vileza: 'Malice', morte: 'Death',
  vida: 'Life', vigor: 'Vigor', marcial: 'Martial', tempo: 'Time', som: 'Sound',
  gravidade: 'Gravity', espaco: 'Space',
};

const DERIVED_EN: Record<string, string> = {
  vapor: 'Steam', lava: 'Lava', incendio: 'Wildfire', plasma: 'Plasma',
  fogo_feiticeiro: 'Witchfire', fogo_negro: 'Blackfire', chama_solar: 'Solar Flame',
  fogo_infernal: 'Hellfire', chama_azul: 'Blue Flame', fenix: 'Phoenix', fervor: 'Fervor',
  pantano: 'Swamp', gelo: 'Ice', agua_viva: 'Jellyfish', mare: 'Tide', abismo: 'Abyss',
  prisma: 'Prism', acido: 'Acid', veneno: 'Venom', nascente: 'Spring', correnteza: 'Current',
  areia: 'Sand', magnetismo: 'Magnetism', cristal: 'Crystal', obsidiana: 'Obsidian',
  ouro_vivo: 'Living Gold', solo_profano: 'Unhallowed Ground', ossuario: 'Ossuary',
  flora: 'Flora', tita: 'Titan', tempestade: 'Storm', eter: 'Aether', murmurio: 'Murmur',
  aurora: 'Aurora', enxofre: 'Brimstone', miasma: 'Miasma', alento: 'Breath', impeto: 'Impetus',
  fluxo: 'Flux', trovao_negro: 'Black Thunder', fulgor: 'Brilliance', tormento: 'Torment',
  galvanismo: 'Galvanism', sinapse: 'Synapse', reflexo: 'Reflex', ocultismo: 'Occultism',
  runa: 'Rune', pacto: 'Pact', alma: 'Soul', essencia: 'Essence', encantamento: 'Enchantment',
  crepusculo: 'Twilight', terror: 'Terror', espectro: 'Specter', parasita: 'Parasite',
  assassinio: 'Assassination', heresia: 'Heresy', julgamento: 'Judgement', santidade: 'Sanctity',
  bravura: 'Valor', praga: 'Plague', mutacao: 'Mutation', carnificina: 'Carnage',
  equilibrio: 'Balance', ceifa: 'Reaping', vitalidade: 'Vitality', forja: 'Forge',
  tempera: 'Temper', aco: 'Steel', esgrima: 'Fencing', aco_voltaico: 'Voltaic Steel',
  arsenal: 'Arsenal', lamina_oculta: 'Hidden Blade', lamina_radiante: 'Radiant Blade',
  serrilha: 'Serration', fio_funebre: 'Funeral Edge', lamina_viva: 'Living Blade',
  maestria: 'Mastery', pira_eterna: 'Eternal Pyre', erosao: 'Erosion', fossil: 'Fossilization',
  aceleracao: 'Acceleration', instante: 'Instant', cronomancia: 'Chronomancy',
  entropia: 'Entropy', eon: 'Aeon', ruina: 'Ruin', ocaso: 'Dusk', florescer: 'Bloom',
  frenesi: 'Frenzy', contratempo: 'Setback', estrondo: 'Blast', sonar: 'Sonar',
  terremoto: 'Earthquake', estampido: 'Sonic Boom', trovao: 'Thunder', cantico: 'Chant',
  sussurro: 'Whisper', harmonia: 'Harmony', dissonancia: 'Dissonance', requiem: 'Requiem',
  melodia: 'Vital Melody', brado: 'Bellow', cadencia: 'Cadence', eco: 'Echo',
  fornalha_estelar: 'Star Furnace', voragem: 'Maelstrom', colapso: 'Collapse',
  vacuo: 'Vacuum', magnetar: 'Magnetar', singularidade: 'Singularity',
  buraco_negro: 'Black Hole', halo_gravitacional: 'Gravity Halo', jugo: 'Yoke',
  implosao: 'Implosion', ancora_vital: 'Vital Anchor', peso_descomunal: 'Crushing Weight',
  ariete: 'Battering Ram', dilatacao: 'Dilation', onda_de_choque: 'Shockwave',
  meteoro: 'Meteor', cometa: 'Comet', asteroide: 'Asteroid', estratosfera: 'Stratosphere',
  pulsar: 'Pulsar', portal: 'Portal', vazio: 'Void', constelacao: 'Constellation',
  devorador: 'Devourer', nebulosa: 'Nebula', semente_estelar: 'Star Seed',
  gigante_estelar: 'Star Giant', lamina_sideral: 'Sidereal Blade', continuum: 'Continuum',
  silencio_cosmico: 'Cosmic Silence', dobra: 'Warp',
};

export const PROFISSAO_EN: Record<string, string> = {
  ferreiro: 'Blacksmith', tecelao: 'Weaver', artesao: 'Artisan', joalheiro: 'Jeweler',
  alquimista: 'Alchemist', curtidor: 'Tanner', encantador: 'Enchanter', escriba: 'Scribe',
  cozinheiro: 'Cook', luthier: 'Luthier', cartografo: 'Cartographer',
};

/** O id tem par EN? (para o teste de idioma — cognatos como "Lava" são
 *  idênticos nos dois, então comparar strings daria falso positivo). */
export function essenceHasEn(id: string): boolean {
  return id in DERIVED_EN || id in BASE_EN;
}

/** Nome de exibição da essência dominante (base ou combo), no idioma pedido. */
export function essenceLabel(candidate: DominantElementCandidate, isPt: boolean): string {
  if (isPt) return candidate.nome;
  return DERIVED_EN[candidate.id] ?? BASE_EN[candidate.id] ?? candidate.nome;
}

/** Par PT/EN do nome de um elemento base do class-system. */
export function baseElementLabel(id: string, isPt: boolean): string {
  if (isPt) return BASE_ELEMENT_LABELS[id as keyof typeof BASE_ELEMENT_LABELS] ?? id;
  return BASE_EN[id] ?? id;
}
