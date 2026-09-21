# QA geral do Soulmon — 21/09/2026 — consolidado

> **Etiqueta:** registro · **Dono:** coordenador da sessão (`soulmon-coordenador`) ·
> **Pergunta da rodada:** *"Há algum ponto do projeto que ainda não foi analisado nem
> desenvolvido?"* — e, de quebra, o que está mentindo, o que está quebrado e o que só
> o dono pode decidir.
> **Método:** 19 frentes em paralelo (agentes globais `alpha-*`, os agentes e squads do
> repo interpretados inline, `Explore`), cada uma com relatório próprio nesta pasta
> (`01`…`16`), mais os portões rodados na base `212da7d5` e um passeio de runtime no dev
> server. Regra de toda frente: `caminho` + SÍMBOLO, número só com o comando ao lado,
> nada editado pelos agentes — quem editou foi o coordenador, e está listado no §3.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este relatório. Onde este
> relatório divergir do código, o código está certo.

---

## 1. Veredito em uma tela

1. **Portões verdes na base:** `tsc` ×3 = 0 · `vitest` 303 arquivos / 4223 testes / 1
   skipped · nenhum CRÍTICO de segurança novo (`04`).
2. **O produto está completo e ninguém pode comprá-lo nem ver o diferencial** (`08`):
   compra só via Play (não publicada), web não cobra, Steam não testada, e não existe
   rota de cortesia — o primeiro usuário real hoje é forçado a ser PWA-demo.
3. **Ninguém lê nada**: a métrica-norte está instrumentada de ponta a ponta (26 eventos,
   PII zero, paridade cliente/servidor travada) e a leitura responde 404 sem
   `METRICS_ADMIN_KEY` (`16`, `12`).
4. **Três mentiras legais estavam publicadas** (`11`) e foram corrigidas nesta rodada
   (§3): termos §4 PT vendia "cura na hora" e reroll "sorteado" (ambos removidos em
   06/09), a prova de consentimento gravava `PRIVACY_VERSION` de 25/08 para uma política
   de 08/09, e Higgsfield/Gemini recebiam o prompt do sprite (com texto livre do
   jogador) sem constar na política nem na ficha da Play.
5. **O que NUNCA foi analisado** está no §2 — 7 áreas sem dono nenhum no sistema de
   agentes (`13`), 12 temas arquiteturais sem ADR (`05`), `product/soulmon-01/**` (30
   arquivos) fora do índice do manual (`01`), Kotlin e `desktop/electron/*` com zero
   teste (`15`), leitor de tela/teclado nunca medidos (`06`).
6. **Docs que mentem e foram apanhados**: STATUS §3.2 dizia que não há binding D1 (há);
   `desktop/electron/main.js` dizia "ainda aponta pro Pages" sobre a URL do worker;
   ledger dos guardas tem 2 falsos positivos (WP1.14, WP3.4) e 8 comandos de aceite que
   apontam para símbolo inexistente (`09`); `INVENTARIO-TELAS.md` cita 3 componentes que
   não existem (`10`).
7. **Linha vermelha em conflito interno** (`09`): a #20 (chaves do widget só se
   acrescentam) é contradita por `src/plugins/widgetSemCobranca.contract.test.ts`, que
   exige `remove()` — decisão de guarda sem parecer em `vetos.md`.
8. **Sistema de agentes inflado**: 64 agentes, 15 só existem no `.md`, 11 são cópia byte
   a byte do global, 5 "críticos" para a mesma pergunta; proposta 64 → 37 (`13`) — é
   decisão do dono.
9. **`dist/` commitado pesa 123 MB / 3.016 arquivos, 100 MB são PNG que o `sw.js` nunca
   serve** (já troca por WebP); JS de entrada 624 KB; 38 dependências sem import (`05`,
   `06`).
10. **Fila do dono cresceu 27 perguntas** (§5) — todas com provisório aplicado; nada
    ficou parado esperando.

---

## 2. O que NUNCA foi analisado ou nunca foi desenvolvido

Só entra aqui o que **nenhum** plano, squad, guarda, ADR ou doc-dono cobre. Cada linha
diz quem deveria ser o dono e o que a primeira análise custaria.

