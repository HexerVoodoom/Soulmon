# F — Conteúdo de longo prazo D30–D90 (fatos + contas)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.
## Bits — fontes
Funil único App.tsx handleEarnGamePoints (~2477) com minigameMultiplier (petNeeds.ts). Dino: DinoGame.tsx:187 floor(score/100), sem cap. PPT: RPSGame.tsx:33 MATCH_POINTS=5, sem cap. Masmorra: dungeon.ts TIER_BASE baby-i 2/baby-ii 3/rookie 4/champion 6/ultimate 9/mega 13 = 37/andar nível 1; ptsMult=1+0.12*(level-1) (buildDungeonWave); clearBonus DungeonGame.tsx:49 = 10+5*(f-1) → 100/run; sem cap de runs (dungeon.ts:439). Pesadelos nightmares.ts:124 REWARD_TABLE 4/7/11, NIGHTMARES_PER_NIGHT=1 (:101), App.tsx:3104. Presentes community.js:636 20 Bits 1×/dia/amigo, teto 5 amigos (:608) → 100/dia. Câmbio CREDIT_TO_BITS=10 (currencies.ts:138), BITS_EXCHANGE, App.tsx:2545.
## Bits — sumidouros (shop.ts)
SHOP_ITEMS 57 itens = 9.050 Bits: chip×3=360 (consumível, CHIP_BOOST=3 :49), heart×1=150 (HEART_HEAL=1 :50), furniture×27=3.230, bg×26=5.310 (bg-room preço 0). **Permanente finito = 53 itens = 8.540 Bits**; 6 travados por missão (300 cada = 1.800; missions.ts isShopItemUnlocked). TOURNAMENT_ITEMS 8 = 245 Emblemas. ALL_SHOP_ITEMS shop.ts:412. MISSIONS não dão Bits.
Contas (1 run/dia, base f-1: DungeonGame.tsx:332): run1 327, run2 349, run3 370, run4 394, run5 417, run6 439, run7 462. Só masmorra com reset semanal: 8.540 em **22 dias**. Dia realista (run + Dino ~4 + PPT 10-15 + pesadelo 4-11) ≈ 360–470/dia → **D19–D23**; com 5 amigos **D15–D18**. Depois só consumíveis.
## Masmorra
MAX_FLOORS=5 (DungeonGame.tsx:44, local, não exportada). LADDER_TIERS (dungeon.ts:437) fixa baby-i→mega. buildDungeonWave (:468): hpMult 1+.14s, atkMult 1+.2s, dmgReduction min(.72,.11s) satura step 7, speedBump min(.5,.05s) satura step 10, ptsMult 1+.12s. getDungeonDifficulty (:507) {week,level} em DUNGEON_DIFFICULTY, volta a 1 toda semana (weekKey :498); setDungeonDifficultyAtLeast(base+1) em DungeonGame.tsx:311. DUNGEON_BEST (:526-535) local, só max, não sincroniza. Glitchtama GLITCHTAMA_EMOJI shop.ts:72, drop DungeonGame.tsx:312, "deliberately NOT sold" shop.ts:125, usa → perfectDays+1 (specialItemUse.ts:113). HEART_DROP_CHANCE .05, HEART_DROP_DAILY_CAP 2 (:441-442). **Nada escala além**: sem andar 6+, sem inimigo além de mega, sem endless. BOND_DAILY_CAP.dungeon=120 (bond.ts:137) bate com ~1 run+1 andar.
## Torneio
tournamentSeason.ts ROUND_START_DAY=5, ROUND_LENGTH_DAYS=3; janela é só texto. tournamentTiers.ts TOURNAMENT_TIERS Semente 0/Broto 100/Guardião 300/Ancião 700/Lendário 1500 (topo; next null). community.js:505 vitória +20/derrota −8; MATCHES_PER_DAY=5 (:39); power() (:496) = nível×10 + atributos + random*18 (dado ponderado, não partida jogável). Lendário em ~50 dias a 50% / ~15 só vitórias. EMBLEMS_PER_WIN=3/LOSS=1 (currencies.ts:148); App.tsx:4589. 245 Emblemas → ~25 dias (50%) / ~17 (só vitórias). Depois: rank + season YYYY-MM (community.js:6), closeSeason (:549) troféu top-3 → vitrines. Sem item/faixa/modo novo. BOND_DAILY_CAP.tournament=60.
## Evolução (progression.ts FORM_REQUIREMENTS)
rookie required 4 cap 6 daysToEvolve 10 · champion 5/7/20 · ultimate 5/8/30 · mega 6/9/40 · ultra 6/10/999.
**daysToEvolve É DADO MORTO**: gate real usa .required — App.tsx:2207-2208 handleEvolve `if (prev.perfectDays < req)`, :4018/:4021-4022 canEvolve. Grep: só progression.ts e progression.test.ts (:64-67 documenta que zerar deixou 829 testes verdes). **Dias perfeitos reais por evolução: 4/5/5/6.** Mega em **14 dias perfeitos**.
5 estágios; AVAILABLE_BRANCHES virus/data/vaccine (:824); 11 formas (EvolutionPath.tsx:80, GameStateContext.tsx:196, oracle.test.ts:200). **Ultra exige os 3 megas** (getNextEvolution dailyReset.ts:86-89 ALL_ATTRS.every mega-*) — como mega→mega não existe, único caminho é DEGENERAÇÃO (getPreviousForm :96, chamada :664 HP=0): 14+5+5+6 = 30 dias perfeitos + 2 degenerações provocadas (~8 dias perdendo HP com MAX_HEARTS_LOST_PER_DAY=1, HP máx 4) ≈ **D38+, por caminho que o jogo não explica**. Pós-ultra: NADA (dailyReset.ts:90, EVOLVE_SEGMENTS.ultra=999 App.tsx:97). MANUAL_EVOLUTION=true (:832), EvolutionCeremony.tsx. MAX_STAGE_REQUIREMENT=6 (:740).
## Sonhos/missões/coleção
DREAM_CATALOG restWindow.ts:371 = 30 (18 base 8c/6r/4l + 12 sazonais :408-425); DREAMS_BY_RARITY :428; progresso :558-560. DreamDex.tsx = única dex completa (contagem :279).
seasons.ts SEASONS (:97): sprout 2026-03-01→05-31, ember 06-01→08-31, tide 09-01→11-30, starlit 2026-12-01→2027-02-27. **Tabela termina 2027-02-27; currentSeason() devolve null depois.** SEASON_PATHS (:329): 20 dias perfeitos OU 5 runs OU 15 noites → medalha; 5 runs = 5 dias fecha a medalha trimestral.
MISSIONS (missions.ts): 6 alvo único não repetíveis (champion, mega, kills-100, runs-3, dino-1000, perfect-30) → só destravam compra dos 6 bg 300. Sem missão diária/semanal.
Formas vividas: unlockedEvolutions[] renderizado em EvolutionPath.tsx:197, EvoTrail.tsx:49, PetPage.tsx:205, StatsPage.tsx:199 — sem tela "álbum". spriteLibrary.ts = storage de sprites IA (SPRITE_FORM_ATTEMPT_CAP 3, MANUAL_RETRY_CAP 3, COOLDOWN 60s), máx 11 formas, não cresce.
**Bestiário: NÃO EXISTE** — e ⚠️ **a premissa do 'roster de 60' era FALSA** (corrigido em 02/09/2026, WP4.9): `LEGACY_FORM_TIERS` tem UM uso (`LEGACY_LEVEL_OF`, nível de save antigo); `getDungeonEnemySprite` (sprites.ts:61) sorteia de `DUNGEON_LINE_SPRITES` = 6 linhas × 4 artes, 6 nomes. Não há registro do enfrentado (isso segue verdadeiro). `loadBestiaryPool` (arena.ts:243) alimenta combate, não dex.
## Vínculo (bond.ts)
XP :54-75 (XP_PER_EFFORT 10, PERFECT_DAY 50, REST_NIGHT 15, NEW_DREAM 25, NIGHTMARE 10, DUNGEON_FLOOR 10, DUNGEON_RUN 60, TOURNAMENT_WIN 15/LOSS 8, TRIAGE 30, CHECK_IN 10, MILESTONE 100/200/400). BOND_DAILY_CAP :137 só dungeon 120/tournament 60. Curva :245-253 sem cap de nível. BOND_REWARDS :355 = 12 (L2–L13); **bondRewardFor null ≥ L14**; BOND_TITLES :337 para no 13. **9 das 12 recompensas são itens que a loja já vende** (furn-plant 100, bg-forest 150, furn-picture 130, bg-sakura 180, furn-rug 140) → duplicatas para quem esvaziou a loja. L13 = 6.700 XP ≈ **D25–D35**; depois nível sobe e não entrega nada. BOND_PVP_MIN_LEVEL=5 (:475), "todo destrave social futuro reusa ESTE nível" (:472). L5 em D5–D8.
## Social
community.ts: listPlayers/getPlayer (:70,:76), pushProfile (:62), addFriend/removeFriend (:96,:98) teto 5, sendGift/getGifts (:101,:103) 20 Bits 1×/dia/amigo (única mecânica social recorrente), getOpponents/playMatch (:80,:87) MATCHES_PER_DAY 5, getRank/getSeasonResult (:91,:93) top-50, top-3 troféu via closeSeason adminKey. LibraryPage.tsx = superfície social inteira. NÃO: guilda, chat, co-op, evento coletivo, troca, visita ao box.
## Síntese
| sistema | esgota | resta |
| Bits (53 itens 8.540) | D15–D23 | consumíveis |
| Missões (6) | ~D30 | nada |
| Masmorra | fixa desde D1 | dificuldade que zera + best local |
| Torneio (8 itens) | D17–D25 | rank até 1500 + troféu mensal |
| Evolução (11) | mega 14 dias perfeitos; ultra ~30 + 2 degenerações | nada pós-ultra |
| Sonhos (30) | 18 base + 3/trimestre | sazonais expiram 2027-02-27 |
| Medalha estação | 5 runs = 5 dias | 1/trimestre |
| Vínculo (12 rec.) | D25–D35 | níveis infinitos sem recompensa |
| Social | PvP L5 (D5–D8) | 5 dados/dia + 20 Bits/amigo |
3 buracos com símbolo: daysToEvolve morto (progression.ts vs App.tsx:2208); bondRewardFor null ≥14; SEASONS termina 2027-02-27. (O 4º, 'roster de 60 invisível', era falso — ver acima.)
