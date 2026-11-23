/**
 * ELEMENTO COMBINADO POR ESTÁGIO (dono, 05/11/2026, REGISTRO §232) — dono único da regra.
 *
 * A cada evolução o Soulmon tende a carregar um elemento de mais componentes. Uma ÚNICA sorte `u` por Soulmon, fixa no save, decide
 * quantos: as chances acumuladas só sobem de estágio em estágio, então ele NUNCA perde complexidade ao evoluir, e reabrir não muda nada.
 * Quem tem `u` baixo fica "puro" a vida toda (o Ultra de um elemento só). Sem reroll e sem venda.
 *
 * Regras: o elemento CONTÉM a base nº 1 (o elemento do oráculo, o mesmo da arte). 2 componentes = par; 3 e 4 = só os curados do app
 * (`elementosCurados.ts`). Emenda de 05/11/2026: planta, industrial e fada ganharam curados (3 promovidos + 6 do lote 4) e deixam de parar no par.
 * Base nº 1 sem curado possível (hoje nenhuma das 17) ainda cairia no par: nunca se inventa elemento.
 * A camada é só de LEITURA: não muda ficha, pontos nem cascata. Puro e sem relógio.
 */
import { creatureFormId, hashString, mulberry32 } from './oracle/base';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { ELEMENTOS_CURADOS, CURATED_ELEMENT_NAMES } from './elementosCurados';
import { elementoNomeDe } from './soulProfile/ficha/elementoNome';
import type { FichaStage } from './soulProfile/ficha/types';
import type { ElementoJornada } from './elementoJornada';
import { essenceComposition } from './elementDex';
import { descritorDoElemento, chromaHueCarregado } from './elementoDescritoresStore';
import { umMotivoDeTempo, motivosNoTexto, type MotivoTempo } from './motivoTempo';

/** O elemento é de TEMPO (o próprio `tempo` ou qualquer combinado que o tenha como componente, de 2, 3 ou 4). */
export const ehElementoDeTempo = (id: string): boolean => (essenceComposition(id) ?? []).includes('tempo');

/** Variantes que pendem para a AMPULHETA (areia, ruína, decadência, crescimento lento) e para o RELÓGIO (mecânico, velocidade, compasso). */
const COMPONENTES_AMPULHETA: ReadonlySet<string> = new Set(['terra', 'agua', 'fogo', 'vileza', 'morte', 'sombra', 'vida', 'planta']);
const COMPONENTES_RELOGIO: ReadonlySet<string> = new Set(['industrial', 'eletricidade', 'ar', 'marcial', 'som']);

/**
 * Regra 1 de `motivoTempo.ts` (dono, 13/11/2026, REGISTRO §324): o motivo que a VARIANTE do elemento de tempo pede, ou `undefined` quando
 * ela não pende para lado nenhum (aí a criatura decide). Ordem: (a) combinado cujo kit de arte já desenha UM dos dois (o descritor cita só
 * ampulheta ou só relógio) fica com ele; (b) pelos componentes: só lados de areia/ruína/decadência → ampulheta, só mecânico/velocidade →
 * relógio; (c) misto, neutro (arcano, luz, espaço, fada, vigor, gravidade) ou o `tempo` puro → `undefined`.
 */
export function motivoTempoDoElemento(id: string): MotivoTempo | undefined {
  if (!ehElementoDeTempo(id)) return undefined;
  const comp = essenceComposition(id) ?? [];
  if (comp.length > 1) {
    const doKit = motivosNoTexto(descritorDoElemento(id)?.forma ?? '');
    if (doKit.length === 1) return doKit[0];
  }
  const outros = comp.filter(c => c !== 'tempo');
  const amp = outros.some(c => COMPONENTES_AMPULHETA.has(c));
  const rel = outros.some(c => COMPONENTES_RELOGIO.has(c));
  return amp && !rel ? 'ampulheta' : rel && !amp ? 'relogio' : undefined;
}

