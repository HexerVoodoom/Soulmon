# Mascote principal do Soulmon — análise e proposta

Pesquisa de agosto/2026 sobre como as franquias vizinhas construíram seus
mascotes, cruzada com os arquétipos junguianos que o Persona usa como estrutura,
e aplicada à restrição que só o Soulmon tem: **a criatura central é gerada por
usuário.**

Documento de decisão. A recomendação está na seção 5; as seções 1–4 são o
porquê. Nada aqui é aconselhamento jurídico — a validação de marca do nome
escolhido continua sendo item de dono/advogado, como todo o resto de IP no
`docs/Attributions.md`.

---

## 0. A pergunta certa

"Qual criatura vira o mascote?" é a pergunta errada, e vale gastar um parágrafo
nisso antes de qualquer coisa.

Pokémon tem mais de mil designs fixos. Digimon tem um roster fixo. Tamagotchi tem
um elenco fixo. Nos três, o mascote é **um item escolhido de um catálogo que todo
jogador compartilha** — é possível haver um favorito porque existe um conjunto
comum sobre o qual votar.

O Soulmon não tem esse conjunto. O pet nasce do oráculo (`src/utils/oracle.ts`) a
partir de nome, nascimento, quiz e do "porquê" do usuário. A promessa inteira do
produto é *este aqui é seu*. Isso cria um problema que nenhuma das referências
teve que resolver:

> **Qualquer criatura específica elevada a mascote disputa com o pet do jogador
> exatamente o espaço emocional em que o jogo foi construído.**

Se o mascote for bonito demais, o jogador quer o mascote e não o que recebeu. Se
for "o melhor resultado", o jogador que recebeu outro entende que cuidou errado.
Se for uma das linhas jogáveis, as outras viram sobras.

Então a restrição de projeto não é estética, é estrutural: **o mascote do Soulmon
precisa ocupar um lugar que o pet do jogador nunca pode ocupar.** Tudo abaixo é a
busca por esse lugar.

---

## 1. Os cinco modelos de mascote que a pesquisa encontrou

### 1.1 Pikachu — o mascote emergente, e o único que não foi escolhido por ninguém

Pikachu **não foi desenhado para ser mascote**. Ken Sugimori estava com
dificuldade de conceber designs mais fofos e chamou Atsuko Nishida; o briefing
dela era um Pokémon elétrico que evoluísse duas vezes, com a forma final parecendo
forte. O nome é *pika* (o estalo da luz) + *chu* (o guincho do rato); as bochechas
que guardam eletricidade vieram de esquilos.

Duas decisões posteriores é que fizeram o mascote:

1. **A votação.** Sugimori imprimiu o pixel art de todos os Pokémon e fez uma
   enquete interna na Game Freak. Pikachu ganhou com folga.
2. **A escolha do anime, que é a parte importante.** O diretor entendeu que quem
   não tivesse escolhido *aquele* inicial se sentiria distante da série — então
   deliberadamente usaram um Pokémon que o jogador **não podia escolher no
   começo do jogo**.

> **A lição que interessa ao Soulmon:** o mascote funcionou porque **não era de
> ninguém em particular, e por isso pôde ser de todo mundo**. Pikachu não é o
> starter de nenhum jogador — é justamente por estar fora da escolha que ele não
> invalida a escolha de ninguém.
>
> Isso é a resposta direta ao problema da seção 0. O mascote do Soulmon precisa
> estar **fora da árvore jogável**, pelo mesmo motivo pelo qual Pikachu está fora
> dos iniciais.

### 1.2 Agumon — o mascote nunca aparece sozinho

Kenji Watanabe desenhou os dois primeiros Digimon, Tyranomon e Agumon, a partir
de uma ideia simples: *poder levar um dinossauro pra passear*. Agumon é tratado
como símbolo e mascote eterno da franquia — mas as fontes são consistentes num
detalhe: ele é citado **sempre junto do Taichi**. A unidade de marca do Digimon
não é uma criatura, é **um par: criatura + parceiro humano**.

E um detalhe de produção que vale registrar: as primeiras ilustrações do Agumon
tinham preto no topo da cabeça porque Watanabe estava **sem tempo** e usou aquilo
como sombra e economia de trabalho. Deu certo e virou marca associada ao Digimon.

