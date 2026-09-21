# QA 12 — Growth / Distribuição: o que falta para o PRIMEIRO usuário real chegar e ser medido

Data: 2026-09-21 · Papel: alpha-growth-engineer + soulmon-growth-aso · Somente leitura.
Fontes: `CLAUDE.md`, `docs/PLANO-PRODUTO.md`, `docs/STATUS.md` §3.2, `docs/APK-BUILD-INFO.md`,
`docs/PLANO-DESKTOP-STEAM.md` §7, `docs/reviews/2026-08-03/soulmon-growth-aso.md`,
`docs/PLAY-DATA-SAFETY.md`, `index.html`, `public/manifest.json`, `manifest.webmanifest`,
`screenshots/`, `src/utils/telemetry.ts`, `functions/api/metrics.js`, `src/App.tsx`,
`src/components/{InstallPrompt,WelcomePromptModal,SoulmonOnboarding,UnlockAccountModal}.tsx`,
`src/utils/welcomeBack.ts`, `functions/api/_pushCopy.js`, `workers/wrangler.toml`, `public/sw.js`.

Referência: `caminho` + SÍMBOLO. Números com o comando que os mede.

---

## 0. Veredito em três linhas

1. **Não existe hoje nenhuma superfície pela qual um estranho descubra o app.** Sem ficha de loja, sem
   landing, sem OG/description, manifesto com copy do fork. O único caminho é alguém receber a URL
   `soulmon.mateus-sprnd.workers.dev` de mão em mão.
2. **O funil está instrumentado ponta a ponta e a retenção D1/D7/D30 é legível por marco** — mas
   **ninguém consegue ler**: `METRICS_ADMIN_KEY` não está definido (rota responde 404). Instrumentação
   verificada; leitura bloqueada pelo dono.
3. **Retenção antes de aquisição continua valendo**, mas aqui a ordem é diferente do normal: com zero
   usuários não há retenção para medir. O primeiro experimento não é de canal, é de **"10 pessoas
   conhecidas, PWA, 14 dias, ler o agregado"** — e ele já tem tudo de que precisa, exceto a chave.

---

## 1. Inventário de superfícies de aquisição

