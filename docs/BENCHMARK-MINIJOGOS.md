# Benchmark de minijogos — clássicos, v-pets, monster taming, puzzles e o que a ciência cognitiva diz

> **Etiqueta: pesquisa** (30/09/2026). Não decide regra nenhuma — a precedência
> continua código > teste > `CLAUDE.md` > manual. Quem decide é o dono, no
> `REGISTRO-DE-DECISOES.md`. Irmão de [`BENCHMARK-COMBATE.md`](BENCHMARK-COMBATE.md)
> (29/09/2026), que cobre o combate; este cobre o **minijogo curto**.
>
> **Fontes.** As afirmações de ciência cognitiva marcadas ✔ foram conferidas
> por busca nesta rodada (lista no §9). As marcadas *(≈)* são de memória e
> **devem ser conferidas antes de virar argumento de decisão** — mesma
> convenção do benchmark de combate. Descrições de jogos são conhecimento de
> catálogo.
>
> **⚠️ Camada 3 congelada.** Minijogo novo é conteúdo ACIMA do núcleo
> tarefas→cuidado→evolução, e o `REGISTRO-DE-DECISOES.md` §5.6 congela a
> Camada 3 até 10 usuários × 14 dias de dado. Nada aqui é ordem de
> implementar; se o dono quiser executar, é **exceção registrada**, como foi a
> Guilda.

**O que o Soulmon tem hoje** (lido do código em 30/09/2026):

| Jogo | Arquivo | Mecânica | Paga |
|---|---|---|---|
| ✊ Pedra, papel e tesoura | `src/components/RPSGame.tsx` | sorte pura, melhor de 3 contra o pet | `MATCH_POINTS` = 5 Bits/vitória |
| 🦖 Corrida do Dino | `src/components/DinoGame.tsx` | runner de 1 botão, dificuldade sobe com o tempo | `floor(score/100)` Bits; `dinoBest` → missão |
| ⚔️ Masmorra | `src/components/DungeonGame.tsx` | barra de timing (`TimingBar`) | Bits/inimigo + bônus de andar |
| 🏟️ Arena | `src/components/ArenaGame.tsx` | anel de 17 elementos, especial por escola | Bits |
| 🌙 Pesadelo | `src/components/NightmareBattle.tsx` | combate curto no kit de jogo | — |

Todos montam sobre o `GameKit` (`src/components/games/GameKit.tsx`: visor
348 px, escala inteira, **nada de vermelho**, alvo ≥ 44, texto ≥ 12).

**Filtros que valem para tudo abaixo** (não são sugestão, são regra vigente):

- Minijogo **paga Bits e nada mais** (§5.6; manual `02` §54) — nunca HP,
  energia, atributo, `perfectDays` ou evolução. Teto `MINIGAME_BITS_PER_DAY` = 150.
- **Brincar nunca é condição** de dia completo, HP ou evolução (§5.6).
- **Perder não custa coração** (masmorra, §5.6) — vale para qualquer jogo novo.
- **Sem streak que zera, sem recompensa por contagem de tarefas** (linhas vermelhas).
- **Superfície nova nasce muda** (R-NOVA, `docs/SOM.md`) — jogo que depende de
  som (Simon!) precisa funcionar 100% em silêncio.
- **Texto sob as leis L1..L12** da bíblia: nada de veredito ("você foi mal").

---

## 1. Antes dos jogos: o que a ciência permite prometer

Esta seção é o filtro mais importante do documento, porque o pedido é
"principalmente o que tenha relação com desenvolvimento cognitivo" — e essa é
a área em que o mercado mais mentiu.

### 1.1 Transferência próxima SIM, transferência distante NÃO

