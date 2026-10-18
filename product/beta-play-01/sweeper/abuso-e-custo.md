# Abuso e custo: beta fechado (`beta-play-01`, sweeper)

| Meta | Valor |
|---|---|
| Autor | alpha-security · 2026-10-11 |
| Pedido do dono | "me proteger: usuário recriando o Soulmon e me gastando muito, abusando do chat, abusando de estorno, etc." |
| Código lido (somente leitura) | `E:/soulmon-beta-rel` (release/beta-1, em integração). As linhas citadas são dessa árvore. `beta-chat`, `beta-sub` e `main` têm os mesmos arquivos-chave; `_killSwitch.js` e `rtdn.js` só existem em rel/sub. |
| Base | `contexto.md` §5/§10/§11 · `discovery/threat-model-beta.md` (F1–F12, R1–R10, sem repetir) |
| Legenda | **BB** = corrigir antes do beta · **BP** = antes da produção · **OK** = risco aceito no beta, com o motivo |

## 0. Achados que mudam a premissa ("custo zero")

1. **A geração de sprite NÃO é custo zero.** `generate-sprite.js:2-13` usa **Higgsfield** (`HF_API_KEY`/`HF_SECRET`; "HF" aqui é Higgsfield, não HuggingFace), que é um plano pago (o próprio `_aiGuard.js:55-60` registra Starter US$ 15/mês, 800 imagens). O fallback é `gemini-2.5-flash-image`, que **não tem free tier confirmado** na API. As fontes públicas dão ~US$ 0,039 por imagem 1024² (1.290 tokens de saída). Se o dono ligar billing no projeto Google da `GEMINI_API_KEY` para destravar imagem, **a mesma chave também tira o chat de reserva (`_llm.js:699`) do gratuito**, porque o chat usa essa chave. **Ação (BB):** decidir entre (a) desligar a geração no beta (arte de reserva), (b) aceitar o Higgsfield pré-pago de US$ 15 como teto, ou (c) separar as chaves em dois projetos Google: chat num projeto sem billing, imagem noutro com orçamento/alerta.
2. **O gargalo real do custo zero é o KV gratuito: 1.000 escritas/dia na CONTA INTEIRA (todos os namespaces), 1.000 list/dia e 1.000 delete/dia, com reset 00:00 UTC.** Passou disso, a escrita **falha**. Com o desenho atual:
   - cada chat aprovado escreve 2 chaves (`_aiGuard.js:367-368`), então o teto global de 300 chats/dia já gasta **600 escritas**;
   - cada sprite escreve de 3 a 6 (`ent:`, global, conta, lock, cache, blob);
   - cada save é 1 escrita, e o servidor aceita **30 por minuto por conta** (`save.js:93`);
   - `/api/crash` é **anônimo** e faz `put` em **todo** relatório repetido (`crash.js:165`) e `list` em toda assinatura nova (`crash.js:169`).

   **Um único `curl` em `/api/crash` (10/min/IP/isolate, `crash.js:56`) esgota as 1.000 escritas do dia em menos de 2 horas.** Daí em diante: o `_aiGuard` falha fechado (503, chat e sprite caem para todos), **o save falha** (quebra a métrica §4c, zero perda de save) e a compra não grava entitlement. Isso fica **acima de qualquer vetor de IA**. **BB:** ver V4.1.

## 1. Tabela de vetores

Custos no pior caso por dia, assumindo `FIREBASE_PROJECT_ID` ligado (ver V6.3).

### V1. Sprites (o mais caro em US$)

