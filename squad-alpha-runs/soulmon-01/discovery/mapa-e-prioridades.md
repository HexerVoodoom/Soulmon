# Mapa honesto + lista priorizada — Soulmon · run `soulmon-01` · Fase 0

> Autor: `alpha-product-manager`. Data: 2026-08-25. **Entregável central do run** (P1=C:
> auditar o que existe e priorizar).
> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.**
> 🚫 **P4=B — não há telemetria coletando.** Nenhum número de funil, retenção, conversão ou
> custo aparece neste documento. Onde há leitura de produto, ela sai `[hipótese]`.
> 🚫 **Perfis nunca fundidos.** Todo item nomeia **demo**, **pago** ou **ambos** — lembrando o
> achado de `alpha-discovery`: **o perfil pago é população vazia hoje**, porque nenhum billing
> funciona (`src/utils/playBilling.ts:5-6`). Otimizar "para o pago" hoje é otimizar para
> conjunto vazio; isso rebaixa, por si só, todo item exclusivo do pago.
> **Não escrevo PRD aqui e não desenho solução.** Isto é mapa + fila.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> **F2 do gate:** este documento (§3, versão original) escreveu *"o gatilho de reordenação
> de `PROGRAMA.md:21-23` DISPAROU"*, cuja cláusula termina em *"porque o app já tem
> jogadores reais"*. **O conjuntor é falso — o gatilho nunca disparou por esse enunciado.**
> Soulmon tem zero usuários de terceiro. Corrigido in loco em §3 abaixo (🔧).
>
> **O que muda, de verdade, e por outro caminho:** a exploração técnica provada pelo
> `alpha-security` é real, mas atinge os **2 usuários reais do DigiApp**, não "jogadores do
> Soulmon". Isso não dispara o gatilho tal como escrito — mas **exige reordenação por um
> motivo diferente e mais preciso**, registrado em `DECISOES.md`: **não tocar em
> `digiapp-a5e`**, e resolver a exposição construindo infraestrutura própria do Soulmon
> **antes** de qualquer coisa que dependesse do host atual. A recomendação de §3
> (fundir conserto+separação) também mudou de sinal por isso — ver correção em §3 abaixo.
>
> **Item 1 da fila (§2) foi reescrito**: a versão original recomendava configurar
> `VITE_FIREBASE_*` no **projeto Pages atual** e então ligar `FIREBASE_PROJECT_ID` — isso é
> exatamente o que o `alpha-skeptic` marcou como **objeção fatal F1**: haveria derrubado os
> únicos 2 usuários reais do sistema (o app do DigiApp na namorada do dono). **Corrigido**:
> a ordem certa é criar o destino próprio do Soulmon primeiro.

---

## 1. Mapa honesto do estado do Soulmon

### 1.1 Construído e funcionando

| Área | Evidência |
|---|---|
| Motor de tarefas (5 módulos puros): constância "N das últimas 7", escudos automáticos, triagem, janela de descanso, rituais, fresh start | `src/types/taskModel.ts`, `src/utils/habitRhythm.ts`, `taskTriage.ts`, `restWindow.ts`, `rituals.ts` — com testes travando as regras |
| Regras de cuidado / virada do dia (meta ponderada, teto de 1 coração, perdão de ausência) | `src/utils/dailyReset.ts` (`computeDailyReset`, `:571,588,607`) |
| Pipeline do Oráculo completo (psicometria + astral + numerologia + class-system + bestiário), cobertura travada por simulação | `src/utils/soulProfile/pipeline.ts`; `pipeline.test.ts` |
| SEC-2 (saveId nunca publicado como identidade social) — **resolvido de verdade, independe do Firebase** | `functions/api/community.js:81-84,102-111` |
| SEC-5 (SSRF no `subscribe`) — resolvido no repo | `functions/api/subscribe.js:52-58`; `_pushTargets.js:36+` |
| Direitos autorais de arte/nomes — encerrado, com guard testado | `docs/Attributions.md`; `src/utils/oracle.ts` |
| Higiene de dado sensível: psicometria + dados natais **crus** ficam no aparelho e nunca sobem | `SoulmonOnboarding.tsx:331-334` |

### 1.2 Construído e **desligado** (código pronto, zero efeito em produção)

| Item | Evidência | Perfil |
|---|---|---|
| **Telemetria inteira** — cliente com allowlist de 7 eventos, opt-out, fila, testes de paridade cliente↔servidor. `track()` **não tem nenhum chamador em `src/`** | `src/utils/telemetry.ts:402` (+ busca por `track(` só devolve o módulo e seu teste) | ambos |
| **Endpoint de métricas** do servidor, completo e testado, nunca recebeu tráfego; e **ninguém lê** as chaves `m:*` | `functions/api/metrics.js:50,198,275` | ambos |
| **Autorização de save** (`denyUnlessOwner` em 6 pontos) — código certo, **inerte** porque `FIREBASE_PROJECT_ID` está desligado (*fail-open* por desenho) | `functions/api/_auth.js:112-113`; `community.js:236,332,432,450,476,497` | ambos |
| **Cota de IA por conta** — declarada inoperante enquanto o Firebase estiver desligado | `functions/api/_aiGuard.js:16-19,32-36` | ambos |
| **Caminho atômico de `claimOrder`** (D1) — existe no código, condicionado a `env.DB`, e **não há binding D1** | `_entitlements.js:147-155`; `wrangler.jsonc` (só `DIGIAPP_SAVES` e `PUSH_SUBSCRIPTIONS`) | pago |
| **`PLAY_REQUIRE_ACCOUNT_BINDING`** — flag existe, nada indica ligada; fail-open | `functions/api/_billing.js:179-183` | pago |
| **Geração de sprite único** — existe, funciona, e tem **um único chamador**: uma página sem entrada na navegação | `src/components/OraclePage.tsx:259` | pago |
| **Billing** — nenhum plugin instalado; `isBillingAvailable()` é `false` em toda plataforma | `src/utils/playBilling.ts:5-6,37-50` | pago |
| **Anúncio recompensado** — sem SDK, gated por flag do servidor | `src/utils/monetization.ts:5-7,97-98`; `entitlements.test.js:47` | pago |
| **Login em produção** — o `dist/` publicado não tem nenhuma chave `AIza…`/`authDomain`: front buildado sem `VITE_FIREBASE_*` | grep em `dist/` (`security-escopo-e-reverificacao.md:28-30`) | ambos |

