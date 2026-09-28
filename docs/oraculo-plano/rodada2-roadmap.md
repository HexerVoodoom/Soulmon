# Roadmap executável — Oráculo, Fases 0–3 (rodada 2)

Fonte: `docs/PLANO-ORACULO.md` (decisões do dono 28/09/2026 — NÃO reabertas),
`docs/ORACULO.md`, `docs/REGISTRO-DE-DECISOES.md` §5.3, `CLAUDE.md` §Oráculo,
`plano-arquitetura.md`, `plano-goal.md`, `plano-comportamento.md`.

Convenção de tamanho: **P** = 1 sessão curta, 1 PR, portões locais.
**M** = ½–1 sessão, pode tocar 2–3 arquivos + teste novo.
**G** = não deveria existir aqui — se aparecer, é sinal de que o item não está
fatiado o bastante para fechar com tsc/vitest/build + commit + PR + merge.
Todo item abaixo foi cortado para caber em P ou M; onde o plano original
descrevia algo maior, a fatia está anotada.

---

## Fase 0 — Régua única

Objetivo declarado no plano: nenhuma prioridade decidida sobre número velho;
relatório permanente de C1–C8; resolver a contradição "medir primeiro".

| # | Item | Aceite testável | Tamanho | Depende de | Não-objetivo |
|---|---|---|---|---|---|
| 0.1 | Promover `_diag.test.ts` (nome exato a confirmar no repo) para relatório permanente que imprime C1–C8 em execução própria (`npm run oraculo:auditoria` ou teste marcado lento) | Rodar o comando localmente produz as 8 linhas C1–C8 com número e alvo lado a lado; `npx vitest run` continua verde; se marcado "lento", não roda no CI padrão (checar `vitest.config` para confirmar que não quebra o tempo de CI) | M | nenhum | Não decide meta nova — só re-expõe C1–C8 já definidos em `PLANO-ORACULO.md` §1 |
| 0.2 | Remedir o **papel** (C2, hoje "não remedido") com N=800, seed fora da calibração, e registrar o número na tabela do §1 | Saída do relatório de 0.1 mostra razão topo/piso do eixo papel com valor numérico (não "a remedir"); commit inclui a leitura bruta (JSON ou tabela) que gerou o número | P | 0.1 | Não corrige o desequilíbrio de papel — só mede (correção é Fase 1) |
| 0.3 | Corrigir `docs/ORACULO.md` §"Equilíbrio medido" — a tabela de reino "0,5–22,5%" é anterior à PR #135 e contradiz a medição atual (1,16×, `PLANO-ORACULO.md` §6) | Diff mostra a tabela velha substituída pelos números remedidos de 0.1/0.2, com data e N da simulação; `alpha-skeptic` (ou revisão equivalente) confirma que a tabela nova bate com o relatório de 0.1 | P | 0.1, 0.2 | Não reabre a decisão de metas do §1 (já aceitas pelo dono) — só corrige o número histórico |
| 0.4 | Decidir e registrar por escrito (em `PLANO-ORACULO.md` ou `STATUS.md`) o critério de PARADA de instrumentação da Fase 0 — o que cabe em C1–C8 e o que fica para quando houver usuários | Trecho novo no doc lista explicitamente o que NÃO será medido nesta fase (ex.: percepção humana, retenção) e por quê, citando `plano-goal.md` §5 "onde só dado real resolve" | P | nenhum | Não é pesquisa com painel — é só a linha de corte escrita |

Ordem dentro da fase: 0.1 → 0.2 → 0.3 (0.3 depende do número de 0.2) → 0.4 (pode ser paralelo a 0.1–0.3).

**Faltando no plano (Fase 0):**
- 0.1 não tem dono nomeado nem localização de arquivo confirmada — `PLANO-ORACULO.md` diz "`scripts/oraculo-auditoria` ou teste marcado lento" como alternativa, não como decisão. Antes de abrir a story, alguém precisa escolher UM dos dois formatos (afeta se roda no CI).
- Nenhum item de Fase 0 diz **quem** aprova a remedição de papel/reino como "correta" antes de virar baseline nova — risco: remedir errado uma segunda vez e a Fase 1 herdar o erro. Sugestão: gate do `alpha-skeptic` no item 0.3, já citado no aceite acima.