| Achado | Nível | Fonte |
|---|---|---|
| Treino cognitivo computadorizado melhora **o próprio jogo e tarefas parecidas** (transferência próxima); **não há boa evidência** de melhora geral em cognição, escola, trabalho ou QI (transferência distante) | A ✔ | Simons et al. 2016, *Psychological Science in the Public Interest* 17(3) — revisão de 130+ estudos |
| Treino de memória de trabalho (inclusive n-back) produz efeito de curto prazo que **não generaliza** para inteligência, leitura ou aritmética | A ✔ | Melby-Lervåg, Redick & Hulme 2016, *Perspectives on Psychological Science* — 87 publicações, 145 comparações |
| Meta-análise de 2ª ordem: transferência distante é **≈ nula em todos os tipos de treino** (videogame, música, xadrez, memória de trabalho) | A ✔ | Sala & Gobet 2019, *Collabra: Psychology* |
| Jogadores de **ação** (FPS/ação rápida) superam não-jogadores em percepção, atenção top-down, cognição espacial e multitarefa (g ≈ 0,6–0,8), com viés de publicação detectado mas efeito positivo mantido | A ✔ (correlacional + parte experimental) | Bediou et al. 2018, *Psychological Bulletin* 144(1) |
| *Brain Age* (Nintendo) por 4 semanas melhorou funções executivas e velocidade de processamento em idosos, **sem transferência para cognição global nem atenção**; o controle era Tetris | B ✔ (RCT pequeno, n=28) | Nouchi et al. 2012, *PLoS ONE* |

**A consequência para o Soulmon:** não existe base honesta para dizer "este
minijogo treina seu cérebro" ou "melhora sua memória". Existe base para dizer
"este jogo **exercita** memória / atenção / planejamento" — é descrição do que
o jogo pede, não promessa do que ele causa.

### 1.2 O caso Lumosity (a linha que o Soulmon não pode cruzar)

A FTC multou a Lumos Labs em **US$ 2 milhões** (julgamento de US$ 50 mi
suspenso) em janeiro/2016 por alegar, sem evidência, que os jogos melhoravam
desempenho na escola e no trabalho e atrasavam declínio cognitivo, demência e
Alzheimer ✔. Isso vale diretamente para a ficha da Play (`PLAY-FICHA.md`) e para
qualquer copy: **nenhuma frase do app pode prometer efeito cognitivo**.

### 1.3 Onde a evidência é FORTE — e é justamente o que o Soulmon pode usar

Os três usos de jogo com evidência sólida têm uma coisa em comum: **o conteúdo
não é descontextualizado**. É o que Simons chama de "prática com conteúdo do
domínio".

| Uso | Nível | Fonte | O que significa aqui |
|---|---|---|---|
| **Prática de recuperação** (se testar) e **prática espaçada** são as duas técnicas de aprendizagem de maior utilidade, em várias idades e materiais | A ✔ | Dunlosky et al. 2013, *PSPI* | Um jogo que faz a pessoa **relembrar o que ELA quer aprender**, espaçado no tempo, é o único minijogo com transferência real — porque a transferência é o próprio conteúdo |
| **Tetris** (~20 min, com lembrete do evento) no pronto-socorro, até 6h após acidente, reduziu **62%** das memórias intrusivas na semana seguinte vs. controle ativo | A-/B ✔ (RCT prova de conceito) | Iyadurai et al. 2018, *Molecular Psychiatry* 23 | Carga visuoespacial compete com a consolidação sensorial da memória. **É intervenção clínica em protocolo — o Soulmon NÃO pode oferecer isso como tratamento** (mesma regra da área "mente" do catálogo: não trata, não cura, CVV 188). Serve só de argumento de que jogo espacial calmo é um bom "descanso para a cabeça" |
| Jogo com **biofeedback** (RAGE-Control → Mightier) somado a terapia: não reduziu a raiva, mas **aumentou o controle da expressão** dela em crianças | B ✔ | Kahn et al. 2013; RCT 2021, *Frontiers in Psychiatry* | Regulação emocional treinada dentro do jogo. O Soulmon não tem sensor (e a Janela de Descanso proíbe sensor) — a versão possível é **respiração guiada**, sem medir nada |
| **Navegação espacial** em jogo (*Sea Hero Quest*, 3,9 mi de jogadores) discrimina envelhecimento saudável de risco genético de Alzheimer | B ✔ | Coutrot et al. 2018, *Current Biology*; PNAS 2019 | Jogo como **instrumento de medida** — o Soulmon **não** deve fazer isso (seria diagnóstico; linha vermelha de saúde) |
| *EndeavorRx*: primeiro videogame autorizado pela FDA (jun/2020) como tratamento de atenção em TDAH, 8–12 anos | B ✔ | FDA / Akili | Mostra que o formato "desvio de estímulo + alvo" (go/no-go em movimento) tem efeito medido — **sob prescrição e protocolo**. Não é para o Soulmon copiar a alegação |

### 1.4 Princípios de design que a pesquisa sustenta (e que ninguém precisa prometer)

