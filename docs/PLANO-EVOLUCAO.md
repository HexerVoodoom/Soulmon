# Plano de evolução do Soulmon — do levantamento à implementação

Documento derivado de duas rodadas de pesquisa (agosto/2026):

1. **Apps de produtividade gamificada** — Habitica, Catzy, Finch, Forest, Tamagotchis
   modernos + psicologia do engajamento (SDT, Octalysis, Fogg, loot boxes, streaks,
   accountability social).
2. **Franquias e hardware** — V-Pet Digimon (1997) e toda a linhagem até o Vital
   Bracelet, Pokémon Sleep, Pokémon GO, Palworld.

> ## A essência, que nada aqui pode quebrar
>
> O Soulmon é **um avatar do usuário que evolui junto com ele e o encoraja**.
>
> Não é um cobrador. Não é um placar. Não é um jogo que usa a vida da pessoa como
> combustível de engajamento. É uma criatura que cresce quando a pessoa cresce, e
> que fica do lado dela quando ela não consegue.
>
> Toda decisão abaixo foi filtrada por uma pergunta: *isso faz o bichinho parecer
> mais um companheiro, ou mais um chefe?* O que faz parecer chefe foi cortado ou
> invertido, mesmo quando "engajaria" mais — porque engajamento por culpa é
> exatamente o que faz as pessoas desinstalarem apps assim, e a pesquisa é
> unânime nisso.

---

## Por que estas mudanças, em uma tabela

O eixo que organizou toda a pesquisa foi **como cada produto trata a falha**. O
resultado:

| Produto | Ao falhar | Resultado |
|---|---|---|
| Pokémon Sleep | Você **não ganha**; nunca perde | US$ 234,9M em 3 anos, queda de só 3,2% no ano 3 |
| V-Pet 1997 | Erros **selecionam outro galho** de evolução | ~14M de unidades; a linha fiel segue lançando até 2027 |
| Vital Bracelet | **Estagna** ou cresce em algo indesejado | Apps encerrados, servidores offline em 2024 |
| Pokémon GO | Gentil no eixo físico, **punitivo nos streaks** | 20M ativos/semana, mas 2 crises graves por acessibilidade |
| **Soulmon (antes)** | **Perde HP**, pode zerar e degenerar num dia só | — |

O Soulmon era o único que punia por padrão. Isso é jogável para alguém em boa
fase e cruel para quem está doente, deprimido ou em crise — que é precisamente
quem não cumpre as tarefas. **Um app de produtividade que castiga quem está mal
está desenhado para funcionar melhor com quem menos precisa dele.**

A Fase 1 corrige exatamente isso, sem tirar as consequências que dão sentido ao
cuidado.

---

## Fase 1 — Proteger o usuário ✅ IMPLEMENTADA

Mudanças de regra de jogo. Todas em `src/utils/dailyReset.ts` (agora uma função
pura testada) e `src/App.tsx`.

### 1.1 Teto de perda de HP por dia — `MAX_HEARTS_LOST_PER_DAY = 1`

**Antes:** `floor((1 − feitas/meta) × maxHP)` — um dia zerado custava até 3, 4 ou
5 corações de uma vez, ou seja, **degeneração instantânea a partir de um único
dia ruim**.

**Depois:** a mesma fórmula proporcional, com teto de 1 coração por virada.

Um dia ruim vira "meu bicho está meio pra baixo", não "perdi meu bicho".
A degeneração continua existindo — mas exige uma sequência de dias, não um
tropeço. É a diferença entre um sinal e uma sentença.

### 1.2 Perdão de ausência — quem some volta para um abraço

**Antes:** o reset só roda quando `lastResetDate !== hoje`. Quem passasse 5 dias
fora levava **uma** virada — mas com zero tarefas cumpridas, ou seja, perda
máxima de HP e degeneração garantida na volta.

