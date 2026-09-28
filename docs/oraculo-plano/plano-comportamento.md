# Análise comportamental do Oráculo (Soulmon)

## 1. Conduta observada (o que o desenho atual faz, sem inferir motivo ainda)

- Jogador responde 6 perguntas (ritual obrigatório) → escolhe, ANTES de ver o resultado
  e SEM VOLTA, entre "revelar agora" ou "responder mais 20 itens" → recebe reveal com
  NOME + bio breve + UMA linha de essência (`Essência X · Ofício Y`). Não vê eixos,
  pontuação, prompt de sprite, classe real (arquétipo do class-system fica computado e
  cacheado, mas nunca renderizado — decisão do dono, rodada 7 do ORACULO.md).
- A criatura é determinística pela IDENTIDADE (nome+nascimento+respostas): reroll troca
  criatura/inspiração, nunca ficha nem skills. L1 (NARRATIVA-E-UNIVERSO.md) proíbe
  qualquer frase com a pessoa como sujeito de verbo de ser ("você é...", "sua essência
  é..."), inclusive elogiosa — a bíblia já blinda contra o efeito Barnum ofensivo.
- A astrologia/numerologia são cálculo real e verificável (efemérides, Placidus, fuso
  IANA), mas a INTERPRETAÇÃO tem "validade empírica: nenhuma" — declarado no próprio
  ORACULO.md. O teste de 20 itens é "construído segundo princípios psicométricos", mas
  "não validado" (sem análise fatorial/calibração/normatização) — o próprio doc admite.
- Evolução é MANUAL (jogador aciona), guiada por: peso de esforço das tarefas reais
  (dailyGoalFor), ritmo de cuidado medido do histórico real (carePattern.ts, só
  desempate), e traço de nascimento sorteado (sempre positivo). A leitura inicial
  (Oráculo) decide arquétipo/elemento/ficha; o COMPORTAMENTO real decide ritmo/velocidade
  e (por desempate) o galho.

## 2. Mecanismos, princípios nomeados, fonte

### a) "o bicho é meu" — por que funcionaria

1. **Especificidade > efeito Barnum genérico.**
   Princípio: quanto mais específica e não-transferível a leitura, menos ela lê como
   afirmação universal aceita por qualquer um (o próprio efeito Barnum clássico —
   Forer, 1949, "The Fallacy of Personal Validation"). O Oráculo aumenta especificidade
   por dois canais reais: (1) 4 eixos contínuos calibrados por simulação de 2000 perfis
   para não ter vantagem estrutural de nenhum valor — reduz a chance de duas pessoas
   caírem no mesmo resultado (ORACULO.md, "Equilíbrio medido"); (2) linhagem do
   bestiário e nomes derivados de todas as sílabas do nome próprio + data real
   (unicidade medida em 98% de tuplas distintas, rodada 4). **Isso é evidência
   medida em simulação, não em percepção do jogador** — dimensionar o efeito
   perceptivo real (o jogador SENTE que é específico?) ainda não foi medido com
   humanos. `[hipótese]`.

2. **Efeito de posse / dotação (endowment effect) via ritual + IKEA effect.**
   Princípio: pessoas atribuem mais valor a algo que ajudaram a construir ou que
   custou esforço/escolha (Norton, Mochon & Ariely, 2012, "The IKEA effect";
   Kahneman, Knetsch & Thaler, 1990, endowment effect clássico). O ritual de 6
   perguntas + bifurcação com escolha real e SEM VOLTA é o mecanismo mais provável
   de gerar posse — a pessoa fez uma escolha irreversível, não recebeu um resultado
   passivo. **Explicação concorrente**: o efeito pode não ser posse, e sim
   simplesmente ancoragem na primeira leitura (ver 2.b abaixo) — o dado que separa
   as duas é medir se a posse cai quando se permite reroll fácil (baixo custo de
   escolha) vs. quando a escolha é cara/sem volta como hoje. Reroll já existe (com
   custo de 50 Créditos) — comparar satisfação declarada entre quem rerolou e quem
   não, controlando por tempo de jogo, seria o teste.

3. **Ancoragem (Tversky & Kahneman, 1974) + viés de confirmação subsequente.**
   Uma vez que a pessoa recebe nome+essência, toda interação seguinte (falas do pet,
   skills, arquétipo invisível mas coerente) tende a ser lida como confirmação —
   mesmo que a leitura original tivesse baixa especificidade real. Isso é **risco**
   tanto quanto mecanismo desejável: se a ancoragem for forte, ela mascara CALIBRAÇÃO
   ruim do motor (ex.: o próprio ORACULO.md documenta que "papel" concentra 62% dos
   perfis em 2 de 5 valores no caminho longo — dívida conhecida). O jogador pode achar
   que "é ele" mesmo quando o motor sub-representa a diversidade real da população.
   `[hipótese sobre o risco; o dado do motor é medido, o efeito de ancoragem no
   jogador não]`.

4. **Legibilidade do porquê — intenção de implementação e fluência de processamento.**
   Princípio: uma explicação causal simples e visível ("essência Crepúsculo · Ofício
   Joalheiro") aumenta fluência de processamento (Alter & Oppenheimer, 2009) e ajuda a
   pessoa a formar uma teoria mental de "por que meu bicho é assim" sem exigir
   compreensão do cálculo. Isso é bom para posse, mas cria uma tensão com o L1 da
   bíblia (nunca dizer "você é") — a linha de essência já é desenhada para descrever a
   CRIATURA, não a pessoa ("é dela, não sua", NARRATIVA-E-UNIVERSO.md §14). Esse
   desenho é coerente com o princípio 4 sem cair no risco 6.b abaixo.

### b) Explicação concorrente central

Não é necessariamente "o jogador sente que É ele" por **especificidade real do
cálculo** — pode ser inteiramente **efeito Barnum comum** (a bio breve funciona porque
qualquer bio bem escrita, vaga o suficiente, ressoa — igual horóscopo de jornal).
**O dado que separaria as duas hipóteses**: dar a duas coortes de teste a MESMA bio
gerada para outra pessoa (troca cega) vs. a bio real, e medir se a taxa de "isso sou
eu"/satisfação despenca na condição trocada. Se não despencar muito, o efeito é Barnum,
não especificidade — e investir mais em calibrar o motor (ex. corrigir a dívida do
"papel" 62%) teria retorno baixo comparado a só escrever bio melhor. Isso não foi
medido — está listado abaixo como pendência para `alpha-gestor-pesquisa`.

## 3. Risco ético

1. **Rótulo de personalidade negativo — mitigado, não zerado.**
   `passives.ts` (traço de nascimento) já garante "todos são positivos" — bom, e a
   régua de teste trava isso. Mas a numerologia (lições cármicas, dívidas cármicas,
   "desafios") e certas leituras astrológicas TÊM historicamente conotação negativa
   fora do produto ("dívida cármica" soa a punição). **Risco concreto**: se qualquer
   texto de numerologia vazar para o jogador com esse vocabulário sem tradução para a
   voz do produto (L1: nunca julgar), isso reintroduz rótulo negativo pela porta dos
   fundos. Verificação pendente: `grep` por strings de numerologia (lições/dívidas
   cármicas) em qualquer componente voltado ao jogador — o ORACULO.md diz que pontuação
   e eixo NUNCA aparecem, mas não é dito explicitamente que os RÓTULOS numerológicos
   negativos também nunca aparecem em texto. Isso deveria ir para
   `alpha-compliance`/`alpha-redator-ux` como verificação, não como achado fechado.

2. **Astrologia/numerologia vendida como ciência.**
   O próprio ORACULO.md já se declara honesto ("validade empírica: nenhuma [simbólica]",
   "não é validado"). Isso é o padrão certo — mas só protege enquanto ficar CONTIDO
   internamente (docs/código). O filtro ético relevante é: **o jogador nunca vê esse
   limite declarado dentro do app**? Se a interface trata o mapa astral com o mesmo
   peso visual/tom que o teste psicométrico (ex.: ambos aparecem como "leitura séria"),
   há risco de o jogador inferir credibilidade científica que o próprio time nega
   internamente. L8 da bíblia já proíbe "os astros indicam que você deve..." — correto
   — mas não proíbe explicitamente a insinuação de que a numerologia é preditiva sobre
   a pessoa (só sobre a criatura). Recomendo perguntar/checar se em algum texto do
   ritual/onboarding a astrologia é apresentada como tendo peso EQUIVALENTE ao teste
   psicométrico validado-por-princípios — isso seria consentimento obscurecido por
   omissão de calibre epistêmico, mesmo sem mentira explícita.

3. **Escolha sem volta antes do reveal — reatância vs. compromisso.**
   Princípio: reatância psicológica (Brehm, 1966) ocorre quando a pessoa sente a
   liberdade de escolha ameaçada. Aqui a escolha É dada (20 perguntas ou não) e a
   irreversibilidade é DECLARADA antes ("a tela diz isso, com essas palavras, antes de
   a pessoa escolher") — isso é o desenho correto contra dark pattern de porta giratória
   disfarçada de reversível (explicitamente citado no próprio ORACULO.md como "a pior
   versão possível dessa tela", o que mostra que o time já aplicou este filtro). Nada a
   sinalizar aqui além de reforçar: a ausência de volta É a fricção certa, porque está
   avisada — o risco ético seria só se a irreversibilidade fosse OCULTA, o que não é o
   caso.

4. **Urgência artificial / escassez — não observada no Oráculo.** Sem timer, sem
   contagem regressiva, sem "só hoje". Ponto positivo, sinalizado como ausência
   verificada, não como omissão.

5. **Nome de bestiário (inspiração de outras franquias) entrando no prompt de imagem
   desde 27/09/2026 (D-B1)** — isso é um risco de PI, não comportamental, mas relevante
   ao filtro ético de "consentimento": o jogador não escolhe nem sabe que o nome de
   uma criatura de outra franquia influenciou o prompt (fica fora do texto que ele lê,
   por desenho). Não é manipulação sobre a PESSOA, mas é opacidade de processo — cabe
   sinalizar para `alpha-compliance`, já é conhecido pelo dono (decisão explícita, risco
   assumido), então não bloqueio, só registro.

## 4. Dimensionamento do efeito esperado — rotulado como PREVISÃO

- Efeito de especificidade sobre "sensação de que é meu": em produtos de personalização
  narrativa comparáveis (horóscopo personalizado, testes tipo MBTI/16Personalities),
  o ganho de "senso de identificação" de alta vs. baixa especificidade textual costuma
  ser **pequeno a moderado** em estudos de percepção (efeito Forer é robusto mesmo com
  baixa especificidade real) — plausível ordem de grandeza: diferença de poucos pontos
  percentuais a ~10-15pp em taxa de "isso sou eu" entre bio genérica e bio específica,
  não uma virada categórica. **PREVISÃO, não medição** — não há teste A/B do Soulmon
  citado nos docs lidos.
- Efeito do IKEA effect/posse via ritual sem volta: literatura de dotação sugere efeito
  de médio porte em WTP (willingness to pay)/apego declarado quando há esforço de
  montagem real — mas o "esforço" aqui é 6 perguntas rápidas, esforço BAIXO comparado
  aos experimentos clássicos (montar móvel). Efeito esperado: **pequeno**. PREVISÃO.
- Nenhum desses efeitos foi medido com jogadores reais — CLAUDE.md confirma que
  "ninguém nunca usou o app em produção" (07/09/2026) — logo TODA leitura de percepção
  aqui é hipótese, sem exceção, e isso deve ser dito ao dono sem meio-termo.

## 5. O que validar com humanos (→ `alpha-gestor-pesquisa`)

1. Teste cego de bio trocada (ver §2.b) — separa especificidade real de efeito Barnum.
2. Medir se irreversibilidade da bifurcação aumenta ou reduz reatância percebida (única
   pergunta pós-reveal: "senti que a escolha foi minha" vs. "senti pressionado").
3. Medir se o jogador nota/lê a dívida de calibração do motor (papel concentrado em 2/5
   valores) como "genérico" — comparar satisfação entre perfis que caem nesses 2 valores
   dominantes vs. os raros.
4. Checar terminologia de numerologia (lições/dívidas cármicas) — perguntar 5-10
   jogadores se algum trecho leu como julgamento pessoal, mesmo que a régua de código
   não deixe (teste de percepção, não de string).
5. Medir se o "quanto mostrar do cálculo" (hoje: zero eixo, zero pontuação) é sentido
   como opaco/arbitrário por uma fração relevante de jogadores versus os que preferem
   não ver números — pode não ser unânime.

## 6. Requisitos comportamentais concretos para o Oráculo (5–8, priorizados)

1. **Nunca mostrar eixo/pontuação numérica ao jogador** — já é regra; manter, porque
   número explícito convida comparação com "meu resultado é pior/menor", risco de
   status/ranking indevido numa ferramenta de auto-identidade. Reforçar com teste que
   varra qualquer render de `axes`/score fora de `OraclePage`.
2. **Toda leitura simbólica (astro/numerologia) que aparecer em texto de jogador deve
   ser traduzida para vocabulário do produto (L1-L12), nunca reproduzir rótulo
   negativo bruto ("dívida cármica", "desafio")** — adicionar regra explícita/teste
   (hoje só há proibição geral de julgamento, não específica de vocabulário
   numerológico).
3. **Manter a irreversibilidade da bifurcação DECLARADA, nunca ocultada** — já correto;
   não regredir isso ao adicionar qualquer fluxo novo de refino de perfil.
4. **Evolução deve continuar sendo função do comportamento real medido (esforço/ritmo),
   nunca da leitura do Oráculo sozinha** — já é a regra (arquétipo/ficha vêm da leitura;
   VELOCIDADE/galho no empate vêm do comportamento real via carePattern). Não deixar
   a leitura inicial "decidir" além do que ela decide hoje (família/elemento/ficha) —
   se algum dia a leitura passar a prever desempenho ou tier de dificuldade, isso
   seria aversão à perda mal-empregada (punir por traço estático).
5. **Antes de investir em calibrar mais o motor de personalidade (ex.: dívida do
   "papel" 62%), rodar o teste cego de §5.1** — se o efeito for majoritariamente
   Barnum, o retorno de mexer no cálculo é baixo comparado a melhorar a escrita da
   bio; a fricção mínima aqui é medir antes de investir engenharia de simulação cara.
6. **Não introduzir nenhum elemento de urgência/escassez no fluxo do Oráculo** — nem
   para aumentar conclusão do teste de 20 itens nem para vender reroll/upgrade. A
   pressão de tempo sobre uma decisão de identidade (mesmo que sobre um bicho virtual)
   é o tipo de padrão a recusar por princípio, independente de conversão.
7. **Skills/classe real (arquétipo) continuam calculadas mas invisíveis por decisão do
   dono — não reverter sem repassar pelo filtro ético**: exibir a classe aumentaria
   legibilidade do "porquê" (bom), mas também aumentaria a superfície de rótulo fixo
   ("você é do arquétipo X") — se um dia isso for exposto, a frase de exibição PRECISA
   passar pelo checklist L1 (não pode virar "você é um Guardião das Sombras", só "sua
   criatura carrega o padrão de..."), com teste de contrato dedicado.
8. **Antes de qualquer refino que ofereça "editar minha leitura depois", exigir o
   mesmo padrão da bifurcação atual: escolha explícita, custo declarado, sem
   reversibilidade escondida** — o precedente já existe; documentar como requisito
   reutilizável para não reintroduzir ambiguidade em fluxo futuro (ex. rebirth já
   segue esse padrão, é o exemplo a copiar).
