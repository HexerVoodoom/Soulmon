# Capas dos jogos: lista e prompts para o ChatGPT

> **Revisado pela squad-design, 08/11/2026.** Versão final, com as decisões do dono: 8 capas, 4:3, cenário vazio gerado pelo ChatGPT + criaturas reais compostas por pixel.
> Substitui as capas provisórias (`capaJogo` em `site-beta/src/components/Landing.astro`) usadas na aba "Jogos" do Universo e no cartão "Jogos rápidos".
> Regra mestra: **cada capa é ARTE (uma cena ilustrada), nunca mockup de gameplay**. Sem HUD, barra, placar, botão nem grade de jogo com cara de print. Quem mostra o jogo real é o vídeo e os prints rotulados.

## 1. Decisões do dono (valem)

- **8 capas**, formato **4:3**: Combina 3, Chuva de Almas (Soul Barrage), Corrida, Pedra-Papel-Tesoura, Ateliê da Mente (1 capa), Arena (1 capa: duelo e torneio), Endless Rift, Calabouço.
- O **selo "em construção" do Calabouço é HTML sobre a capa**, nunca na arte. Título e rótulos também são HTML (Rubik, 16 px mínimo).
- **Método:** o ChatGPT gera **SÓ O CENÁRIO**, com plataformas/espaços vazios, **SEM criaturas**. **Um anexo por conversa** (o mapa de referência). As criaturas reais (`D:\Soulmon\repo\src\assets\soulmon\novos\`) entram depois, **compostas por pixel** (como no hero: `E:\tmp\heroarte\compor.py`, *nearest*, sombra de contato, escala por cena).
- Cenários **opacos** (sem alfa): vale o fim comum da seção 4, não o fim de alfa do `ASSETS-CHATGPT.md`.

## 2. Mudanças da revisão (resumo)

1. **Câmera corrigida:** o rascunho pedia "câmera frontal"; os mapas da main (`bg-jogos`, `bg-arena`, `bg-exploracao`) são **isométricos 3/4**, ilhas de blocos flutuando no vazio turquesa-escuro. Todas as capas agora seguem isso, recortando UMA ilha/recanto do mapa (os mapas são verticais; a capa é um recorte horizontal, não o mapa inteiro).
2. **Sprites trocados** (conferidos abrindo os PNG; ver seção 3): saíram 8 dos 12 sugeridos.
3. **Mecânicas conferidas no código:** Combina 3 é **combate** (você à esquerda, **3 inimigos em fila** à direita, golpe por combinação, o inimigo responde); o rascunho mostrava só 1 silhueta e "gemas soltas". Pedra-papel-tesoura é **melhor de 3 vitórias** (`RPSGame.tsx`). Chuva de Almas é bullet hell vertical (`SoulBarrage.tsx`). Corrida usa `DinoGame.tsx`. "Pet Cycle" não existe e não é citado. Calabouço: MVP, 3 andares/dia, em construção. Rift: sem prêmio, teto offline 8 h.
4. **Arena virou 1 capa** (duelo e torneio), **Ateliê 1 capa**. Sumiram `torneio`, `duelo` separados (total 8).
5. **Prompts reescritos para cenário vazio**, com "THE SCENE CONTAINS NO CREATURES" e a proporção no fim; marcações de **onde cada sprite entra** (seção 5).
6. **Anti-forja:** Ateliê e Arena sem fornalha, fumaça, vapor, cano de vapor, lava, carpete vermelho nem ossos (o `bg-arena` tem esqueletos e lava: não usar como anexo; ver 4.6).

## 3. Sprites: o que foi visto e trocado

Lista de exclusões do site (`elenco.json › excluidos`) respeitada: nenhum sprite abaixo está nela, e **nenhum dos 5 da DEMO (`starters/`)** é usado.

| Rascunho | Problema visto no PNG | Troca |
|---|---|---|
| `eletricidade-champion` | placas metálicas e bobinas empilhadas: lê como máquina/pistão; dourado | **`ar-rookie`** (pássaro redondo branco e turquesa, ágil) em Chuva de Almas |
| `sombra-champion` | felino roxo com anéis vermelhos: lookalike de franquia famosa | `morte-rookie` (raposa de máscara de osso, chama menta) em Pedra-Papel-Tesoura |
| `arcano-champion` | corpo dourado com anel sobre a cabeça: auréola | **`arcano-rookie`** (coruja de chapéu, runas turquesa) no Ateliê |
| `espaco-champion` | **anel de auréola** ao redor da cabeça | `espaco-rookie` (axolotl turquesa e roxo) em Pedra-Papel-Tesoura |
| `tempo-champion` | casco com roda dentada/relógio: leitura de máquina/engrenagem | removido |
| `marcial-champion` | está em `excluidos` (lookalike) | removido |
| `industrial-champion` | está em `excluidos` (steampunk) | removido |
| `morte-champion` | cabeças-planta com dentes, assustador (cena é "nunca assustador") | `vida-champion` (tartaruga com chama-lanterna e flor) no Rift |
| `gravidade-champion`, `planta-champion`, `fogo-champion` | OK. `fogo-champion` tem crânio de osso: aceitável (dark moderado, sem gore); trocar por `fogo-rookie` se o dono achar pesado | mantidos |
| `fada-champion` | OK mas rosa-choque destoa da família | não usado |
| `ar-champion` | pégaso branco (vetado pelo rascunho) | não usado |
| `terra-champion` | roda dourada no casco lê como engrenagem | não usado |

**Elenco final (11 sprites, todos de `novos/`):** `planta-champion`, `ar-rookie`, `fogo-champion`, `morte-rookie`, `espaco-rookie`, `arcano-rookie`, `vigor-champion`, `gravidade-champion`, `vida-champion`, e para Combina 3 os inimigos `morte-rookie` → `espaco-rookie` → `gravidade-champion` (sprites reaproveitados de outras capas, tamanho crescente). Calabouço usa a **silhueta** de `gravidade-champion` (preenchida de #08191A, sem detalhe). `vigor-champion` (urso com maça de osso e armadura laranja) é o lado quente da Arena: confira antes que a maça não leia como arma exagerada; se sim, use `fogo-rookie`.

## 4. Formato, consistência e fim comum

**Formato:** gerar em **1600x1200** (4:3). Sem moldura desenhada (a moldura de cobre é 9-slice do site). Terço inferior (y de 800 a 1200) **calmo**: vazio turquesa-escuro, névoa e no máximo 3 cubinhos flutuantes pequenos; é onde entra o título em HTML. Nada importante nos 100 px das bordas.

**Consistência entre as 8 e com os mapas da main:**
- **Câmera:** isométrica 3/4 (a dos mapas), uma ilha/recanto flutuante de blocos de pedra com musgo, raízes e cristais penduradas na base, vazio escuro ao redor com nuvens e cubinhos flutuantes. Mesmo ângulo nas 8.
- **Luz:** única, ambiente turquesa vinda do cristal da alma (brilho no topo direito) + chamas turquesa em lanternas/pilares; sombra #08191A; sem segundo sol.
- **Pixel:** mesma densidade do `bg-jogos` (contorno escuro de 1 pixel, sem blur, sem anti-aliasing, sem gradiente suave); cada cena numa escala de pixel só.
- **Identidade (regra máxima):** base turquesa escuro, **cristal da alma com chama**, **cobre** (conduítes finos, engastes, arcos), **circuito brilhando** em pouca quantidade e **folhinhas**; tudo conectado por cabo, planta integrada. Cor viva só em flores e cogumelos como nos mapas, em pouca quantidade.
- **Vibe:** arcano e natureza. Sem engrenagem, rebite, parafuso, válvula, manômetro, correia, cartola, chaminé, fornalha, fumaça, vapor, lava, ossos, monstros. Cobre = autômato antigo com musgo e conduítes, no máximo.
- **Roxo:** só o do mapa de Exploração (fendas), nunca dominante.

**Fim comum (colar no final de todos os prompts):**

> 16-bit pixel art in the exact style, palette and pixel density of the attached reference map: isometric 3/4 view of a floating island made of mossy stone blocks with hanging roots and glowing crystals, dark teal void and soft clouds around it. Crop in on ONE small area of the reference, do not reproduce the whole map. Full-bleed OPAQUE scene, no transparency. Keep the bottom third of the image calm: dark turquoise void with faint mist and at most three tiny floating cubes, no detail. Single light source: a turquoise soul-crystal glow from the upper right plus small turquoise flame lanterns. Palette: dark turquoise (#08191A, #0F2A29, #29C9B8, #5FF3E0), copper accents (#C68642, #D9A05B, #EBBE84), thin glowing circuit traces and a few green leaf sprigs, small quantity. Arcane nature-and-magic mood, calm. 1-pixel dark outline, no soft gradients, no blur, no anti-aliasing, square-grid pixels. NO text, NO letters, NO numerals, NO logo, NO UI, NO HUD, NO health bars, NO score, NO buttons, NO frame, NO game-screen mockup. No gears, cogs, rivets, bolts, valves, pressure gauges, straps, furnaces, smoke, steam, lava, bones, skulls, monsters, humans, steampunk. THE SCENE CONTAINS NO CREATURES. 4:3 landscape full-bleed composition, 1600x1200.

## 5. As 8 capas

Cada bloco: arquivo, mecânica (conferida no código), cena, **onde cada sprite entra** (sobre o canvas 1600x1200; altura em px do sprite já ampliado por *nearest*), anexo, prompt. Cole o prompt e depois o **fim comum**.

### 5.1 `combina` | Combina 3 / Elemental Fusion
- **Mecânica:** combate por combinação: você de um lado, 3 inimigos em fila do outro; combinar peças de um elemento é um golpe nesse elemento no inimigo ativo, e o inimigo responde (`Match3Game.tsx`).
- **Cena:** recanto de ilha com duas plataformas: à esquerda uma plataforma redonda de musgo (seu lugar); à direita uma fileira de **3 pedestais de pedra** que sobem de altura em degraus, vazios. Entre os dois lados, no ar, um arco de **gemas de elemento** (6 cores, pequenas) em fila solta, 3 delas iguais alinhadas e brilhando, com um raio curto saindo em direção aos pedestais. As gemas flutuam como cristais, **não em grade nem tabuleiro**.
- **Sprites:** `planta-champion` à esquerda, em x 25%, pés em y 62%, altura ~330 px. Inimigos, da frente para o fundo, pés em y 55%: `morte-rookie` (x 62%, ~200 px), `espaco-rookie` (x 72%, ~230 px), `gravidade-champion` (x 83%, ~300 px), todos virados para a esquerda (espelhar na composição).
- **Anexar:** `bg-jogos.png` (ilha do Salão de Jogos).
- **Prompt:**
> Game cover scenery, not a screenshot. A small corner of a floating mossy island: on the left a round mossy platform with a few vines, empty. On the right three stone pedestals in a rising staircase, arranged in a row one behind the other, empty. Floating in the air between them, a loose curved row of small faceted element gems in six colors (turquoise, red, green, pink, orange, violet), three identical turquoise gems in the middle lined up and shining, releasing a short bright beam of energy toward the pedestals. The gems are free floating crystals, NOT a grid and NOT a board. Soul crystals and turquoise flame lanterns on the pillars, copper conduit with thin circuit traces, leaf sprigs.

### 5.2 `barrage` | Chuva de Almas / Soul Barrage
- **Mecânica:** bullet hell vertical; arrasta para desviar de projéteis; o Soulmon atira sozinho (`SoulBarrage.tsx`).
- **Cena:** vista de cima-isométrica de uma ilhota pequena embaixo e muito céu escuro acima, de onde descem em leque espiral **orbes luminosos** (turquesa e cobre suave), alguns passando perto da ilhota; um espaço vazio no meio dela para o Soulmon. Mensagem: "desvie das almas".
- **Sprites:** `ar-rookie` em x 50%, pés em y 66%, altura ~220 px, levemente inclinado (rotação ~8 graus); sem faíscas desenhadas por cima (se quiser, 3 pixels turquesa acima dele).
- **Anexar:** `bg-exploracao.png`.
- **Prompt:**
> Game cover scenery, not a screenshot. A tiny floating mossy stone islet at the lower middle with one EMPTY flat spot at its center. Above it a wide dark night sky with a graceful spiral fan of glowing soul orbs (turquoise and soft copper) raining down in curved lanes, two orbs passing close to the islet, small floating stone cubes in the void. The orbs are painted scenery, not an interface: no counters, no bars. Crystals on the islet glowing turquoise, a thin copper conduit with circuit trace along its edge.

### 5.3 `corrida` | Corrida com obstáculos / Obstacle Run
- **Mecânica:** correr e pular obstáculos; a cada 100 pontos, 1 Bit (`DinoGame.tsx`).
- **Cena:** uma trilha de pedras em diagonal isométrica sobre uma ilha comprida, vista da lateral; 2 obstáculos naturais pintados à frente (toco com raízes brilhando, pedra rúnica baixa), cubinhos de pedra flutuando em paralaxe e raízes ao fundo. Sensação de velocidade por faixas de poeira, sem mostrar o Soulmon.
- **Sprites:** `fogo-champion` em pleno salto à esquerda dos obstáculos, x 32%, pés em y 52% (no ar, ~60 px acima da trilha), altura ~300 px, virado para a direita; sombra de contato no chão da trilha em x 32%, y 66%.
- **Anexar:** `bg-exploracao.png` (trilha de pedras).
- **Prompt:**
> Game cover scenery, not a screenshot. A long diagonal stone-slab path across a floating mossy island, seen in isometric 3/4 view, running from left to right. On the path ahead, two natural obstacles: a mossy tree stump with glowing turquoise roots, and a short rune-carved stone. The path is EMPTY in front of the stump (leave a clear gap and clear air above it). Faint dust streaks and parallax floating cubes to suggest speed, crystals and flame lanterns on the edge, copper conduit with circuit trace along the border.

### 5.4 `ppt` | Pedra · Papel · Tesoura / Rock · Paper · Scissors
- **Mecânica:** contra o seu Soulmon; **quem vencer 3 rodadas leva a partida** (`RPSGame.tsx`).
- **Cena:** o recanto do **Salão de Jogos** (cabana de flor/cogumelo do `bg-jogos`) como referência de clima: uma mesa redonda de pedra numa plataforma de musgo, dois espaços vazios frente a frente, e sobre a mesa **três emblemas de pedra** em triângulo: um punho de pedra, uma folha lisa, uma lâmina de dois gumes (a do mapa é pixel pintado, sem texto, sem "VS").
- **Sprites:** `morte-rookie` à esquerda, x 24%, pés em y 62%, ~260 px, virado para a direita; `espaco-rookie` à direita, x 76%, pés em y 62%, ~260 px, virado para a esquerda (frio contra quente; ambos expressão calma).
- **Anexar:** `bg-jogos.png`.
- **Prompt:**
> Game cover scenery, not a screenshot. A small mossy stone platform with a round stone table in the middle, seen in isometric 3/4 view, among mushrooms, flowers and vines like the reference. Two EMPTY flat spots face each other across the table at left and right. On the table, three large carved emblems in a triangle: a rock fist, a flat leaf, and a double-edged blade, copper-edged and softly glowing turquoise, pixel-painted, with no text. Soul crystals, turquoise lanterns, copper conduit with circuit trace.

### 5.5 `mente` | Ateliê da Mente / Mind Workshop
- **Mecânica:** jogos de memória, regras e lógica, sem promessa de resultado; reúne Trilha do Pet, Colcha, Eco, Troca, Picross, Bolhas do Sonho e Revisão (`mente/*.tsx`; intro: respiração lenta e bolhas calmas, "nada aqui precisa ser entregue"). Pet Cycle não existe.
- **Cena:** recanto de estudo ao ar livre numa ilha: mesa de pedra baixa com peças soltas (uma trilha curva de pedrinhas com luzes, quadradinhos de retalho com cantos de cobre formando uma pequena colcha, três pedras acendendo em sequência), almofada de musgo vazia para o Soulmon, bolhas calmas flutuando e um cristal da alma pequeno sobre a mesa. Sem lâmpada, cérebro, relógio, quadro-negro, fumaça ou fornalha (não pode ler como oficina/forja).
- **Sprites:** `arcano-rookie` sobre a almofada, x 44%, pés em y 60%, ~250 px, virado para a mesa (direita).
- **Anexar:** `bg-jogos.png`.
- **Prompt:**
> Game cover scenery, not a screenshot. A quiet outdoor study nook on a floating mossy island, isometric 3/4 view: a low stone table with puzzle pieces laid out on it: a winding line of small glowing pebbles forming a path, a few patchwork fabric squares with copper corners tiled like a tiny quilt, and a row of three stones lighting up one after another. A small soul crystal on the table throws a turquoise glow. Next to the table an EMPTY round moss cushion. Calm soap-like bubbles floating, vines, scrolls, leaf sprigs. No light bulbs, no brains, no clocks, no workshop tools, no chimney.

### 5.6 `arena` | Arena (duelo e torneio)
- **Mecânica:** na Arena o jogador escolhe 1 de 3 desafios de poder parecido; Duelo é contra outro Soulmon, uma rodada de cada vez; Torneio é o ranqueado (3 oponentes sorteados). Elemento neutro em Duelo e Torneio (`ArenaGame.tsx`, `TournamentPage.tsx`; REGISTRO §177). Não prometer vantagem elemental.
- **Cena:** um pequeno anfiteatro de pedra e musgo aberto ao céu, círculo de areia clara no centro com **dois espaços vazios frente a frente**, 3 degraus de arquibancada atrás, arcos de cobre com cristais nos pilares, **uma escadinha subindo a um pedestal de pedra** com uma taça de cobre e cristal (troféu sem inscrição) ao fundo. Nada de caveiras, ossos, lava, carpete vermelho, dragões (o `bg-arena` tem tudo isso: **não anexar**; a estética aqui é a calma da Exploração).
- **Sprites:** `vigor-champion` à esquerda, x 30%, pés em y 64%, ~310 px, virado para a direita (lado quente); `gravidade-champion` à direita, x 70%, pés em y 64%, ~310 px, virado para a esquerda (lado frio). Duas figuras de tamanho igual, sem plateia.
- **Anexar:** `bg-exploracao.png` (ruína de pedra e cristais).
- **Prompt:**
> Game cover scenery, not a screenshot. A small round mossy stone amphitheater on a floating island, isometric 3/4 view, open to a dark turquoise night sky: a circle of pale sand in the center with two EMPTY spots facing each other, three low stone steps of seating behind, copper-trimmed arches, soul crystals and turquoise flame lanterns on the pillars. At the back, a short stair rising to a stone pedestal holding a small cup-shaped trophy made of copper and crystal, no inscription. Calm and noble, no blood-red, no bones, no lava, no furnace, no smoke.

### 5.7 `rift` | Endless Rift / Fenda Sem Fim
- **Mecânica:** descida que segue sozinha fora da tela, sem teto de camadas, teto de 8 h offline; sem prêmio prometido (aprovação manual, não anunciar). Mora na Exploração.
- **Cena:** uma ilha pequena em isométrica 3/4 com uma **fenda circular no chão**, de onde desce em espiral um **poço de degraus de pedra e névoa** diminuindo para um ponto turquesa distante; pequenos cristais engastados nas paredes diminuem com a profundidade; raízes pendem na borda. Uma saliência de pedra vazia na borda da fenda, em primeiro plano. Profundo, calmo, arcano.
- **Sprites:** `vida-champion` na saliência, x 30%, pés em y 60%, ~260 px, virado para a direita (olhando a fenda); a chama-lanterna do casco ajuda o conceito.
- **Anexar:** `bg-exploracao.png`.
- **Prompt:**
> Game cover scenery, not a screenshot. A small floating mossy island in isometric 3/4 view with a large round chasm in the ground: concentric layers of stone steps and mist spiral down toward a pinpoint turquoise glow far below, small soul crystals embedded in the walls getting smaller with depth, vines hanging over the rim, a copper conduit with thin circuit traces along the edge. In the lower-left foreground one EMPTY flat stone ledge at the rim. Dark, deep, calm and arcane, never scary.

### 5.8 `calabouco` | Calabouço (em construção)
- **Mecânica:** pequeno jogo de calabouço roguelike; MVP de 3 andares por dia; `RogueDungeon.tsx`. **Selo "em construção" é HTML sobre a capa.**
- **Cena:** uma porta de pedra pesada, entreaberta, no topo de uma escadaria que desce na ilha, luz turquesa vindo de baixo, arco de cristal, musgo e raízes; névoa no chão. Mistério e convite, sem monstros.
- **Sprites:** **silhueta** de `gravidade-champion` (cheia de #08191A, sem detalhe) de lado diante da porta, x 38%, pés em y 62%, ~240 px, contraluz com 1 pixel de borda turquesa. Opcional: nenhuma criatura.
- **Anexar:** `bg-exploracao.png`.
- **Prompt:**
> Game cover scenery, not a screenshot. A heavy carved stone doorway, slightly open, at the top of a descending staircase on a floating mossy island in isometric 3/4 view, lit from below by a soft turquoise glow, a crystal arch over the lintel, turquoise flame lanterns on the posts, moss and roots, a few leaf sprigs, mist at the floor level, a copper conduit with circuit trace on the wall. An EMPTY clear spot of floor in front of the door. Mysterious and inviting, calm, no monsters, no skulls, no torches with smoke.

## 6. Composição por pixel (o que o dono ou o agente aplica depois)

Mesmo método do hero (`E:\tmp\heroarte\compor.py`): sprite do PNG original, escala **inteira** por *nearest* (altura alvo da seção 5), espelhar se preciso, pés no ponto dado, **sombra de contato** (elipse #08191A com alfa 55% e largura 70% do sprite, 1 pixel de borda), **sem blur**. Reduzir o pixel do sprite para casar com o do cenário (mesmo tamanho de "bloco" que o piso). Conferir o recorte do sprite (as arts têm 256x256 com margem; cortar pelo alfa antes de escalar). Combina 3: ordenar os 3 inimigos do fundo para frente.

## 7. Arquivos finais

Destino: `E:\Soulmon-marketing\site-assets\capas-jogos\`. Tamanho final: **1600x1200** (PNG opaco). Exibido a 256 a 384 px; o `preparar-assets.mjs` gera WebP na grade lógica 400x300 (escala inteira, *nearest*).

| Ordem | Arquivo | Capa | Anexo (cenário) | Sprites |
|---|---|---|---|---|
| 1 | `capa-ppt.png` | Pedra-Papel-Tesoura | `bg-jogos.png` | `morte-rookie`, `espaco-rookie` |
| 2 | `capa-combina.png` | Combina 3 | `bg-jogos.png` | `planta-champion` + 3 inimigos |
| 3 | `capa-mente.png` | Ateliê da Mente | `bg-jogos.png` | `arcano-rookie` |
| 4 | `capa-barrage.png` | Chuva de Almas | `bg-exploracao.png` | `ar-rookie` |
| 5 | `capa-corrida.png` | Corrida | `bg-exploracao.png` | `fogo-champion` |
| 6 | `capa-arena.png` | Arena | `bg-exploracao.png` | `vigor-champion`, `gravidade-champion` |
| 7 | `capa-rift.png` | Endless Rift | `bg-exploracao.png` | `vida-champion` |
| 8 | `capa-calabouco.png` | Calabouço | `bg-exploracao.png` | silhueta de `gravidade-champion` |

Guardar também o cenário cru sem sprite como `capa-<id>-cenario.png` (para recomposição se um sprite mudar). Mapas: `E:\tmp\claude\b5f03034d35be1a5\3e00f769-6e4b-4482-9866-bd58d75f44a7\scratchpad\mapas-main\`.

**Ordem de geração (1 conversa por capa, 1 anexo por conversa):** a ordem da tabela, começando pelas de `bg-jogos` (a de menor risco: o mesmo recanto do mapa), depois as de `bg-exploracao`. Aprovar a 1ª antes de seguir: ela define a régua de pixel e luz para as outras 7. Se o cenário sair fora do tom, abrir conversa nova (não corrigir na mesma) e repetir o prompt.

## 8. Checklist de aprovação

Aprovar só se TODOS:
1. **Identidade:** turquesa escuro dominante (não roxo), cristal com chama, cobre, circuito e folhinhas em pouca quantidade; calmo e arcano.
2. **Sem criatura no cenário cru:** zero criaturas, humanos, esqueletos, monstros; os espaços vazios estão onde a seção 5 pede.
3. **Sem texto na arte:** zero letras, números, símbolos legíveis, "VS", placar.
4. **Sem gameplay falso:** nenhuma tela, HUD, barra, botão, grade/tabuleiro, nem "print".
5. **Sem engrenagem/steampunk e sem forja:** nada de engrenagem, rebite, válvula, correia, chaminé, fornalha, fumaça, vapor; Ateliê e Arena não leem como oficina.
6. **Câmera e luz:** isométrica 3/4 como os mapas, uma só fonte de luz turquesa, mesma densidade de pixel do `bg-jogos`, sem anti-aliasing nem gradiente suave; reduz limpo por *nearest* ao 400x300.
7. **Sprites compostos:** os da seção 5 (nenhum da DEMO, nenhum de `excluidos`, sem auréola, sem lontra com escudo, sem máquina), nítidos, mesma escala de pixel do cenário, sombra de contato.
8. **Área do título:** terço inferior calmo e utilizável; nada importante cortado pela borda.
9. **Família:** as 8 lado a lado parecem do mesmo mundo (mesma luz, câmera e paleta-base).
10. **Verdade:** não promete o que o jogo não faz (Arena sem vantagem elemental prometida; troféu não implica prêmio; Rift sem prêmio; Calabouço marcado por HTML "em construção").
11. **Peso:** WebP final leve; nada entra no LCP.

## 9. Dúvidas restantes (para o dono)

1. `fogo-champion` (crânio de osso na cabeça) e `vigor-champion` (maça de osso) passam no tom "calmo, não assustador"? Alternativas: `fogo-rookie`, `agua-rookie`.
2. A silhueta do Calabouço precisa de criatura ou prefere a porta vazia?
3. Os 3 inimigos de Combina 3 reaproveitam sprites de outras capas: aceita a repetição ou prefere 3 sprites exclusivos (preciso de mais 3 aprovados olhando os PNG)?
4. O `mapas-main` está no scratchpad desta sessão (pasta temporária): copiar para um lugar permanente antes de anexar.

## Decisões finais (08/11/2026, coordenador)

- **Quem gera:** a sessão `[soulmon]` (operacional), no ChatGPT, uma conversa por capa. O acesso ao app foi negado a esta sessão.
- **Referências permanentes:** os mapas da `main` estão copiados em `E:\Soulmon-marketing\site-assets\ref-mapas-main\` (use essa pasta no anexo; a do scratchpad é temporária). O mapa de arena não é anexado (esqueletos, lava, carpete: lê como forja); Arena e Rift usam `bg-exploracao.png`.
- **Calabouço:** só a porta vazia, sem silhueta de criatura; o selo "em construção" é HTML.
- **Combina 3:** os 3 inimigos podem repetir sprites de outras capas.
- **Sprites duvidosos:** `fogo-champion` (crânio na cabeça) sai da lista; Arena e Rift ficam com `vigor-champion`, `vida-champion` e `planta-champion`, e a composição é feita por mim depois da geração.
- **Ateliê:** 1 capa. **Arena:** 1 capa (duelo e torneio). **Rift e Calabouço:** entram na aba Jogos.
