# Problem Framing — GOAL do Oráculo

## 1. O pedido não é o problema

Pedido literal: "que o personagem seja único, aproveite toda base que temos,
seja resultado dos dados do user, mantenha lógica de evolução com
flexibilidade e balanceamento, todos elementos/classes com chances
proporcionais". Isso é uma lista de **soluções** (feature: usar mais dados;
feature: balancear; feature: subdividir bestiário). O problema por trás:

> Hoje o motor de criação tem pontos onde a IDENTIDADE do jogador se perde
> (mesmo perfil → mesma saída) ou onde a SAÍDA trai a base que o app construiu
> (79 classes e 194 criaturas existem, mas a maioria é estruturalmente
> inacessível). Isso ameaça a promessa central do produto — "o bicho é VOCÊ,
> e ele evolui COM você" — porque uma criatura previsível ou repetida não lê
> como retrato de ninguém.

Recuando mais: por que isso importa para o negócio? O Oráculo é o momento de
ativação (primeira sessão) e a âncora emocional de retenção (evolução = volta
ao app). Se a criatura não parece "sua", o mecanismo de vínculo que sustenta
D1/D7/D30 não liga.

## 2. JTBD

Quando **eu respondo o ritual (e talvez os 20 itens) e vejo minha
criatura pela primeira vez**, quero **reconhecer nela algo que veio de mim
especificamente, não de uma fórmula genérica**, para **sentir que o app me
enxergou e continuar voltando para ver ela evoluir comigo**.

JTBD secundário (dono do produto, não do jogador): quando **eu invisto em
79 classes e 194 criaturas**, quero **que a distribuição de resultados use
essa base de forma proporcional**, para **não ter construído conteúdo morto**.

## 3. Dimensionamento

- Afetados: 100% dos jogadores que completam o ritual (é o único caminho de
  criação de personagem além do demo/premade). `[fato]` — não é segmento, é
  o funil inteiro de ativação.
- Volume real de usuários: **zero em produção** (CLAUDE.md, confirmado pelo
  dono, 07/09/2026). Isto muda a natureza da tarefa: não há dado real de uso
  para calibrar contra comportamento humano — só simulação sintética. Todo
  "% de jogadores que perceberiam X" abaixo é `[suposição a validar]`.

## 4. Métrica-norte e mecanismo

Não há métrica de produto (retenção, D7) medível hoje — sem usuários, ela é
hipótese pura. A métrica-norte do PRÓPRIO Oráculo, a que pode ser instrumentada
por simulação, é:

**Métrica-norte: Índice de Unicidade Percebível (IUP)** — probabilidade de que
dois jogadores com identidades de entrada diferentes recebam resultados
distinguíveis nas dimensões que o jogador realmente VÊ (nome, criatura visual,
elemento dominante mostrado, linhagem de evolução, essência/ofício). Mecanismo:
IUP baixo → jogadores comparando personagens (redes sociais, comunidade) veem
repetição → a promessa "seu bicho único" quebra publicamente → cai confiança
no produto antes mesmo de D1 ser medível.

Isto move a métrica-norte real do app (retenção) por um mecanismo plausível
mas **não comprovado**: identidade forte → vínculo → volta ao app. É a aposta
já registrada em `docs/PLANO-EVOLUCAO.md`/`REGISTRO-DE-DECISOES.md`, não uma
descoberta nova desta tarefa.

## 5. Critérios de sucesso mensuráveis por simulação

Todos calculáveis hoje em `criacaoDistribuicao.test.ts` ou extensão dele,
população sintética (N≥240, seed fixa, sem RNG de calibração).

1. **Cobertura estrutural total**: 17/17 elementos do class-system, 65/65
   talentos, 11/11 profissões, 79/79 arquétipos (hoje só class-system pleno é
   medido — arquétipos plenos por estágio não têm régua de cobertura própria),
   e amostra representativa do pool do bestiário (2.000 criaturas, hoje
   "alcançável por faixa" — falta medir % do pool em N=1000+). Meta: nenhuma
   entrada com 0% de chance de aparecer em nenhum caminho.