| # | Como o abusador faz | Dano máx./dia | Controle existente | Lacuna | Correção concreta | Prio |
|---|---|---|---|---|---|---|
| 1.1 | Loop de geração numa conta paga | 6 imagens/conta/dia → US$ 0,23 (Gemini) ou 6/800 do Higgsfield | `requirePaidTier` (`generate-sprite.js:415`); `AI_LIMITS.sprite` 6/dia, 26 vitalício, 3/forma, 800/mês global (`_aiGuard.js:109`); dedupe por cache+lock (`generate-sprite.js:453-500`) | nenhuma relevante | — | OK |
| 1.2 | **Excluir a conta e logar de novo para zerar o teto vitalício.** A exclusão minimiza `ent:` com `aiLifetime: {}` e **não copia** `aiForms` nem `rebirthSpriteResetAt` (`account.js:681-700`). Fica só `tier: 'paid'`. A lápide é desfeita por login posterior (`_accountTombstone.js:93-110`). O resultado é uma conta paga com 26 imagens novas, 3 por forma novas e o renascimento disponível de novo. | 6/dia por conta, sem fim: ~180/mês, **22% do orçamento mensal de 800 por um só abusador**. Quatro abusadores secam o mês de todos (o 503 `ai-monthly-budget-reached` vale para todos). | `_aiGuard.js:333-356`; dedupe | o reset vitalício escapa pelo caminho de exclusão | Na minimização do `ent:` **preservar** `aiLifetime`, `aiForms` e `rebirthSpriteResetAt`: são contadores anti-abuso, não perfil (mesma lógica de "o que fica é DINHEIRO" do comentário de `account.js:681`). QA: deletar → relogar → `POST generate-sprite` com `aiLifetime.sprite` já em 26 → 402. | **BB** |
| 1.3 | Renascer em loop | 0 a mais: o reset é 1×/conta (`entitlements.js:210-224`, `rebirthSpriteResetAt`) e exige `state.rebirth` validado | ok, exceto via 1.2 | só pelo 1.2 | coberto pelo 1.2 | OK |
| 1.4 | Contas alt (Google alt ou e-mail descartável verificado) | cada alt precisa ser **paga**. No beta a compra é licença de teste, ou seja, grátis para os ~15 da allowlist. Fora dela a compra é dinheiro real (receita > custo) | `requirePaidTier`; `PLAY_REQUIRE_ACCOUNT_BINDING` (F2) + `order_claims` D1 (F1) | sem F1/F2 ligados, um recibo serve para várias contas (V3.3) | aplicar F1+F2 (já no threat model) | **BB** |
| 1.5 | Admin | 3× os tetos, sub-teto de 40/mês (`_admin.js:24,32`) | `verifiedAdmin` + `email_verified` | — | — | OK |
| 1.6 | Chave Gemini vazando em log | — | — | `generate-sprite.js:289` põe `?key=` na URL (o `_llm.js:701` já usa header) | trocar para o header `x-goog-api-key` | BP |

### V2. Chat (Groq free + Gemini free)

| # | Como | Dano máx./dia | Controle | Lacuna | Correção | Prio |
|---|---|---|---|---|---|---|
| 2.1 | Flood numa conta | 15 (demo) / 20 (pago) chamadas | `AI_LIMITS.chat` (`_aiGuard.js:94`), guard antes do provedor (`chat.js:591`), kill switch `CHAT_DISABLED` (`_killSwitch.js`, `chat.js:586`) | sem rate por minuto: as 15 saem num segundo, com rajada de 30 RPM no Groq | balde por conta 4/min via `takeToken` (amortecedor, não exato) | BP |
| 2.2 | Prompt longo (tokens de entrada) | ≤ ~4–5K caracteres de entrada por chamada | mensagem 500 (`chat.js:599`), histórico 6×500 (`chat.js:218-234`), `maxTokens` 120/260 (+300 de raciocínio, `_llm.js:631`), `sanitizeChatContext` | o tamanho de `context`/`behavior` não foi auditado byte a byte | teto total serializado de ~6 KB no corpo do `messages` antes de chamar; recusar 413 | BP |
| 2.3 | Injection "gasta tudo / repete 10x" | limitado pelo `max_tokens` do servidor | o `max_tokens` é do servidor, e as ações exigem confirmação na UI (`_chatActions.js`) | — | — | OK |
| 2.4 | **Multi-conta para secar o teto global.** O app é servido de `soulmon.mateus-sprnd.workers.dev`, que é **web pública**. Qualquer conta Google com e-mail verificado loga (`_auth.js:100`) e vira demo com 15 chats. **20 contas = 300 = teto global** → `ai-daily-budget-reached` para os 15 testadores o dia inteiro. | chat derrubado para todos (DoS), custo US$ 0 | teto global 300 (`_aiGuard.js:94`) | o global protege o bolso, não a disponibilidade; não há allowlist | **beta:** allowlist `BETA_EMAILS` (secret) nas rotas de IA, recusando 403 fora dela. Alternativa: reservar 80% do global para contas com `firstSeen` antigo ou tier pago | **BB** |
| 2.5 | Exaurir o free tier do provedor | Groq gpt-oss-120b 200K TPD ≈ 105 chamadas de ~1.900 tokens; depois o Gemini free (~250 RPD) | fallback `_llm.js:726-753`, frase cansada do pet | **o global de 300 está acima da capacidade do Groq (≈105)**: o resto cai no Gemini, e se o projeto Gemini tiver billing (§0.1) **isso vira cobrança** | (a) global de chat = 250, que cabe no gratuito somado; (b) circuit breaker por provedor (§2); (c) chave Gemini de chat num projeto **sem billing** | **BB** (c) / BP (b) |
| 2.6 | Anônimo sem login | 0 | `guardAiRequest` exige saveId + token, e o `email_verified` barra o anônimo do Firebase | só se `FIREBASE_PROJECT_ID` estiver vazio (V6.3) | — | OK |
| 2.7 | Corrida no contador global (KV eventual, ~60 s de propagação; 1 escrita/s por chave) | rajada paralela passa do teto em dezenas | fail-closed na leitura | o KV não é atômico | aceitar no beta; na produção, contador em Durable Object ou D1 `UPDATE … SET n=n+1 WHERE n<cap RETURNING` | BP |

