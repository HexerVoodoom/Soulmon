# O Oráculo — como a criatura de alguém é decidida

O oráculo tem **duas metades**, e a separação entre elas é o que torna esta
troca possível sem quebrar nada:

| Metade | Onde mora | O que faz |
|---|---|---|
| **Leitura** | `src/utils/soulProfile/` | transforma quem a pessoa é em 4 eixos: elemento, papel, alinhamento, reino |
| **Criação** | `src/utils/oracle.ts` | transforma esses 4 eixos numa criatura: arquétipo, família, fusão, nome, bio, as 11 formas e os prompts de sprite |

A criação **não mudou**. O que mudou foi o motor da leitura.

---

## O que a leitura era, e por que trocou

A leitura original lia um punhado de baldes discretos:

- signo solar por faixa de datas;
- **ascendente chutado**: um signo a cada 2 horas a partir das 6h, sem lugar de
  nascimento nenhum na conta;
- animal e elemento do horóscopo chinês;
- rashi védico;
- 4 números de numerologia;
- 6 perguntas de quiz com efeitos escritos à mão (`+4 tanque`, `+2 terra`).

Isso dava **pouca resolução**: duas pessoas do mesmo signo, mesmo animal chinês
e mesmas 6 respostas saíam idênticas, por mais diferentes que fossem. E o
ascendente — que pesa na leitura — era um palpite apresentado como leitura.

## O que a leitura é agora

Três camadas, com estatutos **diferentes e declarados**:

| Camada | Base | Validade empírica |
|---|---|---|
| Psicométrica | Big Five + Honestidade-Humildade (HEXACO) + 4 eixos junguianos | alta |
| Astrológica | efemérides reais (VSOP87/ELP) + astrologia tropical | nenhuma (simbólica) |
| Numerológica | numerologia pitagórica completa | nenhuma (simbólica) |

Só a primeira tem evidência científica. Nas outras duas o **cálculo** é correto
e verificável, a **interpretação** não tem poder preditivo demonstrado. Elas
estão aqui porque geram sabor narrativo denso e determinístico para a criatura,
não porque digam algo verdadeiro sobre a pessoa — e os coeficientes de
`axes.ts` pesam de acordo: os traços mandam, os símbolos temperam.

### 1. Teste de personalidade — 20 itens

`soulProfile/personality/`. Seis fatores (os cinco grandes + Honestidade-
Humildade do HEXACO, que separa "gentil" de "íntegro" — distinção que importa
quando a saída vira algo parecido com alinhamento).

Três formatos misturados, de propósito: Likert sozinho se responde no piloto
automático; escolha forçada quebra o viés de concordar com tudo; cenário mede o
que a pessoa **faria**, não o que ela diz ser.

Cada fator tem **um par de itens chaveado** (um direto, um invertido). É isso
que torna possíveis os **índices de validade** — aquiescência, inconsistência,
resposta extrema, resposta no meio. Eles não medem personalidade: medem se o
protocolo pode ser lido como um resultado de personalidade. Quando algum
estoura, a interface avisa **antes** de mostrar o perfil.

> **Limite honesto, e ele é do tamanho que parece:** este teste **não é
> validado**. Os itens são originais e nunca passaram por análise fatorial,
> calibração de item ou normatização em amostra. Ele é construído *segundo*
> princípios psicométricos, o que não é a mesma coisa que ser um instrumento
> validado. Nada aqui serve para uso clínico, diagnóstico ou decisão sobre
> ninguém. É um gerador de criatura.

### 2. Mapa astral real

`soulProfile/astrology/`. Posições geocêntricas via `astronomy-engine`,
rotacionadas para a **eclíptica verdadeira da data** (que é o referencial da
astrologia tropical), verificadas em teste contra efemérides publicadas com
tolerância de 0,05° nos dez corpos.

O instante UTC vem do **fuso IANA da cidade** — é isso que honra as regras
históricas de horário de verão. Não é detalhe: um nascimento em janeiro de 1994
em São Paulo estava em UTC−2, não UTC−3, e errar isso desloca o Ascendente em
~15°. Há teste cobrindo exatamente esse caso.

Casas por **Placidus**, resolvidas por iteração de ponto fixo. Onde o cálculo
não é possível, o sistema **degrada explicitamente** em vez de inventar
precisão:

