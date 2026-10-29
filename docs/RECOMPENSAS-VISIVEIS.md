# Recompensas visíveis (29/10/2026)

Pedido do dono: antes de cada ação, ícones do que se pode ganhar; depois, o valor exato por moeda/material/XP.
Componente único: `src/components/ui/RewardPreview.tsx` (`mode="before"` = `+N` fixo, `até N`/`up to N` em faixa, só ícone se variável; `mode="after"` = valor realmente concedido). Os números vêm das funções que concedem (`bondXP`, `*_MAX_BITS`, `remainingMinigameBits`, `EMBLEMS_PER_WIN`).

| Ação | Antes | Depois | Arquivo |
|---|---|---|---|
| Minijogos da Mente (Eco, Trilha, Colcha) | sim (Bits, até N) | sim (ResultScreen: Bits exatos) | play/PlaySheets.tsx, mente/*Game.tsx |
| Salão (Match3, RPS, Dino, Barrage, Arena) | Bits "até N" já existia no texto (Match3) | sim (ResultScreen) | PlaySheets.tsx, *Game.tsx |
| Fenda (Masmorra) | sim (Bits restantes, XP até, coração) | sim (RewardLine + ResultScreen) | DungeonGame.tsx |
| Torneio | sim (XP até, Honra até) | Honra exata (ledger); XP pelo XpGainDisplay | TournamentPage.tsx |
| Pesadelo | não | sim (RewardLine bits/energia/coração) | NightmareBattle.tsx (fora do escopo: outro agente) |
| XP do Vínculo (qualquer ação) | — | sim, `+N EXP` exato após o ganho | XpGainDisplay.tsx |
| Tarefa/hábito, check-in, Feira, Oficina/Forja, Grove, missões, foco | NÃO | parcial (toasts de Bits; XP global) | lacuna |

## Lacunas
- Prévia nas tarefas/hábitos (XP = `bondXP({kind:'completion'})`), Feira, Oficina/Forja, Grove, missões, foco, Arena.
- Linha `xp` no livro "Ganhou" do ResultScreen (hoje o XP exato aparece pelo `XpGainDisplay`, após o ganho).