**Depois:** se a última virada foi há **2 dias ou mais**, não há perda de HP
nenhuma. O relatório vem em modo boas-vindas (`welcomeBack: true`, com
`daysAway`), e a energia não conta contra o dia perfeito.

> A pesquisa foi explícita: quem passa três dias fora e volta para achar um pet
> doente, degenerado e trancado fora do conteúdo **não vai se esforçar mais — vai
> desinstalar**. O Pokémon GO provou isso duas vezes, em 2021 e 2023.

### 1.3 `perfectDays` param de decrementar

**Antes:** qualquer dia não-perfeito fazia `perfectDays − 1`. Era um **streak
punitivo não documentado** — o `CLAUDE.md` sempre disse que perfectDays
acumulam.

**Depois:** `perfectDays` só sobem e só zeram ao evoluir. O código passa a fazer
o que a documentação sempre prometeu.

Alinha com o achado mais consistente da pesquisa sobre streaks: **contador que
acumula retém; contador que zera gera o "efeito de violação da abstinência"** —
quebrou um dia, desiste de vez.

### 1.4 Alívio semanal — o teto do estrago é 7 dias

Na virada de **domingo → segunda**, o pet recupera **meio coração**
(`WEEKLY_RELIEF_HEARTS = 0.5`), limitado ao máximo do estágio.

Inspirado direto no Pokémon Sleep, onde o Snorlax reinicia toda segunda: **uma
semana ruim não pode contaminar a próxima.** É o mecanismo de perdão mais barato
e mais eficaz que a pesquisa encontrou.

### 1.5 A masmorra não cobra mais da barra de cuidado

**Antes:** perder tirava 1 coração real (`healthPoints − 1`) e a entrada era
bloqueada com ≤1 coração. Efeito combinado: **quem teve uma semana ruim ficava
trancado fora do conteúdo divertido**, e cada tentativa aprofundava o buraco.

**Depois:** perder não toca no HP, e a entrada nunca é bloqueada. O que está em
jogo é a própria run — os bônus de andar, o Glitchtama e o placar.