### V3. Estorno / reembolso / recibo

| # | Como | Dano máx. | Controle | Lacuna | Correção | Prio |
|---|---|---|---|---|---|---|
| 3.1 | Compra vitalício → usa → reembolsa | perde a receita; o custo de IA consumido (≤ 26 sprites ≈ US$ 1) não volta | `auditRefunds` 1×/dia por conta (`_entitlements.js:736-760`) via `products.get` `purchaseState===1` (`_billing.js:213-225`); o tier é derivado | (a) a auditoria **só roda quando o cliente chama** `GET /api/entitlements`, e quem não abre o app nunca é auditado; (b) `404 → null → mantém` (`_billing.js:217`); (c) a RTDN ignora `voidedPurchaseNotification` de produto único (`rtdn.js:130-135`); (d) **a Voided Purchases API não é usada** | Cron Trigger diário (o free tem 5 crons) chamando `GET purchases/voidedpurchases?type=1&startTime=<último>` (cobre produto **e** assinatura, inclusive o 404). Para cada `purchaseToken` → `order_claims` → saveId → marcar voided e rederivar o tier. Na RTDN, tratar `productType=2` chamando a mesma função | BP (beta = licença de teste, dano zero) |
| 3.2 | Compra Créditos → gasta → reembolsa | os créditos gastos ficam; o saldo vai a `max(0, …)` (`_entitlements.js:758`, decisão explícita) | idem | não há sinal de reincidência | contador `refunds` no `ent:`; com ≥ 2 reembolsos, bloquear novas compras de Créditos (`BILLING_DISABLED` por conta) | BP |
| 3.3 | Mesmo recibo em várias contas | 1 compra → N contas pagas → N × 26 sprites | `order_claims` D1 + binding (F1/F2) | **inativo** até o dono aplicar a migração remota e ligar `PLAY_REQUIRE_ACCOUNT_BINDING=true` | já em F1/F2 | **BB** |
| 3.4 | Assinatura: resgata vitrine → reembolsa | itens cosméticos ficam (R8, decisão pendente) | RTDN subs + `voided` productType 1 (`rtdn.js:128-133`) | política R8 sem decisão | dono decide R8. Proposta: reembolso bloqueia **novos** resgates por 90 d | BP |
| 3.5 | Licença de teste aceita como real (`purchaseType=0`) | na produção, uma conta em License testing ganha vitalício grátis | `test: !!sub?.testPurchase` só na assinatura (`_billing.js:370`) | o vitalício e os Créditos não leem `purchaseType` (F5) | var `PLAY_ACCEPT_TEST_PURCHASES` (true no beta, false na produção) + allowlist | BP |
| 3.6 | Cortesia sobrevive ao reembolso | — | `_entitlements.js:762-772` | decisão pendente | dono decide | BP |

### V4. Free tier Cloudflare e rotas sem IA