- **Funções executivas** (Diamond 2013, *Annual Review of Psychology* *(≈)*):
  controle inibitório, memória de trabalho e flexibilidade cognitiva — base de
  planejamento e raciocínio. É a taxonomia usada nas seções abaixo.
- **Dificuldade adaptativa perto de ~85% de acerto** maximiza aprendizagem em
  tarefas de classificação ("regra dos 85%", Wilson et al. 2019, *Nature
  Communications* *(≈)*). Na prática: escada 2-sobe-1-desce, invisível.
- **Pausa curta melhora vigor e reduz fadiga** (micro-pausas, Albulescu et al.
  2022, *PLoS ONE* *(≈)*). É a função mais honesta de um minijogo num app de
  produtividade: **o intervalo entre duas tarefas**.
- **Metacognição**: jogos de puzzle com "desfazer" livre (Baba Is You,
  Monument Valley) fazem a pessoa formular hipótese → testar → revisar. Sem
  meta-análise própria; é argumento de design, não de efeito.

---

## 2. A régua: eixos que diferenciam um minijogo

| Eixo | Polos |
|---|---|
| **Função cognitiva exercitada** | reflexo/tempo · atenção sustentada · busca visual · controle inibitório · memória de trabalho · flexibilidade (troca de regra) · visuoespacial · planejamento · lógica/dedução · recuperação de memória · regulação emocional · nenhuma (sorte) |
| **Entrada** | 1 botão · toque em alvo · arrastar · escolha discreta · sequência |
| **Duração** | < 30 s · 1–3 min · sessão aberta |
| **Fim** | morte/erro · tempo · puzzle resolvido · 1 por dia |
| **Frustração** | alta (Flappy) · média · baixa (desfazer livre, sem derrota) |
| **Papel no jogo maior** | só moeda · atributo/stat · humor/afeição · coleção · narrativa · nenhum |
| **Aleatoriedade** | determinístico (mesmo desafio para todos no dia) · semente · sorte pura |

---

## 3. Clássicos de arcade, Atari e casual

| Jogo | Função cognitiva principal | O que ensina de design | Risco |
|---|---|---|---|
| **Pong** (1972) | coordenação visomotora, previsão de trajetória | 1 regra, legível em 1 s | chato sozinho |
| **Breakout / Arkanoid** | previsão de ângulo, atenção dividida (bola + tijolos) | recompensa espacial clara (o buraco que você abriu) | — |
| **Space Invaders** | atenção sustentada, priorização de alvo | tensão que sobe sozinha (inimigos aceleram quando rareiam) | ansiedade crescente |
| **Asteroids** | orientação espacial, inércia | física como dificuldade | — |
| **Pac-Man** | **planejamento de rota**, previsão de adversário (cada fantasma tem uma IA legível) | IA com personalidade = previsível e aprendível | — |
| **Frogger** | timing + **planejamento** (esperar a janela) | esperar é jogada | morte frequente |
| **Simon** (Milton Bradley, 1978) | **memória de trabalho sequencial** (span) | sequência cresce 1 por rodada = dificuldade adaptativa natural | depende de som → R-NOVA |
| **Tetris** (1984) | **visuoespacial** (rotação mental, encaixe), planejamento de curto prazo | loop sem fim, estado de fluxo | — (e o dado clínico do §1.3) |
| **Snake** | planejamento espacial (não se fechar) | o próprio progresso vira obstáculo | — |
| **Minesweeper** | **lógica/dedução** + probabilidade | toda informação está na tela | chute forçado no fim irrita |
| **Solitaire / Paciência** | planejamento, sequência | jogo de "descanso" por excelência | — |
| **Concentration (Jogo da memória)** | **memória de trabalho visuoespacial** | tamanho do tabuleiro = dificuldade | — |
| **Whac-A-Mole** | tempo de reação; vira **go/no-go** se houver alvos que NÃO se deve bater | a variante "não bata no coelho" é o paradigma clássico de controle inibitório | punição por erro |
| **Dino (Chrome)** | atenção sustentada, timing de 1 botão | zero onboarding | monótono |
| **Flappy Bird** (2013) | timing fino, atenção sustentada | 1 botão, morte instantânea, "só mais uma" | **frustração é o produto** — loop compulsivo |
| **Estourar plástico-bolha / Bubble Wrap** | nenhuma função executiva; é **sensorial/regulação** (fidget) | prazer tátil + som, sem objetivo | vazio se tiver placar |
| **Puzzle Bobble / Bubble Shooter** | **geometria de ângulo** (rebote), planejamento de cor | mirar = raciocínio espacial | versões mobile cheias de vidas/energia |
| **Fruit Ninja** | reação, **inibição** (não cortar bomba) | go/no-go disfarçado | — |
| **Onde está Wally / Jogo dos 7 erros** | **busca visual**, atenção seletiva | calmo, sem tempo | — |
| **Tangram** | visuoespacial, rotação mental | peças fixas, infinitas figuras | — |
| **Sudoku / Picross (nonograma)** | **lógica/dedução**, memória de trabalho | Picross **revela um desenho** ao terminar — o puzzle é coleção | — |
| **2048 / Threes** | planejamento, visão de consequência | 4 direções, profundidade enorme | — |
| **Pedra, papel e tesoura** | nenhuma (sorte); leve **teoria da mente** se o oponente tiver padrão | ritual social, 3 s | sem profundidade — é o que o Soulmon já tem |

