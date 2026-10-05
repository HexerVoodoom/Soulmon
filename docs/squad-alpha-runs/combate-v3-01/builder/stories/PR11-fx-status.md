# Story PR11 — FX do cast do especial e FX de status por efeito (run `combate-v3-01`, Builder)

> Executor: lê só isto + `contexto.md`. Código de referência: `D:\soulmon-cv3`.

## O que construir
1. O cast do especial ganha FX próprio, mais forte que o golpe básico, igual nas 4 telas (Arena, Masmorra, Pesadelo, Duelo/Torneio).
2. Cada efeito de status tem um FX **distinguível** no alvo enquanto dura: buff, debuff, maldição, DoT, cura e HoT.
3. Com `prefers-reduced-motion`, o **movimento** é reduzido e a **informação** continua: ícone/selo estático, contagem de turnos e cor.
4. A superfície nasce **muda** (R-NOVA).

## Por quê
§2.12 (FX). Hoje o `BattleStage` só desenha a ação: investida, projétil, escudo e o `SpecialBanner` com rótulo. Ele não desenha nenhum estado persistente no alvo. Com as 7 famílias do PR1 (`direto`, `dot`, `cura`, `escudo`, `buffAtk`, `debuffDef`, `buffSpd`), o jogador não vê o que o especial fez além do dano.

## Símbolos donos
- `src/utils/combatFx.ts`: **dono único novo**, a tabela pura `STATUS_FX: Record<StatusFxKind, {...}>`, com `StatusFxKind = 'buff' | 'debuff' | 'maldicao' | 'dot' | 'cura' | 'hot'`, e o mapeamento `familia → StatusFxKind` lido do módulo do núcleo PR1. Sem lista paralela.
- `src/components/games/BattleStage.tsx`:
  - `ActionFx` com variante de cast do especial;
  - camada nova de status por lutador (`StageFighter.status?: StatusFxKind[]` + turnos restantes);
  - `SpecialBanner`, que mantém o nome do PR1b/N1.
- `src/utils/attackFxArt.ts`: só **reuso** de frames existentes, com tint ou composição. **Arte nova é fora de escopo (§10).** Se faltar frame, use forma CSS/ícone do design system (`src/index.css`, §7).
- Telas: `ArenaGame`, `DungeonGame`, `NightmareBattle`, `DuelScreen` passam `status` vindo do estado do motor (PR3/PR4/PR5). A tela não inventa status.

## Restrições
- Efeito vem do motor (função pura). O FX só desenha.
- Tokens e cores do design system (§7). Distinção **não só por cor**: forma/ícone + texto acessível (`aria-label` com efeito e turnos).
- R-NOVA: nenhum som novo nem chamada nova ao módulo de som.
- `prefers-reduced-motion`: sem partícula móvel, pulso ou tremor. Ícone estático, contador e flash único no aplicar. O teste prova que **a mesma informação** aparece nos dois modos.
- Orçamento: no máximo 1 camada de status animada por lutador, sem regressão do `STAGE_TIMING` (o dano continua no impacto).
- **Sessão irmã:** não toca modal/home. `BattleStage` e `TorcidaKit` são de jogo. Se algum token de `index.css` mudar, avise (é compartilhado).
- Fora do escopo: arte nova, som, balanço, nome do especial (PR9).

## Pendências (perguntar ao dono, não inventar)
- **Q-FX1:** "maldição" e "HoT" **não existem como família** no PR1. Maldição hoje é escola (`maldicao`). HoT não existe. **Default declarado:** os 6 FX entram na tabela. `maldicao` aplica-se ao especial da escola `maldicao` com debuff. `hot` fica pronto, mas inalcançável até alguma família usá-lo, e um teste marca isso explicitamente. O dono confirma ou corta.
- **Q-FX2:** se o reuso de `attackFxArt` não der 6 leituras distintas, a alternativa é ícone CSS. Arte nova exige decisão do dono (§10).

## Critérios de aceite (testáveis)
1. `STATUS_FX` cobre os 6 `StatusFxKind`. Toda família do núcleo PR1 que gera status mapeia para um kind. A lista é lida do módulo. **Prova de vermelho:** uma família nova sem mapeamento faz o teste reprovar.
2. Distinção: os 6 kinds diferem dois a dois em **ícone/forma** (não só cor). É um teste sobre a tabela.
3. Render (`BattleStage.test.tsx`): para cada kind, um lutador com `status` mostra o elemento `data-stage-status=<kind>` com `aria-label` contendo efeito e turnos. Quando a duração acaba, some.
4. Cast do especial: nas 4 telas, a ação `kind: 'special'` renderiza a variante de cast (`data-stage-cast="special"`). A básica não renderiza. É um teste por tela.
5. Movimento reduzido: com `prefersReducedMotion` mockado como `true`, os critérios 3 e 4 continuam passando com o mesmo `aria-label`/ícone, e não há elemento com animação (`anim` ausente/`none`). **Prova de vermelho:** escondendo o ícone no modo reduzido, o teste reprova.
6. R-NOVA: um teste garante que nenhum import do módulo de som entra em `BattleStage`/`combatFx` por esta story.
7. Timing: os testes de `STAGE_TIMING` em `combatFx.test.ts` e `usePveBattle*.test.tsx` seguem verdes, sem alteração.
8. tsc (app + server), vitest e build verdes.

## Estados obrigatórios (UI)
- Sem status (camada vazia).
- 1 status.
- Vários status no mesmo alvo (empilha até N; o excedente vira "+k").
- Status expirando (último turno).
- Alvo derrubado com status (some).
- Movimento reduzido.
- Duelo em replay/offline: o status vem dos eventos do servidor.

## Verificação
```
npx vitest run src/utils/combatFx src/components/games src/components/ArenaGame src/components/DungeonGame src/components/NightmareBattle src/components/DuelScreen && npx tsc -p . --noEmit && npx tsc -p tsconfig.server.json --noEmit && npm run build
```

## Dependências
- **PR1** (famílias) e **PR1b** (cast unificado, `fighterStrikeForm`, nome no selo).
- **PR3, PR4 e PR5:** os motores precisam **emitir** status com duração. Sem eles não há o que desenhar.
- A tabela pura e a camada do `BattleStage` (critérios 1-3, 5-6) podem começar logo após o PR1b. A ligação por tela (critério 4 completo, status reais) fecha depois do PR5.
- Corre em paralelo ao PR9 e vem antes do PR10.