| # | Como | Dano máx./dia | Controle | Lacuna | Correção | Prio |
|---|---|---|---|---|---|---|
| 4.1 | **`/api/crash` anônimo em loop** com a mesma assinatura (1 `put` por chamada) ou assinaturas novas (`list` + `put`) | **esgota 1.000 escritas e 1.000 list do dia → app inteiro sem save, chat, sprite e compra até 00:00 UTC** | IP 10/min por isolate (`crash.js:56`), 100 assinaturas/dia (`crash.js:49`), corpo 4 KB | o teto é de assinaturas **novas**; repetidas incrementam sem fim. O balde por isolate é furado. O `list` por relatório gasta a cota de list | (1) contar repetições **na memória do isolate** e gravar no máximo 1×/assinatura/hora; (2) teto diário global de escritas de crash (≤ 100) em contador de memória + 1 chave; (3) **regra de Rate Limiting da Cloudflare** (o free permite 1 regra) em `/api/crash*` 5/min por IP; (4) trocar o `list` por um índice diário | **BB** |
| 4.2 | Save em loop (30/min/conta aceitos, `save.js:93`) | 1 conta = 43K escritas tentadas/dia; **na prática, o fim do free tier em ~33 min** | IP 120/min, conta 30/min (memória), 5 MB | os tetos estão 40× acima do que o free comporta | conta 2/min + **teto diário por conta de 150 escritas** (contador em memória + header). Cliente: debounce ≥ 30 s e gravar só ao sair ou em evento relevante. **Medir as escritas reais de 1 tester/dia antes do beta** | **BB** |
| 4.3 | Orçamento de escrita no uso legítimo | 15 testers × (saves + 15 chats × 2 + push + metrics) passa fácil de 1.000 | — | nenhum | **Workers Paid US$ 5/mês** (1M escritas/mês inclusas) já está em `DEPENDE-DE-VOCE.md:65`. É o **único item pago que recomendo para o beta**: sem ele, a métrica §4c fica refém do KV. Se o dono recusar: mover contadores de IA para D1 (100K escritas/dia no free) e cortar save para debounce de 60 s | **BB (decisão do dono)** |
| 4.4 | Push em loop (`/api/subscribe`, `fcm-subscribe`) | escritas de KV | auth + IP | idem 4.2 | 1 subscribe/aparelho/dia por conta | BP |
| 4.5 | Transcrição (Supabase → modelo de fala) | por conta, ilimitado no dia; IP 6/min por isolate (`transcribe.js:59`), 4 MB (`:68`) | auth Firebase obrigatória (`transcribe.js:50-57`) | **não passa pelo `guardAiRequest`**: sem cota diária nem global | bucket `transcribe` no `AI_LIMITS` (10/dia/conta, 100/dia global) | **BB** (barato de fazer) |
| 4.6 | `metrics` POST | escritas KV com TTL de 2 anos (`metrics.js:792`) | rate IP | idem | contar em memória, gravar agregado | BP |
| 4.7 | Workers 100K req/dia | flood HTTP derruba a cota diária | Cloudflare DDoS | nada nosso | regra de Rate Limiting em `/api/*` (ou WAF free) | BP |

### V5. Guilda / coop / duelo / guerra / presentes

| # | Como | Dano | Controle | Lacuna | Correção | Prio |
|---|---|---|---|---|---|---|
| 5.1 | Alts mandam presente (20 bits/dia por amigo, `community.js:27,914-926`) para a conta principal | economia do jogo, não US$ (bits não compram IA nem tier) | 1×/dia por par | N alts = 20N bits/dia | teto de bits **recebidos**/dia por conta (ex.: 100) | BP |
| 5.2 | Doação de bits na Casa da guilda (`guild.js:445`, `CASA_BITS_POR_DIA`) com alts | idem | teto diário por doador | nenhum teto por guilda/receptor | teto por guilda/dia; recompensa de guilda exige membro com ≥ N dias de `firstSeen` | BP |
| 5.3 | Duelo/guerra contra alt passiva para farmar honra/ranking | ranking falso | testes `community.farm`, `pvpGate`, `duel.race` existem | não reverifiquei o algoritmo | revisar na Fase 3 | BP |
| 5.4 | Rotas de comunidade custam KV (300 list+get por `players`) | list/dia | `takeToken` (`community.js:264`) | por isolate | cache do diretório por 5 min no Cache API | BP |