---

## 4. V-pets e criação de criaturas: a FUNÇÃO do minijogo no jogo maior

Aqui o que interessa não é o jogo em si, é **o que ele alimenta**.

| Jogo | Minijogo | Alimenta | Leitura para o Soulmon |
|---|---|---|---|
| **Tamagotchi** (1996→) | "Esquerda/Direita" (adivinhar para que lado o bicho vira), pular corda, etc. | **felicidade** (medidor de humor) | Minijogo como cuidado emocional. No Soulmon, isso já é o **Brincar** (`petNeeds.ts`) — que dá buff *no* minijogo, não o contrário |
| **Digimon V-Pet / Vital Bracelet** (1997→) | treino = martelar botão / timing | **força** + "esforço" → sucesso em batalha; errar treino conta como falha de cuidado | Treino ligado a stat. **Proibido aqui**: minijogo não mexe atributo |
| **Monster Rancher 2** (1999) | **drills** (Pull, Run, Dodge…) com resultado Sucesso/Ótimo/Falha, e **fadiga/estresse** que sobem | stats + vida útil do monstro | A ideia boa é o **texto do resultado ser narrativo** ("ele se esforçou hoje") em vez de número. A fadiga que encurta a vida é o que o Soulmon rejeita |
| **Chao Garden** (Sonic Adventure, 1998) | corridas e karatê; stats vêm de animais pequenos | stats e forma do Chao | A forma depende de COMO você cuidou — é o `carePattern`, que o Soulmon já tem |
| **Nintendogs** (2005) | disco, agilidade, obediência por voz | dinheiro + concurso | Treinar comando por repetição = **aprendizagem associativa** visível no pet |
| **Neopets** (1999) | dezenas de jogos Flash → Neopoints, **teto diário de envio de placar** | moeda | O teto diário é exatamente o `MINIGAME_BITS_PER_DAY` — Neopets provou que sem teto vira fazenda |
| **Pokémon Amie / Refresh** (X/Y, Sol/Lua) | carinho, alimentar, jogos (quebra-cabeça de rosto, "Tile Puzzle") | **afeição** → bônus em batalha | Afeição que vira vantagem = o Soulmon recusa; afeição que vira **reação do pet** = cabe |
| **Pokéathlon** (HeartGold/SoulSilver) | 10 minijogos físicos (stylus) | medalhas, itens | Grande variedade barata porque cada jogo é 1 mecânica |
| **Pokémon Sleep** (2023) | sem minijogo; coleção de estilos de sono | coleção | Já referência dos Sonhos |
| **Pokémon Café ReMix** (2020) | puzzle de girar/arrastar peças | narrativa do café | Puzzle curto embrulhado em cuidado (servir clientes) |
| **Pokémon GO** | arremesso com timing do círculo | captura + bônus | Timing como "gesto de cuidado", não de ataque |
| **Finch** (2021→) | exercícios de **respiração**, quizzes de reflexão | a "aventura" do pássaro | Minijogo como **regulação**, recompensa narrativa |
| **Animal Crossing / Stardew Valley** | pesca (timing / barra de tensão) | coleção + dinheiro | Minijogo curto que **alimenta coleção** (museu) é o loop de D30+ mais durável do gênero |
| **Professor Layton** (2007→) | puzzles de lógica embutidos na história | "picarats" + narrativa | Puzzle como diálogo com personagem — cabe no pet |
| **Brain Age / Big Brain Academy** (2005→) | aritmética, Stroop, contagem, memória | **"idade do cérebro"** | ⛔ o número é **veredito** ("seu cérebro tem 60 anos") — viola as leis de escrita |
| **Lumosity / Elevate / Peak** | dezenas de tarefas cognitivas | "LPI"/percentil | ⛔ percentil contra a população = comparação; e o §1.2 |
| **Wordle / NYT Games** (2021→) | 1 puzzle **por dia, igual para todos** | nada (compartilhar o resultado) | Determinístico por dia = decisão que o Soulmon JÁ tomou para aventura e missões |
| **Duolingo** | lições = recuperação espaçada | XP + **streak** | ⛔ o streak; ✅ a recuperação espaçada |