### 1.3 🔴 **Documentado como pronto — e o código diz o oposto** (o grupo mais importante)

Cada linha traz **as duas fontes lado a lado**. Este é o achado estrutural do run: **a
documentação do Soulmon não é confiável como retrato de estado**, e nenhum run seguinte deve
partir dela sem reverificar no código.

| # | O doc afirma | O código diz | Perfil |
|---|---|---|---|
| D1 🔧 | `docs/STATUS.md:462` — **SEC-1 ✅ resolvido** (ações de `community.js` autorizadas) | `_auth.js:112-113` devolve `{ok:true, enforced:false}` quando `FIREBASE_PROJECT_ID` não existe ⇒ os 6 `denyUnlessOwner` são no-op. **Confirmado em produção por sonda GET sem token: HTTP 200 — atingindo hoje os 2 usuários reais do DigiApp, não "jogadores do Soulmon" (que não existem)** | ambos |
| D2 | `docs/STATUS.md:469-471` — "isso **não** fecha quando o `FIREBASE_PROJECT_ID` for ligado" | É o **inverso exato**: hoje só fecha **quando ligar** (`_auth.js:113`). O doc está desatualizado ao contrário | ambos |
| D3 | `docs/STATUS.md:503` — **SEC-3 ✅** (`claimOrder` atômico) | `_entitlements.js:147-155`: o ramo atômico é `if (env.DB)`, e **não existe binding D1** em `wrangler.jsonc` nem em `workers/wrangler.toml` ⇒ roda sempre *read-then-write* sobre KV eventualmente consistente. O teste passa porque usa um `Map` em memória (`_entitlements.test.js`) — mede o código, não a semântica do armazenamento. O próprio `STATUS.md:518-527` já admite o falso-positivo | pago |
| D4 | `docs/PLANO-PRODUTO.md:128` — o custo de IA está *"travado atrás de `accountTier:'paid'`, então só quem paga gera"* | `functions/api/generate-sprite.js:175-204` — a rota mais cara do produto passa **só** por `guardAiRequest` (`:184`). **Nenhuma checagem de `accountTier`.** E a cota por conta está inoperante (`_aiGuard.js:16-19`). O COGS **não está preso ao lado pago da fronteira** — e, com zero usuários pagos reais hoje, qualquer geração que ocorra não é paga por ninguém | ambos |
| D5 | `CLAUDE.md:76` — *"Teto de 1 coração por dia — um dia ruim é um sinal, não uma sentença"* | `src/App.tsx:2007-2029` — o dreno de cocô cobra `periods` **irrestrito**; não passa por `MAX_HEARTS_LOST_PER_DAY`, nem por `lossCap` (`dailyReset.ts:607`), nem pelo traço Teimoso. 24h com cocô na tela = até 4 corações = degeneração | ambos |
| D6 | `CLAUDE.md:76` — *"Ausência ≥2 dias não cobra nada: quem volta encontra saudade, não fatura"* | O dreno vive em `App.tsx`, **fora** de `computeDailyReset()`, e **não consulta `forgivesHP`** (`dailyReset.ts:588`) em hipótese nenhuma. `[hipótese]` de ordenação: `drain()` roda na montagem (`App.tsx:2032`) enquanto a virada só é *agendada* a cada 30s | ambos |
| D7 | `docs/PLANO-PRODUTO.md:63,67` — unicidade visual é *"o ativo defensável e o motivo de compra"* | `src/App.tsx:3045-3050` (idem `:2317,:2367`) — o **pago** recebe corpo sorteado por hash da seed entre 3 linhas genéricas (`sprites.ts:104-116`), com comentário do próprio código chamando de *"visual provisório até a Fase 2 assumir"*. **Dívida assumida, não política declarada** | pago |
| D8 | `docs/STATUS.md:698` / `DEPENDE-DE-VOCE.md:132-137` — mitigação de tela do reroll aleatório pago (declarar equivalência mecânica) | `src/components/CreditsModal.tsx:216,228-229` — **a UI real não menciona equivalência.** A mitigação está sugerida no doc e **não implementada**. ✅ Dono já decidiu (D-05): implementar e seguir | pago |
| D9 | `public/privacidade.html:43-73` — dados de nascimento *"nunca são enviados aos nossos servidores"* | Verdadeiro para os campos **crus** (`SoulmonOnboarding.tsx:331-334`), mas os **eixos derivados** (elemento/alinhamento/reino) sobem no save: `GameStateContext.tsx:191-197`, `App.tsx:2339-2345`. A tabela §2 da política não declara isso. **Adicionalmente, o texto ainda diz "não direcionado a menores de 13", contradizendo D-06 (18+)** | ambos |
| D10 | `docs/reviews/2026-08-03/soulmon-user-researcher.md:68-69` — *"o produto tem o diferencial construído e não o entrega"*, a frase mais citada do repo, tratada como diagnóstico | O documento se declara **rascunho** (`:5-6`) com **10 de 10 seções + 4 anexos `[EM ABERTO]`**; é a única linha escrita dele. Duas das suas premissas são **falsas hoje** (a arte da Bandai saiu; o afetado é o pago, não o demo) — `problem-framing.md:41-46` | ambos |
| D11 | `docs/PLANO-DESKTOP-STEAM.md` (plano inteiro, escrito como base viável) | O overlay Electron **nunca funcionou fim a fim**; plano escrito sob premissa falsa. **Correção pós-gate: Steam voltou ao escopo do programa** (dono reverteu P8), como run próprio, depois da Play — este plano precisa ser revisto quando esse run abrir | — |
| D12 | `docs/STATUS.md` como um todo, selo verde de segurança | P6=B: SEC-1/2/5 contraditórios entre fontes, SEC-3 falso-positivo admitido. **Trate `STATUS.md` como registro de intenção, não de estado** | — |