2. **Nenhum vencedor estrutural nos 4 eixos de leitura**: elemento
   (linha de base 12,5%, hoje 10,5–17,8%), papel (linha de base 20%, hoje
   9,5–31,3% — **fora do critério**, dívida conhecida documentada), alinhamento
   (33% cada, hoje 49,5/26,8/23,8 — caminho harmonia >2× benevolência),
   reino (11%, hoje 0,5–22,5%). Meta proposta: razão topo/piso ≤2× em cada
   eixo (hoje elemento passa, papel e reino não).
3. **Diversidade de identidade visível**: % de tuplas (nome+família+elemento
   dominante mostrado) distintas em N=400 sintéticos. Já medido uma vez
   (98% vs 98%, rodada 4 de ago/2026) — vira critério de regressão contínua,
   não relatório pontual.
4. **Colisão de nome**: % de baseName duplicado em N grande. Já corrigido de
   20,5%→1,5% — meta de manutenção: nunca voltar acima de 2%.
5. **Fidelidade direcional**: respostas OPOSTAS no ritual (as 6 + os 20, cada
   um isolado) devem mover elemento/papel/alinhamento/reino em direção
   semanticamente coerente e mensurável — já existe teste "hi/lo por traço";
   vira gate obrigatório de CI, não checagem manual pós-mudança de coeficiente.
6. **Proporcionalidade por CAMINHO (harmonia/poder/benevolência)**: pedido
   explícito do dono — "cada caminho com 1/3 favorecido, 1/3 neutro, 1/3
   dificultado, ~20%". Hoje não medido como critério formal. Proposto:
   simulação cruzando alinhamento dominante × elemento dominante, checando se
   a partição de 17 elementos em 3 grupos por caminho produz o desvio ~20%
   esperado (não uniforme entre os 17 — 1/3 favorecido é DESENHADO desigual).
7. **Cobertura de linhagem/evolução**: % de transições de estágio que
   preservam família vs. cruzam (já medido: 86,8% preserva). Meta: manter
   banda 80–90% — nem 100% (preso demais, sem surpresa) nem <70% (linhagem
   sem lógica perceptível).
8. **Companheiro/classe não concentrados**: top-N de concentração (já medido:
   bestiário top-10 = 10,5%; companheiro tinha top-5 = 80% ANTES do conserto
   do Loop B — falta remedir companheiro no estado atual com o mesmo rigor
   dos outros 4). Meta: nenhuma dimensão de saída visível com top-5 >30%.

**Onde só dado real resolve** (instrumentar, não simular):
- Se o jogador de fato PERCEBE a unicidade (IUP é proxy estrutural, não
  percepção humana) — precisa de estudo com painel ou pesquisa qualitativa
  pós-reveal ("isso parece com você?").
- Se identidade forte no Oráculo de fato move retenção D1/D7 — precisa de
  dado real de uso (inexistente hoje) ou, no mínimo, A/B quando houver
  usuários.
- Se "1/3 dificultado" é percebido como injusto/arbitrário pelo jogador —
  qualitativo, não sai de simulação.

## 6. Hipóteses testáveis (causa e solução)

