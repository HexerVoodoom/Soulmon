# Alpha Insights — o que o Soulmon CONSEGUE medir hoje (21/09/2026)

Escopo: só leitura. Fontes lidas — `.claude/agents/soulmon-guarda-medicao.md`,
`docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.12, `docs/PLAY-DATA-SAFETY.md`,
`functions/api/metrics.js` (+ `functions/api/costCeiling.test.js`,
`functions/api/_aiGuard.js`), `src/utils/telemetry.ts`,
`docs/PLANO-PRODUTO.md`, `docs/REGISTRO-DE-DECISOES.md` §5.8,
`docs/plano-melhorias/E-telemetria.md`, `docs/STATUS.md` §5,
`public/privacidade.html`.

---

## 1. Métrica-norte

`docs/PLANO-PRODUTO.md` (Parte 2 e Parte 5) declara a métrica-norte como **"peso
de esforço real concluído por usuário ativo por semana"**. O código a formaliza
em `src/utils/telemetry.ts` §"A MÉTRICA-NORTE" como duas metades: **weekly_active**
(concluiu ≥1 item real na semana) e **on_target** (bateu o próprio
`dailyGoalFor` em ≥`NORTH_STAR_GOAL_DAYS` = 4 dos 7 dias), lida no servidor por
`functions/api/metrics.js` → `summarizeNorthStar` (símbolo).

**Instrumentada de ponta a ponta?** Sim, as quatro camadas existem:
- **Cliente** — `src/utils/telemetry.ts` fecha a semana no APARELHO
  (`WeekLedger`/`trackDayClosed`, citados no cabeçalho "A MÉTRICA-NORTE") e
  despacha só o resultado (`week_active`, dois inteiros 0–7) via `track`.
- **Rota** — `functions/api/metrics.js` `onRequest` (POST) valida por
  `sanitizeBatch`/`sanitizeRecord` contra `EVENT_SCHEMA.week_active`.
- **Agregação** — `applyAggregate` grava `week_active.goal_days.<n>` (e por
  `tier`) na chave diária `m:<dia>` do KV.
- **Leitura** — `onRequestGet` em `functions/api/metrics.js` soma o intervalo
  (`mergeTotals`) e chama `summarizeNorthStar`.

**A leitura é fail-closed sem `METRICS_ADMIN_KEY`?** Confirmado — `onRequestGet`:
`if (!env?.METRICS_ADMIN_KEY) return Response.json({ error: 'Not found' },
{ status: 404, ... })`. É 404, não 401, de propósito (não confirmar que a rota
existe). `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.12 e
`docs/REGISTRO-DE-DECISOES.md` §5.8 (linha da tabela "sem telemetria") dizem a
mesma coisa com as mesmas palavras: **"instrumentado e agregado, e ninguém
consegue ler nada até o segredo existir"**. `docs/plano-melhorias/E-telemetria.md`
recomendação 4 pede para conferir se `METRICS_ADMIN_KEY` está no Pages — não há
evidência nos documentos lidos de que ela tenha sido setada. **Logo: hoje
ninguém lê o agregado — confirmado, com três fontes independentes concordando.**
A instrumentação de escrita está pronta e correndo; só falta a chave.

---

## 2. Catálogo de eventos

`grep -c '  [a-z_]*:' functions/api/metrics.js` (bloco `EVENT_SCHEMA`) e o
mesmo em `src/utils/telemetry.ts` — **26 eventos** nos dois lados (paridade
travada por teste, citado no cabeçalho de ambos os arquivos). Tabela — nome ·
onde dispara (App.tsx/SoulmonOnboarding.tsx, por `docs/plano-melhorias/E-telemetria.md`
linha "Call sites") · payload (schema `EVENT_SCHEMA`) · PII:

| Evento | Dispara em (call site, símbolo) | Payload | PII? |
|---|---|---|---|
| `install` | `App.tsx` (símbolo `installTelemetryAutoFlush`) | nenhum | Não |
| `onboarding_step` | `SoulmonOnboarding.tsx` | `step` (0–45, código via `onboardingStepCode`), `funnel` (0–2) | Não |
| `demo_pick` | `SoulmonOnboarding.tsx` | nenhum | Não |
| `first_task_done` | `App.tsx` | `tier` (0–2) | Não |
| `day_active` | `App.tsx` (`trackDayClosed`) | `effort` (0–500), `tier` | Não |
| `unlock_view` | `App.tsx` | `reason` (0–4), `tier` | Não |
| `purchase` | `App.tsx`, `SoulmonOnboarding.tsx` | `tier`, `reason` (0–4) | Não |
| `demo_cap_hit` | `App.tsx` | `path` (0–4) | Não |
| `activity_create` | `App.tsx` | `kind` (0–1), `path` (0–4), `tier` | Não |
| `week_active` | `src/utils/telemetry.ts` (`trackDayClosed`/`WeekLedger`) | `active_days` (1–7), `goal_days` (0–7), `tier` | Não |
| `reveal_seen` | onboarding (reveal) | `has_sprite` (0–1), `funnel`, `duration` (0–3) | Não |
| `checkin_commit` | check-in | `focus_count` (0–3) | Não |
| `unlock_dismiss` | tela de compra | `reason` (0–4) | Não |
| `haunted_done` | conclusão de tarefa assombrada | nenhum | Não |
| `checkin_shown` | oferta do ritual diário | nenhum | Não |
| `milestone` | motor de hábitos | `level` (1–3) | Não |
| `shield_used` | escudo de descanso | nenhum | Não |
| `welcome_back` | retorno após ausência | `days` (faixa 0–3) | Não |
| `evolve` | cerimônia de evolução | `level` (1–4) | Não |
| `dungeon_run` | fim de run da masmorra | `floors` (1–5) | Não |
| `bond_level` | subida de nível de Vínculo | `level` (1–30) | Não |
| `after_bad_day` | retorno após dia ruim | `gap` (faixa 0–3), `kind` (0–1) | Não |
| `app_open` | abertura do app | `source` (0–3) | Não |
| `push_optout` | desligou push | nenhum | Não |
| `retained` | `trackRetentionOnOpen` | `bucket` (0–2), `tier` | Não |
| `sound_state` | fechamento diário (som-01) | `muted` (0–1), `music` (0–1) | Não |
| `sound_off` | transição ligado→mudo | `age` (faixa 0–2) | Não |

Nenhum evento carrega texto livre, nome, e-mail, id de dispositivo, timestamp
de precisão alta ou `saveId` — todos os campos são inteiro/enum em faixa
fechada, e a allowlist (`EVENT_SCHEMA`) rejeita o registro inteiro se aparecer
qualquer chave fora do schema.

**Comparação com `docs/PLAY-DATA-SAFETY.md`:** o documento (§2.5) cita
`functions/api/metrics.js` como a rota de "Interações no app" e declara
"agregadas e pseudonimizadas… a lista completa dos eventos está na seção 4 da
política, e há teste conferindo essa lista contra o código" — bate: **26**
eventos na tabela de `public/privacidade.html` §4 (linhas de `install` a
`sound_off`, mais a nota de `tier`) contra **26** chaves em `EVENT_SCHEMA` nos
dois arquivos. `docs/plano-melhorias/E-telemetria.md` (linha 21) registrava um
BUG antigo ("`:111` diz 'sete eventos'; são dez") que hoje está **corrigido**:
o texto atual da política (`public/privacidade.html` linha 193) não numera mais
("são exatamente estes eventos"), evitando o apodrecimento do número por
redação. Não há divergência viva encontrada entre política e código nesta
auditoria.

---

## 3. Guardrails

**Existe:**
- **Custo de IA** — `functions/api/_aiGuard.js` (`guardAiRequest`, `AI_LIMITS`).
  Três travas: cota diária por conta (`perAccount`), teto vitalício por conta
  e por forma (`perAccountLifetime`/`perFormLifetime`, só `sprite`), e teto
  global — diário para texto, **mensal** para imagem (`globalMonth: 800` ≈
  orçamento pré-pago de R$ 81/mês, citado no cabeçalho do arquivo). Fail-closed:
  contador ilegível recusa (503, `ai-quota-unavailable`). Não há um arquivo
  chamado `costCeiling.test.js` cobrindo IA — o `functions/api/costCeiling.test.js`
  encontrado testa outro guardrail de custo (chamadas/leituras de KV em
  `community.js`/`subscribe.js` — "O-8 do investor-skeptic", símbolos `fakeKV`,
  `counts.get/put/list`), não `_aiGuard`. O guardrail de custo de IA em si é
  testado por `functions/api/generate-sprite.cap.test.js`,
  `functions/api/_aiGuard.spriteCap.test.js` e `functions/api/_aiGuard.test.js`
  (achados via grep, não lidos linha a linha nesta auditoria).
- **Custo de leitura/escrita em KV** — `functions/api/costCeiling.test.js`
  (símbolos `fakeKV`, contagem de `get`/`put`/`list`).

**Falta** (nenhum evento/rota encontrado nos arquivos lidos cobrindo):
- **Erros do cliente / crash** — `docs/PLAY-DATA-SAFETY.md` §2.7 confirma
  explicitamente: "Registros de erro / diagnóstico — ❌ Não. Não há Crashlytics,
  Sentry ou similar."
