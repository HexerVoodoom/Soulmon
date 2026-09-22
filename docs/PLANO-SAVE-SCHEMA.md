<!-- doc-historico -->
# PLANO-SAVE-SCHEMA — executar a ADR-006 (versionamento do esquema do save)

**Nasceu de:** decisão do dono **#52** (22/09/2026, `docs/PERGUNTAS-DO-DONO.md` ›
"Respostas QA RODADAS 1 e 2"): *"ADRs: **aprovar a 006 agora** (versionamento do
save); 004 e 005 depois do E0"*.
**Fonte da decisão:** [`docs/adr/ADR-006-versionamento-do-esquema-do-save.md`](adr/ADR-006-versionamento-do-esquema-do-save.md)
— **Aceita em 22/09/2026**. Este arquivo NÃO redecide nada; ele só responde
*"aceita, e agora, quanto custa e em que ordem?"*.
**Estado:** ⬜ **nada implementado.** Prova:
`grep -rn "schemaVersion\|SAVE_SCHEMA_VERSION\|saveMigrations" src functions | grep -v test` → **0**.
**Precedência:** código > teste > `CLAUDE.md` > manual > ADR > este plano.

> ⚠️ **Aceita ≠ implementada.** A rodada que registrou a aceitação (22/09/2026)
> deliberadamente **não** escreveu código de save: a ADR-006 muda o formato do
> save, e quem tocava `src/utils/*` e `GameStateContext` naquela janela era
> outra frente. Uma ADR aceita sem plano vira dívida invisível — daí este
> arquivo.

---

## 1. As duas perguntas da ADR, respondidas

A ADR-006 §"Perguntas endereçadas ao dono" deixou duas em aberto. A resposta
#52 aprova a 006 **e adia a 004**, e isso responde as duas por consequência:

| Pergunta da ADR | Resposta, e de onde ela sai |
|---|---|
| Executar junto da ADR-004 (mesma janela de "0 usuários") ou depois? | **Depois — a 006 vai SOZINHA.** A #52 adiou a 004 para depois do E0, então "junto" deixou de existir como opção. Custo aceito: quando a 004 for executada, será uma segunda mudança de formato (o envelope `v` da KV), não uma. Ela é em **eixo diferente** (formato do REGISTRO na KV × formato do ESTADO), e a própria ADR-006 §D1 já separa os dois — não há retrabalho, só duas janelas |
| D3 (modo leitura no cliente velho) ou E (412 no servidor)? | **D3**, a recomendação da própria ADR: degrada em vez de quebrar, e não obriga o servidor a conhecer o `GameState` (o que a §D5 recusa). A **E fica como gatilho**, na §"O que reverteria" |

---

## 2. Os passos, em ordem, com o que prova cada um

A ordem não é arbitrária: cada passo é inerte até o seguinte, e a versão só
sobe no fim. Em nenhum momento entre dois passos o save fica inconsistente.

| # | Passo | Arquivos | Prova de feito |
|---|---|---|---|
| 1 | **Gerar a fixture do estado ATUAL antes de mudar o tipo** (§D4) | `scripts/gerar-fixture-save.mjs`, `src/test/fixtures/save-v0.json`; `SAVE_LEGADO` de `GameStateContext.legacySave.test.tsx` vira `save-v0-digiapp.json` | os dois `.json` existem e `hydrateSave` os abre **sem** nenhuma mudança de código ainda |
| 2 | **A constante e o campo**, sem nenhuma migração ligada (§D1) | `src/types/saveSchema.ts` (`SAVE_SCHEMA_VERSION = 1`), `GameState.schemaVersion?: number` | `hydrateSave` lê `?? 0` e grava `1`; nada mais muda de comportamento; a suíte inteira passa sem edição |
| 3 | **Mudar as 3 migrações ad hoc de endereço, não de comportamento** (§D2) | `src/utils/saveMigrations.ts` (`MIGRATIONS` `0 → 1`: `decor-para-palco`, `careCaps-do-aparelho-para-o-save`, `conquistas-herdadas`), chamadas a partir de `hydrateSave` | teste de **idempotência por migração** (rodar 2× = mesmo resultado) + `SAVE_SCHEMA_VERSION === max(to)` |
| 4 | **Save do futuro = modo leitura** (§D3) | `GameStateContext` (não escreve na nuvem se `schemaVersion > SAVE_SCHEMA_VERSION`), aviso PT+EN, `desktop/` (`pushCareAction` → `reason: 'schema-newer'`) | spy em `cloudSaveComRetry`: **nenhum** `POST /api/save` sai com save do futuro; overlay recusa |
| 5 | **Fixture por versão como régua que não envelhece** (§D4) | `src/utils/saveMigrations.fixtures.test.ts` | cada `save-v<N>.json` → `schemaVersion === SAVE_SCHEMA_VERSION`, nenhum campo não-opcional `undefined`, e as invariantes de progresso preservadas (`perfectDays`, `totalPerfectDays`, `habitRhythms.totalDone`, `unlockedEvolutions`, `rest.dreams` — a mesma lista que `applyFreshStart` já trava) |
| 6 | **A regra escrita onde quem vai errar vai ler** | `CLAUDE.md` §Convenções | a frase "campo renomeado ⇒ sobe `SAVE_SCHEMA_VERSION` **e** gere a fixture da versão anterior ANTES de mudar o tipo; campo NOVO com `??` ⇒ versão NÃO sobe" |

