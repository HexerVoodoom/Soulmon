// ARQUÉTIPOS GENÉRICOS DO BESTIÁRIO — 27/09/2026.
//
// Nasce de um pedido do dono para ampliar a diversidade de FAMÍLIA do
// bestiário usando as ~4.000 linhas de franquia do corpus `Besti-rio-`
// (pokemon.json/digimon.json/dnd.json + a parte de franquia de
// enriched.json) como fonte de inspiração.
//
// ⚠️ O parecer do `soulmon-ip-brand-guardian` (27/09/2026, registrado em
// `docs/REGISTRO-DE-DECISOES.md`) VETOU citar o NOME de personagem
// registrado (Pikachu, Agumon, Deathwing, Chocobo…) no prompt de geração de
// imagem — risco real e ativo de bloqueio de loja e DMCA contra a própria
// hospedagem, sem base de mitigação por titular. Também vetou usar a
// `descricao` dessas linhas: é texto específico do personagem (ex.: a
// própria entrada Pokédex do Bulbasaur), não dado genérico.
//
// O que ESTE módulo faz, em vez disso: olha para as FAMÍLIAS/ARQUÉTIPOS que
// se repetem em toda a ficção de fantasia — gigante, autômato/golem,
// espectro, limo, aberração, morto-vivo — e que aparecem tanto no corpus de
// franquia quanto em domínio público há séculos (jötnar nórdicos, golem do
// folclore judaico medieval, fantasmas de toda cultura humana, oozes de
// pulp fiction pré-D&D). Nenhuma frase daqui foi copiada de lugar nenhum:
// são descrições ORIGINAIS do arquétipo, nunca de uma obra específica.
//
// Por que isso e não os 12/2000 exemplares reais do corpus: medido em
// 27/09/2026, as entradas de franquia com `classificacaoConfianca: 'alta'`
// E `elementos` preenchidos têm `descricao` = texto de sabedoria específico
// (flavor text) do personagem — não há dado estruturado rico o suficiente
// (a maioria tem `tags`/`biologia` vazios) para reescrever sem só
// parafrasear o texto protegido. O que ELAS revelam de útil é a distribuição
// de FAMÍLIA (`gigante`, `construto`, `morto_vivo`, `espirito`, `aberracao`,
// `demonio` aparecem centenas de vezes em pokemon/digimon/dnd), que já é
// vocabulário genérico e não-proprietário — e é justamente isso que falta
// no pool hoje (`REALM_TO_FAMILIAS` em `select.ts` espera 14 famílias; o
// pool só cobria 6 antes deste módulo).
//
// Cada arquétipo vira várias entradas (`<Prefixo> <Arquétipo> de <Elemento>`,
// reaproveitando `PREFIXOS_PROCEDURAIS`) para dar volume e cobertura de
// elemento, do mesmo jeito que as bases procedurais reais já fazem.

import { PREFIXOS_PROCEDURAIS } from './bestiario-procedencia.mjs';

/** As 17 famílias que `REALM_TO_FAMILIAS` (select.ts) espera; SEIS delas
 *  (`gigante`, `construto`, `espirito`, `geleia`, `aberracao`, `morto_vivo`)
 *  não tinham NENHUMA criatura no pool antes deste módulo. */