---

## 5. Padrões que se repetem (síntese)

1. **Uma mecânica por jogo.** Pokéathlon, WarioWare, Rhythm Heaven e Pokémon
   Amie fazem dezenas de jogos porque cada um é UMA regra. Custo baixo, variedade alta.
2. **O jogo mais durável alimenta COLEÇÃO**, não moeda (pesca → museu,
   Picross → desenho revelado, Sleep → estilos). Moeda satura; coleção não.
3. **Diário e determinístico** (Wordle) gera ritual sem compulsão — acabou, acabou.
4. **Dificuldade que cresce sozinha** (Simon, Space Invaders) é adaptativa de graça.
5. **Os que dão errado** ligam o minijogo a vantagem (Digimon, Amie), punem o erro
   (vidas/energia do Candy Crush), ou dão **número-veredito** (Brain Age, percentil).
6. **O resultado narrado** (Monster Rancher: "ele se esforçou") é mais Soulmon
   que o resultado em pontos.

---

## 6. Opções para o Soulmon — as de função cognitiva primeiro

Cada ficha: **mecânica · função cognitiva · o que se pode dizer (e o que não) ·
encaixe no universo · custo · risco**. As de ⭐ são as recomendadas.

### 6.1 ⭐ Revisão da Malha — recuperação espaçada do conteúdo DO JOGADOR

- **Mecânica:** o jogador cadastra cartões (pergunta/resposta — idioma, prova,
  nomes, o que quiser). O pet "pergunta" 5 por dia, na ordem de um algoritmo
  espaçado (Leitner de 3–5 caixas basta). Acertou → o cartão volta daqui a mais
  tempo; errou → volta amanhã. Sem derrota.
- **Função:** **recuperação de memória + prática espaçada**.
- **Evidência:** **A** (Dunlosky 2013) — e é a ÚNICA opção deste documento
  com transferência real, porque o conteúdo é o que a pessoa quer aprender.
- **Pode dizer:** "revisar no intervalo certo ajuda a lembrar" (descrição da
  técnica). **Não pode:** "melhora sua memória".
- **Encaixe:** é o jogo que mais conversa com o **motor de tarefas** — pode ser
  também uma **atividade do catálogo** ("revisar 5 cartões", área mente/estudo)
  pelo `catalogo-curador`, com a evidência registrada no `CATALOGO-EVIDENCIAS.md`.
  Cuidado com a linha vermelha #16: a atividade conta como UMA conclusão, nunca
  "N cartões = N pontos".
- **Custo:** médio (editor de cartões + agendador puro + save). **Sem arte nova.**
- **Risco:** virar Duolingo — **nunca** contar dias seguidos de revisão.

### 6.2 ⭐ Eco do Pet — memória de trabalho sequencial (Simon)

- **Mecânica:** o pet acende 4 pedras elementais numa sequência; o jogador
  repete. A sequência cresce 1 por rodada. Erro = a rodada acaba com o pet
  comemorando o **maior eco** alcançado, sem "game over".
- **Função:** **memória de trabalho** (span visuoespacial/sequencial).
- **Evidência:** transferência próxima só (Melby-Lervåg 2016). Pode dizer
  "exercita memória de sequência"; nunca "treina a memória".
- **Encaixe:** as 4 pedras podem ser elementos do anel da Arena; o pet "canta".
  **R-NOVA:** nasce mudo — o jogo tem que ser 100% jogável visualmente, e o
  som é camada opcional, decidida pela squad-som.
