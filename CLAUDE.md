# Soulmon — Guia para agentes

App de produtividade gamificado (bichinho virtual, gênero v-pet).
React 18 + TypeScript + Vite 6 (web), Capacitor 8.4 (APK Android) e um overlay
Electron separado (`desktop/`). UI/textos do app em PT-BR e EN (sempre os dois,
via `language === 'pt-BR'`).

> O Soulmon nasceu de um **fork do DigiApp** e ainda divide infraestrutura com
> ele (URL de produção, namespace KV, projeto Firebase). O inventário do que é
> compartilhado, o risco de cada item e a ordem segura de separar estão em
> `docs/SEPARACAO-DIGIAPP.md` — leia antes de mexer em qualquer coisa de
> deploy. É por isso que sobram nomes com "digiapp" pelo código: alguns são
> herança cosmética, outros (o binding `DIGIAPP_SAVES`, as chaves de
> localStorage) são mantidos **de propósito**, porque renomear quebraria o
> save de quem já joga.

> **`docs/PLANO-EVOLUCAO.md`** traz o benchmark de agosto/2026 (Habitica, Finch,
> Catzy, Forest, V-Pet/Vital Bracelet, Pokémon Sleep/GO, Palworld + psicologia do
> engajamento) e o plano em fases que saiu dele. A **essência declarada** está lá e
> rege as decisões de regra: o Soulmon é um avatar que evolui COM o usuário e o
> encoraja — nunca um cobrador.

> **`docs/STATUS.md` é o registro vivo do projeto**: achados de segurança em
> aberto, o que já foi corrigido e a lista do que depende do dono. Leia no
> começo da sessão e **atualize ao terminar qualquer coisa relevante**.

## Comandos (rode ANTES de todo commit)

```bash
npx tsc --noEmit     # typecheck — deve sair limpo (exit 0)
npx vitest run       # testes — todos devem passar
npm run build        # vite build + conversão PNG→WebP (dist/ é commitado!)
```

## Deploy

Repositório: `HexerVoodoom/Soulmon`.

- **Fluxo**: desenvolva na branch de trabalho combinada na sessão → commit →
  push → merge **ff-only** em `main` → push da `main` → volte para a branch de
  trabalho. (Não existem `version-b` nem `claude/digiapp-code-improvements-*`
  aqui — eram do DigiApp.)
- **Regra de autonomia — vale para toda sessão, sem exceção**: quando o
  trabalho estiver pronto (`tsc`/`vitest`/`build` limpos), abra o PR e **faça
  o merge na hora**, sem perguntar e sem esperar aprovação do dono. Não crie
  loop de "check-in" (`send_later`/trigger reagendando de hora em hora só pra
  reverificar CI/mergeabilidade) — isso já aconteceu antes e virou dezenas de
  agendamentos que nunca mergeavam nada sozinhos. Se o CI ainda estiver
  rodando, espere UMA vez o resultado e mergeie; não fique num loop
  observando. A única exceção legítima para NÃO mergear é um bloqueio real e
  documentado (algo que só o dono pode decidir/fazer, tipo os itens
  "depende do dono" do `docs/STATUS.md`) — nesse caso avise o dono **uma
  única vez** em vez de ficar reagendando checagens silenciosas.
- `main` é a branch de produção do **Cloudflare Pages**; o push publica sozinho
  em ~2 min. `dist/` **é commitado** (o CF também builda, mas o commit é o que
  garante o conteúdo).
- ⚠️ A URL de produção ainda é a do DigiApp (`digiapp-a5e.pages.dev`), apontada
  em `capacitor.config.json > server.url`, `desktop/renderer/src/config.ts` e
  `desktop/electron/main.js`. **Não troque isso sozinho**: só depois que
  existir um projeto Pages próprio com TODAS as variáveis reconfiguradas
  (passo 1 de `docs/SEPARACAO-DIGIAPP.md`) — trocar antes derruba o app.
- O **APK carrega a URL de produção**, então mudança web NÃO precisa de APK
  novo. Só mudanças em `android/` precisam — o GitHub Actions
  (`android-build.yml`) builda no push e o artefato fica em
  `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`. O app Electron tem o
  próprio workflow (`desktop-build.yml`).
- O worker de push (`workers/`) **não** é uma Pages Function: não builda no
  push da `main`. Deploy manual com `wrangler deploy` dentro de `workers/`.
- Ao mudar assets estáticos/HTML de forma incompatível, **bump `CACHE_VERSION`**
  em `public/sw.js` (v24 atual) — senão usuários ficam presos em cache velho.

## Regras do jogo (fonte da verdade — NÃO reinventar)

