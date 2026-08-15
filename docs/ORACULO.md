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

## Relação com o repositório `teste-personalidade`

Este motor foi **prototipado** em `HexerVoodoom/teste-personalidade` e migrado
para cá. **A partir daqui o Soulmon é a fonte da verdade dele.** O outro
repositório segue sendo o laboratório da ponte com o class-system e o bestiário
(ficha de personagem, captura, seleção de criatura do bestiário) — trabalho que
não é do Soulmon.

Regra prática: mudou regra do oráculo, muda **aqui**. Regra copiada é regra que
diverge em silêncio.
