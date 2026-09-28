// O POOL DO BESTIÁRIO SÓ COM ENTRADAS ORIGINAIS — decisão do dono, 28/09/2026.
//
// "desative as criaturas geradas no bestiário e vamos utilizar apenas as
// entradas originais". Medido antes: as 732 entradas do pool eram TODAS
// variantes geradas de ~42 bases — prefixo+elemento ("Titânico Cão de Fogo"),
// "X Veneno", combinações do gerador do corpus ("Leão do Saara Venenoso",
// "Tigre Siberiano…"), clones da ponte de elementos e 17 variantes de cada
// arquétipo. Não havia nenhuma entrada "limpa". E o corpus de origem não
// tinha fauna real além de meia dúzia de mamíferos grandes (a "fauna real"
// do Besti-rio- é 1.000 combinações de leão/tigre/urso com modificador de
// bioma, todas quadrúpedes; as únicas "aves" eram Chocobo e Owlbear, de
// franquia). Pedido junto: "deve haver fungos, plantas, peixes, insetos,
// aracnídeos, anfíbios, répteis, monstros, humanoides, robôs, etéreos,
// mortos-vivos, extraplanetários, vermes, geológicos, elementais,
// cnidários, mamíferos, demônios, angelicais, etc."
//
// O pool agora é: UMA entrada por criatura-base original (as 41 bases com
// texto original já curado em `bestiario-curadoria.mjs`, elementos e bioma
// NATURAIS da criatura, não um de cada) + o catálogo curado de
// `bestiario-catalogo-curado.mjs` (153 criaturas em 23 grupos). Zero
// variantes. O `grupo` de cada criatura vira a `familia` do pool — o
// vocabulário de família passou a ser o dos grupos pedidos pelo dono.

import { CURADORIA } from './bestiario-curadoria.mjs';
import { CATALOGO, GRUPOS } from './bestiario-catalogo-curado.mjs';

/** Biologia por grupo — as bases originais usam o mesmo mapa do catálogo. */
const BIOLOGIA_DO_GRUPO = {
  ...Object.fromEntries(Object.entries(GRUPOS).map(([g, def]) => [g, def.biologia])),
  draconico: [],
};

const ORIGEM_DO_GRUPO = (grupo) => {
  if (grupo === 'planta' || grupo === 'fungo') return 'Flora Real';
  if (['peixe', 'inseto', 'aracnideo', 'anfibio', 'reptil', 'ave', 'mamifero', 'cnidario', 'verme', 'molusco', 'crustaceo'].includes(grupo)) return 'Fauna Real';
  if (['construto', 'extraplanetario', 'geologico'].includes(grupo)) return 'Arquétipo Genérico (Fantasia)';
  return 'Mitologia e Folclore';
};

/**
 * As bases originais. Descrição: sempre a de `CURADORIA` (texto original,
 * já aprovado por PI em `docs/BESTIARIO-PROCEDENCIA.md` §10). Elementos,
 * bioma, tamanho, hostilidade e atributos: os traços NATURAIS da criatura —
 * até aqui cada base aparecia em todos os elementos por geração procedural.
 * `Elefante` e `Carvalho` saíram: eram duplicatas de `Elefante Africano` e
 * `Carvalho Sagrado (Quercus)`.
 */
