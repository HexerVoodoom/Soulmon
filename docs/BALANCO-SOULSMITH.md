# Balanço do Soulsmith — tempo até o máximo (11/10/2026)

> **Etiqueta:** vivo · **Dono:** `src/utils/forge.ts` (tabelas) · **Régua:** `src/utils/forge.tempo.test.ts` (a simulação) + `functions/api/forge.parity.test.js` (espelho) · **Decisão:** `REGISTRO-DE-DECISOES.md` §26.1

**Pedido do dono (11/10/2026):** "está fácil de upar. Aumente a quantidade de níveis e os custos; tem de levar tempo para colocar tudo no máximo. Mesmo depois do nível ultra o jogador ainda não terá todos os itens no máximo."

## O que mudou

| | Antes (07/10) | Agora |
|---|---|---|
| Níveis por peça | 5 | **15** |
| Ganho por nível | 0,3 / 0,2 / 0,3 / 0,3 / 0,4 % | **0,1 %** cada |
| Máximo de UMA peça | 1,5 % (30 % do teto) | **1,5 %** — o mesmo; três peças = 4,5 % |
| Material do prédio de origem, total por peça | 10 | **98** |
| Material de apoio, total por peça | 6 | **56** |
| Vínculo exigido no último nível | 5 | **10** (~3.700 XP; **não** é o que segura o ritmo) |

O **teto** não se mexe (CLAUDE.md, teto único de 5 %, `combinedAttrBonus`): mais níveis são degraus menores, não mais força. Só **Bits ganhos** e **materiais** — nada de dinheiro real, nada de sorteio.

## Por que o material é o relógio

Cada prédio paga **1 material por dia** (`MATERIAL_PER_QUEST`), e uma peça de tier 3 pede o material do **seu** prédio de origem (ex.: Torneio → Louro). Os três slots usam materiais **diferentes** e correm em paralelo, então o tempo até o máximo ≈ o total de UM material (98) ÷ 1 por dia. Custos por nível (`UPGRADE_COST`, `[origem, apoio]`):

`2:[2,0] 3:[3,1] 4:[3,1] 5:[4,2] 6:[5,2] 7:[5,3] 8:[6,3] 9:[7,4] 10:[8,5] 11:[9,5] 12:[10,6] 13:[11,7] 14:[12,8] 15:[13,9]` — o maior custo de um nível (13) cabe no teto de estoque (99).

## Simulação (`SOULSMITH_TABELA=1 npx vitest run src/utils/forge.tempo.test.ts`)

Dia a dia, com as funções reais: o jogador resgata a missão de cada prédio aberto, o Vínculo sobe com XP médio, e ele aprimora **assim que dá** (o caminho mais rápido). "Dia 59" = o Ultra (14 dias perfeitos de rookie→mega + 45 de paciência, `ULTRA_PATIENCE_DAYS`).

| Perfil | Dias até as 3 peças no 15 | Níveis somados no dia 59 (de 45) |
|---|---:|---:|
| Todo dia, XP 165 ("dia bom") | **100** | 33 |
| Todo dia, XP 100 | 102 | 33 |
| Todo dia + Oficina do Foco girando ambientes (+0,2 material/dia por material) | 84 | 36 |
| Todo dia + foco **extremo** (+0,64 por material, ~12 ciclos/dia — limite teórico) | 61 | 42 |
| 3 de cada 4 dias | 134 | 28 |
| Metade dos dias | 198 | 24 |

**Leitura.** Quem joga *todo dia* chega ao Ultra com ~73 % dos níveis e só fecha o Soulsmith ~40 dias depois; quem joga com folga leva de 4 a 6 meses. Nenhum perfil realista fecha antes do Ultra (a Oficina do Foco encurta, mas o teto de 8 itens/dia e o sorteio entre 4 materiais do ambiente a seguram). A régua trava: **todo dia ⇒ > 1,5 × 59 dias**, **foco moderado ⇒ > 59 dias**, presença menor ⇒ nunca encurta.

## Migração sem confisco

Registro `forge` sem `v: 2` é o esquema de 5 níveis e é convertido na leitura (cliente `sanitizeForge`, servidor `_forge.js`) para o nível novo de **mesmo bônus**, atributo por atributo: 1→3, 2→5, 3→8, 4→11, 5→15 (`OLD_LEVEL_TO_NEW`); a escolha de cada nível antigo se repete nos níveis novos que ele cobre. Peça comprada antes do Soulsmith (sem registro): tiers 1/2/3 valem os níveis 5/11/15 (0,5/1,1/1,5 %, como antes). Idempotente; todo escritor grava `v: 2`.

## Gatilho para rever

Se o dono achar longo/curto: ajuste **`UPGRADE_COST`** (e rode a simulação), nunca `LEVEL_PCT`/`PIECE_MAX_PCT` (o teto). Se a Oficina do Foco passar a render mais material por ciclo, a linha "foco" da tabela acima é a primeira a encurtar — rode de novo. Não adicionado de propósito: custo em Bits no aprimoramento (seria mais um ralo para o teto de 150 Bits/dia dos minijogos); fica como opção se o dono quiser ainda mais tempo.