---

## Fase 1 — Fechar as dívidas medidas (motor)

Depende de Fase 0 fechada (precisa da baseline remedida para saber o que ainda
está fora do alvo).

| # | Item | Aceite testável | Tamanho | Depende de | Não-objetivo |
|---|---|---|---|---|---|
| 1.1 | Se papel estiver fora de C2 (razão >1,5×) após 0.2: recalibrar `JUNG_DAMPING`/pesos de papel em `axes.ts` contra simulação que sorteia RESPOSTAS, não traços (H1 de `plano-goal.md`) | `criacaoDistribuicao.test.ts` (ou o relatório de 0.1) mostra razão topo/piso do eixo papel ≤1,5×; `npx vitest run` verde; comentário no código cita a assimetria corrigida, seguindo o padrão já existente em `axes.ts` | M | 0.2 | Não mexe em reino, alinhamento nem elemento nesta story |
| 1.2 | Decidir, por classe, as 2 classes que nunca aparecem (C1: hoje 77/79): ápice raro por design (documentar) ou inalcançável (consertar) | Para cada uma das 2 classes: ou (a) linha nova em `PLANO-ORACULO.md`/`ORACULO.md` documentando "ápice raro, aceito" com a razão, ou (b) commit de correção + relatório de 0.1 mostrando 78 ou 79/79 | P por classe (2 stories, não 1 — decisões podem divergir) | 0.1 | Não implica mexer nas outras 77 classes |
| 1.3 | Decidir, por criatura, as 6 criaturas que nunca são sorteadas (C1: hoje 188/194) | Mesmo padrão de 1.2, aplicado às 6 criaturas — pode ser 1 story por criatura ou 1 story agrupando as que tiverem a mesma causa raiz (ex.: mesmo grupo de pool) | P–M (depende de quantas causas raiz distintas existirem) | 0.1 | Não mexe no pool inteiro — só nas 6 identificadas |
| 1.4 | Testar cobertura de SAÍDA da ponte 8→17 (objeção do crítico, §6/§7 do `PLANO-ORACULO.md`): hoje só se testa que cada um dos 8 elementos gera algum resultado nos 17; falta testar que os 17 são alcançáveis a partir dos 8 | Teste novo (`derivedElements`/ponte) falha se algum dos 17 elementos base do class-system for inatingível a partir de qualquer um dos 8 `ElementId`; roda hoje e PASSA sobre o estado atual, ou expõe o gap se houver | M | nenhum (independe de 1.1–1.3) | Não funde os dois vocabulários (8 vs 17) — decisão já tomada em `plano-arquitetura.md` §7: "não propõe fundir" |

Ordem dentro da fase: 1.4 pode rodar em paralelo com 1.1–1.3 (não compartilha arquivo). 1.1 antes de 1.2/1.3 só se a squad quiser fechar o eixo mais crítico primeiro — não há dependência técnica real entre eles.

**Faltando no plano (Fase 1):**
- **Dono não nomeado** para a decisão "ápice raro vs. inalcançável" de 1.2/1.3 — é uma decisão de produto (rara por design = aceitar menos cobertura estrutural), mas o `PLANO-ORACULO.md` não diz se é o dono do produto (`alpha-pm`/dono humano) ou uma call técnica da squad. Marcar como pendência a levar ao dono antes de abrir 1.2/1.3.
- **Critério de aceite vago em 1.2/1.3**: "decidir" não é testável por si — o aceite que proponho acima (documentar OU corrigir) é uma interpretação minha porque o plano original não especifica o formato do registro dessa decisão.
- Risco sem mitigação explícita: 1.1 mexe em `axes.ts`, que é código com risco documentado ("mexer num coeficiente sem refazer a simulação reabre o buraco que ele fechou" — `ORACULO.md`). O item já herda essa régua por estar dentro do mesmo arquivo, mas nenhuma story cita explicitamente "rodar C1–C8 completo depois, não só C2" — adicionar isso ao aceite de 1.1 antes de abrir a story.