| Sistema | Regra |
|---|---|
| ❤️ Corações (HP) | Perde na virada do dia: `min(floor((1 − feitas/meta) × maxHP), MAX_HEARTS_LOST_PER_DAY)`, onde meta = `dailyGoalFor` = `min(PESO cadastrado no dia, requisito do estágio)`. **"Feitas" e "cadastradas" são PESO DE ESFORÇO, não contagem de itens** (hábito = `HABIT_WEIGHT` = 1; tarefa = seu `effort` 1–3; `someday`/`dropped` não entram). Os dois lados da razão usam a MESMA unidade — se o feito contasse itens e a meta contasse esforço, uma tarefa de projeto pediria 3 e entregaria 1, cobrando coração de quem fez 100%. Cumpriu o requisito (ou fez tudo que cadastrou) = não perde. **Teto de 1 coração por dia** — um dia ruim é um sinal, não uma sentença. **Ausência ≥2 dias não cobra nada** (`ABSENCE_FORGIVENESS_DAYS`): quem volta encontra saudade, não fatura. **Segunda-feira devolve 0.5** (`WEEKLY_RELIEF_HEARTS`) — o teto do estrago é 7 dias. HP aceita frações de 0.5. HP 0 → degeneração. |
| 🫶 Carinho | Cura principal de HP. Esfregar o pet (pointer drag): ~2s = +0.5 coração, **máx. 1 coração/dia** (`RUB_HEAL_DAY` no localStorage). Animação (explosão de corações) sempre toca. Alternativa: item **Coraçãozinho** (`💗`, comprado na loja ou dropado na masmorra) cura +1 coração ao ser usado na pastinha. |
| 🍎 Comida | Máx. **`MAX_STAGE_REQUIREMENT` por hora** (hoje **6**; janela deslizante, `FOOD_FEED_TIMES`). O teto é **derivado** do maior requisito diário da escada (`FORM_REQUIREMENTS`), nunca um literal: era 5 contra um mega que precisa de 6 barras, e quem fechava as 6 tarefas numa sessão só não conseguia dar a 6ª comida — dia perfeito negado a quem fez 100%. Dá +1 energia + pontos de atributo (vírus/dado/vacina → galho de evolução). NÃO cura HP. Recusa = pet fala que está cheio (sem toast). Ganha-se comida completando atividades. Chips/coraçõezinhos NÃO contam nesse limite. |
| ⚡ Energia | Enche só comendo, zera todo dia. **Barras de energia = requisito de tarefas do estágio** (`getMaxEnergyForStage` = `FORM_REQUIREMENTS.required`; ex.: rookie precisa de 4 tarefas → 4 barras). **Condição do dia perfeito: energia ≥ META DO DIA** (`dailyGoalFor`, hoje ponderada por esforço), e não ≥ requisito cru — comida vem de concluir tarefa, então num dia de meta 2 a energia máxima ALCANÇÁVEL é 2; cobrar 6 ali negava o dia perfeito a quem fez 100% da própria meta. As barras exibidas continuam sendo o requisito do estágio. |
| ✨ Traço de nascimento | `utils/passives.ts`: todo pet nasce com UM traço sorteado (`petPassive` no GameState), visível em Estatísticas. **Todos são positivos** — traço negativo puniria por um dado que o jogador não jogou; a variedade é em ESPÉCIE, não em força (há teste travando). Guloso (+1 atributo/comida) · Carinhoso (carinho cura até 1,5/dia) · Teimoso (perde só 0,5 coração no dia ruim) · Sortudo (+5pp de coraçãozinho na masmorra) · Madrugador (cocô só a partir das 10h). Os efeitos são lidos **do estado**, nunca por parâmetro novo — é o que faz o desktop herdar sem uma segunda implementação. |
| 🧭 O "porquê" do usuário | `soulGoal` e `soulStruggle`: duas perguntas abertas no onboarding, **antes de qualquer mecânica de jogo** (passos `GOAL_STEP`/`STRUGGLE_STEP`, ids negativos como `DEMO_PICK`, para não renumerar o ritual). Ambas puláveis — obrigar a escrever antes de ver o app é o jeito mais rápido de perder alguém. O `DailyReportModal` devolve o objetivo em dias perfeitos e no retorno. A página de Evolução mostra o **galho previsto** e, no empate, que é o ritmo que decide. |
| ⭐ Dia perfeito | `peso feito ≥ dailyGoalFor && ≥1 cadastrada && energia ≥ dailyGoalFor` — **a MESMA meta nos dois eixos**, e a meta é **ponderada por esforço** (ver ❤️ acima): hábito pesa 1, tarefa pesa o próprio `effort` 1–3 → +1 ponto de evolução (perfectDays). Mesma meta da regra de HP. Retrocompatível por construção: `normalizeEffort` devolve 1 para item sem o campo, então em save antigo peso == contagem. Item **🌀 Glitchtama** (recompensa por concluir os 5 andares da masmorra) dá +1 perfectDay ao ser usado na pastinha. |
| 🔒 Cadeado de evolução | Na página de Evolução, tocar na criatura ATUAL alterna `evolutionLocked`. Travado: a evolução da virada de dia NÃO acontece (perfectDays seguem acumulando; degeneração por HP 0 continua valendo). Destravado: evolui na próxima virada (o critério já cumprido dispara). |
| 💩 Cocô | Até 2×/dia: 1º agendado 07–15h; 2º agendado 8–10h após o 1º APARECER. Nunca aparece dormindo. Não limpo = **−1 coração a cada 6h** (`poopPenaltyClockAt`; pausa dormindo; banho zera). Notificação ~30min antes do tick. Ovo/baby-i isentos. |
| 🚿 Banho | Sempre disponível. Limpa o cocô (para o dreno). |
| 💤 Dormir | Toggle manual (persistido) + sono automático opcional (janela nas Configurações; age só nas transições). Dormindo: sem cocô, dreno pausado. |
| 📊 Relatório diário | Escrito no reset (`lastDayReport` no GameState), mostrado 1×/dia (`DAILY_REPORT_SHOWN`). |
| 💠 Bits (moeda) | Moeda dos minijogos = `gamePoints` no GameState (nome do campo mantido). Exibida **sem ícone**, só o número + "Bits" em **fonte de calculadora** (`utils/currencies.ts` → `bitsStyle` retrô / `bitsStyleLight` tema claro). Ganhos: Dino floor(score/100) · PPT 5/vitória · Masmorra (Bits/inimigo + bônus de andar **escalado**: `10+5×(andar−1)` = 10/15/20/25/30). Gasta na loja comum. |
| 😊 Check-in de humor | `utils/mood.ts`: 5 carinhas dentro do relatório diário (que já aparece 1×/dia, então não custa uma abertura a mais do app). **Opcional, e NUNCA alimenta pontuação** — não entra em dia perfeito, HP nem evolução; há teste rodando a virada com e sem humor ruim e exigindo resultado idêntico. Se virasse insumo de score, a pessoa responderia o que rende ponto em vez do que sente. O app **devolve** um resumo dos últimos dias — coletar e não devolver é extração. |
| 🌿 Ritmo de cuidado | `utils/carePattern.ts`: lê o histórico de conclusões (tarefas avulsas em `completedTasks` **+ atividades recorrentes em `activityLog`**, teto de 90 — sem o log, o ritmo ficava cego justamente para o mecanismo principal de hábito) e classifica em Constante / Explosivo / Equilibrado. Entra como **critério de desempate** do galho na evolução manual — os atributos (que vêm da categoria da tarefa) continuam mandando; o ritmo só decide no empate, que antes caía numa ordem fixa sem significado. É a ideia dos *care mistakes* do v-pet de 97: o jeito como você cuidou define quem seu bicho vira, e **nenhum ritmo é melhor que outro** (teste exige que os três puxem galhos distintos). Com pouco histórico a leitura se declara não-confiável e não desempata. |
| 🎪 Rodada do Torneio | `utils/tournamentSeason.ts`: sexta a domingo, toda semana. É **ritual, não tranca** — fora da janela o Torneio segue inteiro disponível. Janela de DIAS, nunca de horas (evento de 3h exclui quem trabalha). Faixas em `utils/tournamentTiers.ts` (Semente→Broto→Guardião→Ancião→Lendário) aparecem **antes** do ranking global: posição absoluta é a leitura associada a comparação tóxica, e a faixa mede o jogador contra ele mesmo — teste garante que acumular pontos nunca rebaixa. |
| 🎖️ Emblemas | Moeda do **Torneio** = `emblems` no GameState. Ganha por partida: 3 vitória / 1 derrota (`EMBLEMS_PER_WIN`/`_LOSS`). Compra **só** os itens de `TOURNAMENT_ITEMS`, na aba Torneio da loja — hoje 6, escada 15/20/25/40/55/70 (≈5 a 23 vitórias): Estandarte 🎌, Mural de Medalhas 🏅, Estante de Troféus 🏆, Arena dos Campeões (cenário), Pódio 🥇, Arena sob Holofotes (cenário). Estante e Pódio ocupam o espaço `trophy` do palco e **exibem os troféus de season realmente ganhos** (🥇🥈🥉). Dourado, fonte com serifa — não pode ser confundida com as outras. **Tudo na aba é COSMÉTICO (`bg`/`furniture`) e isso é regra**: Emblemas ficam no save do cliente (farmáveis por quem editar o localStorage), o que só é aceitável enquanto não comprarem vantagem — se um dia comprarem, têm que ir pro servidor junto dos Créditos. Há teste travando. |
| 💎 Créditos | Comprados com **DINHEIRO REAL**; vivem no servidor (`ent:<saveId>`), nunca no save do cliente. Gastam em reroll (50), cura instantânea (10) e **troca por Bits** (1 Crédito = 10 Bits, `BITS_EXCHANGE`). São a **ÚNICA** moeda que libera gerar o pet próprio (via `accountTier:'paid'`, que só uma compra verificada concede). **Não existe Bits→Créditos** — permitir farmar créditos anularia a exclusividade do dinheiro real. |
| ⚔️ Masmorra | `utils/dungeon.ts`: uma **run = 5 andares** (`MAX_FLOORS`); cada andar = escada de **6 inimigos aleatórios** subindo os tiers em ordem (baby-i→baby-ii→rookie→champion→ultimate→mega, via `LADDER_TIERS`; roster = as **6 linhas próprias** de `DUNGEON_LINE_SPRITES` (`utils/sprites.ts`), sorteadas por tier; `getDungeonEnemySprite(tier, petStage)` tira do sorteio a linha que o jogador está usando, pra ninguém encarar um espelho de si mesmo). Dificuldade do andar F = **base + (F−1)** (`buildDungeonWave(level)`; ~1 tier de jogador por nível → andar 1 serve rookie, andar 2 champion, etc.). Cada andar tem **cenário retrô** (`utils/dungeonScenes.ts`: Tamagotchi/VHS/Sol Neon/CRT/Glitch + overlay VHS `dungeon-vhs`). HP do jogador carrega entre andares (+25% de cura ao limpar). **Concluir os 5 andares** sobe a base (`setDungeonDifficultyAtLeast(base+1)`); base **persiste e reseta toda SEMANA** (`DUNGEON_DIFFICULTY` = `{week,level}`). **Sem limite diário e SEM gate de entrada**: perder **não custa coração nenhum** — o que está em jogo é a run (bônus de andar, Glitchtama, placar). O jogo NUNCA cobra da barra que representa o cuidado que o usuário teve consigo mesmo; antes cobrava, e isso trancava fora do conteúdo justamente quem tinha tido uma semana ruim. Se farmar Bits virar problema, a alavanca é custo de ENTRADA em Bits, nunca o retorno do custo em corações. **Ranking** = melhor placar (`DUNGEON_BEST`). Drop de **coraçãozinho** MUITO raro (`💗`, 5%/inimigo, máx. 2/dia, `DUNGEON_HEART_DROPS`) — **NÃO dropa comida**. Concluir os 5 andares também dá **🌀 Glitchtama** (+1 perfectDay ao usar). Cenário de cada andar é sorteado por run (`buildRunScenes`: 5 clássicos + os 8 bgs da loja). Stats do jogador escalam com o estágio (`PLAYER_STATS`). |
| 🛒 Loja | Na página Atividades (`ShopModal`, estética 8-bit). Catálogo em `utils/shop.ts` (preços em 🪙 Bits): **chips** de atributo (120) — NÃO aplicam na hora, vão pra **pastinha de itens** (`foodInventory`, emoji 🦠/💾/💉); ao USAR dão +3 no atributo e **nada mais** (sem energia) · **coraçãozinho** (`💗`, 150) — vai pra pastinha, cura +1 HP ao usar  · **decoração** (100–140) que ocupa espaços do palco (ver `docs/PALCO-E-DECORACAO.md`) — interiores (sofá/poltrona/estante/luminária/tapete), exteriores (fogueira/barraca/pedra) e quadro/planta que servem em qualquer cenário · cenários CSS (150–250, 11 à venda — `utils/backgrounds.ts`). **Loja em ABAS** (Itens/Cenários/Mobílias/**Torneio**/Missões — a de Torneio cobra em Emblemas, `TOURNAMENT_ITEMS`). Itens podem ter `unlock` (`utils/shop.ts`): aparecem escurecidos com 🔒 e toque mostra a dica de desbloqueio (`mission`). **Glitchtama NUNCA é vendido** (só na masmorra). **Missões** (`utils/missions.ts`, aba na loja): 6 objetivos permanentes (evoluir a champion/mega via `unlockedEvolutions`, 100 kills/3 runs na masmorra, 1000 no Dino, 30 dias perfeitos TOTAIS) → LIBERAM A COMPRA dos 6 cenários exclusivos `bg-mission-*` (300 cada; fora do sorteio da masmorra); contadores lifetime no GameState (`dungeonKills`, `dungeonRunsCompleted`, `dinoBest`, `totalPerfectDays`). Consumíveis especiais em `SPECIAL_ITEMS` (distinguidos no `handleFeed`). Efeitos em `handleShopBuy`. |

