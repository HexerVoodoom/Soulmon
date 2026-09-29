# 08 — Governança · doc-verificador · marca — QA Rodada 1 (21/09/2026, noite)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Repo `D:\Soulmon\repo`, branch `qa/rodada-a`, HEAD `5228145e`. Só leitura. Papéis inline:
`alpha-governanca` + `doc-verificador` + `alpha-marca-critico`. Regra da rodada respeitada:
achado do consolidado da manhã só volta se "ainda aberto".

---

## 0. O achado que muda o resto do relatório

**GitHub Actions está MORTO desde 16/09/2026 por cobrança — nenhum portão de CI rodou em 6 dias.**

- `gh run list --limit 400 --json conclusion,createdAt` → último `success` em `2026-09-15T02:54Z`;
  desde então **339 runs `failure`** (58 em 16/09, 38 em 20/09, 136 em 21/09, 18 em 22/09 UTC).
- `gh run view 35672580168` (CI do HEAD da main): job dura **2 s** e a anotação é
  *"The job was not started because recent account payments have failed or your spending limit
  needs to be increased"*. Mesma anotação em `docs-sync` (`35672492888`) e `android-build`.
- Consequências diretas, todas hoje: (a) `docs-sync.yml` nunca rodou — o "anti-loop" e o job
  `mantenedor` são teoria; (b) `PLAY-LANCAMENTO.md` §G e `STATUS.md` (bloco etapas 4/6) dizem
  `[verificar no android-build.yml do CI após o merge]` para `targetSdk 36` — **impossível**
  enquanto a conta não paga; (c) `ci.yml` › "Integridade do vendor" nunca conferiu o
  `_provenance.json` de `4a8b8049`; (d) os 8 blocos "Portões" do STATUS de hoje são todos
  medição LOCAL — verdade, mas ninguém escreveu que o CI está fora.
- Produção NÃO está afetada (Cloudflare builda por conta própria):
  `curl -s https://soulmon.mateus-sprnd.workers.dev/sw.js | grep -m1 CACHE_VERSION` → `v157` =
  `grep -m1 CACHE_VERSION public/sw.js` → `v157`. Git = ar (medido 21/09/2026 ~23h BRT).
- Não está no consolidado da manhã (`grep -n "spending\|payments\|gh run" docs/reviews/2026-09-21-qa-geral/*.md` → 0) nem em `docs/PERGUNTAS-DO-DONO.md`.
- Bônus, mesma listagem: os runs de 15/09 já avisavam *"Node.js 20 is deprecated … forced to
  run on Node.js 24"* para `actions/checkout@11d5960a`, `setup-node@49933ea5`, `setup-java@cf277c60`,
  `android-actions/setup-android@9fc6c4e9` — os SHAs presos hoje são de actions Node 20.

**Dono:** o dono do projeto (Billing & plans da conta GitHub); depois, `soulmon-operador` grava
o bloco "git × ar" com a data em que voltou. **Severidade: fatal para o processo** (o
`CLAUDE.md` › Deploy autoriza merge automático "com tsc/vitest/build limpos" e a única prova
não-local disso está desligada).

---

## 1. GOVERNANÇA (`alpha-governanca`)

### 1.1 Os 37 agentes — frontmatter × despacho

Método: `awk` no frontmatter de cada `.claude/agents/*.md`; despacho = `grep -rl <name>` em
`.claude/skills`, `.claude/commands`, `CLAUDE.md`, `.github`, `scripts`, `docs` (excluindo o
próprio arquivo). Todas as `tools:` declaradas são tools reais (`Read Write Edit Grep Glob Bash
WebFetch WebSearch Skill Agent`).

| Agente | `name` = arquivo | `description` | `model` | Despachado por (amostra) | Refs |
|---|---|---|---|---|---|
| arte-conferente | ✅ | ✅ | **∅** | soulmon-coordenador, squad-arte | 6 |
| arte-gerador | ✅ | ✅ | opus | idem | 8 |
| arte-instalador | ✅ | ✅ | **∅** | idem | 7 |
| design-critic | ✅ | ✅ | opus | coordenador, squad-design (CONTRACT/METODO) | 31 |
| design-wireframer | ✅ | ✅ | opus | squad-design | 9 |
| doc-bibliotecario | ✅ | ✅ | opus | manter-docs, squad-docs | 10 |
| doc-historiador | ✅ | ✅ | sonnet | squad-docs | 9 |
| doc-mantenedor | ✅ | ✅ | opus | manter-docs, coordenador, docs-sync.yml | 22 |
| doc-redator-arquitetura | ✅ | ✅ | opus | squad-docs/CONTRACT | 7 |
| doc-redator-identidade | ✅ | ✅ | opus | squad-docs/CONTRACT | 5 |
| doc-redator-referencia | ✅ | ✅ | sonnet | manter-docs, squad-docs | 11 |
| doc-redator-regras | ✅ | ✅ | opus | squad-docs | 8 |
| doc-redator-telas | ✅ | ✅ | opus | squad-design/METODO, squad-docs | 6 |
| doc-verificador | ✅ | ✅ | opus | manter-docs, squad-docs | 27 |
| som-diretor-sonoro | ✅ | ✅ | opus | squad-som | 5 |
| som-engenheiro-audio | ✅ | ✅ | opus | squad-som | 7 |
| som-produtor-assets | ✅ | ✅ | sonnet | squad-som | 4 |
| soulmon-behavioral-psychologist | ✅ | ✅ | inherit | coordenador, squad-narrativa, squad-som | 9 |
| soulmon-coordenador | ✅ | ✅ | opus | hook, manter-docs, squad-* | 13 |
| soulmon-copy-redator | ✅ | ✅ | opus | squad-narrativa | 7 |
| soulmon-design-lead | ✅ | ✅ | **∅** | squad-design | 20 |
| soulmon-guarda-constancia | ✅ | ✅ | inherit | squad-som/CONTRACT (só) | 6 |
| soulmon-guarda-linha-vermelha | ✅ | ✅ | inherit | coordenador, squad-design | 32 |
| soulmon-guarda-medicao | ✅ | ✅ | inherit | coordenador, squad-som | 9 |
| soulmon-guarda-nascimento | ✅ | ✅ | inherit | coordenador, squad-som | 8 |
| soulmon-guarda-permanencia | ✅ | ✅ | inherit | coordenador, squad-som | 6 |
| soulmon-guarda-plataforma | ✅ | ✅ | inherit | coordenador, squad-design, /guarda-soulmon | 12 |
| soulmon-guarda-sustento | ✅ | ✅ | inherit | coordenador, squad-som | 8 |
| soulmon-guarda-vinculo | ✅ | ✅ | inherit | coordenador, squad-som | 9 |
| soulmon-ip-brand-guardian | ✅ | ✅ | inherit | coordenador, squad-narrativa | 12 |
| soulmon-loremaster | ✅ | ✅ | opus | squad-narrativa | 8 |
| soulmon-monster-taming-designer | ✅ | ✅ | inherit | coordenador, squad-narrativa | 7 |
| soulmon-narrative-critic | ✅ | ✅ | opus | squad-narrativa | 8 |
| soulmon-operador | ✅ | ✅ | opus | coordenador (só) | 9 |
| soulmon-product-designer | ✅ | ✅ | inherit | coordenador, squad-design | 16 |
| soulmon-visual-designer | ✅ | ✅ | **∅** | squad-design | 27 |
| staff-frontend | ✅ | ✅ | opus | coordenador, squad-arte, squad-design | 51 |

