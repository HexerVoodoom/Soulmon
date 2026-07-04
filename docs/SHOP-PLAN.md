# Loja de Bits 🪙 — IMPLEMENTADA (chips-item, coraçõezinhos, itens de evolução, cenários)

A moeda dos minijogos são os **Bits** (`gamePoints` no GameState, cloud-synced;
ícone/nome em `utils/currency.ts`), gastos na `ShopModal`. Catálogo/efeitos em
`utils/shop.ts` + `handleShopBuy` (App.tsx).

## Ganho atual (balanceamento)

| Jogo | Bits | Observações |
|---|---|---|
| ⚔️ Masmorra | Bits por inimigo (escalam com o nível) + bônus de onda | **sem limite diário** — só HP; perder custa 1 coração real; ranking em `DUNGEON_BEST` |
| 🦖 Dino | floor(score/100) por corrida (score ≈ 10/s) | ~6 Bits/min de corrida boa |
| ✊ PPT | 5 por partida vencida (melhor de 5) | ~40s/partida, sorte (~50%) |

## Catálogo atual (`ShopItemKind = 'chip' | 'heart' | 'bg' | 'evo'`, preços em 🪙 Bits)

1. **Chips de atributo** (120) — **NÃO** aplicam na hora. Vão pra pastinha de
   itens (`foodInventory`, emoji 🦠/💾/💉). Ao **usar** (como comida), dão +3 no
   atributo (`CHIP_BOOST`) e **nada mais** — sem energia. Distinguidos de comida
   por `SPECIAL_ITEMS` no `handleFeed`.
2. **Coraçãozinho** (`💗`, 150) — vai pra pastinha; usar cura +1 HP (`HEART_HEAL`).
   Única cura de HP comprável. Também **dropa na masmorra** (muito raro: 5%/inimigo,
   máx. 2/dia).
3. **Itens de digievolução** (450 champion / 600 ultimate, estilo Digimon World 1) —
   equipa um (`equippedEvoItem`); quando o pet evolui pro nível do item E os
   critérios são cumpridos, a forma do galho é **substituída** pela artificial
   (Greymon/Garurumon/Meramon/**Devimon** no champion; Monzaemon/Etemon/**Andromon**
   no ultimate). Consumido ao evoluir; o próximo estágio segue o branch normal
   (`ITEM_FORM_LEVEL` em `getNextEvolution`); degeneração volta pra forma do branch.
4. **Cenários do box** (150) — `ownedBackgrounds`/`equippedBackground`,
   CSS em `utils/backgrounds.ts`.

## Sprites (inimigos da masmorra + formas de item)

Fonte: repo **furudbat/wayland-vpets**, `assets/dmc/<Nome>.png` (strip 832×64 =
13 frames de 64×64; usamos o frame 0 → 128×128 RGBA em `src/assets/<nome>_dmc.png`).
Inimigos extras da masmorra mapeados por tier em `DUNGEON_ENEMY_TIERS` (`utils/dungeon.ts`).

## Removido

- **Emblemas** (`forcedBranch`) — removidos do catálogo e do GameState. O galho da
  evolução volta a ser 100% guiado pelos atributos acumulados (que os chips ainda
  influenciam, agora via uso na pastinha).

## Regras ao implementar mudanças

- Compras/equipados/inventário vão no GameState (cloud save; fallback `?? []`/`?? {}`).
- Bookkeeping da masmorra (dificuldade mensal, runs/dia, best, heart-drops) fica em
  localStorage via `utils/dungeon.ts`.
- Atualizar GuideModal/HelpModal e a tabela do CLAUDE.md a cada mudança de regra.