const ORIGINAIS = {
  'Axolote (Ambystoma mexicanum)': ['anfibio', ['agua', 'vida'], ['Pântano', 'Aquático'], 'Pequeno', 2, [2, 4, 3, 5]],
  'Ocapi (Okapia johnstoni)': ['mamifero', ['vida', 'terra'], ['Floresta', 'Selva'], 'Grande', 3, [5, 4, 6, 2]],
  'Peixe-gota (Blobfish)': ['peixe', ['agua', 'gravidade'], ['Oceano'], 'Pequeno', 1, [2, 2, 1, 3]],
  'Welwitschia mirabilis': ['planta', ['terra', 'tempo'], ['Deserto', 'Árido'], 'Medio', 1, [3, 2, 1, 5]],
  'Cão (Canis lupus familiaris)': ['mamifero', ['vigor', 'marcial'], ['Campina', 'Planície'], 'Medio', 4, [5, 6, 7, 1]],
  'Flor-cadáver (Rafflesia arnoldii)': ['planta', ['morte', 'vida'], ['Floresta', 'Selva'], 'Grande', 2, [2, 1, 1, 6]],
  "Urso-d'água (Tardígrado)": ['verme', ['tempo', 'gravidade'], ['Oceano', 'Gelo'], 'Miudo', 1, [1, 2, 2, 6]],
  'Fênix': ['ave', ['fogo', 'vida', 'luz'], ['Montanha', 'Etéreo'], 'Grande', 4, [5, 7, 8, 9]],
  'Dragão': ['monstro', ['fogo', 'ar'], ['Montanha', 'Caverna'], 'Colossal', 8, [10, 8, 6, 9]],
  'Elefante Africano': ['mamifero', ['terra', 'vigor'], ['Campina', 'Pradaria'], 'Enorme', 4, [10, 7, 4, 2]],
  'Sangue-de-dragão (Dracaena cinnabari)': ['planta', ['vida', 'terra'], ['Deserto', 'Árido'], 'Grande', 1, [3, 2, 1, 5]],
  'Dragão-azul (Glaucus atlanticus)': ['molusco', ['agua', 'vileza'], ['Oceano', 'Mar'], 'Miudo', 5, [1, 2, 3, 5]],
  'Sakura (Cerejeira)': ['planta', ['vida', 'luz'], ['Floresta', 'Bosque'], 'Grande', 1, [3, 2, 1, 6]],
  'Carvalho Sagrado (Quercus)': ['planta', ['terra', 'arcano'], ['Floresta', 'Bosque'], 'Colossal', 1, [8, 3, 1, 6]],
  'Hipopótamo': ['mamifero', ['agua', 'vigor'], ['Pântano', 'Mangue'], 'Enorme', 8, [9, 3, 4, 1]],
  'Crocodilo': ['reptil', ['agua', 'marcial'], ['Pântano', 'Mangue'], 'Grande', 8, [8, 3, 5, 1]],
  'Tubarão': ['peixe', ['agua', 'marcial'], ['Oceano', 'Mar'], 'Grande', 8, [8, 4, 8, 1]],
  'Águia': ['ave', ['ar', 'luz'], ['Montanha', 'Picos'], 'Medio', 6, [5, 6, 9, 2]],
  'Tigre': ['mamifero', ['marcial', 'sombra'], ['Floresta', 'Selva'], 'Grande', 8, [8, 5, 8, 1]],
  'Girassol': ['planta', ['luz', 'vida'], ['Campina', 'Campo'], 'Medio', 1, [2, 1, 1, 5]],
  'Manticora': ['monstro', ['vileza', 'marcial'], ['Deserto', 'Árido'], 'Grande', 9, [8, 5, 7, 5]],
  'Javali': ['mamifero', ['terra', 'vigor'], ['Floresta', 'Bosque'], 'Medio', 6, [6, 3, 6, 1]],
  'Lobisomem': ['humanoide', ['sombra', 'marcial'], ['Floresta', 'Bosque'], 'Grande', 8, [8, 5, 8, 4]],
  'Aranha': ['aracnideo', ['vileza', 'sombra'], ['Caverna', 'Subterrâneo'], 'Pequeno', 5, [2, 4, 6, 3]],
  'Leão': ['mamifero', ['fogo', 'marcial'], ['Campina', 'Deserto'], 'Grande', 7, [8, 5, 7, 1]],
  'Rinoceronte': ['mamifero', ['terra', 'vigor'], ['Campina', 'Pradaria'], 'Enorme', 6, [9, 3, 5, 1]],
  'Urso': ['mamifero', ['vigor', 'terra'], ['Floresta', 'Gelo'], 'Grande', 7, [9, 5, 5, 1]],
  'Baobá': ['planta', ['tempo', 'terra'], ['Campina', 'Deserto'], 'Colossal', 1, [7, 2, 1, 5]],
  'Cobra': ['reptil', ['vileza', 'sombra'], ['Floresta', 'Selva'], 'Medio', 6, [4, 4, 6, 3]],
  'Cérbero': ['demonio', ['morte', 'fogo'], ['Caverna', 'Subterrâneo'], 'Grande', 9, [9, 5, 7, 7]],
  'Quimera': ['monstro', ['fogo', 'vileza', 'ar'], ['Montanha', 'Colina'], 'Grande', 9, [8, 5, 6, 7]],
  'Lobo': ['mamifero', ['sombra', 'marcial'], ['Floresta', 'Neve'], 'Medio', 6, [6, 6, 8, 1]],
  'Sucuri': ['reptil', ['agua', 'gravidade'], ['Pântano', 'Brejo'], 'Enorme', 7, [9, 3, 4, 1]],
  'Gorila': ['mamifero', ['vigor', 'vida'], ['Floresta', 'Selva'], 'Grande', 4, [9, 7, 5, 1]],
  'Mandrágora Real': ['planta', ['morte', 'arcano', 'som'], ['Floresta', 'Bosque'], 'Pequeno', 3, [1, 4, 1, 8]],
  'Gigante': ['humanoide', ['terra', 'vigor'], ['Montanha', 'Picos'], 'Colossal', 7, [10, 3, 3, 3]],
  'Autômato': ['construto', ['eletricidade', 'marcial'], ['Caverna', 'Subsolo'], 'Grande', 5, [8, 5, 4, 4]],
  'Espectro': ['etereo', ['morte', 'arcano'], ['Etéreo', 'Espiritual'], 'Medio', 6, [2, 6, 7, 8]],
  'Limo': ['monstro', ['agua', 'vileza'], ['Pântano', 'Caverna'], 'Medio', 5, [4, 1, 2, 4]],
  'Aberração': ['monstro', ['arcano', 'espaco'], ['Etéreo', 'Cósmico'], 'Grande', 8, [7, 6, 5, 8]],
  'Morto-Vivo': ['morto_vivo', ['morte', 'sombra'], ['Caverna', 'Subterrâneo'], 'Medio', 7, [6, 2, 3, 4]],
};

