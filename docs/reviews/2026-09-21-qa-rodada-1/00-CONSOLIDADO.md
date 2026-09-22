<!-- doc-historico -->
# QA Rodada 1 do Soulmon — 21/09/2026 (noite) — consolidado

> **Etiqueta:** registro · **Dono:** coordenador da sessão (`soulmon-coordenador`); este
> consolidado foi escrito pelo `doc-mantenedor` a partir dos 12 relatórios da pasta ·
> **Pergunta da rodada:** *"O que a execução das respostas #11–#39 (`42b07bec`, `4a8b8049`)
> deixou errado, incompleto ou mentindo — e o que ainda impede o E0 (10 conhecidos, PWA,
> cortesia, 14 dias) de rodar?"*
> **Método:** 12 frentes em paralelo sobre `qa/rodada-a` @ `5228145e` (skeptic, design +
> narrativa, segurança, dossiê de estado, discovery/requisitos do E0, arquitetura, perf/a11y,
> plataforma, guardas + squads, growth/comportamento, governança/docs/marca, compliance), cada
> uma com relatório próprio nesta pasta. Regra: `caminho` + SÍMBOLO, número só com o comando
> ao lado, **nada editado pelos agentes de leitura** — o que está sendo corrigido é de 4
> agentes de execução em paralelo (§3) e está listado por relatório de origem.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este relatório. Onde este
> relatório divergir do código, o código está certo.
> **Regra da rodada:** achado do QA geral da manhã
> ([`../2026-09-21-qa-geral/00-CONSOLIDADO.md`](../2026-09-21-qa-geral/00-CONSOLIDADO.md))
> só volta aqui marcado **ainda aberto**.

---

## 1. Veredito em uma tela

