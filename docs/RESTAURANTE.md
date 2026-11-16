# 🍲 Restaurante do Mercado (05/11/2026)

Etiqueta: **vivo**. Dono da regra: `src/utils/restaurant.ts` (estado: `src/utils/restaurantState.ts`; textos: `src/utils/restaurantCopy.ts`;
tela: `src/components/mercado/RestauranteSheet.tsx`). Régua: `src/utils/restaurant.test.ts`. Números são **defaults propostos — o dono decide**.

## Regra
- Lote `mercado:restaurante` (fora dos portões, sem Vínculo mínimo, como o Cambista).
- **Chefs por dia do jogador**: seg/qua/sex **Snapjaw** (planta carnívora) · ter/qui/sáb **Caldo** (o cozinheirinho) · domingo os dois, cardápio inteiro. **Na tela (15/11/2026, §396):** o busto e a fala são os do chef do dia; no domingo os dois lado a lado e dois botões de chef na folha. Missão semanal `cook-dish` conta cada prato cozinhado.
- Todo prato custa **2–3 comidas da pastinha + 1 extra (essência OU material de prédio) + 15–60 Bits** (energia ×1,5 desde 16/11/2026, REGISTRO §453) e, **ao ser USADO da pastinha**, **enche a fome até o máximo** (`hunger.ts › eat`).
- **16/11/2026 (dono, REGISTRO §455): cozinhar NÃO serve o prato na hora.** O prato vira item da pastinha (`foodInventory['dish:<id>']`, `src/utils/dishItems.ts`, kind `dish` em `SPECIAL_ITEMS`), junto com as comidas; abre o modal "Prato feito" (`PratoFeito.tsx`, molde de `PocaoCriada`, agrupa ×N). Usar da pastinha passa pela porta única `specialItemUse.ts › applySpecialItem` → `serveDish` (fome cheia + efeito). A pastinha não tem teto: não há recusa por "cheia". **A Feira de verdade (`applyFeiraDish`) também guarda** (16/11/2026, REGISTRO §456): debita o preço da oferta, soma `dish:<id>` em Files e abre o mesmo `PratoFeito` ("Comprado!/Bought!"); não usa chef nem teto diário de pratos; a missão/contagem da Feira segue em `applyFeiraLojaBuy`. O servidor só valida a oferta (1 por item): sem paridade a mudar. A pasta aparece como **Files/Arquivos** e os pratos como `<nome>.exe` (ex.: "Dew Tea.exe", "Chá de Orvalho.exe").
- Benefício (ao usar): energia na hora **ou** buff de 24 h (um buff por vez; o novo substitui). Máx. **2 pratos por dia** (`DISHES_PER_DAY`).
- Buff de **combate** (+2% ATK/DEF/SPD): entra pelo canal único `combinedAttrBonus` (teto 5% somando tudo), vale só no **PvE local**
  (Fenda, Arena, Pesadelo) — Duelo/Torneio/Guerra são do servidor e não o veem. Pede **material** (não se compra) e **Bits ganhos** (`earnedBits`).
- Buff de **regeneração** (+25%/+40%): `hunger.ts › regenPoints` com `RegenBoost`, só dentro da janela `from..until` (aditivo; timer projeta a janela).

## Cardápio
| Chef | Prato | Comidas | Extra | Bits | Efeito |
|---|---|---|---|---|---|
| Snapjaw | Salada Viva | 🥗2 🧃1 | 2 essência Planta | 20 | regen +25% 24 h |
| Snapjaw | Chá de Orvalho | ☕1 🧃1 | 2 essência Água | 23 (era 15) | +2 energia |
| Snapjaw | Tigela do Bosque | 🍚2 🍎1 | 3 essência Vida | 30 | regen +40% 24 h |
| Snapjaw | Espetinho de Vinha | 🥩2 🥗1 | 1 Presa | 30 | +2% ATK 24 h |
| Snapjaw | Sopa de Raiz | 🥗1 🍚1 🥩1 | 1 Musgo | 30 | +2% DEF 24 h |
| Snapjaw | Mordida da Flor | 🍭1 🍎1 🥗1 | 1 Louro | 35 | +2% SPD 24 h |
| Caldo | Pão de Faísca | 🍚1 ☕1 | 2 essência Eletricidade | 23 (era 15) | +2 energia |
| Caldo | Ensopado do Caldeirão | 🥩1 🥗1 🍚1 | 3 essência Arcano | 60 (era 40) | +3 energia |
| Caldo | Torta de Mel Lunar | 🍭2 🍎1 | 2 essência Luz | 20 | regen +25% 24 h |
| Caldo | Caldo de Brasa | 🥩2 🍚1 | 1 Faísca | 30 | +2% ATK 24 h |
| Caldo | Pizza Casca de Ferro | 🍕2 🥩1 | 1 Minério | 30 | +2% DEF 24 h |
| Caldo | Pudim de Névoa | 🍭1 🧃1 🍎1 | 1 Penugem | 35 | +2% SPD 24 h |

## Save e rollback
Campo novo `GameState.restaurant {buff?, day?, count?}` — leitura tolerante (`sanitizeRestaurant` no `hydrateSave`, idempotente).
O servidor não sanitiza o campo (é só cliente; o buff não entra em PvP). Rollback: reverter o código; o campo fica no save e é ignorado.
