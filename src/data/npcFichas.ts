/**
 * FICHAS DOS NPCs (beta12, B3) — a "criação de personagem" de cada NPC.
 *
 * Cada NPC tem a ficha de um Soulmon, só que INVISÍVEL: arquétipo de
 * personalidade, elemento(s), estágio e classe, pelos critérios do Oráculo
 * (`docs/PLANO-ORACULO.md` §3 e §5). Nada disto aparece ao jogador (decisão 3:
 * "a classe nunca aparece"); a ficha só se EXPRESSA na fala — o jeito de cada
 * NPC falar nasce do arquétipo e do papel. Régua: `npcFichas.contract.test.ts`
 * (todo NPC registrado tem ficha; nada da ficha vai à UI).
 *
 * ⚠️ TODO NPC NOVO NASCE COM FICHA. O contrato falha se um NPC entrar em
 * `LOT_NPC_VOICE`/`LOT_NPC_ART`, `FUNCTION_NPC_VOICE`, `EXTRA_NPC_VOICE`,
 * `NOVO_NPC_VOICE`, `BOSS_ROSTER`, `TOURNAMENT_NPCS` ou `LIBRARY_NPCS` sem
 * uma entrada aqui (ou um alias para a mesma personagem).
 *
 * Vocabulário (nada inventado):
 *  - `arquetipo`: `utils/soulmonCharacter.ts` (`ALL_ARCHETYPES`; os 7 do Soulmon
 *    + protetor, irônico e enigmático, só de NPC).
 *  - `elementos`: ids reais do class-system (`vendor/class-system`, `ELEMENTOS`:
 *    os 20 base, os 190 pares e os de 3+ componentes; 229 no total). O primeiro
 *    é o principal. Combinados valem (ex.: Tessária = `serrilha`, Marcial + Vileza).
 *  - `estagio`: maioria `ultimate`/`mega`, poucos `ultra`, raros `champion`.
 *    Humanoides centrais (Vesca, Hexsmith, Tessária) são `ultra` por decisão do dono.
 *    O estágio de NPC humanoide nunca mostra sufixo mecânico (nada na UI).
 *  - `classe`: id de arquétipo do class-system (`ARQUETIPOS`, 79) cujas
 *    condições de elemento a ficha cumpre (régua no contrato: os elementos da
 *    condição estão nos elementos da ficha ou nos componentes da receita deles).
 *
 * Decisão do dono (§F 5): papel e design de cada um definem a ficha, aplicada
 * sem pedir aprovação; a tabela está em `docs/beta12/TABELA-NPCS.md` para ele
 * ajustar depois. Mudar uma linha aqui muda só o jeito de falar.
 */
import type { Archetype } from '../utils/soulmonCharacter';

export type NpcEstagio = 'champion' | 'ultimate' | 'mega' | 'ultra';

export interface NpcFicha {
  /** Nome para a tabela (PT). Nunca renderizado. */
  nome: string;
  arquetipo: Archetype;
  elementos: readonly string[];
  estagio: NpcEstagio;
  /** id do arquétipo de classe do class-system. */
  classe: string;
}

const f = (nome: string, arquetipo: Archetype, elementos: readonly string[], estagio: NpcEstagio, classe: string): NpcFicha =>
  ({ nome, arquetipo, elementos, estagio, classe });