| Superfície | Existe? | Evidência | Lacuna |
|---|---|---|---|
| **Ficha da Play — texto** | Rascunho, bloqueado | `docs/reviews/2026-08-03/soulmon-growth-aso.md` Anexo A (título/curta/longa PT-BR com marcador `[NOME]`). O aviso de bloqueio do anexo ("não publique com Soulmon") foi **superado pelo dono em 21/09/2026** (`REGISTRO-DE-DECISOES.md` §14: marca mantida). | Substituir `[NOME]` → `Soulmon`, revisar contra o produto atual (o anexo diz "dia perfeito" — o nome hoje é "dia completo", P5; "torneio contra outros jogadores" só se PvP estiver vivo). Versão en-US: o anexo lido vai até o roteiro de screenshots; conferir se o Anexo B en-US existe na 2ª metade do arquivo (`Read offset=750`). |
| **Ficha da Play — screenshots** | Não | `screenshots/` na raiz tem 3 PNG (`screenshot-mobile-1/2.png` 360×640, `screenshot-wide.png`). São **da era DigiApp** (referenciados só por `manifest.webmanifest`, arquivo órfão — ver abaixo) e **não estão em `public/`**, logo não são servidos. Play exige mín. 320px e proporção 16:9/9:16, 2–8 imagens. | Roteiro de 8 telas existe no Anexo A.5. Produzir. |
| **Ficha da Play — vídeo, feature graphic (1024×500)** | Não | Nenhum arquivo; nenhum doc. | Feature graphic é **obrigatório** na Play. |
| **Ícone** | Sim (Android) | `android/app/src/main/res/mipmap-*/ic_launcher*.png` + `mipmap-anydpi-v26/ic_launcher.xml` (adaptive). PWA: `/favicon-192x192.png`, `/favicon-512x512.png` (`public/manifest.json` → `icons`). | Play pede ícone 512×512 32-bit PNG separado no console — o `favicon-512x512.png` serve se for a mesma arte. Não verifiquei visualmente se o ícone ainda é a arte "D" do DigiApp descrita em `docs/APK-BUILD-INFO.md` (§"Design dos Ícones") — **conferir a olho antes de publicar**. |
| **Landing page** | Não | `index.html` serve o app direto (`<div id="root">` + splash). Não há `/landing`, `/sobre`, nem rota pública read-only. | Sem landing, o link compartilhado abre o onboarding de 8 telas para quem só queria ver o que é. |
| **SEO / Open Graph** | Não | `Grep og:|<meta name="description"|twitter:` em `index.html` → **0 resultados**. Só `<title>Soulmon</title>` e `theme-color`. | Um link do app no WhatsApp/Discord/Reddit renderiza sem imagem e sem descrição. Custo: 6 linhas de `<meta>` + 1 PNG 1200×630. |
| **Manifesto PWA (o que está linkado)** | Sim, copy do fork | `index.html` → `<link rel="manifest" href="/manifest.json">`. `public/manifest.json` → `name: "Soulmon - Gamified Productivity"`, `description` de mecânica ("Complete real-life tasks…"), `categories: ["productivity","lifestyle","games"]` (as três, ou seja nenhuma), `lang: pt-BR` mas descrição só em EN, **sem `screenshots`, sem `id`**. | Chrome usa `screenshots` + `description` do manifesto no diálogo de instalação "rico" — sem eles, o prompt é o mínimo. Frase de posicionamento aprovada existe na review (§"Posicionamento") e nunca entrou aqui. |
| **`manifest.webmanifest` (raiz)** | Órfão | Arquivo na raiz do repo com `theme_color: #2bff95` (verde do DigiApp), `screenshots` apontando para `/screenshots/*` (não servidos), `display_override`. **Ninguém o referencia** (`Grep screenshots/` → só `docs/manual/05-ARQUITETURA.md`, o agent de designer e ele mesmo). | Lixo herdado; risco de alguém "consertar" o manifesto errado. |
| **PWA instalável — prompt** | Sim, passivo | `src/components/InstallPrompt.tsx` (`InstallPrompt`): captura `beforeinstallprompt`, mostra card **dentro das Configurações** (não é modal), dispensa persiste em `STORAGE_KEYS.PWA_INSTALL_DISMISSED`. `src/components/WelcomePromptModal.tsx` também escuta `beforeinstallprompt`. SW registrado em `index.html` (`navigator.serviceWorker.register('/sw.js')`). | Instalação **não é evento de telemetria** (`appinstalled` só muda estado local; não há `track`). Ver §2. |
| **APK direto (sideload)** | Build existe, não distribuível | `android-build.yml` gera artefato no GitHub Actions. `docs/APK-BUILD-INFO.md` é **doc-histórico do DigiApp** (23/12/2024) — inútil para o build atual; o vivo é `docs/manual/08-INTEGRACOES-E-DEPLOY.md`. | Sem link público de download; artefato do Actions exige login GitHub. E `google-services.json` ainda é do `digiapp-88296` (`PLANO-DESKTOP-STEAM.md` §7 item 1) — o build **falha de propósito** até o dono registrar o pacote. |
| **Steam / desktop** | Plano, bloqueado pelo dono | `docs/PLANO-DESKTOP-STEAM.md` §7: conta Steamworks + US$100, App ID/Depot, arte da loja (tabela de 7 tamanhos), preços. `npm run dist:steam` já rodou (STATUS §3.3). | Nada de itch.io em nenhum doc (`Grep -i itch docs/` → só "Glitchtama"). |
| **Política de privacidade (pré-requisito da ficha)** | Sim | `public/privacidade.html`, `public/termos.html` → servidos em `/privacidade.html`. `docs/PLAY-DATA-SAFETY.md` é a fonte do formulário Data Safety. | STATUS §3.2 marca "URL da política + formulário" como 🔴 — a URL existe; o que falta é **colar no console** (dono). |

**Conclusão da §1:** existem 1 rascunho de copy (que precisa de 1h de revisão) e 0 assets gráficos de loja.
Mas nada disso é o gargalo do *primeiro* usuário: o primeiro usuário não vem da Play. Vem de link.

---

## 2. Funil declarado e onde cada etapa é instrumentada