### Motor de tarefas (docs/PLANO-TAREFAS.md — Fases 1 a 3)

Dois contratos, e eles não se misturam: **hábito = CONSTÂNCIA** (o valor está em
repetir) · **tarefa = EXECUÇÃO** (o valor está em terminar e sair da cabeça).

| Sistema | Regra |
|---|---|
| ⚖️ Meta ponderada | `dailyGoalFor` soma **PESO DE ESFORÇO**, nunca itens: hábito = `HABIT_WEIGHT` (1), tarefa = seu `effort` (1 rápida / 2 média / 3 projeto). Tarefas `someday`/`dropped` **não entram**. Enquanto tudo valia 1, a estratégia ótima era cadastrar cinco triviais em vez de encarar a difícil — o defeito documentado do Karma do Todoist. Dono: `types/taskModel.ts` (constantes) + `utils/dailyReset.ts` (`registeredForDay`/`dailyGoalFor`). **NÃO reescreva `Math.min(…, FORM_REQUIREMENTS[…].required)` em lugar nenhum** — há guard (`dailyGoal.contract.test.ts`). |
| 🔁 Recorrência | `Schedule` = `weekdays` (o antigo, ainda padrão de saves velhos) · `timesPerWeek` (perdão embutido: a pessoa escolhe os dias; quem julga é `weeklyProgress`, nunca o calendário) · `everyNDays` com `from: 'schedule' \| 'completion'`. **`from:'completion'` é o `every!` do Todoist e o item mais importante**: contando da CONCLUSÃO é estruturalmente impossível acumular atrasadas — sumir um mês devolve UMA ocorrência, não trinta. `normalizeSchedule` lê `weekDays[]` antigo como `{kind:'weekdays'}`; o campo antigo continua escrito porque widget Android e desktop leem ele direto. |
| 📈 Constância | **"N das últimas 7"** (`CONSTANCY_WINDOW_DAYS`), nunca streak que zera — uma falha custa ~14%, não 100%. Denominador = só os dias em que o hábito ERA DEVIDO (senão um 3x/semana apareceria como 43%). Dia protegido por escudo conta como FEITO. Hábito novo devolve ratio 1 (*progresso dotado*, Nunes & Drèze — ninguém começa em 0%). **Se alguém acrescentar um `streak` que zera, desfez a tese do produto** — há teste travando. Dono: `utils/habitRhythm.ts`. |
| 🛡️ Escudos de descanso | 1 a cada `REST_SHIELD_EARN_EVERY_DAYS` (7) dias de boa constância (`GOOD_CONSTANCY_RATIO` = 5/7), teto `REST_SHIELD_MAX` (3). **Consumidos AUTOMATICAMENTE** em `applyMissedDay` — proteção que exige lembrar de ativar antes de falhar não protege ninguém (é o defeito da Pousada do Habitica; o Streak Freeze só funcionou quando veio equipado por padrão). Idempotente por dayKey: a virada pode rodar 2× e não gasta dois escudos. Conclusão tardia NÃO devolve escudo já gasto. |
| 🚫 Never miss twice | A **primeira falha não gera nada visível**. `needsIntervention` só em `MISS_INTERVENTION_AT` (2) faltas seguidas, e aí o pet oferece uma **versão reduzida** ("hoje, só 5 minutos?") — aceitar conta como feito. Modelo do Finch; oposto exato do dano de HP do Habitica. |
| 🌳 Marcos de hábito | `HABIT_MILESTONES` = **7 / 21 / 66** dias efetivos (Lally et al. 2010, mediana real 66 — os "21 dias" são de Maxwell Maltz/1960, sobre cirurgia plástica, e não têm a ver com hábito). Tiers seed→sprout→sapling→tree, ícone evolui na lista, e `HABIT_TIER_BONUS` dá **+0/10/20/30%** de rendimento de atributo. Multiplicador **sempre ≥ 1**: esforço antigo vale MAIS, nunca menos. `milestoneReached` existe para a celebração tocar UMA vez (nada de estado de UI no save). |
| 👻 Assombrada | Tarefa ativa vencida OU parada há `HAUNTED_AFTER_DAYS` (7) dias. Esmaece + partícula escura + o pet olha; **concluir dá bônus de alívio** (comemoração maior). É a peça mais Soulmon do plano: a pilha de culpa vira loop de jogo com recompensa, em vez de vermelho de cobrança. `someday`/`dropped` **nunca** assombram. Sem `lastTouchedAt`/`createdAt` a idade é **0** — nunca assombrar em massa o backlog de quem só atualizou o app. |
| 🕒 Adiamentos | Contador visível (Sunsama, "movida 7 vezes"). `POSTPONE_NUDGE_AT` = 3 → o pet oferece **decompor / encolher / deixar pra lá**. `shrink` rebaixa o effort em 1 (piso 1) e **ZERA o contador** (a tarefa mudou; carregar a marca puniria a decisão certa). |
| 💤 Algum dia / 🌙 Deixar pra lá | `TaskStatus` = `open \| someday \| dropped`. **`someday`** é o Someday do Things 3: deliberadamente INERTE — fora da meta, não envelhece, não assombra (permissão formal para não fazer). **`dropped`** é o Won't Do do TickTick: terminal COM volta atrás (`restore`) — não é deletar (perde contexto) nem concluir (é mentira). É essa saída que quebra o ciclo de **falência periódica** (apagar tudo e recomeçar), o padrão de uso dominante do mercado. |
| 🎯 Foco do dia | `MAX_DAILY_FOCUS` = **3**, e o número é a mecânica (Sunsama sem os 20 min). Escolhidos no check-in; as 3 completas = selo do dia. `focusComplete` também olha `completedTasks` (porque `completeTask` remove a tarefa de `tasks`). Sem foco escolhido → `false`: não existe selo por omissão. |
| ⚠️ Carga do dia | `plannedEffort` (ponderado) vs `OVERCOMMIT_EFFORT` (7) → `isOvercommitted`. **É AVISO, NUNCA BLOQUEIO** — não impede marcar foco, não recusa criar tarefa, não reagenda nada. O Motion é odiado por decidir no lugar do usuário. Se alguém quiser barrar uma ação com isso, o certo é mudar o TEXTO, não a permissão. |
| 🧹 Arrumar a pilha | `triageQueue`: tudo atrasado/assombrado, ordenado (vencidas primeiro, mais antiga antes; depois as paradas, da mais parada; desempate por `id` para a fila não trocar de ordem entre renders). UI = fila de cartas com 4 ações grandes (hoje / esta semana / algum dia / deixar pra lá). Terminar rende recompensa: planejar é o que alivia (Masicampo & Baumeister), mais que concluir. |
| 🛏️ Janela de Descanso | O usuário escolhe a PRÓPRIA janela (`DEFAULT_REST_WINDOW` 23:00–07:00, tolerância `REST_WINDOW_GRACE_MIN` = 45 min no INÍCIO). **Premia o COMPORTAMENTO (deitar no horário), nunca o RESULTADO (dormir bem)** — premiar resultado é a definição operacional de como se fabrica ortossonia (3–14% da população; ~23% dos usuários de 18–35 anos relatam estresse com apps de sono). Média móvel de `REST_WINDOW_DAYS` (7); **noite sem registro é NEUTRA**, sai do denominador (mata o exploit de forjar sono do Pokémon Sleep). **Sem score de sono, sem punição, nenhuma função devolve número que diminui** (há teste). Feedback só de MANHÃ; o único push possível é o de DEITAR (`sleepReminderAt`, 30 min antes). `hideMetrics` esconde números e **preserva as recompensas**. **Sem sensor nenhum** — roda igual na PWA e no APK. |
| 🌠 Sonhos | 18 no `DREAM_CATALOG` (common/rare/legendary), o Sleep Style Dex do Soulmon: cada noite na janela rende uma cena colecionável do pet. **Raridade vem da REGULARIDADE, nunca da duração**; piso `common` — pouca regularidade rende menos prêmio, jamais castigo. `rollDream` é determinístico por seed e prefere sonho ainda não coletado. `dexProgress` só cresce: barra de coleção, não de desempenho. |
| ☀️🌆📅 Rituais | **Check-in** (`needsCheckIn`, 1×/dia civil, sem janela de horário — "matinal" é convite, não tranca): hábitos do dia + até 3 focos + humor, com as **pendências de ontem primeiro** (Shutdown do Sunsama invertido: a dívida nunca fica invisível). **Relatório semanal** (domingo, checado por SEMANA e não por dia): constância por hábito, melhor hábito, categoria dominante, `effortDone` (esforço, não contagem), sonhos + `stackingSuggestion` — que devolve **`null` sem dados suficientes**, e esse silêncio é a metade importante (conselho desacreditado não volta a ser acreditado). Tudo DESCRIÇÃO, nunca veredito. |
| 🌱 Fresh start | Toda **segunda ou dia 1** (Dai, Milkman & Riis). **NUNCA apaga progresso**: evolução, `perfectDays`, `habitRhythms`/`totalDone` (os marcos) e `rest.dreams` ficam 100% intactos — `applyFreshStart` sequer toca neles, e há teste travando. Limpa só a COBRANÇA: zera `postponedCount` das ativas. Recomeço não é amnésia, é perdão — e a regra geral vale: perda só sobre item recuperável (moedas, escudos), **nunca** sobre identidade ou progresso acumulado. |