> **Duas lições:**
>
> 1. **O par é a unidade.** No Soulmon o par equivalente já existe e é melhor: é
>    **criatura + usuário**. Qualquer arte de mascote que mostre a criatura
>    sozinha está jogando fora o ativo mais forte do produto.
> 2. **Acidente que lê como intenção vira identidade.** Não fabrique
>    "profundidade" no design — uma marca gráfica simples e estranha o suficiente
>    para parecer proposital resolve reconhecimento melhor que simbolismo
>    explicado.

### 1.3 Jack Frost — o modelo que ninguém copia, e o mais relevante aqui

Jack Frost é mascote **corporativo da Atlus desde 1990**. Não é protagonista, não
é membro de equipe, não pertence à história de jogo nenhum. Aparece em todos os
títulos, em todos os registros de tom, e a fofura dele é **deliberadamente
contraditória** com a franquia: infantil e amigável na superfície, capaz de matar
congelando quando se irrita. O ativo de marca não é nem o desenho — é o bordão
("hee-ho").

> **A lição, e é a mais importante do documento:** o mascote pode viver **uma
> camada acima do jogo**, e a função dele é **segurar a contradição de tom da
> franquia num corpo só.**
>
> O Soulmon tem exatamente essa contradição e ela não está resolvida em lugar
> nenhum hoje. O app tem corpo de v-pet fofo e faz, no onboarding, duas perguntas
> que não são fofas: *o que você quer melhorar* e *o que mais te atrapalha*. Ele
> conversa com gente doente, deprimida e em crise — o `PLANO-EVOLUCAO.md` diz
> isso com todas as letras. Hoje essa dualidade é carregada pelo tom dos textos,
> pulverizada, sem rosto.
>
> **A inversão certa para o Soulmon:** o Jack Frost é fofo por fora e *cruel* por
> dentro. O mascote do Soulmon é fofo por fora e, por dentro, **já viu muita
> coisa**. Não é ameaça — é quilometragem. Gentil, sem pressa, levemente velho.
> A contradição é "criatura de desenho animado que sabe exatamente o quanto
> alguns dias custam", e é isso que impede o app de soar ingênuo para quem o abre
> num dia ruim.

### 1.4 Mametchi — a armadilha, e é uma armadilha real

Mametchi é o **resultado do melhor cuidado possível** na maioria dos aparelhos
Tamagotchi: bem-educado, QI 250. Começou como um entre vários rostos e virou
gradualmente o mascote da franquia, depois mascote não-oficial da própria Bandai
— ele recebe as visitas na entrada do escritório.

É o modelo mais natural para um v-pet, é o que um mascote de app de produtividade
tende a virar sozinho, e o Soulmon **não pode usá-lo**:

| O que o Soulmon já travou | O que um mascote "melhor cuidado" faria |
|---|---|
| "Nenhum ritmo é melhor que outro" (`carePattern.ts`, com teste exigindo que os três puxem galhos distintos) | Estabelece um ritmo campeão |
| Traços de nascimento são **todos positivos**, porque punir por um dado que o jogador não jogou é injusto (teste travando) | Estabelece um resultado campeão |
| Teto de 1 coração/dia, perdão de ausência, alívio semanal | Estabelece que quem precisou desses perdões está longe do ideal |

> **Um mascote que é o resultado do cuidado perfeito reintroduz em silêncio a
> hierarquia que o jogo apagou de propósito.** Ele diz a cada jogador que recebeu
> outra coisa que cuidou errado — que é literalmente a definição de "cobrador" que
> a essência declarada rejeita. É a Fase 1 inteira desfeita por uma escolha de
> arte.
>
> Regra que sai daqui: **o mascote não pode ser um resultado. Não pode ser
> alcançável, comprável, desbloqueável nem colecionável.** No instante em que ele
> for obtenível, ele vira um placar.

### 1.5 Morgana e Teddie — o navegador

