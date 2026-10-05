# Story PR9 — Nome próprio do especial, novo por estágio (run `combate-v3-01`, Builder)

## O que construir
Cada estágio do Soulmon gera um especial **novo**, com nome e família de efeito, por regra determinística. O selo na tela de luta (Arena, Masmorra, Pesadelo, Duelo) mostra só esse nome, no lugar de "ESPECIAL!".

## Por quê
§2.4 Q6/Q7 e §2.3 Q8. `buildStageSkills` já sorteia o nome por estágio (`dossie-codigo` §4), mas não tem família, e 3 das 4 telas mostram o selo genérico.

## Símbolos donos
- `src/utils/soulProfile/ficha/skills.ts`: `StageSkill` (campo novo `familia`), `buildStageSkills`, `escolaDominante`.
- `src/utils/combatFx.ts` › `SPECIAL_LABEL`/`specialLabel` (sai ou vira fallback).
- `src/components/games/BattleStage.tsx` › `SpecialBanner`; `DungeonGame`, `NightmareBattle`, `DuelScreen`, `ArenaGame`.

## Decisões do dono aplicadas
- §2.3 Q8: regra determinística, sem IA.
- §2.4 Q6: cada estágio gera especial novo (nome e efeito).
- §2.4 Q7: o selo mostra só o nome próprio.
- §6: sem nomes de franquia nem sufixo "-mon" (`narrativa.contract.test.ts`).
- §7: EN primeiro.

## Critérios de aceite
1. Mesma seed + mesmo estágio → mesmo nome e mesma família. Estágios diferentes → nomes diferentes (sem repetição nos 5). Amostra: N seeds declarado.
2. A família vem de uma das 7 do núcleo PR1, e a lista é lida do módulo.
3. `evocacao` inalcançável (`dossie-codigo` §4): ou passa a ser alcançável, ou é removida. O teste prova que toda família tem chance > 0 na amostra.
4. As 4 telas mostram o nome próprio. Teste de render por tela. **Prova de vermelho:** com o selo "SPECIAL!", o teste reprova.
5. O PvP usa o nome do perfil do oponente vindo do servidor (paridade com o PR5).
6. `narrativa.contract.test.ts` verde sobre todos os nomes gerados na amostra.
7. Se `skills` for persistido: saneamento + fuzz2. Default: derivado, sem campo.
8. tsc, vitest e build verdes.

## Estados de UI
Especial disparado (nome), nome longo (truncar sem quebrar o layout), sem ficha (fallback neutro), offline.

## Verificação
```
npx vitest run src/utils/soulProfile src/utils/combatFx src/components/games && npm run build
```

## Não-objetivos
Nome por IA, arte/som do especial, balanço das famílias (já está no PR1).

## Dependências
PR1 (famílias). Pode rodar em paralelo a PR3–PR8. O critério 4 completo depende de PR3, PR4 e PR5.

## Riscos
- Mudar a família por estágio pode mudar o especial de um Soulmon que o jogador já conhece. Isso é aceito pela §2.4 Q6.