- **Custo:** baixo (é o menor dos jogos novos).
- **Variante:** "Eco reverso" (repetir de trás para frente) é mais difícil e
  exercita *manipulação* na memória de trabalho, não só retenção.

### 6.3 ⭐ Bolhas do Sonho — estourar bolhas com inibição (go/no-go)

- **Mecânica:** bolhas sobem pelo visor. Estourar as **claras** (sonhos);
  **deixar passar** as escuras (fiapos de pesadelo). Frequência de escuras
  ~20–25%, para o "não tocar" exigir esforço. Duas versões:
  - **Modo Foco** (go/no-go): 60 s, ritmo sobe devagar.
  - **Modo Calma** (plástico-bolha): sem tempo, sem placar, sem Bits — só
    estourar, com o pet relaxando. É fidget sensorial, função de **regulação**.
- **Função:** **controle inibitório** + atenção sustentada (Foco);
  autorregulação sensorial (Calma).
- **Evidência:** go/no-go é o paradigma clássico de inibição (e o formato do
  EndeavorRx, que **não** pode ser citado como promessa). Transferência próxima.
- **Encaixe:** conversa com **Sonhos** e **Pesadelo** do universo — estourar a
  bolha escura seria "errar", mas a copy nunca diz "errou": a bolha escura
  estourada só vira fumaça e o pet sopra. Bom candidato para ANTES da Janela de
  Descanso (Modo Calma).
- **Custo:** baixo-médio (partículas; FX já existentes em `fxArt`).
- **Risco:** o Modo Calma não pode pagar nada, senão vira fazenda.

### 6.4 ⭐ Troca de Regra — flexibilidade cognitiva (DCCS/Wisconsin)

- **Mecânica:** criaturas do bestiário caem uma a uma; o jogador as separa em
  dois lados. A regra muda sem aviso explícito, com uma pista visual: "por
  ELEMENTO" → "por FORMA (rookie/champion…)" → "por CAMINHO". Acertos
  seguidos avisam que a regra foi entendida.
- **Função:** **flexibilidade cognitiva** (troca de tarefa) + atenção.
- **Evidência:** tarefas de troca de regra são a medida padrão de
  flexibilidade (Diamond *(≈)*); transferência próxima.
- **Encaixe:** ENSINA O PRÓPRIO JOGO — anel de elementos, estágios e caminhos
  Poder/Harmonia/Benevolência. É o único minijogo que também é tutorial.
- **Custo:** médio (usa sprites do bestiário que já existem).
- **Risco:** a pessoa não entender que a regra mudou → pista visual clara,
  sem texto de cobrança.

### 6.5 ⭐ Picross da Malha — lógica que revela uma criatura

- **Mecânica:** nonograma 5×5 → 10×10; a solução é o **sprite em pixel** de uma
  criatura do bestiário ou de um sonho. Um puzzle do dia igual para todos
  (seed = `dayKey`, como a aventura) + os antigos liberados para rejogar.
- **Função:** **lógica/dedução**, memória de trabalho.
- **Evidência:** nenhuma de transferência; é jogo de lógica. Vale pelo **fluxo
  calmo** e pela coleção.
- **Encaixe:** a arte já é pixel ("pixel art só dentro do visor", D da
  squad-arte); o puzzle é o visor. A silhueta do Bestiário vira um puzzle. Não
  pode mostrar "faltam N" (regra do Bestiário: contagem de COLEÇÃO, nunca "faltam").
- **Custo:** médio (gerar grades a partir dos sprites + verificação de solução única).

### 6.6 Montar o Ninho — visuoespacial (Tetris/tangram)

- **Mecânica:** peças de decoração caem (ou são arrastadas) para preencher o
  palco do pet sem buracos; ou tangram de formar a silhueta do pet.
- **Função:** **rotação mental**, visuoespacial, planejamento curto.
- **Evidência:** Tetris tem o dado clínico do §1.3 — **não usar como argumento
  de venda**. Nouchi 2012 usou Tetris como controle ativo e ele também moveu
  medidas. Transferência próxima.
- **Encaixe:** o palco com `GROUND_Y` e slots fixos já é uma grade.
- **Custo:** médio-alto (física de peças).

### 6.7 Caminho do Pet — planejamento (Sokoban / Pac-Man / Baba Is You leve)