**Padrão que os 12 desenham (e é o achado que ordena o programa):** a disciplina do repo é
real, mas mora em `src/utils/` (regras puras, com teste). **Tudo o que escapou de `src/utils/`
divergiu do doc em silêncio**: `App.tsx` (D5, D6), a camada de monetização (D4, D8), a de
comunidade, a de infraestrutura (D1, D2, D3), a de política (D9). Divergência silenciosa não
dá erro — e é por isso que ela sobreviveu.

---

## 2. Lista priorizada — **o entregável do run**

**Critério de ordenação, declarado:** (1) risco real e ativo sobre os 2 usuários reais do
DigiApp, hoje > (2) fato que invalida medição futura > (3) contradição entre promessa escrita
e produto construído > (4) trava de negócio > (5) dívida. Dentro de cada faixa, **custo
baixo sobe**. **Linha de corte visível abaixo do item 12**: do 13 em diante nada é feito
antes do checkpoint de `soulmon-02`.

Dono: **DONO** = só o dono pode (painel, conta, cartão, decisão) · **SQUAD** = a squad executa.
Esforço grosseiro: **XS** ≤1h · **S** ≤1 dia · **M** ≤1 semana · **L** > 1 semana.

| # | Item | Evidência | Dono | Esforço | Run | O que trava se não for feito |
|---|---|---|---|---|---|---|
| 1 🔧🔴🔴 | **Construir infraestrutura própria do Soulmon (Pages/KV/Firebase novos) e ligar a autorização de save LÁ — não no host atual `digiapp-a5e`.** Hoje `/api/save` naquele host responde **200 sem token** em produção, atingindo os 2 usuários reais do DigiApp | `_auth.js:112-113`; sonda GET → 200 (`security-…md:16-24`); `DECISOES.md` (não tocar em `digiapp-a5e`) | **DONO** (painel; a squad prepara o build) | M (infra nova) | **02** (ver §3) | Configurar `VITE_FIREBASE_*` e ligar `FIREBASE_PROJECT_ID` no **host atual** derrubaria os 2 usuários reais do DigiApp em produção — era a objeção fatal F1 do gate. A correção certa é infra nova para o Soulmon; `digiapp-a5e` só é tocado por decisão explícita e combinada do dono com os 2 usuários. **Ambos os perfis do Soulmon se beneficiam quando essa infra existir** |
| 2 🔴 | **Teto no dreno de cocô** — `Math.min(periods, MAX_HEARTS_LOST_PER_DAY)` + zerar `poopPenaltyClockAt` na hidratação do save | `App.tsx:2007-2029,2027`; contradiz `CLAUDE.md:76` | SQUAD | **XS** (1 linha + 1 teste) | **agora** (§4) | A única perda sem teto do jogo continua desmentindo a promessa escrita do produto, **e é a dor que a cura paga por dinheiro real vende alívio** (`monetization.ts:78`). Independe de população. **Ambos** |
| 3 🔴 | **Apagar `tasksDone` da tela de outro jogador** (PT e EN) | `PlayerDetailModal.tsx:100-101` ← `GameStateContext.tsx:929` | SQUAD | **XS** (uma string) | **agora** (§4) | O app exibe contagem bruta de tarefas da **vida real** de outra pessoa — o score que `PLANO-PRODUTO.md:69-71` jura não ter, no lugar onde ninguém foi procurar. **Ambos** |
| 4 🔴 | **Gate de `pvpEnabled` no `pushProfile`** — hoje `pvpEnabled` viaja como *campo*, não como *portão*: quem nunca ligou PvP aparece no diretório público | `GameStateContext.tsx:917-930` (esp. `:927`) | SQUAD | **XS** (1 linha) | **agora** (§4) | Perfil público sem consentimento efetivo; alimenta E8/Q-compliance. **Ambos** |
| 5 🔴 | **`generate-sprite` cobra COGS sem checar `accountTier`** — decidir se é bug (fechar a rota) ou se o doc está errado (corrigir o doc) | `generate-sprite.js:175-204,184`; contra `PLANO-PRODUTO.md:128` | **DONO** decide o veredito · SQUAD executa | S | **02** | Enquanto existir, **nenhuma medição de "custo de IA por usuário pago" significa coisa alguma** — o denominador não é o que o servidor cobra, e hoje qualquer geração é gratuita para quem a explorar. **Ambos** |
| 6 🔴 | **Deploy do worker de push** (`wrangler deploy` em `workers/`) — deploy é manual, a versão rodando pode ser anterior às correções, e o nudge de cobrança das 21h foi removido do produto e **continua vivo no servidor** | `DEPENDE-DE-VOCE.md:14-24`; `CLAUDE.md` (worker não é Pages Function) | **DONO** | **XS** (um comando) | **agora** (§4) | O produto está mandando, todo dia, uma cobrança que ele já decidiu não fazer — e isso atinge, hoje, quem realmente recebe push (dono + namorada, DigiApp). Também é o que confirma o SEC-5 na prática. **Ambos** |
| 7 🔴 | **Ligar a telemetria que já existe** — fiar `track()` em ~6–8 pontos de UI; infra, validação e testes já prontos e passando | `telemetry.ts:402`; `metrics.js:50`; `evidencia-comportamento.md:125-130` | SQUAD | S–M ("horas, não dias" para a fiação) | **03** | As 3 teses do negócio (`PLANO-PRODUTO.md:227`) continuam ilegíveis, e **toda decisão de produto continua sendo opinião** — mesmo depois de ligada, o primeiro dado será do próprio dono. Pré-requisito de V3–V7 assim que houver população. **Ambos** |
| 8 ✅ | ~~É decisão ou dívida que ninguém possa comprar?~~ — **RESPONDIDA (D-04): "primeiro se bancar".** Nenhum plugin de billing instalado; o modelo fecha com folga sob essa resposta (`tese-e-unit-economics.md §10`) | `playBilling.ts:5-6,37-50`; `PLANO-PRODUTO.md:129`; `DECISOES.md` D-04 | **DONO** já decidiu | — (decisão feita) · L (execução) | **04** | Passa a ser item de execução de `soulmon-04` (O-7 de `requisitos.md`), não mais pergunta aberta. **Pago** |
| 9 🟠 | **Cap de 1 atividade/dia do demo** — confirmar se é o valor pretendido; hoje trava o loop inteiro (meta ≤1 ⇒ quase nunca dia perfeito) | `monetization.ts:101,115-117` | **DONO** decide o número · SQUAD executa | XS (o número) | **02/03** | O único perfil que existe hoje (o próprio dono, em teste) não consegue rodar o produto. Ataca diretamente a métrica-norte pelo teto. **Demo** |
| 10 🟠 | **Alinhar `privacidade.html` §2 ao que `soulmonMeta` realmente envia, e corrigir a idade mínima para 18+** antes de preencher o formulário de Segurança de Dados da Play | `privacidade.html:43-73,111-115` vs `GameStateContext.tsx:191-197`; `DECISOES.md` D-06 | **DONO** (declaração) · SQUAD (texto) | S | **04** (mas o ajuste do doc é **agora**) | Declaração de loja que não bate com o comportamento nem com a decisão já tomada (18+); bloqueia E4/E6 e o envio à Play. **Ambos** |
| 11 🟠 | **`PLAY_REQUIRE_ACCOUNT_BINDING = true` + binding D1 `order_claims`** (SEC-3, D3) | `_billing.js:179-183`; `_entitlements.js:147-155`; `wrangler.jsonc` | **DONO** (variável/binding) · SQUAD (migração) | S–M | **04** (sobe para 🔴 se o billing for configurado antes) | Um recibo vira N contas pagas. Em pagamento único, vazamento de entitlement é **perda permanente do LTV inteiro** (`PLANO-PRODUTO.md:220`). Só se materializa quando o billing existir. **Pago** |
| 12 🟠 | **CI de `tsc` + `vitest` em PR** (P5=A, já autorizado) | `PROGRAMA.md:33`; contexto §8 (só existem os builds Android/desktop) | SQUAD | S | **02** | Sem CI, cada divergência silenciosa do §1.3 tem chance de nascer de novo. É a única defesa estrutural contra o padrão que este mapa documenta. **Ambos** |
| — | **━━━ LINHA DE CORTE — nada abaixo antes do checkpoint de `soulmon-02` ━━━** | | | | | |
| 13 🟠 | Repositório `HexerVoodoom/Soulmon` é público ou privado? (keystores recuperáveis no histórico, blobs com conteúdo) | `git rev-list --all --objects \| grep -i keystore`; `security-…md:146-158` | **DONO** | XS (a resposta) | 02 | Decide se é exposição real ou higiene. **Já decidido (D-11): gerar keystore nova antes do primeiro envio, sem reescrever histórico** |
| 14 🟠 | Schema de telemetria: variante demo vs. pago em `onboarding_step` | `telemetry.ts:86`; `evidencia-…md:131-134` | SQUAD | S | 03 | Sem isso, os dois usuários opostos caem no mesmo agregado e o número não responde a pergunta nenhuma |
| 15 🟠 | Agregado por coorte para D7/D30 em `applyAggregate` | `metrics.js:198` | SQUAD | M | 03 | Retenção e "retorno após ausência ≥2 dias" (a métrica-assinatura da tese anti-cobrança) não são deriváveis do agregado diário atual |
| 16 🟠 | Leitor dos agregados `m:*` (rota autenticada ou script) — hoje é **escrita sem leitura** | `metrics.js:275`; `community.js:131` (mecanismo de `.list()` já existe) | SQUAD | S | 03 | Mesmo com 7/14/15 prontos, ninguém lê o número |
| 17 🟠 | Script de contagem de saves no KV (com discriminante Soulmon vs. DigiApp) | `community.js:131`; `GameStateContext.tsx:149,274-280` | **DONO** autoriza (LGPD) · SQUAD executa | S | 03 | É o único caminho para **denominador e baseline** sem construir telemetria nova — sabendo que hoje o resultado esperado é pequeno (dono + 2 do DigiApp). Sem o ok do dono, `soulmon-03` roda cego |
| 18 🟠 | Definição de "usuário ativo" + alvo v1 da north star (hoje `—`) | `PLANO-PRODUTO.md:77,81,88` | **DONO** | XS | 03 | Métrica sem denominador não é calculável; métrica sem alvo não decide nada — **ainda aberta (D-15)** |
| 19 🟠 | Termos de Uso + onde política/termos aparecem | `SettingsPage.tsx:279-282`; `privacidade.html:111-115` | **DONO** | S | 04 | Checklist da Play; **idade mínima já respondida (18+, D-06)**, falta o gate |
| 20 🟡 | `getDemoCreatureStages` mostra a **mesma criatura em 3 galhos** na tela que deveria vender profundidade | `monetization.ts:63-74` (o comentário `:58-61` admite) | SQUAD | S | 02/03 | `[hipótese]` — a tela informa **pior que o silêncio**. Depende de V5 antes de virar decisão cara. **Demo** |
| 21 🟡 | ✅ Anunciar a bifurcação irreversível **um passo antes** (só texto) — mitigação de reroll **decidida (D-05)**, esta é uma peça menor e correlata | `SoulmonOnboarding.tsx:201-203,816-818` | SQUAD | XS | 04 | Preserva o ritual e devolve deliberação. Depende de V4. **Pago** |
| 22 🟡 | Rota de exclusão / exportação de dados do titular — **não existe nenhuma** (`DELETE` responde 405) | `save.js:104`; `security-…md:190-195` | **DONO** decide · SQUAD desenha | M | 04 | Pergunta de retenção do formulário da Play; `ent:`/`ord:` são gravados **sem TTL** |
| 23 🟡 | Concluir ou **aposentar** `soulmon-user-researcher.md` (D10) | `:5-6`, `:68-69` | **DONO** | XS | 02 | Enquanto existir, um rascunho continua sendo citado como diagnóstico — o modo de falha que `PLANO-PRODUTO.md:22` já registrou |
| 24 🟡 | Clonar `../Besti-rio-` e `../Class-System` (pendência material de P2=A) | `PROGRAMA.md:30` | **DONO** | XS | 02 | Sem clone, nem o merge nem `npm run sync:oracle-data` são executáveis; `pool.json` pode divergir do canônico **em silêncio** |
| 25 🟡 | Esconder a barra "0/30 dias perfeitos" abaixo de um piso | `missions.ts:87-90` | SQUAD | XS | 04 | O mais fraco dos achados de ética; **não fazer antes de 2, 3, 9** |