/** Fichas das personagens. A chave de cada uma é `<registro>:<id>`; aliases abaixo. */
const FICHAS_BASE: Record<string, NpcFicha> = {
  // ── Anfitriões das 7 áreas ────────────────────────────────────────────────
  'area:mercado': f('Grom, o mercador', 'ironico', ['ouro_vivo'], 'ultimate', 'geomante'),
  'area:arena': f('Vultrak, mestre da arena', 'direto', ['marcial', 'tita'], 'mega', 'mestre_de_armas'),
  'area:exploracao': f('Zeph, a guia', 'curioso', ['ar', 'aurora'], 'ultimate', 'bardo'),
  'area:forja': f('Vitra, a Soulsmith', 'mentor', ['forja', 'fornalha'], 'mega', 'forjador_de_guerra'),
  'area:jogos': f('Pipo, o anfitrião', 'brincalhao', ['fada', 'brinquedo'], 'ultimate', 'feiticeiro_de_cartas'),
  'area:laboratorio': f('Vesca, a alquimista', 'mentor', ['mare', 'essencia'], 'ultra', 'arquimago'),
  'area:hall': f('Lumi, a anfitriã', 'acolhedor', ['santidade', 'aurora'], 'ultimate', 'santo_guardiao'),

  // ── NPCs de lote (os que têm voz própria) ─────────────────────────────────
  'lote:mercado:background': f('Panora, a sonhadora', 'enigmatico', ['constelacao'], 'ultimate', 'astromante'),
  'lote:mercado:itens': f('Lamela, a mascate', 'acolhedor', ['druidismo'], 'ultimate', 'mestre_encantador'),
  'lote:mercado:decoracao': f('Lasca, a marceneira', 'calmo', ['seiva'], 'ultimate', 'verdejante'),
  'lote:mercado:conquistas': f('Medra, o guardião dos marcos', 'mentor', ['fossil', 'tempo'], 'ultimate', 'cronomante'),
  'lote:mercado:cambista': f('Farthing, o cambista', 'ironico', ['pacto'], 'ultimate', 'escriba_do_pacto'),
  'lote:mercado:restaurante': f('Snapjaw, a chef carnívora', 'animado', ['queimada', 'seiva'], 'ultimate', 'mestre_de_banquete'),
  // Tessária: vileza + marcial = Serrilha (id `serrilha`, o combinado dos 229 elementos). Ultra por decisão do dono.
  'lote:arena:duelo': f('Tessária, a gladiadora', 'direto', ['serrilha'], 'ultra', 'mestre_de_armas'),
  'lote:arena:guerra': f('Mirevesper, a quimera do brejo', 'enigmatico', ['pantano', 'sombra'], 'mega', 'geomante'),
  'lote:hall:feira': f('Fanfare', 'animado', ['harmonia', 'estampido'], 'ultimate', 'menestrel'),
  'lote:hall:guilda': f('Aurea, a sacerdotisa do Salão', 'protetor', ['bravura', 'chama_solar'], 'mega', 'paladino'),
  'lote:jogos:mente': f('Tessela, a enigmista', 'curioso', ['fluxo'], 'ultimate', 'mestre_encantador'),
  'lote:exploracao:dungeon': f('Corva, a vigia do calabouço', 'protetor', ['espectro', 'sombra'], 'ultimate', 'atirador_fantasma'),
  'lote:exploracao:passeio': f('Lisel, a mariposa do caminho', 'calmo', ['estratosfera'], 'ultimate', 'astromante'),
  'lote:forja:hexsmith': f('Hexsmith', 'enigmatico', ['runa', 'artificio'], 'ultra', 'mestre_das_runas'),
  'lote:forja:refugio': f('Yuzu, a guardiã da fonte', 'acolhedor', ['nascente', 'vapor'], 'ultimate', 'verdejante'),
  'lote:forja:oficina': f('Sépia, a copista', 'calmo', ['artificio'], 'ultimate', 'mestre_encantador'),
  'lote:forja:caderno': f('Trilho, o maquinista dos croquis', 'enigmatico', ['continuum', 'relojoaria'], 'ultimate', 'viajante_dimensional'),
  'lote:laboratorio:pet': f('Tinta, a escriba do Arquivo', 'calmo', ['erosao'], 'ultimate', 'cronomante'),
  'lote:laboratorio:stats': f('Sumi, o guardião do Vínculo', 'mentor', ['mare', 'correnteza'], 'mega', 'alquimista'),
  'lote:laboratorio:perfil': f('Soulmon misterioso (o Corvo)', 'enigmatico', ['sombra', 'ocultismo'], 'mega', 'arquimago'),
  'lote:laboratorio:biblioteca': f('Glifa, a arquivista', 'calmo', ['runa'], 'ultimate', 'mestre_das_runas'),
  'lote:laboratorio:amigos': f('Zumi, o filhote de mel', 'acolhedor', ['coracao'], 'champion', 'verdejante'),

  // ── NPCs de função ─────────────────────────────────────────────────────────
  'funcao:onboarding': f('Ambra', 'acolhedor', ['ar', 'aurora'], 'ultimate', 'bardo'),
  'funcao:oraculo': f('Iris', 'enigmatico', ['constelacao', 'eclipse'], 'ultra', 'astromante'),
  'funcao:cuidados': f('Nuri', 'protetor', ['nascente'], 'ultimate', 'verdejante'),

  // ── Extras (leva `npcs-femininas` + Selene, Mallo, Kova, Tilin) ────────────
  'extra:forja': f('Scoria', 'direto', ['forja'], 'mega', 'forjador_de_guerra'),
  'extra:treino': f('Kama', 'mentor', ['maestria', 'marcial'], 'mega', 'mestre_de_armas'),
  'extra:cacadora': f('Sable', 'ironico', ['assassinio'], 'ultimate', 'sombra_ambulante'),
  'extra:guarda': f('Bastia', 'protetor', ['bravura', 'aco'], 'mega', 'paladino'),
  'extra:feras': f('Zahra', 'acolhedor', ['vitalidade'], 'ultimate', 'senhor_das_feras'),
  'extra:cura': f('Salvia', 'acolhedor', ['nascente', 'santidade'], 'ultimate', 'santo_guardiao'),
  'extra:mercenaria': f('Gila', 'direto', ['ceifa'], 'ultimate', 'cavaleiro_da_morte'),
  'extra:navegadora': f('Vela', 'curioso', ['estratosfera', 'cometa'], 'ultimate', 'astromante'),
  'extra:barda': f('Trill', 'animado', ['cantico'], 'ultimate', 'menestrel'),
  'extra:venenos': f('Datura', 'ironico', ['veneno'], 'ultimate', 'toxicologista'),
  'extra:arqueira': f('Rime', 'calmo', ['tempestade', 'gelo'], 'ultimate', 'olho_da_tormenta'),
  'extra:sacerdotisa': f('Oriel', 'enigmatico', ['eter', 'alma'], 'mega', 'arquimago'),
  'extra:lua': f('Selene', 'enigmatico', ['crepusculo', 'eclipse'], 'ultra', 'arquimago'),
  'extra:ferreiro': f('Mallo', 'calmo', ['aco', 'forja'], 'mega', 'forjador_de_guerra'),
  'extra:ferreira': f('Kova', 'direto', ['tempera', 'aco'], 'mega', 'mestre_de_armas'),
  'extra:arauto': f('Tilin', 'animado', ['estrondo', 'cadencia'], 'ultimate', 'menestrel'),

  // ── Novos (leva `novos npcs`) ──────────────────────────────────────────────
  'novo:alquimistaLimo': f('Lodi', 'curioso', ['mutacao'], 'ultimate', 'corruptor'),
  'novo:enfermeira': f('Rubra', 'acolhedor', ['parasita'], 'ultimate', 'vampiro_espiritual'),
  'novo:colheita': f('Espiga', 'calmo', ['florescer', 'seiva'], 'ultimate', 'verdejante'),
  'novo:tempo': f('Clepsi', 'mentor', ['cronomancia'], 'mega', 'cronomante'),
  'novo:musa': f('Lilia, a musa do jardim', 'acolhedor', ['seiva', 'jardim_encantado'], 'ultimate', 'verdejante'),
  'novo:ossarioFera': f('Ossel', 'enigmatico', ['ossuario', 'sombra'], 'mega', 'necromante'),
  'novo:serpentePlumadaFera': f('Tzali', 'enigmatico', ['impeto', 'aurora'], 'mega', 'bardo'),
  'novo:broto': f('Faísca', 'animado', ['fotossintese', 'queimada'], 'champion', 'xama_totemico'),
  'novo:corvo': f('Corvino', 'mentor', ['miasma', 'alma'], 'ultimate', 'necromante'),
  'novo:cozinheiro': f('Caldo', 'brincalhao', ['fenix', 'vapor'], 'ultimate', 'mestre_de_banquete'),
  'novo:besouro': f('Brio', 'protetor', ['aco', 'carvalho'], 'ultimate', 'mestre_de_armas'),
  'novo:sereiaPintora': f('Maré, a sereia pintora', 'calmo', ['mare', 'prisma'], 'ultimate', 'alquimista'),

  // ── Chefes e guardiões (elementos = os do `BOSS_ROSTER`; o contrato confere) ─
  'boss:arauto-do-fim': f('Arauto do Fim', 'enigmatico', ['juizo_final', 'julgamento', 'requiem', 'ocaso'], 'ultra', 'inquisidor'),
  'boss:cinderhorn': f('Cinderhorn', 'direto', ['fervor', 'lava', 'brado'], 'ultimate', 'lavamante'),
  'boss:thrummer': f('Thrummer', 'animado', ['tempestade', 'estampido', 'impeto'], 'ultimate', 'tempestario'),
  'boss:squallstride': f('Squallstride', 'brincalhao', ['trovao', 'furacao'], 'mega', 'xama_totemico'),
  'boss:orbitant': f('Orbitant', 'calmo', ['peso_descomunal', 'asteroide'], 'ultimate', 'senhor_da_gravidade'),
  'boss:mycelar': f('Mycelar', 'enigmatico', ['miasma', 'parasita', 'ossuario'], 'mega', 'vampiro_espiritual'),
  'boss:obsidarch': f('Obsidarch', 'protetor', ['obsidiana', 'tita', 'galvanismo'], 'mega', 'engenheiro_galvanico'),
  'boss:bladeveil': f('Bladeveil', 'ironico', ['lamina_viva', 'espectro', 'esgrima'], 'ultimate', 'cavaleiro_dragao'),
  'boss:sabrefin': f('Sabrefin', 'direto', ['lamina_oculta', 'contratempo', 'reflexo'], 'mega', 'mestre_de_armas'),
  'boss:glimmerswarm': f('Glimmerswarm', 'brincalhao', ['alento', 'fulgor'], 'ultimate', 'bardo'),
  'boss:corallume': f('Corallume', 'acolhedor', ['mare', 'sinfonia', 'vitalidade'], 'mega', 'alquimista'),
  'boss:halorune': f('Halorune', 'curioso', ['runa', 'ocultismo', 'eco'], 'ultimate', 'mestre_das_runas'),
  'boss:chorale': f('Chorale', 'calmo', ['cristal', 'harmonia', 'cantico'], 'mega', 'menestrel'),
  'boss:drifela': f('Drifela', 'acolhedor', ['nascente', 'melodia'], 'ultimate', 'menestrel'),
  'boss:hollowmere': f('Hollowmere', 'protetor', ['florescer', 'selva', 'ancora_vital'], 'mega', 'verdejante'),
  'boss:astrawing': f('Astrawing', 'curioso', ['estratosfera', 'constelacao'], 'ultimate', 'bardo'),
  'boss:nebulara': f('Nebulara', 'enigmatico', ['nebulosa', 'vazio'], 'mega', 'astromante'),
  'boss:voltbloom': f('Voltbloom', 'animado', ['sinapse', 'flora'], 'ultimate', 'xama_totemico'),
  'boss:graftfang': f('Graftfang', 'ironico', ['mutacao', 'galvanismo', 'vitalidade'], 'mega', 'corruptor'),
  'boss:duskveil': f('Duskveil', 'calmo', ['crepusculo', 'sussurro', 'espectro'], 'ultimate', 'atirador_fantasma'),
  'boss:dawnloom': f('Dawnloom', 'acolhedor', ['aurora', 'santidade'], 'ultimate', 'santo_guardiao'),
  'boss:aeonyx': f('Aeonyx', 'enigmatico', ['eon', 'entropia', 'continuum'], 'ultra', 'cronomante'),
  'boss:tallyjack': f('Tallyjack', 'ironico', ['ouro_vivo', 'magnetismo'], 'ultimate', 'geomante'),
  'boss:cuprex': f('Cuprex', 'protetor', ['aco', 'nucleo', 'tita'], 'mega', 'berserker'),

  // ── Desafiantes do Torneio e jogadores de teste da Biblioteca ──────────────
  'torneio:npc-espina': f('Espina', 'direto', ['espinheiro'], 'ultimate', 'demonologista'),
  'torneio:npc-quartzo': f('Quartzo', 'calmo', ['cristal'], 'ultimate', 'geomante'),
  'torneio:npc-mare': f('Maré, a desafiante', 'brincalhao', ['mare', 'correnteza'], 'ultimate', 'alquimista'),
  'biblioteca:npc-pyraka': f('Kaelen (jogador de teste)', 'animado', ['fervor'], 'champion', 'berserker'),
  'biblioteca:npc-orrin': f('Orrin (jogador de teste)', 'mentor', ['eter', 'ocultismo'], 'ultimate', 'arquimago'),
  'biblioteca:npc-thalindra': f('Thalindra (jogadora de teste)', 'acolhedor', ['santidade'], 'mega', 'santo_guardiao'),
};