1. **Três FATAIS, nenhum deles de produto.**
   (a) **GitHub Actions está morto desde 16/09/2026 por cobrança** — `gh run list` → último
   `success` em 15/09, 339 runs `failure` em 2–6 s com a anotação *"recent account payments
   have failed or your spending limit needs to be increased"* (`03` §0, `08` §0). Todo
   `[verificar no CI após o merge]` de hoje (target 36, `versionCode 15`, deps removidas,
   PNG do `dist/`) **não foi verificado por ninguém**; produção não caiu porque o Cloudflare
   builda por conta própria (`sw.js` no ar = git = `v157`). **Só o dono paga** (#48).
   (b) **`billing-ktx:6.2.1` é recusada pela Play** — v6 vencida em 31/08/2025, v7 em
   31/08/2026; só 8.x passa (`05` §1, fonte primária citada; `00-skeptic` #10). Três pontos
   quebram o compile no `BillingPlugin.kt`; `_billing.js` não muda. Em correção (§3).
   (c) **A política de privacidade mente sobre o que vai ao Groq** — `runDecompose` manda
   `task.name`, `GameTutorialFlow` pré-preenche `goalText` com `soulGoal`, `customKeywords`
   + `moodToday` + estágio/galho entram no prompt, e a §2b diz "nunca texto seu" (`09` #1–#4,
   `00-design-narrativa` P1). Declarar ou cortar é do dono (#42); provisório: **declarar**.
2. **A execução de hoje deixou o STATUS mentindo sobre o ledger** (`01` §2.1): o STATUS
   afirma "WP1.14 RECUSADO, WP3.4 IMPLEMENTADO" e `nascimento.md`/`vinculo.md` continuavam
   `VERIFICADO`. Corrigido nesta rodada nos dois arquivos (§3). `PLANO-PRODUTO.md` dizia
   "priorizar o funil web" duas linhas acima da nota que o desmente — riscado (§3).
3. **O E0 não está pronto para rodar** (`02` §0, `07` §7): está pronto para *gravar*, não para
   *ser lido* nem *operado*. A cortesia vira `paid` **em silêncio** e a única porta para o
   Oráculo é a linha `UnlockNudge variant='reveal'` na Evolução — sem convite explícito o E0
   mede o **demo**. Não existe procedimento (convite, grant, leitura, suporte — `grep -rn
   "\bE0\b" docs` só acha som e secrets), não existe `scripts/save-id.mjs`, `retained.d7` só
   é legível ≥7 dias após o **último** convite, a semana 2 só despacha na semana 3, e os 3
   secrets (`METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`) mais o
   `wrangler deploy` do worker continuam do dono (#50, #51).
4. **Dinheiro e conta têm dois bugs confirmados por teste novo** (`06` §3.1, `00-seguranca`
   A1, `03` §2): `auditRefunds` rebaixa para `demo` uma conta com cortesia válida
   (`_entitlements.tierDerivado.qa.test.js` reprova 3/3 — decisão do dono #40, provisório
   "sobrevive"); `deletePushSubscriptions` faz um `get` por chave do namespace inteiro e
   estoura o teto de subrequests com ~900 inscrições, **depois** de já ter apagado o save; e
   outro aparelho logado **ressuscita** o save apagado 3 s depois (sem tombstone). Índice
   `pushidx:<saveId>`, reordenação de `delete-confirm` e tombstone `del:done:` em correção.
5. **Alarmes de tarefa nunca tocam no APK com target 36** (`05` §2, `00-seguranca` M2):
   `setExactAndAllowWhileIdle` sem `canScheduleExactAlarms()` → `SecurityException` engolida
   pelo `.catch(() => {})`. E o **widget mostra "Rookie" como nome do pet** (`05` §4.4) —
   `petName = evolutionStage` no bridge, footgun 9 puro. Ambos em correção.
6. **A regra do jogo mais nova tem uma brecha sem decisão** (`06` §4): um Glitchtama abre a
   conquista `perfect-day` e 30 abrem `dias-completos-30` — "dia completo" sem dia completo
   nenhum. É contagem de outra coisa (masmorra), exatamente o que a #16 veta. Dono decide
   (#41); provisório: registrar como decisão da missão.
7. **Docs e agentes**: `ASSETS-A-GERAR.md` §5 pedia arte para ids que não existem
   (`streak-7`, `milestone-21`, `tasks-100`) e não pedia a rearte de `dias-completos-30`;
   `PLAY-FICHA.md` §6 pede 8 screenshots + feature graphic e **nenhuma família do
   `arte-gerador` faz isso**; `11-GLOSSARIO` (09/09) sem 17 termos de hoje e `09-HISTORICO`
   (10/09) sem PRs #40–#99; 4 agentes sem `model:`; `soulmon-operador.md` dizia que o CI
   builda (não builda); `/implementar-wp` não pedia `npm run build`; 3 ponteiros
   `higgsfield-*` são symlinks materializados como texto no Windows. Tudo isso corrigido
   nesta rodada (§3), exceto os symlinks (#53).
8. **Marca fora do app fala outra língua** (`08` §3): título EN `Soulmon: Habit Pet` falha o
   teste de troca de logo (= Finch); "ninguém tem outra igual" é **falso** (semente
   determinística, `newReading.ts`); `manifest.json` ainda tem a `description` do fork palavra
   por palavra; `PLAY-FICHA.md` fecha com "Ela está esperando. Ela vai se parecer com você."
   (L2 + L11). Em correção pela frente legal/copy.
9. **Portões verdes só na máquina local**: 10 arquivos de paridade / 151 testes (`05` §6),
   22 arquivos / 448 testes das linhas vermelhas (`06` §0), `copy.semFomo.contract.test.ts`
   novo e verde (a #15 sai da lista "só tese" — 21 proibições, **13 por teste / 8 por tese**).
10. **Fila do dono cresceu 14 perguntas (#40–#53)** — todas com provisório (§5); nada parado.

---

## 2. Achados por frente — o essencial

| Frente | Relatório | 3 linhas |
|---|---|---|
| Skeptic (diff `11e9b237..4a8b8049`) | [`00-skeptic-a.md`](00-skeptic-a.md) | 8 objeções: `auditRefunds` × cortesia (FIXÁVEL), `unregisterFromPushNotifications` apaga `FCM_TOKEN` local antes do DELETE, `filaDeAvisos` não trava `termos` como último, gate WebView manda iOS/Firefox à Play, `regexDeImport` conta import comentado, symlinks higgsfield, **Billing 8.x FATAL**, `chatSafety` › `LEXICO` falha sem acento. Ruído: Glitchtama (é decisão de produto → #41). |
| Design + narrativa (superfícies novas) | [`00-design-narrativa-a.md`](00-design-narrativa-a.md) | **P1 FATAL**: política "nunca texto seu" é falsa. 3 versões do app divergem (`FeedbackLink` 1.0.2 / package 0.1.0 / `versionName` 1.1.4); termos §8 "deixa a voz do personagem de lado" × `bridgeReply` mantém a voz; aviso de WebView sem link para a Play e `lang="en"` fixo; `TermsUpdateBanner` com `role=status` + controles, EN caindo no `#pt`; bíblia L10 diz que Sobre não existe (existe desde `42b07bec`). |
| Segurança (rodada A) | [`00-seguranca-a.md`](00-seguranca-a.md) | Sem CRÍTICO novo. **ALTO**: `deletePushSubscriptions` varre o namespace inteiro com `get` por chave (estoura subrequests). MÉDIO: `saveId` na inscrição de push é dado pessoal novo fora do export; `setExactAndAllowWhileIdle` sem gate. BAIXO: `handleGrant` 404 vs 400 revela rota; `PLAY-LANCAMENTO.md` E.1 põe segredo na linha de comando; `npm audit` 3 vulns todas via `@capacitor/cli` em `dependencies`. CSP dos 4 scripts inline confere 1:1. |
| Dossiê de estado (#11–#39) | [`01-dossie-estado.md`](01-dossie-estado.md) | 20 implementadas · 5 parciais (14, 17, 18, 22, 35) · 3 só registradas (11, 20, 34). **Contradição nova**: STATUS afirma o conserto do ledger que não aconteceu (WP1.14/WP3.4). `PLANO-PRODUTO` se contradiz na mesma página. Seção de ads prometida em `PLAY-DATA-SAFETY.md` (#14) não existe. Fósseis DigiApp: só o fallback `DIGIAPP_SAVES` em `_kv.js`, conhecido e nomeado. |
| Discovery + requisitos do E0 | [`02-discovery-e0.md`](02-discovery-e0.md) | E0 pronto para gravar, não para ser lido/operado/testar a hipótese certa. 10 requisitos OBRIGATÓRIOS (secrets, baseline, runbook da cortesia + `scripts/save-id.mjs`, cortesia encontrável, aviso da contradição do botão pago, leitura semanal com dono/hora, runbook de suporte, worker no ar ou declarado desligado, entrevista D7/D14, janela de convites ≤3 dias). Critério de morte corrigido: denominador = 10 pessoas, nunca `install`; `retained.d7` legível só ≥7 d após o último convite; `week_active` da semana 2 só em D21. |
| Arquitetura (2ª passada) | [`03-arquitetura-r1.md`](03-arquitetura-r1.md) | **CI morto desde 16/09**. Risco nº 1 não é o `put` cego: **o cliente web nunca relê a nuvem depois do login** (desktop→celular perde a tarde). Índice inverso `pushidx:<saveId>` + ordem segura de `delete-confirm` + tombstone `del:done:` (ressurreição do save por outro aparelho — achado novo). Repo cresce 0,5 MiB por commit de build (JS rehasheado, não PNG); política B recomendada. `App.tsx` 6.155 linhas: extrair `useModals` + `useAndroidBridge` agora (0 guards citam), `AppRouter` depois, handlers só com 13 guards reapontados. AGP 8.2.1 < 8.9.1 mínimo oficial para API 36. `SOULMON_SAVES` **já é** namespace físico próprio desde 07/09 (`CLAUDE.md` e `SEPARACAO-DIGIAPP.md` velhos). 3 ADRs rascunhadas (004–006). |
| Perf + a11y (runtime) | [`04-perf-a11y-r1.md`](04-perf-a11y-r1.md) | 292 KB gzip até o portão (306 KB renderizado); `pool-*.js` (832 KB cru / 71 KB gzip) só por `import()` dinâmico — não atrasa o caminho crítico. `.sm-px-*` morto: **zero** (6 seletores reais, todos usados); os 24 `!important` são estruturais (reduced-motion vencendo inline). `sw.js` cacheia sem teto dentro da mesma `CACHE_VERSION`; `orcamentoDeBytes` não cobre chunk lazy. TTI/FCP com throttle **continua não medido** (sem Chromium no ambiente). |
| Plataforma | [`05-plataforma-r1.md`](05-plataforma-r1.md) | **Billing 8.x FATAL** com patch textual (gradle + 3 pontos do `BillingPlugin.kt`, `_billing.js` inalterado, régua PL-8). Alarme exato sem gate (patch + receiver `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED`, PL-9). Widget mostra "Rookie" como nome. `"I missed you!"`/`"I miss you..."` no widget violam L11 e o guard vigia `saudade` (PT) mas não `miss you` (EN). Desktop `exp: 0` = sessão eterna (TTL 1 h para validade desconhecida). `FOOD_NAME_BY_EMOJI` só EN em `aria-label`. PL-1..PL-4 **VERIFICADO** pela primeira vez com saída colada (10 arquivos / 151 testes). "9 frases só EN" **não é achado** — é a decisão 13.18. |
| Guardas (8) + squads | [`06-guardas-squads-r1.md`](06-guardas-squads-r1.md) | **Bug confirmado**: `auditRefunds` × cortesia (teste novo reprova 3/3). Exclusão/exportação não alcança `sprite:img:*`/`sprite:blob:*` (sem TTL, fora de `NOT_INCLUDED`). `PLAY-FICHA.md` fecho viola L2/L11. Glitchtama abre conquista de dia completo. `generate-sprite.js` aceita `prompt` livre do cliente. `TRAIT_LINES` (`teimoso.haunted`, `madrugador.shower`) violam L1/L12 e o teste só lê `pick=0`. `arena.ts` cabeçalho "SEM CONSUMIDOR" é falso. Dois relógios de dia (aparelho × âncora) sem doc. `ASSETS-A-GERAR.md` §5 com ids inexistentes; screenshots/feature graphic sem família. `RIT-02` 6→8 avisos, `CONTA-01` 5→9 grupos. **#15 ganhou régua** (`copy.semFomo.contract.test.ts`). |
| Growth + insights + comportamento | [`07-growth-comportamento-r1.md`](07-growth-comportamento-r1.md) | `day_active` perdido quando a virada roda com a aba oculta (`track` descarta `document.hidden`). Push no D0 **não é suprimido** (o comentário de `pushCopy` diz que é). `week_active.active_days` chega ao servidor e não vira chave. `evolve`/`milestone`/`dungeon_run` sem emissor — ainda aberto. `?src=convite` proposto (allowlist `TELEMETRY_OPEN_SOURCE.invite = 4` + `history.replaceState`). D0–D2 do convidado: 6 modais + 2 diálogos + 7–11 pushes; orçamento proposto. Bump de `TERMS_VERSION` durante o E0 mostra o banner aos 10 no mesmo dia — congelar. `share_birthcard` como evento do único ativo viral. |
| Governança + doc-verificador + marca | [`08-governanca-docs-marca-r1.md`](08-governanca-docs-marca-r1.md) | **CI morto por cobrança** (339 runs vermelhos, ninguém registrou). 37 agentes: `name`/`description`/`tools` íntegros; 4 sem `model:`; `design-critic`/`staff-frontend` duplicados local×global com conteúdo diferente. Symlinks `higgsfield-*` materializados como texto (`core.symlinks=false`) — skeptic da manhã errou o diagnóstico (`.agents/` existe). Portões divergem (`/implementar-wp` sem `build`; `soulmon-operador.md` diz que o CI builda). R2 aplicado sem o eval de 5 casos. 40 afirmações amostradas: 31 ✅ · 9 ⚠️ · **0 ❌**. Marca: título = Finch; "ninguém tem outra igual" falso; `manifest.json` do fork; `og:image` é o favicon. |
| Compliance | [`09-compliance-r1.md`](09-compliance-r1.md) | **BLOQUEIA**: `runDecompose` manda `task.name` ao Groq; `GameTutorialFlow` pré-preenche `goalText` com `soulGoal` — política §2b/§3 e termos §9 negam. RISCO: `customKeywords`/`moodToday` no prompt; Supabase (repasse) + Groq Whisper não nomeados; aviso in-app não diz "sem revisão humana/não é emergência"; DS §2.7 "não cruzado com o save" × `saveId` na inscrição; `Attributions.md` diz que nomes de franquia saíram do prompt (`imagePrompt` os cita). LACUNA: Steam fora da política; save expira 365 d sem declarar; `ent:` "5 anos" sem âncora; IARC UGC sem o coop. Sem dono: guard "que campos saem para IA". |

### 2.1 Correções ao QA geral da manhã (o que a manhã disse e estava errado)

| Afirmação da manhã | O que a noite mediu | Relatório |
|---|---|---|
| A2: "9 frases só EN no widget" é achado | É a decisão **13.18** (15/09/2026) funcionando; o que falta é o `CLAUDE.md` › Idioma registrar a exceção | `05` §4.1 |
| Skeptic: 3 ponteiros `higgsfield-*` → `.agents/` inexistente | `.agents/skills/` **existe e está no git**; o defeito é `core.symlinks=false` no Windows materializando os symlinks como texto de 39–47 bytes | `08` §1.2 |
| `05` §4.1: `SOULMON_SAVES` e `DIGIAPP_SAVES` são o mesmo namespace físico | **Não são** desde `6e2d991b` (07/09): `wrangler.jsonc` aponta ids distintos (`20b3ba78…` ≠ `aed229e0…`). `CLAUDE.md` § Deploy e `SEPARACAO-DIGIAPP.md` passo 2 estão velhos | `03` N5 |
| `05`: mover handler do `App.tsx` "deixa o guard verde por vazio" | Não é o caso geral — os guards de AST têm cláusula `"sumiu do App.tsx — o guard ficou cego"` e ficam **vermelhos**; verde-por-vazio é só a minoria de asserções de ausência (`poopDrain.cleanPoop`, `adoptCloudSave.test`) | `03` §4 |
| Preâmbulo da tarefa: `.sm-px-*` morto e `!important` gordura | Zero `.sm-px-*` morto; os 24 `!important` são estruturais | `04` §3 |
| `07-design` (manhã): "25 `!important`" | 24 em código (27 no grep bruto, 3 em comentário) | `04` §3 |
| `05`/manual `07`: `GameState` com 89/110 campos | **111** por `awk` — a régua tem de ser um comando só, não o número | `03` N8 |
| "Conferir Billing ≥ 7" (A2) | A resposta é **≥ 8** — a v7 venceu em 31/08/2026 | `05` §1 |

### 2.2 O que continua sem dono (união dos 12 relatórios)

- **Quem paga e quem vigia o GitHub Actions** — só o dono paga; ninguém tinha "conferir se o
  CI rodou" como tarefa. Corrigido em parte nesta rodada: o runbook do `soulmon-operador`
  ganhou `gh run list --limit 5` como primeira linha (§3). O hook de sessão ainda não imprime.
- **O experimento E0 como procedimento** — quem convida, concede, lê e responde. Hoje é "o
  dono" nos quatro papéis e nenhum doc diz isso (#51).
- **Suporte ao usuário real** (R7 do `02`) — não há agente nem doc.
- **iOS como plataforma** — nenhum doc, nenhum guarda; `install` dobra por pessoa (#49).
- **Decisão "cortesia sobrevive a reembolso?"** (#40) e **"um hoje só"** (migrar
  `lastResetDate` para a âncora do jogador exige migração de save — ninguém designado).
- **Material de loja** (screenshots/feature graphic) — pedido sem executor até hoje; a
  família `loja` entrou no `arte-gerador` nesta rodada (§3), falta rodar.
- **Copy do widget Android contra as 12 leis** — narrativa não tem régua que leia `.kt`
  (o `copy.semFomo` lê, mas só FOMO).
- **Inventário dos 8 perdões (#17)** — sem lista escrita, "nono" segue incontável.
- **Vocabulário de marca fora do app** (`index.html` `<head>`, `manifest.json`, loja) — entre
  `alpha-growth` e ninguém.
- **Envelhecimento do glossário e do histórico** — `docs-delta.mjs` mede código → doc; os
  dois não têm código-fonte e nunca aparecem no delta. Falta a regra em `12-COMO-MANTER`.
- **Eval de roteamento do coordenador** (R2 da manhã) — nenhum eval do Soulmon existe.
- **Quem aplica migração D1 em produção** e **`friendsidx:`** (índice inverso das listas de
  amigos, nomeado pela primeira vez em `03` §2).
- **Entrega de push** (evento "push exibido" no `sw.js`) — sem ele `app_open.push` não tem
  denominador. **TTI/FCP em aparelho com throttle** — nunca medido em nenhuma rodada.
- **`skills-lock.json`** — hash não auditável por ninguém do roster (#53).

---

## 3. O que está sendo corrigido nesta rodada — 4 agentes em paralelo

Estado no fechamento deste consolidado: `git status` mostra os arquivos abaixo **modificados
e não commitados** na `qa/rodada-a`, mais testes `*.qa.test.*` novos. A lista é **por
relatório de origem**; o que fechou de fato se prova pelo commit e pelo `npx vitest run`
colado no `STATUS.md`, não por esta tabela.

### 3.1 Backend (`functions/api/**`, `scripts/**`) — `alpha-backend`

| O quê | Origem |
|---|---|
| `auditRefunds` recomputa `tier` a partir dos pedidos de pé (`ent.tier = paidProviderOf(ent) ? 'paid' : 'demo'`) — provisório #40 "cortesia sobrevive"; `_entitlements.tierDerivado.qa.test.js` passa a verde | `00-skeptic` #1, `06` §3.1 |
| Índice inverso `pushidx:<saveId>` em `subscribe.js`/`fcm-subscribe.js`; `deletePushSubscriptions` lê só o índice (≤ 34 subrequests); varredura sai | `00-seguranca` A1, `03` §2.2 |
| Ordem segura de `handleDeleteConfirm`: o que pode estourar vai antes de qualquer `delete`; do `ent:` em diante `try/catch` por passo e resposta 200 com `naoIncluido` | `03` §2.4 |
| Tombstone `del:done:<saveId>` (`_accountTombstone.js`, TTL **30 dias** — a review propunha 24 h; 24 h cobria só o token, não o aparelho desligado um fim de semana) lido por `save.js` › `POST`/`GET` → 410 `account-deleted` | `03` §2.5 |
| `handleGrant` devolve o mesmo 400 da rota implícita (não revela a rota sem chave); `typeof saveId !== 'string'` antes do regex | `00-seguranca` B1, `06` §3.2 |
| `sprite:img:*`/`sprite:blob:*` na exclusão **ou** declarados em `NOT_INCLUDED`; `saveId` da inscrição de push no export (ou declarado) | `06` §6.2, `00-seguranca` M1 |
| `scripts/save-id.mjs <email>` com paridade contra `emailToSaveId` (`saveId.parity.test.js`) | `02` R3 |
| `regexDeImport` (`depsVivas.contract.test.ts`) ignora import comentado; `convert-to-webp.mjs` ganha `.d.mts` + `tests/convertToWebp.test.ts` | `00-skeptic` #6, `00-seguranca` I4 |

### 3.2 Frontend (`src/**`, `index.html`, `public/**`) — `alpha-frontend` / `staff-frontend`

| O quê | Origem |
|---|---|
| `unregisterFromPushNotifications`: `removeLocal` só após `res.ok`; `notifications.unregisterFcm.test.ts` | `00-skeptic` #2 |
| Gate de WebView (`index.html`): ramo `/Android/.test(navigator.userAgent)` — iOS/Firefox não vão à Play; dois `<a>` para a Play via `createElement`; `documentElement.lang` pelo idioma; `mailto` de contato; hashes da CSP recalculados em `_headers` | `00-skeptic` #4, `00-design-narrativa` D1–D4 |
| `TermsUpdateBanner`: `role=region aria-labelledby`, título por `changed` (termos / política / ambos), links por idioma (`#en`), "(abre em nova aba)", "Entendi"/"Got it", copy sem "Nada muda no seu jogo"; `filaDeAvisos.contract.test.ts` trava `termos` como último | `00-design-narrativa` A1–A7, `00-skeptic` #3 |
| `FeedbackLink`: `__APP_VERSION__` via `vite define` + contrato (uma versão só); `mailto` sem `_blank`; "Origem" localizado; bloco de feedback vai para Ajuda | `00-design-narrativa` B1–B4 |
| Settings › Sobre: "…alguns sons e as falas…", "sem revisão humana / não é emergência"; `sm2Text` em vez de `sm2Hint` para a §16.3 | `00-design-narrativa` C1–C2, `09` #6 |
| `chatSafety.ts` › `LEXICO` normaliza NFD antes do teste ("nao quero mais viver") | `00-skeptic` #11 |
| Widget: `petName: soulmonDisplayName(gameState.soulmonMeta) \|\| 'Soulmon'` no bridge + régua | `05` §4.4 |
| `CompanionHUD` › `aria-label` com `getFoodName(emoji, language)`; `FOOD_NAME_BY_EMOJI` sai | `05` §6 PL-5 |
| `orcamentoDeBytes.contract.test.ts` ganha `TETO_JS_LAZY = 350 KB` + `DIVIDA_ATUAL['pool.js']`; `sw.js` › `cacheavel` testado (`tests/swCacheavel.test.ts`) | `04` §6, `00-seguranca` I2 |
| Telemetria: `trackDayClosed` enfileira mesmo com a aba oculta; `pushCopy` devolve `null` em `ageDays === 0`; `week_active.active_days` vira chave; `?src=convite` na allowlist | `07` N1–N4, §2 |

### 3.3 Legal / copy (`public/termos.html`, `public/privacidade.html`, `docs/PLAY-*.md`, `docs/Attributions.md`) — `alpha-compliance` + `soulmon-copy-redator`

| O quê | Origem |
|---|---|
| Política §2b/§6 PT+EN: o que de fato vai ao Groq (nome de tarefa em `runDecompose`, `soulGoal` pré-preenchido, `customKeywords`, humor, estágio/galho); Supabase (repasse) + Groq Whisper nomeados; §8 retenção do save 365 d e `ent:` "5 anos a partir da exclusão" — provisório #42 **declarar** | `09` #1–#5, #11–#12; `00-design-narrativa` P1–P3 |
| Termos §4 PT sem "quando existir" (`BITS_EXCHANGE` existe); §8 "mensagem fixa, escrita por gente"; lista de sons de IA = S16 (`evolve`/`degenerate`/`taskComplete`) | `00-design-narrativa` E1–E3 |
| `PLAY-DATA-SAFETY.md` §2.7 (push agora grava `saveId`) + seção de ads na fila de monetização (#14 prometida e não escrita) | `09` #7, `01` §2.3 |
| `PLAY-FICHA.md`: fecho novo (sai "Ela está esperando. Ela vai se parecer com você."), "ninguém tem outra igual" → "gerada a partir das suas respostas", "faltou" → "dias sem marcar", título EN com gancho próprio; §4 IARC nomeia o coop; §5 e `PLAY-LANCAMENTO` D.5/H.3 sem as notas do §2.3 já fechado | `06` #3/#18, `08` §3, `09` #13–#14 |
| `manifest.json` `name`/`description` na voz da bíblia; `index.html` `<head>` (`og:*`) pelo `narrative-critic` junto da ficha | `08` §3.4, #6 |
| `Attributions.md`: item "nomes de franquia saíram do prompt" reescrito (o `imagePrompt` os cita; o fallback não) | `09` #9 |
| `PLAY-LANCAMENTO.md` E.1 sem segredo na linha de comando (`read -s`) | `00-seguranca` B2 |

### 3.4 Plataforma (`android/**`, `desktop/**`) — `soulmon-guarda-plataforma` / `soulmon-operador`

| O quê | Origem |
|---|---|
| `billing-ktx` 6.2.1 → **8.x**; `BillingPlugin.kt`: `enablePendingPurchases(PendingPurchasesParams…enableOneTimeProducts())`, `enableAutoServiceReconnection()`, lambdas de `queryProductDetailsAsync` com `QueryProductDetailsResult`; régua textual PL-8. **O compile só o CI prova — e o CI está morto (#48)** | `05` §1, `00-skeptic` #10 |
| `SoulmonAlarmPlugin.kt`: `canExact()` gate + fallback `setAndAllowWhileIdle`; `canScheduleExact`/`openExactAlarmSettings` no plugin; receiver `SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED` no manifesto e no `BootReceiver`; lado JS em `SoulmonAlarmPlugin.ts`; PL-9 | `05` §2, `00-seguranca` M2 |
| `WidgetRenderer.kt`: `"I missed you!"`/`"I miss you..."`/`"I've been missing you"` saem; `✨` sai; `it` novo em `widgetSemCobranca.contract.test.ts` vetando `miss(ed)? you` (EN) | `05` §4.2, `06` §9 |
| Desktop `auth-preload.js`/`main.js`: validade desconhecida do token = `agora + 1 h`, nunca `exp: 0`; `authBridge.test.ts` fecha o buraco em vez de documentá-lo | `05` §5 |
| `@capacitor/cli` → `devDependencies` + `npm audit fix` | `00-seguranca` B4 |

### 3.5 Docs, agentes e governança — `doc-mantenedor` + `doc-bibliotecario` + `alpha-governanca` (esta frente; commit desta sessão)

| Arquivo | O quê | Origem |
|---|---|---|
| `docs/reviews/2026-09-21-qa-rodada-1/00-CONSOLIDADO.md` (este) + `docs/manual/00-MAPA.md` §6.5 | consolidado da rodada; os 13 arquivos da pasta (12 relatórios + este) e os 3 rascunhos de ADR indexados, etiqueta registro | — |
| `docs/PERGUNTAS-DO-DONO.md` | seção "QA RODADA 1 (21/09/2026, noite)" com #40–#53 e provisórios | §5 |
| `docs/plano-melhorias/ledger/nascimento.md` › WP1.14 → `RECUSADO`; `ledger/vinculo.md` › WP3.4 → `IMPLEMENTADO` | o STATUS afirmava e não tinha acontecido | `01` §2.1 |
| `docs/manual/01-VISAO.md` §7, `ledger/vetos.md`, `.claude/agents/soulmon-guarda-linha-vermelha.md` | 21 proibições = **13 por teste / 8 por tese** (a #15 ganhou `src/copy.semFomo.contract.test.ts`); o agente dizia "20 proibições, oito por tese" desde 20/08 | `06` §7 |
| `docs/adr/ADR-004-concorrencia-do-save.md`, `ADR-005-namespace-kv-unico.md`, `ADR-006-versionamento-do-esquema-do-save.md` | promovidos dos rascunhos com estado **Proposta (aguarda o dono)**, cabeçalho R6; indexados no MAPA; `ADR-002` ganha `tr -d '\r'` no comando de verificação (reprovava no Windows por CRLF) | `03` §1, `08` #17 |
| `docs/PLANO-PRODUTO.md` Parte 3 | "Priorizar o funil web" riscado com ⚰️ apontando para a nota de 21/09 | `01` §2.2 |
| `docs/NARRATIVA-E-UNIVERSO.md` L10 | nota "a §16 não existe em `SettingsPage`" fechada em `42b07bec` (grupo Sobre) | `00-design-narrativa` C3 |
| `docs/ASSETS-A-GERAR.md` §5 + §14 (novo) e `.claude/agents/arte-gerador.md` | ids reais de `ACHIEVEMENT_IDS` (9, `habit-7/21/66`, `dias-completos-30`); pedido **E1** de rearte de `dias-completos-30` (ainda desenha "100"); família nova **`loja`** — 8 screenshots ×2 idiomas + feature graphic 1024×500 (+ recorte `og:image` 1200×630) | `06` §11, `08` §3.4 |
| `docs/design/INVENTARIO-WIREFRAMES.md` › `RIT-02` (8 avisos) e `CONTA-01` (9 grupos); `docs/design/PRINCIPIOS-DE-WIREFRAME.md` (fila com 8, terminando em `termos`); `docs/manual/03-FLUXO-DE-TELAS.md` §3.2 (linha `carga`) | o código tinha 8 avisos e 9 grupos; os docs diziam 6/7 e 5 | `06` §12, `07` N5 |
| `.claude/agents/{arte-conferente,arte-instalador,soulmon-design-lead,soulmon-visual-designer}.md` | `model:` declarado nos 4 que faltavam | `08` §1.1 |
| `.claude/agents/som-produtor-assets.md` | a referência de produção passa a ser a CLI `higgsfield` (skill da conta), não o ponteiro `.agents/skills/...` que o Windows materializa como texto | `00-skeptic` #9, `08` §1.2 |
| `.claude/agents/soulmon-operador.md` | linha "CI" do runbook corrigida (o `ci.yml` **não** builda) e `gh run list --limit 5` como **primeira** medição — o CI pode estar parado por cobrança e ninguém vê | `08` §1.3, §0 |
| `.claude/commands/implementar-wp.md` | passo 5 ganha `npm run build` quando `src/` mudou (`dist/` é commitado) | `08` §1.3 |
| `docs/manual/11-GLOSSARIO.md` | cortesia, dias completos 30, banner de termos, orçamento de bytes, operador, guarda-plataforma, E0, `pushidx`, tombstone | `01` §3, `08` §2.2 |
| `docs/manual/09-HISTORICO.md` | linha para os PRs #89–#99 e esta rodada | `08` §2.2 |

Não foi tocado, de propósito: `CLAUDE.md` (só o dono — a exceção 13.18 e a frase do
namespace KV ficam na fila, #38 continua o precedente), `docs/STATUS.md` (o coordenador
escreve o bloco datado), `dist/`, qualquer regra de jogo, `ledger/plataforma.md` (do guarda).

---

## 4. Tabela única — achado · severidade · dono (o que NÃO está no §3)

Só o que nenhum dos 4 agentes de execução está fechando nesta rodada. Ordem: fatal → alto → médio.

| Achado | Sev. | Conserto | Dono | Rel. |
|---|---|---|---|---|
| GitHub Actions parado por cobrança desde 16/09; nada verificado desde então | **fatal (processo)** | Billing & plans do GitHub; depois `workflow_dispatch` de `ci.yml` e `android-build.yml` e ler os logs antes de qualquer merge | **dono** (#48) → `soulmon-operador` | `03` N1, `08` §0 |
| Cortesia invisível: o E0 mede o demo | **fatal p/ H3** | texto do convite (R4) agora; aviso na Fila 2 com posição declarada (R-D1) antes do convite | `alpha-product-manager` → squad | `02` #1 |
| 3 secrets + worker de push: nada definido | **fatal p/ leitura** | R1/R8 | **dono** (#50) | `02` #13 |
| Web nunca relê a nuvem depois do login; desktop→celular perde horas | alto | ADR-004 (aguarda #52) ou risco aceito com data | dono decide; `alpha-backend`+`alpha-frontend` | `03` N2 |
| AGP 8.2.1 < 8.9.1 mínimo oficial para API 36; build não provado | alto (bloqueia Play) | bump AGP 8.13 + Gradle 8.14.3 + Kotlin 2.x num PR só de `android/`, tirar o re-pin de Java 17 — **só com CI de volta** | `soulmon-guarda-plataforma` | `03` §5 |
| Sem procedimento do E0 (convite, grant, leitura, suporte) | alto | doc indexado no MAPA com R3 + R6 + R7 | squad + dono (#51) | `02` #2 |
| `PLAY-FICHA.md`/`index.html` sem revisão do `narrative-critic` como um todo | alto (marca) | rodar a ficha e o `<head>` juntos; um vocabulário | `soulmon-narrative-critic` | `08` #6 |
| `day_active`/semana 2 ilegíveis no D14; critério de morte lido no D15, efeito no D21 | alto | plano de leitura do E0 com datas | `alpha-growth` | `07` N4 |
| Glitchtama abre `perfect-day`/`dias-completos-30` | médio | contador que só `computeDailyReset` escreve **ou** exceção em `vetos.md` | dono (#41) → `soulmon-guarda-permanencia` | `06` #4 |
| `generate-sprite.js` aceita `prompt` livre; imagem sem TTL em KV | médio | servidor recompõe/valida por campos estruturados | `soulmon-guarda-nascimento` → `staff-backend` | `06` #5 |
| `TRAIT_LINES` violam L1/L12; teste só lê `pick=0` | médio | reescrever 3 frases; exportar a matriz e passar pela `PROIBIDAS_PT/EN` | `soulmon-guarda-vinculo` + `narrative-critic` | `06` #6 |
| `arena.ts` cabeçalho "SEM CONSUMIDOR" é falso; Arena ligada sem auditoria | médio | lápide + auditoria de `ArenaGame.tsx` | `soulmon-guarda-permanencia` | `06` #8 |
| Dois relógios de "dia" (aparelho × âncora) sem doc nem decisão | médio | `02-REGRAS-DE-NEGOCIO.md` + pergunta ao dono | `doc-redator-regras`; dono | `06` #9 |
| `spendCredits` RMW sem CAS em KV (dinheiro) | médio → alto no 1º pagante | ADR-005 D2 (aguarda #52) | dono; `alpha-backend` | `03` N7 |
| Repo cresce 0,5 MiB/commit de build | médio | política B: build + commit de `dist/` só no merge para `main` | `soulmon-operador` | `03` §3 |
| `App.tsx`: extrair `useModals` + `useAndroidBridge` (0 guards citam) | médio | um PR; `filaDeAvisos` intacto | `alpha-frontend` | `03` §4 |
| `sw.js` cacheia sem teto dentro da mesma versão | médio | poda LRU por contagem (300 → 250) | `alpha-frontend` | `04` §5 |
| Emissores `evolve`/`milestone`/`dungeon_run`; `share_birthcard`; `checkin_skip` | médio | §1.3/§6 do `07` | `alpha-insights` | `07` |
| `TERMS_VERSION` congelada do D0 ao D14 do E0 | médio | regra de sessão no STATUS durante o E0 | coordenador | `07` N9 |
| Eval de roteamento do coordenador (R2 da manhã pulada) | médio | `evals/coordenador.md` com 5 pedidos reais; rodar 1× | `soulmon-coordenador` | `08` #7 |
| PL-1..PL-4 no ledger `plataforma.md` ainda "aguarda o primeiro `/guarda-soulmon plataforma`" | médio | colar a saída de `05` §6 e mover estado | `soulmon-guarda-plataforma` (dono do ledger) | `08` #11 |
| Symlinks `higgsfield-*` + `.agents/` no repo (Windows) | médio | apagar do repo (skill vive na conta) ou diretório real | dono (#53) → `soulmon-operador` | `08` #9 |
| `docs-sync.yml` `claude-code-action@v1` — única tag móvel | baixo | prender por SHA | `soulmon-operador` | `08` #13 |
| `CLAUDE.md`: exceção 13.18 (widget só EN) e "KV ainda herdado" (não é) | baixo | 2 frases — só o dono | dono | `05` #8, `03` N5 |
| `google-services.json` do DigiApp; `build.gradle` só avisa | baixo (já em `PLAY-LANCAMENTO` §C.2) | ainda aberto | dono | `08` #18 |
| `vite.config.ts` "38 aliases" × 37 | baixo | 1 comentário | `staff-frontend` | `08` #19 |
| `minimizeForAi` deixa passar celular sem DDD, CEP, nascimento | baixo | declarar no cabeçalho | `soulmon-guarda-medicao` | `06` #14 |
| `SHOP_AND_CURRENCY_PRIMER` sem consumidor, copy contradiz a ficha | baixo | apagar ou consumir | `soulmon-guarda-nascimento` | `06` #16 |
| `manual/07`: contagem de campos do `GameState` por comando, não número | baixo | citar o `awk` | `doc-mantenedor` (próximo sync) | `03` N8 |
| Workers vs Pages sem ADR de registro | baixo | ADR-007 de 1 página | `alpha-architect` | `03` §1 |

---

## 5. Fila do dono (nova, #40–#53 — numeração continua de `docs/PERGUNTAS-DO-DONO.md`)

Provisório = o que fica valendo até ele responder. Registradas também em
[`docs/PERGUNTAS-DO-DONO.md`](../../PERGUNTAS-DO-DONO.md).

| # | Pergunta | Provisório | Se mudar | Rel. |
|---|---|---|---|---|
| 40 | **Cortesia × reembolso da Play**: uma conta com `provider:'courtesy'` válido que tem uma compra Play desfeita continua `paid`? (`auditRefunds` hoje rebaixa para `demo`; `tierDerivado.qa.test.js` reprova nas duas ordens) | **Sobrevive** — `tier` recomputado de `paidProviderOf` no fim do laço | Se não sobrevive: marcar o pedido `courtesy` como `voided` junto; o que não pode é o tier discordar do histórico | `06` §3.1 |
| 41 | **Glitchtama conta como dia completo para conquistas?** Um item da masmorra abre `perfect-day` e 30 abrem `dias-completos-30` (`totalPerfectDays++` em `specialItemUse.ts`) | **Registrar como decisão da missão** em `vetos.md` (o Glitchtama é recompensa por concluir 5 andares; a conquista lê o mesmo contador da escada) | Se não: campo `diasCompletosReais` que só `computeDailyReset` escreve, e a conquista lê dele | `06` §4 |
| 42 | **Dados ao Groq — declarar ou cortar?** `runDecompose` manda `task.name`; `GameTutorialFlow` pré-preenche `goalText` com `soulGoal`; `customKeywords`, `moodToday`, estágio e galho vão no prompt. A política §2b diz "nunca texto seu" | **Declarar** (política §2b/§6 PT+EN reescritas nesta rodada) + guard "que campos saem para IA" | Cortar = `runDecompose` manda só categoria; `useState('')` no tutorial; `customKeywords` fora do prompt | `09` #1–#4 |
| 43 | **Supabase como terceiro** na política §6 (é o repasse do áudio até o Groq Whisper) e na ficha da Play — nomear os dois? | Nomear (política + `PLAY-DATA-SAFETY` + `PLAY-FICHA`) | Se o transcribe for desligado de vez, sai a linha e o `supabase.contract.test.ts` muda | `09` #5 |
| 44 | **Encarregado LGPD** (art. 41): a política tem e-mail de contato, não nomeia encarregado. É você? | Sem nomeação (só e-mail) | Nomear = 1 linha na política; é obrigação do controlador, não da squad | `00-design-narrativa` ESC |
| 45 | **US$ nos termos EN — redação A ou B?** A = número fixo `US$ 6.99` com fonte declarada (`PLANO-PRODUTO` Parte 3; a Play converte) · B = "the store price at checkout", sem número | **A** (é o que está publicado; `publishedPrice.test.ts` trava) | B = tirar o número e o `data-price`; o teste muda | `09` #15 |
| 46 | **Steam na política §6**: entra agora (pagamento/ownership via `STEAM_*`) ou só quando a Camada 3 descongelar? | Só quando sair da C3 (hoje não há usuário Steam) | Entrar agora = 1 linha PT+EN | `09` #10 |
| 47 | **Retenção do save: 365 d** (`SAVE_TTL_SECONDS`) — declarar na política §8 ("um ano sem abrir e o save some")? E `ent:` "5 anos" ancorado em "a partir da exclusão"? | Declarar os dois | Se o TTL mudar, muda a frase e a constante juntas | `09` #11–#12 |
| 48 | **GitHub Actions por cobrança** — só você regulariza *Billing & plans*. Até lá, nenhum portão roda fora da máquina local, e o merge automático do `CLAUDE.md` › Deploy está sem a única prova não-local | Nada a fazer pela squad; o operador passa a medir `gh run list --limit 5` em toda sessão | Alternativa: CI só local por regra (registrar) — ou trocar de runner | `03` N1, `08` §0 |
| 49 | **iOS no E0**: algum dos 10 usa iPhone? PWA iOS = storage separado (dobra `install`), sem `beforeinstallprompt`, Web Push só instalado (16.4+), `selector(&)` exige Safari 17.2+ | Assumir que **há** iPhone: 1 passada de teste antes do convite (R-D6) e denominador = pessoas | Se nenhum: registrar "E0 só Android/desktop" e pular R-D6 | `02` #12, `07` N7 |
| 50 | **Push no D0 do E0**: (a) o worker (`workers/`) está deployado? Sem `wrangler deploy` o E0 roda **sem nenhum push** e a H1 fica confundida; (b) suprimir o push no dia do nascimento (`pushCopy` → `null` em `ageDays === 0`, como o comentário já promete)? | (a) não medido — exige login; se não subir, **declarar "E0 sem push"** no diário; (b) suprimir (é comunicação → `alpha-compliance` confere) | (a) você roda `cd workers && npx wrangler deploy`; (b) manter = corrigir o comentário | `02` R8, `07` N2 |
| 51 | **E0 — quem faz o quê**: convite (texto + lista dos 10 + datas), grant (`scripts/save-id.mjs` + `curl` com `ENTITLEMENTS_ADMIN_KEY`), leitura (segunda 09:00 BRT, `metrics-report.mjs --days 21 --full`), suporte (`FEEDBACK_EMAIL` + grupo, SLA ≤ 24 h), entrevista D7/D14 | Dono = convite + secrets + grant; `soulmon-operador` = worker/secret list; `alpha-insights` = leitura e veredito; `alpha-gestor-pesquisa` = entrevista; suporte = dono até existir dono | Qualquer papel que você não queira vira pergunta de roster | `02` §8 |
| 52 | **ADRs 004–006** (concorrência do save · KV único × D1 para dinheiro · versionamento do esquema do save) — aprovar os rascunhos promovidos a `docs/adr/` com estado **Proposta (aguarda o dono)**? A 004 é exceção declarada a "UI antes de infra" | Ficam como Proposta; nada executado | Aprovar = 004 D1–D3 (~2 d), 005 D2 (~1 d, antes do 1º pagante), 006 junto da 004 (mesma mudança de formato) | `03` §1 |
| 53 | **`skills-lock.json` + symlinks `higgsfield-*` no Windows**: os 3 ponteiros em `.claude/skills/` são symlinks git (`120000`) que `core.symlinks=false` materializa como texto — a skill do repo não carrega e a cópia em `.agents/` divergiu da global. Apagar do repo (a skill vive na conta) ou virar diretório real? | Como está (a sessão carrega a skill global) | Apagar = `git rm .claude/skills/higgsfield-* .agents/ skills-lock.json`; diretório real = duplicar a skill e assumir o drift | `08` §1.2 |

---

## 6. Portões rodados nesta rodada (base `5228145e`, máquina local — o CI está fora)

```
npx vitest run desktop/renderer/src/care.parity.test.ts desktop/renderer/src/care.feed.parity.test.ts \
  desktop/renderer/src/care.banhoSono.parity.test.ts functions/api/saveId.parity.test.js \
  desktop/renderer/src/cloudSync.test.ts src/plugins/widgetSemCobranca.contract.test.ts \
  workers/pushCopy.parity.test.js workers/vapid.parity.test.js src/styles/iconScale.contract.test.ts \
  desktop/renderer/src/authBridge.test.ts
 Test Files  10 passed (10)      Tests  151 passed (151)                       (05 §6)

npx vitest run <22 arquivos citados em 01-VISAO §7>   → 22 files · 448 passed   (06 §0)
npx vitest run src/copy.semFomo.contract.test.ts       → 1 file · 5 passed (NOVO, #15)
npx vitest run functions/api/_entitlements.tierDerivado.qa.test.js → 3 failed / 1 passed (NOVO — bug §1.4, vermelho até o conserto)
npx vitest run src/components/settingsSom.render.test.tsx → 5 passed
sha256sum public/sounds/*.webm × sonsAssets.ts × Attributions.md → 5/5 batem
curl -s https://soulmon.mateus-sprnd.workers.dev/sw.js | grep -m1 CACHE_VERSION → v157 = git
```

O que **não** rodou e por quê: `gradlew assembleDebug` (sem SDK 36 local, sem CI); Playwright
com throttle (sem Chromium no ambiente); `wrangler deployments list`/`secret list` (exige login
do dono).
