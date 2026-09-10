# Referência — plugins, constants, i18n e guards de repositório

> **Dono:** doc-redator-referencia · **Data:** 09/09/2026 · **Estado:** rascunho
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
- `SoulmonAlarmPlugin` — interface: `scheduleAlarm({id, title, body, scheduledTime})`, `cancelAlarm({id})`.
- `SoulmonAlarm` — `registerPlugin<SoulmonAlarmPlugin>('SoulmonAlarm', { web: {...no-op...} })`. No navegador/PWA os dois métodos são no-op — o plugin só existe de verdade no Android nativo.
**Chamado por:** `src/utils/notifications.ts`, `src/components/NotificationManager.tsx`, `src/App.tsx`.
**Régua:** nenhum teste próprio de tipos; a fiação Kotlin↔JS é coberta pelos guards descritos no `CLAUDE.md` (`src/plugins/overlayCopiadorUnico.contract.test.ts`).
**Avisos do arquivo:** nenhum comentário de aviso no corpo — arquivo puramente declarativo.

### `src/plugins/SoulmonWidgetPlugin.ts`
**Dono de:** a interface e o formato de dados do plugin Capacitor `SoulmonWidget`, que alimenta os widgets Android via `SharedPreferences` (`WidgetRenderer.kt`).
**Exports:**
- `DigiWidgetData` — o payload inteiro que o app manda para o widget: `petName`, `currentStage`, `eggType`, `branchType`, `completedTasks`, `totalTasks`, `hp`, `healthPoints`, `maxHealthPoints`, `energyPoints`, `hasPoop`, e os campos de HÁBITO adicionados no WP2.6 — `habitSteady?` (faixa booleana, nunca percentual — o placar antigo `constancyPct`/`shields`/`bondLevel` foi retirado em 06/09/2026 por serem gravados e nunca lidos, ou por violarem a proibição de percentual cru na home), `habitTierMax?` (0–3), `needsIntervention?`.
- `SoulmonWidgetPlugin` — interface: `updateWidgetData(data)`.
- `SoulmonWidget` — `registerPlugin<SoulmonWidgetPlugin>('SoulmonWidget', { web: {...no-op...} })`.
**Chamado por:** `src/App.tsx`, `src/hooks/useProgressTracking.ts` (indiretamente, via os números que o `App.tsx` repassa ao plugin).
**Régua:** `src/plugins/widgetSemCobranca.contract.test.ts` — lê o FONTE Kotlin (nenhum teste em `node` alcança Kotlin em execução) e reprova a reintrodução de `"📋 $completed de $total feitas"`, `"⚠️ Cuide de mim!"`, `"N task(s) left, let's go!"` e das chaves vetadas `constancy_pct`/`shields`.
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
**Chamado por:** `src/components/ItemsWindow.tsx`, `src/components/CompanionHUD.tsx`, `src/App.tsx`, `src/utils/careRules.ts`.
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

---

## src/security, src/deploy, src/styles, src/test

O inventário (`node scripts/docs-inventario.mjs`, 09/09/2026) mostra **0 módulos não-teste** em `src/security/` e `src/deploy/` (as duas árvores fazem parte de `ARVORES` em `scripts/docs-inventario.mjs` e não têm um único arquivo de produção — só testes). `src/styles/` e `src/test/` não fazem parte de `ARVORES`, mas carregam guards do mesmo tipo; documentados aqui por instrução do orquestrador desta rodada, uma linha cada.

### `src/security/`
- **`csp.test.ts`** — reprova CSP com hash de script inline desatualizado: recalcula o hash a partir do `<script>` de tema em `index.html` e compara com `public/_headers`; sem isso um script alterado quebraria em silêncio (app pisca branco, ou some o service worker).
- **`oldWebview.test.ts`** — reprova regressão no aviso de WebView antigo, que vive num `<script>` inline de `index.html` fora do bundle (nenhum teste de componente alcança); extrai o script real e executa nas duas direções (navegador moderno e antigo).
- **`supabase.contract.test.ts`** — reprova a volta do caminho quebrado do chat de voz (POST direto a `*.supabase.co` com JWT commitado) e trava as quatro peças da funcionalidade declarada de transcrição: rota `/api/transcribe` same-origin, credencial só no servidor, declaração em `public/privacidade.html`/`docs/PLAY-DATA-SAFETY.md`, e o botão de microfone não desenhado sem `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY`.

### `src/deploy/`
- **`appUrl.contract.test.ts`** — reprova as três fontes da URL de produção (`capacitor.config.json`, `desktop/renderer/src/config.ts`, `desktop/electron/main.js`) divergindo entre si; nasceu do primeiro APK do CI que abriu o DigiApp com nome e ícone do Soulmon.
- **`firebaseNoBuild.contract.test.ts`** — reprova a ausência de `.env.production` versionado (as quatro `VITE_FIREBASE_*`, públicas por design); sem ele o build automático do CI, que não vê `.env` local, publica um bundle sem login por cima de qualquer deploy manual — medido em produção em 07/09/2026 (deploy manual 19:51:16, build automático 19:52:19, login quebrado).
- **`swCache.contract.test.ts`** — reprova a quebra de qualquer uma das seis invariantes que impedem "JS novo, cache velho" de prender um usuário em bundle antigo mesmo que alguém esqueça de bumpar `CACHE_VERSION` em `public/sw.js`.

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