**O que este mapa deliberadamente NÃO prioriza, e por quê:** implementar a geração de sprite
no onboarding (D7). Custa dinheiro por usuário (`PLANO-PRODUTO.md:128`), assume H1 verdadeira
sem prova, e o perfil que ela serve é **população vazia hoje** (item 8, agora respondido por
D-04 na direção "se bancar primeiro" — o que não muda a recomendação de não construir isso
ainda). Vira decisão depois de H1/V2 e depois de existir um caminho de cobrança — não antes.

---

## 3. Recomendação de sequência do programa

> 🔧 **Correção pós-gate:** a versão original desta seção afirmava que "o gatilho de
> reordenação de `PROGRAMA.md:21-23` DISPAROU… porque o app já tem jogadores reais". **Essa
> cláusula é falsa e o gatilho, como escrito, nunca disparou** (F2 do gate). A reordenação
> abaixo é mantida, mas pelo motivo correto: risco real e ativo sobre os **2 usuários reais
> do DigiApp**, e a decisão do dono de não tocar em `digiapp-a5e`.

**`alpha-security` provou exploração técnica em produção com sonda não destrutiva (GET sem
token → 200), num host que serve o DigiApp** — 2 usuários reais (o dono e a namorada dele).
Isso não é o gatilho original ("jogador do Soulmon"), mas é motivo suficiente, por si, para
reordenar: o programa não pode tratar essa exposição como dívida sem prazo, mesmo sem ela
ser sobre usuários do Soulmon.

