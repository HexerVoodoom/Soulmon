# Story PR1b — Barra de energia de uso único + golpe básico fixo por personagem (+ N1) (run `combate-v3-01`, Builder)

> Executor: lê só isto + `contexto.md`. Código de referência: `D:\soulmon-cv3` (main com PR1 #221, 3f73ef78).

## O que construir
1. **B1:** a barra de energia do especial, quando enche, faz a **próxima ação do lutador** ser o especial, e a barra **mostra 0** logo depois do cast. Uma barra cheia = um especial. Nada mais dispara especial.
2. **B2:** cada personagem tem **um** golpe básico fixo, melee **ou** ranged, igual na Arena, Masmorra, Pesadelo e Duelo/Torneio. A forma do especial é independente da básica.
3. **N1 (barato, entra):** o selo do cast do especial do **pet** mostra o nome próprio da `StageSkill` especial, no lugar de "ESPECIAL!"/"SPECIAL!".

## Por quê
§2.12 (B1, B2, N1). Diagnóstico no código atual:

**B1: três defeitos.**
- `src/utils/energia.ts` › `spendEnergy` zera e, na mesma ação, `usePveBattle.ts` (l. ~259-260) chama `addEnergy(…, 'dealt')`. Depois do especial a barra mostra 9/100, não 0. O servidor faz igual: `functions/api/_duel.js` › `simulateDuel` (l. 218 e 232) gasta e soma `DUEL_ENERGY_DEALT` no mesmo golpe.
- A barra pode encher fora do turno do dono (via `'taken'` ou descarga do cheer, `usePveBattle.ts` l. 177). Aí ela **fica cheia** e acumula `'taken'` (clamp em `ENERGY_MAX`) até a vez do dono. O jogador vê a barra cheia "sem disparar".
- **Arena:** `ArenaGame.tsx` l. 440-442, `kind = pronto || cheio ? 'special' : …`. O gauge de torcida cheio (`cheio`, `TORCIDA_TAPS_FULL`) desenha um cast de especial **sem gastar `carga`**. Na prática, duas fontes disparam especial: a carga por turnos (`SPECIAL_CHARGE_TURNS`) e a torcida. Isso viola "uma barra = um uso".

**B2: atinge todo pet cuja escola da ficha discorda do arquétipo do elemento.**
- Arena: `skillStrikeForm(basica, 'basica')`, que usa a escola da ficha (`SCHOOL_STRIKE_FORM`).
- Masmorra (`DungeonGame.tsx` l. 237), Pesadelo (`NightmareBattle.tsx` l. 167) e Duelo (`DuelScreen.tsx` l. 152-153): `elementStrikeForm(petEl|meEl, …)`, que usa o elemento (`ELEMENT_STRIKE_FORM`).
- Exemplo: pet `combate_fisico` + `fogo` é melee na Arena e ranged nas outras três telas. Pet `conjuracao` + `terra` é ranged na Arena e melee nas outras.
- Hipótese R8 **confirmada**: as telas sem ficha caem no elemento (comentário em `DuelScreen.tsx` l. 150: "o servidor não publica skill"). Não é bug de um personagem. É uma divergência de fonte em 3 de 4 telas.
- Inimigos e fantasmas sem ficha usam `elementStrikeForm` de forma consistente. Para eles a tabela do elemento é a ficha, e isso fica como está.

## Símbolos donos
- `src/utils/energia.ts`: `spendEnergy`, `addEnergy`, `energyFull`. Regra nova pura, por exemplo `afterSpecial` ou `spendEnergy` passando a retornar 0 sem excedente.
- `functions/api/_duel.js` › `simulateDuel`: mesma regra (paridade §5).
- `src/components/games/usePveBattle.ts`: laço do pet (l. ~235-264) e do inimigo (l. ~276-311).
- `src/components/ArenaGame.tsx`: l. 318 e 440-446 (`pronto`/`cheio`).
- `src/utils/combatFx.ts`: **dono único novo** `fighterStrikeForm(fighter, role)`. A precedência fica num lugar só: escola da `StageSkill` se houver ficha, senão elemento. `skillStrikeForm` e `elementStrikeForm` passam a ser internos dele ou ficam como compat.
- `DungeonGame.tsx`, `NightmareBattle.tsx`, `DuelScreen.tsx`: recebem o par `StageSkills` do estágio atual (o mesmo `skills?.[stage]` da Arena) e usam `fighterStrikeForm`.
- N1: `combatFx.ts` › `specialLabel(isPt, skill?)`. O nome da skill vence. Sem skill, cai em `SPECIAL_LABEL`. O nome vai no prop `specialLabel` das 4 telas.

## Decisões aplicadas
- "Dispara ao encher" = a **próxima ação do dono da barra** é o especial. Não interrompe o turno do outro (o motor é por turnos e o servidor é autoritativo).
- O golpe que faz o cast **não rende energia `'dealt'`**. A barra fica em 0 até a próxima ação de alguém.
- Na Arena, a torcida cheia **só multiplica** o golpe do turno (`arenaTorcidaTurn`, que já faz isso). Ela deixa de trocar o `kind` para `'special'`.
- Excedente: não existe (clamp em `ENERGY_MAX`). Isso precisa constar em comentário e teste.

## Restrições
- §5: funções puras, paridade cliente/servidor travada por teste (`_duel.js` × `energia.ts`), tsc app + `tsconfig.server.json`, vitest, `npm run build` com dist commitado. Protocolo §2.12: fetch, rebase e reteste antes do merge.
- **Risco de balanço:** tirar `'dealt'` do golpe de cast atrasa o 2º especial em ~1 golpe. Rodar de novo a régua pareada do PR1. Se sair de ±5% (§2.4), **parar e reportar**, sem recalibrar sozinho.
- O PvP do oponente: o servidor não publica a skill dele. Neste PR o oponente continua no elemento (`elementStrikeForm`), igual em todas as partidas dele. A forma por ficha do oponente fica no PR5/PR9.
- Fora do escopo: FX do cast (PR11), família do especial (PR9), nome do especial do inimigo/oponente (PR9), arte, som.
- **Sessão irmã (`D:\soulmon-ajustes`, modais/home):** esta story não toca componentes de modal/home. Se `skills` precisar subir por `App.tsx` ou `nav/AreaView.tsx` até Masmorra/Pesadelo/Duelo, isso **toca arquivo compartilhado**. Avise antes do merge.

## Critérios de aceite (testáveis)
1. **B1 puro:** `energia.test.ts`. Barra em `ENERGY_MAX` → depois do cast, energia = 0, e o golpe de cast não soma `'dealt'`. **Prova de vermelho:** no `main` atual o teste vê 9 e reprova.
2. **B1 paridade:** para N seeds declaradas (≥200), toda sequência de `simulateDuel` cumpre o seguinte. Todo evento `special: true` tem `energyMe`/`energyOpp` do ator = 0 após o evento. Entre dois especiais do mesmo ator, a energia passa por 0 e volta a `DUEL_ENERGY_MAX`. Nenhum evento tem energia do ator ≥ MAX sem que o próximo evento dele seja especial. Mesmo teste contra o espelho cliente (`energia.ts`). **Prova de vermelho:** no `main` atual, `energyMe` pós-especial = 9.
3. **B1 PvE:** `usePveBattle.test.tsx`. Com `_setPetEnergy(ENERGY_MAX)` → a próxima ação do pet é `kind: 'special'` e depois `petEnergy === 0`. Barra enchida por `'taken'` no turno do inimigo → a ação seguinte do pet é especial (sem básica no meio).
4. **B1 Arena:** com o gauge de torcida cheio e `carga < SPECIAL_CHARGE_TURNS`, a ação emitida **não** é `'special'`. Com `carga` cheia, é `'special'` e `carga` volta a 0. **Prova de vermelho:** no `main` atual, `cheio` emite `'special'`.
5. **B2 puro:** `combatFx.test.ts` › `fighterStrikeForm`. Com ficha, a escola decide. Sem ficha, o elemento decide. Uma varredura dos 6 `EscolaId` × 19 elementos mostra que o resultado com ficha **não depende do elemento**.
6. **B2 telas:** um teste por tela (Arena, Masmorra, Pesadelo, Duelo) com o mesmo pet de fixture `combate_fisico` + `fogo` → a ação básica do pet é `'melee'` nas 4. Fixture `conjuracao` + `terra` → `'ranged'` nas 4. **Prova de vermelho:** no `main` atual, Masmorra/Pesadelo/Duelo dão `'ranged'` no 1º caso.
7. **B2 especial independente:** fixture `maldicao` (básica melee, especial ranged) → básica `'melee'` e `strike` do especial `'ranged'` nas 4 telas.
8. **N1:** pet com ficha → o `SpecialBanner` mostra `StageSkill.nome` (idioma ativo) nas 4 telas. Pet sem ficha → `SPECIAL_LABEL`. **Prova de vermelho:** com o selo fixo "SPECIAL!", o teste do pet com ficha reprova. Nome longo trunca sem quebrar o layout (assert de `text-overflow`/`max-width` no selo).
9. `narrativa.contract.test.ts`, tsc (app + server), vitest e build verdes. Régua pareada do PR1 dentro de ±5%, ou parar e reportar.

## Estados obrigatórios (UI)
- Barra vazia (0 logo após o cast).
- Barra cheia aguardando a vez do dono.
- Cast com nome próprio.
- Cast sem ficha (fallback).
- Nome longo.
- `prefers-reduced-motion`: só flash, mesma lógica de B1/B2.
- Duelo offline/replay: os eventos do servidor são a fonte e a tela não recalcula energia.

## Verificação
```
npx vitest run src/utils/energia src/utils/combatFx src/components/games src/components/ArenaGame src/components/DungeonGame src/components/NightmareBattle src/components/DuelScreen functions && npx tsc -p . --noEmit && npx tsc -p tsconfig.server.json --noEmit && npm run build
```
O executor cola a saída real, mais a saída vermelha dos critérios 1, 2, 4, 6 e 8 rodados contra o `main` antes do fix.

## Dependências
PR1 (mergeado, #221). Vem **antes** do PR2. É pequeno, corrige o terreno que PR3/PR4/PR5 vão reescrever e dá a eles o dono único `fighterStrikeForm`.

## Riscos
- Mudança de cadência de energia → balanço (critério 9).
- Paridade PvP: cliente e servidor precisam mudar no mesmo PR, senão o replay do duelo diverge.
- Masmorra, Pesadelo e Duelo hoje não recebem `skills`. Passar o prop pode tocar o roteamento compartilhado com a sessão irmã (ver Restrições).
