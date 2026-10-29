# Recompensas visíveis (29/10/2026)

Pedido do dono: antes de cada ação, ícones do que se pode ganhar; depois, o valor exato por moeda/material/XP.
Componente único: `src/components/ui/RewardPreview.tsx` (`mode="before"` = `+N` fixo, `até N`/`up to N` em faixa, só ícone se variável; `mode="after"` = valor concedido). Os números vêm das funções que concedem (`bondXP`, `*_MAX_BITS`, `remainingMinigameBits`, `EMBLEMS_PER_WIN`, `MATCH_POINTS`). O livro "Ganhou" do `ResultScreen` ganhou a linha `xp`.

| Ação | Antes | Depois | Arquivo |
|---|---|---|---|
| Tarefa | sim: `+N XP` exato (REGISTRO §188, dono 29/10, emenda a regra de 14/10) | XP exato (XpGainDisplay) | DailyRituals.tsx |
| Hábito | sim: `até N XP` (teto do degrau tree, §188) | XP exato (XpGainDisplay) | DailyRituals.tsx |
| Check-in da manhã | sim (+10 XP) | XP (XpGainDisplay) | MorningCheckIn.tsx |
| Ateliê da Mente | sim (Bits até N) | ResultScreen Bits | play/PlaySheets.tsx |
| Fenda | sim (Bits, XP até, coração) | ResultScreen Bits + XP + itens | DungeonGame.tsx |
| Torneio | sim (XP até, Honra até) | ResultScreen Honra + XP | TournamentPage.tsx |
| Arena | sim (Bits, ícone: valor depende da run) | ResultScreen Bits | ArenaGame.tsx |
| Pedra-papel-tesoura | sim (+5 Bits) | ResultScreen Bits | RPSGame.tsx |
| Pesadelo | não | Bits/energia/coração + XP exato | NightmareBattle.tsx |
| Match3 | sim (Bits até N via RewardPreview) | ResultScreen Bits | play/PlaySheets.tsx, Match3Game.tsx |
| SoulBarrage | sim (Bits, ícone: sem teto) | ResultScreen Bits | SoulBarrage.tsx |
| Feira (Desafio) | sim (Honra e XP, ícone) | ResultScreen Honra + seiva | guild/FeiraEventoSheet.tsx |
| Foco (Oficina) | sim (material, ícone) | popup de loot existente | play/OficinaSheet.tsx |

## Lacunas
- Pesadelo (entrada): NÃO — o convite enxuto (D-69) proíbe recompensa; ela aparece depois, no fim.
- Dino (sem tela de início), Arena (Bits: sem teto derivável; só ícone), Feira Chefe, Grove (marco: XP por dias não chega à cerimônia), Forja (gasta, não paga), Missões (já têm "+1 material" em texto).
- Toasts de Bits (App.tsx): as fontes só pagam Bits; sem material/XP para somar.
- XP "depois" na Fenda/Torneio vem da tabela; o teto diário do Vínculo pode reduzir o valor real.
