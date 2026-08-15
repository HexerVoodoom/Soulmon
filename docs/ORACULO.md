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

## Relação com o repositório `teste-personalidade`

Este motor foi **prototipado** em `HexerVoodoom/teste-personalidade` e migrado
para cá. **A partir daqui o Soulmon é a fonte da verdade dele.** O outro
repositório segue sendo o laboratório da ponte com o class-system e o bestiário
(ficha de personagem, captura, seleção de criatura do bestiário) — trabalho que
não é do Soulmon.

Regra prática: mudou regra do oráculo, muda **aqui**. Regra copiada é regra que
diverge em silêncio.