/**
 * Palavras-chave visuais de cada elemento BASE (substring do descritor da própria base em `elementoDescritores.data.ts`; sem duas iguais entre bases).
 * Todo componente de um combinado precisa de UMA delas nas pistas do prompt (dono, 10/11/2026: cada elemento, inclusive de 3 e 4 componentes).
 * Só a terra tem 3 formas (REGISTRO §411): a de cada elemento sai do hash do id (`pistaTerraDe`), para os 5+ combinados de terra não repetirem o mesmo ombro de pedra.
 */
export const PALAVRA_CHAVE_BASE: Readonly<Record<string, readonly string[]>> = {
  fogo: ['flames'], agua: ['water'], terra: ['boulder shoulder', 'stone slabs', 'rocky horn crest'], ar: ['ring of wind'], eletricidade: ['arcs'], arcano: ['rune disc'], sombra: ['smoke'], luz: ['rays'],
  vileza: ['thorns'], morte: ['antler crown'], vida: ['budding'], vigor: ['amber gem glowing on its chest', 'amber gem'], marcial: ['sword'], tempo: ['sand'], som: ['bronze bell'],
  gravidade: ['stone orbiting a ring'], espaco: ['ring of stars', 'band of stars'], fada: ['wings'], industrial: ['plates'], planta: ['vines'],
};

/** As 3 formas grandes da terra, na ordem de `PALAVRA_CHAVE_BASE.terra`. */
const PISTA_TERRA = ['a boulder shoulder', 'stone slabs along the back', 'a rocky horn crest'] as const;
/** Qual das 3 formas da terra o elemento `id` usa: determinístico pelo hash do id. */
export const pistaTerraDe = (id: string): string => PISTA_TERRA[hashString(id) % PISTA_TERRA.length];

/** O descritor (texto em minúsculas) nomeia o componente `base` por alguma das palavras-chave dele. */
export const nomeiaBase = (texto: string, base: string): boolean => (PALAVRA_CHAVE_BASE[base] ?? []).some(k => texto.includes(k));

/** Teto (caracteres) das pistas de forma + paleta de um elemento no prompt de sprite. */
export const TETO_PISTAS = 260;

/** Forma curta de cada base, usada só para completar o componente que o descritor gerado não citou (contém a palavra-chave). */
const PISTA_CURTA_BASE: Readonly<Record<string, string>> = {
  fogo: 'licking flames', agua: 'flowing water', terra: 'a boulder shoulder', ar: 'a large detached ring of wind with a tail', eletricidade: 'yellow arcs',
  arcano: 'a large floating violet rune disc', sombra: 'black smoke', luz: 'golden rays', vileza: 'barbed thorns', morte: 'a pale bone-white antler crown',
  vida: 'budding leaves', vigor: 'a big amber gem glowing on its chest', marcial: 'one large sword', tempo: 'drifting sand', som: 'a big bronze bell',
  gravidade: 'a large dark stone orbiting a ring', espaco: 'a large floating ring of stars', fada: 'tiny wings', industrial: 'aged plates', planta: 'broad vines',
};

/** As pistas visuais do elemento (forma + paleta), derivadas dos prompts dos assets dele; combinados completam UMA pista por componente. `undefined` = sem prompt-fonte (só o nome). */
export function pistasVisuaisDoElemento(id: string): string | undefined {
  const d = descritorDoElemento(id);
  if (!d || (!d.forma && !d.paleta)) return undefined;
  let forma = d.forma ?? '';
  const faltam = (essenceComposition(id) ?? []).filter(c => PALAVRA_CHAVE_BASE[c] && !nomeiaBase(`${forma} ${d.paleta ?? ''}`.toLowerCase(), c));
  if (faltam.length) {
    const extra = faltam.map(c => (c === 'terra' ? pistaTerraDe(id) : PISTA_CURTA_BASE[c])).join(', ');
    forma = forma ? (/ with hints of /.test(forma) ? `${forma}, ${extra}` : `${forma}, with hints of ${extra}`) : extra;
  }
  return `${[forma, d.paleta ? `${d.paleta} palette` : ''].filter(Boolean).join(', ')}`;
}

/** % de 1, 2, 3 e 4 componentes. Tabela aprovada pelo dono. */
export const CHANCES_POR_ESTAGIO: Readonly<Record<FichaStage, readonly [number, number, number, number]>> = {
  rookie: [95, 5, 0, 0],
  champion: [35, 60, 5, 0],
  ultimate: [15, 30, 50, 5],
  mega: [10, 20, 40, 30],
  ultra: [5, 10, 25, 60],
};