### 2.1 Superfícies e código sem dono

| # | Área | Prova | Dono proposto | Primeira análise |
|---|---|---|---|---|
| A1 | **Operação do que está no ar** — deploy manual do worker de push, migração D1 (`wrangler d1 migrations apply`), secrets do painel, `CACHE_VERSION`, incidente em produção | `13` §3: 0 despachos; `15` §C: `e90f05a6` não é SHA do git (é id do Cloudflare), `08-INTEGRACOES` diz "não deployado" e `PERGUNTAS-DO-DONO` diz "deployado" | N1 `soulmon-operador` (`13` §8.5) | runbook "git × ar": `wrangler deployments list`, `wrangler d1 migrations list`, tabela de secrets esperados × existentes |
| A2 | **`android/` como código** — 5 providers de widget + `WidgetRenderer.kt`, `WidgetRefreshWorker`, Gradle, `billing-ktx:6.2.1`, `targetSdk 35` | `15` §B: 0 testes Kotlin, 4 guards textuais; `CHAT_FIXED_PHRASES` 9 frases só em EN incluindo "I missed you!" (viola L11 da bíblia) | N2 `soulmon-guarda-plataforma` | unit de `WidgetRenderer`; conferir Billing ≥ 7 e target 36 contra a política vigente da Play |
| A3 | **`desktop/electron/*`** — `main.js`, `menu`, updater | `15` §A: 0 testes; Electron 33.4 fora de suporte desde abr/2025; instalador sem assinatura; `desktop-*.yml` nunca roda vitest | N2 | testar `navigationPolicy`/`updatePolicy` em node; decidir bump do Electron |
| A4 | **`scripts/`** (23 scripts) | `05` §5: 5 órfãos com 0 referências; `03`: 0 testes, fora do `tsc`; `13`: sem dono | `squad-docs` (inventário) + N1 | apagar os 5 órfãos; listar os restantes no `05-ARQUITETURA.md` |
| A5 | **`product/soulmon-01/**`** (30 arquivos: sweeper 1–9, ui/align 1–6, balance) | `01` §4.1: não citado uma vez em `00-MAPA.md`; `balance/carga-diaria.md` é fonte viva da P5 | `doc-bibliotecario` | indexar no MAPA §6 como registro ou mover para `historico-digiapp/` |
| A6 | **`squad-alpha-runs/`** (ADRs 001–003, ROADMAP, runbooks de som) | `.gitignore` os exclui; `05` §8: 3 ADRs, nenhuma no git; o ROADMAP fora do git ainda descreve `authorizeSaveAccess` como fail-open em produção — **falso** desde `FIREBASE_PROJECT_ID` em `wrangler.jsonc` (conferido nesta rodada) | dono decide (é fora do git por escolha) | promover as 3 ADRs para `docs/adr/`; apagar ou datar o ROADMAP |
| A7 | **Supabase residual** — `src/supabase/functions/server/` commitada sem build/teste/typecheck | `05` D15; `04`: JWT anon no histórico, edge function sem `verify_jwt` | `alpha-security` + N1 | decidir apagar ou mover; confirmar se o projeto do JWT vazado é o mesmo do `SUPABASE_PROJECT_ID` |
| A8 | **i18n EN como disciplina** | `13`: sem dono; `15` §E: `i18nSemPtSozinho.contract.test.ts` trava só `aria-label/placeholder/title` e toasts, não texto JSX nem widget/desktop | `copy-redator` fora da squad-narrativa | estender a régua a JSX; revisar EN do widget e do overlay |
| A9 | **Acessibilidade medida** (leitor de tela, teclado, foco) | `06` §4 e item 10: só grep estático; nada percorre uma tarefa ponta a ponta | `alpha-perf-a11y` | sessão com NVDA: onboarding → 1ª tarefa → check-in |
| A10 | **Orçamento de performance** | `06` §6: não existe; `05` §10.4 | `alpha-perf-a11y` | adotar a proposta do `06` (JS entrada ≤ 250 KB, CSS ≤ 100 KB, cenário ≤ 400 KB, vídeo ≤ 800 KB) como decisão do dono |
| A11 | **Custo/orçamento em dinheiro** (R$/mês, créditos Higgsfield/Gemini/Groq) | `13`: `tech-feasibility` nunca produziu; A/B do som travou por 0,45 crédito sem ninguém vigiar | coordenador + tabela em `docs/` | tabela saldo × limites, atualizada a cada geração |
| A12 | **Repos irmãos** (`sync-irmaos.yml`, `SIBLING_REPOS_TOKEN`) | `13`: "falha toda segunda e ninguém olha" | N1 | — |