**Recomendação, corrigida: o conserto NÃO reutiliza o host atual, e NÃO vira um run
inteiro novo. Ele vira a PRIMEIRA FATIA de `soulmon-02`, que passa a se chamar "construir
infraestrutura própria + ligar a autorização lá".**

O raciocínio, explícito e corrigido:

1. **🔧 O conserto não é "configurar variável no host atual e ligar" — é construir destino
   novo.** A versão original deste documento recomendava configurar `VITE_FIREBASE_*` no
   **projeto Pages atual**, republicar, e só então ligar `FIREBASE_PROJECT_ID` — isso é
   exatamente a objeção fatal F1 do gate: o projeto atual **é o do DigiApp**, e ligar a
   variável de servidor ali derrubaria com 401 os 2 usuários reais que dependem dele.
   **O dono já resolveu isso na sessão de correção**: "começar limpo — Pages próprio, KV
   novo, sem migração" (`DECISOES.md`). A fatia 1 de `soulmon-02` é, portanto, criar esse
   destino, não mexer no atual.
2. **A separação do DigiApp (URL, KV, Firebase) e a construção da infra nova do Soulmon são,
   na prática, o mesmo trabalho de infraestrutura**, agora que ambas apontam para "não
   tocar no host atual". Fazer isso em dois runs separados duplicaria esforço de setup sem
   necessidade.
3. **Abrir um "run 0 de segurança" custaria mais do que resolve.** O trabalho de infra nova
   é real (M, não XS), mas ainda cabe como fatia 1 de `soulmon-02` — não precisa da
   cerimônia de 6 fases e gates de um run inteiro.
4. **`digiapp-a5e` continua intocado, por decisão explícita do dono.** Qualquer migração dos
   2 usuários reais do DigiApp para uma infra nova (se um dia acontecer) é uma decisão
   separada, combinada com eles, e não faz parte deste programa por padrão.
5. **B e A não se movem.** Nada em `soulmon-03` (telemetria) ou `soulmon-04` (lançar) responde
   à exposição do DigiApp, e ambos continuam dependendo de infra definitiva do Soulmon. A
   justificativa original de `PROGRAMA.md:14-15` sobrevive intacta.

**Sequência recomendada:**

| # | Run | Objetivo | Mudança |
|---|---|---|---|
| 1 | `soulmon-01` | C — auditar e priorizar | **inalterado**; encerra com este documento, corrigido pós-gate |
| — | *(fora de run)* | **Consertos de 1 linha** (§4) + itens 2, 3, 4, 6 da fila | **novo** — não esperam run nenhum |
| 2 | `soulmon-02` | **D — infra própria do Soulmon, sem tocar `digiapp-a5e`** — fatia 1: Pages/KV/Firebase novos + autorização de save lá; fatia 2: CI (item 12) e item 5 | **reordenado por dentro, com destino corrigido** |
| 3 | `soulmon-03` | B — telemetria | inalterado (com a nota de `alpha-discovery`: pode começar por um **leitor**, não por um SDK — itens 16 e 17; e a nota de que o primeiro dado real será o do próprio dono) |
| 4 | `soulmon-04` | A — lançar | inalterado; absorve 10, 11, 19, 22. **P1=A já resolvida na direção "se bancar primeiro" (D-04)** |