**H1 (causa).** A concentração de papel/reino (critério #2 fora do alvo) vem
de estrutura de medição (1 item de escolha forçada por eixo junguiano = só
0/100, nunca meio-termo) e de coeficientes calibrados assumindo variação
contínua — já diagnosticado em `ORACULO.md`. Falseável: recalibrar
`JUNG_DAMPING`/pesos de papel contra simulação que sorteia RESPOSTAS (não
traços) e remedir; se a razão não cair, a causa está em outro lugar.

**H2 (causa).** A tensão "proporcional" × "único" nasce porque as duas métricas
competem pelo MESMO espaço de saída (os 4 eixos) sem uma dimensão dedicada de
diferenciação individual. Falseável: comparar IUP antes/depois de introduzir
um sinal de diferenciação que não compete com a proporcionalidade dos eixos
(ex.: seed determinística de nome/detalhe visual derivada da identidade
completa, já parcialmente feito com `identityKey`).

**H3 (solução).** Subdividir famílias do bestiário (artrópodes, mortos-vivos…)
aumenta unicidade percebida SEM sacrificar balanceamento, porque adiciona
uma dimensão de escolha ortogonal aos 4 eixos já balanceados. Falseável:
medir IUP e critério #2 antes/depois da subdivisão — se #2 se degradar, a
subdivisão está roubando peso de um eixo já calibrado, não somando dimensão.

## 7. Sucesso e critério de saída do discovery

Discovery encerra quando existir, para os 8 critérios acima: (a) medição
atual documentada (alguns já existem, outros faltam — ver #1, #6, #8), (b)
meta numérica explícita acordada com o dono, (c) gap identificado entre atual
e meta. **Não é preciso fechar os gaps para sair do discovery** — só é preciso
saber o tamanho de cada um e ter hipótese de causa para os que estão fora do
alvo (papel, reino, caminho). Sair sem isso = construir às cegas de novo,
repetindo o padrão já visto 4 vezes no histórico do Oráculo (cada "rodada"
em `ORACULO.md` foi descoberta de um buraco não medido antes).

## 8. Menor experimento recomendado

Ordem de custo, do menor ao maior:

1. **Análise do dado sintético existente** (menor custo, já disponível) —
   estender `criacaoDistribuicao.test.ts` para cobrir os gaps de medição
   (#1 arquétipos, #6 caminho×elemento, #8 companheiro remedido). Responde:
   "a base é estruturalmente acessível e proporcional?". **Não responde**: se
   humano percebe isso, nem se isso muda retenção.
2. **Estudo com painel** (`alpha-gestor-pesquisa`) — mostrar 5-10 pares de
   resultados reais do pipeline (perfis sintéticos com identidades bem
   diferentes) para pessoas reais e perguntar "isso parece com você/com
   pessoas diferentes?". Responde: se IUP estrutural se traduz em percepção.
   **Não responde**: efeito em retenção real (sem contexto de uso contínuo).
3. **Protótipo/fake door**: fora de escopo aqui — não há hipótese de UI nova,
   é hipótese de MOTOR. Pular direto para "construir melhor o motor" seria
   o erro clássico listado no framework.

**Recomendação**: rodar (1) primeiro — é barato e fecha a lacuna de medição
que já existe hoje (critérios #1, #6, #8 sem número atual). Só then decidir
se (2) vale o custo, dado que não há usuários reais para validar retenção de
qualquer forma — o ROI de pesquisa com painel antes de ter tráfego é discutível
e é **decisão do dono**.

## 9. Caminhos alternativos (obrigatório, mesmo sem pedido)

- **Sem hora de nascimento / fora da lista de cidades**: já degrada
  explicitamente (Ascendente/casas desligados) — mantém-se, mas os critérios
  de proporcionalidade acima precisam ser remedidos também SOB essa degradação
  (perfil sem ascendente pode concentrar diferente).
  `[gap de medição: não coberto na simulação atual]`.
- **Só as 6 perguntas (sem os 20 itens)**: já tem coluna própria na tabela de
  ago/2026 — mantém-se como segmento de medição separado, nunca fundido com
  "6+20" numa média que esconderia o pior caso.
  `[fato: já medido, ver ORACULO.md]`.
- **Nome sem letra latina / data inválida**: já tem fallback determinístico
  (hash) documentado como P0 corrigido — mas não está nos 8 critérios de
  proporcionalidade acima. `[gap: adicionar ao conjunto de perfis sintéticos]`.
- **Reroll**: identidade determinística (`identityKey`) mantém ficha/skills/
  linhagem estáveis, só a criatura e a inspiração mudam. Os critérios de
  unicidade (#3, #4) precisam contar reroll como evento distinto, não como
  ruído — hoje não está claro se a simulação isola isso.
  `[gap de medição]`.
- **Rebirth**: multiplicador de orçamento (1.5×) muda a distribuição da ficha
  — os critérios de proporcionalidade (#1, #2) não são remedidos pós-rebirth.
  `[gap de medição]`.
- **Dado parcial** (usuário sai do ritual pela metade): já tratado fora do
  Oráculo (convite de unlock na página de Evolução) — não é escopo deste
  GOAL, mas confirma que "criação incompleta" tem tratamento de produto e
  não deveria também precisar de tratamento no motor de distribuição.

## 10. Tensões entre pedidos do dono — e como resolver cada uma

**T1. "Proporcional" (todo elemento com chance igual/plausível) × "resultado
dos dados do user" (o resultado deve refletir quem a pessoa É, não sortear
uniforme).**
Essas duas coisas competem de verdade: se o resultado for 100% fiel aos
dados, pessoas parecidas (mesmo Big Five alto em X) vão convergir para o
mesmo elemento — e isso é CORRETO do ponto de vista de "reflete quem você é",
mas pode violar proporcionalidade se a população real for enviesada (ex.: mais
gente extrovertida que introvertida responde o teste).
- **Resolução recomendada**: proporcionalidade é sobre a FUNÇÃO (o motor não
  pode ter um elemento estruturalmente inacessível ou dominante por bug de
  fórmula — isso já está sendo corrigido, ver H1), não sobre a POPULAÇÃO
  (se todo mundo que responde for parecido, o motor pode legitimamente
  convergir). O critério #2 mede a função contra POPULAÇÃO SINTÉTICA UNIFORME
  de propósito — é o jeito certo de isolar "o motor distorce" de "as pessoas
  reais são parecidas". Já é a abordagem em uso; só falta fechar os gaps de
  papel/reino.

**T2. "Único" × "proporcional".**
Se todo elemento tem que ter chance igual E o resultado tem que ser
"resultado dos dados", com só 4 eixos discretos (17 elementos × 6 escolas ×
5 papéis × 9 reinos) o espaço de combinações é finito e ~2 perfis parecidos
colidem estruturalmente — proporcionalidade nos eixos não garante unicidade
percebida na SAÍDA (nome, visual, bio).
- **Resolução recomendada**: unicidade não deveria depender só dos 4 eixos
  (que DEVEM ser proporcionais e portanto grosseiros) — deveria vir de uma
  camada adicional derivada da identidade completa (nome, data, hora, cidade —
  já usada parcialmente via `identityKey`/hash para nome e linhagem). Os 4
  eixos decidem "que TIPO de criatura", a camada de identidade decide "qual
  VARIANTE dentro do tipo" — mantendo os dois objetivos sem trade-off direto.
  Já é parcialmente o desenho (H2); recomenda-se tornar isso explícito como
  princípio de arquitetura, não só acidente de implementação.

**T3. "Subdividir famílias" × "chances proporcionais".**
Mais famílias = mais dimensões a balancear = risco real de reabrir os buracos
que #2 já fechou (é o padrão histórico: toda vez que o pool/dimensões
cresceram, algo ficou inacessível — ver "Reino" 16,5%→0,5% quando o motor
mudou).
- **Resolução recomendada**: subdivisão de família deve ser tratada como
  mudança de escopo que EXIGE remedição completa de todos os 8 critérios antes
  de mergear — não como adição incremental de conteúdo. H3 acima formaliza
  isso como hipótese falseável.

**T4. "Melhor instrumento possível" × app que não cobra e não pune.**
Um instrumento "o melhor possível" tende, na indústria de psicometria, a
significar mais preciso/mais itens/mais validado — mas o princípio do produto
(CLAUDE.md) é que o teste de 20 itens **não é validado** e existe para sabor
narrativo, não para diagnóstico. "Melhor" aqui não pode significar "mais
clínico" sem contradizer a limitação já documentada e aceita.
- **Resolução recomendada**: "melhor instrumento" = melhor para o PROPÓSITO
  do app (unicidade percebida + proporcionalidade + não cobrar), não melhor
  psicometricamente em abstrato. Vale registrar essa leitura com o dono
  explicitamente, porque "o melhor instrumento possível" é ambíguo o
  suficiente para puxar a squad para validação psicométrica fora de escopo.

## 11. O que é decisão do dono (não descoberta)

- Meta numérica exata de cada um dos 8 critérios (proposto aqui como ponto de
  partida — ex. "razão topo/piso ≤2×" — mas é corte de produto, não fato).
- Se vale investir em (2) estudo com painel ANTES de ter usuários reais em
  produção (ROI discutível, ver §8).
- Leitura de T4: "melhor instrumento possível" = melhor para o propósito
  narrativo do app, não melhor psicometricamente — precisa confirmação
  explícita para não virar escopo errado.
- Se subdivisão de bestiário (T3) entra nesta rodada ou fica para depois do
  fechamento dos gaps de papel/reino (que já são dívida conhecida e mais
  antiga).
- Prioridade relativa entre fechar dívida conhecida (papel 9,5–31,3%, reino
  0,5–22,5%) vs. atender aos pedidos novos (subdivisão, proporcionalidade por
  caminho) — ambos competem pelo mesmo orçamento de coeficientes/testes.