---

## Fase 2 — Arquitetura (extração, 6 passos já sequenciados por `plano-arquitetura.md` §8)

Esta fase já veio pré-fatiada no relatório de arquitetura em 6 passos pequenos
e reversíveis — a tabela abaixo só formaliza aceite/tamanho/dependência.
Nenhuma decisão de produto pendente aqui; é reorganização interna.

| # | Item | Aceite testável | Tamanho | Depende de | Não-objetivo |
|---|---|---|---|---|---|
| 2.1 | Extrair `oracle/vocabulario.ts` de `oracle.ts` (ELEMENT_ORDER, NUMBER_ELEMENTS/ROLES/ALIGNMENT, REALM_WEIGHTS, ROLE_ALIGNMENT, ROLE_ORDER, ALIGNMENT_ORDER, REALM_ORDER, tipos), reexportado de `oracle.ts` | `npx tsc --noEmit` limpo; `npx vitest run` sem alteração de resultado (mesmos testes de `axes.ts`/`pipeline.test.ts` passam); `git diff --stat` mostra só movimentação de código, sem lógica nova | P | nenhum | Não muda nenhum valor de tabela |
| 2.2 | Trocar o import de `axes.ts` para `oracle/vocabulario.ts` direto, em vez de `../oracle` | `npm run build`; medir `dist/assets/*.js` (via `ls -la dist/assets`) antes/depois — chunk de entrada deve reduzir ou manter (nunca crescer); `npx tsc --noEmit`/`npx vitest run` limpos | P | 2.1 | Não separa ainda `familias.ts` |
| 2.3 | Extrair `oracle/familias.ts` (CREATURE_FAMILIES, MOTIVO_ELEMENTO_CLASSE) de `oracle.ts`, mesma técnica de reexport | `pipeline.test.ts` e testes de família/fusão passam sem alteração; `wc -l src/utils/oracle.ts` cai (medir antes/depois, hoje ~3808 linhas) | P | 2.1 (não depende de 2.2) | Não separa lógica de composição — só dados |
| 2.4 | Teste de contrato de bundle: varrer `dist/assets/*.js` do chunk de entrada e falhar se achar símbolo exclusivo de `astronomy-engine` fora do chunk dinâmico | Teste passa hoje; prova de vida: introduzir de propósito `import { buildSoulProfile } from './soulProfile'` estático em `oracle.ts`, rodar o teste, confirmar que FALHA, depois reverter o import de propósito | M | 2.2 (precisa que o chunk já esteja separado para o teste fazer sentido) | Não cobre outros bundles (sprites já tem régua própria — `sprites.dungeonRoster.test.ts`) |
| 2.5 | Documentar e testar a ponte 8→17 como tipo (`ElementBridge` em `derivedElements.ts`) | Teste novo confirma que cada um dos 8 `ElementId` produz ≥1 elemento base plausível do class-system; nenhum teste existente (`pipeline.test.ts`, `buildSheet.*.test.ts`) muda de resultado | M | 1.4 (reaproveita o teste de cobertura de saída já escrito na Fase 1 — evita duplicar trabalho) | Não funde os vocabulários |
| 2.6 | `generateOracle` síncrono × `promptClassFlavor` assíncrono viram contrato por tipo (`OracleInputSync` / `OracleInputWithClass`) | `npx tsc --noEmit` pega em compilação qualquer call site que não faça `await`; `npx vitest run` 100% verde; todos os ~20 call sites de teste + os 2 reais (`SoulmonOnboarding.tsx`, `App.tsx`) atualizados no mesmo PR | M–G (plano original já avisa: "mudança de tipo público... fazer por último e sozinha, para isolar o raio de erro") | 2.1–2.5 estáveis em produção por ≥1 ciclo | Não muda comportamento de runtime — só reforça em tipo o que já é convenção |