**Nunca**, nesta área: Google Fit; punição por sono ruim; score de sono na home;
streak que zera; recompensa por contagem de tarefas.

Estágios/HP máx: rookie/champion/ultimate=3 · mega=4 · ultra=5. (A árvore **nasce direto em rookie** — não existem mais ovo/baby; ver `src/types/progression.ts`.) A evolução é **MANUAL** (`MANUAL_EVOLUTION = true`): a virada do dia nunca evolui sozinha, quem dispara é o jogador na cerimônia. `perfectDays` **só acumulam** — dia não-perfeito não tira nada.

> **As três moedas nunca se misturam visualmente.** Bits e Créditos já
> apareceram com o mesmo ícone 💎 e o jogador não tinha como saber que os
> créditos que pagou não compram nada na loja. Modelo e estilos em
> `src/utils/currencies.ts`; há testes travando as fronteiras.


## Arquitetura

- `src/App.tsx` (~1500 linhas) — orquestra tudo: handlers (feed/pet/shower/sleep),
  efeitos de jogo (dreno de cocô, sono automático, relatório), navegação de páginas.
- `src/contexts/GameStateContext.tsx` — `GameState` + persistência: todo setGameState
  grava no localStorage (`digiapp_state_v3`) e agenda cloud save (3s debounce).
  **Cuidado**: qualquer efeito que grave estado em timer vira spam de cloud save —
  throttle (ex.: relógio do cocô dormindo só grava a cada ≥5min).