Cliente: `src/utils/telemetry.ts` (`EVENT_SCHEMA`, `track`, `ONCE_EVER`, `ONCE_PER_DAY`, `seenKeyFor`).
Servidor: `functions/api/metrics.js` (`EVENT_SCHEMA` espelho, `applyAggregate`, `summarizeNorthStar`, `onRequestGet`).
Agregado: chave KV `m:YYYY-MM-DD`, contadores somados, **sem id, sem coorte** (cabeçalho de `metrics.js`).

| Etapa | Definição operacional | Evento | Emissor (verificado) | Dedupe | Estado |
|---|---|---|---|---|---|
| **Abrir** | 1ª carga do bundle num aparelho | `install` | `src/App.tsx` (useEffect de boot, `track('install')`) | uma vez na vida (`ONCE_EVER`) | ✅ |
| Abrir (por origem) | abertura por `?src=` | `app_open {source}` | `src/App.tsx` (`openSourceFromUrl(window.location.search)`); `public/sw.js` abre `/?src=push` no clique do push | 1×/dia/origem | ✅ — mas só `push` está marcado hoje; `widget`/`shortcut` são rótulos sem emissor no Android (não verifiquei o Kotlin) |
| **Onboarding** | passo N alcançado, por funil demo/paid | `onboarding_step {step, funnel}` | `src/components/SoulmonOnboarding.tsx` (`track('onboarding_step'`) | livre | ✅ — drop-off por passo legível em `onboarding_step.demo.<n>` |
| Onboarding — escolha do demo | picou 1 de 6 | `demo_pick` | `SoulmonOnboarding.tsx` | — | ✅ |
| Onboarding — reveal | viu a criatura (sprite pronto ou não) | `reveal_seen {has_sprite, funnel, duration}` | `SoulmonOnboarding.tsx` | — | ✅ |
| **1ª tarefa** | 1ª conclusão REAL (tarefa ou hábito) | `first_task_done {tier}` | `src/App.tsx` (efeito sobre `showFirstTaskPopup`) | uma vez na vida | ✅ |
| Criação de atividade | por caminho × tipo | `activity_create {kind, path, tier}` | `src/App.tsx` (×2) | livre | ✅ |
| Dia ativo | ≥1 conclusão real no dia, peso fechado na virada | `day_active {effort, tier}` | `src/utils/telemetry.ts` `trackDayClosed` ← `App.tsx` | 1×/dia, substitui na fila | ✅ |
| **Métrica-norte** | semana com ≥1 ativo; `goal_days ≥ 4` | `week_active {active_days, goal_days, tier}` | `telemetry.ts` (`WeekLedger`, despacha na virada da semana) | — | ✅ — `summarizeNorthStar` devolve `rate` (null se 0 ativos) |
| **D1 / D7 / D30** | marco de dias desde `K_INSTALL_DAY` (local), emitido **na abertura** | `retained {bucket, tier}` | `telemetry.ts` `trackRetentionOnOpen` ← `App.tsx` boot | 1× por marco na vida | ✅ — legível como `retained.d1 / install` **do mesmo período**, aproximação (não é coorte) |
| Retorno após ausência | dias fora, em faixa 0–3 | `welcome_back {days}` | `src/App.tsx` (`track('welcome_back'`) | — | ✅ |
| Volta depois de dia ruim | gap até voltar | `after_bad_day {gap, kind}` | `src/App.tsx` | — | ✅ |
| Convite de compra / recusa / compra | por motivo | `unlock_view`, `unlock_dismiss`, `purchase` | `App.tsx`, `UnlockAccountModal.tsx`, `SoulmonOnboarding.tsx` | — | ✅ |
| Teto do demo | bateu cap por caminho | `demo_cap_hit {path}` | `App.tsx` (×3) | — | ✅ |
| Check-in | mostrado / confirmado | `checkin_shown`, `checkin_commit` | `App.tsx` | shown 1×/dia | ✅ |
| Assombrada concluída, escudo, vínculo, opt-out de push | — | `haunted_done`, `shield_used`, `bond_level`, `push_optout` | `App.tsx` | — | ✅ |
| Som | — | `sound_state`, `sound_off` | `telemetry.ts` | 1×/dia | ✅ |

### 2.1 O que NÃO está instrumentado (lacuna, não invenção)