### V6. Admin, exfiltração, configuração

| # | Como | Dano | Controle | Lacuna | Correção | Prio |
|---|---|---|---|---|---|---|
| 6.1 | Virar admin | 3× IA, créditos de exibição | `ADMIN_EMAILS` secret + `email_verified` (`_admin.js:1-21`) | — | — | OK |
| 6.2 | `GET /api/crash`, `metrics` admin | leitura de agregados | `METRICS_ADMIN_KEY` por `secretEquals` (`crash.js:187`, `metrics.js:683`) | força bruta sem rate próprio | chave ≥ 32 bytes aleatória; a regra CF do 4.1 cobre | BP |
| 6.3 | **`FIREBASE_PROJECT_ID` vazio** → `authorizeSaveAccess` libera (`_auth.js:182-186`) | o atacante inventa um saveId por chamada: cotas por conta viram nada e só o global segura | fail-closed só nas rotas novas (`transcribe`, admin) | dependência de uma var | **checklist do dono antes do beta:** `wrangler secret list` com `FIREBASE_PROJECT_ID`. QA: `POST /api/chat` sem Bearer → 401 | **BB (verificação)** |
| 6.4 | Exfiltrar o sprite pago de outro | — | auth antes do cache (`generate-sprite.js:421-430`) | — | — | OK |

## 2. Teto global por provedor com circuit breaker (proposta, BP; o item (a) é BB)

Um módulo `_spend.js`, chamado por `_llm.js`, `generate-sprite.js` e `transcribe.js` **antes** de cada `fetch` ao provedor:

| Provedor | Teto diário (custo zero) | Disjuntor |
|---|---|---|
| Groq chat | 90 chamadas **ou** 180K tokens (a partir de `usage.total_tokens` da resposta) | ao atingir, ou com 3× 429 em 5 min: aberto até 00:00 UTC e pula direto para o Gemini |
| Gemini texto | 200 | aberto → `AI_BUSY_MESSAGE` local |
| Imagem (Higgsfield/Gemini image) | `globalMonth` 800 (existe) + **diário 40** (novo) | aberto → arte de reserva |
| Transcrição | 100 | aberto → 503 amigável |
| KV escritas (estimadas) | contador em memória + 1 chave/hora; ao passar de 800 no dia, "modo economia": rotas de IA e crash recusam antes de escrever, e o save fica com prioridade | protege o save |

(a) **BB, barato:** baixar `AI_LIMITS.chat.global` de 300 para 250 e adicionar `transcribe`. Implementação: contador por provedor em D1 (atomicidade, 100K escritas/dia no free, sem disputar a cota do KV), com cache de 30 s em memória.

## 3. Como o dono fica sabendo (alertas)

1. **Cloudflare Notifications (grátis):** "Workers usage" / "KV usage approaching limit" por e-mail. Configurar no painel (dono).
2. **Google Cloud Billing:** budget de US$ 1 com alerta em 50/90/100% no projeto da chave de imagem. Se houver billing no projeto de chat, isso já é sinal de erro.
3. **Higgsfield:** conferir o saldo de créditos semanalmente (sem API de alerta conhecida).
4. **Alerta próprio:** quando um disjuntor abre, ou o global passa de 80%, ou uma conta bate o teto diário 3 dias seguidos, o Worker grava `alert:<dia>:<tipo>` e manda **um** push FCM para o saveId admin (a infra de push já existe) no máximo 1×/tipo/dia. Sem e-mail novo, sem dado pessoal no corpo.
5. Kill switches já existem: `CHAT_DISABLED`, `BILLING_DISABLED` (`_killSwitch.js`). Falta `SPRITE_DISABLED` e `CRASH_DISABLED`, com o mesmo padrão. **BB, de 10 linhas.**

## 4. Painel / script de "top consumidores" (BP; script CLI no beta)

