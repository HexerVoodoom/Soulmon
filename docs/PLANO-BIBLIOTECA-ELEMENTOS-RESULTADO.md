# Plano — Biblioteca (abas), Elementos, rótulo de eficiência, padrão de resultado

Data: 2026-10-27. Execução: Opus orquestra; Sonnet implementa; Haiku faz prints e varreduras mecânicas.

## Decisões do dono (modais)
- A Biblioteca ganha abas: **Encontrados** (jogadores, como hoje) + **Selvagem** + **Desgarrado** + **Elemento**. O Bestiário sai de Estatísticas.
- **Desgarrado** continua seguindo a regra de estágio (`wildFoeLabel`: Ultimate/Mega/Ultra). Coisa nova: desgarrados podem aparecer em minigames e desafios maiores onde hoje só aparecem pessoas.
- **Elemento**: começa todo trancado ("?" sem nome), **sem retroativo**. Desbloqueia ao derrotar qualquer inimigo identificado com aquele elemento (Fenda/Dungeon, Match3, Arena, Duelo, Torneio).
- **Rótulo novo de elemento**: "Super eficiente!" / "Pouco eficiente" (EN "Super effective!" / "Not very effective"). Neutro não tem rótulo. A nota do anel (ÓTIMO/BOM/FRACO) não muda.
- **Resultado**: 3 propostas de padrão único, com print, para o dono escolher.

## Itens e critério de aceite
| # | Item | Aceite | Executor |
|---|---|---|---|
| D-01 | Abas na Biblioteca (`LibraryPage`, view `directory`) com `sm2-kit-tabs` | 4 abas visíveis e acessíveis (role=tab, teclado); Encontrados igual a hoje | Sonnet |
| D-02 | Selvagem / Desgarrado = `BestiaryCollection` dividido por `wildFoeLabel`; remover do `StatsPage` | Contagem por aba; silhueta "???" para os não vistos; Estatísticas sem o bestiário | Sonnet |
| D-03 | Estado `defeatedElements: string[]` no GameState (persistido + hidratado + migrado vazio) | Teste: começa vazio; vitória adiciona; idempotente | Sonnet |
| D-04 | Registrar o elemento em toda vitória com inimigo identificado (dungeon `applyEnemyDefeated`, Match3 win, Arena round, Duelo/Torneio win) | Teste por fonte; elemento composto desbloqueia o derivado **e** as bases? → ver Q1 | Sonnet |
| D-05 | Aba Elemento: grade com os 20 base + 190 derivados, "?" sem nome quando trancado; ícone `elementIcon` | Trancado não vaza nome nem ícone (nem no aria) | Sonnet |
| D-06 | Modal do elemento (`RitualDialog`): ícone grande, nome, composição (se derivado), forte contra / fraco contra (`COUNTER_RING`) | Chips com ícone; elementos trancados aparecem como "?" dentro do modal | Sonnet |
| D-07 | Selo "Super eficiente!/Pouco eficiente" no `BattleStage` a partir de `elementAdvantage` (Arena, Duelo, Match3) | Aparece só em ±1; PT/EN; teste render | Sonnet |
| D-08 | Desgarrados como oponentes em minigames/desafios de pessoas (Arena, Torneio sem par, PvP sem oponente) | Ver Q2 antes de executar | Sonnet |
| D-09 | Inventário de toda tela de resultado (Fenda, Match3, Arena, Torneio, Rogue, Dino, Barrage, PPT, Eco, Patches, Zip, Pesadelo) | Tabela campo × tela | Haiku |
| D-10 | 3 propostas de `ResultSheet` único (mock HTML com tokens `--sm2-*`), aplicadas a Fenda + Arena + 1 minigame | 3 prints claro/escuro, 375px | Sonnet + prints Haiku |
| D-11 | Crítica de design (`alpha-design-critic`) das 3 propostas antes de mostrar | Achados fatais corrigidos | Sonnet |
| D-12 | Após a escolha: implementar o padrão em todas as telas do D-09 | Fora deste lote; volta para aprovação | — |

## Ordem
1. D-09 + D-10 + D-11 em paralelo com D-03/D-04 (não se tocam).
2. D-01, D-02, D-05, D-06 (Biblioteca).
3. D-07.
4. D-08 só depois de responder a Q2.
5. Testes (`Test Files` conferido, não só "passed"), commit por caminho, conferir que chegou.

## Dúvidas respondidas (27/10)
- Q1: derrotar um composto desbloqueia **só o composto** (as bases exigem vitória própria).
- Q2: desgarrados entram no **Torneio quando não há par** na faixa e como **1 dos 3 desafios da Arena** (às vezes).
- Plano aprovado para execução.