/** As criaturas do pool, na forma de `BestiaryCreature` (`bestiary/select.ts`). */
export function montarPool() {
  const originais = Object.entries(ORIGINAIS).map(([nome, [grupo, elementos, bioma, tamanho, hostilidade, [forca, inteligencia, velocidade, magia]]]) => {
    const cur = CURADORIA[nome];
    if (!cur) throw new Error(`base original sem curadoria: ${nome}`);
    return {
      nome, origem: ORIGEM_DO_GRUPO(grupo), descricao: cur.descricao, elementos,
      familia: grupo, biologia: BIOLOGIA_DO_GRUPO[grupo] ?? [], bioma, tamanho, hostilidade,
      atributos: { forca, inteligencia, velocidade, magia },
    };
  });
  const catalogo = CATALOGO.map(c => ({
    nome: c.nome, origem: ORIGEM_DO_GRUPO(c.grupo), descricao: c.descricao, elementos: c.elementos,
    familia: c.grupo, biologia: c.biologia, bioma: c.bioma, tamanho: c.tamanho, hostilidade: c.hostilidade,
    atributos: c.atributos,
  }));
  const nomes = new Set();
  for (const c of [...originais, ...catalogo]) {
    if (nomes.has(c.nome)) throw new Error(`nome duplicado no pool: ${c.nome}`);
    nomes.add(c.nome);
  }
  return [...originais, ...catalogo];
}

/** Os ids de família (= grupo) que o pool usa. */
export const FAMILIAS_DO_POOL = [...new Set([...Object.keys(GRUPOS), 'draconico'])];
