# Benchmark — Progressão: level/XP, conta × criatura, talentos, normalização PvP, moeda (run `combate-v3-01`, Discovery reaberta §2.7)

> Produzido por `alpha-benchmark`. Consulta: **05/10/2026**. Escala: oficial ≥0.8 · imprensa/Wikipedia ~0.6-0.7 · wiki de fã/blog/fórum ≤0.4. Afirmação só em fontes <0.6 = `[indício]`.
> Não repete `benchmark.md` (fórmula de dano, DoT, nome procedural). WebFetch falhou (403/402/404/Anubis) em Bulbapedia, Habitica wiki, PoE wiki, Fandom Genshin; abertos de fato: GW2 wiki, Wikipedia (PoE, Pokémon GO), Smogon. O resto vem de **resumo de WebSearch** (página não aberta) e por isso é marcado.

## Pergunta
Como pet/idle/hábitos/gacha estruturam (1) XP→level com teto, (2) conta × criatura e gates, (3) talentos escassos e normalização PvP, (4) equipamento e moeda ganha × paga sem P2W; e o que isso implica para ~5% de vantagem, PvP normalizado e moeda.

## Mapa de referências

| Referência | Como resolve | Fonte (URL · 05/10/2026) | Cred. |
|---|---|---|---|
| Pokémon (obediência por insígnia) | Teto de level por marco narrativo: 1 insígnia ≤25, +5 por insígnia, 6 → 50, 7 → 55, 8 → sem teto. O teto **não bloqueia XP**: só nega obediência (Pokémon "de fora") | https://bulbapedia.bulbagarden.net/wiki/Obedience (só via resumo de busca) · gamerant/game8 | 0.5 `[indício]` forte (3 fontes concordam) |
| Pokémon VGC (level 50) | Todo Pokémon é auto-nivelado a 50 em VGC/Battle Stadium; o level da criatura deixa de importar no competitivo | https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-vg-rules-formats-and-penalty-guidelines-en.pdf (PDF oficial, só aparece na busca; não aberto) | 0.8 pela origem, 0.6 por não aberto |
| GW2 sPvP | Level sobe a 80; atributos do PvE ignorados; "equipment attributes are normalized"; jogador escolhe runa, sigilo, amuleto e especializações num painel de PvP separado | https://wiki.guildwars2.com/wiki/Structured_PvP (aberto) | 0.7 |
| Pokémon GO (conta) | Trainer level por XP; teto 40 → 50 (30/11/2020) → 80 (15/10/2025). PokéCoins ganhas por tempo de defesa de ginásio **ou** compradas; compradas pagam itens de conveniência (Incense, Lure, Lucky Egg). Receita ~US$6,46 bi até 2020 | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Go (aberto) | 0.7 |
| Genshin (Adventure Rank) | AR (conta) separado dos personagens. World Level sobe em AR 20/25/30/35/40/45/50/55/58 (inimigos mais fortes, drop melhor). Daily Commissions só a partir do AR 12; ~1.000 EXP/dia limitado | https://genshinbox.com/wiki/basic/adventure-rank/ · https://gamewith.net/genshin-impact/article/show/22284 (resumo de busca) | 0.4 `[indício]` |
| Habitica | Stat points param em **100** (level 100); bônus de level = ½ nível, máx 50; Perfect Day dá buff ½ nível, máx 50; passar do 100 não dá stat. Gems: dinheiro real, ou assinatura + 20 gold/gem, ou desafios; "não é pay-to-win: itens de gems não dão vantagem de stat" | https://habitica.fandom.com/wiki/Character_Stats · https://habitica.fandom.com/wiki/Gems (só resumo) · issue #6021 (jogadores reclamam de subir além de 100 sem benefício) | 0.4 `[indício]` |
| Path of Exile | Árvore com 2.268 passivos; monetização "ética", só cosmético; moeda é escambo (itens com uso próprio) | https://en.wikipedia.org/wiki/Path_of_Exile (aberto) | 0.7 |
| Last Epoch | 113 pontos passivos no total (1 por level a partir do 3 + até 15 de quests). Respec por ouro, um ponto por vez, custo cresce com investimento, barato fora do início | https://maxroll.gg/last-epoch/resources/respec-guide · https://dving.net/guides/last-epoch/passives-and-skills (resumo) | 0.5 |
| Monster Rancher | Criatura com vida finita (~4 anos), 4 fases (infância, adolescência, adulto, velhice); ganho de stat por treino cai na velhice (6–9 no adulto → mínimo); teto de stat por rank (E 1140 … A 3650, S sem teto) | https://legendcup.com/faq-mr4monsterlifetypes.php · https://gamefaqs.gamespot.com/ps2/914760-monster-rancher-4/faqs/77769/raising-monsters (resumo) | 0.4 `[indício]` |
| Neopets | Comunidade reclama de "pay-to-win" quando NC Mall (pago) recebe o foco, cosmético atrás de paywall, anúncios para assinante | https://www.virtualpetlist.com/threads/has-neopets-been-reduced-to-just-a-pay-to-win-game.3132/ | 0.3 `[indício]` |
| Monster Hunter Now | "Mais P2W e comunidade menor" que alternativas (citação de blog) | https://bitletics.com/blog/games-like-pokemon-go/ | 0.3 `[indício]` fraco |

## Paridade de mercado (custo de entrada)