### 2.2 Temas de arquitetura sem decisão registrada (`05` §10)

Workers+Static Assets vs Pages · um namespace KV para tudo · concorrência de escrita no
save (celular + desktop) · estratégia de estado no cliente (`GameState` com 110 campos)
· Firebase Auth como identidade única · FCM + Web Push convivendo · política de
binários (`dist/`, `src/assets/`, `public/sounds/`) · minijogos como subsistema (regra de
combate dentro de `ArenaGame`/`DungeonGame`/`NightmareBattle`) · versionamento do esquema
do save (`soulmon_state_v1` só tem `?? padrão`).

### 2.3 Temas de produto que nenhuma rodada olhou (`08` §2.a)

Anúncios recompensados no código (`grantAdReward`, `ADS_ENABLED`) contra o briefing "sem
anúncios" · muro 18+ (`MIN_AGE_YEARS`) contra a persona adolescente · PII de nascimento +
astrologia (efeito Barnum, LGPD, categoria "saúde" na Play) · zero `navigator.share` ·
zero canal de feedback in-app · cold start social · sem prazo/lembrete por tarefa · sem
domínio/landing · `PLANO-PRODUTO` Parte 3 manda "priorizar funil web" e a web não cobra ·
desvio da Parte 5 ("só telemetria + distribuição", 19/08) nunca registrado como decisão.

### 2.4 Distribuição (`12`)

`index.html` tinha 0 `og:`/`description` (corrigido, §3) · `manifest.json` com copy do
fork · ficha da Play só como rascunho com `[NOME]` na review de 03/08 · 0 screenshots
válidos, 0 feature graphic · origem de aquisição (UTM) não instrumentada · itch.io e Web
Share nunca cogitados · ativação não definida.

### 2.5 Guardas: o que cada um nunca auditou (`09` §3)

`petVoice.ts` (vínculo, mudado em 21/09 sem guarda) · `useDailyReset.ts`/`playerDay.ts`
(constância) · `billing.js`/`_entitlements.js`/`_aiGuard.js` (sustento) ·
`arena.ts`/`RebirthModal.tsx`/`achievements.ts` (permanência) ·
`generate-sprite.js`/`GameTutorialFlow.tsx`/portão `ff3e48e1` (nascimento) ·
`_redact.js`/`account.js` (medição) · `functions/api/transcribe.js` por guarda nenhum.

### 2.6 Squads temáticas: pontos cegos (`10` §d)

Narrativa: guard cobre só `src/**`; `WidgetRenderer.kt` e `_pushCopy.js` nunca passaram
pelo narrative-critic. Som: `SettingsModal` **não é órfão** (abre por
`handleOpenAISettings` → `ChatBox`), é duplicata do mudo. Arte: ~1.720 imagens em
`src/assets/` sem linha de procedência em `Attributions.md`; ~150 arquivos sem referência.
Design: `.sm-px-*` em 14 `.tsx`; `OraclePage`/`PixelizerCard` no bundle e inalcançáveis;
tema claro só no `Main` de cada fluxo.

---

## 3. O que foi corrigido nesta rodada (commit desta sessão)

