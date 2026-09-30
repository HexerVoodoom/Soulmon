# NPCs de área pelo oráculo — perfis

> Etiqueta: **plano / só-prompts** (29/09/2026). **Decisão do dono (29/09/2026):** os prompts dos NPCs de lote passam pelo oráculo, o mesmo motor que faz as criaturas dos jogadores, em vez de ser escritos à mão.
> Gerador: `scripts/npc-oraculo-prompts.mjs` (rode `node scripts/npc-oraculo-prompts.mjs`). Saída: [npcs-oraculo-saida.md](npcs-oraculo-saida.md) e [npcs-oraculo-saida.json](npcs-oraculo-saida.json). Fichas: [00-BIBLIA-DAS-AREAS.md](00-BIBLIA-DAS-AREAS.md) §4.2.

## Como o oráculo é usado

- **Motor**: `generateOracleWithFamilies` (`src/utils/oracle.ts`), que monta cada forma com `composeSpritePrompts`. É a mesma função pura que `src/test/oracleSync.ts` usa nos testes. Não passa por `soulProfile/pipeline.ts`: o pipeline lê astrologia, numerologia e o questionário de uma pessoa real, e NPC não tem nada disso. Os eixos entram como `OracleOverrides`, o mesmo ajuste manual que a `OraclePage` expõe. Nenhum coeficiente de `soulProfile/axes.ts` foi tocado.
- **Espécie**: a ficha entra como `petDescription`, o campo em que o jogador descreve o próprio pet. O motor usa esse texto no lugar do conceito sorteado e corta em 200 caracteres.
- **Forma**: todos os NPCs saem em `rookie`. NPC é forma única, e o rookie é a única forma sem um corpo sorteado por linha. Do champion em diante o motor troca o corpo por uma forma de evolução, e o teste com Musga em champion deu "a proud beast with a blazing flame mane": a forma apaga a espécie da ficha e traz fogo, que a bíblia §5 veta. O "tiny" do rookie não vale no busto, porque o envelope da área diz que o formato de busto 768² vence.
- **Semente**: fixa. É a primeira de `29092026 + 0..63` em que a paleta, o acento e o corpo sorteados não trazem matiz proibida (roxo/rosa/magenta/violeta/periwinkle em todo lugar, vermelho/laranja fora da Arena, fogo/caveira/osso). O filtro só escolhe a semente e não mexe no motor.
- **Duas variantes**, como no app: `imagePrompt` cita as referências de gênero do motor (1ª tentativa); `imagePromptFallback` não cita (usar se o provedor recusar). A cláusula `Do not copy any existing franchise character` vem do motor nas duas, e o script falha se ela faltar. Não há `bestiaryInspiration`, então nenhum nome de criatura-inspiração entra no prompt.

## Perfis

Oito elementos do oráculo (`ElementId`), nenhum usado mais de duas vezes. `fogo` fica de fora porque a bíblia veta chama como energia.

| id | Área | NPC · ficha resumida | Elemento | Papel | Alinhamento | Reino | Por quê |
|---|---|---|---|---|---|---|---|
| `npc-mercado-itens` | Mercado | **Tamba**: caranguejo-eremita, concha-gaveteiro de latão, preciso | industrial | suporte | benevolência | cavernas | gaveteiro de latão é artefato; vende itens que ajudam; mina-bazar |
| `npc-mercado-decoracao` | Mercado | **Musga**: lesma de musgo com quartinho nas costas, lenta, caseira | planta | tanque | harmonia | pântano | musgo; carrega a casa; fala de lugares com equilíbrio |
| `npc-mercado-background` | Mercado | **Panora**: lula de terra, manto-tela de paisagens, sonhadora | água | mágico | harmonia | oceano | lula; projeta paisagens (ilusão) |
| `npc-mercado-conquistas` | Mercado | **Medra**: jabuti de casco de placas-medalha, memorioso | terra | tanque | benevolência | deserto | casco pesado; guarda marcos para quem chega |
| `npc-arena-duelo` | Arena | **Rhinoco**: rinoceronte-bípede de arenito, bonachão | terra | físico | poder | picos | contato direto; único Poder, na área do confronto |
| `npc-arena-feira` | Arena | **Fanfare**: criatura-sanfona com lanternas, festiva, coletiva | ar | suporte | harmonia | campina | fole = ar; voz coletiva, cooperativa |
| `npc-exploracao-dino` | Exploração | **Trote**: ave-corredora de turfa com pontas fogo-fátuo | sombra | físico | harmonia | pântano | turfa e fogo-fátuo do Charco; corredor |
| `npc-laboratorio-pet` | Laboratório | **Bento**: coruja-cervo com chifres de vidro e óculos de cobre | luz | suporte | benevolência | akasha | vidro e lente; cuida da criatura |
| `npc-laboratorio-stats` | Laboratório | **Quill**: louva-a-deus de vidro com patas-pena e caderno de cobre | industrial | mágico | harmonia | gelo | instrumento de registro; anota sem avaliar |
| `npc-hall-amigos` | Hall | **Nino**: esquilo-planador creme com bolsa de recados | ar | alcance | benevolência | campina | plana; leva recado longe |
| `npc-hall-guilda` | Hall | **Marla**: cervo-árvore, galhada-bosque turquesa | planta | tanque | harmonia | floresta | o bosque da Guilda; lenta e firme |

Contagens: elemento industrial 2 · planta 2 · terra 2 · ar 2 · água 1 · sombra 1 · luz 1 · papel suporte 3 · tanque 3 · mágico 2 · físico 2 · alcance 1 · alinhamento harmonia 6 · benevolência 4 · poder 1.

## Fora do oráculo (de propósito)

| NPC | Por quê |
|---|---|
| Vultrak (`npc-arena`), Vesca (`npc-laboratorio`) | **repintura fiel** de arte aprovada, com a imagem anexada. Um prompt de criatura nova desfaria o design. Se o dono decidir **refazer do zero**, entram nesta tabela e no script. |
| Lumi (`npc-hall`) | só conferência de paleta, 0 imagens |
| Grom, Zeph, Pipo | sem ajuste de arte (bíblia §4.3; Pipo por decisão do dono) |

## Nomes conferidos

Nenhum dos 11 termina em `-mon`, e o script reprova se algum terminar. Nenhum coincide com os termos que `src/narrativa.contract.test.ts` trava (`tamer`, `domador`, `treinador`, `digievolução`, `mundo digital`). "Tico" já saiu e virou Bento (bíblia §0). No `imagePrompt`, os únicos nomes de franquia são os de `GENRE_REFERENCES`, que o próprio motor cita na 1ª tentativa, e o `imagePromptFallback` não cita nenhum.
