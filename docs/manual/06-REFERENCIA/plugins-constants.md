# Referência — plugins, constants, i18n e guards de repositório

> **Dono:** doc-redator-referencia · **Data:** 22/09/2026 (2ª sincronização do dia: delta `a6c1cd8a..592e2c14`, QA Rodada 2 — `BillingPlugin.kt` `acknowledge`, frases do `WidgetRenderer.kt`, guards `csp` por igualdade, `depsVivas` `SO_DEV`, `ia.camposEnviados` sem `fetch` cru, `copy.semFomo` em `src/utils`, e os novos `artMaps.contract`, `narrativa.superficies.contract`, `regrasDeJogo.qaRodada2`) · **Estado:** verificado em 22/09/2026 por doc-verificador (delta `a6c1cd8a..592e2c14` — conferido símbolo a símbolo contra o fonte; anterior no mesmo dia: delta `f4086ce0..a6c1cd8a`, QA Rodada 1 — `SoulmonAlarmPlugin.ts` (`canScheduleExact`/`openExactAlarmSettings`), `SoulmonWidgetPlugin.ts` (`widgetPetName`) e os guards novos conferidos com `ls src/deploy src/plugins src/*.contract.test.ts`; anterior: delta `f02a3166..4a8b8049`, só a lista de `src/deploy/`, conferida com `ls src/deploy`; anterior: verificado em 10/09/2026, mecânico completo)
> **Verificação:** `npx vitest run src/plugins src/constants src/i18nSemPtSozinho.contract.test.ts src/docsSemMentira.contract.test.ts src/docsManual.contract.test.ts src/index.css.contract.test.ts src/security src/deploy src/styles src/test`
> **Não cobre:** regra de negócio em profundidade (→ `02-REGRAS-DE-NEGOCIO.md`), o deploy em si (→ `08-INTEGRACOES-E-DEPLOY.md`), tokens de cor/CSS em detalhe (→ `04-IDENTIDADE-VISUAL.md`).
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