Ordem dentro da fase: 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 (a numeração do próprio
`plano-arquitetura.md` §8 já é a ordem; 2.6 é explicitamente marcado como
opcional/mais arriscado e deve ser a última, isolada).

**Faltando no plano (Fase 2):**
- 2.6 é o único item da rodada inteira que resvala em G — "fazer por último e sozinha" é reconhecimento implícito de que pode não caber num PR pequeno se os ~20 call sites de teste + 2 reais gerarem conflito. Se ao abrir a story o diff passar de ~300 linhas, fatiar em (a) trocar o tipo com todos os call sites já preparados para `await` numa PR de puro `async/await` mecânico primeiro, (b) só então apertar o tipo público numa PR separada e pequena.
- Nenhum item de Fase 2 cita o repositório irmão (`Besti-rio-`) apontando para branch não-main (`claude/canonical-classification`) — é risco nomeado no `PLANO-ORACULO.md` §6/§7 do `ORACULO.md`, mas nenhuma story da Fase 2 trata isso. Está fora do escopo desta fase (é dado, não arquitetura interna) — mas falta um item explícito em ALGUMA fase (0, 1 ou backlog) resolvendo "esperar o merge da main de lá" ou decidir seguir na branch. Marcar como item sem dono.

---

## Fase 3 — Jogador (comportamento)

Depende de Fase 1 fechada para não expor uma leitura ainda desbalanceada, e
de Fase 2 (2.5) se a classe real entrar em qualquer fluxo do jogador.

| # | Item | Aceite testável | Tamanho | Depende de | Não-objetivo |
|---|---|---|---|---|---|
| 3.1 | Régua que nenhuma tela exibe pontuação de eixo/score numérico ao jogador (fora de `OraclePage`) | Teste varre renders de `axes`/score fora de `OraclePage.tsx` e falha se encontrar; hoje deve passar (comportamento já existe) — o item é travar em teste, não mudar comportamento | P | nenhum | Não remove `OraclePage` nem seu uso interno |
| 3.2 | Régua que a classe calculada (`ficha/classTitle.ts`) nunca é renderizada em nenhuma tela (decisão 3 do dono, já tomada — §4 do `PLANO-ORACULO.md`) | Teste grep/AST confirma que `PetPage.tsx` (e qualquer outro componente do jogador) não usa `computeClassTitle`/`soulmonClassTitles` para desenhar texto; já deveria passar hoje — travar, não implementar | P | nenhum | Não remove a infraestrutura de cálculo/cache (o dado continua computado) |
| 3.3 | Traduzir vocabulário numerológico negativo ("dívida cármica", "lições", "desafios") antes de qualquer exposição a texto de jogador, com checagem de `alpha-compliance` | `grep` (ou teste de contrato equivalente ao `narrativa.contract.test.ts`) confirma que nenhum termo numerológico bruto aparece em componente voltado ao jogador; se algum aparecer hoje, a story troca pelo vocabulário L1-L12 da bíblia de narrativa | M | nenhum | Não decide vocabulário novo — usa o já existente em `NARRATIVA-E-UNIVERSO.md` |
| 3.4 | Confirmar (não implementar) que a evolução continua função do comportamento real, nunca da leitura do Oráculo sozinha — travar em teste de regressão se ainda não houver | Teste força um cenário onde dois perfis têm leitura idêntica do Oráculo mas comportamento real distinto (esforço/ritmo) e confirma que o galho de evolução diverge por comportamento, não por leitura | M | nenhum | Não muda a regra de desempate (`carePattern.ts`) — só trava o comportamento existente |
| 3.5 | Planejar (sem executar) o teste cego de Barnum × especificidade (bio trocada entre perfis) — desenho do experimento, não a execução | Documento curto (não código) descrevendo a coorte, a métrica ("isso sou eu"/satisfação) e o gatilho para rodar ("quando houver usuários") entra em `docs/PLANO-ORACULO.md` ou anexo; nenhum código muda | P | nenhum | **Não executa** — `PLANO-ORACULO.md` §2 Fase 3 já diz "executado quando houver pessoas" |

