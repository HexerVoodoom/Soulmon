# Benchmark — Combate v3: stats lineares, crescimento diário, especiais por família, nome gerado (run `combate-v3-01`, fase 0 Discovery)

> Produzido por `alpha-benchmark`. Data de consulta de todas as fontes: **04/10/2026** (WebSearch; páginas não abertas por WebFetch, só o resumo da busca — por isso nenhuma fonte passa de 0.7).
> Escala: oficial/primária ≥0.8 · imprensa especializada ~0.6 · wiki/blog/fórum ≤0.4. Afirmação só em fontes <0.6 = `[indício]`.
> **Complementa, não refaz** `docs/BENCHMARK-COMBATE.md` (29–30/09/2026, mecânicas e Vital Bracelet em alto nível) e `docs/BENCHMARK-E-REFERENCIAS.md`. Este run cobre só: fórmula/piso de dano, crescimento por atividade, equivalência de especiais, nome procedural.

## Pergunta que este benchmark responde

Que piso de dano os jogos usam em armor subtractive e por quê (Q3), e o que já foi tentado/falhou ao igualar DoT/cura/buff a dano direto, para um modelo linear (unidade = golpe) com especial de orçamento `E`.

## Mapa de referências

| Referência | Como resolve | Fonte (URL · consulta) | Cred. |
|---|---|---|---|
| Fire Emblem (Atk − Def) | Subtractive puro. Na maioria dos jogos o mínimo é **0** (Def ≥ Atk = zero dano); em Gaiden e Genealogy o mínimo é **1** | https://fireemblemwiki.org/wiki/Template:Damage_calculations · https://game8.co/games/fire-emblem-heroes/archives/269138 · 04/10/2026 | 0.4 / 0.4 → 2 fontes, `[indício]` forte |
| Dragon Quest (Atk/2 − Def/4, versões antigas (Atk − Def/2)/2) | Subtractive com piso **probabilístico**: se Atk < 2 + Def/2 ocorre "plink": 50% de 1 de dano, 50% de falha (ataque do jogador). Variação ±1/16 | https://www.gamedeveloper.com/design/number-punchers-how-i-final-fantasy-i-and-i-dragon-quest-i-handle-combat-math (0.6) · https://dragonquestcosmos.fandom.com/wiki/Formulas (0.4) · 04/10/2026 | 0.6 |
| Pokémon (Gen 5+) | **Razão** Atk/Def dentro de fórmula, não subtração; rolagem 85–100% (16 valores). Piso de 1 de dano não confirmado na busca | https://www.smogon.com/dp/articles/damage_formula (0.6) · https://www.serebii.net/games/damage.shtml · 04/10/2026 | 0.6 |
| Darkest Dungeon (PROT, DoT) | DoT (Bleed/Blight) ignora PROT, causa dano no início do turno do alvo, ~3 turnos (5 se crit), empilha com expiração individual; morte por DoT não deixa corpo | https://darkestdungeon.wiki.gg/wiki/Damage_over_Time_(Darkest_Dungeon) · https://darkestdungeon.wiki.gg/wiki/Corpse · 04/10/2026 | 0.7 (wiki oficial) |
| Slay the Spire (Poison) | Poison ignora Block, dano = stacks, depois −1; total de n é n+(n−1)+… (30 stacks ≈ 465). Desenhado como suplemento que **cresce com luta longa**, não como dano principal | https://en.wikipedia.org/wiki/Slay_the_Spire · https://slay-the-spire.fandom.com/wiki/Deadly_Poison · fórum Steam · 04/10/2026 | 0.4 → `[indício]` |
| Hearthstone ("vanilla test") | Orçamento de stats por mana: (Atk+Vida)/custo ≈ 2 (Yeti 4/5 por 4 = (4+5−1)/2); efeitos valorados em stats (Taunt ~0,5; Battlecry ~1,5 — chute de comunidade) | https://www.hearthpwn.com/forums/hearthstone-general/general-discussion/235548-the-vanilla-test · https://hearthstone.wiki.gg/wiki/Mana_cost · 04/10/2026 | 0.3 → `[indício]`; números de efeitos são opinião de fórum, não da Blizzard |
| Vital Bracelet (fora do setor de RPG; v-pet) | Vital Points vêm de passos (**50 "Miles" = 1 ponto**, checagem a cada 3 min), batimento e vitórias; evolução por Vital, troféus, win rate, timer; **+2 HP em batalha por cada 25% da barra Vital cheia, máx +6** | https://www.manualslib.com/manual/2167153/Bandai-Digital-Monster-Vital-Bracelet.html (manual, 0.8) · https://humulos.com/digimon/vbbe/ (0.4) · 04/10/2026 | 0.8 |
| Pokémon Pikachu / Pokéwalker / GO Buddy | Já em BENCHMARK-COMBATE §C.1 (7 passos = 1 watt; Buddy +1 nível de CP). Não repetido | ver arquivo base | — |
| Borderlands (nome procedural) | Nome = [Fabricante][Tier][Modelo][Nº][Material][Prefixo][Título]. Título sai da combinação **Body+Barrel** (determinístico por peças); Prefixo = o de maior prioridade aplicável conforme peças, elemento e bônus | https://borderlands.fandom.com/wiki/Prefix · https://gamefaqs.gamespot.com/boards/942812-borderlands/51924621 · 04/10/2026 | 0.4 → `[indício]` |
| Caves of Qud (nome/história procedural) | **Gramática de substituição** (replacement grammar) para nomes de quest, diálogo e história; gera o evento primeiro e racionaliza depois | https://www.pcgworkshop.com/archive/grinblat2017subverting.pdf (paper, 0.8) · https://gdcvault.com/play/1024990/Procedurally-Generating-History-in-Caves (0.8) · 04/10/2026 | 0.8 |
| Diablo (affix), Dwarf Fortress, Habitica, Finch, Tamagotchi (crescimento) | **Não achei fonte verificável nesta rodada.** Entram na lista de lacunas | — | — |