| Lacuna | Evidência | Consequência para growth |
|---|---|---|
| **`evolve`** — schema existe, **zero emissor** | `Grep "'evolve'" src --glob '!*.test.*'` → só `GuideModal.tsx` (id de seção) e o tipo em `telemetry.ts` | A 1ª evolução é o candidato mais forte a momento de ativação (§3) e **não é contável hoje**. |
| **`milestone`** — schema existe, zero emissor | mesmo grep → só `petVoice.ts` (`'milestone'` é tipo de fala) | Marcos 7/21/66 de hábito invisíveis. (`metrics.js` já avisa: "inofensivo enquanto ninguém emite".) |
| **`dungeon_run`** — schema existe, zero emissor | grep → só o tipo | Masmorra invisível. |
| **Instalação do PWA** (`appinstalled` / `userChoice.outcome`) | `InstallPrompt.tsx` só faz `setInstalled(true)`; nenhum `track` | Não dá para saber quantos instalam vs. usam no navegador. `install` = 1ª carga, não instalação. |
| **Origem de aquisição (UTM / referrer)** | `openSourceFromUrl` só conhece `direct/push/widget/shortcut` (`TELEMETRY_OPEN_SOURCE`); `document.referrer` nunca é lido | **Nenhum experimento de canal é atribuível.** Um post no Reddit e um vídeo no TikTok caem no mesmo `app_open.direct`. É a lacuna nº1 para a §4. |
| **Compartilhamento** | `Grep navigator.share|toBlob(|html2canvas src` → **0** (fora `beforeinstallprompt`) | Sem mecanismo, sem evento. O ativo viral (criatura única) não tem saída — mesma conclusão da review de 03/08, ainda verdadeira. |
| **Coorte real** | `metrics.js` cabeçalho + `notes.unreadable: ['retencao','D7','conversao em N dias']` | `retained.d7 / install` de janelas diferentes é aproximação. Carimbar semana de instalação é **trade-off de privacidade do dono**, declarado no arquivo. Com <100 usuários a aproximação basta. |
| **Leitura** | `functions/api/metrics.js` `onRequestGet`: `if (!env?.METRICS_ADMIN_KEY) → 404`. STATUS §3.2 🟡 confirma que não está definida. Leitor local: `tools/metricsReport.mjs` existe. | **Tudo acima grava e nada é lido.** Bloqueador do dono. |

---

## 3. Momento de ativação

**Declarado nos docs?** Não como "ativação". O que existe:
- `docs/PLANO-PRODUTO.md` Parte 2: "usuário ativo = concluiu ≥1 item real na semana" (definição de *ativo*, não de *ativação*) e alvo "≥4 de 7 dias na semana 2".
- Parte 5: os 5 eventos mínimos (`install`, `demo_pick`, `first_task_done`, `unlock_view`, `purchase`) — implica que `first_task_done` é a etapa que importa, sem dizer que é ativação.
- Review growth 03/08 §6 "Mídia paga": "≥35% dos instalados chegam à primeira evolução" — usa a 1ª evolução como marco, sem chamá-la de ativação.

**Proposta (HIPÓTESE, sem dado — rotulada):**

> **Ativação = `first_task_done` no dia 0 ou dia 1 E `day_active` em ≥2 dos primeiros 4 dias.**

Por quê este e não a evolução:
- A 1ª evolução (rookie→champion) custa `FORM_REQUIREMENTS.required = 4` dias completos (CLAUDE.md, WP4.17). É tarde demais para separar quem fica de quem sai em D1; serve como marco de **retenção**, não de ativação.
- `first_task_done` sozinho é fraco: o `TASK_STEP` do tutorial obriga criar a 1ª atividade (`canFinish = effectiveCount > 0`), então quase todo mundo que termina o onboarding cria uma; concluir é o gesto voluntário.
- "2 de 4 dias" é a menor repetição que distingue "testei" de "estou usando", e é o que o `WeekLedger` já conta.

**Como validar (quando houver 30+ instalações):** cruzar `retained.d7` contra `first_task_done` e `day_active` dos primeiros dias — só é possível por aproximação de janela (sem coorte). Se `first_task_done / install` for alto (>70%) e `retained.d7 / install` baixo (<20%), a 1ª tarefa **não** é ativação e o candidato seguinte é `evolve.level_1` — que **precisa de emissor** (§2.1).

**Pedido ao `alpha-insights`:** emitir `evolve {level}` no `handleEvolve` (dono da regra, `App.tsx`) e `milestone {level}` na `MilestoneCeremony`. Schema já aceita nos dois lados; é só fiação.

