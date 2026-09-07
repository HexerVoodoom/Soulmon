# ⚰️ Documentação do DigiApp — histórico, NUNCA verdade

**Nada nesta pasta descreve o Soulmon de hoje.** São oito documentos herdados
do fork, aposentados em 07/09/2026. Ficam versionados porque as revisões de
agosto os citam e porque saber o que o produto já foi tem valor — mas ler
qualquer um deles como instrução leva a decidir errado.

## Por que foram tirados de `docs/`

Não é limpeza estética. Cada um deles **afirma como fato uma regra de jogo que
não existe mais**, e três deles tinham títulos de autoridade (`00-START-HERE`,
`README`, `DOCS-INDEX`) — o `docs/squad/00-BRIEFING.md` mandava agentes
começarem justamente pelo `00-START-HERE`, que abre com "DigiApp" e se declara
"100% completo, 0 bugs".

Amostra do que o `BACKLOG.md` ensinava, tudo falso hoje:

| O que ele diz | O que a regra é |
|---|---|
| Estágios `DigiEgg` → `Baby I` → `Baby II` → … | A árvore **nasce em rookie**; ovo e baby não existem (`src/types/progression.ts`) |
| HP 1/4/6/6/8/10/12/14 por estágio | rookie/champion/ultimate=3 · mega=4 · ultra=5 (`MAX_HP_BY_FORM`) |
| "Perde 1 coração se não completar NENHUMA atividade" | Razão sobre a meta PONDERADA, teto de 1/dia, perdão por ausência, alívio de segunda (`utils/dailyReset.ts`) |
| "Dia perfeito = `dailyDone >= required`" | Peso feito ≥ `dailyGoalFor` **E** ≥1 cadastrada **E** energia ≥ `dailyGoalFor` |
| "Degeneração: volta à forma anterior" + evolução automática | `MANUAL_EVOLUTION = true` — a virada do dia **nunca** evolui sozinha |
| Roster com ~20 nomes de personagem da Bandai | Apagados do bundle em 07/09/2026; `LEGACY_FORM_TIERS` não existe mais |
| Chave `digiapp_state_v3` | `soulmon_state_v1` (`utils/storageKeys.ts`) |

Um agente que lesse a tabela da esquerda implementaria a tabela de HP errada e
**recriaria os nomes de franquia** que a limpeza acabou de tirar do bundle.

## Onde a verdade mora

| Assunto | Fonte viva |
|---|---|
| Regras de jogo, arquitetura, footguns | `CLAUDE.md` (raiz) |
| Estado do projeto, o que depende do dono | `docs/STATUS.md` |
| Plano e benchmark | `docs/PLANO-EVOLUCAO.md` · `docs/PLANO-MELHORIAS.md` |
| Motor de tarefas | `docs/PLANO-TAREFAS.md` |
| Separação do fork | `docs/SEPARACAO-DIGIAPP.md` |
| Telas | `docs/INVENTARIO-TELAS.md` |

E a regra que vale para todo doc, não só para estes: **a régua viva é o teste,
não o documento.** Onde houver conflito entre uma tabela em markdown e um
arquivo em `src/`, o arquivo ganha — e o documento está com defeito.
