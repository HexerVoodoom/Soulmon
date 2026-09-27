// PROCEDÊNCIA DO BESTIÁRIO — o critério ÚNICO de quem entra no `pool.json`.
//
// ⚠️ Existe porque a régua anterior era uma lista de ONZE nomes
// (`agumon|…|pokemon|pikachu|charizard|goku`) escrita DUAS vezes — em
// `scripts/sync-oracle-data.mjs` e em `src/utils/soulProfile/pipeline.test.ts`.
// As duas cópias erraram igual, e por isso o teste chamado "nenhuma criatura
// do pool vem de franquia protegida" passava **verde** com 1.040 entradas de
// franquia no pool (Pokémon Gen I inteira, Beholder, Mind Flayer, Murloc,
// Deathwing, Zergling, Chocobo, Tonberry, Rathalos, Balrog). Régua copiada é
// régua que mente nos dois lugares ao mesmo tempo — footgun 9 na forma mais
// cara que este repositório já pagou.
//
// Parecer que fundamenta este arquivo: `soulmon-ip-brand-guardian`,
// 27/09/2026 (resumo em `docs/BESTIARIO-PROCEDENCIA.md`).
//
// A regra geral é **ALLOWLIST, nunca denylist**. Uma denylist de franquia é
// uma lista mantida contra todo o entretenimento já produzido, e essa corrida
// já foi perdida uma vez: o regex de detecção não continha "Marvel", e havia
// um X-Men no pool.

/** Os cinco prefixos que o gerador procedural do upstream antepõe à base. */
export const PREFIXOS_PROCEDURAIS = ['Titânico', 'Espiritual', 'Cristalino', 'Corrompido', 'Ancião'];

const RE_PROCEDURAL = new RegExp(
  `^(?:${PREFIXOS_PROCEDURAIS.join('|')})\\s+(.+?)\\s+de\\s+\\S+$`,
);

/** A BASE de um nome procedural ("Titânico Zubat de Morte" → "Zubat").
 *  Devolve o próprio nome quando não é procedural. */
export function baseDe(nome) {
  const m = RE_PROCEDURAL.exec(String(nome ?? ''));
  return m ? m[1] : String(nome ?? '');
}

/**
 * CAMADA 1 — as bases procedurais aceitas. Doze, todas fauna ou flora REAL,
 * com descrição de biologia (Loxodonta, Psychrolutes marcidus, Tardigrada,
 * Rafflesia). Base nova vinda do upstream é **rejeitada por padrão**: é assim
 * que se falha para o lado seguro.
 */
export const BASES_PERMITIDAS = new Set([
  'Axolote (Ambystoma mexicanum)',
  'Ocapi (Okapia johnstoni)',
  'Peixe-gota (Blobfish)',
  'Cão (Canis lupus familiaris)',
  'Elefante Africano',
  "Urso-d'água (Tardígrado)",
  'Dragão-azul (Glaucus atlanticus)',
  'Welwitschia mirabilis',
  'Flor-cadáver (Rafflesia arnoldii)',
  'Sakura (Cerejeira)',
  'Carvalho Sagrado (Quercus)',
  'Sangue-de-dragão (Dracaena cinnabari)',
  // Arquétipos genéricos de fantasia (27/09/2026, ver
  // bestiario-arquetipos-genericos.mjs e docs/BESTIARIO-PROCEDENCIA.md §12).
  // Não vêm do corpus por `entradaPermitida` — são geradas direto pelo
  // módulo, como a ponte de elementos. Ficam aqui só como registro de que
  // já passaram por avaliação, para o inventário de bases "permitidas"
  // continuar completo.
  'Gigante', 'Autômato', 'Espectro', 'Limo', 'Aberração', 'Morto-Vivo',
]);

/** As origens que o `pool.json` aceita (a camada que já existia).
 *  `arqu[ée]tipo` cobre `bestiario-arquetipos-genericos.mjs` — texto ORIGINAL
 *  sobre uma família recorrente da ficção de fantasia, nunca sobre um
 *  personagem específico (ver docs/BESTIARIO-PROCEDENCIA.md §12). */