Essa é estruturalmente a mesma decisão que custou jogadores ao Pokémon GO em
2023 (encarecimento dos Remote Raid Passes removendo conteúdo de quem tinha
menos capacidade de alcançá-lo, gerando boicote e #HearUsNiantic).

> ⚠️ **Botão de ajuste para o dono:** sem o custo em coração, farmar Bits na
> masmorra ficou mais barato. Os Bits por inimigo são pequenos e o grosso vem do
> bônus de andar (que exige vencer), então o impacto deve ser pequeno — mas se
> virar problema, **a alavanca certa é um custo de entrada em Bits, nunca o
> retorno do custo em corações.**

### 1.6 Refactor: a virada do dia virou função pura testada

O `useDailyReset.test.ts` **reimplementava** a lógica do reset em vez de
importá-la (`simulateReset`). Era o mesmo footgun de "regra copiada = regra que
diverge em silêncio" que o `CLAUDE.md` já alerta para o desktop — o teste podia
passar com o app quebrado.

Agora `computeDailyReset()` vive em `src/utils/dailyReset.ts`, o hook chama, e o
teste importa a mesma função. **As regras acima só puderam ser mudadas com
segurança por causa disso.**

### 1.7 Atribuição de sprites e IP

`docs/Attributions.md` cobria só shadcn/ui e Unsplash. Agora registra os sprites
DMC (`furudbat/wayland-vpets`) e os nomes/marcas Digimon da Bandai, com o
apontamento de que a licença precisa ser verificada antes de publicar na Play
Store.

---

## Fase 2 — O avatar que encoraja ✅ IMPLEMENTADA

O núcleo da essência. Nada aqui é mecânica de jogo: é **tom e escuta**.

| # | O quê | Onde | Por quê |
|---|---|---|---|
| 2.1 ✅ | **Onboarding pergunta o "porquê"** — duas perguntas abertas ("o que você quer melhorar?", "o que mais te atrapalha?") antes do ritual do oráculo | `SoulmonOnboarding`, `GameState` | Ponto de maior consenso entre pesquisa de mercado (Habitica, Finch) e psicologia (Goal-Setting Theory + autonomia da SDT). A razão pra mudar tem que vir da pessoa |
| 2.2 ✅ | **O pet lembra do que a pessoa disse** — a resposta do onboarding volta em pontos de decisão (relatório diário, página de evolução) | `DailyReportModal`, `EvolutionPage` | É o que transforma "app que mede" em "avatar que acompanha" |
| 2.3 ✅ | **Tom sem culpa no relatório diário** — revisar toda redação que possa soar como acusação; modo boas-vindas já existe no dado (`welcomeBack`), falta a UI | `DailyReportModal` | O elogio mais repetido ao Finch não é "é bonito", é "não me faz sentir culpado" |
| 2.4 ✅ | **Check-in de humor** curto e opcional (3–5 carinhas) | novo, junto do carinho | Elemento de menor custo e maior retorno emocional de toda a pesquisa |
| 2.5 ✅ | **Marcação retroativa** — marcar a tarefa de ontem até X horas depois da virada recupera o HP, mas **não** o dia perfeito | `careRules.ts` + UI | Retro-tracking do Pokémon Sleep: recupera o dano, não a glória |
| 2.6 ✅ | **Sugestão de tarefa mínima** no cadastro — se o usuário digitar algo grande, sugerir gentilmente a versão de 2 minutos | `taskSuggestions.ts` | Fogg: Habilidade é o gargalo, não Motivação |

---

## Fase 3 — Profundidade de jogo ✅ IMPLEMENTADA

Onde o V-Pet de 97 e o Vital Bracelet têm mais a ensinar.

| # | O quê | Por quê |
|---|---|---|
| 3.1 ✅ | **JÁ EXISTIA.** A verificação no código mostrou que a categoria da tarefa já dirige o galho: tarefa concluída → comida da MESMA categoria (`FOOD_BY_CATEGORY`) → atributos daquela categoria (`CATEGORY_ATTRIBUTES`) → branch, e o `BranchForecast` já mostra a projeção. Somar atributos de novo na conclusão da tarefa só inflacionaria. A crítica da pesquisa partia de leitura incompleta | Vital Bracelet separa Vital Values (quanto) de PP/HP/AP/BP (o quê). *Se só existir "mais", o único gameplay possível é grind* |
| 3.2 ✅ | **Padrão de cuidado como seletor** — regularidade vs. rajada produzem linhagens diferentes, **nenhuma melhor que a outra** | V-Pet 97: 0 care mistakes → Agumon; 3 → Betamon. Não é castigo, é um retrato de como você cuidou |
| 3.3 ✅ | **Passiva única sorteada no nascimento** ("Guloso: comida dá +1 atributo", "Madrugador: cocô nunca antes das 10h") | Melhor retorno por esforço das duas pesquisas — um campo novo no `GameState` transforma "meu bichinho" em *o meu* bichinho |
| 3.4 ✅ | **Achatar a escada no topo** — hoje cada estágio pede mais tarefas/dia, indefinidamente. No topo o eixo deveria virar **consistência ao longo de semanas** | É o erro que fez a maioria dos donos de Vital Bracelet parar nos estágios médios |
| 3.5 ✅ | **Vitrine de coleção / dex de estados** — registro do que aquele pet já viveu, sem valor competitivo | Sleep Style Dex: colecionar a *variação*, não a nota. Antídoto contra ansiedade de performance |

---

## Fase 4 — Ritual e social ◐ PARCIAL (falta só o modo cooperativo)

O estudo do BMJ sobre Pokémon GO é inequívoco: o efeito da novidade sobre
comportamento **morre em ~6 semanas**. Depois disso, só ritual e vínculo seguram.

| # | O quê | Por quê |
|---|---|---|
| 4.1 ✅ | **Janela fixa e previsível para o Torneio** (dias, nunca horas) | Community Day é o motor de retenção do Pokémon GO, não o loop de caminhar. Janelas curtas excluem quem trabalha |
| 4.2 ✅ | **Faixas/tiers em vez de ranking global cru** | Em ambientes só-de-leaderboard, 31,3% relataram efeito psicológico negativo de comparação |
| 4.3 ⬜ | **Modo cooperativo leve** (2–4 treinadores, meta coletiva) | Cooperação tem evidência mais forte que competição para adesão a hábito. Precisa de saída limpa do grupo, sem penalidade |
| 4.4 ✅ | **Uma ação, várias barras** — concluir uma tarefa deve alimentar visivelmente energia + comida + evolução + missão numa animação só | Um km no Pokémon GO avança ovo, candy, missão e recompensa semanal ao mesmo tempo |
| 4.5 ✅ | **Auditar a carga diária** (resultado abaixo) — cocô 2×/dia + comida 5/h + carinho + banho + sono + masmorra: cabe em ~3 aberturas de app por dia? | "Cheque a cada 2h" é um segundo emprego |

---

## Fase 5 — Visual ◐ PARCIAL (falta a arte)

| # | O quê | Por quê |
|---|---|---|
| 5.1 ⬜ | **Arte real de decoração** (hoje são emoji; a estrutura de `PALCO-E-DECORACAO.md` já aceita PNG) | Maior retorno visual disponível. "Casa que cresce" é o diferencial citado do Catzy |
| 5.2 ✅ | **Tela de jornada** (vitrine no topo de Estatísticas) — registro visual persistente de estágios vividos, cenários visitados, itens obtidos | Catzy usa biomas como forma espacial do progresso; mais forte que um número subindo |
| 5.3 ✅ | **Separação visual das três moedas** (já é regra travada por teste) — manter | É a clareza que os Tamagotchis modernos não têm e que gera desconfiança |

---

## Auditoria da carga diária (4.5)

Quantas vezes o app precisa ser aberto num dia normal, hoje:

| Momento | O que acontece |
|---|---|
| Manhã | Relatório do dia anterior (1×/dia) + marcar as primeiras tarefas |
| Tarde | Cocô aparece (até 2×/dia) → banho; alimentar para subir energia |
| Noite | Fechar as tarefas do dia e completar a energia antes da virada |

**Resultado: cabe em ~3 aberturas.** Os limites que existem são de RITMO, não de
cobrança — 5 comidas/hora é uma janela deslizante generosa (encher a energia
exige 4 a 6 comidas no dia todo), o carinho é 1×/dia e o cocô é agendado, não
reativo. Nada aqui pede "cheque a cada 2 horas", que foi a queixa central do
Pokémon Sleep.

**O que vigiar:** qualquer feature nova que exija uma quarta visita programada
ao app. O Soulmon quer sessões curtas e recorrentes por meses; "o usuário passou
muito tempo no app" continua sendo antipadrão.

---

## O que ficou de fora, e por quê

Só dois itens do plano seguem abertos, e nenhum dos dois é "faltou tempo":

| Item | Por que não foi feito |
|---|---|
| **4.3 Modo cooperativo** | É a única entrada do plano que **não é implementável só no cliente**. Existe backend social (`functions/api/community.js`: perfis, amigos, presentes, ranking, partidas), mas um modo cooperativo pede endpoint novo, esquema de grupo no KV e uma decisão de moderação/abuso que é do dono. Subir superfície multiplayer nova direto em produção sem isso definido seria imprudente |
| **5.1 Arte da decoração** | **Não é código.** O contrato em `docs/PALCO-E-DECORACAO.md` pede arte desenhada PARA a caixa, em tamanho fixo por espaço e casando com o estilo dos sprites. Arte gerada fora desse contrato ficaria pior que os emoji atuais, e ainda pesaria no repositório (que versiona `dist/`) |

---

## Princípios permanentes

Fronteiras que a pesquisa validou externamente. **Não afrouxar.**

1. **Dinheiro real compra conveniência, cosmético e identidade — nunca o
   comportamento nem o perdão dele.** A Bandai errou exatamente nessa fronteira
   com os Dim Cards gateando linhagens de evolução, e pagou com o produto.
2. **Nada de conteúdo aleatório vendido.** Drops são ganhos jogando; a loja vende
   itens determinados. Se um dia vender qualquer coisa com resultado aleatório,
   publicar as probabilidades.
3. **Modernizar o atrito, nunca a dificuldade.** O que os fãs premiaram no Digimon
   COLOR foi USB-C, backup e treino mais rápido — com zero afrouxamento das
   condições de evolução. Eles não pediram menos dificuldade; pediram menos
   incômodo.
4. **O jogo continua íntegro com o backend morto.** Nenhuma mecânica de
   progressão pode exigir rede. A regra do `?? padrão` no load é a versão certa
   disso.
5. **Regras explicadas, resultados surpreendentes.** Diga que existem galhos e o
   que os influencia; não entregue a tabela completa.
6. **O sinal do Soulmon é declarado, não inferido.** "O usuário marcou a tarefa
   como feita" não tem erro de sensor, não discrimina corpo, não é ambíguo — é a
   maior vantagem estrutural sobre o Vital Bracelet, cujo sensor óptico falha em
   pele mais escura. **Não importar sinais inferidos** (passos, tempo de tela,
   geolocalização) só porque soam mais quantificados.
7. **"O usuário passou muito tempo no app" é antipadrão.** O Soulmon quer sessões
   curtas e recorrentes por meses. Os limites que já existem (5 comidas/h, 1
   coração/dia de carinho, drops capados, base da masmorra resetando por semana)
   não são restrições a afrouxar quando o app parecer vazio — são o que impede o
   app de ser consumido em 30 horas.

---

## Depende do dono

Itens que não posso resolver — precisam de decisão, conta ou advogado.

| Prioridade | O quê | Contexto |
|---|---|---|
| 🔴 | **Licença dos sprites DMC e uso dos nomes Digimon** | `Attributions.md` agora registra o item. Nomes (Agumon, Greymon, Angemon, Monzaemon) são marcas da Bandai; os sprites vêm de `furudbat/wayland-vpets`. O caso Nintendo × Pocketpair mostra que **IP é território muito mais forte que patente** — a Nintendo processou por patente e está perdendo, enquanto o comunicado da Pokémon Company falava de IP. Verificar antes da Play Store |
| 🟠 | **Reroll por Créditos = resultado aleatório pago com dinheiro real** | `monetization.ts:76` + `oracle.ts` usa `Math.random()`. **Atenuante forte:** todo pet gerado é mecanicamente equivalente (stats escalam por estágio, não por espécie) — é identidade, não poder. Mas a Lei 15.211/2025 (ECA Digital) está em vigor desde 17/03/2026, houve condenação de R$ 333M em jun/2026, e o Pokémon GO teve incubadoras removidas no Brasil. Pode bastar deixar explícito na tela que todos os resultados são equivalentes. **Não é aconselhamento jurídico** |
| 🟠 | **Cura instantânea por Créditos** | É pagar para pular o cuidado — a mesma crítica que Kotaku e Digital Trends fizeram ao Premium Pass do Pokémon Sleep. Sugestão: reposicionar como perdão pontual com teto, não substituto rotineiro do carinho. É decisão de produto/receita, não técnica |

---

## Como validar a Fase 1

```bash
npx tsc --noEmit     # limpo
npx vitest run       # todos passando, incluindo os novos casos de perdão
npm run build        # dist/ é commitado
```

Os testes novos em `src/hooks/useDailyReset.test.ts` travam cada regra desta
fase. Se algum deles cair no futuro, a resposta certa é revisar a mudança — não
afrouxar o teste. Eles existem porque **o custo de errar aqui é cobrado da pessoa
que estava mal justamente no dia em que ela estava mal.**
