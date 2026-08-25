# Métrica-norte — run `soulmon-01` (fecha o FAIL da Fase 0, D-15)

> Nenhuma afirmação quantitativa neste documento descreve comportamento observado.
> Não há população de terceiro (`DECISOES.md` — correção de contexto). Todo alvo é
> **normativo** (derivado do desenho do jogo), nunca estatístico. Proposta para
> aprovação do dono, não decisão fechada.

## 1. Definição de "usuário ativo"

North star: *"peso de esforço real concluído por usuário ativo por semana"*
(`PLANO-PRODUTO.md:77`).

**Candidatas consideradas:**

| Candidata | Computável hoje? | Consequência |
|---|---|---|
| A. Abriu o app na semana | **Não.** Não há evento de abertura persistido no servidor — `install`/`day_active` existem no schema (`telemetry.ts`) mas nunca são chamados (`evidencia-comportamento.md` §1). Só existiria via log do cliente, que está morto. | Descartada por falta de dado, não por mérito. |
| B. Concluiu ≥1 item real (tarefa ou hábito) na semana | **Sim.** `completedTasks` (tarefas) e `activityLog` (recorrências), ambos sincronizados para o KV (`GameStateContext.tsx:149,274-280,724`); `effortDone`/`weeklyReport` já os agregam em `rituals.ts`. | Mais simples e já parcialmente computado. **Risco de circularidade**: denominador exige ≥1 conclusão, então "esforço por ativo" tem piso automático (o menor `effort` possível) — o número nunca pode ser artificialmente baixo, o que dilui parte do sinal de abandono parcial. |
| C. Concluiu em ≥N dos 7 dias (ritmo, não volume) | **Sim, mesmo campo-fonte.** `carePattern.ts` já lê `completedTasks`+`activityLog` (teto 90) para classificar ritmo; a métrica de suporte já rascunhada em `PLANO-PRODUTO.md:81` ("≥1 conclusão real em ≥4 dos 7 dias") é essa candidata. | Mede constância, não só existência — mais alinhado à tese anti-cobrança de que valor é hábito, não pico. Mas com ~20 usuários, qualquer corte por dia da semana tem ruído dominante sobre sinal. |

**Recomendação: B agora, migrar para C quando a base crescer.**
Com população de dezena(s), um corte de dias-da-semana (C) não tem amostra para
ser estável — vira ruído com aparência de métrica. B é a definição mais simples
que já é 100% computável dos campos existentes e não exige nenhuma instrumentação
nova. Reavaliar para C junto do gatilho descrito na seção 5.

**Definição proposta:** usuário ativo na semana = teve ≥1 entrada em
`completedTasks` com `completedAt` na janela **ou** ≥1 entrada correspondente em
`activityLog` na janela. Fonte: `GameStateContext.tsx` (persistência) +
`rituals.ts` (`weeklyReport`, que já teria a soma de `effortDone` pronta).

## 2. Alvo v1 da north star `[alvo normativo, não medido]`

Sem dado, o alvo vem do que o jogo **precisa** para evolução saudável, não de
benchmark. A escada de estágio (`FORM_REQUIREMENTS`) já define quanto esforço
diário sustenta progresso sem estagnar nem sobrecarregar (`OVERCOMMIT_EFFORT = 7`
é o teto de aviso). Regra do dia perfeito exige `peso feito ≥ dailyGoalFor`.

Alvo proposto: **usuário ativo médio atinge o próprio `dailyGoalFor` em pelo
menos 4 dos 7 dias da semana** — mesmo corte que `PLANO-PRODUTO.md:81` já
rascunhou e nunca preencheu. Não é um número de peso absoluto (a escala de
esforço varia por composição de tarefas de cada pessoa), é uma fração de dias
com meta cumprida — a mesma unidade que `habitRhythm.ts` já usa para constância
("N das últimas 7"). `[alvo normativo, não medido]`.

## 3. Guardrails

- **HP médio da base não deve tender a 0** ao longo do tempo — sinal de que a
  penalidade estrutural está superando o cuidado, não a evolução.
- **Retenção não pode cair quando a north star sobe** — otimizar volume de
  esforço sem reter é fabricar burnout, não engajamento saudável.
- **Guardrail anti-cobrança (obrigatório, essência não-negociável):** proporção
  de usuários com "tarefa assombrada" (`isHaunted`, `HAUNTED_AFTER_DAYS`) presente
  por ≥2 semanas seguidas não deve subir junto com a north star. Se a pilha de
  culpa cresce enquanto o esforço "sobe", o produto virou cobrador com um
  disfarce de métrica — exatamente o modo de falha nomeado em `PLANO-PRODUTO.md:69-71`.
- **Guardrail qualitativo (única fonte possível com ~20 usuários):** nenhuma
  conversa registrada com queixa de culpa/pressão associada ao app. Um relato
  desse tipo invalida qualquer leitura positiva da north star, mesmo sem número.

## 4. Métricas que NÃO devem existir

Proibidas por escrito, porque medi-las é o caminho mais curto para virar cobrador
(`PLANO-PRODUTO.md:69-71`):

- Streak visível ao usuário que zera com falha (já vetado no motor de tarefas;
  vetar também no nível de analytics/dashboard).
- Score de sono ou qualquer número derivado da Janela de Descanso exibido como
  desempenho (já vetado em `restWindow.ts`; não recriar em painel externo).
- Ranking absoluto de esforço entre usuários (comparação social é o vetor de
  cobrança que o Torneio já evita via faixas, não posição).
- "Dias desde a última conclusão" exibido como contador de vergonha — o produto
  já resolve isso com perdão (`ABSENCE_FORGIVENESS_DAYS`); uma métrica interna
  que reintroduz a contagem visível reabriria o problema por outra porta.
- Qualquer métrica que combine humor (`mood.ts`) a pontuação — check-in de humor
  é declarado como nunca alimentando pontuação; um dashboard interno que cruze
  humor com "produtividade" viola a mesma regra por trás.

## 5. Plano mínimo de leitura para os primeiros ~20 usuários

**O que dá para saber sem SDK, com `ent:*` + conversa:**
- Contagem de conversões pagas e quando ocorreram (`ent:<saveId>.updatedAt`,
  `tier !== 'demo'`), via `.list({prefix:'ent:'})` (mecanismo já existe em
  `community.js:131`).
- Tudo o mais — abertura, retenção, sensação de culpa, ritmo semanal — via
  conversa direta com cada um dos ~20, porque o dono consegue falar com todos
  individualmente. Isso cobre exatamente o que o gate apontou como instrumento
  certo para "uma sala quase vazia": `ent:*` para o fato financeiro, conversa
  para tudo comportamental.

**Gatilho concreto de transição para telemetria (`soulmon-04`):** quando o
número de usuários simultâneos ultrapassar o que o dono consegue acompanhar
individualmente por conversa **ou** quando uma decisão de preço/investimento
precisar de confiança estatística que uma amostra conversável não sustenta —
o que vier primeiro. Abaixo desse ponto, instrumentar é medir o termômetro de
uma sala vazia (`gate.md`); acima dele, conversa deixa de escalar e a lacuna
descrita em `evidencia-comportamento.md` §5 (ligar o cliente já pronto, ~horas
de esforço) passa a valer a pena.