---

## 4. Canais

### 4.1 O que o projeto já considerou

| Canal | Onde | Status |
|---|---|---|
| TikTok/Reels/Shorts com o reveal do Oráculo | `PLANO-PRODUTO.md` Parte 5 ("~10 vídeos de reveal, medindo visualização → instalação"); review growth §"Canais" (5 formatos) | Planejado, nunca executado. **Pré-requisito de medição não existe** (UTM). |
| Comunidades de v-pet (`r/virtualpets`, Discords) | review growth G9 | Recomendado; abordagem "showcase", não link. |
| `r/ADHD`, `r/getdisciplined`, `r/productivity` | review growth tabela §2 | "Só participar, nunca divulgar sem convite". |
| `r/digimon`, `r/tamagotchi` | review growth | **Não postar** (PI). Dono manteve nomes em 21/09 — a régua de `narrativa.contract.test.ts` continua proibindo `tamer`/`digievolução`/`mundo digital` em copy. |
| Product Hunt / HN | review growth G12 | "Só depois de retenção medida". |
| Criadores de nicho | review growth §4 | Depende de cartão compartilhável (G4). |
| Mídia paga | review growth §6 | Bloqueada por gatilho: D1≥40%, D7≥25%, D30≥12% em coorte ≥300. |
| PWA + APK direto antes da loja | review growth G8 | Recomendado. **É o caminho do primeiro usuário.** |
| Steam | `PLANO-DESKTOP-STEAM.md` | Plano completo; bloqueado por conta/US$100/arte. |
| Web Share (cartão de evolução) | review growth G4/V1 | Recomendado, **0 linhas de código**. |

### 4.2 Nunca considerado

- **itch.io** — 0 menções. Para um v-pet pixel-art com build Electron pronto (`npm run dist:steam` → 274 MB), é a loja de custo zero, sem revisão, com público exatamente de "jogo indie estranho". Cabe como teste de *demanda* antes dos US$100 da Steam.
- **Web Share nativo do link** (`navigator.share({url})`, sem imagem) — trivial, nunca citado.
- **Landing/perfil público da criatura com OG image** (V2 da review) — citado uma vez, nunca planejado.

### 4.3 Experimentos falseáveis — só onde a instrumentação existe

**Regra:** experimento sem critério de morte não entra. Experimento sem evento que o meça vira pedido ao `alpha-insights`.

**E0 — "Dez conhecidos, 14 dias" (o único que pode rodar hoje)**
- Hipótese: o produto retém quem chega com contexto (amigo do dono).
- Canal: link direto da PWA para 10 pessoas que o dono conhece, com o pedido "usa 2 semanas".
- Métrica primária: `retained.d7` / `install` (aproximação de janela — com ≤10 pessoas a leitura é manual: `tools/metricsReport.mjs` sobre `m:2026-XX-XX`).
- Efeito mínimo que importa: **≥4 de 10 com `retained.d7`** e **≥3 de 10 com `week_active.goal_days ≥ 4`** na semana 2.
- Sinal de morte: `first_task_done < 6/10` (o onboarding perde antes da 1ª tarefa) **ou** `retained.d7 ≤ 2/10`. Se morrer, **nenhum canal entra** — volta para produto (`alpha-product-manager`: onboarding de 8 telas, `PLANO-PRODUTO.md` Parte 0).
- Guardrails: nenhum push além dos 3 do cron; nenhum texto novo para o usuário sem `alpha-compliance`.
- Duração: 14 dias. Custo: 0.
- **Pré-requisito único:** `METRICS_ADMIN_KEY` (dono) — sem ela, o experimento roda às cegas e não é experimento.
- Instrumentação: ✅ `install`, `onboarding_step`, `first_task_done`, `day_active`, `week_active`, `retained`, `welcome_back`.

