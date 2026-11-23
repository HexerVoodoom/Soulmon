# Loja de Bits 🪙 — IMPLEMENTADA (chips-item, coraçõezinhos, itens de evolução, cenários)

A moeda dos minijogos são os **Bits** (`gamePoints` no GameState, cloud-synced;
ícone/nome em `utils/currency.ts`), gastos na `ShopModal`. Catálogo/efeitos em
`utils/shop.ts` + `handleShopBuy` (App.tsx).

## Ganho atual (balanceamento)

| Jogo | Bits | Observações |
|---|---|---|
| ⚔️ Masmorra | Bits por inimigo (escalam com o nível) + bônus de andar | **run = 5 andares** retrô; dificuldade do andar = base+(F−1); reset **semanal**; sem limite diário — só HP; perder custa 1 coração; ranking em `DUNGEON_BEST` |
| 🦖 Dino | floor(score/100) por corrida (score ≈ 10/s) | ~6 Bits/min de corrida boa |
| ✊ PPT | 5 por partida vencida (melhor de 5) | ~40s/partida, sorte (~50%) |

## Catálogo atual (`ShopItemKind = 'chip' | 'heart' | 'bg' | 'evo'`, preços em 🪙 Bits)

1. **Chips de atributo** (120) — **NÃO** aplicam na hora. Vão pra pastinha de
   itens (`foodInventory`, emoji 👊/🎶/🤲). Ao **usar** (como comida), dão +3 no
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


## Preço da decoração: faixas 2× / 3× / 5× (04/11/2026)

Critério em `src/utils/decorPrices.ts`: 2× textura de chão ou adereço simples; 3× móvel trabalhado ou peça com luz/movimento; 5× peça arcana/rara de vitrine. Posse é permanente. Só Bits; prêmios de Emblemas e assinatura não mudam.

| id | antes | agora | faixa | motivo |
|---|---|---|---|---|
| `furn-cauldron` | 130 | 650 | 5× | arcano, borbulha (magia ativa) |
| `furn-crystal` | 120 | 600 | 5× | cristal arcano, peça rara de vitrine |
| `furn-hourglass` | 130 | 650 | 5× | mecanismo de tempo, arte rica |
| `furn-arcade-cab` | 140 | 700 | 5× | máquina com tela/luz, peça rara |
| `furn-well` | 140 | 700 | 5× | construção de pedra grande, centro de cena |
| `furn-sofa` | 100 | 300 | 3× | móvel trabalhado |
| `furn-chair` | 120 | 360 | 3× | móvel trabalhado |
| `furn-books` | 120 | 360 | 3× | móvel com muitos detalhes |
| `furn-lamp` | 100 | 300 | 3× | luz própria |
| `furn-picture` | 130 | 390 | 3× | retrato do Soulmon, peça de parede |
| `furn-tent` | 140 | 420 | 3× | peça grande de exterior |
| `furn-campfire` | 120 | 360 | 3× | luz/fogo próprio |
| `furn-lantern` | 110 | 330 | 3× | luz própria |
| `furn-mushrooms` | 110 | 330 | 3× | bioluminescente |
| `furn-window` | 120 | 360 | 3× | peça de parede com paisagem |
| `furn-wind-chime` | 110 | 330 | 3× | peça de parede com movimento |
| `furn-clock` | 130 | 390 | 3× | mecanismo de parede |
| `furn-circuit-mat` | 140 | 420 | 3× | chão com padrão luminoso |
| `furn-rug` | 140 | 420 | 3× | chão com estampa desenhada |
| `furn-plant` | 100 | 200 | 2× | adereço simples |
| `furn-rock` | 100 | 200 | 2× | adereço simples |
| `furn-grass` | 110 | 220 | 2× | textura de chão |
| `furn-sand` | 110 | 220 | 2× | textura de chão |
| `furn-stone-tiles` | 130 | 260 | 2× | textura de chão |
| `furn-deck` | 130 | 260 | 2× | textura de chão |
| `furn-food-bowl` | 100 | 200 | 2× | adereço simples |
| `furn-garland` | 100 | 200 | 2× | adereço simples de parede |
