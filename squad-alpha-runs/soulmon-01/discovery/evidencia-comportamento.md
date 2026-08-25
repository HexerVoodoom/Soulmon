# Evidência de comportamento — run `soulmon-01` (Fase 0)

> P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.
> P4=B confirmado no código: **não há telemetria de produção coletando.** Nenhuma
> afirmação quantitativa sobre comportamento de usuário aparece neste documento.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Este artefato não afirmou "jogadores reais" em nenhum ponto — já descrevia corretamente
> a telemetria como código morto, sem tráfego, sem população a medir. **Nenhuma correção
> in loco foi necessária.**
>
> **O que a correção de contexto reforça:** mesmo que a telemetria fosse ligada hoje
> (item 1 da lista de prioridade, §5), ela ainda não teria denominador de terceiro para
> medir — Soulmon tem zero usuários além do dono. Isso não muda a recomendação de ligar
> `track()` (é trabalho de infraestrutura, "horas não dias", e prepara o terreno para
> quando houver usuário de terceiro), mas muda o que se pode esperar dela **imediatamente**:
> os primeiros dados que ela produzir vão descrever o comportamento do próprio dono, não de
> uma base de usuários. `D-14`/`D-15` de `DECISOES.md` tratam disso explicitamente.

## 1. O que existe hoje, com arquivo:linha

- **Cliente** `src/utils/telemetry.ts` — módulo completo, testado (`telemetry.test.ts`,
  paridade cliente↔servidor travada), com allowlist de 7 eventos (`install`,
  `onboarding_step`, `demo_pick`, `first_task_done`, `day_active`, `unlock_view`,
  `purchase`), opt-out real, fila com teto, envio por `sendBeacon`/`fetch`. **Está pronto
  e é código morto**: `track()` é exportado em `telemetry.ts:402` e a busca por
  `track(`/`telemetry`/`installTelemetryAutoFlush` no diretório `src/` só retorna
  `telemetry.ts` e `telemetry.test.ts` — nenhum componente (`App.tsx`,
  `CompanionHUD.tsx`, onboarding, `ShopModal`, `UnlockAccountModal`) importa ou chama a
  API. Zero evento sai do aparelho de um usuário real hoje.
- **Servidor** `functions/api/metrics.js` — endpoint `POST /api/metrics` completo e
  testado (`metrics.test.js`), grava agregado diário em `DIGIAPP_SAVES` sob prefixo
  `m:YYYY-MM-DD` (`metrics.js:50,275`). Nunca recebe tráfego porque o cliente nunca chama.
  **Não há dashboard**: nenhum script/rota lê as chaves `m:*` de volta; é gravação sem
  leitura.
- **KV list com prefixo já existe** em `functions/api/community.js:131`
  (`env.DIGIAPP_SAVES.list({ prefix, cursor, limit: 1000 })`) — mecanismo reutilizável
  para varrer `ent:*`, `ord:*`, ou (uma vez ativada) `m:*`.
- **Nenhuma ferramenta de analytics de terceiros** no repo (Firebase Analytics, GA,
  Amplitude) — decisão de propósito documentada em `telemetry.ts:23-26`. Confirma
  contexto §8: "Analytics: `[a definir]`" — de fato, nada, e segue assim após a correção
  de contexto (nenhuma decisão do dono mudou isto).
- **Logs de produção**: `functions/api/chat.js:99` faz `console.log('[chat] entrada
  minimizada', …)` e `:124,151` fazem `console.error` em falha do Groq. São logs de
  Cloudflare Pages Functions (Real-time Logs/dashboard), não instrumentação de produto —
  não são agregáveis nem consultáveis como funil sem acesso ao dashboard do Worker, que
  este run não tem.

## 2. Eventos que faltam por tese (nome, onde emitir, propriedade)

**Conversão demo→pago ≥3%:**
- `demo_pick` já existe no schema mas não é chamado — precisa ser emitido no componente
  de escolha de personagem do fluxo demo (4 telas, `DEMO_PICK`).
- `unlock_view`/`purchase` já existem no schema, não chamados — emitir em
  `UnlockAccountModal.tsx` (abertura do modal) e no callback de compra confirmada pelo
  servidor (`handleUpgradeRevealed`, conforme `CLAUDE.md`).
