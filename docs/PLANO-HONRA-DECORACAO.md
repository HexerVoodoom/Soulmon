# Plano: itens de Honra de combate, suporte de armas na parede e a identidade na decoração

> **Dono:** pedido do dono de 13/11/2026 (prioridade BAIXA), registrado em `E:\Soulmon-assets\_pedidos\FILA-CHATGPT-PRIORIDADE-BAIXA-2026-11-13.md` (F1, F2, F3). O dono escolheu começar **pelo plano**, sem gerar imagem e sem código.
> **Estado:** plano. Nada implementado, nenhuma imagem gerada. Os números de economia foram lidos no código de `main` em 13/11/2026 (`2fa3f23`).
> **Não cobre:** a regra de identidade em si (dona: [`REGRA-IDENTIDADE-SOULMON.md`](REGRA-IDENTIDADE-SOULMON.md)); a geometria canônica do palco (dona: [`PALCO-E-DECORACAO.md`](PALCO-E-DECORACAO.md) e `src/utils/petStage.ts`); a economia da Honra como regra (dono: [`manual/02-REGRAS-DE-NEGOCIO.md`](manual/02-REGRAS-DE-NEGOCIO.md), §46 Moedas, §47 Loja, §50 Missões semanais).
> **Precedência:** código > teste > este plano. Os preços e as decisões abaixo são PROPOSTA até o dono responder a §6.

Vocabulário: **Honra** é o rótulo da moeda; no código e no save ela continua `emblems` (`CURRENCIES.emblems`, REGISTRO §17). A loja de Honra é `TOURNAMENT_ITEMS` em `src/utils/shop.ts`, servida na aba Honra das lojinhas Decoração e Background do Mercado (`mercadoCatalog.ts › STALL_CURRENCIES`) e na loja do Torneio (`tournamentShopItems`). Os "emblemas de conquista" da Ficha do Pet são outra coisa e não entram aqui.

---

## 1. Inventário atual

### 1.1 O que a Honra compra hoje

`TOURNAMENT_ITEMS` tem **8 itens, somando 245 de Honra**. Todos são cosméticos (`bg`/`furniture`), e há teste travando isso, porque a Honra mora no save do cliente e é farmável por quem editar o `localStorage` (manual 02 §46 › casos de borda).

| id | tipo | espaço | preço (Honra) |
|---|---|---|---|
| `furn-crate` | furniture | `trophy` | 8 |
| `furn-shelf-simple` | furniture | `trophy` | 12 |
| `furniture-champion-banner` | furniture | `wall` | 15 |
| `furniture-medal-wall` | furniture | `wall` | 20 |
| `furniture-trophy-shelf` | furniture | `trophy` | 25 |
| `bg-arena-champion` | bg | — | 40 |
| `furniture-podium` | furniture | `trophy` | 55 |
| `bg-arena-spotlight` | bg | — | 70 |

Molduras de Honra: nenhuma (`FrameShelf` tem a aba, vazia). Consumível de Honra: proibido por regra (`mercadoCatalog.ts`, "Emblemas compram só cosmético"). A Feira tem a Serpente, que vende "equipamento de Honra em Bits" a `HONRA_EM_BITS` = 10 Bits por Honra (PLANO-FEIRA-CHEFE §12, conversão marcada como pergunta ao dono).

### 1.2 Quanto de Honra entra por dia (a economia que o preço tem de respeitar)

| Fonte | Regra (constante) | Valor |
|---|---|---|
| Torneio ranqueado | `MATCHES_PER_DAY` = 5 partidas/dia; `EMBLEMS_PER_WIN` = 3, `EMBLEMS_PER_LOSS` = 1; a vitória é multiplicada por `honorFactor` (corte por level e repetição, REGISTRO §291) | 5 a 15 por dia |
| Treino (Sparring) | `SPAR_HONOR_MAX` = 1–2 por vitória, teto `SPAR_HONOR_DAILY_CAP` = **20 por dia do jogador**, 20 partidas com Honra no ticket grátis (REGISTRO §279, §280) | 0 a 20 por dia |
| Missões semanais | 2 fixas (`journal-days` 3, `focus-days` 3) + 3 sorteadas de 12 (média 2,7 cada) | ~14 por semana ≈ 2 por dia |
| Sonho bom (pesadelos) | `GOOD_DREAM_HONOR` = 3 a cada 6 dias de pesadelo | ≈ 0,5 por dia |
| Feira da Guilda | `RAID_EMBLEMS` = 4 (dissipada) / `RAID_EMBLEMS_FLOOR` = 2 (recuou), semanal; o Chefe da Feira paga Emblemas mas está desligado (`FEIRA_CHEFE_DESDE`) | ≈ 0,3 a 0,6 por dia |
| Carta de fim de temporada | 6 por participar; top 100: 15; top 20: 30; 3º 60; 2º 90; 1º 120, por mês (REGISTRO §241) | 0,2 a 4 por dia |

Três perfis, para medir preço em DIAS (é a régua que o resto do plano usa):