export const ARQUETIPOS = {
  Gigante: {
    familia: 'gigante',
    biologia: ['Humanoide'],
    descricao: 'O gigante é uma figura humanoide de estatura descomunal, presente no folclore de dezenas de culturas ao redor do mundo — dos jötnar nórdicos aos gigantes das lendas bíblicas e europeias. Sua força bruta é proporcional ao tamanho, e sua passada sozinha já é capaz de rachar o solo.',
  },
  Autômato: {
    familia: 'construto',
    biologia: [],
    descricao: 'O autômato é um ser construído a partir de matéria bruta — pedra, metal ou argila — e animado por um princípio que a ciência ou a magia lhe deu. A tradição do golem, na cultura judaica medieval, e dos autômatos de relojoaria são raízes antigas dessa ideia: uma criação que age, mas não nasceu.',
  },
  Espectro: {
    familia: 'espirito',
    biologia: [],
    descricao: 'O espectro é a aparição translúcida de um ser que já não pertence ao mundo dos vivos, presente no folclore de praticamente toda cultura humana. Atravessa paredes, esfria o ar ao redor e carrega um resquício de memória do que foi em vida.',
  },
  Limo: {
    familia: 'geleia',
    biologia: ['Invertebrado'],
    descricao: 'O limo é uma massa gelatinosa e amorfa que se desloca deslizando e absorve o que toca. Não tem esqueleto, rosto ou lado — só volume, textura e um apetite lento. É uma das formas mais antigas de vida hostil que a ficção de fantasia já imaginou, muito antes de qualquer jogo específico.',
  },
  Aberração: {
    familia: 'aberracao',
    biologia: [],
    descricao: 'A aberração é uma criatura cuja anatomia desafia toda classificação natural — simetria quebrada, membros em número errado, uma geometria que incomoda o olhar. Não pertence a nenhum reino conhecido da vida; é o que sobra quando a natureza tenta algo e desiste no meio.',
  },
  'Morto-Vivo': {
    familia: 'morto_vivo',
    biologia: [],
    descricao: 'O morto-vivo é um corpo que voltou a se mover depois da morte, sem a centelha que definia quem ele foi. Anda, ataca e persiste por um impulso que já não é vontade — só o hábito do movimento, preso num corpo que já devia ter parado.',
  },
};

const TAMANHOS = ['Pequeno', 'Medio', 'Enorme', 'Colossal'];

function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const NOME_DO_ELEMENTO = {
  fogo: 'Fogo', agua: 'Água', terra: 'Terra', ar: 'Ar', eletricidade: 'Eletricidade',
  arcano: 'Arcano', sombra: 'Sombra', luz: 'Luz', vileza: 'Vileza', morte: 'Morte',
  vida: 'Vida', vigor: 'Vigor', marcial: 'Marcial', tempo: 'Tempo', som: 'Som',
  gravidade: 'Gravidade', espaco: 'Espaço',
};

/** Gera as variantes elementais de cada arquétipo. Determinístico: o mesmo
 *  arquétipo × elemento sempre produz o mesmo prefixo/tamanho/atributos, em
 *  qualquer rodada — a mesma garantia que `bestiario-ponte-elementos.mjs` já
 *  dá para as linhas dele. */
export function gerarArquetipos(elementos = Object.keys(NOME_DO_ELEMENTO)) {
  const geradas = [];
  for (const [base, def] of Object.entries(ARQUETIPOS)) {
    for (const elemento of elementos) {
      const h = hashString(`${base}|${elemento}`);
      const prefixo = PREFIXOS_PROCEDURAIS[h % PREFIXOS_PROCEDURAIS.length];
      const tamanho = TAMANHOS[Math.floor(h / 7) % TAMANHOS.length];
      const nome = `${prefixo} ${base} de ${NOME_DO_ELEMENTO[elemento]}`;
      // ⚠️ `>>>` (unsigned), nunca `>>`: `h` pode passar de 0x7FFFFFFF, e o
      // shift assinado sign-extende e produz número NEGATIVO — atributo < 0
      // é dado inválido (pegou na verificação exaustiva na primeira rodada).
      geradas.push({
        nome,
        origem: 'Arquétipo Genérico (Fantasia)',
        descricao: def.descricao,
        elementos: [elemento],
        familia: def.familia,
        biologia: def.biologia,
        bioma: ['Variado'],
        tamanho,
        hostilidade: 1 + (h % 10),
        atributos: {
          forca: 1 + (h % 10),
          inteligencia: 1 + ((h >>> 4) % 10),
          velocidade: 1 + ((h >>> 8) % 10),
          magia: 1 + ((h >>> 12) % 10),
        },
        _arquetipo: 'bestiario-arquetipos-genericos.mjs — inspirado em famílias recorrentes da ficção de fantasia, nunca em personagem específico. Ver docs/BESTIARIO-PROCEDENCIA.md §12.',
      });
    }
  }
  return geradas;
}
