# 13 · Governança do sistema de agentes do Soulmon

> Auditoria de `alpha-governanca`, 21/09/2026, somente leitura. Repo: `D:\Soulmon\repo`.
> Referência sempre por `caminho` + SÍMBOLO/§, nunca por número de linha. Contagens vêm de
> `Glob`/`Grep` (o equivalente a `ls | wc -l` e `grep -c`); o comando que reproduz está ao lado.
> **Diagnóstico e proposta estão separados** (§8). Nada foi alterado.

---

## 0. Inventário medido (não o declarado)

| O que | Medido | Comando |
|---|---|---|
| Agentes do repo | **64** `.md` | `ls .claude/agents/*.md \| wc -l` |
| Skills do repo com `SKILL.md` | **8** (prod-squad, squad-som, manter-docs, squad-design, squad-docs, squad-arte, soulmon-coordenador, squad-narrativa) | `ls .claude/skills/*/SKILL.md \| wc -l` |
| "Skills" `higgsfield-*` em `.claude/skills/` | **7 symlinks** (arquivo de 1 linha: `../../.agents/skills/higgsfield-generate`) apontando para `.agents/skills/higgsfield-*/SKILL.md` — a fonte real é `.agents/`, não `.claude/` | `cat .claude/skills/higgsfield-generate` |
| Commands | **9** | `ls .claude/commands/*.md \| wc -l` |
| Hooks | **1** (`.claude/hooks/session-start.sh`, registrado em `.claude/settings.json` › `SessionStart`) | — |
| Workflows | **6** (`ci`, `docs-sync`, `android-build`, `desktop-build`, `desktop-release`, `sync-irmaos`) | `ls .github/workflows/*.yml \| wc -l` |
| Agentes globais | **48** = 37 `alpha-*` + 11 genéricos do kit prod-squad | `ls ~/.claude/agents/*.md \| wc -l` |
| Skills globais | **13** (agents-sdk, cloudflare, cloudflare-email-service, cloudflare-one, cloudflare-one-migrations, durable-objects, sandbox-sdk, turnstile-spin, web-perf, workers-best-practices, wrangler, prod-squad, squad-alpha) | `ls ~/.claude/skills/*/SKILL.md \| wc -l` |
| `D:\Soulmon\.claude\` (fora do repo) | **0 skills** — só `settings.local.json` e `launch.json`. A premissa "a raiz também tem skills" **não confere** hoje | `ls D:\Soulmon\.claude` |
| `higgsfield-*` no global | **0** — a premissa "instaladas nos dois lugares" **não confere**; existem só no repo (`.agents/` + symlink em `.claude/`) | `ls ~/.claude/skills \| grep higgs` |

Os 11 genéricos existem **byte a byte iguais** no repo e no global (conferido em `design-critic.md`,
`product-manager.md`, `staff-frontend.md`: mesmo frontmatter, mesmo Mandate). O `skills-lock.json` do
repo lista os 7 higgsfield.

---

## 1. Tabela: agente do repo → quem invoca → última citação de uso

Legenda da coluna **Uso**: cito o artefato mais recente que **prova despacho** (relatório, ledger,
carimbo, bloco no STATUS). "NUNCA INVOCADO" = nenhum artefato em `docs/`, `docs/reviews/`,
`product/`, `squad-alpha-runs/` leva o nome dele como autor.

### 1.1 Genéricos do kit prod-squad (11 · idênticos ao global)

| Agente | Invocado por | Uso (última evidência) | Veredito |
|---|---|---|---|
| `business-strategist` | `prod-squad` SKILL (global+repo) | nenhum artefato em `docs/`, `product/` ou `squad-alpha-runs/` (`grep -rl business-strategist docs product` → 0) | **NUNCA INVOCADO** |
| `growth-engineer` | `prod-squad` | idem → 0 | **NUNCA INVOCADO** |
| `investor-skeptic` | `prod-squad` › revision-loop | `product/soulmon-01/sweeper/skeptic-review.md` (run prod-squad, ago/2026). Zero citações em `docs/` | dormente desde ago/2026 |
| `product-manager` | `prod-squad` | só `docs/squad/02-SQUAD.md` cita `product-manager` — e é o `soulmon-product-manager`. Zero uso próprio | **NUNCA INVOCADO** |
| `product-designer` | `prod-squad` | idem: toda citação é `soulmon-product-designer` (`docs/design/DECISOES-WIREFRAME.md`, `docs/STATUS.md`) | **NUNCA INVOCADO** (duplica `soulmon-product-designer`) |
| `principal-architect` | coordenador (linha "Servidor, KV/D1, deploy, workers, CI"; "Desktop"), `squad-som/CONTRACT.md` §2 | zero artefato com o nome em `docs/` ou `squad-alpha-runs/` | roteado, **nunca despachado** |
| `staff-backend` | coordenador ("Servidor…") | `product/soulmon-01/sweeper/backend-fixes.md` (ago/2026); zero em `docs/` | dormente desde ago/2026 |
| `staff-frontend` | coordenador (3 linhas), `squad-design` (handoff), `squad-som/CONTRACT.md` | `docs/STATUS.md` (vários blocos set/2026), `docs/HANDOFF-IMPLEMENTACAO-IDENTIDADE.md`, `docs/design/wireframes/**/identidade/*.dc.html` (handoff em ~200 canvases) | **vivo** — é o implementador de fato |
| `qa-sweeper` | coordenador ("Testes, cobertura, release"), `squad-docs/CONTRACT.md` §2, `squad-som/CONTRACT.md` | zero artefato nominal; `product/soulmon-01/sweeper/*` é do orquestrador prod-squad | roteado, **nunca despachado** por nome |
| `security-architect` | coordenador (2 linhas), `prod-squad`, `squad-som/CONTRACT.md` | `product/soulmon-01/sweeper/security-verification.md` (ago/2026); auditoria de segurança do STATUS §1 foi feita por sessão direta e `alpha-security` (run soulmon-02), não por ele | dormente desde ago/2026 |
| `design-critic` | `squad-design` SKILL (bloqueante), `prod-squad` | `docs/design/DECISOES-WIREFRAME.md` (14 fluxos, rodadas 1–3), `docs/design/wireframes/*/identidade/CRITICA.md`, `docs/STATUS.md` (blocos de 14–21/09) | **vivo** |

⚠️ **Achado transversal dos 11:** o frontmatter tem `name: Design Critic`, `name: Staff Frontend
Engineer`, `name: QA Sweeper`… (com espaço e maiúscula), enquanto **toda** tabela de roteamento
despacha por `design-critic`, `staff-frontend`, `qa-sweeper`. O identificador de subagente é o
`name`, não o nome do arquivo. Que o `design-critic` **funciona** na squad-design (há CRITICA.md)
sugere que a resolução por arquivo/fuzzy segura hoje — mas é a única família do roster fora do
padrão `lowercase-hífen`, e nenhum dos 11 declara `model:`. Os 53 restantes seguem o padrão do
`squad-docs/CONTRACT.md` §1.

### 1.2 Squad de revisão do `soulmon-maestro` (16 — o doc diz 14)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `soulmon-maestro` | `/revisao-soulmon`, coordenador | `docs/reviews/2026-08-03/00-CONSOLIDADO.md` — única rodada, há 7 semanas | **1 uso, nunca mais** |
| `soulmon-user-researcher` | maestro (Onda 0) | `docs/reviews/2026-08-03/soulmon-user-researcher.md`; citado em `docs/manual/01-VISAO.md` | 1 uso (ago) |
| `soulmon-monetization-strategist` | maestro (Onda 2) | `docs/reviews/2026-08-03/soulmon-monetization-strategist.md` | 1 uso (ago) |
| `soulmon-growth-aso` | maestro (Onda 2) | `docs/reviews/2026-08-03/soulmon-growth-aso.md`; `docs/NARRATIVA-COPY.md` cita | 1 uso (ago) |
| `soulmon-ip-brand-guardian` | maestro, coordenador ("Arte de criatura, PI"), `squad-narrativa`, `squad-som/CONTRACT.md` | `squad-alpha-runs/som-01/discovery/parecer-pi-e-dados.md` (set); `docs/NARRATIVA-E-UNIVERSO.md` §14; `docs/REGISTRO-DE-DECISOES.md` §14 | **vivo** — reusado por 3 squads |
| `soulmon-behavioral-psychologist` | `squad-narrativa` (bloqueante), `squad-som/CONTRACT.md` | `squad-alpha-runs/som-01/discovery/revisao-cortes-comportamento.md`; `docs/NARRATIVA-*` | **vivo** |
| `soulmon-monster-taming-designer` | coordenador ("Arte de criatura"), `squad-narrativa` | citado em `docs/manual/00-MAPA.md`; sem artefato próprio depois de ago | citado, sem artefato |
| `soulmon-product-designer` | `squad-design` (parecer IA/fluxo) | `docs/design/DECISOES-WIREFRAME.md` (todas as 14 famílias), `docs/STATUS.md` | **vivo** |
| `soulmon-productivity-expert` | maestro (Onda 1) | sem relatório em `docs/reviews/2026-08-03/` (só 3 dos 14 rodaram até o fim — o próprio `02-SQUAD.md` regra 2 admite "três agentes morreram") | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-gamification-expert` | maestro | idem | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-mobile-game-designer` | maestro | idem | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-retention-analyst` | maestro | idem; a tese dele (telemetria) virou `soulmon-guarda-medicao` | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-tech-feasibility` | maestro, `squad-som/CONTRACT.md` ("custo") | idem; `squad-alpha-runs/soulmon-02/custo-geracao-sprite.md` não o cita como autor | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-product-manager` | maestro (Onda 3) | idem | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-ai-companion-designer` | maestro (+ registro 02-SQUAD) | idem; a lane (chat Groq + sprites) hoje é do `guarda-vinculo` e da squad-arte | **NUNCA PRODUZIU ARTEFATO** |
| `soulmon-devils-advocate` | maestro (pós-Onda 2), `squad-som/CONTRACT.md` ("só para a premissa da Fase 1") | idem; no som-01 quem atacou foi `alpha-skeptic` (`discovery/ataque-gate*.md`) | **NUNCA PRODUZIU ARTEFATO** |

### 1.3 Guardas custodiais (7)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `soulmon-guarda-linha-vermelha` | `/guarda-soulmon`, `/implementar-wp`, `/destrinchar-estudo`, `squad-design`, `squad-narrativa`, `squad-docs`, `squad-som` | `docs/STATUS.md` (≥14 blocos set/2026), `docs/plano-melhorias/ledger/vetos.md`, `docs/plano-melhorias/mobbin/linha-vermelha.md` | **vivo** — o veto mais reusado do sistema |
| `soulmon-guarda-constancia` | os 3 commands + coordenador | `docs/plano-melhorias/ledger/constancia.md`, `estudo/`, `mobbin/` (datas 02–07/09/2026 no `LEDGER.md`) | vivo |
| `soulmon-guarda-medicao` | idem + `squad-som` (Fase 4) | `ledger/medicao.md`, `estudo/medicao.md` | vivo |
| `soulmon-guarda-nascimento` | idem + coordenador ("Oráculo, onboarding") | `ledger/nascimento.md`, `mobbin/nascimento.md` | vivo |
| `soulmon-guarda-permanencia` | idem | `ledger/permanencia.md` | vivo |
| `soulmon-guarda-sustento` | idem + coordenador ("Billing") | `ledger/sustento.md` | vivo |
| `soulmon-guarda-vinculo` | idem + coordenador ("Push, chat") + `squad-som` (veto D11) | `ledger/vinculo.md`, `estudo/vinculo.md`, som-01 | vivo |

Última auditoria de custódia datada: **07/09/2026** (`docs/plano-melhorias/LEDGER.md`). Duas
semanas sem `/guarda-soulmon` enquanto a squad-design mudou 14 canvases e o `REGISTRO-DE-DECISOES`
ganhou §13–§14 — o ledger provavelmente já descreve WPs que o código não reflete.

### 1.4 SQUAD-DOCS (10 `doc-*`)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `doc-mantenedor` | `/manter-docs`, coordenador `fechar`, `docs-sync.yml` › job `mantenedor`, hook (`docs: DEFASADO`) | `docs/STATUS.md` (blocos "sincronização pós-merge"), `docs/manual/.sincronizado.json` | **vivo** — único agente com gatilho automático |
| `doc-verificador` | `squad-docs` Fase C, `manter-docs` passo 4 | carimbo `verificado em … por doc-verificador` em todo `docs/manual/*.md`; STATUS | vivo |
| `doc-bibliotecario` | Fase D, `manter-docs` passo 5 | `docs/manual/00-MAPA.md`, STATUS | vivo |
| `doc-historiador` | Fase B | `docs/manual/09-HISTORICO.md`, `10-DISCUSSOES-E-DECISOES.md`; STATUS | vivo |
| `doc-redator-regras` | Fase B | `01-VISAO.md`, `02-REGRAS-DE-NEGOCIO.md`; STATUS | vivo |
| `doc-redator-telas` | Fase B | carimbo em `03-FLUXO-DE-TELAS.md` | vivo (por carimbo) |
| `doc-redator-identidade` | Fase B | carimbo em `04-IDENTIDADE-VISUAL.md` | vivo (por carimbo) |
| `doc-redator-arquitetura` | Fase B | carimbo em `05`, `07`, `08` | vivo (por carimbo) |
| `doc-redator-referencia` | Fase B, `manter-docs` (`novos`) | carimbo em `06-REFERENCIA/*.md` | vivo (por carimbo) |
| `doc-cartografo` | Fase A (`scripts/docs-inventario.mjs`) | `docs/manual/12-COMO-MANTER.md` §medição; sem carimbo nominal | vivo, mas é **procedimento**: o agente roda um script e confere contagens |

### 1.5 SQUAD-DESIGN (2 novos + 3 reusados)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `design-curador-padroes` | `squad-design principios` | `docs/design/PRINCIPIOS-DE-WIREFRAME.md`; STATUS | vivo (entregou; a fase acabou) |
| `design-wireframer` | `squad-design desenhar` | `docs/design/wireframes/<fluxo>/*.dc.html` (14 famílias); STATUS | vivo (Fase 1 fechada) |
| `soulmon-design-lead` | `squad-design decidir`, `squad-som/CONTRACT.md` | `docs/design/DECISOES-WIREFRAME.md` (14 blocos), `docs/NARRATIVA-COPY.md` | **vivo** |
| `soulmon-screen-cartographer` | `squad-design inventario`, `squad-docs/CONTRACT.md` | `docs/design/INVENTARIO-WIREFRAMES.md`, `docs/manual/03-FLUXO-DE-TELAS.md` | vivo (entregou) |
| `soulmon-visual-designer` | `squad-design identidade` | `docs/design/wireframes/*/identidade/*`, `docs/HANDOFF-IDENTIDADE.md`, `00-MAPA.md` | **vivo** (Fase 2, 14 canvases) |

### 1.6 SQUAD-SOM (3)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `som-diretor-sonoro` | `squad-som` (roteamento por pergunta) | `squad-alpha-runs/som-01/discovery/*` (08–09/09), `prototyper/pacote-prompts.md`, `manifesto-lote-2026-09-21.md` | vivo, run fechado; A/B cego **não rodou** (sem crédito) |
| `som-produtor-assets` | idem | `prototyper/manifesto-lote-2026-09-21.md`, `src/utils/sonsAssets.ts` cabeçalho | vivo (S16, 21/09) |
| `som-engenheiro-audio` | idem | `discovery/spec-de-loudness.md` → `src/utils/loudness.ts`; `docs/PERGUNTAS-DO-DONO.md` | vivo |

⚠️ `squad-som` não tem **command** (`/squad-som` não existe em `.claude/commands/`); o coordenador
roteia para `/squad-som` como se existisse. Funciona por invocação de skill, mas a tabela mente.
Mesmo caso: `/squad-arte`.

### 1.7 SQUAD-ARTE (8)

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `arte-cenario`, `arte-criatura`, `arte-fx`, `arte-emblema`, `arte-marca`, `arte-hud-visor` | `squad-arte gerar <familia>` | `docs/ASSETS-A-GERAR.md` (fila por família), `docs/INVENTARIO-ASSETS.md`, STATUS (`/squad-arte`, 15/09) | vivos — mas **6 agentes com o mesmo framework e prompt-base, variando só a família** |
| `arte-conferente` | `squad-arte conferir` | `CONFERENCIA.md` por leva (fora do repo, `_gemini_out/`) | vivo |
| `arte-instalador` | `squad-arte instalar` | `docs/manual/00-MAPA.md`, commits `c11dc49d` (D1) | vivo |

Nenhum `arte-*` declara `model:` (a única família nova sem isso).

### 1.8 SQUAD-NARRATIVA (3) + coordenador

| Agente | Invocado por | Uso | Veredito |
|---|---|---|---|
| `soulmon-loremaster` | `/squad-narrativa lore` | `docs/NARRATIVA-E-UNIVERSO.md` (21/09), STATUS | vivo |
| `soulmon-narrative-critic` | `criticar` (bloqueante) | STATUS 21/09; `docs/NARRATIVA-COPY.md` | vivo |
| `soulmon-copy-redator` | `copy` | `docs/NARRATIVA-COPY.md`, STATUS | vivo |
| `soulmon-coordenador` | hook → `/soulmon start`; `fechar` | STATUS (2 blocos); `docs/STATUS.md` cita "maestro, os sete guardas, squad-som…" | vivo |

### 1.9 Resumo numérico

| Estado | Qtd | Quem |
|---|---|---|
| Vivo com artefato ≤ 14 dias | **36** | doc-* (10), design (5), arte (8), narrativa (3), som (3), guardas (7)… menos os abaixo |
| Usado 1× em ago/2026, nunca mais | **7** | maestro, user-researcher, monetization, growth-aso, investor-skeptic, staff-backend, security-architect |
| Roteado mas nunca despachado por nome | **2** | principal-architect, qa-sweeper |
| **NUNCA produziu artefato** | **11** | productivity-expert, gamification-expert, mobile-game-designer, retention-analyst, tech-feasibility, soulmon-product-manager, ai-companion-designer, devils-advocate, business-strategist, growth-engineer, product-manager (genérico) |
| Duplica outro por nome | **1** | product-designer (genérico) ≈ soulmon-product-designer |

`wc`: 36 + 7 + 2 + 11 + 1 = 57; os 7 restantes (monster-taming, guardas menos linha-vermelha…)
estão citados sem artefato datado nas duas últimas semanas — "vivo por citação".

---

## 2. Sobreposição repo × global

### 2.1 Os 11 genéricos — cópia exata

Precedência do Claude Code: agente de **projeto** (`.claude/agents/`) vence agente de **usuário**
(`~/.claude/agents/`) com o mesmo `name`. Como o conteúdo é idêntico, hoje não há conflito — há
**custo de drift**: quando o kit prod-squad global for atualizado, a cópia do repo fica para trás
sem nada ficar vermelho (é o footgun 9 do `CLAUDE.md` aplicado ao roster).

| Genérico | Equivalente `alpha-*` global | Equivalente `soulmon-*` do repo | Quem vence na prática |
|---|---|---|---|
| `product-designer` | `alpha-product-designer` | `soulmon-product-designer` (**usado**) | soulmon-* — o genérico é peso morto |
| `product-manager` | `alpha-product-manager` | `soulmon-product-manager` (nunca usado) | nenhum — dois mortos |
| `design-critic` | `alpha-design-critic` | — | `design-critic` (repo) — **é o usado**; `alpha-design-critic` fica sem uso |
| `business-strategist` | `alpha-estrategista-negocio` | — | nenhum |
| `growth-engineer` | `alpha-growth` | `soulmon-growth-aso` | nenhum |
| `investor-skeptic` | `alpha-skeptic` (**usado** no som-01) | `soulmon-devils-advocate` | `alpha-skeptic` |
| `security-architect` | `alpha-security` (usado no soulmon-02) | — | `alpha-security` |
| `principal-architect` | `alpha-architect` | — | nenhum despachado; `PROGRAMA.md` atribui o ADR de conta a `alpha-architect` |
| `staff-backend` | `alpha-backend` (usado, D-23) | — | `alpha-backend` |
| `staff-frontend` | `alpha-frontend` (usado, D-23) | — | **os dois** — a squad-design manda para `staff-frontend`, o PROGRAMA para `alpha-frontend`. Duas fontes da verdade para "quem implementa a tela" |
| `qa-sweeper` | `alpha-qa` | — | nenhum |

**Diagnóstico:** o repo carrega 11 arquivos cujo único consumidor é a skill `prod-squad`, que
também existe **em duplicata** (`.claude/skills/prod-squad/` no repo e no global) e cujo ciclo
formal rodou uma vez (`product/soulmon-01/`, ago/2026) antes de ser substituído pela SQUAD-Alpha
(`squad-alpha-runs/`). Desses 11, apenas `staff-frontend` e `design-critic` têm uso real no
sistema atual.

### 2.2 `alpha-*` dependidos sem estar no roster do coordenador

`squad-som/CONTRACT.md` §3 declara 7 dependências externas (`alpha-orquestrador`, `-skeptic`,
`-governanca`, `-benchmark`, `-requisitos`, `-redator-ux`, `-perf-a11y`). A tabela do coordenador
**não cita nenhum `alpha-*`**. Quem pede "quanto pesa em bytes?" fora da squad-som não tem para
onde ir (ver §3).

---

## 3. Disciplina sem dono (tabela de roteamento de `soulmon-coordenador/SKILL.md`)

Cruzei as 19 linhas da tabela com as árvores do repo e com o que o `CLAUDE.md` declara existir.

| Área | Dono na tabela? | Realidade | Risco |
|---|---|---|---|
| `android/` (Kotlin, Gradle, widgets, `google-services.json`) | "Android/widget/APK → `staff-frontend`" | `staff-frontend` é agente de **React/TS** ("components, state, data fetching"); não sabe RemoteViews (footgun 2) nem jvmTarget (footgun 3). Nenhum agente cita Kotlin | dono nominal, competência errada |
| `desktop/` (Electron, electron-builder, updater, Authenticode) | "→ `staff-frontend` + `principal-architect`" | `principal-architect` nunca foi despachado; a auditoria do desktop foi de sessão direta (`squad-alpha-runs/soulmon-02/auditoria-desktop.md`) | idem |
| `workers/` (push-scheduler, FCM, deploy manual `wrangler deploy`) | "Servidor… workers → `principal-architect` → `staff-backend`" | zero despacho. O `CLAUDE.md` avisa "worker de push NÃO builda no push da main" — ninguém é dono do deploy manual; memória do dono já registra "worker de push não deployado" | **sem dono operacional** |
| `scripts/` (docs-delta, docs-inventario, sync-oracle-data, chroma-key, upscale…) | — | `tsconfig.server.json` exclui `scripts/` de propósito ("4 erros abertos"); o bug do backup-que-vira-fonte (`upscale-preimpressao.py`, memória global) é desta família | **sem dono** |
| CI / `.github/workflows/` | "…CI → `principal-architect` → `staff-backend`" | quem consertou o gate morto foi `alpha-security`/sessão (`ci.yml` comentários S-6); `android-build.yml` ainda dispara em `version-b`, branch que o `CLAUDE.md` diz não existir | dono nominal, nunca exercido |
| Público / legal (`public/termos.html`, `privacidade.html`, Data Safety, idade 18+) | "Telemetria, privacidade, Data Safety → `guarda-medicao`" cobre metade | Termos/política foram do `alpha-compliance` + `alpha-redator-ux` (PROGRAMA D-22); nenhum está na tabela; a decisão 3.4 "risco assumido" tem 3 gatilhos de expiração e **ninguém vigia** | **sem dono** |
| i18n EN | — | `CLAUDE.md` › "Idioma: inglês é a base" tem régua (`resolveLanguage`) mas nenhum agente possui "o EN está bom / completo?"; `copy-redator` escreve PT+EN mas só sob a squad-narrativa | **sem dono** |
| Acessibilidade | `design-critic` "a11y" dentro do W1–W10 | só em wireframe; no código (`aria-live`, foco, `prefers-reduced-motion`) não há dono. `alpha-perf-a11y` só na squad-som | parcial |
| Performance / bytes (`dist/` commitado, `assetsInlineLimit`, `CACHE_VERSION`, WebP) | — | `alpha-perf-a11y` é "dono único de bytes" **só no som**; a squad-arte instala PNG/WebP sem orçamento declarado | **sem dono** |
| Dados / telemetria / `metrics.js` | `guarda-medicao` | ok — mas o `retention-analyst` continua no roster fazendo a mesma pergunta | duplicidade |
| Suporte ao usuário / crise / incidente (login morre em prod, cache preso, save plantado) | — | os incidentes reais do `STATUS.md` §1 (deploy desfazia login; SEC-3) foram sessão direta; nenhum runbook de incidente, nenhum agente "o que fazer quando produção quebrou" | **sem dono** |
| Release / Play Store ops (keystore, Play App Signing, ficha, `PLAY_REQUIRE_ACCOUNT_BINDING`) | "Testes, cobertura, release → `qa-sweeper`" | `qa-sweeper` nunca despachado; o `GUIA-DO-DONO.md` é quem carrega isso, escrito por sessão | dono nominal |
| Custo / orçamento (R$ 200/mês, créditos Higgsfield/Gemini, Groq) | — | `tech-feasibility` existe para isso e **nunca produziu**; o A/B do som travou por 0,45 crédito sem ninguém vigiar saldo | **sem dono** |
| Memória entre runs / retro do sistema | — | `squad-alpha-runs/memoria/soulmon.md` existe; `alpha-governanca` só é chamado pelo som | sem gatilho |
| Repos irmãos (`vendor/class-system`, `sync-irmaos.yml`, `SIBLING_REPOS_TOKEN`) | — | ADR-002 é de sessão; o secret "falha toda segunda e ninguém olha" (GUIA-DO-DONO C2) | **sem dono** |

Contagem: **7 áreas sem dono nenhum**, 5 com dono nominal nunca exercido, 2 parciais.

---

## 4. Roster inflado — por squad

| Squad / família | Declarado | No disco | Com artefato real | Só no `.md` |
|---|---|---|---|---|
| Maestro (`docs/squad/02-SQUAD.md`) | 14 | **16** (o doc esqueceu os 2 do registro de alterações) | 4 (maestro, user-researcher, monetization, growth-aso — todos ago/2026) + 3 reusados vivos (ip-brand, psychologist, product-designer) | **9** |
| Genéricos prod-squad | 11 | 11 (+11 global) | 2 vivos (staff-frontend, design-critic) + 3 dormentes | **6** |
| Guardas | 7 | 7 | 7 | 0 |
| Docs | 10 | 10 | 10 | 0 |
| Design | 2 + 6 reusados | 2 | 2 + 3 reusados vivos | 0 |
| Som | 3 | 3 | 3 | 0 (run fechado, A/B pendente) |
| Arte | 8 | 8 | 8 | 0 — mas 6 são o mesmo agente parametrizado |
| Narrativa | 3 | 3 | 3 | 0 |
| Coordenador | 1 | 1 | 1 | 0 |
| **Total** | 59 declarado | **64** | ~43 | **15** (23% do roster) |

Custo que ninguém contabiliza: cada `.md` de agente é lido pelo modelo quando listado como
`subagent_type` disponível, entra no `00-MAPA.md` §7 (guard `docsManual.contract.test.ts` exige
que agente novo seja indexado — logo cada agente morto custa uma linha de manual verificada por
`doc-bibliotecario` a cada sincronização), e aparece em 4 CONTRACTs como "não usado neste run"
(`squad-som/CONTRACT.md` lista **24 nomes** para dizer que não usa).

---

## 5. Consistência dos portões: hook × CI × docs-sync × coordenador × commands

| Portão | `session-start.sh` | `ci.yml` (PR + push main) | `docs-sync.yml` (push main) | coordenador `fechar` | `/implementar-wp` | `CLAUDE.md` › Comandos |
|---|---|---|---|---|---|---|
| `npm ci` / `npm install` | `npm install` se faltar `node_modules` | `npm ci` | `npm ci` | — | — | — |
| Integridade `vendor/class-system` (sha256 do blob) | — | ✅ | — | — | — | — |
| `tsc --noEmit` (src) | — | ✅ | — | ✅ | ✅ | ✅ |
| `tsc -p tsconfig.server.json` | — | ✅ | — | ✅ | **✗ omitido** | ✅ (com aviso "já voltou vermelho por ficar de fora") |
| `tsc -p desktop/tsconfig.json` | — | ✅ | — | ✅ | ✅ | ✅ |
| `vitest run` (suíte inteira) | — | ✅ | — | ✅ | ✅ | ✅ |
| guard do manual (2 arquivos) | ✅ | (dentro da suíte) | ✅ explícito | (dentro) | (dentro) | — |
| `scripts/docs-delta.mjs` | ✅ `--resumo` | — | ✅ `--strict` | via `/manter-docs` | — | — |
| `npm run build` (+ `dist/` commitado) | — | **✗ de propósito** (comentário: `android-build.yml` builda na main) | — | ✅ "se `src/` mudou" | **✗** | ✅ |
| `narrativa.contract.test.ts` | — | (dentro) | — | — | — | — |
| Screenshot Playwright | — | — | — | — | ✅ "se mexe em UI" | ✅ Convenções |

**Onde diverge, e o que custa:**

1. **`/implementar-wp` omite `tsc -p tsconfig.server.json`** — exatamente o portão que o
   `CLAUDE.md` diz já ter voltado vermelho por ficar de fora. Um WP de billing (guarda-sustento)
   passa pelo command sem tipar `functions/`.
2. **Build não roda em PR** (`ci.yml`, declarado). Como o fluxo real é push direto na main,
   quebra de `vite build` só acende em `android-build.yml` **depois** de publicado — e o Cloudflare
   Pages já publicou o `dist/` commitado (que pode ser de outro build). A régua "dist/ é commitado"
   não tem gate nenhum conferindo que `dist/` corresponde ao `src/` do mesmo commit.
3. **O hook lê o bloco errado do STATUS.** `session-start.sh` faz
   `grep -m1 -oE '^> ## ⏳ DEPENDE DO DONO \([0-9/]+\)'`. No `docs/STATUS.md` de hoje o bloco do
   topo é `> **DEPENDE DO DONO:** docs/PERGUNTAS-DO-DONO.md — 7 itens` (formato diferente); o
   único que casa com o regex é `> ## ⏳ DEPENDE DO DONO (09/09/2026)`, no meio do arquivo. **Toda
   sessão abre com a lista de pendências de 09/09**, não com as 7 perguntas atuais.
4. **O hook roda `npx vitest run` de dois arquivos síncrono a cada sessão** (`set -uo pipefail`,
   sem timeout). Com o flake por CPU registrado no `squad-som/SKILL.md` (`assets.contract.test.ts`),
   uma máquina ocupada atrasa o início da sessão sem produzir nada que o `docs-sync.yml` já não
   produza no push.
5. **`docs-sync.yml` › job `mantenedor` nunca rodou** (sem `ANTHROPIC_API_KEY`; "depende do dono").
   O caminho automático do `doc-mantenedor` é, na prática, o hook + coordenador. O comentário do
   workflow admite; o `CLAUDE.md` vende como "roda sozinho".
6. **`android-build.yml` dispara em `branches: [main, version-b]`** — `version-b` "não existe
   aqui" (`CLAUDE.md` › Deploy). Inofensivo, mas é a mesma família de mentira-que-não-fica-vermelha.
7. **`sync-irmaos.yml` roda `tsc` + `vitest` no cron de segunda** e é o único workflow com o
   segredo `SIBLING_REPOS_TOKEN`, que o `GUIA-DO-DONO.md` C2 diz não estar configurado. Portão
   que falha toda semana vira ruído (lição 12 do próprio repo).
8. **Coordenador `fechar` e `CLAUDE.md` concordam** (5 portões). `/implementar-wp` e `ci.yml`
   são os dois subconjuntos divergentes — cada um com um buraco diferente.

---

## 6. Skills globais que o projeto poderia usar e não usa

| Skill global | Cabe onde | Citada no repo? (`grep -rl` fora de `.agents/`) |
|---|---|---|
| `cloudflare` (415 arquivos de referência: KV, D1, Pages, Workers, bindings, cron) | `functions/api/_kv.js`, `workers/`, `wrangler.jsonc`, ligar D1 (SEC-3), `docs/BILLING-SETUP.md` | **0** |
| `wrangler` | deploy manual do `workers/`, `wrangler pages secret put` (GUIA-DO-DONO corrige comando errado à mão) | **0** |
| `workers-best-practices` | `workers/push-scheduler.js`, `fcm.js`, `webpush.js` | **0** |
| `durable-objects` | `claimOrderAtomic` (SEC-3 — alternativa a D1 para CAS) | **0** — a alternativa nem foi considerada no ADR |
| `web-perf` | orçamento de bytes de `dist/`, `sw.js`, WebP, lazy do astronomy-engine | **0** (área sem dono, §3) |
| `turnstile-spin` | `/api/chat`, `/api/generate-sprite` — cota anti-abuso (`_aiGuard`) | 0 |
| `cloudflare-email-service`, `cloudflare-one*`, `agents-sdk`, `sandbox-sdk` | não se aplica | 0 |
| `squad-alpha` | é o molde declarado do `squad-som/CONTRACT.md`; PROGRAMA.md e runs vivem em `squad-alpha-runs/` | citada só pela squad-som |
| `prod-squad` | duplicada repo/global; substituída pela Alpha | roteada pelo coordenador ("Ciclo formal, PRD, ADR") — última vez usada em ago/2026 |
| `higgsfield-*` (7) | squad-arte, `som-produtor-assets` | citada **só** em `.claude/agents/som-produtor-assets.md` (2×) e `skills-lock.json`. `squad-arte/SKILL.md` **não cita nenhuma** — a squad de arte gera pelo Gemini web (`D:\Soulmon\scripts-arte\GUIA-GEMINI.md`) |

**Sobre a duplicata higgsfield:** não é repo × global — é `.agents/skills/higgsfield-*/`
(fonte) × `.claude/skills/higgsfield-*` (symlink de 1 linha). Uma fonte só; correto. O problema é
outro: 7 skills instaladas, 2 citações, e a squad que gera arte não as usa. `higgsfield-websites`,
`-video-explainer`, `-product-photoshoot`, `-marketplace-cards` não têm caso de uso no Soulmon.

---

## 7. Perguntas que ninguém possui — teste de fronteira

| Pergunta | Candidatos hoje | Conflito |
|---|---|---|
| "quem implementa a tela aprovada?" | `staff-frontend` (squad-design, coordenador) vs `alpha-frontend` (PROGRAMA D-23) | duas fontes |
| "isto aguenta o adversário?" | `alpha-skeptic` (som, Alpha) vs `investor-skeptic` (prod-squad) vs `soulmon-devils-advocate` (maestro) vs `soulmon-narrative-critic` (narrativa) vs `design-critic` (design) | 5 críticos, 3 sem uso |
| "quanto custa / cabe no orçamento?" | `soulmon-tech-feasibility` (nunca rodou) | sem dono efetivo |
| "o que o usuário sente / retém?" | `retention-analyst`, `user-researcher`, `behavioral-psychologist`, `guarda-medicao`, `alpha-comportamento` | 5 nomes, 2 vivos |
| "o produto está certo?" | `soulmon-product-manager`, `product-manager`, `alpha-product-manager`, `soulmon-maestro` | 4 nomes, 0 vivos |
| "o worker de push está no ar?" | ninguém | lacuna |

---

## 8. PROPOSTA (separada do diagnóstico)

Recomendação default: **cortar**. Cada item declara o que se perde.

### 8.1 Cortar (–26 arquivos, sem perda de capacidade viva)

| # | Cortar | Evidência | O que se perde | ROI |
|---|---|---|---|---|
| C1 | Os **9 genéricos sem uso** do repo: `business-strategist`, `growth-engineer`, `investor-skeptic`, `product-manager`, `product-designer`, `principal-architect`, `staff-backend`, `qa-sweeper`, `security-architect` | §1.1: 0 artefatos em `docs/`; `alpha-*` global cobre cada um; a cópia global continua existindo para o `prod-squad` | nada — o global permanece; o coordenador passa a rotear para `alpha-architect`/`alpha-backend`/`alpha-security`/`alpha-qa` | alto: –9 arquivos, –9 linhas no MAPA, fim do drift repo×global |
| C2 | **Skill `prod-squad` do repo** (pasta inteira, 12 arquivos) | duplicata exata da global; último uso ago/2026; substituída pela Alpha | nada — a global fica | médio |
| C3 | Os **9 do maestro sem artefato**: `productivity-expert`, `gamification-expert`, `mobile-game-designer`, `retention-analyst`, `tech-feasibility`, `soulmon-product-manager`, `ai-companion-designer`, `devils-advocate` + o próprio `soulmon-maestro` | §1.2: 1 rodada em 7 semanas, 3 de 14 chegaram ao fim; a lane de cada um foi absorvida por guarda/squad (retention → medicao; ai-companion → vinculo + arte; devils → alpha-skeptic; PM → coordenador+REGISTRO) | a **rodada de revisão em ondas**. Mitigação: guardar `docs/squad/00-BRIEFING.md` + `01-RUBRICA.md` como **doc**, e se um dia quiser rodar de novo, instanciar pela `squad-alpha` (é o que o som fez) | alto: –9, e o `02-SQUAD.md` deixa de mentir "14" |
| C4 | `soulmon-user-researcher`, `soulmon-monetization-strategist`, `soulmon-growth-aso` | 1 relatório cada, ago/2026; `guarda-sustento` cobre monetização; ASO só importa no run 3 (Play) | ASO fica sem dono até o run 3 — quando chegar, `alpha-growth` + `alpha-marca-*` existem no global | médio |
| C5 | `/revisao-soulmon` command | depende do maestro (C3) | idem C3 | baixo |
| C6 | Skills `higgsfield-websites`, `-video-explainer`, `-product-photoshoot`, `-marketplace-cards` (symlinks + `.agents/`) | 0 caso de uso; 0 citação | nada | baixo, mas limpa o `skills-lock.json` |

### 8.2 Fundir (–5 arquivos)

| # | Fusão | Motivo | Perda |
|---|---|---|---|
| F1 | `arte-cenario` + `arte-criatura` + `arte-fx` + `arte-emblema` + `arte-marca` + `arte-hud-visor` → **1 agente `arte-gerador`** com a tabela "família → bloco de estilo → destino" no corpo (ou em `squad-arte/CONTRACT.md`) | são o mesmo procedimento com bloco de estilo diferente (categoria errada: é **skill parametrizada**, não 6 julgamentos) | um agente por família permite 6 despachos paralelos sem colisão de prompt — mantém-se com `gerar <familia>` passando a família como argumento |
| F2 | `doc-cartografo` → passo do orquestrador `squad-docs` (roda `scripts/docs-inventario.mjs` e confere) | "o que existe, e quantos?" é script, não julgamento | nada — o CONTRACT §4 já diz que o dono é o script |

### 8.3 Virar skill/doc em vez de agente

| # | Hoje | Vira | Por quê |
|---|---|---|---|
| S1 | `soulmon-screen-cartographer` (mede o `03-FLUXO`, Playwright) | procedimento em `squad-design/METODO.md` | entregou o inventário; não há julgamento recorrente |
| S2 | `design-curador-padroes` | doc `docs/design/PRINCIPIOS-DE-WIREFRAME.md` (já existe) + regra "quem mexe em princípio cita procedência" | entregou; a fase acabou |
| S3 | `design-wireframer` | mantém **só enquanto** houver fluxo `a desenhar` no inventário; depois vira doc de método | Fase 1 fechada (13 canvases) |

### 8.4 Corrigir sem cortar (prompt/roteamento — **exige eval de regressão**, `references/evals-da-squad.md`)

| # | Mudança | Onde | Gate |
|---|---|---|---|
| R1 | Normalizar `name:` dos genéricos que sobreviverem (`staff-frontend`, `design-critic`) para `lowercase-hífen` e declarar `model:` | `.claude/agents/staff-frontend.md`, `design-critic.md` | 5 casos: despacho por `subagent_type` resolve nos dois |
| R2 | Coordenador: trocar `principal-architect → staff-backend` por `alpha-architect → alpha-backend`; `security-architect` → `alpha-security`; `qa-sweeper` → `alpha-qa`; adicionar linha "bytes/perf/a11y → `alpha-perf-a11y`" e "legal/termos/Data Safety → `alpha-compliance` + `guarda-medicao`" | `soulmon-coordenador/SKILL.md` › Tabela | eval com 5 pedidos reais do STATUS (D1, worker push, termos, WebP, aria-live) |
| R3 | Coordenador: `/squad-som` e `/squad-arte` não existem como command — ou criar os 2 commands (cópia de 8 linhas do `/squad-design`) ou escrever "skill `squad-som`" | idem | trivial |
| R4 | `/implementar-wp` passo 5: acrescentar `npx tsc -p tsconfig.server.json --noEmit` | `.claude/commands/implementar-wp.md` | trivial; é o portão que já voltou vermelho |
| R5 | Hook: regex do DONO casar com o formato atual (`> \*\*DEPENDE DO DONO`) **ou** o STATUS voltar ao formato `> ## ⏳ …` — um dos dois; e um teste em `src/` que reprove quando o topo do STATUS não casa com o regex do hook | `.claude/hooks/session-start.sh`, `docs/STATUS.md` | prova de vermelho gravada |
| R6 | `02-SQUAD.md` para de dizer "14"; se C3 entrar, vira doc histórico com etiqueta `registro` no MAPA | `docs/squad/02-SQUAD.md` | guard do manual |
| R7 | `android-build.yml`: tirar `version-b` | `.github/workflows/android-build.yml` | trivial |