**O passo 1 é o que mais se perde, e é o único irrecuperável**: gerar a fixture
*depois* de mudar o tipo faz a fixture nascer já no formato novo — ela passa no
teste e não prova nada. Se o passo 1 não foi feito, **os outros cinco não
começam**.

---

## 3. O custo

| Item | Custo |
|---|---|
| Trabalho | **~1 dia** de uma frente de frontend (a própria ADR §"Alternativas" estima o mesmo para a opção B) |
| Infra | **R$ 0** — nada disto toca servidor (§D5: o servidor guarda o `state` opaco) |
| Bundle | **~1 KB** (`saveMigrations.ts`). ⚠️ há orçamento executável: `src/deploy/orcamentoDeBytes.contract.test.ts` |
| Risco de regressão | **médio-baixo, concentrado no passo 3** — é o único que mexe em caminho que TODO save percorre (`hydrateSave`). Os passos 1, 2, 5 e 6 são inertes; o 4 só liga num estado que hoje não existe |
| Dependência de gente | **nenhuma do dono.** Não precisa de secret, conta, loja nem aprovação — é a diferença entre este plano e #66/#67 |

---

## 4. Quando fazer, e o que NÃO fazer antes

**Janela recomendada:** **agora ou logo depois do E0 — e nunca durante.** O
motivo é o próprio E0: `docs/E0-PREREGISTRO.md` §8 congela o app (*"nenhuma
regra de jogo, nenhuma cota, nenhum texto"*) durante os 14 dias, e uma mudança
no formato do save no meio da medição vira variável de confusão exatamente
como o banner de termos. Antes do 1º convite ou depois do 14º dia; no meio,
não.

**Ainda mais forte:** hoje o projeto tem **0 usuários em produção** — é a janela
mais barata que vai existir para mexer em formato de save, porque nenhum save
real precisa migrar. Cada usuário que entra encarece o passo 3.

**O que NÃO fazer sob o guarda-chuva desta ADR:**

- **A ADR-004** (`revision`/409, envelope `v` da KV) e a **ADR-005** (tirar
  dinheiro do KV) — a #52 as adiou **explicitamente para depois do E0**.
  Executar a 004 "de carona" porque toca arquivos vizinhos é desobedecer a
  decisão, não economizá-la.
- **Validador de esquema** (zod/valibot): a ADR §"Alternativas" D recusa, pelo
  bundle.
- **412 no servidor**: é a alternativa E, e ela está registrada como **gatilho**,
  não como escopo.

---

## 5. O que reverteria / o que reabre isto

Herdado da ADR §"O que reverteria esta decisão", sem mudança:

- **Nenhuma renomeação de campo em 12 meses** ⇒ a cadeia fica com uma migração
  só (`0 → 1`); não se reverte, só não cresce.
- **`schema-newer` disparar em produção sem ser overlay Electron atrasado** ⇒
  há um terceiro cliente ou um Service Worker preso; investigar `CACHE_VERSION`
  antes de mexer aqui.
- **O servidor precisar ler o `GameState`** (ex.: ranking por campo do save) ⇒
  a alternativa **E** entra em pauta e o servidor passa a validar
  `schemaVersion` no `POST`.

---

## 6. Ponteiros

- Decisão: [`docs/adr/ADR-006-versionamento-do-esquema-do-save.md`](adr/ADR-006-versionamento-do-esquema-do-save.md)
- Adiadas: [`ADR-004`](adr/ADR-004-concorrencia-do-save.md) · [`ADR-005`](adr/ADR-005-namespace-kv-unico.md) — ambas **depois do E0**
- Resposta do dono: [`docs/PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md) #52
- Congelamento do E0: [`docs/E0-PREREGISTRO.md`](E0-PREREGISTRO.md) §8
- O save por dentro: [`docs/manual/07-DADOS-E-SAVE.md`](manual/07-DADOS-E-SAVE.md)