O mascote interno do Persona não é o herói: é quem **lê a situação de volta pra
você**. Teddie é navegador antes de virar membro de equipe, e a descrição da
própria Atlus é reveladora: um mascote de TV "estilo Disney, querido por todos".
Ele começa como uma **entidade vazia** e vira alguém ao se ligar a pessoas.
Morgana é criação do Igor, feita para ajudar, e é o analista/navegador do grupo —
com um traço cínico que impede o papel de virar açúcar.

> **A lição:** a função do mascote-companheiro é **narração**, não desempenho.
> Ele explica o mundo, comenta o que aconteceu e é a voz do jogo — e é aí que
> "entidade vazia que vira alguém por vínculo" descreve, sem querer, o
> `DailyReportModal` e o oráculo do Soulmon melhor que qualquer briefing.

---

## 2. A camada junguiana — o que o Persona realmente empresta

O Persona não usa Jung como decoração; usa como estrutura. Vale separar o que é
aproveitável.

**Persona × Sombra.** A Persona é a personalidade que exibimos ao mundo; a Sombra
é a parte que escondemos. Individuação é integrar as duas. Isso já descreve o
Soulmon sem forçar: o pet é **gerado a partir do próprio usuário** (nome,
nascimento, quiz, o "porquê") — ele *é* uma persona, um rosto que a pessoa recebe
de volta. E a pergunta "o que mais te atrapalha" é, literalmente, um pedido de
Sombra. Esse eixo é do **pet**, não do mascote.

**Philemon.** Vem dos escritos do próprio Jung, como "espírito guia sábio". No
Persona ele **se limitou a ser ajudante e guia**, e criou o Igor para aprimorar o
potencial dos protagonistas. Ele não age no lugar de ninguém — a limitação é
deliberada.

> Essa é a fronteira "companheiro, não cobrador" enunciada em termos junguianos, e
> é a melhor definição de cargo que o mascote do Soulmon pode ter: **quem entrega
> a ferramenta e sai de cena.** Um guia que não pode fazer por você.

**O Louco, Arcano 0.** Lâmina em branco: potencial infinito, sem personalidade
ainda definida; zero é nada e ilimitado ao mesmo tempo. E o detalhe mecânico que
fecha a questão: **o Louco pode empunhar qualquer Persona, de qualquer arcano.**

> É o espelho exato do que a seção 0 pediu. Uma figura que **não é nenhum galho e
> por isso representa todos**. Não é metáfora bonita — é a mesma solução de
> design, resolvida antes, por outro jogo.

**Os 12 arquétipos de marca (Jung via Mark & Pearson).** A escolha óbvia para um
app de bichinho é o **Cuidador** (compassivo, nutridor, generoso — Johnson &
Johnson). **Está errada, e o erro importa:** o Cuidador é a *marca* que cuida de
*você*, o que põe o app no lugar de mãe/autoridade. No Soulmon quem cuida é o
usuário, e o pet cresce *junto*. Adotar Cuidador é escolher, de novo, o chefe.

A distribuição correta:

| Camada | Arquétipo | Por quê |
|---|---|---|
| **Mascote (superfície)** | **Inocente** | Otimismo, segurança, juventude, ausência de culpa. É exatamente o elogio mais repetido ao Finch: "não me faz sentir culpado" |
| **Mascote (estrutura)** | **O Louco / Arcano 0** | Não é nenhum galho, logo representa todos. Resolve a seção 0 |
| **Sistemas (oráculo, cerimônia de evolução)** | **Mago** | Transformação, tornar potencial real. É função dos *rituais*, não da criatura |
| **Nunca** | Sábio, Governante, Herói | Todos põem o app acima do usuário. São o "chefe" com outro nome |

---

## 3. O que a pesquisa diz sobre a forma

Convergência total entre as fontes, e é curta:

- **Teste de silhueta.** Um bom design é reconhecível só pela silhueta. É o teste
  final de clareza, e prova que a forma geral pesa mais que qualquer detalhe.
- **Formas simples.** Sugimori estabeleceu as regras visuais da franquia com
  formas simples, silhuetas marcantes e esquemas de cor claros; um Pokémon usa
  tipicamente **2 a 6 formas reconhecíveis**.
- **Traço exagerado.** Olhos grandes demais ou uma forma distintiva são o que
  torna a criatura instantaneamente reconhecível e emocionalmente engajante.