- **sem hora de nascimento** → meio-dia local, Ascendente/MC/casas
  **desligados**, e a pessoa é avisada;
- **acima dos círculos polares**, onde Placidus é matematicamente indefinido →
  cai para Signos Inteiros, e a pessoa é avisada.

É por isso que a cidade vem de uma **tabela embarcada** com fuso IANA, e não de
um campo de texto livre: um mapa precisa de coordenada boa a alguns
quilômetros e do fuso certo, e texto livre não entrega nenhum dos dois. Quem
nasceu fora da lista escolhe a cidade grande mais próxima — a própria tela diz
isso.

### 3. Numerologia completa

`soulProfile/numerology.ts`. Caminho de vida, expressão, motivação, impressão,
dia natalício, maturidade, equilíbrio, ano pessoal, lições cármicas, paixão
oculta, 4 desafios, 4 pináculos e dívidas cármicas. Números mestres (11/22/33)
preservados na redução, exceto nos desafios (convenção). O Y conta como vogal
só quando carrega o som vocálico (SYLVIA sim, MAYA não).

---

## Como as três viram 4 eixos (`soulProfile/axes.ts`)

Somas ponderadas documentadas e determinísticas — **sem RNG**, ao contrário do
desempate por hash do motor antigo, porque aqui os insumos já são contínuos.

Os coeficientes foram **calibrados empiricamente** (simulação de 2000 perfis),
não no olho. O critério é um só: **nenhum elemento, papel, alinhamento ou reino
pode ter vantagem estrutural sobre os outros** — quem vence tem que vencer pela
pessoa, não pela forma da fórmula. Cada coeficiente tem, no código, o comentário
da assimetria que ele corrigiu (industrial vencendo 31% das vezes contra 12,5%
esperados; akasha inflado por sombra/luz terem teto maior; poder suprimido por
só 1 dos 5 papéis apontar para ele). **Mexer num coeficiente sem refazer a
simulação reabre exatamente o buraco que ele fechou.**

As tabelas de afinidade (`NUMBER_ELEMENTS`, `NUMBER_ROLES`, `NUMBER_ALIGNMENT`,
`ROLE_ALIGNMENT`, `REALM_WEIGHTS`) **não são copiadas** para cá: são importadas
do `oracle.ts`. São vocabulário do jogo, não deste motor, e uma segunda cópia
divergiria em silêncio (footgun 9 do `CLAUDE.md`).

`REALM_WEIGHTS` foi rebalanceada nessa passada: os pesos de cada reino agora
somam 6. Antes o oceano somava 4 e picos/floresta/gelo/campina somavam 5 contra
6 dos concorrentes — um teto estruturalmente menor que deixava o oceano
**inalcançável** (0 de 2000 perfis).

---

## O fluxo: 6 perguntas para todo mundo, 20 para quem quiser

O ritual de nascimento continua sendo **6 perguntas**. Vinte itens
psicométricos como porta de entrada obrigatória seriam um formulário, não um
ritual — e o ritual é a primeira coisa que a pessoa faz no app.

Depois delas vem uma **bifurcação**, e ela é oferecida **antes do reveal**:

- *Revelar meu Soulmon agora* → a leitura é o mapa astral real + a numerologia
  completa + as 6 respostas. A camada psicométrica fica vazia (traços neutros).
- *Responder mais 20 perguntas* → a mesma leitura, com a camada psicométrica
  preenchida, que passa a ser o sinal mais forte.

Duas decisões de produto que o código precisa respeitar:

1. **A escolha é antes do reveal, e isso é o desenho.** Se o convite viesse
   depois, refinar significaria trocar por outra a criatura que a pessoa acabou
   de conhecer. Aqui ela nasce **uma vez só**, já com a leitura escolhida.
2. **A escolha não tem volta.** Não existe caminho para responder o teste
   depois — e a tela diz isso, com essas palavras, antes de a pessoa escolher.
   Uma porta de mão única que se apresenta como reversível é a pior versão
   possível dessa tela.

As 6 respostas entram na leitura nos **dois** caminhos. Isso não é detalhe de
implementação: para quem não faz o teste longo, elas são o **único** sinal de
personalidade que existe — o resto é céu de nascimento e nome. Os eixos do
motor novo são substituídos e os efeitos do quiz reaplicados por cima; na
escala normalizada (cada eixo soma 100), um efeito forte move um elemento em
cerca de ⅓ da média. O reino **não** leva o ×3 do caminho legado, senão uma
resposta só decidiria o bioma sozinha.