**Uma reserva honesta, para o dono decidir e não a squad:** se a resposta ao item 13
(repositório público?) for **"público"**, as keystores no histórico somam-se à exposição do
DigiApp, e aí a recomendação pode mudar — o dono já decidiu D-11 (keystore nova antes do
1º envio), mas rotação de keystore/reescrita de histórico segue fora do escopo declarado
deste run, então eu **escalo em vez de decidir**.

---

## 4. Consertos de 1 linha — **não esperam run nenhum**

Custo quase zero, impacto alto, todos com `arquivo:linha`. Separados por quem pode autorizar.

### 4.1 Seguros de fazer **sem** decisão do dono (a squad executa)

Critério: **removem cobrança ou exposição, não adicionam nada, não mudam preço, não tocam em
regra de jogo declarada, e cada um corrige uma contradição já escrita no próprio repo.**

| | Conserto | Onde | Por que é seguro |
|---|---|---|---|
| 1 | `healthPoints: Math.max(0, prev.healthPoints - Math.min(periods, MAX_HEARTS_LOST_PER_DAY))` | `App.tsx:2027` | Aplica uma regra que `CLAUDE.md:76` **já declara** como lei. Não é regra nova — é fazer o código obedecer o doc. Cocô continua aparecendo e continua custando 1 coração se ignorado. Acompanhar do teste de V1 (semear `poopPenaltyClockAt = now − 30h`, montar, exigir queda ≤ `MAX_HEARTS_LOST_PER_DAY`) — ~20 min, e **não existe teste cobrindo isso hoje** (`useDailyReset.test.ts:234-242` só checa que o relógio zera) |
| 2 | Apagar `tasksDone` da string (PT **e** EN) | `PlayerDetailModal.tsx:100-101` | Não mexe no servidor, não migra save, não quebra PvP, diretório, amigos nem presentes. `daysPlaying` fica (mede permanência, não ordena ninguém). Se um dia voltar, volta **como faixa** — o padrão já existe e é testado em `tournamentTiers.ts` |
| 3 | Condicionar `pushProfile` a `gameState.pvpEnabled` | `GameStateContext.tsx:917` | Alinha o comportamento à expectativa que o próprio campo cria (`:927` já carrega o flag). Uma linha |
| 4 | Zerar `poopPenaltyClockAt` na **hidratação** do save | `GameStateContext.tsx:689` | Fecha o caso da cobrança retroativa de ausência (D6) **sem depender de ordem de efeitos**. Alternativa equivalente: o dreno consultar `forgivesHP` |
| 5 | Corrigir `docs/STATUS.md:462,469-471,503` — SEC-1 → **parcial/inerte**, SEC-3 → **não resolvido** | `STATUS.md` | É edição de documentação para bater com o código já verificado. **Deixar o selo verde é o dano.** Mesma família: registrar D4 em `PLANO-PRODUTO.md:128` |
| 6 | Alinhar a tabela §2 de `privacidade.html` ao que `soulmonMeta` envia (D9), **e corrigir a idade mínima para 18+ (D-06)** | `privacidade.html:43-73,111-115` | Torna a política **verdadeira** e coerente com decisão já tomada. Não é decisão nova de norma; é descrição de fato e alinhamento a decisão do dono. ⚠️ *Se o dono preferir que qualquer alteração de política passe por ele, este item migra para 4.2 — sinalizo e não decido* |

### 4.2 Exigem decisão do dono (a squad **não** faz sozinha)

| | Item | Onde | Por que não é da squad | Estado |
|---|---|---|---|---|
| 7 | **Manter `adsEnabled` desligado por padrão / decidir não ligar o anúncio recompensado** | `monetization.ts:5-7,97-98`; servidor já responde `adsEnabled:false` (`entitlements.test.js:47`) | É **decisão de monetização**, e o dono é o único dono (§9). O achado que sustenta a recomendação: o SDK ainda não existe, então **desligar hoje custa zero** e depois custa reverter comportamento já aprendido pelos usuários. A cadeia é `anúncio → Crédito → reroll aleatório`, que fura por outro lado a trava Bits→Créditos que o repo protege de propósito (`CLAUDE.md:93`, `_entitlements.js:99`) | Ainda aberta |
| 8 | **Deploy do worker de push** (`cd workers && npx wrangler deploy`) | `DEPENDE-DE-VOCE.md:14-24` | Um comando — mas exige **credencial de wrangler**, que a squad não tem. É o único item de custo zero que está afetando usuário (dono + namorada, DigiApp) agora e só o dono pode disparar | Ainda aberta |
| 9 | **Subir `DEMO_ACTIVITY_DAILY_CAP`** de 1 | `monetization.ts:101` | Alterar o teto é **mudar a fronteira do freemium**. A squad recomenda que o objeto trancado seja o diferencial (o pet único), não o cuidado — mas o número é do dono | Ainda aberta |
| 10 | **Texto de equivalência mecânica no reroll** (D8) | `CreditsModal.tsx:216,228-229` | **✅ Decisão já tomada (D-05): implementar e seguir.** Falta só a execução do texto | Resolvida, falta executar |

---

## 5. Perguntas ao dono — lista única, deduplicada, ordenada por impacto, com estado atualizado

Formato de `docs/DEPENDE-DE-VOCE.md`. **Nenhuma pergunta nova foi inventada** — todas vêm dos
7 artefatos da onda 1, com a origem citada. Onde duas fontes perguntaram a mesma coisa, as
duas origens aparecem na mesma linha. ✅ marca perguntas já respondidas em `DECISOES.md`.

### 🔴 URGENTE — está afetando os 2 usuários reais do DigiApp agora