**E1 — Post showcase em `r/virtualpets` (e 1 Discord de v-pet)**
- Hipótese: a comunidade de v-pet instala e chega à 1ª tarefa em taxa comparável a E0.
- Métrica primária: `install` no dia do post vs. média dos 7 dias anteriores; `first_task_done / install` no mesmo dia.
- Efeito mínimo: ≥20 `install` extras em 48h e `first_task_done / install ≥ 50%`.
- Sinal de morte: <10 installs em 48h **ou** `onboarding_step.demo.<REGISTER>` ≥ 50% abaixo do passo anterior (o e-mail obrigatório mata o tráfego frio — tela 6 da contagem medida em `PLANO-PRODUTO.md`).
- Guardrails: regras de autopromoção do sub; sem citar marcas de terceiro; sem "inspirado em".
- Instrumentação: ⚠️ **parcial**. Sem UTM, a atribuição é por *pico de dia* — aceitável para 1 post isolado, inútil para 2 canais na mesma semana. **Pedido ao `alpha-insights`: `app_open.source` ganhar um balde `link {campaign 0–9}` lido de `?c=` na URL** (inteiro, sem texto — respeita a allowlist). Sem isso, E1 e E2 não podem rodar na mesma janela.
- Só depois de E0 não morrer.

**E2 — 10 vídeos de reveal do Oráculo (TikTok/Reels), o teste da Parte 5 do plano**
- Hipótese: o reveal é conteúdo nativamente viral e converte view → install.
- Métrica primária: `install` atribuído (exige `?c=`), taxa view→install.
- Efeito mínimo: ≥1 vídeo com >10k views **e** ≥0,3% view→install (30 installs por 10k).
- Sinal de morte: 10 vídeos, nenhum acima de 2k views, ou views altas com `install` plano (o conteúdo entretém e não converte — então é canal de marca, não de aquisição).
- Guardrails: o reveal mostrado tem que ser o de produção (não mock); nenhuma menção a franquia; o vídeo não promete geração de sprite se `reveal_seen.demo.sprite_no` for majoritário (a promessa tem que ser verdadeira — `has_sprite` mede isso hoje).
- Custo: ~1h/dia útil do dono por 4 semanas — **a pergunta 2 da review de 03/08 ("você tem essa hora?") continua sem resposta.**
- Instrumentação: ❌ bloqueado por UTM. ⚠️ e pela **capacidade** do dono.

**E3 — Cartão de evolução compartilhável (Web Share)**
- Não é experimento de canal, é produto. Vai para o `alpha-product-manager`. Pré-condição: `evolve` emitido (§3), e evento novo `share {kind}` no schema. Efeito mínimo declarado na review (≥15% das evoluções geram share) é hipótese sem base — manter como meta de trabalho.

**Não propor agora:** Product Hunt (uma estreia só; sem retenção medida), mídia paga (gatilho numérico), Steam/itch.io (E0 primeiro; itch.io fica como próximo teste barato de demanda depois de E1).

---

## 5. Retenção / reativação existente no código

| Mecanismo | O que dispara | Quando | Evidência | Lacuna |
|---|---|---|---|---|
| **Push agendado (cron)** | 3 pushes/dia, PT/EN, condicionados no cliente (20h) ou no worker | `PUSH_HOURS_BRT = [10, 16, 22]` (`functions/api/_pushCopy.js`); `workers/wrangler.toml` `crons = ["0 1 * * *","0 13 * * *","0 19 * * *"]` (UTC = 22h, 10h, 16h BRT); paridade travada por `workers/pushCopy.parity.test.js` | Dois canais: Web Push VAPID (`functions/api/subscribe.js` + `public/sw.js` + `workers/webpush.js`) e FCM (`workers/fcm.js`, só APK). Deploy **manual** (`wrangler deploy` em `workers/`). | O worker precisa estar deployado com `SEASON_ADMIN_KEY` (STATUS §3.2 🟡). **Não verifiquei se o worker está no ar** — só o dono vê o painel. `push_optout` é medido; abertura por push é medida (`app_open.push`) → a razão `app_open.push / day_active` é a métrica declarada para cortar push. |
| **Push das 20h (`eveningCopy`)** | Só se a meta do dia não foi cumprida; cede se há janela de descanso | Cliente (`NotificationManager`), texto em `_pushCopy.js` | — | Condição no cliente = só dispara com o app aberto/em background recente. |
| **Lembrete de deitar** | 30 min antes da janela de descanso | `sleepReminderAt` (`utils/restWindow.ts`), copy `sleepReminderCopy` | Hora de cada pessoa, não do cron | Doc `PLANO-MELHORIAS` rodada 4 listou `sleepReminderAt` como "sem consumidor" — não reconferi se ganhou emissor. |
| **Perdão por ausência** | ≥2 dias fora não cobra coração | `ABSENCE_FORGIVENESS_DAYS` (CLAUDE.md ❤️) | Regra de dado | É a tese anti-cobrança; a métrica que a testa é `welcome_back` × `after_bad_day`. |
| **Reencontro por faixa** | Fala do pet ao voltar, 4 faixas (0 / 2–4 / 5–14 / 15+ dias) | `src/utils/welcomeBack.ts` `absenceBucket`, `welcomeBackLine`; emissor de `welcome_back` em `App.tsx` | Frases revisadas em 21/09 (sem "esperando") | Colapsar as faixas é pendência do dono (P2). |
| **Dia de folga automático / escudo** | Absorve a 1ª perda da semana; escudos consumidos sozinhos | `REST_DAYS_PER_WEEK`, `applyMissedDay` | `shield_used` medido | — |
| **Fresh start** | Segunda ou dia 1 zera `postponedCount` | `applyFreshStart` (`utils/rituals.ts`) | — | Não medido (sem evento) — aceitável. |
| **Widget Android** | Faixa `habit_steady`, sem placar | `widgetSemCobranca.contract.test.ts` | Só APK | `app_open.widget` é rótulo sem emissor confirmado. |

