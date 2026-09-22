<!-- doc-historico -->
# QA Rodada 2 do Soulmon — 22/09/2026 — consolidado

> **Etiqueta:** registro · **Dono:** coordenador da sessão (`soulmon-coordenador`); este
> consolidado foi escrito pelo `doc-mantenedor` a partir dos 9 relatórios da pasta (+ `sim/`) ·
> **Pergunta da rodada:** *"O que as correções da Rodada 1 (`a6c1cd8a`) deixaram errado ou
> quebraram, o que o AR diz que o git não diz, e o que uma simulação de 90 dias mostra das
> regras do jogo que nenhuma leitura de código mostrou?"*
> **Método:** 9 frentes em paralelo sobre `qa/rodada-2-2026-09-22` @ `a6c1cd8a` (skeptic,
> segurança, narrativa, design/DS/a11y/i18n/estados, negócio + benchmark + pesquisa E0, dados,
> operador + retrospectiva + governança + doc-verificador, som + arte + design + marca,
> simulação do jogo com as funções puras reais). Regra: (a) **verificar adversarialmente**
> cada correção da R1 na disciplina; (b) achado das duas rodadas anteriores só volta marcado
> **ainda aberto**; (c) ir para o que nenhuma alcançou. `caminho` + SÍMBOLO, número só com o
> comando ao lado, nada editado pelos agentes de leitura (exceção: dois testes novos
> autorizados — `src/assets/artMaps.contract.test.ts`, `src/narrativa.superficies.contract.test.ts`).
> **Primeira rodada que MEDIU O AR** (`curl`, `wrangler deployments list`, `secret list`,
> `d1 migrations list` — todos read-only, máquina já logada). Três rodadas anteriores
> perguntaram "está deployado?"; nenhuma perguntou "tem os secrets?".
> **Precedência:** código > teste > `CLAUDE.md` > manual > este relatório. Onde este
> relatório divergir do código, o código está certo.
> **Regra da rodada:** achado do QA geral ([`../2026-09-21-qa-geral/00-CONSOLIDADO.md`](../2026-09-21-qa-geral/00-CONSOLIDADO.md))
> ou da Rodada 1 ([`../2026-09-21-qa-rodada-1/00-CONSOLIDADO.md`](../2026-09-21-qa-rodada-1/00-CONSOLIDADO.md))
> só volta aqui marcado **ainda aberto**.

---

## 1. Veredito em uma tela

