# NPCs novos — leva `E:/novos npcs` (15/10/2026)

> Etiqueta: **registro**. Arte instalada em `src/assets/soulmon/npcs/npc-n-<id>.png`,
> registrada em `NOVO_NPC_ART` (`npcs/index.ts`); nome, ofício, fala PT+EN e
> **categoria** em `NOVO_NPC_VOICE` (`src/utils/areaNpcVoice.ts`). ⚠️ **Sem chamada
> hoje** — nenhuma tela os lê; onde cada um entra é decisão de design
> (`PERGUNTAS-DO-DONO.md`, NPC-1). Régua: `src/data/bossRoster.test.ts`
> (15 artes próprias, sem colidir com os extras, categoria válida, falas sem cobrança).

17 PNG do Higgsfield chegaram em `E:/novos npcs`; **16 instalados (28/10: + Lodi de costas), 1 pendente**.

## Instalados (16)

| id | Nome (PT / EN) | Ofício | Categoria | Arquivo | Nota |
|---|---|---|---|---|---|
| `alquimistaLimo` | Lodi | Alquimista de limo | oficio | `npc-n-alquimistaLimo.png` | corpo inteiro, 617×1100; fundo preto recortado (sobra um halo verde-escuro) |
| `alquimistaLimoCostas` | Lodi | Alquimista de limo (de costas) | oficio | `npc-n-alquimistaLimoCostas.png` | variante da Lodi vista de costas, corpo inteiro 602×1100; fundo preto recortado por flood-fill + descasque de 3 px do brilho verde; sem uso em tela |
| `enfermeira` | Rubra | Enfermeira da Sombra | sombrio | `npc-n-enfermeira.png` | busto; xadrez de transparência "assado" recortado por flood-fill |
| `colheita` | Espiga / Tassel | Guardiã da colheita | natureza | `npc-n-colheita.png` | fada de milho e couve-flor |
| `tempo` | Clepsi / Clepsy | Guardião das horas | mistico | `npc-n-tempo.png` | peixe-dourado de penas com relógios |
| `musa` | Lilia | Musa do jardim | mistico | `npc-n-musa.png` | estátua com hera e harpa |
| `ossarioFera` | Ossel | Guardião do ossuário (dragão) | sombrio | `npc-n-ossarioFera.png` | **par** com `ossarioForma` |
| `ossarioForma` | Ossel | Guardião do ossuário (humana) | sombrio | `npc-n-ossarioForma.png` | mesma personagem, forma humana |
| `serpentePlumadaFera` | Tzali | Serpente emplumada (dragão) | mistico | `npc-n-serpentePlumadaFera.png` | **par** com `serpentePlumadaForma` |
| `serpentePlumadaForma` | Tzali | Serpente emplumada (humana) | mistico | `npc-n-serpentePlumadaForma.png` | mesma personagem, forma humana |
| `broto` | Faísca / Spark | Espírito dos elementos | natureza | `npc-n-broto.png` | broto com fogo e raio |
| `corvo` | Corvino / Corvin | Médico da neblina | sombrio | `npc-n-corvo.png` | corvo de máscara e lanterna |
| `cozinheiro` | Caldo / Broth | Cozinheiro do caldeirão | criatura | `npc-n-cozinheiro.png` | gato-bruxo com sopa |
| `besouro` | Brio / Sheen | Sentinela besouro | criatura | `npc-n-besouro.png` | besouro de armadura |
| `luaTronoSentada` | Selene | Deusa da lua no trono (sentada) | mistico | `npc-n-luaTronoSentada.png` | **mesma Selene** de `EXTRA_NPC_ART.lua`, corpo inteiro no trono |
| `luaTronoDePe` | Selene | Deusa da lua no trono (de pé) | mistico | `npc-n-luaTronoDePe.png` | idem, de pé junto ao trono com o cajado |

### Categorias

`oficio` (1) · `mistico` (6) · `natureza` (2) · `sombrio` (4) · `criatura` (2).
A categoria é só uma ajuda para a decisão de onde cada um entra — **não é fiação**.

### Pós aplicado

Recorte do bounding box, 768² centrado para os bustos (corpo inteiro: altura 1100),
**alfa binarizado em 128** (o original vinha ~252, não 255) e RGB zerado onde o alfa é 0,
PNG otimizado. O build converte para WebP como o resto. Matiz 270–340° **não** foi
medido nesta leva (as artes são verdes/vermelhas/azuis; nenhum roxo-magenta de fundo).

## Pendentes (1) — ainda em `E:/novos npcs`

| Arquivo de origem | O que é | Por que não entrou |
|---|---|---|
| `hf_20261014_162920_19e8f11a-…png` | sereia-pintora (corpo inteiro) | fundo escuro em degradê com vinheta, sem alfa; não dá para recortar limpo (28/10: flood-fill tolerâncias 6 e 14 tirou o fundo externo, mas sobram bolsões de fundo marrom/oliva entre cabelo, asas e cauda, e o azul-escuro do vestido e o marrom da bolsa têm o mesmo tom do fundo, então uma remoção global comeria a personagem). **Regerar** com fundo `#00FF00` chapado (regra do `CLAUDE.md` global) |

## Para o dono

- Onde cada um aparece (lote, função, ou só catálogo)? Continua sendo o **NPC-1**.
- Ossel e Tzali têm duas formas cada: usar as duas (ex.: forma humana no balcão, dragão no encontro) ou só uma?
- Os 4 ids de tom `sombrio` (Rubra, Ossel x2, Corvino) estão fora de qualquer tela de cuidado de propósito: a narrativa pede que o jogador nunca leia ameaça.