| # | Pergunta | Origem | O que trava | Estado |
|---|---|---|---|---|
| Q1 | **Autoriza a construção de infra própria do Soulmon (sem tocar `digiapp-a5e`) como caminho para fechar a exposição de save?** Confirmado por sonda: `/api/save` aceita GET sem token em produção. **E: houve ou pode ter havido acesso indevido aos 2 usuários do DigiApp?** | security §3.1 + compliance Q1 + `DECISOES.md` | Dado pessoal de usuário real (incl. `soulGoal`/`soulStruggle`) exposto **agora**, indefinidamente, sobre os 2 usuários do DigiApp | ✅ Parcialmente respondida: dono já decidiu "começar limpo" (infra nova); acesso indevido não confirmado nem descartado — ver `D-02` |
| Q2 | ✅ **RESPONDIDA (D-04): "primeiro se bancar".** | discovery Q1 | "Usuário pago" (§3) era perfil de projeto, não população — resposta já orienta a prioridade (segurança/billing antes de canal/CAC) | Resolvida |
| Q3 | **`HexerVoodoom/Soulmon` é público ou privado?** | security §3.2 | Decide se as keystores recuperáveis no histórico são exposição real ou higiene | Ainda aberta |
| Q4 | **A afirmação de `PLANO-PRODUTO.md:128` ("só quem paga gera sprite") era intenção de desenho ou descrição do código?** O servidor não checa `accountTier` | negócio §10 + negócio §0 | Se era intenção, há bug de COGS aberto. Se era descrição, o doc precisa de correção — enquanto não resolver, medir "custo de IA por usuário pago" não significa nada | Ainda aberta |
| Q5 | **Podemos ler os saves de jogadores reais (do DigiApp) no KV para contar base e esforço?** Sim/não, e sob que restrição LGPD | discovery Q2 | É o único caminho para baseline sem construir telemetria | Ainda aberta |
| Q6 | ✅ **RESPONDIDA (D-05): implementar mitigação de tela e seguir, assumindo o risco.** | compliance Q2 + comportamento C5 | `soulmon-04` fecha checklist de loja com o texto já definido | Resolvida |
| Q7 | **O que declarar no formulário de Segurança de Dados** sobre os eixos derivados do perfil psicométrico/astral que **vão** ao servidor? | compliance Q3 (+ E3/E4) | Bloqueia o envio à Play | Ainda aberta |
| Q8 | ✅ **RESPONDIDA (D-04): "quer que exista e se bancar", lucro depois de validado.** | negócio §10 | Muda o veredito do modelo: fechar 🔴 e lançar tem prioridade sobre canal/CAC | Resolvida |
| Q9 | **Qual o orçamento mensal de aquisição, especificamente?** (orçamento geral já é ~R$200/mês, `contexto.md §5`) | negócio | De baixa prioridade dado Q8=D-04 (aquisição só na fase de lucro) | Parcialmente respondida (orçamento geral, não de aquisição) |
| Q10 | **O sprite genérico do pago ("provisório até a Fase 2") é dívida aceita ou defeito a corrigir agora?** | discovery Q3 | Decide se o motivo de compra declarado está ou não sendo entregue a quem paga — e se o item mais caro da fila entra ou não | Ainda aberta |
| Q11 | ✅ **RESPONDIDA implicitamente: manter desligado (D-13, anúncio recompensado desligado agora, custa zero)** | comportamento (→ dono) | Governa E7 | Resolvida |
| Q12 | **Deploy do worker de push** — um comando, exige sua credencial | `DEPENDE-DE-VOCE.md:14-24` | O nudge de cobrança das 21h foi removido do produto e **continua vivo no servidor**, disparando todo dia para dono + namorada | Ainda aberta |

### 🟠 ANTES DE QUALQUER COISA COM DINHEIRO OU LOJA

| # | Pergunta | Origem | O que trava | Estado |
|---|---|---|---|---|
| Q13 | **O billing já está configurado em produção?** Se sim, SEC-3 sobe para 🔴 — o D1 `order_claims` não existe (verificado em `wrangler.jsonc`) | security §3.4 | Um recibo vira N contas pagas; em pagamento único a perda é o LTV inteiro | Ainda aberta |
| Q14 | **Qual foi a fatura real do Groq e do Higgsfield nos últimos meses?** | negócio | É o **único dado real disponível hoje sem escrever telemetria nova**, e falseia de uma vez as duas suposições mais frágeis do modelo | Ainda aberta |
| Q15 | **Qual a sua definição de "usuário ativo"? E qual o alvo v1 da north star** (hoje `—`)? | discovery Q4+Q5 | Sem denominador a métrica-norte não é calculável; sem alvo ela não decide nada | Ainda aberta (`D-15`: squad propõe, dono aprova, no próximo checkpoint) |
| Q16 | **O cap de 1 atividade/dia do demo é o valor pretendido?** | discovery Q6 + comportamento C4 | Limita estruturalmente a métrica-norte do **único usuário real que existe hoje** (o dono) | Ainda aberta |
| Q17 | ✅ **RESPONDIDA (D-06): idade mínima 18+.** Falta implementar o gate e corrigir a política | compliance Q5 | Classificação etária e política de Famílias; governa as decisões sobre reroll (já resolvido) e anúncio (já resolvido) | Resolvida (falta execução) |
| Q18 | **Vão existir Termos de Uso, e política/termos aparecem no onboarding ou só em Configurações?** | compliance Q4 | Trabalho de texto nas telas de entrada e a revisão da `privacidade.html` | Ainda aberta |
| Q19 | **Qual versão do `workers/push-scheduler.js` está deployada hoje?** Deploy manual, não verificável por leitura de repo | security §3.3 | Afeta o SEC-5 na prática e o nudge das 21h (Q12) | Ainda aberta |
| Q20 | **Retenção e uso de dados no Groq, Higgsfield e Gemini: há contrato/DPA, ou é a política do plano gratuito?** | security §3.5 | Nada no repo responde. Alimenta Q7 e a transferência internacional na política | Ainda aberta |