| Perfil | Como joga | Honra/dia |
|---|---|---|
| **Casual** | 2 ranqueadas/dia (metade vitória), sem Treino, metade das semanais | **≈ 5** |
| **Regular** | 5 ranqueadas/dia (metade vitória), semanais completas, sonho bom, carta de participação | **≈ 13** |
| **Máximo** | 5 vitórias ranqueadas + teto do Treino + semanais + sonho + Feira + carta de top 20 | **≈ 40** (teto prático) |

Conta do Regular: 5 × (0,5·3 + 0,5·1) = 10, + 2 (semanais) + 0,5 (sonho) + 0,2 (carta) ≈ 12,7. Conta do Máximo: 15 + 20 + 2 + 0,5 + 0,6 + 1 ≈ 39.

**O problema que o dono apontou, em número:** a loja inteira de Honra (245) acaba em **~6 dias** para o Máximo e **~19 dias** para o Regular. Depois disso a Honra não compra mais nada. Desde o Treino (10/11/2026) a torneira mais que dobrou e o ralo continuou o mesmo. O comentário do código ("o primeiro item sai em ~5 vitórias e o último em ~23") é anterior ao Treino.

### 1.3 O espaço `wall` hoje

`DECOR_SLOTS.wall` (`src/utils/petStage.ts`): x = 68 %, topo em y = 20 %, caixa de arte **56 × 40**, `anchor: 'hang'`, desenhado a 2,5× (`DECOR_RENDER_SCALE.wall`), ou seja 140 × 100 px no palco. Fica à direita da cabeça do pet.

- Itens que ocupam o `wall`: `furn-picture`, `furn-window` (indoor), `furn-garland`, `furn-wind-chime`, `furn-clock` (indoor), `furniture-champion-banner` (Honra), `furniture-medal-wall` (Honra), as peças de parede dos temas (`furn-lava-estandarte-de-cinza`, `furn-cerejeira-galho-pendente`, `furn-mar-profundo-agua-viva-pendente`, `furn-neve-pingentes-de-gelo`, `furn-jardim-vaso-suspenso`) e as duas da assinatura (`furn-sub-2026q4-guirlanda`, `furn-sub-2026q4-sino`).
- Cenários que oferecem `wall`: os que declaram `slots: FULL_SLOTS` em `src/utils/backgrounds.ts` (43 declarações); os 16 com `GROUND_SLOTS` (céu aberto: Céu Noturno, Deserto, Terra Gelada, Monte Infinito, Aurora, Synthwave...) não oferecem, porque "um estandarte pendurado no nada lê como bug".
- Um espaço, um item (`applyDecorEquip`). Quem pendura uma arma no `wall` perde o estandarte ou o quadro.

---

## 2. Catálogo proposto: itens de Honra de combate

### 2.1 Regras comuns

- **Tudo cosmético.** `kind: 'furniture'`, `currency: 'emblems'`, sem efeito em combate, atributo, energia, coração ou evolução. O teste que trava o `kind` de `TOURNAMENT_ITEMS` continua valendo e cobre os novos.
- **`fits: 'any'`** em todas as peças (o pet vive mais ao ar livre; o filtro de onde aparece é o `slots` do cenário, não o `fits`).
- **Níveis de material:** Bronze, Prata, Ouro, Mithril. O material é visível na arte, não só no nome.
- **id:** `hon-<categoria>-<peça>-<material>`, com material em `bronze | prata | ouro | mithril` (ex.: `hon-arma-espada-ouro`). Arte em `src/assets/decor/<id>.webp`.
- **Nome:** "‹Peça› de ‹Material›" / "‹Material› ‹Piece›" (ex.: "Espada de Ouro" / "Gold Sword"). Exceções nomeadas na tabela.

### 2.2 Preço por nível (proposta) e a conta em dias

| Nível | Preço | Casual (5/dia) | Regular (13/dia) | Máximo (40/dia) |
|---|---|---|---|---|
| Bronze | **25** | 5 dias | 2 dias | 0,6 dia |
| Prata | **70** | 14 dias | 5,4 dias | 1,8 dia |
| Ouro | **180** | 36 dias | 14 dias | 4,5 dias |
| Mithril | **450** | 90 dias | 35 dias | 11 dias |
| Peça sem nível (tapetes) | **40** | 8 dias | 3 dias | 1 dia |

Por que esta escada:

- **Continua a escada atual.** O Bronze (25) fica no preço da `furniture-trophy-shelf`; a Prata (70) no da `bg-arena-spotlight`, o item mais caro de hoje. Ninguém vê os preços antigos ficarem estranhos.
- **O topo não é trivial:** um Mithril custa 11 dias de quem joga TUDO no teto e mais de um mês de quem joga todo dia o ranqueado. **Nem inalcançável:** o Casual tem um Mithril em ~3 meses, e um Bronze na primeira semana.
- **Razão ~2,6× entre níveis**, parecida com a dos cenários de Bits (×2 / ×3 / ×5, REGISTRO §218): cada nível pede mais que o dobro do anterior, mas não um salto que faça o Ouro parecer a última parada.
- Constantes nomeadas (`HONRA_PRECO.bronze` etc.), para recalibrar sem tocar no catálogo.

