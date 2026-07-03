# Loja de pontos 🎖️ — IMPLEMENTADA (chips-item, coraçõezinhos, itens de evolução, cenários)

Os minijogos da página Atividades acumulam `gamePoints` (GameState, cloud-synced),
gastos na `ShopModal`. Catálogo/efeitos em `utils/shop.ts` + `handleShopBuy` (App.tsx).

## Ganho atual (balanceamento)

| Jogo | Pontos | Observações |
|---|---|---|
| ⚔️ Masmorra | pontos por inimigo (escalam com a dificuldade) + 10 de clear | **limite 3 runs/dia**; perder custa 1 coração real; ranking em `DUNGEON_BEST` |
| 🦖 Dino | floor(score/100) por corrida (score ≈ 10/s) | ~6 pts/min de corrida boa |
| ✊ PPT | 5 por partida vencida (melhor de 5) | ~40s/partida, sorte (~50%) |

## Catálogo atual (`ShopItemKind = 'chip' | 'heart' | 'bg' | 'evo'`)

1. **Chips de atributo** (40 🎖️) — **NÃO** aplicam na hora. Vão pra pastinha de
   itens (`foodInventory`, emoji 🦠/💾/💉). Ao **usar** (como comida), dão +3 no
   atributo (`CHIP_BOOST`) e **nada mais** — sem energia. Distinguidos de comida
   por `SPECIAL_ITEMS` no `handleFeed`.
2. **Coraçãozinho** (`💗`, 60 🎖️) — vai pra pastinha; usar cura +1 HP (`HEART_HEAL`).
   Única cura de HP comprável. Também **dropa na masmorra** (máx. 2/dia).
3. **Itens de digievolução** (180–220 🎖️, estilo Digimon World 1) — equipa um
   (`equippedEvoItem`); quando o pet evolui pro nível do item E os critérios são
   cumpridos, a forma do galho é **substituída** pela artificial (Greymon/
   Garurumon/Meramon no champion; Monzaemon/Etemon no ultimate). Consumido ao
   evoluir; o próximo estágio segue o branch normal; degeneração volta pra forma
   do branch (nunca a artificial).
4. **Cenários do box** (50 🎖️) — `ownedBackgrounds`/`equippedBackground`,
   CSS em `utils/backgrounds.ts`.

## Removido

- **Emblemas** (`forcedBranch`) — removidos do catálogo e do GameState. O galho da
  evolução volta a ser 100% guiado pelos atributos acumulados (que os chips ainda
  influenciam, agora via uso na pastinha).

## Regras ao implementar mudanças

- Compras/equipados/inventário vão no GameState (cloud save; fallback `?? []`/`?? {}`).
- Bookkeeping da masmorra (dificuldade mensal, runs/dia, best, heart-drops) fica em
  localStorage via `utils/dungeon.ts`.
- Atualizar GuideModal/HelpModal e a tabela do CLAUDE.md a cada mudança de regra.