| Arquivo | O quê | Origem |
|---|---|---|
| `public/termos.html` | §4 PT: Créditos = Nova Leitura (saiu "curar na hora" e "sorteada"); §3 PT/EN: idade por autodeclaração + data no caminho do mapa astral; carimbo 21/09/2026 | `11` |
| `public/privacidade.html` | §2b PT: histórico da conversa e nome da criatura também vão ao provedor; **§2b EN não existia** e foi criado; §6 PT/EN: linha de Higgsfield + Google Gemini (prompt do sprite, campo "criatura favorita" e Renascimento); carimbo 21/09/2026 | `11` |
| `src/utils/consent.ts` + `src/utils/consent.versoes.contract.test.ts` (novo) | `TERMS_VERSION`/`PRIVACY_VERSION` = `2026-09-21`; régua que lê "Última atualização"/"Last updated" dos dois HTMLs e reprova se divergirem da constante | `11` |
| `src/index.css` | `.sm2-chat-support` 11px → **12px** (piso absoluto do `04-IDENTIDADE-VISUAL.md` §4.3; o guard da escala só olhava `--sm2-text-*`) | `06` |
| `index.html` | `meta description` + Open Graph (`og:title/description/image/locale`) + `twitter:card` | `12` |
| `desktop/electron/main.js` | comentário "ainda aponta pro Pages" acima da URL do worker → texto verdadeiro com a régua `src/deploy/appUrl.contract.test.ts` | `15` |
| `docs/STATUS.md` §3.2 | linha do D1: o binding `DB` → `soulmon-billing` **existe**; o que falta provar é a migração aplicada | `04`, `05` |
| `.claude/hooks/session-start.sh` | o briefing lia um bloco fixo de 09/09 do STATUS; agora conta as perguntas de `docs/PERGUNTAS-DO-DONO.md` e aponta a última seção | `13` R5 |
| `.claude/commands/implementar-wp.md` | portão ganhou `npx tsc -p tsconfig.server.json --noEmit` | `13` R4 |
| `.github/workflows/android-build.yml` | sai `version-b` (branch do DigiApp) | `13` R7 |
| `.claude/skills/soulmon-coordenador/SKILL.md` | tabela: `squad-som`/`squad-arte` são skills (não há command); linhas novas para bytes/perf/a11y, legal/compliance e "git × ar" (sem dono, aponta N1); S1..S16 | `13` R2/R3 |

Não foi tocado, de propósito: `CLAUDE.md` (só o dono autoriza — D31 continua aberta), o
roster de agentes (decisão do dono), qualquer regra de jogo, `dist/`.

---

## 4. Achados por frente — o essencial (cada relatório tem o resto)