Conta do catálogo inteiro (75 peças da §2.3): 18 linhas × (25 + 70 + 180 + 450) = 13 050, + 3 tapetes × 40 = 120 → **13 170 de Honra** (contra 245 hoje). Todo o Bronze: 450 (35 dias do Regular). Todo o Bronze + Prata: 1 710 (~130 dias do Regular, ~43 do Máximo). Tudo: ~330 dias do Máximo, ~2,8 anos do Regular. Colecionar tudo é cauda longa de propósito; o que o jogador sente é o preço da PEÇA, e esse fica na faixa de dias a semanas.

### 2.3 Os itens

**A. Armeiro de parede — espaço novo `weapon` (ver §3)** · 6 armas × 4 materiais = **24 peças**. Cada arte é a arma JÁ no seu suporte (o suporte tem o mesmo material da arma), uma imagem por item.

| Peça (PT / EN) | Bronze | Prata | Ouro | Mithril |
|---|---|---|---|---|
| Lança / Spear | `hon-arma-lanca-bronze` | `hon-arma-lanca-prata` | `hon-arma-lanca-ouro` | `hon-arma-lanca-mithril` |
| Espada / Sword | `hon-arma-espada-bronze` | `…-prata` | `…-ouro` | `…-mithril` |
| Escudo / Shield | `hon-arma-escudo-bronze` | `…-prata` | `…-ouro` | `…-mithril` |
| Machado / Axe | `hon-arma-machado-bronze` | `…-prata` | `…-ouro` | `…-mithril` |
| Arco / Bow | `hon-arma-arco-bronze` | `…-prata` | `…-ouro` | `…-mithril` |
| Cajado / Staff | `hon-arma-cajado-bronze` | `…-prata` | `…-ouro` | `…-mithril` |

Preço: 25 / 70 / 180 / 450. Espaço `weapon` (só Honra, ver §3.4).

**B. Estátuas — `floor-left`** · 4 figuras × 4 materiais = **16 peças**. A estátua é uma figura de herói em pedestal baixo, no material do nível (Bronze/Prata/Ouro fundidos; Mithril com brilho interno).

| Peça (PT / EN) | ids | Preço |
|---|---|---|
| Estátua do Guerreiro / Warrior Statue | `hon-estatua-guerreiro-{bronze,prata,ouro,mithril}` | 25 / 70 / 180 / 450 |
| Estátua do Mago / Mage Statue | `hon-estatua-mago-{…}` | idem |
| Estátua do Guardião / Guardian Statue | `hon-estatua-guardiao-{…}` | idem |
| Estátua da Arqueira / Archer Statue | `hon-estatua-arqueira-{…}` | idem |

Nome com material: "Estátua de Bronze do Guerreiro" / "Bronze Warrior Statue".

**C. Manequim de armadura — `floor-left`** · **4 níveis**, e o nível muda as PEÇAS, não só a cor (o pedido do dono: "peças em vários níveis").

| Nível | id | PT / EN | O que veste | Preço |
|---|---|---|---|---|
| Bronze | `hon-manequim-bronze` | Manequim do Recruta / Recruit's Mannequin | elmo simples + peitoral | 25 |
| Prata | `hon-manequim-prata` | Manequim do Cavaleiro / Knight's Mannequin | + ombreiras e cinto | 70 |
| Ouro | `hon-manequim-ouro` | Manequim do Campeão / Champion's Mannequin | + manoplas, grevas e capa curta | 180 |
| Mithril | `hon-manequim-mithril` | Manequim Lendário / Legendary Mannequin | armadura completa com elmo de crista e capa longa | 450 |

**D. Bigornas — `floor-right`** · **4 níveis**.

| Nível | id | PT / EN | Preço |
|---|---|---|---|
| Bronze | `hon-bigorna-bronze` | Bigorna do Aprendiz / Apprentice's Anvil (com martelo) | 25 |
| Prata | `hon-bigorna-prata` | Bigorna do Armeiro / Armorer's Anvil (lâmina em forja) | 70 |
| Ouro | `hon-bigorna-ouro` | Bigorna Rúnica / Runic Anvil (runas acesas) | 180 |
| Mithril | `hon-bigorna-mithril` | Bigorna de Mithril / Mithril Anvil (cristal de alma no pé) | 450 |

**E. Armas de chão — `floor-right`** · 4 peças × 4 materiais = **16 peças**.

| Peça (PT / EN) | ids | Preço |
|---|---|---|
| Espada na Pedra / Sword in the Stone | `hon-chao-espada-pedra-{bronze,prata,ouro,mithril}` | 25 / 70 / 180 / 450 |
| Cajado no Pedestal / Staff on a Pedestal | `hon-chao-cajado-{…}` | idem |
| Escudo de Guarda / Guard Shield (apoiado no chão) | `hon-chao-escudo-{…}` | idem |
| Feixe de Lanças / Spear Rack | `hon-chao-lancas-{…}` | idem |

