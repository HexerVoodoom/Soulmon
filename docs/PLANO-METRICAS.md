# Plano de métricas de uso (09/11/2026)

> **Dono:** operacional/tickets · **Decisões do dono (modal, 09/11/2026):** (1) **agregado, soma no aparelho** — sem série por pessoa; (2) coleta **ligada por padrão, com opt-out** em Configurações; (3) retenção **13 meses**. Regras de fundo vivem em `src/utils/telemetry.ts` e `functions/api/metrics.js` (allowlist, sem SDK de terceiro, falha silenciosa). Este plano **estende** essa telemetria, não cria outra.

## Perguntas que o dono quer responder
1. Quanto tempo cada pessoa passa em cada **tela**, **feature** e **minigame**? (média, mediana, cauda)
2. Que % das tarefas/hábitos planejados é concluída?
3. Onde as primeiras sessões travam? (funil)
4. Depois, com os números, escolher melhorias.

## Como medir tempo sem série por pessoa
O aparelho mede a duração (visível, app em primeiro plano; pausa em segundo plano e após 60 s sem toque), **soma por (tipo, id) no dia do jogador** e, ao fechar o dia (ou na próxima abertura), manda **UM evento `time_spent` por par**, com a **faixa** do total do dia, nunca segundos nem hora. O servidor só soma em histogramas diários. Isso dá média, mediana e cauda **por pessoa-dia** sem nenhum ID no servidor (o `id` do lote continua sendo descartado antes de qualquer escrita).

| Evento novo | Props (inteiros em faixa) | Agregado diário (chaves na KV `m:<dia>`) |
|---|---|---|
| `time_spent` | `kind` 0 tela · 1 feature · 2 minigame; `item` índice do registro de nomes; `band` 0..11 (log: <5 s, <10, <20, <30, <60, <2 min, <3, <5, <10, <20, <40, 40 min+) | `time.<kind>.<nome>.users`, `.band_<n>`, `.sec_est` (soma pelo ponto médio da faixa) |
| `minigame_start` / `minigame_end` | `item`; `outcome` 0 vitória · 1 derrota · 2 saiu; `band` da partida | `minigame.<nome>.start`, `.end_<outcome>`, `.band_<n>` |
| `task_done` / `task_skipped` | `kind` 0 tarefa · 1 hábito | `task_done.<kind>`, `task_skipped.<kind>` (adiou/deixou pra lá/dia perdido) |
| `day_close` | `planned` 0..50, `done` 0..50 (peso, mesmo do `day_active`) | `tasks_planned_sum`, `tasks_done_sum`, `completion_bucket_<0..10>` (por pessoa-dia, de 10 em 10 %) |
| `session_end` | `band` da duração da sessão; `build` (inteiro, versão do app) | `session.band_<n>`, `session.build_<n>` |

Nomes de tela/feature/jogo vêm de **registros fixos** (`TELEMETRY_SCREENS` etc.) em cliente e servidor, com teste de paridade — nome fora do registro derruba o evento (allowlist, como hoje). Nunca vai nome de tarefa, texto, e-mail ou `saveId`.

## O que este desenho NÃO responde (e a alternativa recusada)
Funil por pessoa, retenção por coorte e "quem usa X também usa Y" exigem série por ID; o dono escolheu **não** ter isso agora. O funil das primeiras sessões sai **por passo, agregado** (`onboarding_step`, `first_task_done`, `retained` já existem). Gatilho para rever: a amostra passar de ~500 pessoas ativas e a pergunta não se responder agregada → reabrir com consentimento explícito e nova versão da política.

## Privacidade e LGPD / Data Safety
- Sem PII: sem e-mail, `saveId`, conteúdo, IP guardado (o IP só entra no limite de taxa e não é gravado), sem timestamp preciso. Só contadores e faixas.
- **Texto da política** (§ telemetria, PT e EN) ganha a linha "tempo de uso por tela/recurso/jogo, em faixas, somado entre todos"; entra com a fatia do servidor. Por não criar dado por pessoa nem tipo novo de dado pessoal, **não** é mudança material: sem bump de `PRIVACY_VERSION` obrigatório (decisão de bump fica registrada no PR; o dono pode vetar).
- Data Safety (Play): continua "Atividade no app / interações no app", coletado, **não** ligado à identidade, finalidade análise. Conferir a declaração atual antes de publicar.
- **Opt-out** já existe (`setTelemetryEnabled(false)` apaga a fila); os novos eventos passam pela mesma porta, e o acumulador de tempo também zera.

## Retenção e custo
- Agregados diários na KV existente (prefixo `m:`), **TTL ≈ 13 meses** (hoje 730 dias: encurtar). Sem D1 novo, sem Analytics Engine, sem serviço pago. Estimativa: ~40 pares (tela/feature/jogo) × 14 chaves por dia ≈ 600 contadores/dia, bem abaixo do teto de valor da KV.
- Lote: ≤ 100 eventos/16 KB, rate limit já existente; `time_spent` sai no máximo 1×/par/dia.

## Fatias (um PR cada, CI verde antes de mesclar)
1. Este plano.
2. Cliente: `trackTime` (acumulador, pausa em segundo plano, fila offline) + instrumentar telas, features, minigames e ciclo de tarefas.
3. Servidor: schema/paridade dos eventos novos em `/api/metrics`, agregação, TTL, texto da política.
4. Relatório do dono: leitor (`tools/metricsReport.mjs`) + rota/página protegida por `ADMIN_EMAILS` (sem tocar em `run_worker_first`/assets do `wrangler.jsonc`).