Achados:
- **4 sem `model:`** (`arte-conferente`, `arte-instalador`, `soulmon-design-lead`,
  `soulmon-visual-designer`). A R1 da governança da manhã pedia "declarar `model:`" nos
  sobreviventes — feita só em `staff-frontend`/`design-critic`. Baixo.
- **Sombra local × global**: `design-critic.md` e `staff-frontend.md` existem em
  `.claude/agents/` **e** em `C:\Users\spera\.claude\agents\` com conteúdo diferente
  (`md5sum`: `7b7c865e`≠`88284a0c`; `e1c4b003`≠`fc12b566`). O projeto vence, mas quem edita o
  global acha que editou o que roda. Baixo.
- **Referências a agentes apagados hoje (30 arquivos `D` em `.claude/agents`)** — quase tudo é
  lápide correta. Sobram 2 linhas vivas sem lápide em `docs/manual/00-MAPA.md`: a coluna
  "dono" de `design/PRINCIPIOS-DE-WIREFRAME.md` diz `design-curador-padroes` e a de
  `design/INVENTARIO-WIREFRAMES.md` diz `soulmon-screen-cartographer` (ambos ⚰️ em `42b07bec`).
  Baixo — dono `doc-bibliotecario`.
- `soulmon-guarda-constancia` só é despachado pelo `squad-som/CONTRACT.md` — nenhuma linha do
  coordenador nem do `/guarda-soulmon` o cita. Confirmar se é intencional. Baixo.

### 1.2 Os 3 ponteiros `higgsfield-*` e o `skills-lock.json`

**O skeptic da manhã errou o diagnóstico; o defeito é outro.**

- `.agents/skills/` **existe e está no git**: `git ls-files .agents | sed 's|/[^/]*$||' | sort -u`
  → `higgsfield-game-generation{,/references,/scripts}`, `higgsfield-generate{,/references}`,
  `higgsfield-soul-id{,/references}`. `.claude/agents/som-produtor-assets.md` cita
  `.agents/skills/higgsfield-game-generation/references/audio.md` → **existe**.
- O que está quebrado: os 3 ponteiros são **symlinks no git** (`git ls-files -s` → modo
  `120000`) e `git config core.symlinks` → `false` nesta máquina. Logo no disco eles são
  **arquivos de texto de 39–47 bytes** com o conteúdo `../../.agents/skills/higgsfield-generate`
  (`cat .claude/skills/higgsfield-generate`). Claude Code não lista um arquivo como skill → a
  cópia do repo é peso morto no Windows. A skill que a sessão carrega vem de
  `C:\Users\spera\.claude\skills\higgsfield-generate` (symlink real, `lrwxrwxrwx`, para
  `~/.agents/skills/…`).
- E a cópia do repo **divergiu** da global: `diff .agents/skills/higgsfield-generate/SKILL.md
  ~/.agents/skills/higgsfield-generate/SKILL.md` → difere (a do repo é a mais velha, sem
  `multi_image_to_3d`/Nano Banana). Duas verdades para o mesmo nome.
- `skills-lock.json`: 3 entradas (as 4 apagadas em `42b07bec` não estão lá — consistente).
  `computedHash` não é reproduzível por `sha256sum SKILL.md` nem pelo diretório concatenado
  (algoritmo do `skills` CLI) — **não verificável por grep**; anote como "lock não auditável".
- Conserto (recomendado, `soulmon-operador`/dono): apagar `.claude/skills/higgsfield-*` e
  `.agents/` do repo (a skill vive na conta) **ou** trocar symlink por diretório real. Médio.

### 1.3 Portões: `.github/workflows/*.yml` × hook × `/implementar-wp` × `CLAUDE.md`

| Portão | `CLAUDE.md` › Comandos | `/implementar-wp` passo 5 | `ci.yml` | hook `session-start.sh` | `android-build.yml` |
|---|---|---|---|---|---|
| `npx tsc --noEmit` | ✅ | ✅ | ✅ | — | — |
| `tsc -p tsconfig.server.json` | ✅ | ✅ | ✅ | — | — |
| `tsc -p desktop/tsconfig.json` | ✅ | ✅ | ✅ | — | — |
| `npx vitest run` | ✅ | ✅ | ✅ | só 2 guards do manual | — |
| `npm run build` | ✅ | **✗** | **✗ (declarado no comentário)** | — | ✅ (só `push: main`) |
| sha256 do `vendor/class-system` × `_provenance.json` | ✗ | ✗ | ✅ | — | — |

- **Não são idênticos.** `npm run build` só existe em `CLAUDE.md` e no `android-build.yml`
  (push na main); em PR não roda — `ci.yml` declara isso honestamente no último comentário.
  `/implementar-wp` não pede `build` e o `CLAUDE.md` pede: quem segue o command commita sem
  `dist/` novo. Médio — dono `soulmon-coordenador`.
- **`ci.yml` roda `npm run build`? Não.** Confirmado (`grep -n "npm run build" .github/workflows/ci.yml` → só o comentário).
- **`docs-sync.yml` por tag móvel? Sim, ainda.** `uses: anthropics/claude-code-action@v1` é a
  **única** action não presa por SHA no repo (`grep -n "uses: .*@" .github/workflows/*.yml`: todas
  as outras têm SHA + comentário de versão). Contradiz o próprio `ci.yml` ("UMA regra só").
  Baixo enquanto o job nunca roda (sem `ANTHROPIC_API_KEY`); médio no dia em que rodar.
- **`soulmon-operador.md` mente sobre o CI**: tabela do runbook, linha "CI" → "os três `tsc` +
  vitest + **build**". O `ci.yml` não builda. Baixo — dono `soulmon-operador`.
- **`.claude/hooks/session-start.sh`** não confere se o Actions está vivo: mede `origin/main`,
  delta do manual, guard, perguntas do dono — e nada do CI. Foi assim que 6 dias de vermelho
  passaram. Proposta (1 linha): `gh run list --workflow ci.yml --limit 1 --json conclusion -q
  '.[0].conclusion'` no briefing. Médio.

### 1.4 Tabela do `soulmon-coordenador/SKILL.md` — cada linha resolve?

Método: `grep -oE` de todo identificador em crase na SKILL.md; resolvido contra
`.claude/agents`, `.claude/skills`, `.claude/commands`, `~/.claude/agents`, `~/.claude/skills`.

- **Locais (agente):** arte-conferente, arte-instalador, doc-mantenedor,
  soulmon-behavioral-psychologist, soulmon-coordenador, soulmon-guarda-{linha-vermelha, medicao,
  nascimento, permanencia, plataforma, sustento, vinculo}, soulmon-ip-brand-guardian,
  soulmon-monster-taming-designer, soulmon-operador, staff-frontend → **todos existem**.
- **Locais (skill/command):** manter-docs, squad-{arte,design,docs,narrativa,som},
  /documentar, /guarda-soulmon, /implementar-wp → existem.
- **Globais (agente, `C:\Users\spera\.claude\agents`):** alpha-architect, alpha-backend,
  alpha-compliance, alpha-orquestrador, alpha-perf-a11y, alpha-qa, alpha-security, alpha-skeptic
  → existem. (Global tem 48 agentes: 37 `alpha-*` + 11 genéricos `business-strategist`,
  `design-critic`, `growth-engineer`, `investor-skeptic`, `principal-architect`,
  `product-designer`, `product-manager`, `qa-sweeper`, `security-architect`, `staff-backend`,
  `staff-frontend` — os que o repo cortou hoje continuam vivos na conta.)
- **Globais (skill):** `squad-alpha` → existe (`~/.claude/skills/squad-alpha/` com
  `references/evals-da-squad.md`). Skills globais relevantes: agents-sdk, cloudflare, wrangler,
  workers-best-practices, code-review, grilling, tdd, verify-and-stop, prod-squad (ainda global).
- **`/security-review`** → não é skill nem command do repo/conta; é built-in do Claude Code
  (aparece na lista de skills da sessão). Resolve.
- **Não resolvem, mas são lápides corretas:** `soulmon-maestro`, `/revisao-soulmon` (linha 24,
  "aposentados em 21/09/2026").
- Veredito: **tabela íntegra**. R3 da manhã (`/squad-som`, `/squad-arte` não eram commands)
  segue tecnicamente verdade — `ls .claude/commands` não tem os dois — mas a SKILL.md agora
  escreve `/squad-som` apontando para a skill, que resolve por nome. Fechado.

### 1.5 Evals

- `references/evals-da-squad.md` **existe** — em `C:\Users\spera\.claude\skills\squad-alpha\references\`.
  Não há cópia nem ponteiro no repo (`grep -rn evals-da-squad docs .claude` → só a citação em
  `13-governanca-agentes.md` §8.4).
- **R2 exigia "eval com 5 pedidos reais do STATUS" antes de mexer na tabela do coordenador.
  A tabela foi mexida (`42b07bec`) e nenhum eval existe**: `grep -rn -i eval docs/STATUS.md
  docs/PERGUNTAS-DO-DONO.md .claude/skills/soulmon-coordenador/` → 0 relevante; mensagens de
  commit `git log 11e9b237..HEAD --format=%B | grep -i eval` → 0. A ordem §8.8 da própria
  review ("2. R2 + R3 — 1 eval de 5 casos") foi pulada. Médio — dono `alpha-governanca` propõe,
  `soulmon-coordenador` roda.

### 1.6 O que `soulmon-operador` e `soulmon-guarda-plataforma` deviam ter feito hoje

Ambos nasceram em `42b07bec`; a partir daí eram donos. Hoje mexeu-se em `functions/`, `workers/`
(paridade), `android/` (SDK 36, `versionCode 15`), `public/sw.js` (`v157`), secrets novos
(`ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`, `METRICS_ADMIN_KEY`).

| Devia | Fez? | Evidência |
|---|---|---|
| operador: bloco "git × ar" datado no STATUS após o merge de `42b07bec`/`4a8b8049` | **não** | `grep -n "git × ar" docs/STATUS.md` → só a frase do roster (l. 91) e o QA (l. 140) |
| operador: `gh run list --workflow ci.yml --limit 3` (linha do runbook) | **não** — teria visto o §0 | 339 falhas sem registro |
| operador: cache dos clientes (`sw.js` ar × git) | não registrou; **eu medi: v157 = v157** ✅ | comando em §0 |
| operador: worker de push segue deployado? | **não medido — exige login**. Comando: `cd workers && npx wrangler deployments list` e comparar com `git log -1 --format=%ci -- workers/` → `2026-09-20 22:43:06 -0300` (`3e758a81`). Se o último deployment for anterior a isso, o worker no ar não tem a paridade de hoje | — |
| operador: os 3 secrets novos no painel | registrado como "depende do dono" no STATUS ✅; `npx wrangler secret list` não rodou (login) | — |
| guarda-plataforma: primeiro `/guarda-soulmon plataforma` colando saída de PL-1..PL-4 | **não** — o ledger ainda diz "aguarda o primeiro `/guarda-soulmon plataforma` colar a saída" em 4 linhas | `docs/plano-melhorias/ledger/plataforma.md` |
| guarda-plataforma: `targetSdk 36` provado no CI | **não, e não pode** (§0) | `PLAY-LANCAMENTO.md` §G |
| guarda-plataforma: `google-services.json` ainda é do DigiApp (`project_id` `digiapp-88296`, `package_name` `com.digiapp.app`/`com.digipartner.digiapp`) enquanto o `applicationId` é `com.hexervoodoom.soulmon` | ciente (`PLAY-LANCAMENTO.md` §C.2 "é do dono") — mas o `build.gradle` só **avisa** (`logger.warn`), não falha; FCM no APK está morto por construção até o dono trocar | `grep -n package_name android/app/google-services.json` |

---

## 2. DOC-VERIFICADOR — 40 afirmações amostradas

Fontes: 3 blocos do topo do `STATUS.md` (S), `CLAUDE.md` 7 correções de hoje (C),
`PLAY-FICHA.md` (P), `PLAY-LANCAMENTO.md` (L), `docs/adr/*` (A). Veredito: ✅ confere ·
⚠️ confere com ressalva · ❌ não confere.

| # | Afirmação | Comando | Veredito |
|---|---|---|---|
| C1 | "18 documentos em `docs/manual/`" | `find docs/manual -name '*.md' \| wc -l` → 18 | ✅ |
| C2 | bíblia tem tabela `EXCECOES` (⚰️ `DÍVIDA`) | `grep -c EXCECOES docs/NARRATIVA-E-UNIVERSO.md` → **0**; a tabela `EXCECOES` vive em `src/narrativa.contract.test.ts`; a bíblia ainda tem o título "A DÍVIDA do sensório — quitada" (l. 403) | ⚠️ o `CLAUDE.md` atribui à bíblia o que está no teste |
| C3 | `REROLL_COST_CREDITS` = 50 | `src/utils/monetization.ts` › `REROLL_COST_CREDITS = 50` | ✅ |
| C4 | `HEART_COST_CREDITS = 10` saiu | única ocorrência é o comentário ⚰️ em `monetization.ts` | ✅ |
| C5 | `DREAM_CATALOG` 30 = 12/10/8 | contagem de `rarity:` em `restWindow.ts` → `{common:12, rare:10, legendary:8}` | ✅ |
| C6 | canal `soulmon_push` (⚰️ `digiapp_push`) | `grep -rn soulmon_push android/app/src/main/java` → 2; `digiapp_push` → 0 | ✅ |
| C7 | `SoulmonWidgetPlugin` (⚰️ `DigiWidgetPlugin`) | `find android -name 'SoulmonWidgetPlugin*'` → 1; Digi → 0 | ✅ |
| C8 | `meetsPvpBond` em `src/utils/bond.ts` (não `canPvp`) | `export function meetsPvpBond` em `bond.ts`; `canPvp` → 0 | ✅ |
| S1 | `CACHE_VERSION` v157 | `grep -m1 CACHE_VERSION public/sw.js` | ✅ (e = ar, §0) |
| S2 | `grantCourtesy` em `_entitlements.js`, "8 testes" | símbolo existe; testes de cortesia: `entitlements.grant.qa.test.js` **12** `it(`, `_entitlements.tierDerivado.qa.test.js` 4 | ⚠️ número não bate (12+4, não 8) |
| S3 | `action=grant` fail-closed 404 sem `ENTITLEMENTS_ADMIN_KEY` | `functions/api/entitlements.js` › `if (!env?.ENTITLEMENTS_ADMIN_KEY) return json(…, 404)` | ✅ |
| S4 | `metrics-report.mjs` exit 2 sem chave; sem shebang | `process.exit(2)`; `head -c2` → `/*` | ✅ |
| S5 | `CSS.supports('selector(&)')` no `index.html` | `grep -c "selector(&)" index.html` → 2 | ✅ |
| S6 | `FeedbackLink` em Sobre + `ErrorBoundary` | `grep -rl FeedbackLink src` → `ErrorBoundary.tsx`, `SettingsPage.tsx` (+2 testes) | ✅ |
| S7 | `STORAGE_KEYS.TERMS_NOTICE_SEEN` | `storageKeys.ts` › `TERMS_NOTICE_SEEN: 'soulmon-terms-notice-seen'` | ✅ |
| S8 | `revokePushBeforeDelete` | `accountData.ts` › `export async function revokePushBeforeDelete` | ✅ |
| S9 | servidor apaga `push:*`/`fcm:*` por `saveId` | `account.js` › `PUSH_PREFIXES = ['push:', 'fcm:']` | ✅ |
| S10 | `FULL_UNLOCK_PRICE_LABEL_USD` = `US$ 6.99` | `monetization.ts` | ✅ |
| S11 | `versionCode 15` / `1.1.4` | `android/app/build.gradle` | ✅ |
| S12 | `billing-ktx 6.2.1` por `enablePendingPurchases()` sem arg | `build.gradle` l. 80; `BillingPlugin.kt` › `.enablePendingPurchases()` | ✅ |
| S13 | `SettingsModal` apagado; `onOpenAISettings` saiu | `find src -name 'SettingsModal*'` → 0; `grep -rn onOpenAISettings src` → 0; as 14 menções restantes são ⚰️/comentário ou `AISettingsModal` | ✅ |
| S15 | `dias-completos-30` / `DIAS_COMPLETOS_PARA_CONQUISTA`; `'tasks-100'` fora | `achievements.ts` › `= 30`; `'tasks-100'` fora de teste → 0 | ✅ |
| S16 | herança única em `hydrateSave` via `conquistasHerdadas` | `GameStateContext.tsx` › `function hydrateSave` + campo `conquistasHerdadas?` | ✅ |
| S17 | guards `depsVivas` e `orcamentoDeBytes` | `ls src/deploy/` | ✅ |
| S18 | "11 deps sobram" | `node -e` sobre `package.json` → 11 | ✅ |
| S19 | tetos 250/100/400/800 KB | constantes `TETO_*` em `orcamentoDeBytes.contract.test.ts` | ✅ |
| S20 | `sw.js` › `cacheavel` exige `status === 200` | `grep -n 'status === 200' public/sw.js` | ✅ |
| S21 | "dist sem PNG" | `find dist -name '*.png'` → **7** (`badge-96`, `favicon-192/512`, `push-large-192`, 3 `screenshots/`) | ⚠️ os PNG de ícone/manifest ficam de propósito (referenciados por `manifest.json`); a frase do STATUS ("PNG do dist") vale só para `dist/assets` — precisa dizer isso |
| S22 | `dist/` 24 MB | `du -sm dist` → 24 | ✅ |
| S23 | "37 aliases" e o comentário do `vite.config.ts` diz 38 | `git diff f02a3166..4a8b8049 -- vite.config.ts \| grep -c "^-      '"` → 37; comentário l. 19 "38 aliases" | ✅ (divergência já declarada no STATUS; **ainda aberta** no código) |
| S24 | `docs/adr/ADR-001..003` | `ls docs/adr` | ✅ |
| S25 | "10 fósseis → `docs/historico-digiapp/` com lápide" | `git diff --name-status 11e9b237..HEAD -- docs/historico-digiapp \| grep -c "^[AR]"` → 10; 9/10 com lápide nas 3 primeiras linhas — `manifest.webmanifest` (JSON) sem | ⚠️ |
| S27 | "LEDGER 87 WPs, WP1.14 RECUSADO, WP3.4 IMPLEMENTADO" | `LEDGER.md` l. 7 declara 87 pelo `PLANO-MELHORIAS.md`; ids únicos em `LEDGER.md`+`ledger/*.md` → 87; estados conferem | ✅ |
| S29 | `compileSdk`/`targetSdk` 36 | `android/variables.gradle` | ✅ (não provado no CI — §0) |
| S32 | `.sincronizado.json` = HEAD sincronizado | `sha: f4086ce0…`; HEAD `5228145e` só recarimba — coerente com a mensagem do commit | ✅ |
| P1–P4 | `applicationId`, `appName`, `#exclusao`, e-mail na política | `build.gradle`, `capacitor.config.json`, `grep -c 'id="exclusao"'` → 1, e-mail → 2 | ✅ |
| P5 | "Oráculo — seis perguntas" | `ORACLE_QUESTIONS` → 6 objetos, ids `grupo objetivo pressao energia lugar conflito` | ✅ (ver §3 — o Oráculo também colhe nome/nascimento/cidade: `CityPicker.tsx`) |
| P8–P10 | `MANUAL_EVOLUTION = true`, `CONSTANCY_WINDOW_DAYS = 7`, `MISS_INTERVENTION_AT = 2` | `types/progression.ts`, `types/taskModel.ts` | ✅ |
| P12 | "5 camadas × 6 encontros"; `LADDER_TIERS` | `DungeonGame.tsx` › `MAX_FLOORS = 5` e doc-comment "ladder of 6"; **`LADDER_TIERS` não é símbolo** — só aparece em comentários (`ArenaGame.tsx`, `BestiaryCard.tsx`) | ⚠️ ponteiro decorativo |
| P17 | 1 não consumível + 3 consumíveis | `_billing.js` › `PRODUCTS`: `unlock.full` false, `credits.60/150/400` true | ✅ |
| P22 | `chatSafety.ts` com CVV 188 / findahelpline | `188` → 3; `findahelpline` → **0** em `chatSafety.ts` (está em `ChatBox.tsx` e `termos.html`) | ⚠️ |
| P25–P28 | contagens 28/72/3.181 · 18/70/3.069 | `wc -m` e `[...s].length` sobre os blocos | ✅ todas exatas |
| L1–L6 | step "Build signed release bundle (.aab)", artefato `soulmon-release-<sha>`, 4 secrets `ANDROID_*`, `signingConfigs.release`, secrets do worker | `android-build.yml` l. 161/183; `secrets.ANDROID_{KEYSTORE_BASE64,KEYSTORE_PASSWORD,KEY_ALIAS,KEY_PASSWORD}`; `workers/*.js` usa `VAPID_JWK`, `FIREBASE_SERVICE_ACCOUNT`, `SEASON_ADMIN_KEY` | ✅ |
| L9 | migrações `0001`, `0002` | `ls migrations/*.sql` | ✅ |
| A1/A3 | ADR-001/003 "corpo idêntico ao original" pelo `diff <(tail -n +14 …)` | exit 0 / 0 linhas | ✅ |
| A2 | ADR-002 idem | **572 linhas de diff** — é só CRLF (`git ls-files --eol` → `i/lf w/crlf`; com `tr -d '\r'` → 0) | ⚠️ o comando de verificação da própria ADR reprova no Windows |
| A4 | ADR-001 "Vale em 21/09?": `whoami` e `revision`+409 não existem | `ls functions/api \| grep whoami` → 0; `grep -c 409 save.js` → 0 | ✅ |
| A6 | ADR-003: `audioBus.ts` sem `AudioWorklet`/`DynamicsCompressor` | `grep -cE` → 0 | ✅ |

**Placar: 40 amostradas → 31 ✅ · 9 ⚠️ · 0 ❌.** Nada falso; as ressalvas são número aproximado
(S2), ponteiro para símbolo inexistente (P12 `LADDER_TIERS`, P22 findahelpline, C2 EXCECOES),
escopo mal dito (S21) e comando não portável (A2).

### 2.1 Links relativos em `docs/**/*.md` fora do manual + `CLAUDE.md`

Script (node, 163 arquivos): **47 links `](…)` relativos, 7 quebrados** — 5 em
`docs/historico-digiapp/00-START-HERE.md` (`CHANGELOG.md`, `App.tsx`, `types/progression.ts`
— fóssil movido antes de hoje, sem reescrever links; é `registro`, aceitável) e 2 falsos
positivos (regex em `05-arquitetura.md`, placeholder `caminho` em `14-docs-verificacao.md`).
Caminhos em crase (`\`docs/...\`` etc.): **2.033, 68 inexistentes**, concentrados em reviews
(`14-docs-verificacao.md` 17, `09-guardas.md` 7, `05-arquitetura.md` 6 — são achados sobre
caminhos errados, não erros) e em docs históricos. Nos docs de hoje: `ADR-003` cita
`.claude/skills/prod-squad/templates/adr.md` (apagado em `42b07bec` — mas a ADR é cópia fiel,
`registro`); `CLAUDE.md` → `android/.../widget/WidgetRenderer.kt` é elipse proposital. Baixo.