### O que a pessoa vê do resultado

Nome e uma descrição breve. **Não** vê pontuação de eixo, barra de elemento nem
prompt de sprite. A `OraclePage` — que mostra tudo isso, mais geração de imagem
— é ferramenta de criação e **não tem entrada na navegação do app**.

## Onde as duas metades se encontram

`OracleInput` ganhou um campo opcional: `soulProfile`.

- **Com** ele, os 4 eixos vêm do motor novo, e o Sol/Ascendente do resumo de
  personalidade vêm do mapa real.
- **Sem** ele, o caminho legado roda inteiro — é o que mantém funcionando o
  perfil já salvo no aparelho de quem jogou antes da troca (o reroll relê o
  mesmo `SOULMON_PROFILE`).

Daí para frente **nada muda**: preferências diretas (25%), descrição livre do
pet (50%), overrides do usuário, arquétipo, famílias, fusão e as 11 formas são
exatamente o mesmo código. Dado o mesmo par (eixos, seed), a criatura que sai
pelos dois caminhos é idêntica.

### Peso no bundle

O motor puxa a `astronomy-engine` e é pesado. Ele é sempre alcançado por
**import dinâmico** (`await import('../utils/soulProfile')`), e o `oracle.ts`
importa dele **só tipos** — que somem na compilação. Resultado: a engine de
efemérides fica fora do bundle inicial, num chunk próprio que só é baixado na
tela de geração. O `SoulProfile` resultante é JSON puro, serializável, e vai
para o `SOULMON_PROFILE` no localStorage junto com a seed.

---

## Equilíbrio medido (e a dívida conhecida)

Simulação de 400 perfis sintéticos por caminho (nomes, datas, horas e cidades
sorteadas; respostas sorteadas uniformemente), comparando com o oráculo
**legado** como linha de base. Distribuição do vencedor de cada eixo:

| Eixo (linha de base) | Legado | Só as 6 | 6 + 20 |
|---|---|---|---|
| elemento (12,5%) | 21,3% … **1,3%** | 19,5% … 4,5% | 17,8% … 6,3% |
| papel (20%) | 28,5% … 14,5% | 28,2% … 9,5% | **31,3% … 10,5%** |
| alinhamento (33%) | 54,3 / 28,7 / 17,0 | 50,7 / 30,8 / 18,5 | 49,5 / 26,8 / 23,8 |
| reino (11%) | 18,5% … 1,5% | 22,8% … **0,5%** | 22,5% … 1,0% |

O que melhorou em relação ao legado: **elemento** (planta e industrial eram
praticamente inalcançáveis, 2,0% e 1,3%) e **alinhamento** (harmonia dominava
54% dos perfis).

O que **piorou, e é dívida conhecida**:

- **Papel**: `magico` e `alcance` juntos vencem ~62% dos perfis no caminho
  longo, contra 40% de linha de base para dois papéis entre cinco. Causa
  identificada: cada eixo junguiano é medido por **um único item de escolha
  forçada**, então o escore é sempre exatamente 0 ou 100 — nunca um meio-termo
  — e os coeficientes foram calibrados assumindo variação contínua. O
  amortecedor `JUNG_DAMPING` (`axes.ts`) corta esse salto pela metade
  preservando a média, e levou o par de 66% para 62%. **Não fecha o buraco**:
  fechar exige recalibrar os coeficientes de papel contra uma simulação que
  sorteie RESPOSTAS (não traços), que é o que o app realmente recebe.
- **Reino**: `akasha` cai para 0,5% no caminho das 6 (era 16,5% no legado). No
  legado, sombra e luz ganhavam pontos fortes do yin/yang chinês e do
  nascimento noturno; no motor novo, sem camada psicométrica, os dois ficam
  presos num termo de traço constante e `akasha` (`{luz:3, sombra:3}`) some.
  `pantano` fica em ~1,5% nos três caminhos — esse é **pré-existente**, não
  entrou com a troca.

Nenhum eixo é inalcançável em nenhum caminho, e nenhum passa de 32%. A
simulação que produziu esta tabela não está commitada; ela é reconstruível a
partir desta descrição, e vale reconstruí-la antes de mexer em qualquer
coeficiente.