| Frente | Relatório | 3 linhas |
|---|---|---|
| Cobertura dos planos | `01-dossie-cobertura.md` | Todos os `PLANO-*` visados estão FEITOS e espelhados no manual; `docs/PLANO-MELHORIAS.md` é o único com progresso vivo; `PROJETO.md` e `PLANO_MELHORIAS.md` (raiz, sem hífen) são fósseis DigiApp — risco real de abrir o errado. |
| Inventário de código | `02-inventario-codigo.md` | Ver o relatório (módulos sem teste/sem doc, exports mortos, TODOs, vestígios DigiApp). |
| Suíte de testes | `03-suite-testes.md` | 304 arquivos; 30 de 39 contract tests são grep de fonte (presença de string, não comportamento); sem teste: `auth.ts` › `sendLoginLink`/`completeLoginFromLink`/`startDesktopAuthBridge`/`traduzErroAuth`, `accountData.ts` › `downloadExport`/`confirmDelete`, `workers/webpush.js`/`fcm.js` por nome, `sw.js` › `push`/`notificationclick`; o hook de sessão **não é portão** (nunca falha); orçamento de tempo desconhecido (baseline de 27/08 com 57% da suíte). |
| Segurança | `04-seguranca.md` | Nenhum CRÍTICO; ALTO latente = `isPlayPurchaseBoundTo` aceita compra sem vínculo sem `PLAY_REQUIRE_ACCOUNT_BINDING`; MÉDIOS: `/api/transcribe` sem auth, CSP `img-src https:`, torneio forjável (`attrs`/`stage` auto-declarados em `community.js`), `"*"` em `clsx`/`hono`/`tailwind-merge`, JWT anon do Supabase no histórico; BAIXOS: `saveId` inteiro em log de `save.js`, `request.json()` sem teto, `google-services.json` do `digiapp-88296`, `allowBackup="true"`. |
| Arquitetura | `05-arquitetura.md` | `App.tsx` 6.149 linhas / 62 `useState` / 80 `setGameState`; 5 extrações propostas; `GameState` 110 campos; save `put` cego sem `revision`; 38 deps sem import; `dist/` 123 MB com 100 MB de PNG morto; 16 dívidas classificadas; 12 temas sem ADR. |
| Perf e a11y | `06-perf-a11y.md` | JS de entrada 624 KB, 27 `React.lazy`, 50 chunks; 10 cenários de 2,6–3,4 MB cada; `evolution-bg.mp4` 3,7 MB; 0 `loading="lazy"`; contraste dos tokens ≥ 5,3:1; orçamento proposto; leitor de tela não medido. |
| Design system | `07-design-system.md` | 1.034 `style={{` em 87/167 componentes; 45 `#hex` em 14 arquivos; 25 `!important`; 23 valores de z-index sem token (escala 0..300 já implícita em `index.css`); scaffold shadcn (`--background`/`.dark`) ainda declarado. |
| Produto (maestro) | `08-produto-maestro.md` | 1 rodada em 7 semanas; top 10 para o 1º usuário: definir os 10 → rota de cortesia → `METRICS_ADMIN_KEY` + script → feedback in-app → aviso de WebView velho → walkthrough gravado → compartilhar `BirthCard` → congelar Camada 3 → decidir ads → domínio + landing. Play fica **depois**. |
| Guardas | `09-guardas.md` | 87 WPs (não 86): 78 FEITO, 7 IMPLEMENTADO, 2 RECUSADO; falsos positivos WP1.14 e WP3.4; 8 comandos de aceite mortos; 4 das 9 linhas "só tese" já têm teste; #20 em conflito com `widgetSemCobranca`; `achievements.ts` › `'tasks-100'` é recompensa por contagem (#16); `tasksDone` gravado no perfil sem consumidor. |
| Squads temáticas | `10-squads-tematicas.md` | Narrativa 5/5 verde, 10 propostas abertas (P13/P14 já feitas sem fechar o doc); som: A/B não ouvido, `SettingsModal` duplicata; arte: 1.720 imagens sem procedência; design: 14 canvases têm código, `.sm-px-*` em 14 arquivos, `INVENTARIO-TELAS.md` apodreceu. |
| Compliance | `11-compliance.md` | Ver §1.4 e §3; ficam para o dono: rótulo de IA na loja, token FCM como "ID de dispositivo", push que sobrevive à exclusão, retenção `ord:` 5 anos, re-aceite ao subir `TERMS_VERSION`, cláusula de crise nos termos, `Attributions.md` para Material Symbols/Fredoka/Rubik/arte de IA. |
| Growth | `12-growth-distribuicao.md` | Funil instrumentado (`install` → `week_active` → `retained` D1/D7/D30); sem UTM, sem `share`, sem instalação de PWA medida; único experimento viável: E0 "10 conhecidos, 14 dias, PWA" com morte em `first_task_done < 6/10` ou `retained.d7 ≤ 2/10`; 4 bloqueadores para o 1º usuário (3 do dono), 13 para a Play. |
| Governança | `13-governanca-agentes.md` | 64 agentes → 37; 7 áreas sem dono; hook lia bloco velho (corrigido); portões divergem entre `/implementar-wp`, hook e CI; skills globais `cloudflare`/`wrangler`/`web-perf` nunca citadas. |
| Verificação de docs | `14-docs-verificacao.md` | `CLAUDE.md`: 7 afirmações falsas com dano — Coraçãozinho "à venda por 150" (2×, `SHOP_ITEMS` não tem `kind:'heart'`), "cura instantânea (10)" (`HEART_COST_CREDITS` ⚰️), canal `digiapp_push` (é `soulmon_push`), `DigiWidgetPlugin` (é `SoulmonWidgetPlugin`), `canPvp` (é `meetsPvpBond`), tabela `DÍVIDA` (D31); 2 refs `arquivo:linha`; "17 documentos" (são 18). ~100 constantes numéricas conferidas batem TODAS — o apodrecimento é em nomes e regras, não em números. Raiz: `README.md`, `PWA-SETUP.md`, `PWA-CHECKLIST.md`, `PROJETO.md`, `PLANO_MELHORIAS.md` são fósseis DigiApp sem lápide. 12 caminhos em crase fora do manual apontam para arquivo inexistente e nenhum guard vê. Guards do manual: 2 files / 10 tests verdes. |
| Superfícies secundárias | `15-superficies-secundarias.md` | Desktop: `exp:0` = "nunca expira" travado como esperado; Electron 33 sem suporte; CI desktop sem vitest. Android: `google-services.json` do DigiApp faz o build passar **sem FCM**; `android-build.yml` verde sem AAB; strings do widget só EN; canais de notificação PT/EN misturados. Workers: deploy manual, versão no ar desconhecida. CI: nenhum gate roda `npm run build`; `docs-sync.yml` usa action por tag móvel com `contents: write`. |
| Métricas | `16-metricas-insights.md` | Métrica-norte = peso de esforço/usuário ativo/semana (`summarizeNorthStar`); 26 eventos = 26 da política; guardrail de IA forte (`_aiGuard.js` › `AI_LIMITS`); faltam `save_failed`, crash, tempo de carga, entrega de push; só 2 das 5 fronteiras do STATUS §5 têm contract test. |