### 🟡 QUANDO DER

| # | Pergunta | Origem | O que trava | Estado |
|---|---|---|---|---|
| Q21 | **Existe caminho para o jogador apagar ou exportar os dados dele?** Não achamos nenhum (`DELETE` → 405); `ent:`/`ord:` sem TTL | security §3.6 | Pergunta de retenção do formulário da Play; a Fase 2 precisa saber se desenha. **Já sabido: responder antes do lançamento (D-16)** | Parcialmente respondida (prazo: antes de `soulmon-04`) |
| Q22 | **TTL de 365 dias no save: decisão de retenção ou efeito colateral?** (renova a cada save ⇒ indefinido para quem joga) | compliance Q6 | A resposta de "por quanto tempo guardamos" no formulário da Play | Ainda aberta |
| Q23 | ✅ **RESPONDIDA (D-19): corrigir e reescrever `soulmon-user-researcher.md` com o alvo certo (o pago, não o demo)** | discovery Q7 | Fonte anedótica citada como diagnóstico — o modo de falha que `PLANO-PRODUTO.md:22` já registrou | Resolvida |
| Q24 | **Clonar `../Besti-rio-` e `../Class-System`** — pendência material de P2=A | discovery Q8 + `PROGRAMA.md:30` | Sem clone, nem o merge nem `npm run sync:oracle-data` são executáveis; `pool.json` pode divergir do canônico **em silêncio** | Ainda aberta |
| Q25 | **O nicho de "~300k pessoas no Brasil" veio de alguma fonte, ou é chute?** (a palavra "talvez" está no original) | negócio | Decide se o sizing pode virar sizing de verdade ou continua sendo declaração de não-estimabilidade | Ainda aberta |
| Q26 | **Vale revalidar o diferencial** contra apps de astrologia/personalidade (Co-Star, The Pattern) antes de tratá-lo como firme? | benchmark | O "nenhum concorrente direto" é achado de **uma** rodada de busca, não prova de mercado | Ainda aberta |

---

## 6. Não-objetivos deste run — explícitos

Escritos com o mesmo cuidado dos objetivos. Isto é o que **não** foi feito, de propósito.

1. **Não escrevi PRD.** P1=C é auditar e priorizar. PRD sem baseline, sem denominador de
   "ativo" e com o perfil pago vazio seria ficção com aparência de plano.
2. **Não desenhei solução.** Nenhuma tela, nenhum fluxo, nenhum estado vazio/erro/offline.
   Isso é Fase 2 e é do `alpha-product-designer`.
3. **Não quebrei nada em stories.** Não há PRD para quebrar. As stories nascem em
   `soulmon-02`, com o orquestrador.
4. **Nenhum código de produto foi alterado neste run** — inclusive os consertos de §4, que
   são **recomendação com endereço**, não execução.
5. **Não produzi um único número de funil, retenção, conversão ou custo.** P4=B. Os esforços
   grosseiros (XS/S/M/L) são estimativa de trabalho, não medição de comportamento.
6. **Não reabri o enquadramento do problema.** `alpha-discovery` já o fez; eu consumi.
7. **Não reabri a lane de marca.** `docs/PLANO-DESIGN.md:3-5` é canônico.
8. **Não afirmei norma nenhuma.** P7=B. Tudo o que é regulatório virou pergunta ao dono.
9. **Não toquei no que o contexto §10 e P8 excluem:** URL de produção do host **atual**,
   renomear `DIGIAPP_SAVES` do host atual, regra de jogo, Fase 4 de sensores, rotação de
   keystore, mudança de preço, Steam/desktop (este último agora tem run próprio no
   programa, mas ainda não neste run).
10. **Não criei roadmap paralelo.** Esta fila **é** a ordenação do `PROGRAMA.md`, e cada item
    aponta para o run a que pertence. Se divergir do rastreador oficial (**GitHub Issues,
    D-18**), o rastreador vence — `alpha-delivery-ops` registra.
11. **Não priorizei implementar a geração de sprite no onboarding do demo** (§2, nota final) —
    é o item mais tentador e o mais caro para se estar errado.
12. **Não li nenhum save de usuário real**, e não autorizei ninguém a ler (Q5 é do dono).

---

## Handoffs

- **→ `alpha-product-designer` / `alpha-architect` / `alpha-qa`**: a fila §2 é o escopo
  ordenado; os itens 1–12 são o que existe acima da linha de corte. **V1** (teste do dreno,
  ~20 min) é executável hoje e não depende de ninguém.
- **→ `alpha-delivery-ops`**: registrar §2 no rastreador oficial — **GitHub Issues (D-18)** —
  e §5 em `docs/DEPENDE-DE-VOCE.md`. Os itens 5 e 6 de §4.1 são **correções de documentação**
  e fecham as contradições D1/D2/D3/D4/D9.
- **→ o dono**: §3 (a reordenação, corrigida, com a reserva de Q3) e §5 inteira. Q1 é o
  caminho crítico (parcialmente respondida — infra nova autorizada; acesso indevido segue
  sem confirmação).
- **Gate → `alpha-skeptic`**: as três afirmações que mais merecem ataque nesta versão
  corrigida são
  **(a)** a recomendação de §3 de **não** abrir um run de segurança separado — ela troca
  cerimônia por velocidade e o custo do erro é a exposição do DigiApp aberta por mais tempo;
  **(b)** a classificação dos itens 1–6 de §4.1 como "seguros sem decisão do dono" —
  especialmente o 6, que altera uma política pública;
  **(c)** se a infraestrutura nova do Soulmon (item 1) é de fato dissociável da separação
  completa do DigiApp, ou se accionar uma força a outra antes do previsto.
