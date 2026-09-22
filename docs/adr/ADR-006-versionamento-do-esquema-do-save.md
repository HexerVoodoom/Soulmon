<!-- doc-historico -->
# ADR-006 — Versionamento do esquema do save: número de versão no envelope, migrações nomeadas, fixture por versão

**Dono:** `alpha-architect` (autor do rascunho); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** 21/09/2026 (QA rodada A, frente ARQUITETURA, 2ª passada)
**Estado:** ✅ **ACEITA (22/09/2026)** — decisão do dono **#52** (`docs/PERGUNTAS-DO-DONO.md`, "Respostas QA RODADAS 1 e 2"): *"aprovar a 006 agora (versionamento do save); 004 e 005 depois do E0"*. As duas perguntas do §"Perguntas endereçadas ao dono" estão respondidas em [`docs/PLANO-SAVE-SCHEMA.md`](../PLANO-SAVE-SCHEMA.md) §1. ⚠️ **Aceita ≠ implementada**: nada de D1–D4 existe no código (`grep -n "schemaVersion" -r src | grep -v test` → 0), e a execução tem plano e custo em `docs/PLANO-SAVE-SCHEMA.md`. ⚰️ Até 22/09/2026 esta linha dizia **Proposta (aguarda o dono)** — promovida do rascunho `docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-006-versionamento-do-esquema-do-save.md` em 21/09/2026 (QA Rodada 1, pergunta #52 de `docs/PERGUNTAS-DO-DONO.md`); corpo idêntico ao rascunho. Vira **Adotada** só com a resposta do dono ao §"Perguntas"; até lá nada aqui autoriza código. ADR nova nasce em `docs/adr/`, não em `squad-alpha-runs/`
**Verificação:** `git ls-files docs/adr | grep ADR-006` (existe no git) · `diff <(tr -d '\r' < docs/adr/ADR-006-versionamento-do-esquema-do-save.md) <(tr -d '\r' < docs/reviews/2026-09-21-qa-rodada-1/adr-propostas/ADR-006-versionamento-do-esquema-do-save.md)` (só o cabeçalho difere; `tr` porque o Windows grava CRLF) · `grep -n "GAME_STATE" src/utils/storageKeys.ts` → `'soulmon_state_v1'` · `grep -c "??" src/contexts/GameStateContext.tsx` → 34 · `grep -n "schemaVersion\|saveVersion\|SAVE_SCHEMA" -r src functions | grep -v test | wc -l` → 0 · `ls src/contexts/GameStateContext.*.test.tsx | wc -l` → 10 (uma delas `legacySave.test.tsx`, fixture única escrita à mão) · `awk '/^export interface GameState/,/^}/' src/contexts/GameStateContext.tsx | grep -cE "^\s+\w+\??:"` → **111** (o pedido desta frente dizia 89, o manual `07` diz 89 — a contagem por `awk` inclui linhas de subobjetos; a régua é o comando, não o número)
**Não cobre:** concorrência (ADR-004) · chaves de `localStorage` fora do save (`storageKeys.ts`, `migrateLegacyStorageKeys`)
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

---

## Contexto

