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
import { hashString, mulberry32 } from './oracle/base';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { ELEMENTOS_CURADOS, CURATED_ELEMENT_NAMES } from './elementosCurados';
import { elementoNomeDe } from './soulProfile/ficha/elementoNome';
import type { FichaStage } from './soulProfile/ficha/types';
import type { ElementoJornada } from './elementoJornada';

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
export function stagesComElemento<T extends { stage: string; imagePrompt: string; imagePromptFallback: string }>(
  stages: T[] | undefined, jornada: ElementoJornada | undefined,
): T[] | undefined {
  if (!stages || !jornada) return stages;
  return stages.map(st => {
    const reg = jornada.estagios[st.stage as FichaStage];
    if (!reg || reg.id === reg.base) return st;
    const nome = CURATED_ELEMENT_NAMES[reg.id]?.en ?? elementoNomeDe(reg.id).en;
    const frase = ` Elemental theme of this form: ${nome}, with ${reg.base} as its main element.`;
    return { ...st, imagePrompt: st.imagePrompt + frase, imagePromptFallback: st.imagePromptFallback + frase };
  });
}