export const sorteDaChave = (chave: string): number => mulberry32(hashString(`${chave}|complexidade`))();

/** Quantos componentes a sorte dá no estágio: `u` maior = mais complexo. */
export function componentesPorSorte(u: number, stage: FichaStage): 1 | 2 | 3 | 4 {
  const linha = CHANCES_POR_ESTAGIO[stage];
  let acc = 0;
  for (let i = 0; i < 4; i++) {
    acc += linha[i];
    if (u * 100 < acc) return (i + 1) as 1 | 2 | 3 | 4;
  }
  return 4;
}

type Afinidades = Readonly<Record<string, number | undefined>> | null | undefined;

interface Candidato { id: string; componentes: readonly string[] }

const candidatosDe = (k: number, base: string): Candidato[] =>
  (k === 2 ? DERIVED_ELEMENT_PAIRS : ELEMENTOS_CURADOS).filter(e => e.componentes.length === k && (e.componentes as readonly string[]).includes(base));

/** O elemento de `k` componentes mais perto da leitura, contendo `base`. Sem afinidades, um desempate estável pela sorte. Sem candidato, desce um k. */
export function escolherElemento(base: string, k: number, u: number, afinidades?: Afinidades): { id: string; k: number } {
  for (let n = k; n >= 2; n--) {
    const cs = candidatosDe(n, base);
    if (cs.length === 0) continue;
    const nota = (c: Candidato) => c.componentes.reduce((t, b) => t + (afinidades?.[b] ?? 0), 0);
    const empate = (c: Candidato) => hashString(`${c.id}|${u}`);
    const melhor = [...cs].sort((a, b) => nota(b) - nota(a) || empate(a) - empate(b) || a.id.localeCompare(b.id))[0];
    return { id: melhor.id, k: n };
  }
  return { id: base, k: 1 };
}

/**
 * Grava o elemento do estágio. IMUTÁVEL e idempotente: estágio já gravado (degenerar e reevoluir, troca lateral) devolve a MESMA referência.
 */
export function registrarElementoDoEstagio(
  atual: ElementoJornada | undefined,
  args: { stage: FichaStage; base: string | null | undefined; chave: string; afinidades?: Afinidades },
): ElementoJornada | undefined {
  if (!args.base || atual?.estagios?.[args.stage]) return atual;
  const u = atual?.u ?? sorteDaChave(args.chave);
  const { id } = escolherElemento(args.base, componentesPorSorte(u, args.stage), u, args.afinidades);
  return { v: 1, u, estagios: { ...(atual?.estagios ?? {}), [args.stage]: { id, base: args.base } } };
}

/** O prompt das formas ainda por desenhar recebe o elemento combinado. Forma sem registro ou de elemento único: o prompt de sempre. */
/** O pedido de fundo chroma do prompt (a "cláusula do fundo"), que não conta como cor da criatura. */
const CLAUSULA_FUNDO = /on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/;


export type ChromaKey = 'green' | 'magenta' | 'blue';


/** Cláusula do fundo (hex, nome e "a criatura não tem a cor") de cada chave. */
const CLAUSULAS: Record<ChromaKey, { hex: string; nome: string; sem: string }> = {
  green: { hex: '#00FF00', nome: 'chroma-green', sem: 'contains no green and no green fringe' },
  magenta: { hex: '#FF00FF', nome: 'chroma-magenta', sem: 'contains no magenta, no hot pink and no magenta fringe' },
  blue: { hex: '#0000FF', nome: 'chroma-blue', sem: 'contains no blue and no blue fringe' },
};