Ordem dentro da fase: 3.1/3.2 primeiro (são travas de regressão sobre
comportamento já existente, mais baratas e sem dependência) → 3.3 → 3.4 → 3.5
por último (é só planejamento, não bloqueia nada).

**Faltando no plano (Fase 3):**
- **3.3 tem o aceite mais vago da rodada inteira.** O `plano-comportamento.md` (item 2 da lista de requisitos comportamentais) já sinaliza isso: "hoje só há proibição geral de julgamento, não específica de vocabulário numerológico" — ou seja, a story pode descobrir que HOJE já vaza um termo, e nesse caso deixa de ser "travar" e vira "corrigir + travar", o que muda o tamanho de P/M para M certo (mantive M acima já assumindo esse risco, mas quem abrir a story precisa `grep` antes de estimar).
- **Nenhum dono nomeado** para 3.3 do lado de compliance — o próprio item cita `alpha-compliance`/`alpha-redator-ux` como quem deveria revisar, mas isso é verificação, não story fechada; falta decidir se `alpha-compliance` audita ANTES do PR (gate) ou depois (review).
- **Risco sem mitigação**: `plano-comportamento.md` §3 item 2 aponta risco de a UI dar peso visual igual a astrologia/numerologia (sem validade) e ao teste psicométrico (com alguma base) — nenhum item de Fase 3 cobre isso. É gap de escopo: não está no `PLANO-ORACULO.md` original, então fica fora desta rodada, mas deve ir para `docs/PERGUNTAS-DO-DONO.md` ou equivalente, não ser esquecido.
- **3.5 não tem gatilho automático** — "quando houver usuários" não é um evento que dispara sozinho. Sugestão: amarrar ao mesmo marco que já existe no projeto para outras coisas pós-lançamento (ver `docs/STATUS.md` "depende do dono"), não inventar um novo.

---

## Faltando no plano — visão consolidada (todas as fases)

1. **Sem dono nomeado** em: 0.1 (formato do relatório), 1.2/1.3 (decisão ápice-raro vs. conserto), 3.3 (quem faz a auditoria de compliance).
2. **Aceite vago** em: 1.2/1.3 ("decidir" não é testável sem o formato de registro que propus); 3.3 (depende de descoberta em tempo de execução).
3. **Risco sem mitigação**: branch não-main do `Besti-rio-` (citado no `PLANO-ORACULO.md` mas sem item em nenhuma fase); peso visual igual entre astrologia/numerologia e teste psicométrico na UI (citado em `plano-comportamento.md`, sem item em nenhuma fase).
4. **Item que resvala em G**: 2.6 — plano original já avisa, fatiamento sugerido acima.
5. **Métrica sem fonte no plano**: nenhum número foi inventado nesta rodada — todos os alvos (≤1,5×, 17/17, ≥97% etc.) vêm de `PLANO-ORACULO.md` §1. Onde citei número de linhas/arquivo (3808, 77/79, 188/194) é da leitura direta dos relatórios de apoio, não de medição própria — checar antes de usar em commit real.

## Regra de portão (lembrete, não decisão nova)

Todo item P/M acima fecha com `npx tsc --noEmit` + `npx tsc -p tsconfig.server.json --noEmit` (se tocar `functions/`/`workers/`) + `npx vitest run` + `npm run build` (se tocar bundle/chunk) → commit → PR → merge ff-only em `main`, sem loop de reagendamento (regra de autonomia do `CLAUDE.md`). Nenhum item desta lista deveria virar PR de mais de ~300 linhas de diff; se um item crescer além disso ao ser implementado, é sinal para fatiar de novo antes de abrir o PR.
