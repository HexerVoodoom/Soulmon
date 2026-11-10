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
import { DESCRITORES_ELEMENTO } from './elementoDescritores.data';

/** As pistas visuais do elemento (forma + paleta), derivadas dos prompts dos assets dele. `undefined` = sem prompt-fonte (só o nome). */
export function pistasVisuaisDoElemento(id: string): string | undefined {
  const d = DESCRITORES_ELEMENTO[id];
  if (!d || (!d.forma && !d.paleta)) return undefined;
  return `${[d.forma, d.paleta ? `${d.paleta} palette` : ''].filter(Boolean).join(', ')}`;
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
const VERDE = /green|lime|mint|emerald|jade|olive|fern|moss|sage|clover|forest|verde/i;
// Só o magenta que o recorte comeria (claro/saturado); "dark magenta" (min(r,b) < 150) não é chaveado.
const MAGENTA = /(?<!dark |deep |dim )magenta|hot[- ]pink|fuchsia|neon pink/i;
/** O pedido de fundo chroma do prompt (a "cláusula do fundo"), que não conta como cor da criatura. */
const CLAUSULA_FUNDO = /on a solid flat pure #[0-9A-Fa-f]{6} chroma-\w+ background \([^)]*\), the creature itself contains no [^:]*? fringe/;

/** Cor do chroma que o prompt pede hoje. */
export const chromaDoPrompt = (prompt: string): 'green' | 'magenta' => (/#FF00FF/i.test(prompt) ? 'magenta' : 'green');

/**
 * Qual fundo chroma o prompt deve pedir (dono, 10/11/2026): VERDE #00FF00 por padrão; MAGENTA #FF00FF quando a criatura/elemento usa
 * verde (o recorte verde comeria o verde dela); e VERDE de novo quando só há magenta/rosa-choque. Verde e magenta juntos: o fundo é a chave da cor
 * que NÃO domina (a primeira citada é a dominante).
 * O recorte (`functions/api/_chroma.js › chromaKeyOfPrompt`) lê essa cor DO PRÓPRIO PROMPT, então as duas cores funcionam sem outro ajuste.
 */
export function escolherChroma(prompt: string): 'green' | 'magenta' {
  const corpo = prompt.replace(CLAUSULA_FUNDO, '');
  const g = corpo.search(VERDE);
  const m = corpo.search(MAGENTA);
  if (g >= 0 && m < 0) return 'magenta';
  if (m >= 0 && g < 0) return 'green';
  // Os dois: a cor que aparece PRIMEIRO é a dominante (nas pistas a 1ª cor domina); o fundo é a OUTRA chave.
  if (g >= 0 && m >= 0) return g < m ? 'magenta' : 'green';
  return chromaDoPrompt(prompt);
}

/** Troca o pedido de fundo do prompt para a cor dada (a mesma troca de texto do `withChroma` do Oráculo, nos dois sentidos). */
export function aplicarChroma(prompt: string, key: 'green' | 'magenta'): string {
  if (chromaDoPrompt(prompt) === key) return prompt;
  return key === 'magenta'
    ? prompt.replace('#00FF00 chroma-green', '#FF00FF chroma-magenta').replace('contains no green and no green fringe', 'contains no magenta, no hot pink and no magenta fringe')
    : prompt.replace('#FF00FF chroma-magenta', '#00FF00 chroma-green').replace('contains no magenta, no hot pink and no magenta fringe', 'contains no green and no green fringe');
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
    // O fundo segue as CORES (prompt cru + pistas), não o nome do elemento ("Floresta" não é cor).
    const comExtra = (prompt: string): string => aplicarChroma(prompt + extra, escolherChroma(prompt + frasePistas));
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