- **Mecânica:** grade pequena; o pet precisa chegar ao ninho empurrando pedras
  ou evitando sombras que se movem com padrão fixo e legível. **Desfazer ilimitado.**
- **Função:** **planejamento**, antecipação, **metacognição** (hipótese → teste → desfazer).
- **Evidência:** argumento de design; sem meta-análise própria.
- **Encaixe:** fendas e camadas da Malha (bíblia) como fases. Desfazer livre
  é a versão "sem castigo" do erro — casa com a tese.
- **Custo:** alto (design de fases é trabalho manual).

### 6.8 Respiração com o Pet — regulação emocional (sem sensor)

- **Mecânica:** uma bolha infla e esvazia num ritmo lento (ex.: 4 s entra, 6 s
  sai); o jogador segura o dedo enquanto infla e solta quando esvazia. O pet
  respira junto. 1–3 minutos. **Não mede nada, não pontua, não paga.**
- **Função:** **regulação emocional** (a do Mightier, sem biofeedback).
- **Evidência:** respiração lenta tem revisões favoráveis para ativação
  autonômica *(≈ conferir antes)*. Não é minijogo de Bits: é gesto de cuidado,
  e talvez more no catálogo de atividades (área mente) ou antes da Janela de
  Descanso. **Proibido** chamar de terapia.
- **Custo:** baixo.

### 6.9 Sombra de Quem? — reconhecimento visual (o "Quem é esse Pokémon?")

- **Mecânica:** silhueta de uma criatura do bestiário **já vista**; escolher
  entre 3. Variante: a silhueta aparece girada (rotação mental).
- **Função:** reconhecimento visual, memória de longo prazo do próprio jogo.
- **Encaixe:** usa as silhuetas que o Bestiário já desenha. Só entram criaturas
  já encontradas — reforça coleção sem expor o que falta.
- **Custo:** baixo.

### 6.10 Achar no Palco — busca visual (Wally / 7 erros)

- **Mecânica:** duas versões do palco do pet com 3–5 diferenças; ou achar um
  item escondido no cenário.
- **Função:** **busca visual**, atenção seletiva.
- **Encaixe:** usa decorações e cenários que o jogador COMPROU — valoriza o que
  ele já tem (o "motivational sand trap" do §5.6: atividade acoplada ao que existe).
- **Custo:** médio (gerar diferenças por código sobre o palco já composto).

### 6.11 Ritmo do Pet — timing (Rhythm Heaven)

- **Mecânica:** o pet faz um gesto no compasso; o jogador toca junto. Já existe
  a `TimingBar` da masmorra.
- **Função:** timing, atenção sustentada.
- **Encaixe/risco:** **depende de som por natureza** → colide com R-NOVA e com
  a trilha nascer desligada. Só com parecer da squad-som. Prioridade baixa.

### 6.12 Melhorar o que já existe

| Jogo | Mudança | Função ganha |
|---|---|---|
| **PPT** | o pet passa a ter um **padrão fraco e descobrível** (ex.: tende a repetir o que ganhou) | leve **teoria da mente/detecção de padrão** — PPT deixa de ser sorte pura |
| **Dino** | alvos que NÃO se deve pular (flores) de vez em quando | vira **go/no-go** leve |
| **Todos** | escada de dificuldade invisível perto de ~85% de acerto | aprendizagem sem frustração (Wilson 2019 *(≈)*) |

### 6.13 Opções só de entretenimento (sem ganho cognitivo relevante)

Registradas porque foram pedidas, mas **não recomendadas como prioridade**:
**Flappy** (frustração é o produto; o Dino já cobre 1 botão), **Fruit Ninja**
(só reação), **Pong/Breakout** (bom, mas o Dino ocupa o nicho de reflexo),
**Space Invaders/Asteroids** (ação rápida — Bediou mostra efeito com ação, mas
em dezenas de horas de FPS, não em 1 minuto de minijogo; não vale como argumento),
**2048** (bom de planejamento, mas genérico e sem ponte com o universo).

---

## 7. O que NÃO fazer (filtro pelas linhas vermelhas)