**O que falta na reativação:**
1. **Push de reengajamento por ausência** não existe: os 3 pushes são de horário fixo, iguais para quem abriu hoje e para quem sumiu 20 dias. O worker não sabe a idade da ausência (só `ageDays` do save, se é que chega — não verifiquei `push-scheduler.js`). Antes de propor: é comunicação ao usuário → `alpha-compliance`, e a bíblia proíbe "esperando"/balanço.
2. **E-mail** — zero. O `REGISTER` coleta e-mail (saveId = SHA-256 do e-mail), mas não há envio de nada. Firebase Auth por link de e-mail é o único uso.
3. **Nenhum mecanismo de retorno mede se o push que trouxe virou `day_active`** — a leitura está desenhada (`app_open.push` vs `day_active`) mas depende de `METRICS_ADMIN_KEY`.

---

## 6. Bloqueadores reais de lançamento — em ordem, com dono

Cruzado com `docs/STATUS.md` §3.2 e `docs/PLANO-DESKTOP-STEAM.md` §7. "Lançamento" aqui = **primeiro usuário real medido**, não "publicar na Play". As duas listas divergem, e a ordem importa.

### 6.1 Para o PRIMEIRO USUÁRIO REAL (PWA, sem loja)

| # | Bloqueador | De quem | Evidência |
|---|---|---|---|
| 1 | **`METRICS_ADMIN_KEY` no Pages** — sem ela nada é legível; o experimento E0 não é experimento | **Dono** (painel Cloudflare) | `functions/api/metrics.js` `onRequestGet` → 404; STATUS §3.2 🟡 |
| 2 | **Worker de push deployado** (`wrangler deploy` em `workers/` + `SEASON_ADMIN_KEY`) | **Dono** (login wrangler) | CLAUDE.md "Push"; STATUS §3.2 🟡 |
| 3 | **OG/description em `index.html` + frase de posicionamento no `manifest.json`** — para o link não chegar "pelado" | Time (1h) | `Grep og: index.html` → 0 |
| 4 | **Decisão: quem são os 10 primeiros** | **Dono** | — |

Só isso. Com 1+2+3+4 o primeiro usuário real chega e é medido em 14 dias.

### 6.2 Para a PLAY (depois de E0 não morrer)