Para o Soulmon isso tem um agravante prático que as franquias não têm: **o
mascote precisa sobreviver a 16 px.** Ele vai aparecer no ícone do APK, no
favicon, no widget Android (`WidgetRenderer.kt`), no cartão da loja e, se um dia
houver, no Steam. Silhueta não é conselho estético aqui — é requisito técnico.

**E a boa notícia: a silhueta já existe no repositório.** `rookie.png`,
`dungeon-spirit.png` e `ultra.png` compartilham a mesma assinatura — **corpo
redondo, dois chifres/pontas, dois olhos-ponto, boca mínima, sombra elíptica no
chão** —, variando só paleta e adorno. Não é preciso inventar uma linguagem
visual; é preciso **reconhecer a que já foi desenhada** e nomear o seu grau zero.

---

## 4. Síntese — o cargo do mascote, antes do desenho

Cruzando tudo:

| Fonte | O que ela exige do mascote do Soulmon |
|---|---|
| Pikachu | Estar **fora da escolha do jogador** |
| Agumon | Aparecer **em par com o usuário**, nunca sozinho |
| Jack Frost | Viver **acima do jogo** e segurar a contradição de tom |
| Mametchi | **Não** ser um resultado, prêmio ou desbloqueio |
| Morgana/Teddie | **Narrar**, não performar |
| Philemon | **Guiar e sair de cena** — não agir no lugar da pessoa |
| Arcano 0 | **Não ser nenhum galho**, para poder representar todos |
| Silhueta | Sobreviver a 16 px |

As sete primeiras linhas descrevem **o mesmo personagem**, e é um personagem que
o Soulmon quase tem: **a forma que toda criatura foi antes de ser de alguém.**

---

## 5. Proposta

### 5.1 O conceito

> **O mascote do Soulmon é a alma antes do oráculo.**
>
> Não é o pet mais forte, nem o mais bem cuidado, nem o primeiro da árvore. É o
> **estado anterior à espécie**: sem elemento, sem atributo, sem galho, sem
> linhagem — porque existe antes de haver galhos. É o que o oráculo pega na mão e
> devolve como *o seu*.
>
> Ele **não evolui**. Não é um estágio. Não tem forma seguinte, e é isso que o põe
> permanentemente fora da competição com o pet do jogador: ele não está atrás nem
> à frente na mesma escada — **ele não está na escada.**

Isso resolve, de uma vez, as sete exigências da seção 4: está fora da escolha
(Pikachu), acima do jogo (Jack Frost), não é obtenível (anti-Mametchi), é o Zero
que contém todos os arcanos (Louco), e o cargo natural dele é conduzir o ritual e
sair (Philemon).

### 5.2 O contrato de tom

Herdado do Jack Frost, invertido:

- **Superfície:** Inocente. Redondo, macio, sem ângulo agressivo. Nunca irônico,
  nunca sarcástico (é o ponto onde ele se separa do Morgana — cinismo aqui
  machuca).
- **Fundo:** já viu muita coisa. Sem pressa, sem alarme, sem entusiasmo forçado.
  **Nunca se assusta com um dia ruim** — é a característica definidora, e a
  tradução em personagem da regra de que ausência não cobra nada.
- **O que ele nunca faz:** cobrar, contar, comparar, lembrar de streak, dizer
  "você não fez". Ele não tem acesso a placar. É o único personagem do app que
  estruturalmente **não sabe seus números** — e vale implementar assim de fato,
  não só no tom.

### 5.3 A forma

Deriva direta do que já existe em `src/assets/soulmon/`:

- **Corpo:** o círculo macio do `rookie.png`, com as duas pontas. É a assinatura
  da casa; o mascote é o grau zero dela.
- **Rosto:** dois olhos-ponto e boca mínima. Nada de sobrancelha, nada de dente.
- **Cor:** **indefinida, e isso é a ideia.** Enquanto todo pet fecha numa paleta
  de elemento (o pool de `oracle.ts`) com acento de tipo (Vírus vermelho / Data
  ciano / Vacina dourado), o mascote é **branco-perolado / cinza-lavanda**, sem
  acento. Ele é a cor de antes da leitura.