---

## A fusão: ficha, bestiário e a constelação (ago/2026, rodada 2)

O oráculo deixou de parar nos 4 eixos. Com os três repositórios ligados, o
pipeline completo é:

```
leitura (soulProfile)
  → ficha do class-system nos 5 estágios     [soulProfile/ficha/]
  → companheiro capturável (mecânica real)   [ficha/capture.ts]
  → criatura-inspiração do bestiário         [soulProfile/bestiary/]
  → geração da criatura                      [oracle.ts]
```

**Dados sincronizados, nunca copiados à mão** (`scripts/sync-oracle-data.mjs`):
snapshots com procedência (repo + SHA + data) — `ficha/classSystem.data.json`
(65 talentos, 11 profissões, 32 criaturas, 14 famílias) e `bestiary/pool.json`
(2.000 criaturas ÚNICAS, amostra estratificada do corpus canônico de 6.709
elegíveis do Besti-rio-). Atualizar = `npm run sync:oracle-data` com os clones
irmãos. ⚠️ O pool aponta para a branch `claude/canonical-classification` do
Besti-rio- até a classificação canônica ser mergeada na main de lá.

**A constelação ancora os 11 elementos órfãos** (`astrology/prominence.ts` +
`axes.ts`): proeminência planetária real (aspectos pesados por orbe + casas
angulares) via a associação clássica — Marte→marcial, Saturno→tempo,
Urano→eletricidade, Plutão→morte/vileza, Mercúrio→som, Vênus→vida,
Júpiter→espaço, Lua+Saturno→gravidade, Netuno→arcano. O sinal está no DESVIO
do neutro (shares reais: p50 9,9 · p99 18,6), amplificado por
`ANCHOR_GAIN` — um elemento cósmico só domina quando o planeta domina o mapa.

**Cobertura TOTAL, medida em simulação com mapas reais (800 perfis)** — a
regra é "todo elemento, talento, profissão e criatura alcançável":

| O quê | Cobertura |
|---|---|
| 17 elementos como dominante | 17/17 (piso: vileza ~0,1% — gangorra com morte, mesmo planeta) |
| combos derivados distintos | 88 |
| 65 talentos (43 com pré-requisito) | 65/65 — alocação ciente de pré-requisito |
| 11 profissões | 11/11 (5,6%–19,1%) |
| 32 criaturas do class-system | 32/32 capturáveis no ultra (12 como companheiro rookie) |
| 2.000 criaturas do pool | 2.000/2.000 alcançáveis por faixa |

**A inspiração nunca vaza**: o bestiário tem nomes de franquia, e a decisão do
dono é que tudo bem PORQUE o nome não sai no prompt final. O texto da criatura
(sem o nome) alimenta só a ESCOLHA de família da máquina criativa; bio,
conceito e prompts continuam saindo dos bancos próprios. Há teste travando
nome-fora-de-prompt em `pipeline.test.ts`.