### 8.5 CRIAR (disciplina sem dono) — **3, não 7**; o resto é briefing

Regra: só cria agente quando a pergunta exige **julgamento recorrente com contexto**. Das 7
lacunas do §3, 4 são briefing/roteamento (R2 resolve) e 3 merecem dono:

| # | Criar | Pergunta que possui | Por que não é briefing | Custo | ROI |
|---|---|---|---|---|---|
| N1 | **`soulmon-operador`** (1 agente) — infra/ops: `workers/` deploy, `wrangler`, secrets do painel, D1, `sync-irmaos`, `CACHE_VERSION`, incidente em produção ("login morreu", "cache preso", "worker parado") | "o que está no ar bate com o que está no git, e o que faço quando não bate?" | é a área com mais incidentes reais no STATUS §1 e zero dono; junta 4 lacunas do §3 (workers, CI, repos irmãos, crise). Carrega as skills globais `cloudflare` + `wrangler` + `workers-best-practices` que hoje ninguém lê | 1 `.md` + linha no coordenador + runbook em `docs/` | **alto** — é o run 3 (lançar) que vai precisar dele |
| N2 | **`soulmon-guarda-plataforma`** (1 agente, mesmo molde dos 7 guardas) — Android (Kotlin/RemoteViews/Gradle) + Desktop (Electron/updater) + i18n EN + a11y de código | "o que muda na web chega igual no APK, no overlay e em inglês?" | os footguns 2/3/9 do `CLAUDE.md` são desta família; `staff-frontend` não possui Kotlin; paridade é julgamento (o que é cópia legítima vs footgun 9) | 1 `.md` + ledger `docs/plano-melhorias/ledger/plataforma.md` | médio-alto |
| N3 | **Linha de roteamento + briefing** (não agente) para custo/orçamento: `alpha-perf-a11y` (bytes) e o próprio coordenador (R$/mês, créditos) com uma tabela em `docs/` de saldo/limites | "cabe nos R$ 200 e no crédito que resta?" | pergunta recorrente mas **factual** — é doc + gate, não julgamento | 0 agentes | médio |