- Cloud save: `src/utils/cloudSave.ts` → `functions/api/save.js` (Cloudflare KV
  `DIGIAPP_SAVES`). saveId = SHA-256 do e-mail (mesmo e-mail = mesmo save).
  Campos novos sincronizam sozinhos; no load use fallback `?? padrão` SEMPRE.
- `src/hooks/useDailyReset.ts` — só agenda o check da virada (a cada 30s). NÃO reintroduzir
  ticker de 1s (re-renderizava o app inteiro). **A regra em si vive em
  `src/utils/dailyReset.ts` → `computeDailyReset()`, função PURA que o hook chama
  E o teste importa.** Era duplicada no teste (`simulateReset`), que por isso
  passava afirmando uma evolução automática que `MANUAL_EVOLUTION` impede — o
  footgun de "regra copiada" do item 9, dentro do próprio teste. Não recrie a cópia.
- `src/hooks/useCareSystem.ts` — agendamento/polling do cocô (10s).
- `src/components/CompanionHUD.tsx` — área do pet: sprites, gesto de esfregar,
  falas (idle a cada 3min chama `/api/chat` — Groq; TEM guard de `document.hidden`).
- `src/utils/storageKeys.ts` — TODAS as chaves de localStorage passam por aqui.
- IA: `functions/api/chat.js` (Groq llama-3.1-8b-instant, personalidade via aiSettings).
- Push: **dois canais**, mesma KV (`PUSH_SUBSCRIPTIONS`), mesmo cron
  (`workers/push-scheduler.js`, deploy manual via `wrangler deploy` dentro de
  `workers/` — NÃO é uma Pages Function, não builda sozinho no push do main).
  **Web Push VAPID** (browser/PWA instalado, e também funciona dentro do
  WebView do Capacitor — `PushManager` é suportado): `functions/api/subscribe.js`
  + `public/sw.js` + `workers/webpush.js` (chaves `push:*`). **FCM** (canal
  nativo extra, só no app Android): `functions/api/fcm-subscribe.js` +
  `src/utils/notifications.ts` (`registerForPushNotifications`, via
  `@capacitor/push-notifications`) + `workers/fcm.js` (chaves `fcm:*`,
  autentica com `FIREBASE_SERVICE_ACCOUNT` — secret do wrangler, baixe em
  Firebase Console → Configurações do projeto → Contas de serviço). Exige
  `android/app/google-services.json` (commitado; API key restrita por pacote,
  não é segredo) e canal `digiapp_push` criado em `MainActivity.java`.
  **Histórico:** o FCM já foi implementado e depois revertido uma vez (commit
  `056a6b06`) com a tese de que o Web Push sozinho já é entregue de forma
  confiável mesmo com o app fechado (o WebView delega ao FCM por baixo dos
  panos, de forma transparente). Foi reintroduzido de propósito para o
  lançamento na Play Store — FCM nativo tem tratamento mais confiável contra
  Doze/otimização de bateria em ROMs de fabricante (MIUI, EMUI etc.) do que uma
  subscription de Web Push crua, e dá visibilidade de entrega pelo Firebase
  Console. Web Push continua ativo (cobre PWA/desktop); os dois convivem.