export const ORIGENS_PERMITIDAS = [/procedural/i, /fauna/i, /flora/i, /mitolog/i, /arqu[ée]tipo/i];

/**
 * CAMADA 2 — rede, não filtro principal. Se algo chega aqui depois das
 * camadas 0 e 1, a premissa está errada de novo e o build tem de gritar.
 * Pega o vocabulário que DECLARA ficção de terceiro, e os titulares.
 */
export const DESCRICAO_DE_FRANQUIA = new RegExp([
  'franquia', 'personagem fict', 'espécie fict', 'criatura fict', 'série de anime',
  'jogos? eletrônicos?', 'mangá', 'videogame', 'no original:',
  'Comics', 'Nintendo', 'Game Freak', 'Blizzard', 'Capcom', 'Square Enix',
  'Wizards of the Coast', 'Bandai', 'Bethesda', 'Games Workshop', 'Marvel',
  'DC Comics', 'Giochi Preziosi', 'Tolkien', 'Anne Rice', 'Pok[ée]mon', 'Digimon',
].join('|'), 'i');

/** Palavras curtas e genéricas demais para servirem de prova de corroboração. */
const VAZIAS = new Set([
  'ancião', 'celeste', 'sagrado', 'real', 'gigante', 'comum', 'menor', 'maior',
  'negro', 'branco', 'vermelho', 'azul', 'verde', 'dourado',
]);

const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * CAMADA 3 — **a que resolve o drift, e é a mais barata.**
 *
 * O campo `descricao` do upstream veio de uma busca textual que NÃO valida se
 * o artigo encontrado é o artigo pedido. Medido: a base `Dragão Vermelho
 * (Ancião)` aparece com TRÊS descrições diferentes no mesmo pool — uma de
 * dragão, uma de *Gormiti* e uma da lista de episódios de *Dragon Ball Z*; e
 * `Ancião Tarrasque de Fogo` carrega o verbete do *Deathclaw*, de Fallout.
 *
 * Isso não é só sujeira: `pipeline.ts` monta o texto de inspiração REMOVENDO
 * o nome da criatura da descrição — e quando a descrição é de outro
 * personagem, remover o nome não remove nada, e o texto de um personagem
 * registrado entra no prompt que gera a arte do usuário. A cláusula "Do not
 * copy any existing franchise character" passa a ser contrariada pelo próprio
 * insumo que o pipeline entrega.
 *
 * A prova exigida é mínima e barata: ao menos um token significativo do NOME
 * (≥4 letras, fora dos prefixos, do elemento e das palavras vazias) aparece
 * na descrição.
 */
export function corroboraNomeDescricao(nome, descricao) {
  const desc = semAcento(descricao ?? '');
  if (!desc) return false;
  const tokens = semAcento(baseDe(nome))
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 4 && !VAZIAS.has(t));
  if (tokens.length === 0) return true; // nome sem token próprio: não é o que esta camada julga
  return tokens.some(t => desc.includes(t));
}

/** O veredito completo sobre UMA entrada do corpus. */
export function entradaPermitida(c) {
  const origem = String(c?.origem ?? '');
  if (!ORIGENS_PERMITIDAS.some(re => re.test(origem))) return false;

  const nome = String(c?.nome ?? '');
  const descricao = String(c?.descricao ?? '');

  // Camada 1: se é procedural, a base tem de estar na allowlist.
  const base = baseDe(nome);
  const ehProcedural = base !== nome;
  if (ehProcedural && !BASES_PERMITIDAS.has(base)) return false;

  // Camada 2: rede de segurança sobre nome e descrição.
  if (DESCRICAO_DE_FRANQUIA.test(`${nome} ${descricao}`)) return false;

  // Camada 3: o texto tem de falar da criatura que diz descrever.
  if (!corroboraNomeDescricao(nome, descricao)) return false;

  return true;
}