/** Quem é a MESMA personagem em outra chave (lote que usa o anfitrião da área; poses e formas). */
export const NPC_FICHA_ALIAS: Readonly<Record<string, string>> = {
  'lote:arena:torneio': 'area:arena',
  'lote:exploracao:fenda': 'area:exploracao',
  'lote:jogos:salao': 'area:jogos',
  'lote:laboratorio:evolucao': 'area:laboratorio',
  'lote:forja:ferreiro': 'area:forja',
  'lote:hall:grove': 'novo:musa',
  'novo:alquimistaLimoCostas': 'novo:alquimistaLimo',
  'novo:ossarioForma': 'novo:ossarioFera',
  'novo:serpentePlumadaForma': 'novo:serpentePlumadaFera',
  'novo:luaTronoSentada': 'extra:lua',
  'novo:luaTronoDePe': 'extra:lua',
};

/** Todas as chaves registradas (fichas + aliases). */
export const NPC_FICHA_KEYS: readonly string[] = [...Object.keys(FICHAS_BASE), ...Object.keys(NPC_FICHA_ALIAS)];

/** A ficha de um NPC pela chave `<registro>:<id>`; segue o alias. Chave desconhecida = `undefined`. */
export function npcFicha(key: string): NpcFicha | undefined {
  return FICHAS_BASE[NPC_FICHA_ALIAS[key] ?? key];
}

/** As fichas únicas (sem aliases), para o contrato e para a tabela. */
export const NPC_FICHAS: Readonly<Record<string, NpcFicha>> = FICHAS_BASE;