| Fato | Evidência |
|---|---|
| O save não carrega número de versão. O `v1` está no NOME da chave de `localStorage`, não no dado — e nunca mudou | `storageKeys.ts` › `GAME_STATE: 'soulmon_state_v1'`; o registro na KV é o `state` cru (`save.js`) |
| A "migração" é `hydrateSave`: `...loadedState` + 34 fallbacks `??` + 3 migrações ad hoc | `GameStateContext.tsx` › `hydrateSave`, `migrateDecor` (`equippedFurniture` → `equippedDecor`), `careCaps` (chaves antigas → save, idempotente), `conquistasHerdadas` (herança única de `tasks-100` → `dias-completos-30`, entrou hoje em `42b07bec`) |
| Toda migração é **por presença de campo**, não por versão: "se tem `equippedFurniture`, migra"; "se não tem `conquistasHerdadas`, herda" | idem — `conquistasHerdadas` é, na prática, um bit de versão com nome de campo |
| Campos desconhecidos sobrevivem ao round-trip (cliente velho não apaga campo novo) | `hydrateSave` começa com `...loadedState` |
| O cliente **não sabe** se um save veio do futuro (versão do app maior que a dele) | nenhum campo para comparar |
| Há UMA fixture de save antigo, escrita à mão, da era DigiApp | `GameStateContext.legacySave.test.tsx` › `SAVE_LEGADO`; o fuzz (`hydrate.fuzz.test.tsx`) prova que não lança, não que preserva |
| Três clientes com ciclos de deploy distintos escrevem o mesmo save | web/APK (mesma URL, mesma versão), **overlay Electron** (build própria, auto-update por release), e o PWA com SW pode ficar uma versão atrás até o `CACHE_VERSION` (`v157`) rodar |
| A regra do `CLAUDE.md`: "campos novos sincronizam sozinhos; no load use `?? padrão` SEMPRE" | `CLAUDE.md` §Arquitetura, item Cloud save |

**O dano que a ausência de versão produz, por cenário:**

1. **Renomear campo** (o caso `equippedFurniture`): o cliente velho (Electron atrasado) recebe o save novo, não vê `equippedFurniture`, escreve `equippedDecor` intacto (round-trip preserva) — OK. Mas se ele **escreve** `equippedFurniture` de novo (gesto no overlay que toca decoração — hoje não existe; amanhã pode), o cliente novo re-migra e **sobrescreve** `equippedDecor`. Migração por presença não distingue "campo antigo que sobrou" de "campo antigo que acabou de ser escrito".
2. **Mudar semântica sem renomear** (o caso `tasks-100` → `dias-completos-30`, hoje): a herança roda "uma vez" por `conquistasHerdadas`. Um cliente velho não conhece o bit, não o escreve... e não o apaga (round-trip). OK por acidente do spread. Se alguém um dia "limpar campos desconhecidos" no `hydrateSave`, a herança roda de novo em todo save. Não há guard para isso.
3. **Save do futuro**: o cliente velho abre um save com `v: 2`, aplica regras de `v1` sobre campos que mudaram de significado, e grava. Hoje isso é indetectável; o dano depende do campo. Com `revision` (ADR-004) o cliente velho ainda ganha a corrida se for o último a escrever.
4. **"Save de 3 meses atrás ainda abre?"** — a resposta hoje é "o fuzz diz que não lança". Não há fixture datada; o save do dono é a única fixture real e mora num aparelho.

**Restrições:** `hydrateSave` é a fronteira única de entrada (local e nuvem passam por ela — `adoptCloudSave` grava e recarrega); há guard que exige linha para todo campo não-opcional (`hydrate.fuzz.test.tsx`); nada pode lançar no inicializador (tela branca, já aconteceu).

---

## Decisão (proposta)

### D1. O save ganha `schemaVersion` (inteiro), dentro do `GameState`, escrito pelo cliente

- `GameState.schemaVersion: number`. `SAVE_SCHEMA_VERSION = 1` como constante em `src/types/saveSchema.ts` (dono único; o desktop importa).
- `hydrateSave` lê `loadedState.schemaVersion ?? 0` (save sem campo = versão 0, o mundo de hoje).
- **Dentro do `GameState`, e não só no envelope da KV (ADR-004 `v`),** porque o `localStorage` não tem envelope e é ele a fonte da verdade local. O `v` do envelope da ADR-004 é o formato do REGISTRO na KV (envelope vs cru); o `schemaVersion` é o formato do ESTADO. São eixos diferentes e mudam em ritmos diferentes.

### D2. Migrações nomeadas, encadeadas por versão, puras, idempotentes, em um arquivo só