- **Tempo de carregamento** — nenhum evento de performance em `EVENT_SCHEMA`.
- **Falha de save/sync** — `cloudSaveComRetry` (citado em
  `docs/plano-melhorias/E-telemetria.md` §"Cloud save") tem retry com teto e
  backoff, mas não emite telemetria de falha — não há evento tipo
  `save_failed` no schema.
- **Push entregue vs. aberto** — existe `app_open.source` (distingue abertura
  via push), que é o CONSUMO do push, mas não há confirmação de ENTREGA do
  lado do FCM/Web Push (sem evento de "recebido pelo sistema").

O padrão do domínio (mandato `soulmon-guarda-medicao.md`) é: guardrail nomeado
com limite numérico. Custo de IA cumpre isso plenamente (números explícitos em
`AI_LIMITS`); os quatro guardrails de produto/operação acima não têm limite
numérico nenhum porque **não existe evento**.

---

## 4. Baseline

**Não existe baseline registrado.** Nenhum documento lido cita um valor
numérico de métrica-norte, retenção ou funil medido em produção — coerente com
o aviso do `CLAUDE.md`: **"NINGUÉM NUNCA USOU O APP EM PRODUÇÃO"** (informado
pelo dono, 07/09/2026). Sem usuário, não há baseline possível — é o estado
honesto, não uma lacuna de disciplina.

### Plano mínimo de monitoramento pós-lançamento — PRIMEIRO usuário

5 métricas, onde cada uma já está ou falta, e o que instrumentar ANTES de publicar:

1. **Métrica-norte (`week_active`: weekly_active, on_target)** — JÁ ESTÁ:
   cliente fecha a semana (`WeekLedger`), servidor agrega e
   `summarizeNorthStar` lê. **Falta só**: `METRICS_ADMIN_KEY` no Pages (hoje
   404) e alguém rodar `tools/metrics-read.mjs`/`tools/metricsReport.mjs`
   (citados em `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.12) manualmente nas
   primeiras semanas — não há painel automático.
2. **Funil de onboarding (`onboarding_step` por `funnel`)** — JÁ ESTÁ, e é o
   evento que `src/utils/telemetry.ts` cita como motivo de existir ("três
   auditorias erraram a contagem de telas"). Ler via a mesma rota GET.
3. **Retenção D1/D7/D30 (`retained`)** — JÁ ESTÁ como evento, mas o agregado
   diário (`m:<dia>`) **não tem coorte de instalação** — `metrics.js` declara
   isso por desenho no cabeçalho ("O QUE ESTE AGREGADO NÃO CONSEGUE
   RESPONDER") e a resposta do GET devolve `notes.unreadable: ['retencao',
   'D7', 'conversao em N dias', ...]`. Para o primeiro usuário isso é
   suficiente (um indivíduo não precisa de coorte agregada — dá para inferir
   pela sequência de `retained.bucket` no tempo), mas **não escala** e é
   decisão pendente do dono reabrir (citado três vezes: cabeçalho de
   `metrics.js`, `docs/plano-melhorias/E-telemetria.md` recomendação 3).
4. **Falha de save/sync** — FALTA. Antes de publicar: instrumentar um evento
   mínimo (ex. `save_failed` com `reason` em enum fechado) em
   `cloudSaveComRetry`/`src/utils/cloudSave.ts`, senão o primeiro usuário pode
   perder progresso sem que ninguém saiba. É a lacuna mais barata de fechar
   (o retry já existe, só falta emitir o sinal).
5. **Erro/crash do cliente** — FALTA por decisão explícita (sem SDK de
   terceiro, `docs/PLAY-DATA-SAFETY.md` confirma "não há Crashlytics/Sentry").
   Para o primeiro usuário, a alternativa mínima sem violar o princípio "sem
   SDK de terceiro" é um canal manual (o dono acompanhando o console do
   próprio aparelho) — não há instrumentação de produto para isso hoje, e
   criar uma é decisão de escopo que este relatório não toma.

**Sem os itens 4–5 minimamente cobertos (ao menos o 4), o lançamento não
ensina o que aconteceu quando o app falha — só o que aconteceu quando funciona.**

---

## 5. Retrospectiva do método — `docs/STATUS.md` §5

A seção (símbolo "## 5. O achado estrutural do loop de QA") descreve 5
defeitos, todos por **fronteira sem dono**: checkbox JSX↔CSS, overlay
cliente↔handler HTTP, `save.js`↔medidor de cobertura, asset↔renderer, download↔
árvore de assets. A lição virou prática? **Parcialmente, e de forma indireta.**

`find . -name "*.contract.test.*" | wc -l` (via Glob) → **37 arquivos**
`*.contract.test.*` no repo. Nenhum se chama algo como `fronteira.*` ou cobre
as 5 fronteiras citadas *nominalmente* como teste de contrato entre dois
sistemas no sentido HTTP/API descrito no §5. O que a seção realmente lista como
o "que passou a existir" NÃO é `*.contract.test.*` — são quatro instrumentos
específicos, citados por nome no próprio §5:
- `src/test/renderEnv.tsx` (+ `renderEnv.selfcheck.test.tsx`) — fronteira
  JSX↔CSS pré-compilado.
- `src/index.css.contract.test.ts` — **este sim é um `.contract.test.ts`** e
  cobre exatamente a fronteira "classe usada no JSX que não existe no CSS".
- `src/assets/assets.contract.test.ts` — **também é `.contract.test.ts`** e
  cobre a fronteira asset↔renderer (xadrez assado, arquivo não decodificável).
- `desktop/renderer/src/pushCareAction.test.ts` — "o modelo a replicar":
  cliente ligado no `onRequest` real. **Não tem sufixo `.contract.test.*`**,
  apesar de ser o exemplo mais próximo da fronteira "cliente desktop ↔ handler
  HTTP" citada no §5.

Ou seja: **2 das 5 fronteiras do §5 têm regra formalizada como
`.contract.test.ts`** (CSS↔JSX, asset↔renderer). A fronteira **cliente↔HTTP**
tem um precedente (`pushCareAction.test.ts`) mas sob outro nome de arquivo — a
convenção `.contract.test.*` não foi adotada uniformemente para ela. As
fronteiras **código↔medidor de cobertura** (o achado de `save.js` sem teste
nenhum) e **download↔árvore de assets** (PNG salvo como HTML) não têm
equivalente formal identificável nos 37 arquivos listados — não há um teste
que, por desenho, "prove que a suíte vê" essas duas classes de defeito (a régua
que o próprio §5 pede: "todo guard novo precisa de casos de autoverificação").

Os 37 `.contract.test.*` existentes cobrem majoritariamente **outras**
fronteiras que o projeto foi abrindo depois (nomes, som, i18n, deploy, ícones,
docs, narrativa) — o padrão "contrato entre fronteiras" se espalhou como
prática geral do repositório, mas a auditoria não achou evidência de que as 5
fronteiras ESPECÍFICAS do §5 estejam todas cobertas por essa convenção
nomeada — 2 de 5 diretamente, 1 de 5 por precedente sem o sufixo, 2 de 5 sem
cobertura identificada.

---

## Resumo (10 linhas)

1. Métrica-norte = "peso de esforço/usuário ativo/semana" (`docs/PLANO-PRODUTO.md`), formalizada em `week_active`/`summarizeNorthStar` (`functions/api/metrics.js`).
2. Instrumentação ponta a ponta EXISTE (cliente→rota→KV→leitura); confirmado: GET é fail-closed 404 sem `METRICS_ADMIN_KEY` — hoje ninguém lê nada, 3 fontes concordam.
3. Catálogo: 26 eventos, paridade cliente/servidor travada por teste; nenhum campo de texto livre, nenhuma PII; bate com `public/privacidade.html` §4 (26/26).
4. Guardrail de custo de IA é forte e nomeado (`_aiGuard.js`, `AI_LIMITS`, fail-closed); guardrail de custo de KV existe em `costCeiling.test.js` (não é sobre IA, como o nome sugeriria).
5. Faltam guardrails de erro/crash (confirmado ausente por `PLAY-DATA-SAFETY.md`), tempo de carga, falha de save/sync e entrega de push (só consumo via `app_open.source`).
6. Não existe baseline — coerente com "ninguém usou o app em produção" (`CLAUDE.md`).
7. Plano mínimo pós-lançamento: métrica-norte e onboarding já prontos (falta a chave); retenção existe mas sem coorte agregada; save-failure e crash são as duas lacunas reais a fechar antes de publicar.
8. `docs/STATUS.md` §5 lista 5 fronteiras sem dono como achado estrutural do QA.
9. 37 arquivos `*.contract.test.*` no repo; só 2 das 5 fronteiras do §5 (CSS↔JSX, asset↔renderer) têm regra formal nesse formato; cliente↔HTTP tem precedente sem o sufixo; cobertura↔código e download↔assets não têm equivalente identificado.
10. Conclusão: instrumentação de produto é honesta e disciplinada (allowlist, PII zero, fail-closed); o gargalo real está em ligar a leitura e fechar as 2 fronteiras de QA ainda descobertas — nenhuma exige reescrever nada, só decisão do dono (chave) e trabalho incremental (guardrails/testes).