**F. Estandarte da Ordem — `wall`** · **4 níveis** (o fio e o mastro no material do nível): `hon-estandarte-{bronze,prata,ouro,mithril}`, "Estandarte de Bronze da Ordem" / "Bronze Order Banner", 25 / 70 / 180 / 450. Convive com o armeiro: um vai no `wall`, o outro no `weapon`.

**G. Pedestal de troféus — `trophy`** · **4 níveis**: `hon-pedestal-{bronze,prata,ouro,mithril}`, "Pedestal de Bronze" / "Bronze Plinth", 25 / 70 / 180 / 450. Como toda peça do `trophy`, ele exibe as medalhas REAIS das seasons vencidas (`gameState.trophies`).

**H. Chão de arena — `rug`** · **3 peças, sem nível**, 40 cada:

| id | PT / EN |
|---|---|
| `hon-tapete-circulo-duelo` | Círculo de Duelo / Duel Circle |
| `hon-tapete-lajes-arena` | Lajes da Arena / Arena Flagstones |
| `hon-tapete-passadeira` | Passadeira do Campeão / Champion's Runner |

**Total: 24 + 16 + 4 + 4 + 16 + 4 + 4 + 3 = 75 peças novas**, distribuídas em todos os espaços: `weapon` 24, `floor-left` 20, `floor-right` 20, `wall` 4, `trophy` 4, `rug` 3.

### 2.4 Onde isso mora no código (quando virar produto)

- **Catálogo gerado, não digitado.** Um módulo `src/utils/honraDecor.ts` no molde de `cosmeticosNovos.ts`: categorias × materiais × preço por nível, e **a arte é a porta** (`import.meta.glob` em `assets/decor/hon-*.webp`; peça sem arte não aparece na loja nem pesa nos contratos). `TOURNAMENT_ITEMS` passa a ser os 8 de hoje + `...HONRA_DECOR`.
- **A loja precisa de agrupamento.** 83 itens numa prateleira só é ilegível. A aba Honra ganha seções por espaço (Armeiro, Estátuas, Chão, Parede, Vitrine) ou um filtro por material; isso é desenho de tela e passa pela squad-design.
- **Serpente da Feira.** Ela vende "equipamento de Honra em Bits". Se os novos entrarem no estoque dela, Ouro e Mithril viram 1 800 e 4 500 Bits, o que fura o prestígio do topo (pergunta P6).

---

## 3. O suporte de armas: espaço novo ou o `wall` de hoje?

### 3.1 Recomendação: espaço novo `weapon` ("Armeiro" / "Weapon rack")

O dono pediu "um NOVO espaço na parede", e há três razões de produto para isso:

1. **Não rouba o `wall`.** Com o mesmo espaço, pendurar a espada tira o estandarte ou o quadro que a pessoa já comprou. A arma é o item-símbolo da Honra; competir com o quadro de Bits é o desenho errado.
2. **Dá um território à Honra**, como a vitrine `trophy` dá aos troféus (lá só entra item de Honra, e há teste). O armeiro só aceita Honra, e quem tem uma espada de Mithril na parede mostra algo que Bits não compram.
3. **O catálogo de armas cresce sem disputar espaço** com os 15+ itens que já ocupam o `wall`.

O custo é de geometria (§3.3), e por isso a recomendação vem com uma condição: **o espaço só é aprovado depois de um mock no navegador** (390 px e tela baixa). Se o mock não fechar, a alternativa é a P1b (arma dentro do `wall`), que não muda nada no save nem no palco.

### 3.2 O que muda, peça por peça