| # | Bloqueador | De quem | Evidência |
|---|---|---|---|
| 5 | Registrar `com.hexervoodoom.soulmon` no Firebase + `google-services.json` novo — **o build Android falha de propósito até isso** | **Dono** | `PLANO-DESKTOP-STEAM.md` §7 item 1 (verificado: `project_id: digiapp-88296`) |
| 6 | Gerar APK novo (WP0.6 `setObfuscatedAccountId`, WP5.8 preço localizado, WP2.6 widget) | CI, após 5 | STATUS §3.2 🟠 |
| 7 | 4 produtos no Play Console + conta de serviço (`GOOGLE_PLAY_SERVICE_ACCOUNT`, `ANDROID_PACKAGE_NAME`) | **Dono** | STATUS §3.2 🔴 |
| 8 | D1 `order_claims` vinculado (SEC-3) — "opcional" saiu; sem ele recibo → N contas | **Dono** (binding no painel) + migrations prontas | STATUS §3.2 🟠 |
| 9 | `PLAY_REQUIRE_ACCOUNT_BINDING=true` — **só depois** do APK de 6 publicado | **Dono** | STATUS §3.2 🔴 |
| 10 | URL da política (`/privacidade.html` existe) + formulário Data Safety (fonte: `docs/PLAY-DATA-SAFETY.md`) | **Dono** (console) | STATUS §3.2 🔴 |
| 11 | **Ficha da loja**: revisar Anexo A da review 03/08 (trocar `[NOME]`, "dia perfeito"→"dia completo", checar PvP), produzir 8 screenshots (roteiro A.5), feature graphic 1024×500, ícone 512 conferido a olho | Time + **Dono** (aprovação de arte) | §1 |
| 12 | `ASSETLINKS_*` no Pages (fingerprint do Play Console) | **Dono** | STATUS §3.2 🟡 |
| 13 | Decisão Fase 4 (Health Connect) — **não bloqueia**; conta de organização verificada seria bloqueador só se a Fase 4 entrar | **Dono** | STATUS §3.2 🟠 |

### 6.3 Steam — fora do caminho do primeiro usuário

Conta Steamworks + US$100, App ID/Depot, arte (7 tamanhos), preços, contradição §5d — tudo **dono** (`PLANO-DESKTOP-STEAM.md` §7 itens 7–11). itch.io seria o teste barato antes disso, e nunca foi cogitado.

---

## 7. Pedidos de handoff

**→ `alpha-insights`** (instrumentação; schema em dois arquivos com teste de paridade):
1. Emitir `evolve {level}` (`handleEvolve`) e `milestone {level}` (`MilestoneCeremony`) — schema já existe nos dois lados, só falta fiação. Sem isso a hipótese de ativação da §3 não é falseável.
2. `app_open.source` → novo balde `link` com `campaign` inteiro 0–9 lido de `?c=` (nunca texto). Sem isso, E1/E2 não são atribuíveis.
3. Evento `pwa_installed` (do `appinstalled` em `InstallPrompt.tsx`), sem props.
4. Ler o agregado de E0 com `tools/metricsReport.mjs` e devolver: `first_task_done/install`, `retained.d7/install`, `week_active.goal_days≥4 / week_active`, `app_open.push/day_active`.

**→ `alpha-product-manager`:**
1. Se E0 morrer em `first_task_done`, o alvo é a tela 6 (`REGISTER`, apelido + e-mail obrigatório) — é a única tela que nenhuma análise contou e a que mais mata tráfego frio. `onboarding_step.demo.<n>` diz exatamente onde.
2. Cartão de evolução compartilhável (Web Share) — única saída do ativo viral; depende do item 1 do `alpha-insights`.
3. `manifest.webmanifest` órfão na raiz: apagar.

**→ `alpha-compliance`:** qualquer push de reativação por ausência (não existe hoje) e qualquer OG description passam por vocês antes de entrar — a bíblia (`docs/NARRATIVA-E-UNIVERSO.md`) e `narrativa.contract.test.ts` travam vocabulário.

**→ Dono (decisões, não tarefas):** (a) `METRICS_ADMIN_KEY`; (b) worker de push no ar; (c) quem são os 10 de E0; (d) a hora/dia para o TikTok existe ou não (pergunta aberta desde 03/08); (e) trade-off de coorte por semana de instalação (declarado em `metrics.js`) — não decidir agora, só quando >100 usuários.

---

## 8. Onde esta análise é fraca

- Não abri `workers/push-scheduler.js` nem o Kotlin do widget — os rótulos `widget`/`shortcut` de `app_open` podem ter emissor nativo que não vi.
- Não conferi visualmente o `ic_launcher` nem os favicons; a suspeita de arte "D" do DigiApp vem de `docs/APK-BUILD-INFO.md`, que é histórico.
- Li só a 1ª metade (linhas 1–749 de 973) da review de growth de 03/08; a listagem en-US e o roteiro de vídeo podem estar na 2ª metade.
- Nenhum número deste relatório é medido em usuário — todos os efeitos mínimos são metas de trabalho, não previsões.