---

## 5. Fila do dono (nova, numeração continua de `docs/PERGUNTAS-DO-DONO.md`)

Provisório = o que fica valendo até ele responder. Registradas também em
`docs/PERGUNTAS-DO-DONO.md`.

| # | Pergunta | Provisório | Se mudar |
|---|---|---|---|
| 11 | Quem é o primeiro usuário real? (a) 10 conhecidos, PWA, cortesia, 14 dias · (b) estranhos via TikTok · (c) esperar a Play | (a) | (b) exige landing + domínio + vídeo; (c) adia meses |
| 12 | Rota de cortesia (tier pago sem compra) pode existir, com `ADMIN_KEY` + teto de N contas, `provider:'courtesy'`? | Sim — squad implementa quando autorizada | Sem ela o 1º usuário só vê demo |
| 13 | Congelar Camada 3 (Steam, coop, som, arte extra, narrativa) até 10 usuários × 14 dias? | Congelar e registrar no `REGISTRO` | Registrar o contrário — o que não pode é drift sem registro |
| 14 | Anúncios recompensados (`ADS_ENABLED`, `grantAdReward`): apagar com lápide ou manter desligado? | Apagar | Se manter: `PLAY-DATA-SAFETY.md` ganha seção de ads |
| 15 | 18+ é ICP ou só defesa legal? | ICP; remover a persona adolescente dos check-ups | Menores = LGPD art. 14 + Play Families |
| 16 | Domínio próprio: qual, e compra agora? | Comprar agora | Sem domínio, TikTok aponta para `workers.dev` |
| 17 | Cobrança na web (Pix/cartão) antes ou depois da Play? | Depois do 1º usuário; corrigir `PLANO-PRODUTO` Parte 3 | "Nunca" = apagar "priorizar funil web" |
| 18 | `METRICS_ADMIN_KEY`: você define hoje? | Definir; script de leitura vem junto | Sem ela o 1º usuário gera dado invisível |
| 19 | Aviso de WebView velho por `CSS.supports` agora? | Sim | Fica parado até decidir `minSdk` |
| 20 | Trava de crise do chat: revisão por profissional antes do 1º usuário? | 1 h de revisão | Registrar risco assumido no `REGISTRO` §14.2 |
| 21 | Token FCM / endpoint Web Push entra em "IDs do dispositivo" na ficha da Play? (`PLAY-DATA-SAFETY.md` §2.7 diz "não" sem fonte) | Ficha diz "não" | Subdeclaração = risco de remoção |
| 22 | Existe exigência da Play/Steam de declarar conteúdo gerado por IA (sprites, chat, áudio)? O repo não documenta a regra | Nada declarado, sem aviso in-app | Bloqueia ficha e eventual aviso |
| 23 | Push que sobrevive à exclusão da conta (`push:*`/`fcm:*` fora do alcance de `account.js`): corrigir no código ou declarar na política? E a retenção de `ord:` por 5 anos entra na política §8? | Código atual; política silenciosa | Política promete mais do que o sistema apaga |
| 24 | Termos §10 prometem aviso in-app antes de mudança relevante: re-aceite (nova caixa + `ConsentRecord`) ou banner? — **já vale**: `TERMS_VERSION` subiu hoje | Sem mecanismo; save antigo segue válido (`normalizeConsent`) | Define o fluxo de cada bump |
| 25 | "R$ 29,90" fixo nos termos EN quando a Play cobra em moeda local (WP5.8) | Mantido (travado por `publishedPrice.test.ts`) | Texto |
| 26 | `Attributions.md`: cobre deps npm (`astronomy-engine`, `@capgo/capacitor-pedometer`)? E as 3 fontes (Material Symbols Rounded, Fredoka, Rubik) + arte de IA ganham linha no mesmo formato do áudio? | Só arte/som/Silkscreen; fontes e arte de IA sem linha | Escopo do doc |
| 27 | Redação oficial da cláusula de crise/IA nos termos §8 (o chat é modelo sem revisão humana; não é serviço de emergência; canais curados de `chatSafety.ts`) | Nenhuma | Termos descompassados do produto desde 21/09 |
| 28 | Roster de agentes 64 → 37 (`13` §8): cortar 9 genéricos + `prod-squad` do repo + 12 do maestro, fundir 6 `arte-*`, criar `soulmon-operador` e `soulmon-guarda-plataforma`? | Nada cortado; tabela do coordenador já aponta os globais | Mantém 15 agentes que só existem no `.md` |
| 29 | Linha vermelha #20 × `widgetSemCobranca.contract.test.ts` (`remove()` de chaves vetadas): #20 ganha a exceção "chave vetada por outra proibição" ou o teste volta? | Teste fica; exceção não registrada em `vetos.md` | — |
| 30 | `achievements.ts` › `'tasks-100'` (recompensa cosmética por contagem de tarefas, #16): renomear para comportamento ou registrar exceção? | Fica | — |
| 31 | Orçamento de performance (`06` §6): JS entrada ≤ 250 KB, CSS ≤ 100 KB, cenário ≤ 400 KB, vídeo ≤ 800 KB — adota como régua? | Sem orçamento | Sem número, a squad-arte instala sem teto |
| 32 | `dist/`: apagar os PNG após a conversão WebP (100 MB de peso morto que o `sw.js` nunca serve) e só depois discutir tirar `dist/` do git? | Como está | Pack de 553 MiB continua crescendo |
| 33 | 38 dependências sem import (26 `@radix-ui/*`, `hono`, `recharts`…): remover + guard "todo pacote tem import"? | Como está | Supply chain sem uso |
| 34 | Electron 33.4 (sem suporte desde abr/2025): bump agora ou junto com o Steam? | Como está | — |
| 35 | ADRs 001–003 (fora do git em `squad-alpha-runs/`): promover para `docs/adr/`? E o ROADMAP de lá, que ainda descreve o fail-open como aberto, apagar ou datar? | Fora do git | A única descrição de 3 decisões de infra vive numa pasta que não versiona |
| 36 | `product/soulmon-01/**` (30 arquivos fora do índice): indexar como registro ou mover para `historico-digiapp/`? | Fora do índice | — |
| 37 | `SettingsModal` (duplicata do mudo, aberto via `handleOpenAISettings`): remover? | Fica | — |
| 38 | **`CLAUDE.md`** — autoriza corrigir as 7 afirmações falsas de `14` (Coraçãozinho "à venda por 150", "cura instantânea (10)", `digiapp_push` → `soulmon_push`, `DigiWidgetPlugin` → `SoulmonWidgetPlugin`, `canPvp` → `meetsPvpBond`, `DÍVIDA` → `EXCECOES` (D31), "17 documentos" → 18) e as 2 refs `arquivo:linha`? | Nada tocado (só o dono edita o `CLAUDE.md`) | Um commit de docs com cada correção conferida por grep |
| 39 | Fósseis da raiz (`README.md`, `PWA-SETUP.md`, `PWA-CHECKLIST.md`, `PROJETO.md`, `PLANO_MELHORIAS.md`, `index.html.example`, `manifest.webmanifest`, `registerSW.js`): apagar, ou mover para `docs/historico-digiapp/` com lápide? | Como está | Uma sessão nova abre `PLANO_MELHORIAS.md` achando que é `docs/PLANO-MELHORIAS.md` |

---

## 6. Backlog que a squad executa sem o dono (ordem sugerida)

1. **Rota de leitura de métricas**: `scripts/metrics-report.mjs` pronto para a chave
   (`16`, `12`) — bloqueado só pelo #18.
2. **Canal de feedback in-app** em `SettingsPage` + `ErrorBoundary` (`08` top 4).
3. **Aviso de WebView velho** por `CSS.supports` (`08` top 5) — se #19 = sim.
4. **Botão compartilhar `BirthCard`** com `navigator.share` (`08` top 7, `12`).
5. **Ledger dos guardas**: corrigir 86 → 87, WP1.14 e WP3.4 para o estado real, os 8
   comandos de aceite mortos, `vetos.md` com 21 proibições (`09`).
6. **Réguas novas** propostas em `09` §2 (#15 sem FOMO, #17 inventário dos 8 perdões,
   #18 lado do cliente do chat, #19 estrutural, #21 no fio de `publicProfile`).
7. **Testes que faltam** (`03` §4): `auth.ts` link mágico/ponte do desktop,
   `accountData.ts` export/delete, `workers/webpush.js`/`fcm.js` por nome, `sw.js`
   `push`/`notificationclick`; `requirePaidTier` direto.
8. **Perf barata** (`06`): recomprimir os 10 cenários de 2,6–3,4 MB; `loading="lazy"`
   fora da dobra; guard de `font-size` literal < 12px; confirmar que `pool-*.js`
   (`astronomy-engine`, 832 KB) só baixa no Oráculo.
9. **Design system** (`07`): tokens `--sm2-z-*` a partir da escala implícita; terminar
   `.sm-px-*` (14 arquivos); aposentar scaffold shadcn.
10. **Narrativa**: fechar P13/P14 no doc; passar `WidgetRenderer.kt` ›
    `CHAT_FIXED_PHRASES` e `_pushCopy.js` pelo narrative-critic; estender o guard a
    `android/` e `public/` (`10`).
11. **Docs**: `INVENTARIO-TELAS.md` (3 componentes inexistentes), `02-SQUAD.md` ("14"),
    `PLANO-PRODUTO` Parte 3, comentários de `chat.js` › `contextBlock` e `welcomeBack.ts`,
    `achievements.ts`/`emblemArt.ts` ("8 emblemas", são 9), `gainArt.ts` ("sem chamada").
12. **CI**: `ci.yml` rodar `npm run build` sem commitar `dist/`; `desktop-*.yml` rodar
    vitest; prender `claude-code-action` por SHA; job `wrangler deploy` para `workers/**`
    quando o #A1 tiver dono.
13. **Segurança MÉDIA** (`04`): teto de body nas rotas, mascarar `saveId` no log,
    `attrs`/`stage` do torneio derivados no servidor, fixar `"*"` nas 3 deps,
    `/api/transcribe` atrás de auth quando ligado.

---

## 7. Runtime (dev server, Chrome do painel)

`http://localhost:3000` (servidor já em pé na máquina): splash → portão de conta em
EN (idioma padrão) → "Criar conta" com as duas caixas separadas (Termos + 18+, `CheckRow`
em `form/FormKit.tsx`) → `termos.html` e `privacidade.html` abrem nos dois idiomas. Não
criei conta (regra da sessão). Em dev o Vite não serve `functions/`: `POST /api/save` e
`/api/metrics` respondem 404 e os `GET /api/*` devolvem o `index.html` com 200 — o app
engole os dois sem quebrar. Não é bug de produto; é que **não existe modo dev com backend**
(`wrangler pages dev` nunca foi documentado como caminho) — vai para A1.