| Onde | Mudança | Risco |
|---|---|---|
| `SlotId` (`petStage.ts`) | acrescentar `'weapon'`; `DECOR_SLOTS.weapon` com caixa de arte **40 × 48**, `anchor: 'hang'`, x ≈ 30 %, topo em y = 20 % (espelho do `wall`, à esquerda da cabeça do pet); `DECOR_RENDER_SCALE.weapon` = 2,0 (80 × 96 px no palco) | os números saem do mock, não deste plano |
| `SLOT_ORDER` | ordem de desenho: o `weapon` entra ANTES das peças de chão (atrás do `floor-left`), como o `wall` | estátua alta na frente da arma; medir |
| `equippedDecor` | **nenhum campo novo.** É `Partial<Record<SlotId, string>>`; a arma grava `equippedDecor.weapon = 'hon-arma-…'` | — |
| Save, leitura tolerante | `hydrateDecor` (`GameStateContext.tsx`) já aceita qualquer chave de espaço com id string; **um cliente antigo preserva a chave `weapon`** num ida-e-volta de save (não a desenha, porque desenha só o `SLOT_ORDER` dele, mas não a apaga). Nada a migrar | conferir com teste que um save com `weapon` passa intacto pelo cliente atual |
| Migração | **nenhuma.** Nenhum item existente vira arma; `migrateDecor` não muda. Idempotência trivial (não há passo) | se a P1b vencer e algum item de `wall` for reclassificado, aí sim: migração que move só ids conhecidos, roda uma vez e respeita `{}` (as duas regras de `PALCO-E-DECORACAO.md` › Estado no save) |
| Servidor (paridade) | `functions/api/save.js` não lê `equippedDecor` (só o equipamento de combate, que é outra coisa); a Honra mora no cliente. **Sem espelho novo no servidor** | se um dia a Honra for para o servidor (item de Honra com vantagem), isso muda; a regra de não-vantagem impede |
| Palco da Home (`CompanionHUD`) | itera `SLOT_ORDER` e `slotBoxStyle`; o espaço novo entra sozinho. Espaço vazio é vazio | — |
| Editar Home (`utils/editHome.ts`) | o modo de edição lista os espaços: ganha o Armeiro | texto da UI |
| `fits` / cenários | **não mexe em `fits`** (armas são `any`). O que decide é o cenário: `FULL_SLOTS` ganha `'weapon'` junto com `'wall'` (tem onde pendurar = tem onde pôr o suporte); `GROUND_SLOTS` não ganha. Regra única: "cenário com `wall` tem `weapon`", testada | cenário pintado onde a parede só existe à direita: revisar os 43 no mock |
| Contratos | (a) todo `SlotId` tem ≥ 1 item: os 24 cobrem; (b) novo: **`weapon` só aceita `currency: 'emblems'`** (molde do teste do `trophy`); (c) `petStage.test`: o `weapon` não sai do palco a 390 px | — |
| Casa da Guilda (`guildHouse.ts`) | doar uma arma tira de `ownedFurniture` e de `equippedDecor`, como qualquer peça | — |
| GM (`gmTools.ts`) | "desbloquear tudo" já varre `ALL_SHOP_ITEMS` | — |
| Doc | `PALCO-E-DECORACAO.md` (tabela dos espaços passa a seis), manual 02 §47 e 03 | — |

### 3.3 O risco de geometria, medido no papel

A 300 px de largura útil: o `floor-left` (56 × 56 a 2,5×) ocupa x ≈ −16…124 px e sobe até y ≈ 45 px; o pet (caixa de 128 px) ocupa x ≈ 86…214, y ≈ 43…171; a janela do palco corta o topo em y = 35 (y = 75 em tela baixa, `max-height: 800px`). Não existe faixa livre acima do canto esquerdo: o Armeiro vai inevitavelmente ficar **atrás** da cabeça do pet e da ponta de uma peça alta do `floor-left`, como o `wall` já fica atrás do pet à direita. Em tela baixa ele perde ~25 px do topo, o mesmo que o `wall` perde hoje. Por isso a arma deve ser desenhada com o desenho importante no TERÇO DE BAIXO da caixa (cabo, guarda, lâmina descendo), e por isso o mock vem antes da arte.

### 3.4 Só Honra no Armeiro?

Recomendado: **sim**, como a vitrine. Abrir para Bits esvaziaria o motivo de o espaço existir (P2).

---

## 4. Geração das imagens (F3: itens novos de Honra)

### 4.1 Ordem e quantidade

| Onda | O quê | Imagens | Para quê |
|---|---|---|---|
| 0 | **Mock do Armeiro no navegador** (sem arte nova: um retângulo e uma arte provisória) + revisão da squad-design | 0 | aprovar a geometria (§3.3) |
| 1 | **Piloto F3**: Espada de Bronze, Espada de Mithril, Estátua de Bronze do Guerreiro, Manequim do Recruta, Bigorna do Aprendiz, Círculo de Duelo | 6 | aprovar com o dono o "look" dos materiais e a dose de identidade antes do lote |
| 2 | Armeiro: as 24 armas | 24 (−2 do piloto) | o símbolo do pedido; testa a escada de material inteira |
| 3 | Manequim (4) + Bigornas (4) + Estandartes (4) + Pedestais (4) | 16 (−2) | as peças "de nível" |
| 4 | Estátuas (16) + Armas de chão (16) + Tapetes (3) | 35 (−2) | o volume |

**75 imagens**, ~25 conversas de ChatGPT (3 imagens cada), ~7 rodadas de 4 instâncias em paralelo; com ~30 % de retrabalho, ~33 conversas.

### 4.2 Caixa por espaço e arquivo

A arte é feita PARA a caixa do espaço ([`PALCO-E-DECORACAO.md`](PALCO-E-DECORACAO.md)): alfa real, recortada até a margem transparente, ancorada EMBAIXO (espaço vazio no topo do arquivo), sem sombra desenhada. Escala do arquivo instalado: 3× a caixa (2× no `rug`, `DECOR_ART_SCALE` de `cosmeticosNovos.ts`), reduzida com *nearest*.