## Paridade de mercado (custo de entrada)

- **Subtractive/aditivo existe e é padrão há décadas** (Fire Emblem, Dragon Quest, Pokémon-era antiga): jogador casual lê "mais ATK = mais dano". Ninguém usa multiplicação entre atributos em v-pet; a fórmula `hp + def − atk` não é inovação, é padrão consolidado.
- **Todo jogo com subtração trata o caso "Def ≥ Atk"** de algum modo explícito (0, 1, ou chance de 1). Deixar indefinido não é opção.
- **DoT ignora mitigação do alvo** (Darkest Dungeon: ignora PROT; Slay the Spire: ignora Block). É o jeito consolidado de fazer DoT valer algo contra defesa alta.
- **Recompensa de atividade real é discretizada e limitada**: Vital Bracelet (50 Miles = 1 ponto), Buddy (máx. 3 corações/dia, base). Ponto/dia com teto é o padrão do gênero.
- **Nome procedural = peças combinadas por regra determinística** (Borderlands) ou gramática (Qud). Ambos são reprodutíveis pela mesma seed.

## Diferencial real vs percebido

| Suposto diferencial do Soulmon | Alguém já faz? | Evidência | Veredito |
|---|---|---|---|
| Stats lineares, 1 ponto = 1 golpe | Sim, subtractive é padrão | FE/DQ acima | **paridade** |
| Orçamento único `E` em "golpes equivalentes" para família de especial (DoT/cura/buff/escudo) | Cartas fazem orçamento por mana (Hearthstone vanilla test), mas **não** achei jogo que prove paridade de *tempo para vencer* por simulação em famílias de efeito | Hearthstone [indício]; StS diz explicitamente que poison NÃO é paritário (escala com duração) | **real** (provavelmente), mas `[indício]`: ausência de achado ≠ ausência de existência |
| Ponto diário vindo do galho dominante do dia, sem punição | Vital Bracelet dá ponto por atividade, mas é sobre suor, não constância; nenhum achado de "dia ruim não tira ponto" no mesmo recorte | manual Bandai (0.8) | **real** (já no BENCHMARK-COMBATE §2.4) |
| Nome do especial gerado por personalidade+elemento+recurso | Borderlands/Qud geram nomes; nenhum achado ligando nome a **perfil psicológico do dono** | fontes acima | **real, mas barato de copiar** (ver tese) |
| Especial como "clímax 1× por luta" | Sim (já no benchmark base §5) | — | **paridade** |

## Gaps (espaço em branco) e por que estão abertos

