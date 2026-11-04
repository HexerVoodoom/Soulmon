# Cartas dos jogos (GameCard)

Cada jogo dos menus do **Ateliê da Mente**, do **Salão de Jogos** e do **Refúgio**
aparece como carta colecionável em retrato (`src/components/play/GameCard.tsx`).
A arte de cada carta é `src/assets/soulmon/cards/<id>.webp`, **600×800 (3:4)**,
ilustração sangrando até a borda (o nome entra por cima numa faixa, na parte de
baixo; deixar o terço inferior sem detalhe importante). Sem o arquivo, a carta
mostra um placeholder procedural — o build não depende da arte.

Estilo comum: arcano, natureza + magia, cristal turquesa, noturno, expressão
calma; **nada de engrenagem/steampunk**; sem texto na imagem.

| id | jogo (PT / EN) | menu | conceito da ilustração |
|---|---|---|---|
| `dino` | Corrida com obstáculos / Obstacle Run | Salão | Soulmon pequeno saltando sobre raízes e pedras rúnicas numa trilha de floresta ao luar, rastro de faíscas turquesa. |
| `ppt` | Pedra, papel e tesoura / Rock, paper, scissors | Salão | Três sigilos flutuando sobre um toco de árvore — pedra de cristal, folha dobrada, tesoura de galhos — diante de um Soulmon curioso. |
| `match3` | Elemental Fusion | Salão | Gemas elementais (fogo, água, folha, cristal) alinhando-se numa grade mística e explodindo em luz turquesa. |
| `barrage` | Chuva de Almas / Soul Barrage | Salão | Soulmon flutuando num céu noturno desviando de chuva de orbes espirituais, disparando um feixe suave. |
| `eco` | Eco do Pet / Pet's Echo | Mente | Soulmon diante de quatro cristais que acendem em sequência, ondas de som visíveis no ar. |
| `zip` | Trilha do Pet / Pet Trail | Mente | Caminho de pedras numeradas brilhantes serpenteando por um jardim de musgo, um fio de luz ligando-as em ordem. |
| `selo` | Selo Faltante / Missing Seal | Mente | Círculo de selos rúnicos gravados em pedra com um encaixe vazio, a peça faltante pairando em luz turquesa. |
| `respiracao` | Respirar com o Soulmon / Breathe with your Soulmon | Refúgio | Soulmon sereno de olhos fechados no fundo de um lago cristalino, uma bolha de luz enchendo devagar à sua frente, raios de luz e algas ondulando (o exercício acontece nessa cena subaquática). |
| `bolhas-calmas` | Bolhas calmas / Calm bubbles | Refúgio | Bolhas iridescentes flutuando sobre um lago noturno com lírios, reflexos turquesa. |
| `chama` | Chama / Flame | Refúgio | Uma chama única e estável numa lanterna de pedra entre samambaias, o Soulmon observando em silêncio. |

A lista canônica é `CARD_IDS` em `GameCard.tsx` (a Colcha/Patchwork sai — o
Selo Faltante entra no lugar). Ao gerar, conferir: 600×800, `.webp`, nome = id.