| Espaço | Caixa (px) | Arquivo instalado | Proporção pedida ao gerador |
|---|---|---|---|
| `weapon` (novo) | 40 × 48 | 120 × 144 | 5:6 (retrato) |
| `floor-left` | 56 × 56 | 168 × 168 | 1:1 |
| `floor-right` | 48 × 52 | 144 × 156 | 12:13 (≈ 1:1, pedir quadrado e recortar) |
| `wall` | 56 × 40 | 168 × 120 | 7:5 (paisagem) |
| `trophy` | 46 × 50 | 138 × 150 | ≈ 1:1 |
| `rug` | 104 × 16 | 208 × 32 | 13:2; o gerador não faz faixa: pedir 3:2 com a peça vista de cima em perspectiva baixa, e recortar a faixa |

Nomes: fonte bruta em `E:\Soulmon-assets\honra\<id>.png` (alfa, resolução do gerador) → instalado `src/assets/decor/<id>.webp`. Cada imagem registra prompt e tags em `E:\Soulmon-assets\_banco\registro.jsonl` + `meta.json` (regra de 09/11).

### 4.3 Prompts-base por categoria

Todos os prompts terminam com a proporção da §4.2 (sem ela o gerador devolve proporção aleatória). Referências anexadas em TODA geração: uma arte da Home e o kit de `E:\Soulmon-assets\referencias-identidade\` (01 e 03, UI Kit v1.2), mais a referência de pixel do dono: **o esqueleto de dinossauro da Corrida com obstáculos** (um dos `src/assets/soulmon/dino/dino-obstacle-*.png`; a squad-design confirma qual com o dono no piloto).

**Bloco comum (todas as peças de decoração):**

```
Single decoration object for a virtual-pet room, lightly pixelated pixel art: crisp readable pixels,
low detail per pixel, clean silhouette, like the attached dinosaur skeleton reference. No blur, no
painterly gradients. Real transparent background (alpha), no backdrop, no frame, no text, no drawn
floor shadow. The object fills the frame and sits on the BOTTOM edge; any empty space goes at the top.
Soulmon identity in small quantity (at most two motifs on the piece): a soul crystal with a flame or
glow inside, a thin copper cable or pipe, a thin digital circuit line, or a small sprig of plant;
deep dark teal and turquoise as accent colours. No gears, no steampunk.
```

**Paleta de material (substitui `{MATERIAL}`):**

- Bronze: `warm bronze metal, brown-orange with a darker patina (clearly different from the thin copper cable accent)`
- Prata: `cool polished silver, light grey with blue-white highlights`
- Ouro: `rich gold with warm yellow highlights`
- Mithril: `pale silvery-white mithril with a faint turquoise sheen and a soft inner glow, the most precious tier`

**Por categoria (o que vem antes do bloco comum):**

- `[HONRA-ARMA]` — `A {WEAPON} made of {MATERIAL}, hanging on a small wall bracket of the same material, seen straight from the front. The important part of the drawing is in the lower two thirds. The soul crystal, if used, is set in the hilt or the bracket.` + `Portrait 5:6 full-bleed composition.`
- `[HONRA-ESTATUA]` — `A small heroic statue of a {FIGURE: warrior with sword and shield | mage with staff and robe | guardian with tower shield | archer with bow} on a low plinth, cast in {MATERIAL}, calm proud pose, no face details.` + `Square 1:1 full-bleed composition.`
- `[HONRA-MANEQUIM]` — `An armour mannequin on a wooden stand wearing {PIECES} in {MATERIAL}.` + `Square 1:1 full-bleed composition.`
- `[HONRA-BIGORNA]` — `A blacksmith anvil on a stump, {VARIANT: with a hammer | with a glowing blade being forged | with glowing runes | made of mithril with a soul crystal at its foot}, accents in {MATERIAL}.` + `Square 1:1 full-bleed composition.`
- `[HONRA-CHAO-ARMA]` — `{PIECE: a sword stuck in a stone | a staff on a stone pedestal | a round guard shield leaning on the ground | a small floor rack of spears} in {MATERIAL}.` + `Square 1:1 full-bleed composition.`
- `[HONRA-ESTANDARTE]` — `A hanging order banner on a short pole, cloth in deep teal, embroidery, pole and finials in {MATERIAL}.` + `Landscape 7:5 full-bleed composition.`
- `[HONRA-PEDESTAL]` — `A low display plinth for medals, carved stone with {MATERIAL} trim and a flat top.` + `Square 1:1 full-bleed composition.`
- `[HONRA-TAPETE]` — `A {PIECE: painted duel circle | arena flagstones | champion's carpet runner} seen from a low front angle, flat on the ground.` + `Landscape 3:2 full-bleed composition.`

### 4.4 O que passa pela squad-design antes de gerar

Regra "asset novo chama squad de design" (memória de 09/11): antes da onda 1, a squad-design revisa (1) o mock do Armeiro (§3), (2) os prompts-base e a paleta de material (bronze vs. o cobre da identidade é o ponto fraco: os dois puxam para laranja), (3) a dose de identidade por peça (P7), (4) os nomes PT/EN e (5) o agrupamento da aba Honra. Depois do piloto, a squad-design e o dono aprovam o "look" e o lote segue sem nova rodada de revisão, só a checklist de 6 itens da [`REGRA-IDENTIDADE-SOULMON.md`](REGRA-IDENTIDADE-SOULMON.md) por imagem.

---

## 5. F1 e F2: refazer os fundos da Home e toda a decoração com a identidade

### 5.1 Inventário (contado no repositório, `main` 13/11/2026)

**Fundos do palco da Home (`PET_BACKGROUNDS`, cada um com arquivo em `src/assets/backgrounds/`)** — 80 com arte própria:

| Leva | Quantos | ids |
|---|---|---|
| 1ª leva (nasceu gradiente, repintada) | 12 | `bg-room`, `bg-night`, `bg-desert`, `bg-matrix`, `bg-forest`, `bg-ocean`, `bg-gameboy`, `bg-snow`, `bg-lava`, `bg-sakura`, `bg-toytown`, `bg-synthwave` |
| 2ª leva (kit v1.2) | 8 | `bg-attic`, `bg-arcade`, `bg-library`, `bg-shrine`, `bg-rooftop`, `bg-cloudsea`, `bg-observatory`, `bg-swamp` |
| 3ª leva (04/10) | 6 | `bg-lakeside`, `bg-crystal-grove`, `bg-ember-cavern`, `bg-night-greenhouse`, `bg-cozy-loft`, `bg-cloud-terrace` |
| Conquistas | 20 | `bg-mission-*` |
| **Cosméticos novos (04/11)** | **32** | 12 de tema (`bg-lava-*`, `bg-cerejeira-*`, `bg-mar-profundo-*`, `bg-neve-*`, `bg-jardim-*`, `bg-ruinas-*`) + 20 de elemento (`bg-el-*`) |
| Honra | 2 | `bg-arena-champion`, `bg-arena-spotlight` |

A assinatura (`bg-sub-2026q4-*`, 2) usa arte de outro cenário por alias. Os fundos de arena, guilda, campina e cavernas da mesma pasta são de combate/guilda e **ficam fora** (cenário de combate é "acento sutil", outra regra). O pedido F1 fala dos "backgrounds novos" que "ficaram bons, mas sem a identidade": são os **32 de 04/11** (P8 pergunta se vai além).

**Decoração (`DECOR_ART`, `src/assets/decor/`)** — 58 com arte própria: 33 da 1ª e 2ª levas (`.png`, inclusive as 6 de Honra) + 24 cosméticos novos (`.webp`: 20 de tema + 4 de elemento: fogo, água, terra, ar) + a Concha da Maré (`trophy-concha-mare`, conquista da Guilda). Além disso: **20 decorações planejadas e ainda sem arte** em `cosmeticosNovos.ts` (4 de Ruínas + 16 de elemento) e 3 da assinatura que usam alias.

### 5.2 Custo em gerações (ChatGPT, 3 imagens por conversa, 4 instâncias em paralelo)

| Bloco | Imagens | Conversas | Rodadas de 4 | Com ~30 % de retrabalho |
|---|---|---|---|---|
| F1 — os 32 fundos de 04/11 | 32 | 11 | 3 | ~14 conversas |
| (F1 ampliado: os 80) | (80) | (27) | (7) | (~35) |
| F2 — refazer as 58 decorações | 58 | 20 | 5 | ~26 |
| F2 — as 20 planejadas, já no estilo novo | 20 | 7 | 2 | ~9 |
| F3 — itens de Honra (§4) | 75 | 25 | 7 | ~33 |
| **Total recomendado** (32 + 58 + 20 + 75) | **185** | **63** | **16** | **~82** |

Rotina de cada conversa (memórias do ChatGPT): baixar e CLICAR EM SALVAR no diálogo nativo (cai em `C:\Users\spera\Downloads`, mover para `E:`), conferir que o arquivo é novo por hash, registrar prompt e tags, apagar a conversa depois de salvar, e limpar as referências enviadas a cada ~50 gerações.

**Risco de alfa:** a memória de 09/11 registra que o ChatGPT só deu alfa real na PRIMEIRA imagem de uma conversa (árvores de NPC). Com 3 por conversa, a 2ª e a 3ª podem vir sem transparência. Mitigação: checar o canal alfa de cada arquivo antes de salvar; sem alfa, regerar como 1ª imagem de conversa nova (a regra máxima é transparência real, nunca chroma). Isso pode subir o custo da decoração até ~3× no pior caso; o piloto mede (P12). Fundos não têm alfa e não sofrem isso.

### 5.3 Como refazer sem perder o que foi aprovado

- **Fundos:** anexar o fundo ATUAL como âncora dominante e pedir reprodução fiel ("recreate this exact background faithfully, same composition, same floor line height, same palette"), acrescentando por texto: cristais de alma com chama, canos de cobre e circuitos por cabo (nunca engrenagem), plantas do tipo que o cenário pede (não só folha verde), uma malha digital sutil (grade de luz de dados) e acento turquesa; levemente pixelado. Pós-processamento com o pipeline que já existe (`fin-petbox.mjs`: 1200 × 648, topo do chão em 74 %, `baseColor` amostrado, miniatura 96 × 52). O achado do `CLAUDE.md` vale: reprodução fiel + acréscimo tem teto; se o fundo começar a mudar de composição, parar em 2–3 tentativas e compor por edição de pixel.
- **Decoração:** mesma âncora (a arte atual da peça) + o bloco comum da §4.3. A caixa e o espaço não mudam.
- **Mesmo id, arte trocada:** quem já comprou passa a ver a peça nova sem fazer nada; nada no save muda (recomendado, P10).

### 5.4 Ordem recomendada

1. **Piloto único das três frentes** (2 fundos de 04/11, 2 decorações antigas, as 6 do piloto F3): o dono aprova o padrão "levemente pixelado + identidade" numa olhada só. Sem isso, F1, F2 e F3 podem sair em três estilos.
2. **F1** (os 32 fundos), na ordem do pedido do dono.
3. **F2** (58 decorações + 20 planejadas). As 6 de Honra antigas entram aqui, então a loja de Honra já fica coerente antes dos itens novos.
4. **F3** (Armeiro primeiro, §4.1). O código do espaço `weapon` (§3) pode ser feito em paralelo, porque a arte é a porta: sem imagem, nada aparece.

Tudo no FIM da fila do ChatGPT, prioridade baixa, como o pedido diz.

---

## 6. Decisões que só o dono pode tomar

Cada uma é fechada; a primeira opção é a recomendada.

| # | Pergunta | Opções (recomendada primeiro) |
|---|---|---|
| P1 | Onde fica o suporte de armas? | **(a) Espaço novo próprio, à esquerda da cabeça do pet, aprovado por mock antes da arte** · (b) dentro do espaço Parede de hoje (troca com estandarte/quadro) |
| P2 | O Armeiro aceita só itens de Honra? | **(a) Sim, só Honra, como a vitrine de troféus** · (b) também vende arma por Bits |
| P3 | Escada de preço por material | **(a) 25 / 70 / 180 / 450** (Mithril ≈ 35 dias do jogador regular) · (b) mais barata: 20 / 50 / 120 / 300 · (c) mais cara: 40 / 120 / 300 / 700 |
| P4 | Para comprar o Mithril de uma peça é preciso ter o Ouro dela? | **(a) Não, compra livre de qualquer nível** · (b) Sim, escada de upgrade peça a peça |
| P5 | Tamanho do catálogo novo | **(a) 75 peças (todas as categorias × 4 materiais)** · (b) enxuto: ~40 (as 24 armas + manequim + bigorna + 2 estátuas) · (c) maior: acrescentar mais estátuas e molduras de Honra |
| P6 | A Serpente da Feira vende os itens novos em Bits (1 Honra = 10 Bits)? | **(a) Só Bronze e Prata; Ouro e Mithril só com Honra** · (b) todos · (c) nenhum |
| P7 | Quanto de identidade numa peça de decoração? | **(a) Pouca: até 2 motivos por peça (cristal, fio de cobre, circuito ou plantinha)** · (b) acento: 1 motivo só · (c) bloco completo |
| P8 | F1: quais fundos da Home refazer? | **(a) Os 32 de 04/11** · (b) todos os 80 do palco da Home |
| P9 | F2 também faz já no estilo novo as 20 decorações planejadas que ainda não têm arte? | **(a) Sim, junto do refazer** · (b) Não, ficam na fila atual |
| P10 | Peça antiga refeita: troca a arte no mesmo item ou vira item novo? | **(a) Troca no mesmo id (quem tem vê a nova)** · (b) item novo à venda, a antiga continua |
| P11 | Ordem das frentes | **(a) Piloto único das três → F1 → F2 → F3** · (b) F3 primeiro (itens de Honra antes de refazer o resto) |
| P12 | Imagem que vier sem alfa real (2ª/3ª da conversa) | **(a) Regerar como 1ª imagem de conversa nova** · (b) usar remoção de fundo (rembg) como plano B na decoração |

### Riscos registrados

- **Geometria do Armeiro** (§3.3): não há faixa livre; o mock decide. Se falhar, P1 cai para (b) sem custo no save.
- **Bronze × cobre da identidade:** os dois puxam para laranja e o Bronze pode ler "só mais um cano". A paleta da §4.3 separa por tom e pátina; o piloto confirma.
- **Honra no save do cliente:** aceitável só enquanto TUDO for cosmético. Nenhuma peça deste plano pode ganhar efeito; o teste do `kind` de `TOURNAMENT_ITEMS` e o novo teste do Armeiro travam isso.
- **Estoque de Honra parado:** quem joga desde o Treino pode já ter centenas guardadas; no lançamento, essa pessoa compra Ouro no primeiro dia. É consequência de a loja ter ficado sem itens, não defeito da escada.
- **Loja longa:** 83 itens na aba Honra pedem seções/filtro; sem isso o catálogo grande vira lista ilegível.
- **Cota do ChatGPT:** ~82 conversas no total; o limite diário de imagem do plano do dono não está medido. O piloto mede o ritmo real.
