/**
 * Constantes da ALOCAÇÃO GERACIONAL — os diais da cascata num lugar só.
 *
 * A regra (pedida pelo dono do projeto): ponto direto nasce restrito aos 17
 * elementos base; investir nos DOIS pais de um par faz o par acumular pontos
 * PASSIVOS (a cada `DIVISOR_CASCATA` pontos efetivos em CADA pai, 1 ponto
 * passivo no filho — 5 fogo + 5 água → 1 vapor); um derivado que acumula
 * `LIMIAR_DESTRAVAMENTO` passivos DESTRAVA a alocação direta nele. Triplas e
 * quádruplas seguem a mesma regra com os pais de aridade N−1.
 *
 * O peso de geração NÃO é um multiplicador de potência novo — a potência por
 * aridade já existe (`FATOR_BASE_ARIDADE` + compensação de aridade nas
 * skills). O peso aqui é ECONÔMICO: `CUSTO_PONTO_ALOCACAO` faz 1 ponto direto
 * em gerações altas custar mais orçamento, redistribuindo em vez de
 * multiplicar (invariante de balanceamento nº 3).
 *
 * `pesoDiretoNaCascata` fecha a arbitragem por construção: 1 ponto de
 * ORÇAMENTO compra o MESMO progresso de cascata onde quer que seja gasto.
 * Se este peso virar 1, destravar um par e despejar pontos nele vira máquina
 * de inflação de gerações altas — há teste de não-arbitragem travando.
 */
export type Aridade = 1 | 2 | 3 | 4;
/** Pontos efetivos exigidos em CADA pai para render 1 ponto passivo no filho. */
export declare const DIVISOR_CASCATA: Record<Aridade, number>;
/** Pontos PASSIVOS acumulados que destravam a alocação direta no elemento. */
export declare const LIMIAR_DESTRAVAMENTO: Record<Aridade, number>;
/**
 * Custo, em pontos de orçamento, de 1 ponto DIRETO em cada geração.
 *
 * PARIDADE COM OS PAIS por desenho: +1 nível num derivado via pais custa
 * (aridade) pontos de orçamento (1 em cada componente), então o direto custa
 * o MESMO — {1,2,3,4}. A auditoria adversarial mediu que o valor antigo
 * {1,3,10,30} criava dominância estrita (o direto era sempre a pior compra,
 * 1,5×/3,3×/7,5× mais caro que subir os pais, que ainda davam colaterais):
 * o prêmio do destrave era conteúdo morto. Com a paridade, o direto compra
 * FOCO (sobe só aquele derivado, sem alargar irmãos) pelo mesmo preço —
 * uma troca honesta. O peso econômico da geração vive no MARCO do destrave
 * (100/360/960), não no preço do ponto.
 */
export declare const CUSTO_PONTO_ALOCACAO: Record<Aridade, number>;
/** Custo, em orçamento, de 1 ponto obtido pela cascata pura (build simétrica):
 *  gen-2 = 5×2 bases = 10 · gen-3 = 20×3 = 60 · gen-4 = 60×4 = 240. */
export declare const CUSTO_CASCATA_EQUIVALENTE: Record<Aridade, number>;
/** Divisor da cascata para os elementos ESPECIAIS (primordial/ciclo/nulo),
 *  cujos pais declarados são as próprias bases da receita ampla. */
export declare const DIVISOR_CASCATA_ESPECIAL = 20;
/**
 * Fração de um ponto DIRETO que alimenta a geração seguinte, amarrada ao
 * custo (custo direto ÷ custo da cascata equivalente). A paridade que isso
 * garante vale para o `paraCascata` DO PRÓPRIO nó por ponto de orçamento —
 * o destrave da geração seguinte pela rota "pares + diretos" continua MAIS
 * caro que pelas bases (o `min` sobre N pais cobra N vezes), e há teste de
 * marco MEDIDO travando isso em `tests/cascata.test.ts`.
 */
export declare function pesoDiretoNaCascata(aridade: Aridade): number;
/**
 * Curva de orçamento sugerida por tier de personagem — conteúdo de registro
 * lido pela UI/consumidores, NUNCA imposto pelo motor (point-buy continua
 * aberto). Alvo de desenho MEDIDO: no teto (1200), duas quádruplas
 * DISJUNTAS são impossíveis (custariam 1920); o que existe é UMA família de
 * 5 bases a 240 destravando as C(5,4)=5 quádruplas irmãs pelo preço exato do
 * teto — dominar uma família elemental inteira, e nada além dela (teste em
 * `tests/cascata.test.ts`).
 */
export declare const ORCAMENTO_POR_TIER: Record<number, number>;