Não criar: agente de "suporte ao usuário" (não há usuários — `CLAUDE.md` ⚠️), de ASO (run 3),
de comunidade (`02-SQUAD.md` já negou), de "IA aplicada" (é `guarda-vinculo`).

### 8.6 Roster mínimo resultante

| Família | Hoje | Proposto | Delta |
|---|---|---|---|
| Genéricos repo | 11 | 2 (`staff-frontend`, `design-critic`) | –9 |
| Maestro | 16 | 3 reusados (`ip-brand-guardian`, `behavioral-psychologist`, `soulmon-product-designer`) + `monster-taming-designer` | –12 |
| Guardas | 7 | 8 (+`guarda-plataforma`) | +1 |
| Docs | 10 | 9 (cartógrafo vira passo) | –1 |
| Design | 5 | 3 (`design-lead`, `visual-designer`, `wireframer` enquanto houver fila) | –2 |
| Som | 3 | 3 | 0 |
| Arte | 8 | 3 (`arte-gerador`, `arte-conferente`, `arte-instalador`) | –5 |
| Narrativa | 3 | 3 | 0 |
| Coordenador + ops | 1 | 2 (+`soulmon-operador`) | +1 |
| **Total** | **64** | **37** | **–27 (–42%)** |

Skills do repo: 8 → 7 (sai `prod-squad`); higgsfield 7 → 3.
Commands: 9 → 10 (sai `/revisao-soulmon`, entram `/squad-som`, `/squad-arte`).