1. **Três FATAIS — dois de infra, um de conta. Nenhum de regra de jogo (esses são ALTOS, §1.6).**
   (a) **A lápide de conta bloqueia o MESMO e-mail por 30 dias** (`00-skeptic` #1, `01-seguranca`
   1.2, `02b` F1): quem apaga a conta e faz login de novo cai em onboarding inteiro → POST 410 →
   `reagirContaExcluida` faz wipe + logout → loop, sem aviso de prazo nem alternativa. `cloudLoad`
   e `reconcileSaveId` ignoram `excluida`; o desktop nem conhece 410 (`04` §3.2: overlay mostra
   "erro de rede" por 30 dias). A correção da R1 fechou o "outro aparelho ressuscita o save" e
   abriu "o titular não consegue voltar". **Em correção (§3.1/§3.2):** `auth_time` do token >
   `tombstone.at` → `clearTombstone` e segue (provisório #56); backup local antes do wipe.
   (b) **As migrações D1 NÃO estão aplicadas em produção — e a 1ª compra Play daria 500**
   (`05` §1.1: `npx wrangler d1 migrations list soulmon-billing --remote` → 0001 e 0002
   "to be applied"). `claimOrder` desvia para `claimOrderAtomic` porque `env.DB` existe; o
   primeiro `DELETE FROM order_claims` está fora do `try` e `billing.js` › `onRequestPost` não
   tem `catch`. **O STATUS §3.2 dizia "sem a tabela cai no caminho antigo" — era FALSO**
   (conserto de doc da rodada da manhã que criou uma mentira nova). Aplicar é do dono ou do
   operador logado (#65); o `try/catch` com fallback + log está em correção (§3.1).
   (c) **O free tier do Cloudflare estoura por ESCRITA de KV em ~18 DAU** (`03` §0.2: ~55
   writes/usuário/dia — save debounce 3 s + 2 `put` por chamada de IA + telemetria — contra
   1.000/dia). `_aiGuard.js` é fail-closed: `put` falho = **503 no chat**; cloud save perdido em
   silêncio. O E0 (10 + dono + 2º aparelho) já é ~72 % do teto. Workers Paid (R$ 108/mês com
   Starter; R$ 27 sem) antes do convite é decisão de caixa do dono (#64).
2. **O ar tem o código da R1, mas não os segredos** (`05` §1.1, tabela git × ar de 12 linhas):
   `sw.js` `v158` = git = dist; `index.html` e o JS de entrada byte-iguais (sem CR); política
   "22 de setembro" no ar; CSP 4/4 hashes. **`METRICS_ADMIN_KEY` ESTÁ definida** (`/api/metrics`
   → 401; STATUS e R1 diziam "nada definido"). **Worker de push ESTÁ deployado** (21/09
   12:57Z > último commit de `workers/`; #50(a) respondida). Mas: **`ENTITLEMENTS_ADMIN_KEY`
   ausente** → `grant` 404 → o E0 não pode receber cortesia (#67); **`FIREBASE_SERVICE_ACCOUNT`
   ausente no worker** → FCM do APK nunca envia, só Web Push funciona (#66); `GEMINI_API_KEY`
   ausente → sem Higgsfield o sprite morre. **GitHub Actions continua morto** (260 runs
   `failure` desde 16/09 por comando; o "339" da R1 não reproduz) — #48 repete.
3. **A R1 disse "em correção" para 3 coisas que não aterrissaram** (`05` §2.1, §4 ❌):
   `scripts/save-id.mjs` não existe (e #51 o cita como existente), `@capacitor/cli` segue em
   `dependencies` (`npm audit` → **16 vulns, 1 critical `tar`**), `TETO_JS_LAZY` ausente do
   `orcamentoDeBytes`. 46 afirmações do bloco STATUS/consolidado R1 verificadas: **35 ✅ · 6 ⚠️ ·
   5 ❌**. Classe recorrente: "doc afirma conserto que não aconteceu". Prática que fecha:
   coluna **aterrissou? (sha)** no §3, preenchida só depois do commit por `git show --stat`.
4. **A exclusão de conta ainda deixa rastro em 3 lugares** (`04` §7 #1–#3, `01` 1.3 — ALTOS):
   a lápide protege só `save.js` — `community.js` recria `profile:`/`pid:` via `pushProfile`
   no mesmo efeito que recebe o 410 (o diretório público volta 3 s depois); **o cooperativo
   está fora da exclusão** (`coop:<gid>.members`, `coopOf:`, `coopCk:` por 120 d — e o membro
   fantasma infla `target` do grupo para sempre); **a exportação devolve o saveId de até 5
   terceiros** (`profile.friends`, `state.friends` crus — única rota que quebra "saveId nunca
   sai"). E o `pushidx:<saveId>` **é envenenável**: 17 POSTs anônimos com o `saveId` da vítima
   expulsam a inscrição real (`PUSHIDX_MAX = 16`). Tudo em correção (§3.1).
5. **A narrativa tem 6 BLOQUEANTES em superfícies que nenhuma régua lia** (`02` tabela final
   A1–A6): a tela de excluir conta diz *"seu bichinho vai sentir sua falta, e a porta fica
   aberta"* (falso por 30 d + L11); a ficha da Play *"se você se afasta, ela recua"* (falso:
   `ABSENCE_FORGIVENESS_DAYS` = 2 — afastar-se é a única coisa que NÃO custa; R1 aprovou sem
   abrir o código); o booklet promete o ovo a todos (`rebirthRefusal('not-paid')`) e copia a
   lei L6 como texto de jogador contradizendo `absenceBucket`; o push das 20h *"está te
   esperando"* (a palavra que §14.3 tirou de `welcomeBack.ts`, agora condicionada a meta NÃO
   cumprida); o widget *"You're my favorite partner!"* (L1 + único termo ⚠️ da §12 no ar).
   Mais 11 CORRIGIR no booklet (C1–C11) e ~15 falas imperativas inline no `CompanionHUD`
   fora de `PET_VOICE_LINES` (`07` §2.9: o perfil que menos faz ouve *"Me alimenta por
   favor!"* 89 dias em 90). Guard novo `narrativa.superficies.contract.test.ts` (verde) —
   falta estender a `_pushCopy.js`/`account.js` + trava `partner`.
6. **A simulação de 90 dias com as funções reais achou 3 regras que punem quem o produto
   diz querer** (`07` §2.1–§2.3, 🔴 — decisões do dono, #58–#59): (i) **a virada julga só
   ONTEM** — quem faz tudo na segunda e reabre na quarta nunca ganha o dia completo (perfis
   Bx/Bsx: **0 dias completos em 90**, rookie para sempre, fazendo 100 % dos hábitos 3×/sem);
   (ii) **cair e re-evoluir no MESMO dia com HP cheio** — `degeneratedPerfectDays` devolve
   `max(floor(req/2), prev − 5)` ≥ `required` do estágio novo → o botão Evoluir acende na mesma
   abertura (queda = cura grátis; `redeemed: true` por um clique); (iii) **"3× por semana"
   cobra 3 corações por semana** feito seg/qua/sex (25 ♥, 6 quedas em 90 d), enquanto o mesmo
   hábito em `weekdays [1,3,5]` custa 0. E os 🟠: 7 dos 11 eventos do Vínculo nunca são
   emitidos e **76 % do XP vem de comer** (não está na tabela); virada + dreno de cocô = 2 ♥/dia
   e o dreno ignora carência de save novo, rampa e piso da raiz; o Glitchtama infla
   `totalPerfectDays` (**51 % dos dias completos do perfil B**; perfil G: 90 "dias completos"
   com 0 dias completos — #60 é a resposta medida ao #41); **Bits só vêm de minijogo** (quem só
   cuida = 0 Bits em 90 d, loja invisível; quem joga compra 4× a loja — #61). Divergências
   doc × simulado: 10 linhas (`07` §3).
7. **Economia fecha; o que decide é fixo × volume** (`03` §0): custo variável R$ 0,04–0,10/
   usuário ativo/mês, margem > 90 %, ponto de equilíbrio ~157–530 usuários ativos/mês. Mas:
   **Higgsfield Starter (R$ 81 fixo) só compensa acima de 35 pagantes novos/mês** — para o E0
   o Gemini avulso custa 4× menos (#63); **demo tinha a MESMA cota de chat que pagante**
   (`AI_LIMITS.chat.perAccount` não olhava tier; 1.000 demos no teto = R$ 950/mês, receita
   zero, alcançável por `curl`) — provisório demo 30 / paid 120 **já aplicado** (#55);
   Rebirth promete 11 formas contra `perAccountLifetime: 26` sem reset (#62).
8. **A pesquisa do E0 não tinha pré-registro nem consentimento** (`03` §Pesquisa, #8 alto):
   nascem nesta rodada [`docs/E0-PREREGISTRO.md`](../../E0-PREREGISTRO.md) (H1–H3 com critério
   de falseamento, morte precoce, roteiros D7/D14 literais, o que n=10 NÃO conclui) e
   [`docs/E0-CONSENTIMENTO.md`](../../E0-CONSENTIMENTO.md) (separado dos Termos: liga
   e-mail↔saveId a pessoa nomeada, grava fala, LGPD art. 7º I, 18+). O dono assina antes do
   1º convite (#71).
9. **Som, arte, design, marca** (`06`): a trilha **não para no sono automático** (E0 declarado
   em `SOM.md` §2.1, fiado só no gesto manual — em correção em `trilha.ts`, §3.2); zero
   consumidor sem asset e zero asset de mapa sem consumidor (teste novo `artMaps.contract` 14/14,
   fecha o buraco das 924 auras de 20/09); mas o `INVENTARIO-ASSETS.md` contava **1.352**
   arquivos (disco: **1.723**, 121 MB) e listava pastas apagadas — corrigido (§3.5) com os
   **102 órfãos** (9,6 MB) como pedido de limpeza; E1 `dias-completos-30` ainda desenha 3
   lajes ✓ (ainda aberto); **`brand/design-system.md` é da Consultech360** ("Plataforma de
   Conexão 360°", azul corporativo) e 2 agentes locais o carregavam como canônico — lápide +
   ponteiro para `04-IDENTIDADE-VISUAL.md` (§3.5); 3 taglines em 3 lugares, nenhuma pelo
   `narrative-critic` (#70); `og:image` = favicon — briefs L2/L3 escritos em
   `ASSETS-A-GERAR.md` §14; **convidado com cortesia nunca é avisado** (R-D1 da R1 não
   executado — ainda aberto, alto p/ E0).
10. **Governança** (`05` §3): 7 de 14 provisórios da R1 mexeram em **texto legal publicado ou
    regra de dinheiro** em < 6 h sem linha no `REGISTRO-DE-DECISOES.md` (incluindo o bump de
    `TERMS_VERSION` que `07` N9 mandava congelar no E0, e Steam na política §6 **contra** o
    próprio provisório #46); #41 **não foi aplicado** (`vetos.md` sem Glitchtama); o booklet
    (`959e3bee`, 1.084 linhas de narrativa) entrou sob a **Camada 3 congelada** (#13) sem
    registro de exceção — registrado agora (§3.5); a fila do dono reperguntou 3 vezes o já
    respondido (#5→#50a, #25→#45, #18→#51). **Fila do dono cresceu 18 perguntas (#54–#71)** —
    todas com provisório (§5); nada parado.

---

## 2. Achados por frente — o essencial

| Frente | Relatório | 3 linhas |
|---|---|---|
| Skeptic (correções de `a6c1cd8a`) | [`00-skeptic-r2.md`](00-skeptic-r2.md) | 12 objeções: lápide × mesmo e-mail (**FATAL**), `PUSHIDX_MAX` expulsa inscrições reais (alto — inclusive benigno: 16 reinstalações de PWA), `orderDetails.slice(-200)` pode podar pedido pago, gate WebView rotula Samsung/Firefox como WebView, `chatSafety` EN "don't want to wake up early" → crise, `ageDaysOf` em UTC manda push 22h BRT no D0, `connect()` em CONNECTING → DEVELOPER_ERROR, `canScheduleExact` sem UI (guard tautológico), comentário "TRÊS" com 4 hashes |
| Segurança (threat-model de `a6c1cd8a`) | [`01-seguranca-r2.md`](01-seguranca-r2.md) | Sem CRÍTICO. **ALTO**: lápide só em `save.js` (`pushProfile` regrava `profile:`/`pid:`), `pushidx` envenenável (17 POSTs anônimos). MÉDIO: exclusão sem reautenticação recente, `reconcileSaveId` ignora `excluida`, `del:done:` retém hash 30 d não declarado, ack de compra no cliente antes do grant. `npm audit --omit=dev`: 1C+2A via `@capacitor/cli`. Limpos: fila hidden, `?src=`, alarme |
| Narrativa (booklet + strings de `a6c1cd8a` + widget + push) | [`02-narrativa-r2.md`](02-narrativa-r2.md) | Booklet: 2 BLOQUEANTES (ovo para todos; L6 como copy) + 11 CORRIGIR (quem dispara a forma; "dia inteiro sem nada"; 2 vs 3 jeitos; "raramente"; humor no chat; ultra por permanência; "ele está lá"; "on desert"; "him"; "falta alguém"; "parte que não coube"). Fora do booklet: `COPY.deleteReady` (**BLOQUEANTE**), ficha "se você se afasta, ela recua" (**BLOQUEANTE**, R1 aprovou sem abrir o código), push 20h "está te esperando" (**BLOQUEANTE**), widget "favorite partner" (**BLOQUEANTE**). Guard novo `narrativa.superficies.contract.test.ts` |
| Design/DS/a11y/i18n/estados | [`02b-design-i18n-estados-r2.md`](02b-design-i18n-estados-r2.md) | **F1 FATAL**: re-login com e-mail excluído = onboarding + wipe em loop. **T1 alto**: marcar feita sem desfazer nem confirmação (check 44 colado ao chevron 44 — regra do dono #57). Banner de Termos preso atrás de "+N"; sem link para Termos no app; onboarding/tutorial/upgrade sem `OfflineSeal`; sprite próprio sem `onError`; aviso de conta excluída em `role=status` estático e cai em EN; desktop "vi você digitando" (L11). i18n: 0 strings só-PT nos 20 arquivos; tokens `--sm2-*` todos pareados |
| Negócio + benchmark + pesquisa E0 | [`03-negocio-pesquisa-r2.md`](03-negocio-pesquisa-r2.md) | Economia por unidade fecha (margem > 90 %); **free tier estoura por KV writes em ~18 DAU** (alto); Starter só compensa > 35 pagantes/mês; R$ 29,90 / US$ 6.99 coerente com Finch/Habitica/Pokémon Sleep; demo = mesma cota de chat que pago (médio, provisório aplicado); Rebirth × `perAccountLifetime 26`; **sem pré-registro nem consentimento** (alto) — os 2 docs nascem nesta rodada |
| Dados (inventário KV, `GameState`, desktop↔web, métricas, D1, ADRs) | [`04-dados-r2.md`](04-dados-r2.md) | **25 famílias de chave** (07 §8 documentava 11, com TTL "—" onde o código tem 365/400/120/60 d). **ALTA**: lápide só em `save.js`; coop fora da exclusão (fantasma infla a meta); exportação devolve saveId de terceiros. `lastDayWasPerfect` escrito e nunca lido; `droppedItems` lido e nunca escrito; 4 campos passam pelo spread cru; 14 famílias de métrica gravadas sem leitor (`active_days` corrigido pela metade); desktop não conhece 410; ADR-004 custa ≈ 3 d (não 2: `_bond.js` e `account.js › collect` leem o save cru) |
| Operador (git × ar) + retro + governança + doc-verificador | [`05-operador-governanca-r2.md`](05-operador-governanca-r2.md) | **Primeira medição do ar**: `METRICS_ADMIN_KEY` definida; worker de push deployado 21/09 12:57Z; **`ENTITLEMENTS_ADMIN_KEY` e `FIREBASE_SERVICE_ACCOUNT` ausentes**; **D1 migrações não aplicadas → 1ª compra = 500** (STATUS mentia sobre o fallback); Actions morto (260 runs desde 16/09); `npm audit` 16 vulns. 46 afirmações da R1: 35 ✅ · 6 ⚠️ · 5 ❌. Provisórios sem rastro no REGISTRO; #41 não aplicado; booklet × Camada 3 congelada |
| Som + arte + design + marca | [`06-som-arte-design-marca-r2.md`](06-som-arte-design-marca-r2.md) | Os 8 `playX` têm chamador e gesto; **trilha não para no sono automático** (médio); `aoGestoSonoro` antes de `abaOculta`. Arte: 1.723 arquivos/121 MB (doc dizia 1.352), **102 órfãos** (9,6 MB, 54 ícones pixel fora do visor, `home-scene-1547.png` 4,2 MB, `icon-512.png` duplicado byte a byte do favicon, 2 vetorizações da chama); teste novo `artMaps.contract` 14/14; E1 ainda aberto. Design: aviso "conta excluída" e gate WebView sem canvas; **cortesia invisível ainda aberta**. Marca: sem plataforma de marca; 3 taglines; **`brand/design-system.md` é da Consultech360** e 2 agentes o carregam; `og:image` = favicon — briefs L2/L3 |
| Simulação do jogo (90 dias, 15 perfis) | [`07-simulacao-jogo-r2.md`](07-simulacao-jogo-r2.md) + [`sim/`](sim/) | 🔴 virada julga só ontem (0/90 dias completos para quem faz e não abre no dia seguinte); 🔴 cair e re-evoluir no mesmo dia com HP cheio; 🔴 `timesPerWeek 3` custa 3 ♥/semana. 🟠 7/11 eventos do Vínculo mudos, comida = 76 % do XP; virada + dreno = 2 ♥/dia; Glitchtama = 51 % dos dias completos do perfil B; Bits só de minijogo. 🟡 quiz decide o elemento em ~39 %, planta/industrial ~2 %, nascimento usa `Math.random`; 15 falas inline no HUD. Confirma os 8 perdões, o piso da raiz, `ULTRA_PATIENCE_DAYS` |

### 2.1 Correções à Rodada 1 (o que a R1 disse e estava errado ou envelheceu)

| Afirmação da R1 / do STATUS | O que a R2 mediu | Relatório |
|---|---|---|
| STATUS §3.2: "sem a tabela, a query falha e o resgate cai no caminho antigo" | **Falso.** `claimOrderAtomic` › primeiro `DELETE` fora do `try`; `billing.js` › `onRequestPost` sem `catch` → **500** na 1ª compra | `05` §1.1, §4 #41 |
| "3 secrets (`METRICS_ADMIN_KEY`, `ENTITLEMENTS_ADMIN_KEY`, `COURTESY_MAX_ACCOUNTS`): nada definido" | `METRICS_ADMIN_KEY` **definida** (`/api/metrics` → 401; `wrangler secret list` a lista). Faltam `ENTITLEMENTS_ADMIN_KEY` e — nunca perguntado — `FIREBASE_SERVICE_ACCOUNT` no worker | `05` §1.1 |
| #50(a) "worker de push: não medido — exige login" | **Deployado** 21/09 12:57:29Z (`npx wrangler deployments list --name digiapp-push-scheduler`) > último commit em `workers/` (`3e758a81`, 20/09). A máquina já estava logada (`whoami`) | `05` §1.1 |
| "339 runs `failure`" | Não reproduz: **260** desde 16/09, 349 desde 15/09, 570 no total da janela (`gh run list --limit 1000 --json conclusion,createdAt`) — número sem comando | `05` §1.1, §4 #2 |
| R1 §3.1 "`scripts/save-id.mjs`" em correção; #51 o cita | `ls scripts/save-id.mjs` → **não existe** | `05` §4 #36 |
| R1 §3.4 "`@capacitor/cli` → `devDependencies` + `npm audit fix`" | `package.json` › `dependencies` ainda tem; lock intocado; `npm audit` → 16 vulns (1 critical `tar`) | `05` §4 #37; `01` #11 |
| R1 §3.2 "`TETO_JS_LAZY = 350 KB`" | `grep -n LAZY src/deploy/orcamentoDeBytes.contract.test.ts` → 0 | `05` §4 #38 |
| "~150 testes novos" | `git show --stat a6c1cd8a` → 40 arquivos de teste; suíte 4266 → **4631** (+365 testes, +27 arquivos) | `05` §4 #33 |
| R1 aprovou a ficha "se você se afasta, ela recua para uma forma que se sustenta com menos" | `ABSENCE_FORGIVENESS_DAYS` = 2: afastar-se é a única coisa que **não** custa; L4 proíbe atribuir causa | `02` A2 |
| `07` §8 (manual): 11 chaves KV, `profile:`/`pid:`/`rank:`/`gifts:` com TTL "—" | 25 famílias; TTL 365/400/120/60 d no código; `ord:` em prod é D1, não KV | `04` §1 |
| `07` §2.6 (manual): `droppedItems` "escrito por `shop.ts` (`unlock:'drop'`)" | `grep -n "'drop'" src/utils/shop.ts` → 0 — escritor inexistente | `04` §2.1 |
| Comentário de `public/_headers`: "os TRÊS `<script>` inline" | são 4 (hashes batem 4/4) | `05` §1.1; `00-skeptic` #12 |
| Runbook: `curl -s …/privacidade.html \| grep` | devolve vazio sem `-L` (307 → `/privacidade`); `md5sum` de `dist/` difere por CRLF — usar `tr -d '\r'` | `05` §1.1 |

### 2.2 O que continua sem dono (união dos 9 relatórios)

- **"O jogo julga DIAS ou julga ABERTURAS?"** — a decisão de fundo atrás de `07` 2.1 e 2.2;
  nenhum guarda é dono. É a pergunta D4 (`PLANO-MELHORIAS` §7) pelo outro lado: hoje o
  produto perdoa quem some e ignora quem fez (#58, #59).
- **A curva de Bits / a loja** — o `sustento` cuida de HP/energia, o `permanencia` de
  evolução; a loja não tem guarda (#61).
- **Quem aplica migração D1 em produção** — 3ª rodada seguida (#65).
- **Quem vigia `npm audit`** e **quem mede o ar em cada sessão** — o runbook existe desde
  hoje como checklist (§3.5); o hook de sessão ainda não o chama.
- **Rastro dos provisórios** — a regra "seguir a recomendada" não dizia onde fica o registro;
  agora diz: linha no `REGISTRO-DE-DECISOES.md` com `[provisório #N]` (§3.5, começou por #55).
- **Guard "toda chave `bump(...)` tem leitor em `metricsReport.mjs`"** e **guard "toda chave
  KV escrita em `functions/` aparece em `07` §8"** (`04` sem dono a/b).
- **Vigia de custo em dinheiro**; plano contratado CF/Higgsfield; impostos BR; suporte no E0;
  iOS (`03` sem dono; #69).
- **Desfazer "feita"** (regra, #57); **30 d da lápide vs recriar** (política, #56);
  **navegadores suportados nunca declarados** (#69) (`02b` sem dono).
- **Plataforma de marca** (propósito/posicionamento/promessa) — `docs/MARCA.md` de 1 página
  proposto; a promessa é do dono (`06` M-1); tagline única (#70).
- **Cortesia invisível para o convidado** (R-D1) — ainda aberto desde a R1; alto para o E0.

---

## 3. O que está sendo corrigido nesta rodada — 4 agentes em paralelo

Estado no fechamento deste consolidado: `git status` mostra os arquivos abaixo **modificados
e não commitados** na `qa/rodada-2-2026-09-22`, mais testes `*.qa*.test.*` novos
(`functions/api/save.concorrencia.qa.test.js`, `src/contexts/GameStateContext.hydrate.fuzz2.qa.test.tsx`,
`workers/push-scheduler.qa2.test.js`). A lista é **por relatório de origem**; a coluna
**aterrissou? (sha)** fica vazia até o commit — quem fechar a rodada preenche a partir de
`git show --stat <sha>`, nunca antes (lição da R1, `05` §2.2).

### 3.1 Backend (`functions/api/**`, `workers/**`) — `alpha-backend`

| O quê | Origem | aterrissou? (sha) |
|---|---|---|
| Lápide × mesmo e-mail: `_auth.js` expõe `auth_time`; `save.js` › `auth_time` > `tombstone.at` → `clearTombstone` e segue (provisório #56) | `00-skeptic` #1, `01` 1.2, `02b` F1 | |
| `isAccountDeleted` dentro de `authorizeSaveAccess` — alcança `community.js` (todas as ações com `id` = ator), `subscribe.js`, `fcm-subscribe.js`, `generate-sprite.js` → 410 | `01` 1.3, `04` #1 | |
| `pushidx` autenticado: `authorizeSaveAccess` no `saveId` de `subscribe`/`fcm-subscribe` (não-ok → grava sem saveId); `kv.delete` do que sai do índice; `Authorization` no CORS | `00-skeptic` #2, `01` #2 | |
| Cooperativo na exclusão: `coopLeave` extraído e chamado em `handleDeleteConfirm`; `plan().apaga` | `04` #2 | |
| Exportação mapeia `profile.friends`/`state.friends` por `pidDeSaveId`; teste `not.toContain(OTHER)` | `04` #3 | |
| `claimOrderAtomic`: `try/catch` caindo para `claimOrder` KV com log; filtrar `UNIQUE`/`PRIMARY KEY`, relançar o resto; `billing.js` com `catch` | `05` §5, `04` #10 | |
| Cota de chat por tier: `AI_LIMITS.chat` demo 30 / paid 120 (`_aiGuard.js`, provisório #55); 1 `put` por chamada de IA onde couber | `03` #3, #1 | |
| `orderDetails.slice(-200)` nunca poda pedido pago vivo | `00-skeptic` #3 | |
| `ageDaysOf` em `T03:00:00Z` (push 22h BRT não sai no D0); `_pushCopy.js` › `eveningCopy` sem "esperando", 16h sem "pensou em você", `hpBaixo` título | `00-skeptic` #11, `02` A5/A13 | |
| `account.js` › `COPY.deleteReady` e `deleteDone` reescritos (sem "sentir sua falta", sem "foi bom cuidar de você") | `02` A1, A14 | |
| `push-scheduler.js` › `drainPrefix` desindexa a entrada morta | `04` §0 | |
| `_redact.js`: separador obrigatório em telefone; data só com ano antigo | `01` #7 | |

### 3.2 Frontend (`src/**`, `index.html`, `public/**`) — `alpha-frontend` / `staff-frontend`

| O quê | Origem | aterrissou? (sha) |
|---|---|---|
| `reagirContaExcluida` com `CONFLICT_BACKUP` antes do remove; `cloudLoad`/`reconcileSaveId` tratam `excluida` no portão com prazo; aviso com `resolveLanguage()`, heading/`aria-live` pós-mount e saída ("se não foi você") | `00-skeptic` #1b, `01` #5, `02b` F1/A1/A2, `02` A11 | |
| `pushProfile` só depois de `cloudSaveComRetry` resolver ok (ou `reagirContaExcluida` derruba `pvpEnabled`) | `01` 1.3, `04` #1 | |
| Cliente manda `Bearer` em `subscribe`/`fcm-subscribe` | `01` #2 | |
| Falas inline do `CompanionHUD` → `PET_VOICE_LINES` (`hungry`, `dirty`, …); `CompanionHUD.render.test.tsx` casa por `kind`; `petVoice.ts` | `07` §2.9, `02` (2) | |
| `trilha.ts`: `useEffect([isSleeping])` → `pausarTrilha/retomarTrilha`; `comecar()` recusa se dormindo; guard `!document.hidden` em `aoGestoSonoro` | `06` S-1, S-2 | |
| Fila hidden sanitiza props e filtra ONCE_PER_DAY | `00-skeptic` #4 | |
| Gate WebView detecta `; wv)` (Samsung Internet/Firefox não são WebView); `qualDocMudou` ilegível → both; `__BUILD_ID__` no bundle | `00-skeptic` #5–#7, `02b` A8 | |
| `chatSafety` EN exige "anymore" | `00-skeptic` #10 | |
| Banner de Termos 1ª aparição em posição 1; `ActionRow` de Termos em Ajuda com `#en`; `_blank` com aviso; subject/alt localizados | `02b` A3–A6 | |
| `OfflineSeal` em onboarding/tutorial/upgrade; sprite próprio `onError → getSpriteForStage` | `02b` E1/E2 | |
| `App.tsx` hint Decompor sem misturar ficção + "provedor de IA"; `aria-describedby` no Decompor | `02` A10, `02b` A9 | |
| `hydrateSave`: 4 linhas (`soulmonSkills`, `soulmonClassTitles`, `soulmonMeta`, `evolutionLocked`); `GameStateContext.hydrate.fuzz2.qa.test.tsx` | `04` #9 | |
| `@capacitor/cli` → `devDependencies` + `npm audit fix` (**ainda aberto** da R1; R1 §3.4 disse "em correção" e não aterrissou) | `05` §4 #37, `01` #11 | |
| `TETO_JS_LAZY` em `orcamentoDeBytes` (**ainda aberto** da R1) | `05` §4 #38 | |
| `public/_headers` comentário "TRÊS" → 4; `csp.test` por igualdade | `00-skeptic` #12 | |

### 3.3 Textos (`docs/BOOKLET-UNIVERSO.md`, `docs/PLAY-FICHA.md`, `docs/PLAY-DATA-SAFETY.md`, `android/**` widget, `desktop/**`) — `soulmon-loremaster` + `soulmon-copy-redator` + `alpha-compliance`

| O quê | Origem | aterrissou? (sha) |
|---|---|---|
| Booklet: B1 (ovo só para quem pagou, uma vez) e B2 (§XIV sem a L6 como copy; ausência que o código conta por faixas) | `02` A3, A4 | |
| Booklet C1–C11: quem dispara a forma é o jogador; "dia inteiro sem nada" → meta de coração; 3 jeitos de voltar; "raramente" → todo full clear; humor vai à IA em faixa; ultra por permanência; "ele está lá" com as condições reais; "on desert" → "on merit"; "him" → "the same one"; "falta alguém"; "parte que não coube" (C2/C4/C5/C6 também na bíblia §5.4/§7.1/§5.10/§5.8) | `02` A9 | |
| `PLAY-FICHA.md`: "se você se afasta, ela recua" → o que o código faz; "Ele nasce de quem você é" → "das suas respostas"; "não pune um dia sem marcar" → "perdoa um dia sem marcar por semana" | `02` A2, A7, A8 | |
| `PLAY-DATA-SAFETY.md`: `del:done:` (hash 30 d pós-exclusão) declarado; coop na exclusão; SteamID (#54) | `01` 1.4, `04` #2/#4 | |
| `WidgetRenderer.kt`: "You're my favorite partner!" → "Same road, you and me."; "Quiet day. Me too."; "steady"; "tackle our tasks"; "Ready to evolve"; "stronger"; "rooting" | `02` A6, A12 | |
| Desktop: "Tô de olho na sua produtividade" / "vi você digitando" trocadas; `narrativa.contract` varre `desktop/`; `alt="pet"` → `alt=""` | `02b` A13, R2 | |
| `narrativa.superficies.contract.test.ts` estendido a `_pushCopy.js`/`account.js` + trava `partner` | `02` A15 | |

### 3.4 Plataforma / desktop (`android/**`, `desktop/**`) — `soulmon-guarda-plataforma`

| O quê | Origem | aterrissou? (sha) |
|---|---|---|
| `connect()` em CONNECTING checa `connectionState`; fallback inexato com `setWindow(10 min)`; UI para `canScheduleExact` | `00-skeptic` #8, #9 | |
| Desktop conhece 410: `cloudSync.ts` › `pushCareAction`/`fetchRemoteSnapshot` `res.status === 410` → `reason:'deleted'`, limpar `getAuth`; `normalizeForRules` usa `MAX_HP_BY_FORM` como padrão; `exp` decodificado do JWT | `04` #5, #13, `01` #10 | |

### 3.5 Docs, agentes e governança — `doc-mantenedor` + `doc-bibliotecario` + `alpha-governanca` (esta frente; commit desta sessão)

| Arquivo | O quê | Origem |
|---|---|---|
| `docs/reviews/2026-09-22-qa-rodada-2/00-CONSOLIDADO.md` (este) + `docs/manual/00-MAPA.md` §6.5 | consolidado; os 9 relatórios + 3 arquivos de `sim/` indexados, etiqueta registro | — |
| `docs/PERGUNTAS-DO-DONO.md` | seção "QA RODADA 2 (22/09/2026)" com #54–#71 e provisórios; #48 marcado "ainda parado em 22/09"; #41 recebe a medição (#60) | §5 |
| `docs/E0-PREREGISTRO.md`, `docs/E0-CONSENTIMENTO.md` (novos, cabeçalho R6, vivo, no MAPA §6.2) | pré-registro (H1–H3 com falseamento, morte precoce, denominador, roteiros D7/D14, limites do n=10) e consentimento separado dos Termos | `03` §Pesquisa, #8 |
| `docs/manual/07-DADOS-E-SAVE.md` §8 | inventário KV reescrito: 25 famílias, TTLs reais, quem apaga na exclusão, "em curso 22/09" no que os agentes estão fechando; `ord:` em prod é D1 | `04` §1, #7 |
| `docs/STATUS.md` §3.2 e §1.5 | `METRICS_ADMIN_KEY` ✅; worker de push ✅ deployado 21/09 mas `FIREBASE_SERVICE_ACCOUNT` ausente; D1 **migrações não aplicadas** e a frase do fallback riscada como falsa; `ENTITLEMENTS_ADMIN_KEY` ausente; Actions parado desde 16/09; `npm audit` 16 vulns via `@capacitor/cli` (em curso) | `05` §1.1, §4 #41–#43 |
| `brand/design-system.md` + `.claude/agents/design-critic.md`/`staff-frontend.md` | lápide "herdado da Consultech360 (fork); NÃO é o DS do Soulmon"; os 2 agentes passam a carregar `docs/manual/04-IDENTIDADE-VISUAL.md` | `06` M-1 |
| `.claude/agents/soulmon-operador.md` | runbook ganha como checklist os comandos que a R2 rodou (`curl` do ar com `-L` e `tr -d '\r'`, `wrangler secret list` nos dois lados, `d1 migrations list`, `deployments list`), a linha D1 corrigida (sem tabela = 500, não fallback) e os secrets medidos em 22/09 | `05` §1.1–§1.2 |
| `migrations/README.md` | `d1 migrations apply` como caminho canônico (o `d1 execute --file` colide em `0002`); estado medido em 22/09 | `04` #11, `05` §5 |
| `docs/INVENTARIO-ASSETS.md` | contagem real (1.723 / 121 MB, por comando) + os 102 órfãos (9,6 MB) como **pedido de limpeza** (nada apagado) | `06` A-1, A-2 |
| `docs/ASSETS-A-GERAR.md` §14 | corpo dos briefs L2 (feature graphic 1024×500, composição) e L3 (`og:image` 1200×630, reenquadre de L2) | `06` §4.4, M-4 |
| `docs/REGISTRO-DE-DECISOES.md` | linhas "[provisório #55] cota de chat por tier — sem SKU recorrente, sem modelo acima do 8b" e "Camada 3 congelada × booklet `959e3bee` — exceção registrada (doc de jogador, sem asset)"; a regra do rastro dos provisórios | `03` #5, `05` §3.1–§3.2 |
| `docs/manual/09-HISTORICO.md` §1.5, `docs/manual/11-GLOSSARIO.md` | linhas de `a6c1cd8a` (merge da R1) e desta rodada; termos: lápide × reautenticação, cota por tier, pré-registro, dívida de tempo, git × ar | `05` §2 |
| `docs/orcamento-de-tempo.md` (novo) | baseline de tempo da suíte em 22/09 (`node scripts/orcamento-de-tempo.mjs`, 2 rodadas, 4 502 testes): **dívida nomeada** — 4 casos de `src/components/ShopModal.canvas.render.test.tsx` a 29,7–33,5 % do orçamento; o `scripts/orcamento-de-tempo.mjs` cita `sweeper/orcamento-de-tempo.md`, que não existia no repo | `scratchpad/qa3/orcamento.log` |
| `docs/manual/05-ARQUITETURA.md` §9 | os portões desta rodada: prova de vermelho por mutação (`mutation.log`), orçamento de tempo com dívida nomeada, git × ar como portão do operador | `05` §2.2 |
| `docs/PLAY-LANCAMENTO.md` §E | fatos do ar em 22/09 (o que já está definido, o que falta, o que a frase do fallback D1 dizia de errado) | `05` §1.1 |
| `docs/manual/06-REFERENCIA/desktop.md` | entrada provisória para `desktop/electron/jwtExp.js` (módulo novo da frente desktop nesta rodada — o guard (c) do manual reprovava sem ela); `sim/patch-vinculo-app-eventos.md` (patch não aplicado do guarda do vínculo) indexado no MAPA como plano | `01` #10, `07` 2.4 |
| `docs/BOOKLET-UNIVERSO.md` (só o cabeçalho) | R6: `Verificação:` com comando real + `Não cobre:`; a "régua" citada não lia o arquivo | `05` §4 #46 |

Não foi tocado, de propósito: `CLAUDE.md` (só o dono), `dist/`, qualquer regra de jogo
(`07` 2.1–2.7 são #58–#61), o corpo do booklet e da ficha (§3.3), `ledger/vetos.md` (#41 fica
com o dono via #60), `docs/MARCA.md` (a promessa é do dono).

---

## 4. Tabela única — achado · severidade · dono (o que NÃO está no §3)

Só o que nenhum dos 4 agentes de execução está fechando nesta rodada. Ordem: fatal → alto →
médio → baixo.

| Achado | Sev. | Conserto | Dono | Rel. |
|---|---|---|---|---|
| D1 `soulmon-billing`: migrações 0001/0002 **não aplicadas** → 1ª compra Play = 500 (o `catch` do §3.1 só rebaixa para o KV não atômico) | **fatal (dinheiro, latente até a Play)** | `npx wrangler d1 migrations apply soulmon-billing --remote`; prova: `d1 migrations list` vazio | **dono / operador logado** (#65) | `05` §1.1 |
| Free tier KV estoura por writes em ~18 DAU; `put` falho = 503 no chat / save perdido | **fatal p/ E0 (infra)** | Workers Paid antes do convite ou alerta de cota | **dono** (#64) · `alpha-architect` | `03` #1 |
| `ENTITLEMENTS_ADMIN_KEY` ausente no ar → `grant` 404 → E0 sem cortesia | **alto (bloqueia E0)** | `wrangler secret put ENTITLEMENTS_ADMIN_KEY` + `COURTESY_MAX_ACCOUNTS=10`; prova: grant com chave errada → 401 | **dono** (#67) | `05` §1.1 |
| `FIREBASE_SERVICE_ACCOUNT` ausente no worker de push → FCM do APK nunca envia | **alto (APK sem push; PWA ok)** | `cd workers && wrangler secret put FIREBASE_SERVICE_ACCOUNT` | **dono** (#66) | `05` §1.1 |
| GitHub Actions morto (260 runs desde 16/09) — ainda | **fatal (processo)** | billing do GitHub; hook de sessão imprime `gh run list --limit 3` | **dono** (#48, repete) · `soulmon-coordenador` | `05` §1.1 |
| Virada julga só ontem → quem faz e não abre no dia seguinte nunca ganha dia completo (0/90 em Bx/Bsx) | **alto (regra)** | julgar o dia de `lastResetDate` ou creditar via `habitRhythms.done`; guard "seg feito, qua aberto → +1" | **dono** (#58) → `soulmon-guarda-constancia` | `07` 2.1 |
| Cair e re-evoluir no mesmo dia com HP cheio; `redeemed` por um clique | **alto (regra)** | `canEvolve` exige uma virada completa depois de `degeneratedByHP`, ou piso ≤ `required − 1` | **dono** (#59) → `soulmon-guarda-permanencia` | `07` 2.2 |
| `timesPerWeek 3` feito seg/qua/sex custa 3 ♥/semana (25 ♥, 6 quedas em 90 d) | **alto (regra)** | meta de coração não conta `timesPerWeek` enquanto `diasRestantes >= target − done`; guard 4 semanas = 0 ♥ | `soulmon-guarda-constancia` (regra: dono #58) | `07` 2.3 |
| Marcar feita sem desfazer nem confirmação; check 44 colado ao chevron 44 | **alto** | desmarcar no mesmo dia (reverter ganhos) ou toast "Desfazer" 5 s | **dono** (#57) → `staff-frontend` | `02b` T1 |
| Convidado com cortesia nunca é avisado (R-D1 da R1 não executado) | **alto p/ E0** | card na Fila 2 + `HOME-xx` + CTA → `mode='upgrade'` | `alpha-product-manager` → `design-lead` → `staff-frontend` | `06` D-4 |
| Ficha da Play + `<head>` sem revisão do `narrative-critic` como um todo; 3 taglines | alto (marca) | uma passada, um vocabulário; tagline única (#70) | `soulmon-narrative-critic` | `02` A2/A7/A8, `06` M-1/M-3 |
| 7/11 eventos do Vínculo mudos; comida = 76 % do XP; L3 no d1, L12 no d30 | médio (regra) | ligar `perfectDay`/`habitMilestone`; decidir `feedFood.totalXP`; `bond.wiring.test.ts` varre `src/` por `kind` | `soulmon-guarda-vinculo` | `07` 2.4 |
| Virada + dreno = 2 ♥/dia; dreno ignora carência de save novo, rampa e piso da raiz | médio (regra) | dreno lê `saveDaysLived`/`returnGraceLeft`; teto do DIA compartilhado; piso 1 para rookie | `soulmon-guarda-sustento` (teto: dono) | `07` 2.5 |
| Glitchtama infla `totalPerfectDays` (51 % dos dias completos do perfil B; G: 90/0) | médio (regra) | 🌀 não toca `totalPerfectDays` ou só vale com `dailyDone > 0` | **dono** (#60 = #41 com número) | `07` 2.6 |
| Bits só de minijogo: quem cuida = 0 Bits em 90 d; quem joga compra 4× a loja; chips compram galho | médio (regra) | Bits por dia completo **ou** documentar "loja é dos minijogos"; teto de runs/dia | **dono** (#61) + `soulmon-guarda-sustento` | `07` 2.7 |
| Quiz decide o elemento em ~39 %; planta/industrial ~2 %; nascimento usa `Math.random`; reroll repetido = criatura nova | médio | peso do quiz ou `hint` honesto; guard de distribuição (nenhum elemento < 8 %); `02` §22 restrito ao reroll | `soulmon-guarda-nascimento` | `07` 2.8 |
| Exclusão sem reautenticação recente | médio | `auth_time` ≤ 5 min nas 2 ações | `alpha-backend` + `alpha-frontend` (próxima) | `01` 1.1 |
| `ord:steam:own:<appid>:<steamid>` — SteamID64 retido 5 a pós-exclusão sob "fiscal" que não se aplica | médio (compliance) | apagar na exclusão **ou** declarar em `NOT_INCLUDED` e na política | **dono** (#54) | `04` #4 |
| Ack de compra no cliente antes do grant; sem ack no servidor | médio (dinheiro) | ack após `/api/billing` ok | `alpha-backend` (próxima) | `01` #8 |
| Rebirth × `perAccountLifetime 26` sem reset | médio | 48 ou zerar no rebirth | **dono** (#62) | `03` #4 |
| Higgsfield Starter (R$ 81/mês) só compensa > 35 pagantes/mês; E0 no Gemini custa 4× menos | médio (caixa) | pausar Starter (sem `HF_API_KEY` cai no Gemini) — precisa de `GEMINI_API_KEY` no ar | **dono** (#63) | `03` #2 |
| `scripts/save-id.mjs` não existe (#51 cita) | médio | criar com paridade `emailToSaveId` | `alpha-backend` (próxima) | `05` §4 #36 |
| 14 famílias de métrica gravadas sem leitor; `active_days` corrigido pela metade | médio | seção `--full` genérica em `metricsReport.mjs` | `alpha-insights` | `04` #6 |
| Provisórios da R1 sem rastro no REGISTRO (#40, #42, #43, #45, #46 contra o próprio provisório, #47, #50b); #41 não aplicado | médio (governança) | linha por provisório com `[provisório #N]` (regra escrita em §3.5; retroativo fica para o próximo sync) | `alpha-governanca` → `doc-mantenedor` | `05` §3.2 |
| Árvore compartilhada: 11+ arquivos modificados por outros agentes durante leitura | médio (processo) | `isolation: worktree` para quem escreve; leitores em `git show <sha>:path` | `soulmon-coordenador` | `05` §2.2 |
| `ia.camposEnviados` não vê `fetch('/api/transcribe')` nem o interior de `context`/`history` | médio-baixo | estender o teste | `alpha-qa` | `01` #6 |
| Sem plataforma de marca (propósito/posicionamento/promessa/RTB) | médio | `docs/MARCA.md` de 1 página apontando para BOOKLET e NARRATIVA | **dono** (promessa) + `alpha-marca-estrategia` | `06` M-1 |
| `og:image` = favicon; L2/L3 não rodaram | médio | `/squad-arte gerar loja L2 L3` (briefs prontos) | `arte-gerador` → `arte-conferente` → `arte-instalador` | `06` M-4 |
| E1 `dias-completos-30` ainda desenha 3 lajes ✓ (renderizado em `PetPage`/`MilestoneCeremony`) | médio | `/squad-arte gerar emblema E1` | `arte-gerador` → dono aprova | `06` A-3 |
| `lastDayWasPerfect` escrito e nunca lido; `droppedItems` lido e nunca escrito | baixo | matar os dois ou ligar `droppedItems` ao drop | `alpha-frontend` (próxima) + `doc-redator-arquitetura` | `04` #8 |
| `closed:<season>` sem TTL — documentado agora como "imortal por desenho" | baixo | TTL 400 d ou manter | `alpha-backend` | `04` #12 |
| `courtesy:count` RMW sem CAS; `COURTESY_DEFAULT_MAX 25` ≠ plano 10 | baixo | secret `COURTESY_MAX_ACCOUNTS=10` (#67) | dono | `03` #6, `04` §1.1 #6 |
| 102 assets órfãos (9,6 MB): 54 ícones pixel fora do visor, `home-scene-1547.png` 4,2 MB, `icon-512.png` duplicado, 2 vetorizações da chama | baixo (repo) | pedido de limpeza em `INVENTARIO-ASSETS.md`; arquivar em `D:\Soulmon\brand-archive\` | `arte-instalador` (com aval do dono) | `06` A-2 |
| Aviso "conta excluída" e gate WebView (2 ramos) sem canvas; `CONTA-01` 9 grupos | baixo | `ONB-09a`, `ONB-02b` | `design-wireframer` | `06` D-1/D-2/D-5 |
| 39 dias de barra "cheia sem destino" no mega a caminho do ultra | baixo | verificar o que `EvolutionPath` mostra (45 como alvo?) | `squad-design` | `07` 2.10 |
| ADR-004 handoff omite `_bond.js` e `account.js › collect` — custo ≈ 3 d, não 2 | info | corrigir a ADR antes de o dono decidir #52 | `alpha-architect` | `04` #14 |
| A/B cego S16 não ouvido; 2 MP4 acima do teto | — | **ainda aberto** (R1) | dono; `squad-arte` | `06` S-3, A-5 |

---

## 5. Fila do dono (nova, #54–#71 — numeração continua de `docs/PERGUNTAS-DO-DONO.md`)

Provisório = o que fica valendo até ele responder. Texto completo, com "se mudar", em
[`docs/PERGUNTAS-DO-DONO.md`](../../PERGUNTAS-DO-DONO.md) › "QA RODADA 2 (22/09/2026)".

| # | Pergunta | Provisório | Rel. |
|---|---|---|---|
| 54 | SteamID64 (`ord:steam:own:*`) sobrevive 5 anos à exclusão? | Declarar em `NOT_INCLUDED` + política; não apagar | `04` #4 |
| 55 | Cota de chat por tier (demo 30 / paid 120) | **Aplicado** (`_aiGuard.js`); linha no REGISTRO | `03` #3 |
| 56 | Lápide: login posterior do mesmo e-mail reabre a conta (`auth_time` > `tombstone.at`) — ok? | **Aplicado** | `00-skeptic` #1 |
| 57 | Marcar feita: desfazer no mesmo dia? | Toast "Desfazer" 5 s (reverte ganhos) | `02b` T1 |
| 58 | Virada julga só ontem — mudar para julgar o dia de `lastResetDate`? | Como está + doc `02` §7 avisa | `07` 2.1 |
| 59 | Queda = cura grátis por re-evoluir no mesmo dia | Como está + doc `02` §18 avisa | `07` 2.2 |
| 60 | Glitchtama conta dia completo (= #41, agora com número: 51 % do perfil B) | Como está; #41 continua sem `vetos.md` | `07` 2.6 |
| 61 | Economia: quem só cuida = 0 Bits em 90 d | Documentar "loja é dos minijogos" em `02` §46 | `07` 2.7 |
| 62 | Rebirth × `perAccountLifetime 26` | Como está (arte de reserva após ~5 recusas) | `03` #4 |
| 63 | Higgsfield Starter vs Gemini para o E0 | Manter Starter (sem `GEMINI_API_KEY` no ar não há fallback) | `03` #2 |
| 64 | Workers Paid antes do E0 (KV writes) | Não contratar; alerta manual de cota no runbook | `03` #1 |
| 65 | Aplicar migrações D1 em produção — o operador pode rodar? | Não roda sem aval; `catch` no código | `05` §1.1 |
| 66 | `FIREBASE_SERVICE_ACCOUNT` no worker de push | Ausente = "E0 sem push no APK" no diário | `05` §1.1 |
| 67 | `ENTITLEMENTS_ADMIN_KEY` + `COURTESY_MAX_ACCOUNTS=10` | Ausentes = E0 não começa | `05` §1.1 |
| 68 | GitHub billing (repete #48) | Ainda parado em 22/09 | `05` §1.1 |
| 69 | iOS / Firefox Android suportados? | Android Chrome + desktop Chromium; iOS "melhor esforço" | `02b`, `03` |
| 70 | Tagline única (3 hoje) | "Ela cresce com o seu dia." até o `narrative-critic` | `06` M-1 |
| 71 | Pré-registro e consentimento do E0 — assinar | Docs prontos; nenhum convite antes | `03` #8 |

---

## 6. Portões rodados nesta rodada (base `a6c1cd8a`, máquina local — o CI está fora)

```
npx tsc --noEmit → 0 · npx tsc -p tsconfig.server.json --noEmit → 0 · npx tsc -p desktop/tsconfig.json --noEmit → 0
npm run build → ok (dist/ sem PNG; CSP com 4 hashes iguais fonte ∪ dist)
npx vitest run
 Test Files  351 passed (351)
      Tests  4758 passed | 1 expected fail | 1 skipped | 10 todo (4770)
npm audit --omit=dev → found 0 vulnerabilities
```
O `expected fail` é `save.concorrencia.qa.test.js` (GET que renova TTL × POST concorrente — só o envelope `revision` da ADR-004 fecha; #52). Os 10 `todo` são as regras de jogo #57–#63.

O que já consta nos logs da rodada (`scratchpad/qa3/`):

```
node scripts/orcamento-de-tempo.mjs  (2 rodadas, 4 502 testes, suíte verde nas duas)
  atenção > 10 %: 7 · dívida > 25 %: 4 (todos ShopModal.canvas.render.test.tsx, 29,7–33,5 %) · crítico: 0 · EXIT=1
  → baseline em docs/orcamento-de-tempo.md
mutation.log: depsVivas / versaoUnica / manifest — mutar o alvo → vermelho → revertido (prova de vermelho, 3/3)
flaky.log: 3 passes da suíte de componentes — 219 files · 2629 passed em cada passe
npx vitest run src/assets/artMaps.contract.test.ts        → 14 passed (NOVO)
npx vitest run src/narrativa.superficies.contract.test.ts → verde (NOVO)
npx vitest run <7 arquivos de som>                        → 7 files · 135 passed (06 §1.1)
curl -s https://soulmon.mateus-sprnd.workers.dev/sw.js | grep -m1 CACHE_VERSION → v158 = git = dist
curl -s -w '%{http_code}' https://soulmon.mateus-sprnd.workers.dev/api/metrics → 401 (METRICS_ADMIN_KEY definida)
curl -s -o /dev/null -w '%{http_code}' -X POST '…/api/entitlements?action=grant' → 404 (ENTITLEMENTS_ADMIN_KEY ausente)
npx wrangler d1 migrations list soulmon-billing --remote → 0001 e 0002 "to be applied"
npx wrangler secret list / --name digiapp-push-scheduler → ver 05 §1.1
```

O que **não** rodou e por quê: `gradlew assembleDebug` (sem SDK 36 local, sem CI); Playwright
com throttle (sem Chromium no ambiente); nenhum `wrangler` de escrita (`secret put`, `deploy`,
`d1 migrations apply` — são do dono, §5).