**Estabilidade**: a ficha e o companheiro são funções da IDENTIDADE (nome +
nascimento + respostas) — reroll troca a criatura e a inspiração, nunca a
ficha. O jogador vê UMA linha nova no reveal ("Essência Crepúsculo · Ofício
Joalheiro", PT+EN via `essenceLabels.ts`); pontuações continuam invisíveis.

---

## Relação com o repositório `teste-personalidade`

Este motor foi **prototipado** em `HexerVoodoom/teste-personalidade` e migrado
para cá. **A partir daqui o Soulmon é a fonte da verdade dele.** O outro
repositório segue sendo o laboratório da ponte com o class-system e o bestiário
(ficha de personagem, captura, seleção de criatura do bestiário) — trabalho que
não é do Soulmon.

Regra prática: mudou regra do oráculo, muda **aqui**. Regra copiada é regra que
diverge em silêncio.

## Alocação geracional, linhagem e skills (ago/2026, rodada 3)

Pedido do dono, implementado nos dois lados:

**Class-system (PR #5 de lá):** ponto direto nasce restrito aos 17 base; a
CASCATA rende pontos passivos nos derivados (5+5→1 no par; divisores 5/4/3 por
aridade), 10 passivos destravam a alocação direta (limiares 10/6/4), e o peso
de geração entra como CUSTO de orçamento {1,3,10,30} — não multiplicador
(a potência por aridade já existia). Duas contabilidades convivem: o nível
efetivo antigo (skills/arquétipos intocados) e a cascata (destrave + alimento
da geração seguinte).

**Soulmon:** a ficha distribui por essa regra com orçamento PRÓPRIO de
elementos (`ELEMENT_ORCAMENTO_BY_STAGE` 30/60/120/300/500) e especialização
progressiva (`FOCUS_EXPONENT` — evoluir é focar). A escada medida em 120
perfis reais: rookie–ultimate só bases · mega chega "quase destravando" (a
antecipação é conteúdo) · ultra destrava e compra o par em ~73% dos perfis
(23 pares distintos). A réplica da regra é gen-2 SÓ (a linguagem de essência
do pet); paridade travada por fixtures que o `sync:oracle-data` gera rodando
o MOTOR REAL via tsx (`cascata.parity.test.ts` — antídoto do footgun 9).

**Linhagem do bestiário:** uma inspiração POR estágio, encadeada por
proximidade de espécie (família +4 · biologia até +4,5 · elementos até +2 ·
tamanho vizinho +1 — família domina, a soma pode vencê-la). Medido: 86,8% das
transições preservam a família; travessias (dragão→mamífero) acontecem só com
forte sobreposição. O 1º estágio é BIT A BIT o pick clássico que alimenta a
geração; nenhuma criatura se repete na linhagem.

**Skills por forma:** cada estágio ganha o par básica (custo baixo, frequente)
/ especial (custo alto, rara), derivado da ficha — elemento dominante com peso
por geração (par comprado ×3), escola distribuída dominante, recurso da ficha.
A especial do ultra herda o PAR comprado ("Fúria de Prisma"). Custo é
QUALITATIVO por desenho: o motor de skills do class-system é validador, não
gerador, e portar a fórmula de custo acoplaria o app ao balanceamento de lá.
Nomes/descrições EN+PT de léxico próprio. Skills são função da IDENTIDADE
(reroll não troca).

**Página do Pet** (`PetPage.tsx`, chip Evolução | Pet | Estatísticas): as
formas já desbloqueadas (nunca as futuras), com a `description` por forma que
o save sempre teve e nunca renderizou, e as duas skills. As skills são
recomputadas sob demanda do `SOULMON_PROFILE` (determinístico) — zero campo
novo no save; saves legados só não mostram a seção.

## Revisão de unicidade e fidelidade (ago/2026, rodada 4)

Medição com 200 perfis reais (metade só-6, metade com os 20 itens), pedida
pelo dono. O que estava forte: fidelidade (respostas opostas mudam a tupla de
identidade 10/10; os 6 traços movem elemento/papel/alinhamento em direções
semanticamente coerentes), bestiário sem concentração (top-10 = 10,5%),
gap de diversidade entre os dois caminhos zerado (98% vs 98% de tuplas
distintas). O que estava quebrado e foi corrigido:

- **Nomes** (`oracle.ts`): 20,5% de colisão de baseName → **1,5%**. A tupla
  de identidade era 96,5% única, mas o funil de nomes jogava essa unicidade
  fora (sílaba pessoal = 1ª letra+1ª vogal; bancos pequenos). Agora: todas as
  sílabas do nome inteiro são candidatas, RNG dedicado (`|nome`), bancos
  dobrados (8 radicais/elemento, 6/reino), 4 padrões de composição com a
  sílaba do elemento em posição variável. Estilo preservado.
- **Papéis no só-6** (`axes.ts`): alcance 46%→12–22%, suporte 5%→18–22%
  (nivelamento das constantes neutras: alcance tinha a maior média em traços
  50 E o quiz o empurrava em ~5 das 6 perguntas). Validado em 3 seeds.
- **Identidades fantasma** (`axes.ts`): sombra 2,5%→≥10%, água 7%→≥7,5%,
  pântano 0,5%→6,5–9%, akasha→≥3,5%, gelo→≥5% — piso
  `REALM_SPLIT_COMPENSATION` compensando o racha estrutural das perguntas de
  reino (+4 concentrado vs +1 rachado), sem tocar no ritual.

Direções de fidelidade re-verificadas depois de cada mudança (hi/lo por
traço). Regra de sempre: mexer em coeficiente de `axes.ts` sem refazer a
simulação reabre o buraco que ela fechou.

## QA rodada 1 pós-merge (ago/2026): o que a auditoria achou

Quatro auditorias paralelas (regra de investimento, pipeline end-to-end,
integração cruzada, UX real com Playwright). Os achados que viraram correção:

- **P0 — nome sem letra latina derrubava a geração inteira.** `normalizeName`
  só preserva A–Z, então cirílico/CJK/árabe/grego somavam 0 e
  `NUMBER_ELEMENTS[0]` estourava com "undefined is not iterable". A pessoa
  ficava presa no ritual, sem conseguir criar personagem nenhum — e o app é
  vendido em EN. Agora `sumLetters` nunca devolve 0: sem letra latina, o número
  vem do HASH do nome (o nome continua influenciando a leitura). O mesmo vale
  para data inválida no `lifePath`.
- **P1 — as 6 respostas do ritual não alcançavam metade do resultado.** Ficha,
  companheiro, skills e bestiário liam `soul.oracle` cru; o quiz só era
  aplicado nas cópias locais do `generateOracle`. Medido: mesmo nascimento com
  respostas OPOSTAS dava ficha, ofício, essência, companheiro, skills e
  criatura do bestiário IDÊNTICOS. `ritualAnswers.ts` é a fonte única que
  aplica o ritual sobre os eixos, e o `identityKey` passou a incluir as
  respostas SEMPRE. Cobertura re-medida depois: 11/11 profissões, 65/65
  talentos, 9 reinos, 5 papéis.
- **P2 — o reroll cobrava 50 Créditos (dinheiro real) e podia falhar depois.**
  Um perfil salvo corrompido fazia a geração lançar DEPOIS do débito. Agora
  gera antes de cobrar, e o modal tem `try/finally` (o botão ficava preso em
  "carregando" para sempre).
- **UX**: chip "Estatísticas" cortado no viewport de celular (a fileira foi de
  323 para 412px quando o chip "Pet" entrou); sprite genérico nas formas
  passadas do jogador demo; realce da forma atual invisível (sombra externa é
  recortada pelo `clip-path` do `.sm-card`); skills repetidas entre estágios;
  bio do reveal que em EN era um fragmento sem verbo ("angel-seraph, Sky
  Cleric") e em PT tinha erro de concordância; "do reino Reino de Akasha";
  parênteses de gênero ("hipnótico(a)") em texto de jogador.
- **Skills sumiam num aparelho novo**: o perfil do oráculo vive só no
  localStorage e não sobe para a nuvem. Agora as skills entram no save
  (`soulmonSkills`), preenchidas pela própria página do Pet quando ela
  consegue recomputar.

## QA rodada 2 (ago/2026)

- **Paridade dos diais fechada.** Mutar `CUSTO_PONTO_PAR` de 2 para 3 na
  réplica gen-2 do Soulmon **não quebrava nenhum teste** (1253/1253 passavam):
  os fixtures do sync mediam só COMPORTAMENTO (passivos/destrave), e o dial
  ECONÔMICO — justamente o que o class-system já mudou uma vez — podia divergir
  em silêncio. Agora o `taxonomy.json` v2 leva o bloco `geracoes` para dentro
  do snapshot e o teste de paridade afirma os QUATRO diais contra a fonte;
  cada uma das 4 mutações foi verificada falhando.
- **Skills repetiam ao longo da jornada**: o banco de substantivos tinha 2 por
  (escola, tipo) para 5 estágios, então o anti-repetição esgotava no 3º e
  rookie e ultimate saíam com o MESMO nome, custo e descrição. São 6 agora,
  com teste travando a não-repetição nos 5 estágios.
- **Estilo**: os 20 itens do teste e o seletor de cidade eram texto puro
  (`SoulTestItem` sem `className`, input sem `sm-px-field`) logo depois de 6
  telas com botões chanfrados — o jogador não percebia que eram clicáveis.
  Agora usam o mesmo `sm-px-choice` + `aria-pressed` do ritual.
- **Rótulo de linhagem duplicava radical** ("urso-urso polar"): a fusão de
  nomes agora mantém só o mais específico quando um contém o outro.
- Re-verificado com Playwright em PT e EN: a fileira de chips não corta mais
  (foi preciso zerar o `letter-spacing` além do `minWidth`), as formas passadas
  do demo usam a linha certa, o realce `inset` aparece, e a bio do reveal é
  frase completa nos dois idiomas.
