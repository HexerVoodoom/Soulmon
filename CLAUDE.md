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
| ❤️ Corações (HP) | Perde na virada do dia: `min(floor((1 − feitas/meta) × maxHP), MAX_HEARTS_LOST_PER_DAY)`, onde meta = `min(cadastradas, requisito do estágio)`. Cumpriu o requisito (ou fez tudo que cadastrou) = não perde. **Teto de 1 coração por dia** — um dia ruim é um sinal, não uma sentença. **Ausência ≥2 dias não cobra nada** (`ABSENCE_FORGIVENESS_DAYS`): quem volta encontra saudade, não fatura. **Segunda-feira devolve 0.5** (`WEEKLY_RELIEF_HEARTS`) — o teto do estrago é 7 dias. HP aceita frações de 0.5. HP 0 → degeneração. |
| 🫶 Carinho | Cura principal de HP. Esfregar o pet (pointer drag): ~2s = +0.5 coração, **máx. 1 coração/dia** (`RUB_HEAL_DAY` no localStorage). Animação (explosão de corações) sempre toca. Alternativa: item **Coraçãozinho** (`💗`, comprado na loja ou dropado na masmorra) cura +1 coração ao ser usado na pastinha. |
| 🍎 Comida | Máx. **`MAX_STAGE_REQUIREMENT` por hora** (hoje **6**; janela deslizante, `FOOD_FEED_TIMES`). O teto é **derivado** do maior requisito diário da escada (`FORM_REQUIREMENTS`), nunca um literal: era 5 contra um mega que precisa de 6 barras, e quem fechava as 6 tarefas numa sessão só não conseguia dar a 6ª comida — dia perfeito negado a quem fez 100%. Dá +1 energia + pontos de atributo (vírus/dado/vacina → galho de evolução). NÃO cura HP. Recusa = pet fala que está cheio (sem toast). Ganha-se comida completando atividades. Chips/coraçõezinhos NÃO contam nesse limite. |
| ⚡ Energia | Enche só comendo, zera todo dia. **Barras de energia = requisito de tarefas do estágio** (`getMaxEnergyForStage` = `FORM_REQUIREMENTS.required`; ex.: rookie precisa de 4 tarefas → 4 barras). **Condição do dia perfeito: energia ≥ META DO DIA** (`min(cadastradas, requisito)`), e não ≥ requisito cru — comida vem de concluir tarefa, então num dia de meta 2 a energia máxima ALCANÇÁVEL é 2; cobrar 6 ali negava o dia perfeito a quem fez 100% da própria meta. As barras exibidas continuam sendo o requisito do estágio. |
| ✨ Traço de nascimento | `utils/passives.ts`: todo pet nasce com UM traço sorteado (`petPassive` no GameState), visível em Estatísticas. **Todos são positivos** — traço negativo puniria por um dado que o jogador não jogou; a variedade é em ESPÉCIE, não em força (há teste travando). Guloso (+1 atributo/comida) · Carinhoso (carinho cura até 1,5/dia) · Teimoso (perde só 0,5 coração no dia ruim) · Sortudo (+5pp de coraçãozinho na masmorra) · Madrugador (cocô só a partir das 10h). Os efeitos são lidos **do estado**, nunca por parâmetro novo — é o que faz o desktop herdar sem uma segunda implementação. |
| 🧭 O "porquê" do usuário | `soulGoal` e `soulStruggle`: duas perguntas abertas no onboarding, **antes de qualquer mecânica de jogo** (passos `GOAL_STEP`/`STRUGGLE_STEP`, ids negativos como `DEMO_PICK`, para não renumerar o ritual). Ambas puláveis — obrigar a escrever antes de ver o app é o jeito mais rápido de perder alguém. O `DailyReportModal` devolve o objetivo em dias perfeitos e no retorno. A página de Evolução mostra o **galho previsto** e, no empate, que é o ritmo que decide. |
| ⭐ Dia perfeito | `tarefas ≥ min(cadastradas, requisito) && ≥1 cadastrada && energia ≥ min(cadastradas, requisito)` — **a MESMA meta nos dois eixos** → +1 ponto de evolução (perfectDays). Mesma meta da regra de HP. Item **🌀 Glitchtama** (recompensa por concluir os 5 andares da masmorra) dá +1 perfectDay ao ser usado na pastinha. |
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
- **Nenhum nome de franquia no prompt do gerador** (`utils/oracle.ts`). Pedir
  "inspirado em Digimon/Pokémon/Palworld" convida o gerador a devolver algo perto
  demais de personagem registrado — e o sprite vai pro app de um usuário real.
  Há teste travando a ausência desses nomes.
- **Rookie/champion/ultimate/mega ficam**: vocabulário genérico do gênero.
- **`digimonName` (bridge do widget) e as chaves `digiapp_*` ficam**, pelo mesmo
  motivo de sempre: são internos, nunca aparecem pro usuário, e renomear
  quebraria o widget/save de quem já joga. O servidor de chat e de push aceita
  `petName` **e** `digimonName` justamente por causa dos APKs já instalados.

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

## Convenções

- Commits em PT-BR, `tipo(escopo): resumo` (feat/fix/refactor/style/chore).
- Textos de UI sempre PT-BR + EN. Falas do pet: curtas, fofas, sem emoji nas
  frases faladas (o `speak()` remove emojis; `speakRaw()` preserva).
- Ao mudar regra de jogo: atualizar `GuideModal.tsx` (guia, PT/EN — os números
  saem das CONSTANTES, não de texto à mão) E `HelpModal.tsx` (glossário PT/EN)
  E os testes em `src/hooks/useDailyReset.test.ts`.
- Verificação visual: screenshot via Playwright antes de declarar UI pronta.