- Widgets Android: `android/.../widget/WidgetRenderer.kt` + layouts. Dados via
  `DigiWidgetPlugin` (SharedPreferences). Testes: `npx vitest run` cobre lógica de reset.
- **Desktop (`desktop/`)**: app Electron separado — o pet anda numa faixa
  transparente na barra de tarefas do Windows. Build próprio
  (`npx vite build -c desktop/vite.config.ts`), `package.json` próprio, NÃO
  entra no bundle do app web. É um **controle remoto** do app: lê e escreve o
  save por `/api/save` (carinho, comida e marcar tarefa) e se autentica pela
  janela do app web (`auth-preload.js`). Criar/editar tarefa e todo o resto é
  só no app. Ver `desktop/README.md` e `docs/PLANO-DESKTOP-STEAM.md`.
- **Motor de tarefas (`docs/PLANO-TAREFAS.md`)** — cinco módulos novos, todos de
  funções **PURAS** (sem React, sem localStorage, `now: Date`/`dayKey` SEMPRE por
  parâmetro) e **um dono por regra**. Quem escreve regra nova encaixa no dono
  certo; regra copiada é regra que diverge em silêncio (footgun 9):
  - `src/types/taskModel.ts` — **dono único dos tipos e de TODAS as constantes**
    (`Schedule`, `Effort`, `TaskStatus`, `HABIT_WEIGHT`, `HABIT_MILESTONES`,
    `CONSTANCY_WINDOW_DAYS`, `REST_SHIELD_*`, `MISS_INTERVENTION_AT`,
    `MAX_DAILY_FOCUS`, `OVERCOMMIT_EFFORT`, `POSTPONE_NUDGE_AT`,
    `HAUNTED_AFTER_DAYS`, `DEFAULT_REST_WINDOW`, `REST_WINDOW_*`) + as
    normalizações que impedem save antigo de quebrar (`normalizeSchedule`,
    `normalizeEffort`, `weekDaysForSchedule`). **Nenhum outro arquivo inventa
    número** — os módulos abaixo e os modais só aplicam.
  - `src/utils/habitRhythm.ts` — **constância**: `HabitRhythm` (histórico podado
    em `HISTORY_CAP` 120; `totalDone` existe para a poda não roubar marco),
    `isDueOn`, `constancy`, `earnShield`, `applyMissedDay` (escudo automático),
    `consecutiveMisses`/`needsIntervention`, `habitTier`/`attributeMultiplier`.
  - `src/utils/taskTriage.ts` — **execução**: `effortOf`/`weightOf`, `isHaunted`,
    `postpone`/`shrink`, `drop`/`restore`/`toSomeday`/`toOpen`, `setFocus`/
    `focusComplete`, `plannedEffort`/`isOvercommitted`, `triageQueue`. Genérico
    em `<T extends TriageTask>`: quem chama passa a `Task` inteira e recebe ela
    de volta, sem perder campo.
  - `src/utils/restWindow.ts` — **Janela de Descanso + Sonhos**: `isWithinWindow`,
    `recordNight`, `restConstancy`, `DREAM_CATALOG`/`dreamRarity`/`rollDream`/
    `dexProgress`, `sleepReminderAt`. **Não lê sensor nenhum** (ver a regra na
    tabela) — a única entrada é o gesto de pôr o pet para dormir que já existe.
  - `src/utils/rituals.ts` — **rituais**: `checkInPlan`/`completeCheckIn`,
    `weeklyReport`, `stackingSuggestion`, `isFreshStartDay`/`freshStartOffer`/
    `applyFreshStart`. **Não reimplementa** foco nem triagem: chama `setFocus`,
    `triageQueue`, `constancy`.
  - A **meta ponderada** continua sendo de `src/utils/dailyReset.ts`
    (`registeredForDay`/`dailyGoalFor`) — o motor novo só fornece o peso.
- **`src/utils/careRules.ts`**: regras de cuidado (alimentar, carinho, concluir
  tarefa) como funções PURAS, usadas pelo `App.tsx` **e** pelo desktop. Ao mudar
  uma dessas regras, mude AQUI — não dentro do handler do App, senão os dois
  apps divergem.
- **Dinheiro** (`functions/api/_entitlements.js` + `_billing.js`): o cliente
  nunca decide tier/créditos, e **um comprovante de compra vale para uma conta
  só** (`claimOrder`). As duas regras têm testes; se algum cair, alguém ganha
  benefício sem pagar. Ver `docs/BILLING-SETUP.md`.
