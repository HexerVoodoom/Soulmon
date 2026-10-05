# Benchmark: lootbox/gacha com teto para equipamento (run combate-v3-01)

Coleta: 05/10/2026. 8 buscas + 5 WebFetch (nenhuma falha). Não repete `benchmark-monetizacao.md`. Sem telemetria do Soulmon: números do Soulmon são `[suposição]`.

## 1. Fontes

| # | Fonte | Data do fato | Score | Usada para |
|---|---|---|---|---|
| L1 | gamedeveloper.com, Supercell tira loot boxes do Brawl Stars (WebFetch) | 12/12/2022 | 0.6 | remoção, citação do game lead, compensação |
| L2 | Deconstructor of Fun, Brawl Stars (WebFetch) | 12/2022 | 0.65 | Credits, compra direta, receita |
| L3 | gamedeveloper.com, EA muda FIFA na Bélgica (WebFetch) | 29/01/2019 | 0.6 | Bélgica: packs só com moeda ganha |
| L4 | Planalto, Lei 15.211/2025 (só snippet) + Folha Vitória / Assis e Mendes | sancionada 17/09/2025, vigor 17/03/2026 | 0.9 (lei) / 0.5 | Brasil: proíbe caixa paga p/ menores |
| L5 | mmorpg.com sobre acordo FTC x Cognosphere (snippet) | 17/01/2025 | 0.55 | US$20 mi; odds, compra direta, <16 |
| L6 | RoyaleAPI, "RIP Chests 2025 Q1" + Supercell blog "Chest Key Changes" (snippets) | 31/03/2025 | 0.6 | CR tirou ciclo de baús e Chest Keys |
| L7 | Sites de pity (pitycalculator.com, gachapity.com, buffget) | 2026 | 0.35 | Genshin 74/90, 50/50, Capturing Radiance `[indício]` |
| L8 | shattered.io / GachaWiki sobre odds | 09/2026 | 0.35 | China exige odds desde 01/05/2017 `[indício]` |
| L9 | Operation Sports, Brasil x EA FC (WebFetch) | 2026 | 0.5 | EA FC deve ir a compra direta/preview |

## 2. Achados

- **Clash Royale: sua premissa está só parcial.** Não achei "removeu os baús pagos em 2024". Achei: Chest Keys saíram do Pass/loja (a partir de jan/2025, fim em mar/2025) e em 31/03/2025 acabou o ciclo de baús por vitória, trocado por Lucky Chests (L6). Baú Lendário ainda se compra por 500 gemas. Classificar como "reduziu", não "removeu".
- **Brawl Stars: confirmado.** Caixas removidas em 12/12/2022 (L1), trocadas por Starr Road com Credits e compra direta: "no more probabilities, no more random rewards" (L1). Compensou jogadores com 80 gemas (US$4,99). Receita: pico curto, depois "wear off" no iOS (L2). Caixas voltaram em jun/2024 como versão reformulada com aleatoriedade (busca, Fandom, score 0.3 `[indício]`). Leitura: remoção não foi irreversível.
- **Pity/garantia (Genshin)**: soft pity ~74, hard 90, 50/50 e garantia após perder; Capturing Radiance desde v5.0 faz 3 perdas seguidas serem impossíveis (L7, `[indício]`). Padrão: o teto de azar é um número publicado.
- **Moeda ganha × paga**: Bélgica (jan/2019) aceitou FIFA com packs comprados só por moeda ganha, e EA parou de vender FIFA Points no país (L3). Brasil proíbe caixa **paga** com conteúdo aleatório para menores, a lei foca em "mediante pagamento" (L4, L9). Se moeda ganha cobre caixa, é o desenho de menor risco; se Créditos entram, caixa vira "paga".
- **Odds e compra direta**: acordo FTC (jan/2025) exige odds, opção de compra direta com dinheiro real e preço claro da moeda (L5). China exige odds desde 2017 (L8). Apple/Google também exigem odds `[suposição, não verificado nesta rodada]`.
- **Reguladores, resumo**: Bélgica (2018-19) tratou como jogo de azar; Holanda multou EA em 2019 e a multa foi revertida em tribunal (L9, `[indício]`); Brasil vigora desde 17/03/2026, multa até 10% do faturamento ou R$50 mi, fiscaliza a ANPD (L4); EUA/FTC US$20 mi (L5). Soulmon: lei brasileira alcança jogo "acessível por menores"; classificação etária do Soulmon é lacuna.
- **Marvel Snap e Pokémon GO**: não vendem caixa de poder (cartas/IV por jogo; ver benchmark-monetizacao F2/F10). Não investiguei FC pós-2026 (lacuna).
- **Teto de gasto**: nenhuma fonte achada com teto diário de gasto em caixa (a "Infinity Nikki US$36 cap" de L8 é só snippet). Teto diário +25% é desenho próprio, sem precedente direto `[suposição]`.
- **Reação da comunidade**: remoção de caixa foi lida como dark pattern/regulação e divisiva (L2); Capturing Radiance e pity foram bem recebidos `[indício]`. Reação a caixa **paga de equipamento com poder** (FIFA) é historicamente a pior (Holanda/Bélgica), sem número novo aqui.