### 2.2 `11-GLOSSARIO.md` e `09-HISTORICO.md` — o que falta

- **`11-GLOSSARIO`**: carimbo `09/09/2026`, 140 termos. `grep -c -i -F` → **0** para todos
  estes: cortesia/courtesy, `grantCourtesy`, `COURTESY_*`, "dia completo"/"dias completos",
  `DIAS_COMPLETOS_PARA_CONQUISTA`, `conquistasHerdadas`, orçamento de bytes, `depsVivas`,
  WebView / `selector(&)`, `TermsUpdateBanner`, `FeedbackLink`, `soulmon-operador`,
  `soulmon-guarda-plataforma`, `arte-gerador`, `PLAY-FICHA`, "Camada 3", ADR. O STATUS já
  declara "fora do delta, de propósito" — mas o delta (`docs-delta.mjs`) nunca vai listar um
  glossário; ele só envelhece. Médio — dono `doc-bibliotecario`.
- **`09-HISTORICO`**: carimbo `09/09/2026`; última data no corpo `10/09/2026`; §5 "Os PRs
  mergeados" termina em `#39`. Desde então: `git log --since=2026-09-10 --oneline | wc -l` →
  **234 commits**; `gh pr list --state merged --json number` → **95 PRs mergeados, maior #99**
  — faltam ~56 PRs (#40–#99: wireframes Fase 1/2, narrativa, som S16, QA geral, roster 37).
  Nenhuma linha para `f9faf7a7`, `42b07bec`, `4a8b8049`. Médio — dono `doc-historiador`.

---

## 3. MARCA (`alpha-marca-critico`) — `docs/PLAY-FICHA.md` × plataforma

Plataforma usada: `01-VISAO.md` §2 ("avatar do usuário que evolui junto com ele e o encoraja —
nunca um cobrador"; "o comparável não é o Duolingo, é o Finch"), `04-IDENTIDADE-VISUAL.md` §1
("O Visor": pixel dentro, vetor fora), bíblia L1–L12, REGISTRO §14.1 (nome fica).

### 3.1 Teste de troca de logo

| Peça | Serviria para Finch? | Para Habitica? | Veredito |
|---|---|---|---|
| Título EN `Soulmon: Habit Pet` | **Sim** — Finch é literalmente "Self-Care Pet"; troque o nome e nada sobra | não (Habitica é RPG) | **falha**. Sobram 12 caracteres (18/30): cabe `Soulmon: Pet That Evolves` ou o gancho do Oráculo |
| Título PT `Soulmon: Bichinho de Hábitos` | sim | não | falha, mesma razão |
| Curta PT/EN "nasce das suas respostas e muda de forma com o seu dia" | **não** — "nasce das suas respostas" é o Oráculo, só do Soulmon | não | **passa** |
| Parágrafo 1–2 da longa (Oráculo, "ninguém tem outra igual", "não há veredito") | não | não | passa |
| Seção "O DIA, DO SEU JEITO" (tarefas pesam por esforço, "quantas das últimas sete", escudos, 5 minutos) | parcial — Finch também tem "não zera" | Habitica tem tarefas por dificuldade | **passa pelo conjunto** (mudança de forma manual + galho é único) |
| "CUIDAR É PARTE DO DIA" | **sim** — alimentar/carinho/banho/sono é Tamagotchi genérico; o que salva é "a comida inclina a forma seguinte" | não | ⚠️ depende da 1ª linha |
| "FEITO PARA CABER NA VIDA" | sim (qualquer app) | sim | ruído — genérica, mas não fere |
| Fecho "Ela está esperando. Ela vai se parecer com você." | não | não | passa; ver claim abaixo |

### 3.2 Claims arriscados

| Claim (PT/EN) | Onde | Risco | Por quê | Severidade |
|---|---|---|---|---|
| "Única: … **ninguém tem outra igual**" / "nobody else has the same one" | §1.3 par. 2 / §2.3 | **falso como está** | a semente é determinística sobre 6 respostas (28 opções no total; `ORACLE_QUESTIONS`) + `readingCount` — `src/utils/newReading.ts` diz no próprio cabeçalho *"Mesma resposta, mesma criatura"*. Dois jogadores com as mesmas 6 respostas recebem a mesma linha. É o claim mais citável numa reclamação de loja | **alto** — trocar por "gerada a partir das suas respostas" (já está na curta) |
| "não conta os dias em que você faltou" / "doesn't count the days you missed" | §1.3 par. 3 | contradição interna | 8 linhas abaixo: "Duas faltas seguidas e a criatura oferece…" (`MISS_INTERVENTION_AT = 2`) e "conta quantas das últimas sete" (`CONSTANCY_WINDOW_DAYS`). O produto conta; o que ele não faz é **cobrar** (L6). A frase promete o que o código não cumpre | médio — "não te cobra pelos dias que faltou" |
| "não manda mensagem cobrando" | idem | ⚠️ | há push de lembrete (`_pushTargets.js`, `push-scheduler.js`); a ficha depois diz "lembretes que respeitam". Sustentável só se a copy do push obedecer L6 — `workers/pushCopy.parity.test.js` trava paridade, não tom | baixo |
| "nada do que você construiu se apaga" / "nothing you built is erased" | par. "Se você se afasta" | ⚠️ | L4/L5 sustentam (vínculo/constância/coleção não descem); mas a **forma** recua (degeneração por HP 0). "Construiu" é ambíguo para quem lê a forma como construção | baixo — a bíblia §13 tem a frase-modelo; usar a dela |
| "Ela está esperando." | fecho | ⚠️ L6 | L6 proíbe "ele esperou você e sofreu"; "esperando" sem sofrimento passa, mas é a linha mais próxima da chantagem de retorno em toda a ficha | baixo — `soulmon-narrative-critic` decide |
| "Nunca cobra" / "evolui com você" (o pedido do preâmbulo) | — | **não estão na ficha** | `grep -n -i "nunca cobra\|evolui com você" docs/PLAY-FICHA.md` → 0. Estão no **`index.html`**: `og:title` "o bichinho que **evolui com você**", `description` "— **nunca cobrança**", `og:description` "sem cobrança". A ficha e o OG não falam a mesma língua (a ficha diz "muda de forma", o OG diz "evolui/cresce"; a bíblia trocou "evoluir" por "mudar de forma"?) — conferir vocabulário vetado da bíblia §12 contra o `index.html`, que a etapa 3 não passou pelo `narrative-critic` | médio |
| "Torneio de fim de semana, contra outros jogadores" | §1.3 | condicional | a própria §3 diz "se o PvP for desligado, a linha sai"; PvP é gated por `meetsPvpBond` — jogador novo não vê Torneio por semanas; a ficha promete no dia 1 | baixo |
| "Responda ao Oráculo — seis perguntas sobre você" | par. 2 | incompleto | o Oráculo também colhe nome, data/hora de nascimento e cidade (`CityPicker.tsx`, `oracle.ts` "chinês, rashi védico, 4 números") — dado sensível que a **Data Safety** precisa declarar; a ficha minimiza | médio para `alpha-compliance`, não para marca |

### 3.3 Colisão do nome (REGISTRO §14.1)

Decisão do dono: **fica**. A ficha **não cria claim novo** que agrave: não usa "digi", "vírus/dado/vacina" aparecem só na tabela interna §3 (não no texto colado), não cita escada rookie→mega. ✅. Único cuidado: a §6.2 pede screenshot "rookie à esquerda, ultimate/mega à direita" — vocabulário Bandai **no briefing de arte**, que pode vazar para legenda. Baixo — trocar por "primeira/última forma".

### 3.4 `manifest.json` e `og:image`

- **`description` é a do fork, palavra por palavra**: `git show 12cb739a:public/manifest.json`
  (commit que criou o arquivo, DigiApp) → *"Complete real-life tasks to evolve and care for your
  digital companion in this retro pixel-art productivity app"* = o atual. Só o `name` trocou
  `DigiApp` → `Soulmon`, mantendo **"Gamified Productivity"** — que é exatamente o
  enquadramento que `01-VISAO.md` §2 nega ("não é um placar… combustível de engajamento").
  Teste de troca de logo: **falha total** (serve para Habitica). `04-IDENTIDADE-VISUAL.md`
  §10.1 registra os valores mas não os critica. **Alto para marca, 1 linha de conserto** —
  dono `soulmon-copy-redator` + `soulmon-narrative-critic`.
- `lang: "pt-BR"` com `name`/`description` em inglês — já aberto no manual §10.1 obs. 2. Ainda aberto.
- `theme_color: #0f766e` é o **`--sm-primary` antigo**; o token vivo é `--sm2-primary-ink =
  #0B6F68` (`src/index.css` l. 5189). Duas verdades de cor da marca. Baixo.
- `categories: ["productivity","lifestyle","games"]` × ficha "Estilo de vida" primeiro. Baixo.
- **`og:image` = `favicon-512x512.png`**: com `twitter:card summary` vira um quadrado de 120 px
  ao lado do texto — funciona como **ícone**, não como key visual; não mostra o Visor, a
  criatura nem a tese "pixel dentro, vetor fora". `04` §10.0 já diz "trocar por um key visual
  1200×630 quando a squad-arte gerar", e a `PLAY-FICHA.md` §6.3 pede a feature graphic
  1024×500 — **são o mesmo pedido em dois lugares sem um id comum** na fila
  `docs/ASSETS-A-GERAR.md`. Médio — dono `squad-arte`; a `og:image` deve ser derivada da
  feature graphic (recorte 1200×630), não um terceiro asset.
- `public/favicon-512x512.png` é a marca canônica desde `005a2941` (chama + cristal, 15/09) —
  a suspeita da ficha §0 ("ainda seja a arte D") está **superada**; a linha pode sair. Baixo.

---

## 4. Tabela final — achado · severidade · conserto · dono

| # | Achado | Sev. | Conserto | Dono |
|---|---|---|---|---|
| 1 | GitHub Actions parado desde 16/09 (cobrança); 339 runs vermelhos; nenhum portão de CI rodou hoje; ninguém registrou | **fatal (processo)** | dono regulariza Billing & plans; operador grava bloco "git × ar" com data de retorno; hook passa a imprimir `gh run list --workflow ci.yml --limit 1` | dono → `soulmon-operador` |
| 2 | Ficha da Play: "ninguém tem outra igual" é falso (semente determinística, `newReading.ts`) | alto | trocar por "gerada a partir das suas respostas" (PT/EN) | `soulmon-copy-redator` + `soulmon-narrative-critic` |
| 3 | `manifest.json` `name`/`description` = texto do fork ("Gamified Productivity…"), contra `01-VISAO` §2 | alto (marca) / baixo (esforço) | reescrever 2 campos em EN na voz da bíblia; `lang` → `en` ou par PT | `soulmon-copy-redator` → `staff-frontend` |
| 4 | Título EN `Soulmon: Habit Pet` e PT falham o teste de troca de logo (= Finch) | médio | usar os 12 chars sobrando para o gancho próprio | `soulmon-copy-redator` |
| 5 | Ficha: "não conta os dias em que você faltou" contradiz `MISS_INTERVENTION_AT`/"últimas sete" | médio | "não te cobra pelos dias…" | `soulmon-copy-redator` |
| 6 | `index.html` (`og:*`, `description`) não passou pelo `narrative-critic`: "evolui com você", "nunca cobrança" — vocabulário diferente da ficha | médio | rodar a ficha e o `<head>` juntos pelo crítico; um vocabulário | `soulmon-narrative-critic` |
| 7 | R2 aplicado sem o eval de 5 casos que a governança exigiu | médio | escrever `evals/coordenador.md` com 5 pedidos reais do STATUS e o roteamento esperado; rodar 1× | `soulmon-coordenador` |
| 8 | Portões divergem: `/implementar-wp` sem `npm run build`; CI sem build (declarado); `soulmon-operador.md` diz que o CI builda | médio | acrescentar `npm run build` ao passo 5 do command; corrigir a linha "CI" do operador | `soulmon-coordenador`, `soulmon-operador` |
| 9 | 3 ponteiros `higgsfield-*` são symlinks git materializados como texto no Windows — skill do repo não carrega e divergiu da global; skeptic da manhã diagnosticou errado (`.agents/` existe) | médio | apagar `.claude/skills/higgsfield-*` + `.agents/` do repo (skill vive na conta) ou virar diretório real | `soulmon-operador` |
| 10 | `11-GLOSSARIO` (09/09) sem 17 termos de hoje; `09-HISTORICO` (10/09) sem 234 commits / PRs #40–#99 | médio | `/squad-docs atualizar 11` e `atualizar 09`; `docs-delta.mjs` nunca lista os dois — colocar regra "a cada N PRs" no `12-COMO-MANTER` | `doc-bibliotecario`, `doc-historiador` |
| 11 | `guarda-plataforma`: PL-1..PL-4 "aguarda o primeiro `/guarda-soulmon plataforma`" — nunca rodou; `targetSdk 36` não provado (e não pode, #1) | médio | rodar o command, colar saída, mover estado | `soulmon-guarda-plataforma` |
| 12 | `og:image` = favicon 512: ícone, não key visual; pedido duplicado (`04` §10.0 e `PLAY-FICHA` §6.3) sem id na fila | médio | 1 id em `ASSETS-A-GERAR.md`: feature 1024×500 + recorte 1200×630 | `squad-arte` |
| 13 | `docs-sync.yml` usa `claude-code-action@v1` — única tag móvel do repo | baixo (médio quando o job rodar) | prender por SHA + comentário | `soulmon-operador` |
| 14 | 4 agentes sem `model:`; `design-critic`/`staff-frontend` duplicados local×global com conteúdo diferente | baixo | declarar `model:`; apagar as cópias globais ou documentar precedência | `alpha-governanca` propõe; dono apaga globais |
| 15 | `00-MAPA.md` coluna "dono" de `PRINCIPIOS-DE-WIREFRAME`/`INVENTARIO-WIREFRAMES` cita agentes ⚰️ sem lápide | baixo | "procedimento do `METODO.md` (ex-…)" | `doc-bibliotecario` |
| 16 | STATUS: "dist sem PNG" (7 ficam, de propósito); "8 testes" (são 12+4); `LADDER_TIERS` e `findahelpline` em `chatSafety.ts` como ponteiros que não existem; `EXCECOES` atribuída à bíblia (está no teste) | baixo | ajustar as 4 frases | `doc-verificador` → redatores |
| 17 | ADR-002: comando de verificação da própria ADR reprova no Windows (CRLF) | baixo | `diff <(tail -n +14 … \| tr -d '\r') …` | `doc-mantenedor` |
| 18 | `google-services.json` ainda do DigiApp (`project_id digiapp-88296`); `build.gradle` só avisa | baixo (já em `PLAY-LANCAMENTO` §C.2) | ainda aberto — depende do dono | dono |
| 19 | `vite.config.ts` comentário "38 aliases" × 37 removidos | baixo | ainda aberto (declarado no STATUS de hoje, não corrigido) | `staff-frontend` |

## 5. O que continua sem dono

- **Quem olha o CI.** O `soulmon-operador` tem a linha no runbook; ninguém tem o gatilho.
  Enquanto o hook não imprimir o estado do último run, o próximo apagão também dura 6 dias.
- **Vocabulário de marca fora do app** (`index.html` `<head>`, `manifest.json`, README,
  loja): a bíblia vale para "texto de jogador"; o `narrative-critic` é despachado pela
  `squad-narrativa`; a `squad-arte` faz imagem. Texto de **superfície de distribuição** não
  tem dono declarado — hoje ficou entre `alpha-growth` (escreveu a ficha) e ninguém (o OG).
- **Envelhecimento do glossário e do histórico**: o `docs-delta.mjs` mede código → doc; os
  dois docs não têm código-fonte, então nunca aparecem no delta. Falta a regra de quando
  rodam (`12-COMO-MANTER`).
- **Eval de roteamento do coordenador**: `references/evals-da-squad.md` existe só na conta
  global; nenhum eval do Soulmon existe; nenhum agente local é dono de rodá-lo.
- **`skills-lock.json`**: hash não auditável por ninguém do roster.