- `src/utils/saveMigrations.ts` › `MIGRATIONS: Array<{ from: number; to: number; run: (s: Partial<GameState>) => Partial<GameState>; nome: string }>`.
- `hydrateSave` aplica em ordem `from === schemaVersion` até `SAVE_SCHEMA_VERSION`, depois faz o que já faz (`??`, saneamento). As três migrações ad hoc de hoje **viram `0 → 1`** com nome (`decor-para-palco`, `careCaps-do-aparelho-para-o-save`, `conquistas-herdadas`) — sem mudar comportamento, só endereço.
- Regra que fica escrita: **campo renomeado ⇒ versão sobe; campo NOVO com `??` ⇒ versão NÃO sobe.** A regra do `CLAUDE.md` ("`?? padrão` sempre") continua valendo para o caso comum; a versão é só para quando `??` não basta.
- Cada migração é PURA (`now` por parâmetro, como o motor de tarefas) e **idempotente** — rodar 2× dá o mesmo resultado. Há teste por migração exigindo isso (mesmo padrão de `applyRebirth`, footgun 6).

### D3. Save do futuro: o cliente **não grava por cima**

- Se `schemaVersion > SAVE_SCHEMA_VERSION`: o cliente abre em **modo leitura** — joga em memória, **não escreve** no cloud save, mostra um aviso uma vez ("Este save veio de uma versão mais nova do app — atualize para continuar salvando" PT+EN). `localStorage` continua sendo escrito (é o próprio aparelho).
- É o único comportamento que não destrói: gravar aplicando regras velhas é corrupção; recusar abrir é a tela branca com outro nome.
- O overlay Electron faz o mesmo: `pushCareAction` recusa com `reason: 'schema-newer'` e mostra "atualize o overlay".

### D4. Fixture por versão, gerada, não escrita à mão

- `src/test/fixtures/save-v<N>.json`: um save REAL de cada versão, gerado por script (`scripts/gerar-fixture-save.mjs`) a partir de `freshGameState()` + uma sessão simulada (o motor de regras é puro; dá para "jogar" 30 dias em teste).
- Teste `saveMigrations.fixtures.test.ts`: para cada fixture `v<N>`, `hydrateSave` → `schemaVersion === SAVE_SCHEMA_VERSION`, nenhum campo não-opcional `undefined`, e **as invariantes de progresso preservadas** (`perfectDays`, `totalPerfectDays`, `habitRhythms.totalDone`, `unlockedEvolutions`, `rest.dreams` — a lista que `applyFreshStart` já trava). Isso responde "save de 3 meses atrás ainda abre" com um arquivo que não envelhece.
- A fixture `SAVE_LEGADO` de hoje vira `save-v0-digiapp.json` e continua rodando.

### D5. O que NÃO entra

- Migração no servidor. O servidor guarda o `state` opaco (`save.js` só remove `SERVER_OWNED_FIELDS`); versionar lá exigiria o servidor conhecer o `GameState`, e o modelo é offline-first.
- Versão semântica / compat matrix por cliente. Um inteiro basta para "posso escrever?".

---

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| **A. Status quo (`??` + migração por presença)** | Zero código; a regra do `CLAUDE.md` já existe | Não distingue "campo antigo que sobrou" de "acabou de ser escrito"; save do futuro indetectável; sem fixture datada | Funciona até a primeira renomeação com dois clientes vivos — que é exatamente o overlay + Steam |
| **B. `schemaVersion` + migrações nomeadas + fixture (a escolhida)** | Encadeamento explícito; idempotência testável; o futuro é detectável; custo ≈ 1 dia | Um campo a mais no save; uma regra a mais para lembrar ("renomeou? sobe a versão") | Mínimo que fecha os 4 cenários |
| **C. Versão no NOME da chave (`soulmon_state_v2`)** | Já é o padrão aparente | Mudar o nome cria migração de CHAVE (copiar, não sobrescrever — `migrateLegacyStorageKeys`), não de esquema; a nuvem não tem nome de chave | Confunde o eixo "onde mora" com "o que é" |
| **D. Schema com validador (zod/valibot) e versão** | Validação forte, tipos derivados | Dependência nova no bundle inicial (o `orcamentoDeBytes` reprova crescimento); o `hydrateSave` já é um validador à mão com 34 regras | Custo em bytes e em reescrita para um ganho que o fuzz já dá em parte |
| **E. Bloquear cliente velho no servidor (412 por `schemaVersion`)** | Elimina o "save do futuro" na origem | O servidor passa a conhecer o esquema; o overlay atrasado deixa de funcionar por completo em vez de degradar | O D3 (modo leitura no cliente) degrada; o 412 quebra. Fica como gatilho |