1. **Paridade de TEMPO entre DoT/cura/buff e dano direto, provada por simulação.** Não achei jogo que a persiga como regra; o achado oposto é o design do StS (poison cresce com a duração da luta — desbalanceado de propósito). Hipótese de por que está aberto: **não importa** em jogos onde a variedade É o ponto (builds diferentes valem diferente); **é caro** em turno com decisão. No Soulmon importa porque o jogador não escolhe o golpe (idle) e o PvP é autoritativo no servidor. Teste do não-problema: passa só no PvP/idle; em PvE solo o dono pode estar sobre-resolvendo `[suposição]`.
2. **Cura com HP cheio, DoT desperdiçado na morte, overkill:** **não achei fonte verificável** sobre como cada jogo trata. Só um dado: em Darkest Dungeon a morte por DoT é regra explícita (sem corpo). Lacuna declarada; o simulador do run é a única evidência possível. Hipótese: está aberto porque cada jogo resolve ad hoc (cura só age abaixo do HP máx; DoT que sobra simplesmente some) `[suposição]`.
3. **Nome procedural acoplado a atributo mecânico** (nome muda porque o efeito é X): Borderlands acopla nome a peças que mudam stats, o mais próximo. Gap provável porque é caro de manter em escala; aqui são 6 escolas × elementos × famílias, tabela finita.

## Padrões consolidados a adotar (não divergir)

- **Piso de dano é "mínimo 1" ou 0, sem meio-termo escondido.** Opções reais: (a) 0 (FE comum), (b) 1 (FE Gaiden/Genealogy), (c) 1 com 50% de chance (DQ "plink"). Nenhuma usa piso 3.
- **Observação-chave sobre Q3:** no modelo do dono o piso está invertido em relação aos jogos. Jogos põem piso no **dano por golpe** (≥1 ponto). Em `golpes = hp + def − atk` o piso em dano equivale a um **teto de golpes** (golpes ≤ HP), e `max(1, …)` é um piso de golpes = **trava de one-shot**. Eles resolvem coisas diferentes: o piso de dano evita luta infinita/imune; o piso de golpes evita luta curta demais. Os dois são necessários e não competem. Este eixo (teto de golpes) é o que o dano-mínimo dos jogos cobre, e no modelo linear ele já é satisfeito pela própria fórmula enquanto `def − atk` não passar de ~0 abaixo de `hp`. `[suposição]`: verificar por teste que `hp + def − atk ≤ hp` nunca vira imunidade (atk=0 não existe, mínimo 1).
- **DoT ignora DEF do alvo** (Darkest Dungeon, StS). Se o DoT do Soulmon contar a DEF do inimigo, perde paridade quando a escada sobe.
- **Ganho de atividade em pontos inteiros com teto diário** (Vital Bracelet: 50 Miles = 1; Buddy: máx 3/dia). Casa com "+1 por dia que conta".
- **Nome determinístico por peças ordenadas por prioridade** (Borderlands) + gramática de substituição para variação (Qud).

## Implicações para o run

Ver bullets de resposta; resumo: Q3 deve ser separada em duas perguntas (piso de golpes × teto), DoT/escudo/cura precisam de regras escritas de overkill antes de simular, e o diferencial real é a prova por simulação, não o modelo linear.

## Limites deste retrato

- WebSearch devolveu só resumos; **nenhuma página aberta por WebFetch**. Nenhuma fonte ≥0.8 para fórmula de dano; os pisos de FE/DQ vêm de wiki/imprensa (<0.6 individual), concordância entre 2 fontes sustenta `[indício]` forte, não prova.
- **Não achei:** Diablo affix, Dwarf Fortress, Habitica/Finch/Tamagotchi (crescimento), Pokémon status (burn/poison em % do HP), Hearthstone com números oficiais, piso de 1 no Pokémon, qualquer tratamento documentado de overkill/cura em HP cheio. Valores de "efeito = X stats" do Hearthstone são opinião de fórum.
- Piso de 1 de dano de Pokémon e a razão exata do DoT percentual (1/8, 1/16 do HP) são conhecimento de catálogo `[suposição]`, não verificado.
- Recorte: EN, 04/10/2026; versões de jogos citadas podem ter mudado (Darkest Dungeon II tem sua própria página de DoT, não lida).
