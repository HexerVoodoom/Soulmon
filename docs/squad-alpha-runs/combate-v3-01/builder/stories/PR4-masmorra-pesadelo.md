# Story PR4 — Masmorra e Pesadelo no núcleo v3 (run `combate-v3-01`, Builder)

## O que construir
A Masmorra e o Pesadelo usam o mesmo núcleo da Arena. Os stats do jogador vêm do level, os inimigos vêm em "pontos acima/abaixo" do jogador, e a escada de andares é determinística por seed.

## Por quê
O motor A (`dossie-codigo` §3) é o mais não-linear: `jeito` da profissão, bloqueio perfeito, `dmgReduction` percentual e `Math.random` na onda. Fica depois da Arena para reaproveitar o adaptador já provado.

## Símbolos donos
- `src/utils/dungeon.ts`: `PLAYER_STATS`, `playerStatsFor`, `TIER_BASE`, `buildDungeonWave` (sai o `Math.random`).
- `src/utils/nightmares.ts` › `buildNightmareWave`.
- `src/utils/energia.ts`: `pveStrikeDamage`, `pveFoeHitDamage`, `PVE_HP_SCALE`, `PVE_FOE_HP_EXTRA`.
- `src/utils/profissaoMasmorra.ts` › `jeitoDaProfissao`; `src/utils/autoDefesa.ts`.
- `src/components/games/usePveBattle.ts`, `DungeonGame.tsx`, `NightmareBattle.tsx`.

## Decisões do dono aplicadas
- §2.3 X4: o ofício, o bloqueio, o anel e a esquiva ficam fora da régua, limitados a ±25%.
- §2.3 F2: piso de 3 golpes.
- §2.6: cura e escudo calibrados por estágio.
- §2.1/§20.1: perder não custa coração.
- §2.7: os gates de andar alto ficam no PR7, e aqui **não há gate**.

## Critérios de aceite
1. `dmgReduction` vira pontos de DEF do inimigo, e a escada sobe em golpes, não em %. O teste mostra que o andar n+1 custa ≥1 golpe a mais. Amostra: andares 1..N do módulo.
2. Piso de 3 golpes. **Prova de vermelho:** inimigo com HP mínimo e ATK máximo cai com 3.
3. Cada ofício muda o TTK em no máximo ±25%. A lista de ofícios vem de `profissaoMasmorra.ts`. **Prova de vermelho:** alquimista com contra-ataque ×2 sem clamp reprova.
4. O Pesadelo passa a aplicar o mesmo caminho da Masmorra, e a divergência do "`base.dmg` cru" é resolvida e documentada no PR.
5. Duração PvE entre 20 e 29 s por inimigo (mediana, N seeds declarado).
6. Nenhum `Math.random` em `dungeon.ts`/`nightmares.ts`. Mesma seed → mesma onda.
7. Derrota não altera `hp`/corações do save. O teste existente continua verde.
8. tsc, vitest e build verdes.

## Estados de UI
Luta, especial, derrota (sem custo), empate, onda vazia (não pode ocorrer: assert), offline.

## Verificação
```
npx vitest run src/utils/dungeon src/utils/nightmares src/utils/energia src/components/games && npm run build
```

## Não-objetivos
Gates de andar (PR7), equipamento (PR8), nome do especial (PR9), recompensas da Masmorra.

## Dependências
PR3 (adaptador do motor).

## Riscos
- O bloqueio perfeito com contra-ataque (N5) conflita com o "DEF linear". Ele é tratado como modificador ≤25%. Se o dono quiser o bloqueio fora, é pergunta.
- `ROUND_CLEAR_HEAL`/`curaAndar` (N16): a cura entre lutas fica fora da régua e é declarada.