## Índice
- [src/plugins](#src-plugins) — `SoulmonAlarmPlugin.ts` · `SoulmonWidgetPlugin.ts`
- [src/constants](#src-constants) — `labels.ts`
- [src/translations](#src-translations) — `en.ts` · `pt.ts`
- [Guards de repositório](#guards-de-repositório) — `i18nSemPtSozinho` · `docsSemMentira` · `docsManual` · `index.css.contract`
- [src/security, src/deploy, src/styles, src/test](#srcsecurity-srcdeploy-srcstyles-srctest) — 0 módulos não-teste; testes documentados como réguas

---

## src/plugins

### `src/plugins/SoulmonAlarmPlugin.ts`
**Dono de:** a interface TypeScript do plugin nativo Capacitor `SoulmonAlarm` (agendamento de alarme Android via `AlarmManager`, ver `AlarmReceiver.kt`).
**Exports:**
- `SoulmonAlarmPlugin` — interface: `scheduleAlarm({id, title, body, scheduledTime})`, `cancelAlarm({id})` e, desde `a6c1cd8a` (PL-9, QA Rodada 1), `canScheduleExact(): Promise<{ exact: boolean }>` (`exact: false` = Android 12+ sem `SCHEDULE_EXACT_ALARM`; o Kotlin já cai em `setAndAllowWhileIdle` sozinho — existe para a UI poder OFERECER o convite "Alarmes e lembretes", opcional e por gesto, nunca automático) e `openExactAlarmSettings(): Promise<void>` (abre a tela do sistema; só em resposta a gesto).
- `SoulmonAlarm` — `registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', { web: {...no-op...} })`. No navegador/PWA os métodos são no-op (`canScheduleExact` devolve `{ exact: true }`) — o plugin só existe de verdade no Android nativo. ⚠️ Nenhum chamador de `canScheduleExact`/`openExactAlarmSettings` em `src/` ainda (`grep -rn "canScheduleExact\|openExactAlarmSettings" src --include=*.tsx` vazio, 22/09/2026) — o convite na UI é pendência.
**Chamado por:** `src/utils/notifications.ts`, `src/components/NotificationManager.tsx`, `src/App.tsx`.
**Régua:** `src/plugins/billingPbl8.contract.test.ts` (desde `a6c1cd8a` — o `describe` PL-9 exige `canScheduleExactAlarms()` antes de `setExactAndAllowWhileIdle` no Kotlin, o receiver `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` no manifesto e no `BootReceiver`, e os dois métodos nos dois lados); a fiação Kotlin↔JS também é coberta por `src/plugins/overlayCopiadorUnico.contract.test.ts`.
**Avisos do arquivo:** nenhum comentário de aviso no corpo — arquivo puramente declarativo.

### `src/plugins/SoulmonWidgetPlugin.ts`
**Dono de:** a interface e o formato de dados do plugin Capacitor `SoulmonWidget`, que alimenta os widgets Android via `SharedPreferences` (`WidgetRenderer.kt`).
**Exports:**
- `DigiWidgetData` — o payload inteiro que o app manda para o widget: `petName`, `currentStage`, `eggType`, `branchType`, `completedTasks`, `totalTasks`, `hp`, `healthPoints`, `maxHealthPoints`, `energyPoints`, `hasPoop`, e os campos de HÁBITO adicionados no WP2.6 — `habitSteady?` (faixa booleana, nunca percentual — o placar antigo `constancyPct`/`shields`/`bondLevel` foi retirado em 06/09/2026 por serem gravados e nunca lidos, ou por violarem a proibição de percentual cru na home), `habitTierMax?` (0–3), `needsIntervention?`.
- `SoulmonWidgetPlugin` — interface: `updateWidgetData(data)`.
- `SoulmonWidget` — `registerPlugin<SoulmonWidgetPlugin>('SoulmonWidget', { web: {...no-op...} })`.
- `widgetPetLine(state)` — `'corvo'` quando `spriteLineOf(state)` é o corvo, senão `''` (→ chave `pet_line`; vazio = o plugin Kotlin remove). (29/09/2026)
- `widgetGroveStage(local)` — id do estágio do Bosque visto por último em `groveLocal` (`max(index, pending.index)` via `groveStageAt`) ou `''` (→ chave `grove_stage`; o plugin Kotlin aceita só os 5 ids de `GROVE_STAGES`). (29/09/2026)
- `widgetPetName(meta?)` (desde `a6c1cd8a`, QA Rodada 1 §4.4) — `soulmonDisplayName(meta) || 'Soulmon'`: o nome que vai em `pet_name` é o MESMO da Home (batizado > `baseName` > "Soulmon"). ⚰️ Até `f4086ce0` o `App.tsx` mandava o ESTÁGIO capitalizado ("Rookie", "Champion") — a criatura chamada "Pyraka" na Home aparecia como "Rookie" nos widgets A, B e D (footgun 9: o nome tem dono em `utils/petName.ts`).
**Chamado por:** `src/App.tsx`, `src/hooks/useProgressTracking.ts` (indiretamente, via os números que o `App.tsx` repassa ao plugin).
**Régua:** `src/plugins/widgetSemCobranca.contract.test.ts` — lê o FONTE Kotlin (nenhum teste em `node` alcança Kotlin em execução) e reprova a reintrodução de `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"`, `"N task(s) left, let's go!"`, das chaves vetadas `constancy_pct`/`shields` e, desde `a6c1cd8a` (L11/L6), de `miss(ed|ing)? you` / `waited for you` / `lonely` em EN e do `✨` (⚰️ `"I missed you!"`, `"I miss you..."` em hp ≤ 20 e `"I've been missing you"` passaram até 22/09/2026 — a criatura nunca sente por causa do que a pessoa fez ou deixou de fazer); `src/plugins/widgetNome.contract.test.ts` (desde `a6c1cd8a` — `widgetPetName` nunca é estágio; o bloco `updateWidgetData` do `App.tsx` usa `widgetPetName(gameState.soulmonMeta)`; `evolutionStage.charAt(0).toUpperCase()` não volta). **Frases do `WidgetRenderer.kt` trocadas em `592e2c14`** (QA Rodada 2, `02-narrativa-r2` §3 A6/A12): ⚰️ `"You're my favorite partner!"` (L1 + `partner` é o termo da franquia para o humano), `"Let's tackle our tasks together?"` (L2), `"Together we're stronger!"` (§5.8: muda o corpo, não a força), `"I'm rooting for you!"` (§13), `"Ready to evolve today?"` (cutucada sem saber se a barra está cheia) → `"Want company?"`, `"Same road, you and me."`, `"Side by side."`; hp ≤ 20 → `"Resting close to the ground today."`; `habitSteady` → `"The rhythm held."`. O widget continua só em EN (bridge congelado). Guard: `src/narrativa.superficies.contract.test.ts` varre `android/**.kt` pelos termos vetados (não pelas frases).
**Avisos do arquivo:** as chaves do bridge são CONGELADAS — só se acrescenta, nunca se renomeia (widget velho falando com app novo, ou o contrário, não pode quebrar). `habitSteady`/`habitTierMax`/`needsIntervention` foram acrescentados a um campo já existente para essa regra ficar respeitada.

---

## src/constants

### `src/constants/labels.ts`
**Dono de:** o catálogo estático de "comida" por categoria de atividade, os emojis de categoria e o mapa de categoria vinda de IA (Physical/Mental/Social/Creative) para `ActivityCategory`.
**Exports:**
- `FoodItem` — interface `{ name, emoji, category }`.
- `FOOD_BY_CATEGORY` — uma comida (nome + emoji) por `ActivityCategory` — ex. `Fitness → Protein 🥩`, `Study → Apple 🍎`.
- `CATEGORY_EMOJIS` — emoji de cada categoria (distinto do emoji de comida acima).
- `AI_CATEGORY_MAP` — categoria devolvida por uma IA externa (`Physical`/`Mental`/`Social`/`Creative`) → `ActivityCategory` do jogo.
**Chamado por:** `src/components/CompanionHUD.tsx`, `src/App.tsx`, `src/utils/careRules.ts` (⚰️ `ItemsWindow.tsx` deixou de importar na minimal-ui F6).
**Régua:** nenhum teste próprio; coberto indiretamente pelos testes de `careRules.ts` e pelos testes de render dos componentes citados.
**Avisos do arquivo:** nenhum comentário de aviso — arquivo de dado estático puro.

---

## src/translations

### `src/translations/en.ts` (157 linhas) e `src/translations/pt.ts` (157 linhas)
⚰️ **Ramo morto, junto com `src/contexts/LanguageContext.tsx`** (ver `hooks-contexts-types.md`) — o único chamador dos dois é o próprio `LanguageContext.tsx`, que por sua vez não tem chamador fora dele mesmo (`grep`, 09/09/2026; confirmado pelo comentário de `src/components/p5DiaCompleto.contract.test.ts` que dispensa `src/utils/i18n.ts` — que importa estes dois arquivos — da varredura de texto por estar morto). O app inteiro escreve texto com o padrão `isPt ? … : …` inline, não com chave de dicionário.
**Dono de:** um dicionário de strings de UI por chave aninhada (`common.save`, `header.home`, `companion.idle_message`, `care.*`, …), não usado em produção.
**Exports:**
- `en` (`en.ts`) — objeto com as seções `common`, `header`, `companion`, `care`, entre outras.
- `pt` (`pt.ts`) — o par em português, mesma forma.
**Chamado por:** `src/contexts/LanguageContext.tsx` apenas.
**Régua:** nenhuma — não fazem parte de nenhum guard de paridade PT/EN (a regra viva de paridade é `src/i18nSemPtSozinho.contract.test.ts`, que varre o padrão `isPt ? … : …`, não este dicionário).
**Avisos do arquivo:** nenhum aviso próprio — a informação de que estão mortos vem de fora (teste citado acima), não de um comentário dentro destes dois arquivos.

---

## Guards de repositório

Testes descritos como réguas de política do repositório, não como testes de um módulo de produção. Um linha cada, o que cada um reprova.

### `src/i18nSemPtSozinho.contract.test.ts`
Reprova STRING VISÍVEL nascida só em português — checa BIFURCAÇÃO (`language === 'pt-BR' ? … : …` / `isPt ? … : …`), não tradução: uma frase PT dentro do ramo certo passa, a mesma solta não. Nasceu de três vazamentos reais achados por leitura (aria-labels de checkbox/editar, título do push das 22h).

### `src/docsSemMentira.contract.test.ts`
Reprova `docs/` (fora de `docs/historico-digiapp/` e das subpastas de pesquisa) ensinando regra MORTA como se fosse fato atual — estágio que não existe (`DigiEgg`, `Baby I`), tabela de HP obsoleta, evolução automática, degeneração, nome de chave de save antiga. Nasceu de onze arquivos herdados do DigiApp que afirmavam essas coisas nos três primeiros documentos que um leitor novo abria.

### `src/docsManual.contract.test.ts`
Reprova cinco coisas em `docs/manual/`: (a) doc de `docs/` sem entrada em `00-MAPA.md`; (b) link relativo do manual que não resolve; (c) módulo das árvores de `scripts/docs-inventario.mjs` sem entrada `### \`caminho\`` em `06-REFERENCIA/` (este arquivo faz parte da cobertura de (c) para `src/plugins` e `src/constants`); (d) referência de código por `arquivo:linha` em vez de por SÍMBOLO; (e) doc do manual sem `Dono:`/`Verificação:` nas primeiras 40 linhas.

### `src/index.css.contract.test.ts`
Reprova classe utilitária usada no JSX de um componente realmente renderizado que NÃO existe em `src/index.css` — o Tailwind aqui é pré-compilado (sem plugin no Vite), então uma classe fora do CSS falha em SILÊNCIO (nada quebra, o elemento só sai com o tamanho errado). Foi como `w-7`/`h-7` deixaram o checkbox de concluir tarefa renderizando com 2px.

### `src/ia.camposEnviados.contract.test.ts` (desde `a6c1cd8a`, QA Rodada 1 — compliance R1)
O DONO da fronteira "o que o cliente MANDA para a IA": lê os call sites de `aiFetch` (`utils/aiClient.ts`, o único caminho do cliente para as rotas de IA) e compara as chaves do body com uma lista FECHADA por rota e por arquivo; também fecha quem chama `suggestTasks`/`suggestTasksResult` e onde `getAIResponse` mora. Desde `592e2c14` (mutation test da QA Rodada 2: 2 buracos fechados) reprova também **`fetch` cru a qualquer rota de IA fora de `aiClient.ts`** — sem isso um `fetch('/api/chat', …)` novo passava por fora da lista. Chave nova, rota nova ou arquivo novo chamando IA → vermelho, até alguém acrescentar aqui E na política (`public/privacidade.html` §2b, termos §9). Valida a FORMA, não o valor (isso é de `_aiGuard.js`/`chat.js`). Nasceu de dois campos fora da lista — `task.name` no Decompor e o `soulGoal` pré-preenchido do tutorial — provisoriamente DECLARADOS na tela, não cortados (#42).

### `src/copy.semFomo.contract.test.ts` (desde `a6c1cd8a`, QA Rodada 1 — proibição #15 de `01-VISAO.md` §7)
Duas réguas: (a) COPY — varre `src/components/**`, **`src/utils/**` inteiro (desde `592e2c14`; ⚰️ só `i18n.ts`/`petVoice.ts`/`welcomeBack.ts` — o mutation test da QA Rodada 2 provou que uma frase FOMO em outro `utils/*.ts` passava)**, `functions/api/_pushCopy.js`, `workers/*.js`, `public/*.html`, o Kotlin do widget e `res/values` com 18 regex PT/EN fora de comentário ("última chance", "só hoje", "antes que acabe", "não perca", contagem regressiva de oferta…); (b) MECÂNICA — nenhum item de `ALL_SHOP_ITEMS`/`SPECIAL_ITEMS` carrega prazo (`expiresAt`/`until`/`endsAt`/`availableUntil`/`limited`); buff consumível com `expiresAt` (`PlayCard.tsx`) é efeito, não vitrine. Se cair, a saída é apagar a frase, nunca afrouxar a regex. Com ela a #15 passou de "por tese" a "por teste" (13 por teste / 8 por tese).

---

## src/security, src/deploy, src/styles, src/test

O inventário (`node scripts/docs-inventario.mjs`, 09/09/2026) mostra **0 módulos não-teste** em `src/security/` e `src/deploy/` (as duas árvores fazem parte de `ARVORES` em `scripts/docs-inventario.mjs` e não têm um único arquivo de produção — só testes). `src/styles/` e `src/test/` não fazem parte de `ARVORES`, mas carregam guards do mesmo tipo; documentados aqui por instrução do orquestrador desta rodada, uma linha cada.

### `src/security/`
- **`csp.test.ts`** — reprova CSP com hash de script inline desatualizado: recalcula os hashes dos `<script>` inline de `index.html` (quatro: tema, splash localizada, aviso de WebView antigo, registro do SW) e compara com `public/_headers`; desde `592e2c14` (`00-skeptic-r2` #12) exige **IGUALDADE do conjunto** (fonte ∪ `dist/index.html`) — a política não pode carregar hash de script que não existe, nem faltar um (⚰️ o comentário do `_headers` dizia "TRÊS" e o teste só conferia inclusão). Sem isso um script alterado quebraria em silêncio (app pisca branco, ou some o service worker).
- **`oldWebview.test.ts`** — reprova regressão no aviso de WebView antigo, que vive num `<script>` inline de `index.html` fora do bundle (nenhum teste de componente alcança); extrai o script real e executa nas duas direções (navegador moderno e antigo). Desde `592e2c14` (`00-skeptic-r2` #5) o ramo Android só dispara com **`; wv)`** no UA — Samsung Internet e Firefox não são WebView e recebiam o aviso.
- **`supabase.contract.test.ts`** — reprova a volta do caminho quebrado do chat de voz (POST direto a `*.supabase.co` com JWT commitado) e trava as quatro peças da funcionalidade declarada de transcrição: rota `/api/transcribe` same-origin, credencial só no servidor, declaração em `public/privacidade.html`/`docs/PLAY-DATA-SAFETY.md`, e o botão de microfone não desenhado sem `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY`.

### `src/deploy/`
- **`appUrl.contract.test.ts`** — reprova as três fontes da URL de produção (`capacitor.config.json`, `desktop/renderer/src/config.ts`, `desktop/electron/main.js`) divergindo entre si; nasceu do primeiro APK do CI que abriu o DigiApp com nome e ícone do Soulmon.
- **`firebaseNoBuild.contract.test.ts`** — reprova a ausência de `.env.production` versionado (as quatro `VITE_FIREBASE_*`, públicas por design); sem ele o build automático do CI, que não vê `.env` local, publica um bundle sem login por cima de qualquer deploy manual — medido em produção em 07/09/2026 (deploy manual 19:51:16, build automático 19:52:19, login quebrado).
- **`swCache.contract.test.ts`** — reprova a quebra de qualquer uma das seis invariantes que impedem "JS novo, cache velho" de prender um usuário em bundle antigo mesmo que alguém esqueça de bumpar `CACHE_VERSION` em `public/sw.js`.
- **`depsVivas.contract.test.ts`** (desde `4a8b8049`, decisão #33) — reprova pacote de `dependencies` do `package.json` sem um único import/require/`@import` em `src`, `functions`, `workers`, `desktop`, `scripts`, `public`, `index.html` ou `vite.config.ts`; allowlist com motivo obrigatório (`@capacitor/android` entra pelo Gradle). Desde `592e2c14` a tabela **`SO_DEV`** reprova pacote que NÃO PODE voltar para `dependencies`: `@capacitor/cli` tem de estar AUSENTE de `dependencies` e presente em `devDependencies`, e `android-build.yml` tem de instalá-lo por `npm install -g @capacitor/cli` (⚰️ estava em `dependencies` e puxava `tar` vulnerável para o `npm audit --omit=dev`, que ficou em 0 — pendência da R1 que "em correção" não tinha aterrissado). Nasceu de 40 pacotes do scaffold shadcn instalados sem uso — porta encostada para o próximo `import` sem decisão.
- **`orcamentoDeBytes.contract.test.ts`** (desde `4a8b8049`, decisão #31) — lê `dist/` **depois** do `npm run build` e reprova: JS de entrada > 250 KB, CSS > 100 KB, imagem > 400 KB, vídeo > 800 KB, qualquer `.png` em `dist/assets` ou referência `/assets/*.png` no bundle (a 1ª visita sem SW receberia 404); a dívida atual é nomeada em `DIVIDA_ATUAL` (`index.js`, `index.css`, `evolution-bg.mp4`, `intro.mp4`) e só pode diminuir — folga de 8 KB para JS/CSS. Desde `a6c1cd8a` a função `dividasMortas` é pura e provada com fixture sintética, e a dívida de uma chave sem hash é do MAIOR arquivo com aquele nome (⚰️ `find` pegava o primeiro da listagem — `index-*.js` são 4 arquivos, de 438 B a 629 KB — e declarava a dívida paga com o chunk de 438 B). Ver [05 §9](../05-ARQUITETURA.md).
- **`manifest.contract.test.ts`** (desde `a6c1cd8a`, perf-a11y R1 + design) — reprova `public/manifest.json` divergindo do `index.html`: `name`/`short_name` = `Soulmon` sem slogan (⚰️ "Soulmon - Gamified Productivity" com descrição EN do fork), `description` == `<meta name="description">` (PT), `theme_color` == `--sm-primary` do `index.css` == `<meta theme-color>` claro. O que a pessoa lê ao instalar o PWA tem que ser o texto da página.
- **`versaoUnica.contract.test.ts`** (desde `a6c1cd8a`, design-critic B1) — reprova mais de uma versão no repositório: `package.json` › `version` é semver e é a FONTE (**1.1.4**); `android/app/build.gradle` › `versionName` é igual; `vite.config.ts` injeta `__APP_VERSION__` a partir do `package.json`, não de literal. ⚰️ A tela dizia "1.0.2", o `package.json` 0.1.0 e o Gradle 1.1.4.

### `src/assets/` e `src/utils/` (guards novos em `592e2c14`, QA Rodada 2)
- **`src/assets/artMaps.contract.test.ts`** — a fronteira `id do domínio ↔ PNG` dos mapas `*Art.ts` (conquista, linha, cenário, comida, sonho, achado, mobília): (a) todo id tem arte, (b) toda arte da pasta do glob é alcançada por um id, (c) todo `import` estático dos `*Art.ts` resolve em disco. Chave que falta num `import.meta.glob` não quebra nada — o consumidor recebe `undefined` e desenha nada (as 924 auras com chave errada de 20/09/2026 nasceram assim). Autoverificação: id inventado tem de devolver `undefined`.
- **`src/narrativa.superficies.contract.test.ts`** — as superfícies que `narrativa.contract.test.ts` não vê: `docs/BOOKLET-UNIVERSO.md`, `docs/PLAY-FICHA.md`, `public/*.html` e `android/**.kt` — mesma tabela `TERMOS` (espelhada, o 1º caso compara os `source` das regexes), mais: todo caminho `src/…`/`functions/…`/`workers/…`/`desktop/…` citado no booklet e na ficha existe. ⚠️ Não varre `functions/api/_pushCopy.js`/`account.js` nem trava `partner`, ao contrário do que o `00-CONSOLIDADO.md` §3.3 lista.
- **`src/utils/regrasDeJogo.qaRodada2.test.ts`** — a simulação de 90 dias × 15 perfis (`07-simulacao-jogo-r2`) reduzida a casos: cada regra CONTRADITA pela doc virou `it(` verde com o comportamento escrito hoje, e cada proposta que depende do dono virou **`it.todo`** com o provisório (#57 `timesPerWeek` na meta de coração, #58 carência no dreno, #60 a virada julga só ontem, #61 re-evoluir depois de cair, #62 Glitchtama × `totalPerfectDays`). `it.todo` aparece no `vitest` como `todo`, não como falha — é a fila do dono em forma executável.

### `src/plugins/` (guards que leem o FONTE Kotlin/Gradle — nenhum teste em `node` compila Android)
- **`billingPbl8.contract.test.ts`** (desde `a6c1cd8a`) — PL-8: `build.gradle` não volta para `billing(-ktx):0.x–7.x` (a Play recusa v6 desde 31/08/2025 e v7 desde 31/08/2026; hoje **8.3.0**), `enablePendingPurchases` leva `PendingPurchasesParams`, `queryProductDetailsAsync` lê `QueryProductDetailsResult.productDetailsList`, o reject `product-not-found` fica sem sufixo. PL-9: alarme exato só atrás de `canScheduleExactAlarms()` com fallback `setAndAllowWhileIdle`, receiver de mudança de permissão no manifesto e no `BootReceiver`, `canScheduleExact`/`openExactAlarmSettings` nos dois lados. **`592e2c14`:** o `BillingPlugin.kt` ganhou `@PluginMethod fun acknowledge(call)` (confere por `queryPurchasesAsync` que o `purchaseToken` é da conta — `not-owned` senão — e reconhece por `acknowledgeIfNeeded`), e o ack SAIU do `purchasesUpdatedListener`/`getPurchases`: quem reconhece é o JS (`playBilling.ts` › `fecharNaPlay`) DEPOIS do `/api/billing` ok — ⚰️ reconhecer no callback fechava a compra na Play antes de o servidor conceder o tier. Guard do texto Kotlin: `src/utils/playBilling.ackAposVerify.test.ts` (3 casos leem o `.kt`). ⚠️ O guard prova o TEXTO; o compile só o CI prova (`android-build.yml`) — e o CI está parado por cobrança (#48).
- **`widgetNome.contract.test.ts`** e **`widgetSemCobranca.contract.test.ts`** — ver `SoulmonWidgetPlugin.ts` acima.

### `src/styles/`
- **`emojiSuportado.contract.test.ts`** — reprova emoji usado na UI que a fonte do navegador não desenha (vira caixa vazia `▯`); mede por canvas comparando o desenho do glifo com um caractere garantidamente ausente. Achado real: o card de sonho do relatório noturno mostrava caixa vazia para emojis Unicode 13.0/14.0.
- **`iconInventory.contract.test.ts`** — reprova `<Icon name="...">` usado fora do subset de 145 KB da Material Symbols Rounded que o app carrega (a fonte completa tem 5,3 MB); nome fora do subset renderiza `<span>` vazio sem erro nenhum. Achado real: o botão "Equilibrar minha semana" foi ao ar sem ícone.
- **`iconScale.contract.test.ts`** — reprova `size` de `<Icon>` fora dos quatro papéis declarados em `src/styles/tokens.md` §6.1 (20 inline / 24 action / 32 nav / 24 deck); achou 38 de 100 call-sites fora da escala antes de existir.
- **`navRotulo.contract.test.ts`** — reprova rótulo da barra de navegação inferior que estoura a célula em 320×640, nos dois idiomas; achado real: "ATIVIDADES" cortava o "S" final em PT-BR com `text-overflow: clip`, sem sinal visual.
- **`tokens.contrast.test.ts`** — reprova (1) token de cor `--sm2-*` sem par nos dois temas (claro/escuro) e (2) par de cor declarado com contraste abaixo do exigido pela WCAG 2.x, medido numericamente (não por screenshot — footgun 10 do `CLAUDE.md`, a faixa de 3:1–5:1 engana o olho).
- **`tokens.md`** — não é teste; é o documento de design system (`--sm2-*`) que `iconScale.contract.test.ts` e `tokens.contrast.test.ts` tornam executável. Referenciado aqui porque os dois guards citam este arquivo como fonte da regra.

### `src/test/`
- **`renderEnv.selfcheck.test.tsx`** — reprova o próprio ambiente de teste de render parando de enxergar (ex.: `index.css` mudar de formato, `@layer` virar outra coisa, jsdom parar de resolver a cascata); existe para que o PRIMEIRO teste a cair, nesse cenário, seja este, e não todos os testes de componente virando verdes vazios em silêncio.
- **`renderEnv.tsx`** — não é teste; é o suporte que monta um componente COM o `index.css` real no `document` e lê o estilo computado (jsdom não faz layout — `getBoundingClientRect()` sempre 0 — mas resolve a cascata CSS, que é onde a fronteira JSX↔CSS do footgun 1 quebra). Usado por `renderEnv.selfcheck.test.tsx` e pelos testes de render de componentes em `src/components/`.
- **`tsAst.ts`** — não é teste; carrega o compilador TypeScript UMA vez, fora do orçamento de cada teste, para os cinco guards de elo do repositório que leem código de produção como AST (`playerDay.contract`, `spriteBirth.contract`, `spriteTuneUnseen`, `useDailyReset.rollover`, `assets.contract`) — evita o flake medido de cada um importar `typescript` no próprio corpo.