- Falta um evento **não presente no schema atual**: marcação de qual caminho de entrada
  trouxe o `unlock_view` (nudge por limite de criação vs. nudge na página de Evolução) —
  sem isso não dá para saber qual dos dois gatilhos de upsell converte.

**D30 ≥12%:**
- `day_active` existe e não é chamado — precisa ser emitido na virada do dia
  (`computeDailyReset`, conforme comentário do próprio `telemetry.ts:400`), com `effort`
  = peso do dia.
- `install` existe e não é chamado — precisa ser emitido no boot do app (primeira
  execução no aparelho).
- Retenção D7/D30 e "retorno após ausência ≥2 dias" (métrica-assinatura da tese
  anti-cobrança, §4 do contexto) **não são deriváveis só de `day_active` diário**: exigem
  contagem de dias distintos por pseudônimo no servidor. Hoje `applyAggregate`
  (`metrics.js:198`) só soma contadores agregados por dia — não preserva coorte por
  `id` nem por dia de instalação. **Falta desenho de agregado por coorte** (ex.: chave
  `m:cohort:<dia-instalação>` contando quantos pseudônimos únicos daquela coorte
  emitiram `day_active` em D+7/D+30), o que é uma mudança de schema no servidor, não só
  fiar o cliente.

**Custo de IA por usuário pago ≤R$8:**
- Nenhum evento no schema atual cobre custo de IA. `functions/api/chat.js` não grava
  contagem de chamadas nem tokens usados por `saveId`/tier em lugar nenhum
  (`chat.js:99-124` só loga texto de depuração, sem persistir).
- Falta: evento de servidor (não de cliente — custo de IA não pode depender do cliente
  reportar) gravando por dia `{ai_calls, ai_tokens_in, ai_tokens_out}` agregados, e
  idealmente segmentados por tier (`demo`/`paid`, lido de `_entitlements.js`) porque a
  tese é especificamente sobre usuário **pago**. Sem segmentar por tier, o agregado
  mistura os dois usuários opostos e o número não responde à pergunta do negócio.
  Groq cobra por token; hoje não há nenhum ponto do código que leia o campo de uso da
  resposta da API Groq e grave nada.

## 3. Funil — onde cada um é cego hoje

**Demo (4 telas: intro → objetivo → luta → escolher 1 de 3 → jogar):** cego do início ao
fim. `onboarding_step` cobriria passo a passo se fosse chamado; não é. Não há como saber
hoje em que tela quem abandona o demo abandona.

**Pago (8 telas do ritual do Oráculo):** mesmo evento (`onboarding_step`) serviria, com a
mesma lacuna — nenhuma chamada em nenhuma das 8 telas. Adicionalmente, os dois funis
compartilham o mesmo evento e schema (`step: 0..40`) sem um campo que diferencie "estou
no funil demo" de "estou no funil pago" — hoje **não há como segmentar por qual dos dois
usuários opostos o passo pertence** mesmo se o evento fosse ligado, porque `EVENT_SCHEMA`
(`telemetry.ts:86`) não tem prop de funil/variante. É uma lacuna de schema, não só de
fiação.

## 4. O que já é recuperável hoje sem instrumentação nova

- **KV `DIGIAPP_SAVES` — saves crus**: tecnicamente listável via `.list()` (mecanismo
  já existe em `community.js:131`), mas cada valor é o `GameState` serializado do
  cliente — **não confiável como registro de comportamento** (`save.js:3-8` documenta
  explicitamente que é dado não confiável, exceto os campos sobrepostos pelo servidor).
  Um script pontual de leitura em massa poderia dar uma contagem BRUTA de quantas chaves
  de save existem (proxy grosseiro de "quantos saves já foram criados alguma vez") — e,
  após a correção de contexto, o resultado esperado dessa contagem é pequeno e conhecido:
  o teto superior são 2 contas do DigiApp + o dono no Soulmon, não uma base escondida.
  Mesmo assim não dá funil, não dá D30, não dá conversão — porque não há timestamp de
  criação nem de última atividade gravado no valor do save de forma confiável e auditável
  neste momento (não verificado neste run; exigiria ler o schema de `GameState` campo a
  campo, fora do escopo desta auditoria de instrumentação).