/** Cor do chroma que o prompt pede hoje. */
export const chromaDoPrompt = (prompt: string): ChromaKey => (/#0000FF/i.test(prompt) ? 'blue' : /#FF00FF/i.test(prompt) ? 'magenta' : 'green');

/**
 * Qual fundo chroma o prompt deve pedir (dono, 10/11/2026): VERDE #00FF00 por padrão; MAGENTA #FF00FF quando a criatura/elemento usa
 * verde (o recorte verde comeria o verde dela); e VERDE de novo quando só há magenta/rosa-choque. Verde E magenta juntos: AZUL #0000FF
 * (3ª chave) — nenhuma das duas outras recortaria limpo. Se a paleta também tem azul forte, não há cor segura: cai na regra antiga
 * (a cor que NÃO domina; a primeira citada é a dominante) e `semChromaSeguro` marca o caso para o dono.
 * O recorte (`functions/api/_chroma.js › chromaKeyOfPrompt`) lê essa cor DO PRÓPRIO PROMPT.
 */
export function escolherChroma(prompt: string): ChromaKey {
  const corpo = prompt.replace(CLAUSULA_FUNDO, '');
  return chromaHueCarregado()?.escolherChaveDeMatiz(corpo).key ?? 'green'; // sem a tabela carregada: o padrão (a geração só roda depois da carga)
}

/** true = o círculo cromático está cheio (nenhuma das 3 chaves fica a 30 graus ou mais das cores): listar para o dono. */
export function semChromaSeguro(prompt: string): boolean {
  return chromaHueCarregado()?.semChaveSegura(prompt.replace(CLAUSULA_FUNDO, '')) ?? false;
}

/** Troca o pedido de fundo do prompt para a cor dada (a mesma troca de texto do `withChroma` do Oráculo, em qualquer sentido). */
export function aplicarChroma(prompt: string, key: ChromaKey): string {
  const atual = chromaDoPrompt(prompt);
  if (atual === key) return prompt;
  const de = CLAUSULAS[atual], para = CLAUSULAS[key];
  return prompt.replace(`${de.hex} ${de.nome}`, `${para.hex} ${para.nome}`).replace(de.sem, para.sem);
}

/**
 * O elemento EFETIVO influencia TODO prompt (forma e cores), não só o de poção (dono, 10/11/2026): poção da forma > registro do estágio >
 * base do Soulmon. Entram o tema (poção ou combinado natural), as pistas visuais DO elemento (derivadas dos prompts dos assets) e o fundo
 * chroma coerente com as cores. A paleta por dominante/linha do prompt cru continua sendo a base. Só gerações FUTURAS usam isto.
 */
export function stagesComElemento<T extends { stage: string; branch?: string; imagePrompt: string; imagePromptFallback: string }>(
  stages: T[] | undefined, jornada: ElementoJornada | undefined,
  /** Poção por estágio: a ativa vale para a forma atual e a pendente (cristal) para o estágio-destino; vence o registro (como em `petElementOf`). */
  pocoes?: Partial<Record<FichaStage, string>>,
  /** O elemento BASE do Soulmon (Oráculo): vale quando não há poção nem registro do estágio. */
  baseDoSoulmon?: string,
  /** A forma (id de forma) dona de cada poção: a poção NÃO vale para uma forma-irmã do mesmo nível. Ausente = vale para o nível todo (legado). */
  formaDaPocao?: Partial<Record<FichaStage, string>>,
): T[] | undefined {
  if (!stages || (!jornada && !pocoes && !baseDoSoulmon)) return stages;
  // Semente estável da CRIATURA para o motivo de tempo (regra 3 de `motivoTempo.ts`): a sorte do save, senão o prompt do Rookie.
  const sementeTempo = `${jornada?.u ?? ''}|${(stages.find(s => s.stage === 'rookie') ?? stages[0])?.imagePrompt ?? ''}`;
  return stages.map(st => {
    // As etapas do Oráculo chamam o Ultimate de `perfeito` (ver `creatureFormId`); a ficha usa `ultimate`.
    const nivel = (st.stage === 'perfeito' ? 'ultimate' : st.stage) as FichaStage;
    const dona = formaDaPocao?.[nivel];
    const pocao = dona && creatureFormId(st as never) !== dona ? undefined : pocoes?.[nivel];
    const reg = jornada?.estagios[nivel];
    const efetivo = pocao ?? reg?.id ?? baseDoSoulmon;
    if (!efetivo) return st;
    let tema = '';
    if (pocao) {
      const nome = CURATED_ELEMENT_NAMES[pocao]?.en ?? elementoNomeDe(pocao).en;
      const principal = essenceComposition(pocao)?.[0] ?? pocao;
      tema = principal === pocao ? ` Elemental theme of this form: ${nome}.` : ` Elemental theme of this form: ${nome}, with ${principal} as its main element.`;
    } else if (reg && reg.id !== reg.base) {
      const nome = CURATED_ELEMENT_NAMES[reg.id]?.en ?? elementoNomeDe(reg.id).en;
      tema = ` Elemental theme of this form: ${nome}, with ${reg.base} as its main element.`;
    }
    const pistas = pistasVisuaisDoElemento(efetivo);
    const frasePistas = pistas ? ` Visual cues of this element: ${pistas}.` : '';
    const extra = `${tema}${frasePistas}`;
    if (!extra) return st;
    // Tempo: OU ampulheta OU relógio, nunca os dois, e a cláusula negativa (§324). Também limpa o prompt cru que já viesse com os dois.
    const tempo = { preferido: motivoTempoDoElemento(efetivo), semente: sementeTempo, forcar: ehElementoDeTempo(efetivo) };
    // O fundo segue as CORES (prompt cru + pistas), não o nome do elemento ("Floresta" não é cor).
    const comExtra = (prompt: string): string => aplicarChroma(umMotivoDeTempo(prompt + extra, tempo), escolherChroma(prompt + frasePistas));
    return { ...st, imagePrompt: comExtra(st.imagePrompt), imagePromptFallback: comExtra(st.imagePromptFallback) };
  });
}

/**
 * As poções que entram no PROMPT por estágio (dono, 10/11/2026): a ativa vale para a forma atual (`potionElement`) e a pendente
 * (`evolutionPotion`, no cristal) para o estágio-destino. Sem nenhuma, `undefined` — o prompt fica como antes do #722.
 */
export function pocoesDoEstado(s: {
  evolutionStage: string; potionElement?: string; evolutionPotion?: string; evolutionCrystal?: { from: string; to: string };
}): Partial<Record<FichaStage, string>> | undefined {
  const nivel = (id: string): FichaStage => (['champion', 'ultimate', 'mega'].includes(id.split('-')[0]) ? id.split('-')[0] : id === 'ultra' ? 'ultra' : 'rookie') as FichaStage;
  const out: Partial<Record<FichaStage, string>> = {};
  if (s.potionElement) out[nivel(s.evolutionStage)] = s.potionElement;
  const c = s.evolutionCrystal;
  if (c && c.from === s.evolutionStage && s.evolutionPotion) out[nivel(c.to)] = s.evolutionPotion;
  return Object.keys(out).length ? out : undefined;
}

/**
 * "Gerar personagem" com leitura NOVA do Oráculo: o elemento base do prompt é o do resultado recém-lido, e o registro por estágio
 * (`elementoJornada`) é o da criatura ANTIGA, então não vale para a nova. Sem leitura nova, nada muda (QA 10/11/2026).
 */
export function elementoParaGerar(
  novoDominante: string | undefined, jornada: ElementoJornada | undefined, baseAtual: string | undefined,
): { jornada: ElementoJornada | undefined; base: string | undefined } {
  return novoDominante ? { jornada: undefined, base: novoDominante } : { jornada, base: baseAtual };
}

/** De qual FORMA é cada poção de `pocoesDoEstado`: a ativa é da forma atual; a pendente, da forma-destino do cristal (`crystal.to`). */
export function formasDasPocoes(s: {
  evolutionStage: string; potionElement?: string; evolutionPotion?: string; evolutionCrystal?: { from: string; to: string };
}): Partial<Record<FichaStage, string>> | undefined {
  const nivel = (id: string): FichaStage => (['champion', 'ultimate', 'mega'].includes(id.split('-')[0]) ? id.split('-')[0] : id === 'ultra' ? 'ultra' : 'rookie') as FichaStage;
  const out: Partial<Record<FichaStage, string>> = {};
  if (s.potionElement) out[nivel(s.evolutionStage)] = s.evolutionStage;
  const c = s.evolutionCrystal;
  if (c && c.from === s.evolutionStage && s.evolutionPotion) out[nivel(c.to)] = c.to;
  return Object.keys(out).length ? out : undefined;
}