---

## Consequências

**Aceitamos de bom:** renomear campo vira operação com nome e teste · save do futuro não é destruído · "save antigo abre?" tem resposta executável · o desktop herda pelo import (footgun 9 evitado).

**Aceitamos de ruim, e fica escrito:**
- **Uma regra a mais** ("renomeou ou mudou significado? sobe `SAVE_SCHEMA_VERSION`"). Sem guard automático possível — o guard que dá é: toda migração em `MIGRATIONS` tem teste de idempotência, e `SAVE_SCHEMA_VERSION === max(to)`.
- **Modo leitura (D3) é fricção**: quem abre o overlay velho com save novo não consegue dar comida. É melhor que dar comida e apagar uma semana.
- **Custo de infra: R$ 0.** Custo de bundle: ~1 KB (`saveMigrations.ts`).
- **A fixture gerada precisa de dono**: quem sobe a versão gera a fixture da versão anterior ANTES de mudar o tipo (senão a fixture nasce já no formato novo). Fica no `CLAUDE.md` §Convenções, ao lado de "ao mudar regra de jogo: atualizar Guide/Help/testes".

**Gargalo nomeado:** cadeia de migrações cresce 1 por renomeação. Em **20 versões** a cadeia `0 → 20` num save de 2 anos ainda roda em < 10 ms (funções puras sobre um objeto de ≤ 5 MB). Não é gargalo neste horizonte.

---

## O que reverteria esta decisão

- **Nenhuma renomeação de campo em 12 meses** ⇒ D2 fica com uma migração só (`0 → 1`) e o custo foi 1 dia; não se reverte, só não cresce.
- **D3 disparar em produção sem ser Electron atrasado** (métrica `save.schema-newer` em `m:<dia>`) ⇒ há um terceiro cliente ou um SW preso; investigar `CACHE_VERSION` antes de mexer aqui.
- **O servidor precisar ler o `GameState`** (ex.: ranking por campo do save) ⇒ a alternativa E entra e o servidor passa a validar `schemaVersion` no `POST`.

---

## Perguntas endereçadas ao dono

| | Pergunta | Impacto |
|---|---|---|
| 🟡 | Executar junto da ADR-004 (mesma mudança de formato, mesma janela de "0 usuários") ou depois? | Junto: uma migração de formato em vez de duas. Depois: nenhuma pressa real até o overlay ter release própria |
| 🟡 | D3 (modo leitura no cliente velho) ou E (412 no servidor)? | Recomendação: D3 — degrada em vez de quebrar; E fica como gatilho |

## Handoffs

→ **`alpha-frontend`**: `src/types/saveSchema.ts`, `src/utils/saveMigrations.ts`, `hydrateSave` encadeando; aviso PT+EN do D3; `scripts/gerar-fixture-save.mjs`.
→ **`alpha-backend`**: nada no servidor (D5); só o envelope `v` da ADR-004.
→ **`alpha-qa`**: idempotência por migração · fixture `v0-digiapp` e `v1` abrem e preservam a lista de invariantes · `schemaVersion > atual` ⇒ nenhum `POST /api/save` sai (spy em `cloudSaveComRetry`) · overlay recusa `schema-newer`.
→ **Gate:** `alpha-skeptic`.