### 8.7 O que quebra

**Se entrar:** `squad-som/CONTRACT.md` §2 cita `principal-architect`, `security-architect`,
`qa-sweeper`, `soulmon-devils-advocate`, `soulmon-tech-feasibility` — precisa de um passe do
`alpha-briefer` trocando por `alpha-*` (5 linhas). `00-MAPA.md` §7 perde linhas (guard fica
vermelho até o `doc-bibliotecario` rodar). `02-SQUAD.md` vira histórico.

**Se não entrar:** o custo não é falha ruidosa — é o que já acontece: coordenador roteando para
agentes que ninguém despacha, 15 arquivos sem função lidos a cada listagem, `worker de push não
deployado` sem dono, hook abrindo toda sessão com pendências de 09/09, e o próximo run
(soulmon-03, lançar) descobrindo na hora que ops não tem dono.

### 8.8 Ordem sugerida (menor mudança que torna o sistema mais seguro primeiro)

1. R4 + R5 + R7 (portões e hook — 3 edições de 1 linha, sem eval).
2. R2 + R3 (tabela do coordenador — 1 eval de 5 casos).
3. C1 + C2 + C6 (cortes sem perda; só apagar).
4. N1 (`soulmon-operador`) antes do run 3.
5. C3 + C4 + C5 + R6 (aposentar o maestro) — decisão do dono, porque é a "revisão de produto"
   que ele pediu em ago.
6. F1 + F2 + S1–S3 quando a fila de arte/design esvaziar.
7. N2 quando o desktop/Android voltarem à pauta (run 5).