- **Marca gráfica (o "acidente do Agumon", de propósito):** **uma única partícula
  orbitando**, sempre presente, sempre no mesmo lugar relativo. Custa ~4 px, lê a
  16 px, e é a coisa que se copia num sticker. Já há vocabulário disso nos
  sprites atuais (as partículas ao redor do `rookie` e do `ultra`).
- **Escalas obrigatórias:** 16 px (widget/favicon), 48 px (HUD/loja), 512 px
  (ícone de loja/APK). Se a silhueta não passa a 16, o design não passa.

### 5.4 O bordão

O ativo de marca do Jack Frost é o "hee-ho", não o desenho. Vale ter um, e ele
tem uma restrição dura no Soulmon: **precisa funcionar em PT-BR e em EN sem
tradução** (`resolveLanguage`, `utils/i18n.ts`), porque bordão traduzido não é
bordão. Ou seja: som, não palavra. Duas ou três sílabas, sem consoante que quebre
entre os idiomas. Fica como item aberto — é decisão de dono e se testa em voz
alta, não em documento.

### 5.5 Onde ele aparece — e onde não

| Aparece | Não aparece |
|---|---|
| Ícone do app, favicon, splash | Na árvore de evolução |
| Ritual do oráculo (ele conduz e some) | Na loja, em qualquer aba, a qualquer preço |
| Tela vazia / primeiro uso | Como inimigo da masmorra |
| Retorno de ausência (`welcomeBack`) — **o melhor uso dele no app inteiro** | No `GameState` como espécie |
| Erro, offline, save não encontrado | Como recompensa de missão |
| Marca, loja, redes, merch | Em qualquer lugar que implique conquista |

A coluna da direita não é higiene de escopo — **é a proteção contra a armadilha
Mametchi da seção 1.4.** Vale um teste travando "o id do mascote nunca aparece em
`SHOP_ITEMS`, `TOURNAMENT_ITEMS`, `MISSIONS` nem no roster da masmorra", na mesma
linha dos testes que já travam as fronteiras de moeda e a ausência de nomes de
franquia no prompt do oráculo.

### 5.6 Nome — três candidatos

O estilo da casa já está definido pelas seis linhas próprias (Ignar, Kaelen,
Lumel, Orrin, Serah, Thalindra): **duas ou três sílabas, fantasia leve, sem
sufixo `-mon`** — o `-mon` fica no nome da franquia, onde é genérico, e não na
criatura, onde aproximaria de marca alheia.

| Nome | De onde vem | A favor | Contra |
|---|---|---|---|
| **Nima** | de *anima* (alma, em latim; e o termo junguiano) | Lê igual em PT e EN, macio, duas sílabas, casa com o estilo das linhas. Carrega "alma" sem precisar explicar | *Anima* em Jung é o arquétipo contrassexual, sentido diferente do que usamos aqui — é empréstimo de som, não de conceito |
| **Ovi** | de *ovo/ovum*, o começo | Diz "antes de ser algo" diretamente | O ovo saiu da árvore de propósito (`progression.ts` nasce em rookie); reintroduzir a palavra confunde |
| **Zeru** | do Zero / Arcano 0 | Amarra explicitamente no Louco | Mais frio; "zero" pode ler como "nada" em vez de "potencial" |

**Recomendação: Nima.** Nenhum dos três aparece como personagem de Pokémon ou
Digimon nas buscas feitas — mas **isso não é busca de marca registrada**, e a
verificação formal antes de qualquer uso comercial continua sendo item de dono,
igual ao que o `Attributions.md` já registra.

---

## 6. O que fica em aberto

| # | Item | De quem é |
|---|---|---|
| 1 | Escolha do nome + **busca de marca registrada** antes de uso comercial | Dono / advogado |
| 2 | O bordão (som que funcione em PT e EN) | Dono — se testa em voz alta |
| 3 | Arte final nas três escalas (16/48/512) | Depende de 1 e 2 |
| 4 | Teste travando o mascote fora de loja/missões/masmorra/`GameState` | Código — direto, uma vez que o id exista |
| 5 | Onde o mascote entra no `welcomeBack` do `DailyReportModal` | Produto + código |