- **Servidor:** `GET /api/metrics?view=top-ai&day=AAAA-MM-DD` (admin, `METRICS_ADMIN_KEY`). Lista as chaves `ai:<bucket>:*:<dia>` (1 list por bucket, ~4/dia, dentro da cota) e devolve o top 20 `{saveIdPrefix(8), bucket, n}`, com o saveId **truncado** para não virar índice de pessoa. Soma `aiLifetime.sprite` do top e conta de exclusões/relogin (`accountDeletedAt` + `tombstone` reaberto) para pegar o 1.2.
- **Script local:** `scripts/top-consumidores.mjs` usando `wrangler kv key list --prefix ai:chat: --remote` e `wrangler d1 execute` (sem endpoint novo, sem custo de Worker). Saída em tabela, com marcação "≥ 80% da cota em ≥ 3 dias".
- **Sinais de abuso a destacar:** (a) contas novas (< 24 h) no top de chat; (b) mesmo IP `/24` com ≥ 3 contas no dia (requer gravar só o `/24` hasheado, em memória, nunca persistido: **pergunta ao dono jurídico** antes de persistir IP); (c) conta com `accountDeletedAt` + uso de sprite depois; (d) reembolsos ≥ 2.

## 5. O que precisa do dono

1. Decidir a geração de sprite no beta (§0.1): desligar / Higgsfield pré-pago / separar a chave Gemini em projeto sem billing para o chat.
2. Decidir Workers Paid US$ 5/mês (§4.3). Sem ele: aceitar debounce de save ≥ 60 s e contadores em D1.
3. Conferir `FIREBASE_PROJECT_ID` (6.3), F1 (migração D1) e F2 (binding).
4. Regra de Rate Limiting da Cloudflare (1 no free) em `/api/crash*` → depois `/api/*`.
5. Alertas: Cloudflare Notifications + budget Google.
6. Allowlist `BETA_EMAILS` para as rotas de IA no beta (2.4): sim ou não?
7. Políticas pendentes: R8 (assinatura reembolsada), cortesia × reembolso (3.6), persistência de IP para antiabuso (jurídico).

## 6. Verificações executáveis para o `alpha-qa`

| ID | Verificação |
|---|---|
| Q1 | Conta paga com `aiLifetime.sprite=26` → `delete-confirm` → login → `generate-sprite` = **402** (hoje passa) |
| Q2 | 101 `POST /api/crash` com a mesma assinatura → ≤ 2 `put` no KV mock |
| Q3 | 31 `POST /api/save` em 60 s da mesma conta → 429. Teto diário por conta → 429 com `Retry-After` |
| Q4 | `transcribe` 11× no dia → 429 `ai-daily-limit` |
| Q5 | Disjuntor: 3 respostas 429 do Groq mock → a 4ª chamada não faz `fetch` ao Groq |
| Q6 | Sem Bearer em `chat`/`generate-sprite`/`transcribe` com `FIREBASE_PROJECT_ID` setado → 401 |
| Q7 | Voided Purchases mock com o token X de `order_claims` → `tier` derivado vira `demo` sem o titular abrir o app |
| Q8 | E-mail fora de `BETA_EMAILS` → 403 em `/api/chat` (se o dono aprovar 2.4) |

## 7. Fora de escopo (risco aceito, não inexistente)

DoS volumétrico distribuído (fica com a Cloudflare) · fraude de cartão do lado da Google · cliente modificado (o servidor é a autoridade) · algoritmo de duelo/guerra (5.3, não reverificado) · `metrics.js` e `community.js` não lidos linha a linha · branches `beta-chat`/`beta-sub` não diffadas contra a rel (assumi os mesmos tetos) · limites de free tier que mudam sem aviso (Groq e Gemini conferidos só via comentário do código e fontes de terceiros; **conferir no console do provedor**).

## Fontes (consulta em 2026-10-11)

- Cloudflare KV pricing (free: 100K leituras, 1.000 escritas, 1.000 delete, 1.000 list por dia, reset 00:00 UTC; a operação falha ao estourar): https://developers.cloudflare.com/kv/platform/pricing
- Gemini 2.5 Flash Image (~US$ 0,039/imagem, sem free tier confirmado na API): https://ai.google.dev/gemini-api/docs/pricing · https://pricepertoken.com/image/model/google-gemini-2-5-flash-image
- Groq rate limits citados em `_llm.js:574-579` (console.groq.com/docs/rate-limits, lido pelo autor do código em 11/10/2026; não reverificado aqui).