| Padrão | Visto em | Por que não |
|---|---|---|
| "Treine seu cérebro", "melhore a memória", "previne declínio" | Lumosity, Brain Age | FTC 2016 ✔; evidência A de que não transfere ✔ |
| Número-veredito ("idade do cérebro", percentil, LPI) | Brain Age, Lumosity, Elevate | é veredito; as leis de escrita e o `hideMetrics` |
| Streak de treino | Duolingo, Elevate | linha vermelha: sem streak que zera |
| Vidas/energia que travam o jogo após derrota | Candy Crush, Bubble Shooter mobile | punir derrota; o Soulmon não cobra por perder |
| Minijogo que sobe stat/atributo/afeição com vantagem | Digimon, MR2, Amie | §5.6: minijogo paga Bits e nada mais |
| Ranking global de desempenho cognitivo | Lumosity | comparação tóxica; o Torneio já usa faixas contra si mesmo |
| Diagnóstico por jogo | Sea Hero Quest | é instrumento clínico; não é função do app |
| Frustração como motor ("só mais uma") | Flappy Bird | é compulsão, não fluxo |

---

## 8. Recomendação e próximos passos

**Se o dono quiser UM jogo:** **6.1 Revisão da Malha** — é o único com
evidência A de benefício real, conecta com o motor de tarefas e não exige arte.

**Se quiser um PACOTE "mente" de três jogos baratos e honestos:**
6.2 Eco (memória de trabalho) + 6.3 Bolhas do Sonho (inibição + modo calma) +
6.4 Troca de Regra (flexibilidade). Cobrem as **três funções executivas**
clássicas, cada um é uma mecânica só, e usam sprites/FX que já existem.

**Se quiser o que mais segura D30–D90:** 6.5 Picross da Malha (coleção +
puzzle do dia).

**Passos sugeridos (todos dependem do dono, por causa do congelamento da Camada 3):**

1. Decidir se minijogo cognitivo é **exceção ao congelamento** (registro no §5.6).
2. `soulmon-behavioral-psychologist` dar parecer sobre 6.1, 6.3 (Modo Calma) e 6.8
   — os três encostam em saúde mental.
3. `soulmon-copy-redator` + `soulmon-narrative-critic` escreverem a copy com a
   regra "descreve o que o jogo pede, nunca promete efeito".
4. `squad-som` decidir o que os jogos novos soam (R-NOVA: nascem mudos).
5. Conferir as marcações *(≈)* deste documento antes de citá-las em decisão.
6. Se 6.1 for para o catálogo de atividades: entrada no
   `CATALOGO-EVIDENCIAS.md` com Dunlosky 2013 (A).

---

## 9. Fontes conferidas nesta rodada (✔)

- Simons et al. 2016, *Do "Brain-Training" Programs Work?*, PSPI 17(3) — [Stanford Center on Longevity](http://longevity3.stanford.edu/do-brain-training-programs-work/)
- FTC, jan/2016, Lumosity — [comunicado da FTC](https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program)
- Melby-Lervåg, Redick & Hulme 2016 — [PubMed 27474138](https://pubmed.ncbi.nlm.nih.gov/27474138/)
- Sala & Gobet 2019, *Collabra* — [LSE Research Online](https://researchonline.lse.ac.uk/id/eprint/102168/1/Cognitive_Training_Does_Not_Enhance_General_Cognition_FINAL.pdf)
- Bediou et al. 2018, *Psychological Bulletin* 144(1) — [APA](https://doi.apa.org/doi/10.1037/bul0000168)
- Nouchi et al. 2012, *PLoS ONE* 7(1) e29676 — [PubMed 22253758](https://pubmed.ncbi.nlm.nih.gov/22253758/)
- Iyadurai et al. 2018, *Molecular Psychiatry* 23 — [Nature](https://www.nature.com/articles/mp201723)
- Dunlosky et al. 2013, PSPI — [PubMed 26173288](https://pubmed.ncbi.nlm.nih.gov/26173288/)
- Coutrot et al. 2018 / PNAS 2019, Sea Hero Quest — [PNAS](https://www.pnas.org/doi/full/10.1073/pnas.1901600116)
- RAGE-Control / Mightier, RCT 2021 — [Frontiers in Psychiatry](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2021.591906/full)
- EndeavorRx, FDA jun/2020 — [CNBC](https://www.cnbc.com/2020/06/17/video-endeavorrx-is-first-video-game-approved-by-fda-to-treat-adhd.html)

**A conferir (*(≈)*):** Diamond 2013 (funções executivas), Wilson et al. 2019
(regra dos 85%), Albulescu et al. 2022 (micro-pausas), revisões de respiração lenta.