Nada aqui foi implementado: este documento é análise e decisão de direção. O
próximo passo executável é o item 1 — sem nome escolhido, arte e testes não têm o
que travar.

---

## Fontes

Pokémon / Pikachu:
[Pokemon.com — Creator Profile: The Creators of Pikachu](https://www.pokemon.com/us/pokemon-news/creator-profile-the-creators-of-pikachu) ·
[Pokémon Blog — Game Freak details the origins of Pikachu](https://pokemonblog.com/2018/06/23/game-freak-details-the-origins-of-pokemon-mascot-pikachu-its-history-canceled-gorochu-evolution-and-more/) ·
[Wikipedia — Pikachu](https://en.wikipedia.org/wiki/Pikachu)

Digimon / Agumon:
[The DigiLab — entrevista com Kenji Watanabe](https://digi-lab.blog/digimon-continues-to-be-loved-thanks-to-its-creators-commitment-with-digimon-character-designer-kenji-watanabe/) ·
[garm's translations — Digimon Ver.1~5 Artbook: Kenji Watanabe Special Interview](https://garmtranslations.wordpress.com/2018/12/22/digimon-ver-15-artbook-kenji-watanabe-special-interview/) ·
[Wikimon — Watanabe Kenji](https://wikimon.net/Watanabe_Kenji)

Atlus / Jack Frost:
[Megami Tensei Wiki — Jack Frost](https://megamitensei.fandom.com/wiki/Jack_Frost) ·
[Destructoid — Atlus explains the Jack Frost mascot makeover for SMT V](https://www.destructoid.com/atlus-explains-jack-frost-mascot-makeover-shin-megami-tensei-v/) ·
[Siliconera — Shin Megami Tensei V Renews Jack Frost Design](https://www.siliconera.com/shin-megami-tensei-v-renews-jack-frost-design/)

Persona / Jung:
[Megami Tensei Wiki — Jungian psychology in the Persona series](https://megamitensei.fandom.com/wiki/Jungian_psychology_in_the_Persona_series) ·
[Megami Tensei Wiki — Philemon](https://megamitensei.fandom.com/wiki/Philemon) ·
[Megami Tensei Wiki — Fool Arcana](https://megamitensei.fandom.com/wiki/Fool_Arcana) ·
[Eternalised — Jungian Archetypes: Self, Persona, Shadow, Anima/Animus](https://eternalisedofficial.com/2020/09/05/jungian-archetypes-explained/) ·
[Destructoid — The Fool's journey in Persona 3](https://www.destructoid.com/your-fate-is-in-the-cards-the-fools-journey-in-persona-3/) ·
[Persona Fans — Morgana Persona 5 Guide](https://personafans.com/characters/morgana-persona-5-guide/) ·
[Megami Tensei Wiki — Teddie](https://megamitensei.fandom.com/wiki/Teddie) ·
[CBR — Koromaru vs. Teddie vs. Morgana](https://www.cbr.com/persona-mascots-koromaru-teddie-morgana/)

Tamagotchi:
[Tamagotchi Wiki — Mametchi](https://tamagotchi.fandom.com/wiki/Mametchi) ·
[Wikipedia — List of Tamagotchi characters](https://en.wikipedia.org/wiki/List_of_Tamagotchi_characters) ·
[Tokyo Weekender — Tamagotchi's Evolution](https://www.tokyoweekender.com/entertainment/tamagotchi-revival-and-legacy/)

Arquétipos de marca e design de personagem:
[Yu-kai Chou — The 12 Brand Archetypes: A Behavioral Designer's Guide](https://yukaichou.com/gamification-analysis/brand-archetypes-jung-mark-pearson-twelve-personas/) ·
[Iconic Fox — Brand Archetypes: The Definitive Guide](https://iconicfox.com.au/brand-archetypes/) ·
[Creative Bloq — What artists can learn from 30 years of Pokémon character design](https://www.creativebloq.com/art/digital-art/what-artists-can-learn-from-30-years-of-pokemon-character-design) ·
[Geek Paintings — The Importance of Silhouette in Character Design](https://www.geekpaintings.com/the-importance-of-silhouette-in-character-design/)