- **Teto separado do XP**: o teto não impede ganhar XP, só limita o efeito (Pokémon: desobediência; Habitica: stat para em 100; Monster Rancher: teto por rank). Teto "duro sem consequência de uso" é o padrão.
- **Conta ≠ criatura**: PoGO trainer level, Genshin AR, Habitica level do usuário. A conta nunca regride; a criatura pode ser trocada.
- **Gates na conta liberam conteúdo, não poder bruto direto**: Genshin AR abre World Level e comissões; Pokémon abre áreas por insígnia.
- **PvP competitivo normaliza level**: GW2 (80 fixo + atributos normalizados), VGC (50 fixo). Nenhum dos dois deixa progressão de PvE entrar em PvP.
- **Moeda paga com versão ganhável OU cosmético/conveniência**: PoE (só cosmético), Habitica (gems sem stat, gold→gem via assinatura), PoGO (coin ganha em ginásio).
- **Respec barato**: Last Epoch cobra ouro pequeno; árvore com pontos < nós é o padrão (113 pontos vs 2.268 nós no PoE, só como ordem de grandeza).

## Diferencial real vs percebido

| Suposto diferencial | Alguém já faz? | Veredito |
|---|---|---|
| Level de conta separado, gate de PvP/Torneio | Genshin AR, PoGO | **paridade** |
| Teto de level por estágio de evolução preso a hábito real | Pokémon (insígnia = progresso narrativo) e Monster Rancher (fase de vida) fazem teto por marco; **não achei** teto preso a atividade real do usuário | **real** `[indício]` |
| Criatura regride por degeneração, usuário não | Monster Rancher envelhece, mas por tempo, sem regressão por falta de hábito; Habitica tira HP por Daily falha (punição, contraria `semFomo`) | **real**, com risco: precedente é punitivo |
| Árvore de talentos do jogador com pontos < nós | PoE, Last Epoch, WoW | **paridade** |
| PvP com stats do jogador normalizados | GW2, VGC | **paridade** |
| Pontos de talento só do level de conta e nunca vantagem em PvP | Habitica já faz "nada pago dá stat"; árvore PvP+normalização juntas, em v-pet, **não achei** | **real** `[indício]` |

## Gaps e por que podem estar abertos

- **Teto por estágio ligado a atividade real**: aberto porque a maioria dos pet games usa tempo ou gasto de dinheiro; hipótese: não importa a quem monetiza. Para produtividade, importa.
- **Moeda ganha comprando poder em jogo sem P2W**: quase ninguém tem. Hipótese: é **proibido pela própria receita** (PoGO e Genshin vendem conveniência/poder). Habitica resolve com "pago = cosmético".

## Padrões a adotar (não divergir)

- Level define o total e tem teto; passar do teto ou do estágio vira **cosmético/neutro**, não stat (Habitica #6021 mostra o custo de level sem benefício: queixa de jogador).
- PvP **normalizado por regra fixa** (GW2: tudo sobe a um nível-alvo, escolhas num painel próprio). Num v-pet, o análogo é o level do Soulmon e os stats base serem fixados por estágio no Torneio, e só **escolhas** (talentos de playstyle, equipamento por slot) entrarem.
- Respec barato e gratuito fora de torneio (Last Epoch), para theory crafting sem punição.
- Moeda paga só cosmética/conveniência; moeda ganha pode comprar equipamento **se** o equipamento for também obtido jogando (PoE: escambo; Habitica: gold→gem só com assinatura).

## Implicações para o run

- **~5% de vantagem**: nenhum benchmark aberto usa vantagem numérica pequena em PvP **normalizado**; GW2 e VGC eliminam a diferença. Se o dono quiser ~5%, vale só PvE/Comércio; em PvP, talento deve **mudar escolha** (ex.: trocar tipo de especial) e não número. Isso resolve o conflito 2 sem tocar a linha vermelha. `[suposição]` a confirmar com o dono.
- **PvP normalizado**: fixar level-alvo por estágio no Torneio e ignorar pontos do level de conta. Paridade cliente/servidor fica mais fácil (menos campos para clampar em `_duel.js`).
- **Moeda**: Créditos podem comprar equipamento só se for o mesmo item obtível jogando e **nunca** entrando em PvP normalizado; senão é P2W aos olhos da comunidade (Neopets, MH Now: `[indício]`). Conflito 1 continua do dono.

## Adendo (05/10/2026, segunda coleta)
- **WoW (preenche lacuna)**: Legion exigia honra para talentos PvP, novato ficava em desvantagem; BFA (patch 8.0.1, 17/07/2018) liberou por level, máx. 3 escolhidos. Fonte: https://worldofwarcraft.blizzard.com/en-us/news/21901729 (oficial, só resumo de busca) · https://www.wowhead.com/news=284323/pvp-talent-changes-in-battle-for-azeroth (0.6). Lição: talento PvP preso a grind foi revertido pela própria Blizzard.
- **Habitica gems**: assinante compra gem a 20 ouro, cap 24/mês, +2 por mês até 50 (https://habitica.fandom.com/wiki/Gems, resumo de busca, 0.4 `[indício]`). Moeda ganha vira paga com teto mensal.
- **Pokémon GO**: nível do Pokémon limitado a treinador+10 (https://pokemongo.fandom.com/wiki/Combat_Power, 0.4 `[indício]`); gates: nível 5 times/raids, 10 troca/batalha.
- **Genshin**: reação a P2W concentrada no banner de arma (gacha de poder), não na moeda dupla; pior caso US$356,40 por 5 estrelas garantido (shattered.io, 0.3 `[indício]`).

## Limites
- 6 de 11 referências vieram só de resumo de busca (cred. ≤0.5). Bulbapedia, Habitica wiki, PoE wiki e Genshin wiki bloqueadas. Nada sobre WoW templates, Melvor, Idle Champions, Finch, Tamagotchi-likes, Digimon (lacunas; não achei fonte aberta nesta rodada).
- Sem dados de reação da comunidade a P2W em pet games além de Neopets (fórum). Genshin/PoGO: números de monetização não verificados em fonte primária.
- Pokémon GO cap 80 (15/10/2025) vem só da Wikipedia (`[indício]` até checar fonte Niantic).