- **`ent:<saveId>`** (`_entitlements.js:16,49`): tem `updatedAt` e `orderDetails` (com
  `orderId`, `grantTier`, `grantCredits`). Isso é **o único registro no repo com dado
  server-side confiável e datado de uma conversão paga já ocorrida** — dá para contar
  quantos `ent:*` têm `tier !== 'demo'`, e quando (`updatedAt`), retroativamente, via
  `.list({prefix: 'ent:'})`. **Não dá para calcular a taxa de conversão** sem também
  saber o denominador (quantos demos existiram no período) — que não está registrado em
  lugar nenhum hoje, e que hoje é, na melhor das hipóteses, "o dono".
- **`ord:<orderId>`** (comprovantes de compra, `_entitlements.js:18`): mesma lógica —
  contável, mas não é funil.
- **`m:*` (agregados de telemetria)**: existe o mecanismo de escrita, mas está vazio —
  nunca recebeu tráfego (§1). Nada a recuperar aqui até o cliente ser ligado.
- **Logs do Cloudflare Worker/Pages Functions**: fora do acesso deste run (exigiria
  dashboard do Cloudflare, que não foi disponibilizado). `console.log`/`console.error`
  existentes (`chat.js:99,124,151`) não são estruturados para virar métrica agregada
  mesmo se acessados — são texto de depuração.
- **Groq**: nenhuma leitura de uso/custo de resposta é persistida em lugar nenhum do
  código auditado. Se o Groq expõe painel de uso próprio por API key, isso é **externo
  ao repositório** e não foi verificado neste run (não temos acesso à conta Groq).

**Resumo da lacuna:** não existe HOJE nenhum retrato utilizável do estado comportamental
da base instalada — e, após a correção de contexto, sabe-se que essa "base" é, no melhor
cenário conhecido, o dono e as 2 contas do DigiApp. O único dado recuperável e confiável é
contagem bruta de conversões pagas já efetivadas (`ent:*`), sem denominador, e o valor
esperado dessa contagem hoje é zero (billing nunca funcionou — ver `problem-framing.md`).

## 5. Custo/esforço de fechar a lacuna, em ordem de prioridade

1. **🔴 Ligar o cliente que já existe** (maior alavanca, menor esforço): chamar
   `track('install')` no boot, `track('day_active', {effort})` na virada do dia,
   `track('onboarding_step', {step})` nas telas do demo E do Oráculo,
   `track('demo_pick')`, `track('unlock_view')`, `track('purchase')` nos pontos já
   identificados no item 3. Estimado em **horas, não dias** — a infraestrutura,
   validação e testes já existem e passam; é só fiação em ~6-8 pontos de UI. **Vale a
   pena ligar mesmo sem população hoje** — é infraestrutura que já vai estar pronta
   quando o primeiro usuário de terceiro chegar.
2. **🟠 Schema: diferenciar funil demo vs. pago** em `onboarding_step` — acrescentar prop
   de variante ao `EVENT_SCHEMA` nos dois arquivos (cliente + servidor) e ao teste de
   paridade. Esforço pequeno, mas é pré-requisito para o item 1 não misturar os dois
   usuários opostos no mesmo agregado.
3. **🟠 Agregado por coorte para D7/D30** — mudança de formato em `applyAggregate`
   (`metrics.js:198`) para reter contagem de pseudônimos únicos por coorte de
   instalação, não só soma diária. Esforço médio: schema novo de chave KV, migração do
   agregado existente (hoje vazio, então sem migração real de dado, só de código) e
   novos testes.
4. **🟡 Custo de IA por tier** — instrumentar `functions/api/chat.js` para gravar
   contagem/tokens por dia segmentado por tier do chamador (exige ler entitlement do
   `saveId` na própria chamada de chat, hoje não lido ali). Esforço médio-alto: é o único
   item que precisa tocar em código de custo real (Groq) e não é coberto por nenhum
   evento do schema atual — desenho novo, não reaproveitamento.
5. **🟡 Dashboard/leitura dos agregados `m:*`** — hoje é escrita sem leitura. Sem isso,
   mesmo com os itens 1-4 prontos, ninguém lê o número. Esforço pequeno a médio: uma
   rota autenticada que devolve os agregados por dia, ou script local que puxa via
   `.list({prefix:'m:'})` (mecanismo já existe).

Todos os itens acima ficam **fora de escopo de execução deste run** (`_briefing.md`,
modo "auditar e priorizar") e são entregues como mapa para o `soulmon-03`.