- **Palco do pet** (`src/utils/petStage.ts` + `docs/PALCO-E-DECORACAO.md`): o box
  do pet é uma COMPOSIÇÃO, não um canto onde jogar ícones. Linha do chão única
  (`GROUND_Y` = 74%, exatamente onde os pés do sprite caem) e 5 espaços de
  tamanho FIXO em px (`rug`/`floor-left`/`trophy`/`floor-right`/`wall`) — a arte
  é desenhada PARA a caixa. Cada cenário declara `setting`
  (indoor/outdoor/**void** = sem decoração) + `slots` + `horizonY` (≤ GROUND_Y);
  cada decoração declara `slot` + `fits`. Espaço vazio é VAZIO (sem contorno,
  sem "+"). Item equipado que não combina com o cenário não é desenhado, mas a
  loja explica em vez de sumir em silêncio. Estado: `equippedDecor`
  (um item por espaço), migrado do antigo `equippedFurniture` no load.
- **Oráculo** (`src/utils/oracle.ts` + `src/utils/soulProfile/` +
  `docs/ORACULO.md`): tem DUAS metades. A **leitura** (soulProfile/) transforma
  quem a pessoa é em 4 eixos — elemento/papel/alinhamento/reino; a **criação**
  (oracle.ts) transforma esses eixos na criatura — arquétipo, família, fusão,
  as 11 formas, prompts de sprite. Só a leitura foi trocada: hoje ela é 20
  itens psicométricos (Big Five + Honestidade-Humildade + eixos junguianos),
  mapa astral REAL (efemérides, casas Placidus, fuso IANA com horário de verão
  histórico) e numerologia completa, no lugar do signo por faixa de datas, do
  ascendente chutado de 2 em 2 horas e das 6 perguntas do quiz antigo.
  **O ritual continua sendo as 6 perguntas** (`ORACLE_QUESTIONS`); os 20 itens
  são uma bifurcação oferecida depois delas e **antes do reveal**, declarada na
  tela como decisão SEM VOLTA (não existe caminho para responder o teste
  depois). As 6 respostas entram na leitura nos DOIS caminhos — para quem não
  faz o teste longo elas são o único sinal de personalidade que existe. O
  jogador vê só nome e descrição: pontuação de eixo e prompt de sprite vivem na
  `OraclePage`, que é ferramenta de criação e não tem entrada na navegação.
  `OracleInput.soulProfile` é opcional: sem ele o caminho legado roda inteiro,
  que é o que mantém o reroll de quem jogou antes da troca. O motor é **pesado**
  (astronomy-engine) e só entra por import DINÂMICO — o `oracle.ts` importa dele
  só tipos, e é isso que o mantém fora do bundle inicial. Os coeficientes de
  `soulProfile/axes.ts` foram calibrados por simulação para que nenhum
  elemento/papel/reino tenha vantagem estrutural: **mexer num deles sem refazer
  a simulação reabre o buraco que ele fechou**. A leitura também alimenta o
  PIPELINE COMPLETO (`soulProfile/pipeline.ts`): ficha do class-system nos 5
  estágios + companheiro capturável + criatura-inspiração do bestiário → só
  então a criatura é gerada. Dados dos outros repos entram por SNAPSHOT com
  procedência (`npm run sync:oracle-data`, clones irmãos) — nunca cópia à mão.
  Cobertura travada por simulação: 17/17 elementos, 65/65 talentos, 11/11
  profissões, 32/32 criaturas do class-system, pool inteiro do bestiário. O
  nome da criatura-inspiração NUNCA entra em prompt (teste em
  `pipeline.test.ts`); o jogador vê só a linha de essência no reveal.
- **Desbloqueio no meio do jogo** (`src/components/UnlockAccountModal.tsx`): a
  compra também existe DENTRO do app, não só na tela inicial (que o usuário vê
  uma vez). `UnlockNudge` só aparece em dois lugares — ao bater o limite de
  criação do modo grátis (`CreateModal`) e na página de Evolução de quem tem
  `demoCharacterId` — e nunca abre sozinho. Depois da compra confirmada pelo
  servidor, `SoulmonOnboarding mode='upgrade'` roda o MESMO ritual do oráculo
  (sem intro/cadastro) e `handleUpgradeRevealed` troca **só a criatura**:
  estágio, atividades, Bits e histórico continuam. Se o usuário sair do ritual
  pela metade, a página de Evolução mostra o convite na variante `reveal`.

## Arte e nomes: nada de terceiro entra no bundle

O app já embarcou 74 sprites da Bandai (25 `*_dmc.png` + 49 `figma:asset/*` das
linhas Tapirmon/Veemon/Salamon) e vendia formas de evolução com nome de
personagem registrado. **Saiu tudo** — ver `docs/Attributions.md`. As regras que
ficam valendo:

- **Toda arte vem de `src/assets/soulmon/`.** `getSpriteForStage` responde
  sempre com arte nossa; save antigo com id de espécie legada cai em
  `legacySpriteForStage`, que escolhe uma das nossas linhas por hash do id
  (determinístico: o mesmo save renderiza sempre a mesma criatura).
- **`LEGACY_FORM_TIERS` (`types/progression.ts`) é só compatibilidade de save** —
  mapeia id antigo → nível, pra um save em `gaioumon` continuar mega em vez de
  virar rookie. Não é roster de nada. Não acrescente nomes ali.
- **Prompt do gerador tem DUAS variantes** (`utils/oracle.ts`, `composeSpritePrompts`):
  `imagePrompt` **cita** as referências de gênero (Digimon/Pokémon/Palworld/…)
  porque o resultado sai visivelmente melhor, e `imagePromptFallback` é o mesmo
  pedido sem citar ninguém. **Toda criação começa pela variante com referências**;
  se o provedor recusar por política de conteúdo, `functions/api/generate-sprite.js`
  refaz sozinho com o fallback (`isRefusal` decide; erro que não é recusa não
  refaz, pra não dobrar custo à toa). As duas variantes mantêm
  "Do not copy any existing franchise character" — citar inspiração não é licença
  pra devolver personagem registrado, e o sprite vai pro app de um usuário real.
  Há teste travando os dois lados (referências presentes na 1ª, ausentes no fallback).
- **Rookie/champion/ultimate/mega ficam**: vocabulário genérico do gênero.
- **Nenhum nome de criatura leva sufixo fixo tipo "-mon"** (`rookieName` etc.
  em `oracle.ts`). Prefixo de linha + sufixo mecânico é o que soletrava nomes
  reais de outra franquia (`War` + `_mon` = WarGreymon; `Omni` + `_mon` =
  Omnimon, a própria fusão dos 3 Megas — exatamente o conceito do Ultra
  aqui). Prefixos sozinhos (War/Chaos/Omega…) são genéricos e ficam; o que
  NÃO pode voltar é o sufixo fixo somado a eles.
- **`digimonName` (bridge do widget) e as chaves `digiapp_*` ficam**, pelo mesmo
  motivo de sempre: são internos, nunca aparecem pro usuário, e renomear
  quebraria o widget/save de quem já joga. O servidor de chat e de push aceita
  `petName` **e** `digimonName` justamente por causa dos APKs já instalados.

## UI: regras visuais do dono (não regredir)

- **Ícone NUNCA dentro de box** — vale no app inteiro (18/ago/2026). Nada de
  moldura, placa, chanfro ou fundo em volta de um ícone: o ícone aparece
  GRANDE e pelado (nav inferior 36px, ações do pet 42px, chat 30px). Seleção
  na nav = sublinhado ciano (uma barra não é uma caixa), nunca a placa
  preenchida antiga. Peças com moldura continuam existindo para PAINÉIS e
  BOTÕES DE TEXTO — a regra é sobre ícones.
- **A área do pet não rola para fora da tela** — `.sm-pet-sticky` (rodada 4);
  o scroll acontece só na lista de atividades abaixo dela.

## Idioma: inglês é a base, PT-BR é localização

Todo texto de UI nasce **em inglês**; o par PT-BR vem junto pelo padrão
`language === 'pt-BR' ? … : …`. O que **não** pode acontecer é string só em
português — já aconteceu em `aria-label`s de checkbox/editar e no título do push
das 22h, que chegava em PT para quem tinha escolhido inglês. `resolveLanguage`
(`utils/i18n.ts`) é o ponto único: PT só quando o aparelho é PT.

## Footguns (aprendidos a dor — não repita)

1. **`src/index.css` é o ÚNICO CSS empacotado** (Tailwind v4 pré-compilado; NÃO há
   plugin do Tailwind no Vite). Keyframes/estilos novos vão NELE (no fim).
   Não existe geração de classes: **classe utilitária que não está no index.css
   não aplica nada** (foi o bug do `bottom-2`). Para posicionamento/layout crítico,
   prefira `style={{}}` inline.
2. **RemoteViews (widgets Android)** só suporta: ImageView, TextView, ProgressBar,
   Linear/Relative/FrameLayout, ViewFlipper. `<View>` quebra o widget ("não foi
   possível carregar"). `setImageViewResource` é confiável; `setInt(…background…)` não.
3. **Build Android**: JDK 21 no CI, Kotlin jvmTarget **17**, compileOptions do app
   re-pinados para 17 DEPOIS do `apply from: 'capacitor.build.gradle'`.
4. Vários PNGs antigos em git são **0 bytes** (ex.: `partner_area.png` original era
   quebrado — o fundo do widget é vetor `pet_grid.xml`).
5. `handleX = useCallback` com deps certas — CompanionHUD é `memo()`; lambda inline
   nas props dele anula o memo.
6. Side effects NUNCA dentro de updater do setGameState (StrictMode invoca 2×).
7. O sandbox de dev **não acessa** a URL de produção (proxy 403) — teste local
   com `npx vite preview` + Playwright (`/opt/pw-browsers/chromium`, import
   `/opt/node22/lib/node_modules/playwright/index.js`, com interop CJS:
   `import pkg from …; const { chromium } = pkg;`). Dois detalhes que custam
   tempo: (a) `vite.config.ts` tem `open: true`, e sem navegador o preview
   **morre** com `spawn xdg-open ENOENT` — ponha um `xdg-open` falso no PATH;
   (b) semeie o `localStorage` com `page.addInitScript` e **não** com
   `page.evaluate` + `reload`: o app já rodou na primeira carga e sobrescreve
   o que você acabou de gravar (foi assim que um teste "passou" lendo um
   estado que não era o semeado).
8. Sprites: importados via alias `figma:asset/<hash>.png` (mapa no `vite.config.ts`)
   → arquivos reais em `src/assets/`. `assetsInlineLimit: 0` (nunca inline base64).
9. **Regra copiada = regra que diverge em silêncio.** O renderer do desktop
   reimplementa a derivação do `saveId` e as tabelas de HP/energia (é TS puro,
   não carrega o bundle do jogo). Divergir não dá erro nenhum — o overlay lê um
   save inexistente e mostra um bicho genérico. Já aconteceu: o código veio do
   DigiApp com o salt `digiapp:`. `desktop/renderer/src/cloudSync.test.ts` é o
   único lugar onde as duas cópias se encontram — se copiar mais alguma regra
   pra lá, adicione o teste de paridade junto.
10. **Dois sistemas de tema no mesmo CSS.** O app real alterna
    `[data-theme="light"|"dark"]` no `<html>` e define `--sm-*` para os dois. O
    `index.css` TAMBÉM carrega o scaffold shadcn importado do Figma
    (`--background`/`--foreground`/`.dark`), que só muda de valor sob a classe
    `.dark` — nunca aplicada por este app. Texto sem `color` próprio herda
    `body { color: var(--foreground) }`, que fica PRESO no valor claro
    (`oklch(.145 0 0)`, quase preto) mesmo com `[data-theme="dark"]` ativo —
    achado assim na página do Pet (nome/descrição/skill quase pretos sobre
    card verde-escuro). `body` foi trocado para `--sm-bg`/`--sm-ink` (que
    respondem ao tema de verdade); NÃO reintroduza `var(--foreground)` /
    `var(--background)` em texto novo — são só para os componentes de
    `components/ui/` que os usam explicitamente via `.text-foreground` /
    `.bg-background`. Para checar contraste de verdade, não confie só no
    screenshot pequeno (o cinza quase-preto sobre fundo bem escuro ainda
    "parece" legível): amostre o PIXEL renderizado (ex.: `PIL`/`Pillow` lendo
    o PNG do Playwright) ou leia `getComputedStyle(el).color` — ambos batem.

## Convenções

- Commits em PT-BR, `tipo(escopo): resumo` (feat/fix/refactor/style/chore).
- Textos de UI sempre PT-BR + EN. Falas do pet: curtas, fofas, sem emoji nas
  frases faladas (o `speak()` remove emojis; `speakRaw()` preserva).
- Ao mudar regra de jogo: atualizar `GuideModal.tsx` (guia, PT/EN — os números
  saem das CONSTANTES, não de texto à mão) E `HelpModal.tsx` (glossário PT/EN)
  E os testes em `src/hooks/useDailyReset.test.ts`.
- Verificação visual: screenshot via Playwright antes de declarar UI pronta.