## 3. Três desenhos para o Soulmon (equipamento, ~5% de teto global)

| | (A) Caixa só moeda ganha + odds + pity | (B) Caixa comprável com Créditos, teto diário +25%, pity | (C) Sem caixa: loja direta / fragmentos |
|---|---|---|---|
| Mecânica | Bits ganhos abrem caixa; odds visíveis; pity duro (ex.: raro garantido em N) `[N a calibrar]` | Igual a A, mas Créditos convertem em Bits até +25% do grátis/dia; pity compartilhado | Equipamento = fragmentos ganhos por atividade; craft direto; Créditos compram só cosmético ou +25% de fragmentos/dia |
| Risco P2W | Baixo: dinheiro não entra | Médio-alto: dinheiro compra tentativas de item com %, e a aleatoriedade vira "paga" (Brasil, Bélgica, FTC). Pity limita a variância, não o gasto | Mínimo: sem sorte, tetos de 5% sempre alcançáveis; +25% de fragmentos é aceleração visível e previsível |
| Risco regulatório | Baixo (nada pago) | Alto: caixa paga aleatória; exige odds, gate etário, possível bloqueio BR | Mínimo |
| Custo de implementação | Médio: tabela de drop, RNG com seed no servidor (paridade `_duel.js`), pity persistido no save + saneamento + teste de contagem de campos, UI de odds | Alto: A + conversão, teto diário no servidor, antifraude, textos legais, verificação de idade | Baixo-médio: contador de fragmentos, receitas, sem RNG de drop; menos campos de save |
| Linha vermelha | Passa | Fere "Créditos não compram atributo" no limite; fere `copy.semFomo` (caixa + teto diário = pressão) | Passa |
| Evidência | Bélgica/FIFA (L3) | Nenhuma de peso a favor | Brawl Stars (L1, L2), exigência FTC de compra direta (L5) |

## 4. Recomendação e tese

- **Recomendo (C) como base; (A) só se o dono quiser emoção de sorte.** Evitar (B): é o único desenho que junta dinheiro + aleatoriedade + poder, o trio que os reguladores citados atacaram.
- Se houver caixa, pity duro e odds exibidas são obrigatórios; o item "raro" nunca ultrapassa o teto de ~5%.
- Tese: "equipamento por esforço real, com garantia numérica visível e sem sorte paga". Cópia em 3 meses: fácil de copiar tecnicamente; o que protege é a linha vermelha de marca, não o mecanismo `[suposição]`.
- Gap "ninguém em hábito/pet vende caixa de poder" provavelmente é "arriscado" e "não importa" (Finch, Habitica não têm PvP).

## 5. Limitações

- Clash Royale 2024: não confirmado (ver §2). Brawl Stars retorno 2024: só indício.
- Fontes de pity/odds (L7, L8) são sites de calculadora/terceiros, score 0.35: sustentam só `[indício]`. Não consultei fonte oficial de HoYoverse nem a FTC direto.
- Lei 15.211: li snippets e imprensa; o texto do Planalto não foi aberto. Parecer jurídico é do dono (sem jurídico separado).
- Holanda/Reino Unido/Apple/Google: sem fonte primária. FC/FIFA após 2026 e Marvel Snap/Pokémon GO sem busca nova.
- Todo número do Soulmon (+25%, pity N, 5%) é `[suposição]` a calibrar por simulação.
