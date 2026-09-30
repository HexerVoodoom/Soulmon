# Benchmark de Exploração — o que pôr no Mapa ao lado da Masmorra

> **Etiqueta: pesquisa** (30/09/2026). Não decide regra nenhuma — a precedência continua código > teste >
> `CLAUDE.md` > manual > pesquisa. Quem decide é o dono, no `REGISTRO-DE-DECISOES.md`, e as perguntas abertas
> estão em [`PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md) (seção "Exploração", EXP-1..EXP-7). Irmão de
> [`BENCHMARK-MINIJOGOS.md`](BENCHMARK-MINIJOGOS.md) (o minijogo curto) e de
> [`BENCHMARK-COMBATE.md`](BENCHMARK-COMBATE.md) (o combate); o método é o de
> [`BENCHMARK-E-REFERENCIAS.md`](BENCHMARK-E-REFERENCIAS.md) §4–§5.
>
> **Pergunta (B1):** que conteúdo a área "Exploração" pode ganhar além da Masmorra sem cruzar uma linha
> vermelha, e o que o mercado e o gênero mostram sobre cada opção?
>
> **Fontes e confiança.** Convenção do hub (§4.1): **✔** fonte primária ou institucional aberta nesta rodada,
> com URL e data · **◐** relato (wiki de fã, Wikipedia, blog, review, resumo de busca) · **(≈)** de memória,
> não conferido e por isso **não sustenta decisão** · **✖** a busca não devolveu, nada foi preenchido de
> memória. Data de acesso de todas as URLs: 30/09/2026. Uma sessão anterior fez este benchmark e o brainstorm
> só em chat, sem arquivo; a versão de chat não foi preservada, então **a tabela de referências abaixo foi
> reconstruída e conferida por busca nesta rodada**, e cada afirmação que serve de argumento tem a marca.
> Muitas páginas de wiki (Bulbapedia, Fandom, Planalto) devolveram 402/403 ao fetch; onde só o resumo da busca
> existe, a marca é ◐ ou (≈), nunca ✔.
>
> **⚠️ Camada 3 congelada.** Conteúdo novo de Exploração está ACIMA do núcleo tarefas→cuidado→evolução, e o
> `REGISTRO-DE-DECISOES.md` §5.6 congela a Camada 3 até 10 usuários × 14 dias de dado. **Nada aqui é ordem de
> implementar**; se o dono quiser executar, é **exceção registrada**, como foram a Guilda e o Ateliê
> (pergunta EXP-1). Ninguém usou o app em produção: qualquer "efeito esperado" é hipótese, não medição.
>
> **Pareceres (30/09/2026, rodados em paralelo sobre as três finalistas):**
> [`01-linha-vermelha.md`](reviews/2026-09-30-exploracao/01-linha-vermelha.md) ·
> [`02-psicologia.md`](reviews/2026-09-30-exploracao/02-psicologia.md) ·
> [`03-monster-taming.md`](reviews/2026-09-30-exploracao/03-monster-taming.md). Resumo no §5.

---

## 0. O que o Soulmon tem hoje na Exploração (lido do código em 30/09/2026)

| Peça | Onde | O que é |
|---|---|---|
| A área | `AREAS` em `src/navigation.ts`; arte e regra de arte em `docs/design/areas/00-BIBLIA-DAS-AREAS.md` §2.4 | **O Charco das Ilhas**: ilhas flutuantes em névoa, fundo escuro; **sem caveiras** (regra de arte da área) |
| O lote único | `EXPLORACAO_LOTS` e `ExploracaoLotId = 'masmorra'` em `src/utils/playAreaLots.ts` | Só a **Masmorra**, na clareira do fundo (27% / 36%). O Dino saiu para o Salão de Jogos em 30/09/2026; o Pesadelo mora em outra superfície (`NightmareBattle`) |
| A folha | `MasmorraSheet` em `src/components/play/PlaySheets.tsx` | 5 andares por run (`MAX_FLOORS`), dificuldade da semana, melhor placar, "Pode cair" (Bits por inimigo + bônus de andar, coraçãozinho raro, Glitchtama), nota "perder custa só a run", `BitsHoje`, CTA **sem gate** |
| O jogo | `src/components/DungeonGame.tsx` | Barra de timing (`TimingBar`) sobre o `GameKit`; cenário sorteado por andar entre as cenas de `src/utils/dungeonScenes.ts` (`SPIRIT_BG_SCENES`: 13 cenas pintadas, mais as clássicas e as da loja) |
| O funil de Bits | `handleEarnGamePoints` em `src/App.tsx`; `MINIGAME_BITS_PER_DAY = 150` em `src/utils/currencies.ts` | Único caminho de Bits de minijogo; o teto para de somar e **nunca** fecha jogo nem tira nada |
| Coleção de inimigos | `bestiary` no save, `enemyKey` | 36 artes (9 linhas × 4 tiers), **silhueta** do que não apareceu e contagem, nunca percentual |

**O que já existe ao lado e sobrepõe as ideias abaixo (achado do "já existe?", B2):**

| Peça | Onde | Por que importa aqui |
|---|---|---|
| **A Aventura da noite** | `src/utils/adventure.ts` (`AdventureFind`, `ADVENTURE_ODDS`) | *"Durante o dia o pet saiu, e à noite ele volta com um achado variável e narrado."* É determinística por `dayKey`, **não paga nada** (sem Bits, item, atributo, XP — decisão do dono de 08/09/2026, `REGISTRO-DE-DECISOES.md` §5.6), **nenhum dia volta vazio**, e o dia mexe na CHANCE, nunca no acesso. Modelo declarado: o Finch ("narrativa não satura") |
| **O Diário de Aventuras** | `src/components/AdventureDiary.tsx` | Álbum em ordem de data. **Não mostra o que falta, não mostra raridade, não conta nada** — de propósito: "diário com lacuna vira lista de pendências" |
| O Dex de Sonhos | `DREAM_CATALOG` em `src/utils/restWindow.ts` | Coleção com silhueta e contagem; mora na página do pet |
| O resumo semanal | `weeklyReport` em `src/utils/rituals.ts` | Descrição, nunca veredito: constância por hábito, melhor hábito, categoria dominante, `tasksDone`, `effortDone`, `dreams` |
| As leis de escrita | `docs/NARRATIVA-E-UNIVERSO.md` §2 (L1..L12) | **L5** cita "a expedição" como perda permitida (coisa recuperável e apostada de propósito); **L6** ausência é saudade, nunca fatura; **L11** a criatura reage ao AGORA em contato e nunca sente pelo que a pessoa fez ao longo do tempo |

> **Consequência.** O Passeio (o pet sai e volta com um achado) e o Diário de Campo (o álbum dos achados)
> **não são vazios de conteúdo — sobrepõem a Aventura da noite e o `AdventureDiary`**. E "poucos Bits" ou
> "decoração rara" pelo achado é literalmente a alternativa que perdeu em 08/09/2026 ("Bits/item pelo achado —
> o relatório viraria tela que a pessoa PRECISA abrir"). A pergunta do registro não é "por que não fazemos
> X?", é **"o que mudou desde que X perdeu?"** — e a resposta dos três pareceres é: nada de mecânica mudou;
> mudou a superfície (uma folha da Exploração com relógio de N horas) e a data. Esta é a pergunta EXP-6.

---

## 1. Os filtros vigentes (regra, não sugestão)

| Filtro | Fonte |
|---|---|
| Paga **Bits** e itens **cosméticos**; nunca HP, energia, atributo, `perfectDays` ou evolução | `REGISTRO-DE-DECISOES.md` §5.6; manual `02` |
| Respeita `MINIGAME_BITS_PER_DAY = 150` e passa pelo funil `handleEarnGamePoints` | `currencies.ts`; `App.tsx` |
| **Perder não custa nada.** Não existe streak que zera. Sem recompensa por contagem de tarefas | proibições #1 e #16 (`ledger/vetos.md`) |
| **Brincar nunca é condição** de dia completo, HP ou evolução | §5.6 |
| **Sem sensor** (passos, GPS, Google Fit) | linha vermelha (Janela de Descanso, `CLAUDE.md`) |
| **Nasce mudo** | R-NOVA, `docs/SOM.md` |
| Copy **PT-BR + EN**, sob L1..L12; nenhuma frase promete efeito nem cobra | `NARRATIVA-E-UNIVERSO.md` |
| Coleção é **contagem**, nunca percentual, nunca "faltam N" | Bestiário; `AdventureDiary` |
| Nada de "última chance"/FOMO que tira; nada de mecânica cuja resposta é "querer a notificação" | proibições #15 e #19 |
| Antes de mexer em regra: procurar a linha no `REGISTRO-DE-DECISOES.md` | `CLAUDE.md` |

---

## 2. Os eixos (B3) e a tabela de referências

Eixos que diferenciam as referências, escolhidos para responder à pergunta de "como cada uma trata a
**ausência** e a **falha**": **(a)** o personagem sai e volta, ou o jogador vai até ele? · **(b)** a espera é de
relógio real com o app fechado? · **(c)** há falha, risco ou custo? · **(d)** há energia ou limite que acaba?
· **(e)** o que vira álbum? · **(f)** o que a ausência rende: recompensa, nada, ou dano?

### 2.1 O pet sai e volta com algo (Passeio, Diário de Campo)

| Referência | O que faz | Eixos (a–f) | O que ensina ao Soulmon | Marca / fonte |
|---|---|---|---|---|
| **Finch** — "Adventures" | Energia ganha por metas reais leva o pássaro a uma aventura; volta com uma história e às vezes uma descoberta (gosto/desgosto). App Store: 4,9 estrelas, 758 mil avaliações, Editors' Choice | (a) sai e volta · (b) "horas depois", **não confirmado** que corra com o app fechado · (c) nenhuma penalidade citada · (d) tem energia e teto diário · (f) recompensa narrativa, por ação | O modelo declarado da Aventura do Soulmon; a recompensa é narrativa, não numérica | ✔ mecânica-base ([finchcare.com/about-finch](https://finchcare.com/about-finch), App Store); ◐ duração de ~6 h ([Android Authority](https://www.androidauthority.com/finch-habit-tracker-app-hands-on-3537434/)); ✖ app fechado e notificação |
| **Neko Atsume** | O jogador põe comida e brinquedos; gatos visitam sozinhos e deixam peixes; Catbook (álbum) e lembranças raras | (a) o gato chega, não sai · (b) sim, com o jogo fechado (só resumos de busca) · (c) sem condição de falha · (d) sem energia · (f) a ausência **rende** | O melhor exemplo de "a ausência é bem-vinda"; 4,8 estrelas (~27 mil avaliações), 4 mi de downloads em 05/2015 | ✔ Catbook/espera (App Store); ◐ sem falha e downloads ([Wikipedia](https://en.wikipedia.org/wiki/Neko_Atsume)); ✖ notificação |
| **Tsuki Adventure** | Jogo "passivo" em tempo real: o coelho vive por conta própria, viaja e colhe cenouras; diário que se desbloqueia | (a) sai · (b) "real-time" (App Store) · (c) nenhuma falha citada · (d) custo em moeda, não energia | Diário como recompensa da espera; 4,7/5 com 14 mil+ avaliações | ✔ "passivo, tempo real" (App Store); ◐ viagem e postais (só blog e resumo); ✖ fonte oficial da viagem |
| **Pikmin Bloom** — Postcards | Postais vêm de expedições, batalhas e amigos; ficam no Lifelog; entrega leva 12 h; postal não coletado volta em 3 dias | (a) sai e volta · (b) funciona em segundo plano **por localização** · (d) capacidade máxima de postais · (f) recompensa por **deslocamento** | Só a **forma** (o postal ilustrado). O gatilho é passos/GPS, que o Soulmon descarta; e o prazo de 3 dias é o tipo de FOMO que tira | ✔ ([expeditions](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2860-expeditions/), [postcards](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2858-postcards/)); ◐ [Pikipedia](https://www.pikminwiki.com/Postcard) |
| **Palworld** — Pal Expedition Station | Envia Pals a destinos; coleta itens na estação; recompensa cresce com a força do grupo; Pals ficam indisponíveis até voltar | (a) sai e volta · (b) **não especificado** · (c) sem falha citada · (f) custo de oportunidade | Existe expedição com duração de 30 min a 2 h na wiki (o guia diz 1 h no mínimo; divergem) | ◐ ([wiki.gg](https://palworld.wiki.gg/wiki/Expeditions)); ✖ tempo real/offline, sucesso do recurso |
| **Monster Rancher 2** — Errantry/Expedition | O monstro sai por semanas **de calendário do jogo**, com teste semanal; fadiga, estresse, ferimento e vida útil | (b) **não** é relógio real · (c) **risco forte** · (d) fadiga/estresse/vida | **O contraponto:** aqui o gênero cobra pela saída. É o desenho que o Soulmon rejeita (perda só sobre coisa recuperável, L5) | ◐ ([guia](https://legendcup.com/raisingmethodsmr2.php), [Wikipedia](https://en.wikipedia.org/wiki/Monster_Rancher_2)); ✖ MR4 |
| **Nintendogs** — passeio | O cão sai a passeio com o jogador, acha presentes com itens aleatórios | (a) **não sai sozinho**: exige presença | Passeio como gesto de cuidado presente, não como espera | ◐ ([Wikipedia](https://en.wikipedia.org/wiki/Nintendogs)) |
| **Pokémon Sleep / Pokémon GO** | Sleep coleciona por dormir/ausência; GO coleciona por passos (Buddy, Adventure Sync com o app fechado) | (f) Sleep: ausência rende · GO: **sensor** | Sleep é a referência dos Sonhos; GO mostra o que o Soulmon descarta | ◐ (Wikipedia; [site do Sleep](https://www.pokemonsleep.net/en/)) |

### 2.2 Escavação e coleção (Escavação, Diário)

| Referência | O que faz | O que ensina | Marca / fonte |
|---|---|---|---|
| **Stardew Valley** — pontos de artefato e Museu | O ponto de artefato (mancha de terra) é "garantido dar um item", com tabela de prioridade; recursos comuns (carvão, argila) fazem o papel de prêmio de consolação. O Museu não tem prazo | **O modelo direto de "sempre com resultado":** o toque nunca volta vazio e o que varia é **qual** item, não **se** vem. Atenção: o Museu tem meta final conhecida (95 doações) — "n de 95" é do jogo; a regra de "nunca faltam N" é **escolha do Soulmon, não convenção do gênero** | ◐ ([Artifact Spot](https://stardewvalleywiki.com/Artifact_Spot), [Museum](https://stardewvalleywiki.com/Museum)) |
| **Animal Crossing** — fósseis e museu | 4 fósseis por dia (New Leaf/New Horizons; até 6 acumulados se o jogador pulou um dia); avaliação e doação ao museu | Limite diário que **acumula sem perder** o dia pulado. O que o museu mostra para a peça faltante: só resumo de busca | ◐ ([Nookipedia](https://nookipedia.com/wiki/Fossil)); (≈) placas de peça faltante; ✖ Critterpedia |
| **Pokémon Underground** (D/P/Pt) | Mineração em tela de toque com picareta e martelo; a parede **desaba** se batida demais | O contraexemplo dentro do próprio formato: **tem falha**. O Soulmon inverte (sem desabamento). O que se perde no desabamento não foi confirmado | ◐ ([Serebii](https://www.serebii.net/diamondpearl/underground.shtml)); ✖ consequência do desabamento; ✖ Grand Underground |
| **Pokémon Snap** / New Pokémon Snap | Fotografar sem capturar; álbum (Photodex); estrelas de 1–4 refletem a **raridade do comportamento**, não a qualidade | Observação como alternativa à captura por sorte; a Photodex conta categorias, sem "% do mundo". Os limiares de medalha **divergem entre fontes: não usar o número** | ◐ ([Serebii](https://www.serebii.net/newpokemonsnap/photorating.shtml), [Game8](https://game8.co/games/New-Pokemon-Snap/archives/328487)) |
| **Neko Atsume** — Catbook | Álbum com um espaço por gato; o não visto aparece como silhueta com "?" (resumo de busca) | O gênero **tem** lacuna visível; o `AdventureDiary` escolheu não ter | (≈) só resumo; página não abriu |

### 2.3 Caminho, névoa, encontro, cooperação (candidatas futuras)

| Referência | O que faz | O que ensina | Marca / fonte |
|---|---|---|---|
| **Slay the Spire** — mapa de nós | Mapa procedural por ato; 7 tipos de nó; fogueira antes do chefe; a run acaba se a vida zera | Decisão como jogada. Toda a família (Monster Train, FTL, Loop Hero) **carrega perda**; Reigns amortece a morte mas ainda tem derrota. **Nenhum mapa de nós sem perda foi achado**: a candidata 4 seria inédita | ◐ ([wiki](https://slaythespire.wiki.gg/wiki/Map_Locations), [Wikipedia](https://en.wikipedia.org/wiki/Slay_the_Spire)); ✔ mapa procedural ([arXiv 2504.03918](https://arxiv.org/html/2504.03918v1)); (≈) Monster Train/Loop Hero/FTL |
| **Fog of World** | O GPS revela a névoa; mostra **percentual** por continente e país e ranking de territórios | O contraexemplo da candidata 5: névoa por sensor, com % e ranking. Reclamações de bateria e imprecisão | ✔ ([App Store](https://apps.apple.com/us/app/fog-of-world/id505367096)); (≈) torres do BotW |
| **Pokémon GO / Palworld** — captura | A captura tem probabilidade (anel de dificuldade, bola, baga; no Palworld, "capture power"), com consumíveis que a melhoram | Captura por sorte tem desenho de probabilidade com item que a melhora; regulada quando há **pagamento + aleatoriedade**. Afinidade determinística evita o desenho | ✔ ([Niantic](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/102-finding-catching-wild-pokemon/)); ◐ [Palworld wiki](https://palworld.wiki.gg/wiki/Capture_Power) |
| **Coop: Forest, Flora, Habitica, GO Raids** | Falha coletiva (Forest, Habitica) × soma sem morte coletiva (Flora) | Já estudado em [`reviews/guilda/01-benchmark.md`](reviews/guilda/01-benchmark.md); não refeito (tentativa de reabrir Habitica devolveu 402) | ◐ herdado |

### 2.4 Os contraexemplos: mecânica que pune ou monetiza a espera

| Referência | O que fez | Marca / fonte |
|---|---|---|
| **Cow Clicker** (Ian Bogost, 2010) | Clica-se na vaca e espera-se 6 horas; pular a espera custava dinheiro. O autor lista quatro preocupações, entre elas compulsão e "tempo destruído" (obrigações e ansiedade de oportunidade perdida). Encerrado em 07/09/2011 | ✔ ([bogost.com/games/cow_clicker](https://bogost.com/games/cow_clicker/)) |
| **FarmVille** | A colheita murcha quando passa 2,5× o tempo de crescimento; pico de ~84 milhões de MAU em 03/2010 | ◐ ([Wikipedia](https://en.wikipedia.org/wiki/FarmVille)) |
| **Tamagotchi (original)** | Sem cuidado, o bicho morre; escolas baniram o brinquedo em 1997 | ◐ ([Wikipedia](https://en.wikipedia.org/wiki/Tamagotchi)) |

---

## 3. Convergência, divergência, paridade × diferencial (B7)

- **Convergência (3+ fazem igual):** Finch, Neko Atsume, Tsuki, Pikmin Bloom e Palworld entregam o resultado
  numa volta **posterior**, sem exigir presença durante, e guardam o que voltou num registro (Catbook, Lifelog,
  diário, gostos do pássaro). Nenhum dos verificados **pune a ausência**: Neko não tem condição de falha,
  Finch não cita penalidade. Stardew e Animal Crossing têm coleta com limite diário e sem prazo de museu.
- **Divergência real (a escolha):** **o que limita a saída** — energia ganha por tarefas (Finch), passos e
  localização (Pikmin, GO), moeda ou item (Neko, Tsuki), fadiga e ferimento (Monster Rancher). E o que a
  ausência rende: recompensa (Neko, Sleep) ou ação do jogador (Finch, Pikmin). O Soulmon já escolheu:
  **sem energia que acaba, sem sensor, sem dano**.
- **Paridade (tem que ter para a área parecer viva):** um resultado narrado por visita e um registro do que
  voltou. **Diferencial (onde o Soulmon escolhe):** a espera nunca pune (o oposto de Monster Rancher, FarmVille
  e Tamagotchi), e o registro nunca mostra lacuna (contra o Catbook e o museu).
- **Dark pattern nomeado:** "*Play by Appointment*" (exigir voltar em horários definidos) é um dos padrões
  mais prevalentes em jogos móveis F2P — Chen, Wang & Xiao 2025 (CDiGRA), ✔ PDF aberto e lido
  ([DiGRA](https://dl.digra.org/index.php/dl/article/download/2765/2749)); a taxonomia vem de Zagal, Björk &
  Lewis 2013 (FDG), ◐ via resumos de busca. O risco de um Passeio com timer não está no timer: está no que se
  **acumula**, no que **avisa** e no que **paga** (parecer de psicologia).
- **Risco a registrar:** Underground e Slay the Spire usam a falha como tempero. O Soulmon a remove, e **não
  há exemplo aberto** de escavação que nunca desaba nem de mapa de nós sem perda — as duas ideias seriam
  inéditas, sem precedente medido.

---

## 4. As ideias

Ordem da mais para a menos aderente. **Nenhuma é recomendação de implementar** (Camada 3 congelada);
o que segue são opções filtradas.

### 4.1 Finalistas

**1. Passeio (expedição do pet).** O pet sai para um bioma e volta em N horas de relógio real, mesmo com o
app fechado. Sem falha e sem cobrança; o timer nunca pausa. Traz 1 "achado" (postal ilustrado + uma linha do
pet) e poucos Bits. Quem some por dias volta e encontra achados acumulados, "no espírito do perdão por ausência".

- **Referências:** Finch (a saída narrada), Neko Atsume (a ausência que rende), Pikmin Bloom (só a forma do postal).
- **Toca:** #19 (o retorno em N horas é o desenho clássico de push; hoje nenhum aviso anuncia chegada de
  conteúdo), #16 (achados acumulados por ausência viram contador que paga quem some), #15 (um teto que
  descarta é FOMO que tira), #13 preventiva (espera comprável), e a **decisão de 08/09** (Bits pelo achado
  perdeu). Não citar `ABSENCE_FORGIVENESS_DAYS` como fundamento: esse perdão é da regra de HP.
- **Parecer:** linha vermelha **VETADO** na forma proposta (Passeio como encenação da Aventura existente:
  sem Bits, sem push, sem contagem, um postal por dia, duração uniforme e nunca comprável); psicologia e gênero
  **APROVADO COM RESSALVA** só na forma emendada (sem fila, sem push, sem Bits; pet presente e cuidável; um
  relógio só). Condições bloqueantes: sem fila/contagem/badge de achados acumulados; nenhum push (com teste
  espelho de `guild.semPush.contract.test.js`); **não coexistir com a Aventura da noite como segundo sistema**.
- **Biomas:** as 13 cenas de `SPIRIT_BG_SCENES` são cenas de **fenda e arena, não bioma** (duas são arenas do
  Torneio, uma é a cena fixa do Pesadelo, e a Necrópole de Ossos fere a regra sem caveiras). Só cavernas,
  oceano e talvez gelo casam com os reinos da bíblia (§7.2); o resto pede arte nova (EXP-7).
- **Custo (estimativa de leitura, não medida):** baixo se for a face da Aventura; médio-alto se for sistema
  próprio com relógio, save e arte de biomas.

**2. Diário de Campo.** Álbum dos achados, com bioma, data e frase. Reaproveita as cenas pintadas e o padrão de
coleção do Bestiário.

- **Referências:** Neko Atsume (Catbook), Pokémon Snap (Photodex sem "% do mundo").
- **Achado:** o padrão do Bestiário (silhueta, contagem) é **o oposto** do que o `AdventureDiary` foi
  desenhado para ser. Os três pareceres pedem o Diário como **extensão do `AdventureDiary`** (mesmos achados,
  agrupados por bioma), **não** um terceiro álbum.
- **Parecer:** **APROVADO COM RESSALVA** nos três. Bloqueantes: sem silhueta do que falta, sem contagem, sem
  fração, sem raridade; uma coleção só (uma vista do mesmo save da Aventura); **fora do `weeklyReport`**;
  nada em perfil público nem widget (#21); sem caveira.
- **Custo:** baixo (uma vista sobre dado que a Aventura já grava).

**3. Escavação.** Minijogo de 1 toque de 30–60 s, sem falha, sempre com resultado. Entrega fragmentos de lore
das eras da bíblia (§8: A Sobra, O Solo, O Assentamento, A Vigília, A Abertura, Agora) e decoração rara do
palco. Monta sobre o `GameKit`.

- **Referências:** Stardew (o ponto de artefato garantido, com prêmio de consolação), Animal Crossing (limite
  diário que acumula), Pokémon Underground (o contraexemplo: tem falha).
- **Achado:** "sempre com resultado" só é saudável se variar **qual**, nunca **se** vem. Um sorteio livre e
  repetível de decoração rara em loop de 30–60 s sem falha é a máquina de reforço variável — a alternativa que a
  decisão "recompensa variável com TETO" já recusou.
- **Parecer:** **APROVADO COM RESSALVA** nos três. Bloqueantes: lore em **ordem fixa**, determinística, sem
  fração nem "faltam N"; decoração rara só com **no máximo 1 por dia e semente `dayKey`** (o modelo do
  Glitchtama), senão fora; nenhum push, badge ou widget; **brincar nunca é condição**; se pagar Bits, só pelo
  funil e com o teto de 150. Psicologia e gênero recomendam **só lore no v1**.
- **Custo:** médio (o jogo é pequeno; o conteúdo de lore é trabalho da `squad-narrativa`).

### 4.2 Candidatas futuras (sem parecer nesta rodada)

| # | Ideia | O que a pesquisa diz | Risco |
|---|---|---|---|
| 4 | **Caminho das Escolhas** — mapa de nós curto (5–7), decisão em vez de timing, sem perda | Toda a família de mapas de nós carrega perda; **sem precedente aberto** de mapa sem perda | Inédita; sem perda, a decisão pode não ter peso |
| 5 | **Mapa-Mundo que se revela** — névoa revelada por marcos reais | O contraexemplo aberto (Fog of World) usa sensor, % e ranking | Virar meta de contagem; **precisa de veto da linha vermelha** antes de qualquer desenho |
| 6 | **Encontro selvagem** — observar uma criatura do Bestiário por afinidade | Snap sustenta "observar sem capturar"; captura por sorte tem desenho de probabilidade e é o formato regulado quando há pagamento | Nunca entregar criatura nem tocar no companheiro (o pet é um só); captura por sorte é gacha |
| 7 | **Expedição cooperativa da Guilda** — sem ranking | Já em `reviews/guilda/01-benchmark.md` | Só depois de o solo provar valor (a Guilda também está congelada) |

### 4.3 O que foi descartado, e por quê

| Descartado | Por quê | Linha |
|---|---|---|
| Passos, GPS ou Google Fit | O gatilho do Pikmin Bloom e do GO é sensor; o Soulmon roda igual na PWA e no APK, sem sensor | linha vermelha (sem sensor) |
| Timer que **pausa** com o app fechado | Pune quem não abre o app: o inverso do que o Passeio promete | #19; L6 |
| Energia de expedição que acaba | Cobra por ausência; é o desenho de Monster Rancher (fadiga e vida útil) | L5 (perda só sobre coisa recuperável); #16 |
| Espera que se compra para pular | Cow Clicker e a taxonomia de dark patterns; venda de proteção contra o cansaço | #13 |
| Prazo para pegar o achado ("some em 3 dias") | O postal do Pikmin volta em 3 dias: FOMO que tira | #15 |

As três primeiras linhas são as descartadas na sessão anterior; as **duas últimas são acréscimos desta rodada**,
derivados dos pareceres e da pesquisa, e ficam como sugestão de descarte até o dono confirmar.

---

## 5. Os pareceres, lado a lado

| Ideia | Linha vermelha | Psicologia | Monster taming |
|---|---|---|---|
| **Passeio** | **VETADO** (forma proposta) → alternativa: encenação da Aventura, sem Bits/push/contagem | **APROVADO COM RESSALVA** (só emendada; veto a fila, push e Bits) | **APROVADO COM RESSALVA** (fundir com a Aventura; não usar as 13 cenas no todo) |
| **Diário de Campo** | **APROVADO COM RESSALVA** | **APROVADO COM RESSALVA** | **APROVADO COM RESSALVA** |
| **Escavação** | **APROVADO COM RESSALVA** | **APROVADO COM RESSALVA** (só lore, uma por dia, determinística) | **APROVADO COM RESSALVA** (distinguir da Masmorra e do Glitchtama) |

Onde os pareceres **divergem**: só no Passeio. O guarda veta a forma proposta e propõe a alternativa; a
psicologia e o gênero aprovam a forma emendada, que é a mesma alternativa. Na prática os três dizem o mesmo:
**a forma original não passa; a versão fundida com a Aventura passa.** Onde convergem sem exceção: o Diário é uma
extensão do `AdventureDiary` (sem silhueta nem contagem), a Escavação não paga decoração sorteada, e nada
disso é push. O parecer de psicologia também corrige o briefing: existem **quatro famílias de aviso** (lembretes
do dia, aviso da noite, deitar, cocô), e **nenhuma anuncia chegada de conteúdo** — um "seu pet voltou" seria o
primeiro da classe que a #19 mira.

---

## 6. Decisões que dependem do dono

Detalhe, recomendação e gatilho de cada uma em [`PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md), seção "Exploração".

| # | Pergunta | Recomendação dos pareceres (não é decisão) |
|---|---|---|
| EXP-1 | Abrir exceção ao congelamento da Camada 3 para a Exploração, como a Guilda e o Ateliê? | Sim, estreita: só a versão emendada |
| EXP-2 | No Passeio, o pet sai da Home (palco vazio ou "passeando"), ou é só um timer com o pet presente? | O pet não sai; presente e cuidável |
| EXP-3 | Os achados podem render decoração rara, ou só lore e Bits? | Achados só lore; decoração rara só na Escavação, 1/dia determinística, ou fora |
| EXP-4 | O Diário de Campo entra no `weeklyReport`? | Fora |
| EXP-5 | A Escavação paga Bits (com teto) ou só lore? | Só lore no v1 |
| EXP-6 | Passeio e Diário fundem com a Aventura da noite, ou o dono reabre a decisão de 08/09? | Fundir (surgiu do "já existe?") |
| EXP-7 | Que biomas o Passeio usa, se as 13 cenas não são bioma? | Só as que casam com os reinos; o resto é arte nova |

**Este documento não escolhe entre as ideias.** As recomendações acima são a leitura dos pareceres; quem
decide é o dono.

---

## 7. A conferir — o que ficou (≈) ou ✖

- **Finch:** se a aventura corre com o app fechado e se há notificação (nenhuma fonte aberta diz); a duração de
  ~6 h vem de review, e "8 h/6 h" de resumo de busca.
- **Neko Atsume:** os gatos aparecerem só com o app fechado (resumos de busca), a silhueta "?" do Catbook (a
  página não abriu), notificação.
- **Tsuki:** viagem, bilhete e postais em fonte oficial (só blog e resumo; as páginas devolveram 402/403).
- **Palworld:** a expedição corre em tempo real e offline? Sucesso do recurso.
- **Animal Crossing / Stardew / museus:** o que o museu mostra para a peça faltante; Critterpedia.
- **Pokémon Underground:** o que se perde no desabamento; Grand Underground (BDSP).
- **Monster Train, Loop Hero, FTL, BotW (torres):** só resumos de busca. Monster Rancher 4: não pesquisado.
- **Loot box e regulação:** Zendle & Cairns 2018 é ✔ ([PMC6248934](https://pmc.ncbi.nlm.nih.gov/articles/PMC6248934/));
  Bélgica e Países Baixos são ◐; a **lei brasileira** (ECA Digital) só apareceu em resumo, ✖ para o texto legal.
  A página da FTC/Epic (12/2022) **não trata de loot box** — não citar como fonte disso.
- **"Ansiedade por % de conclusão":** nenhuma fonte aberta a sustenta (um estudo de 2025 sobre completion
  associa a mais afeto positivo, com escala de baixa confiabilidade). **Não usar como argumento.**
- **Zagal, Björk & Lewis 2013 e Oulasvirta et al. 2012 (hábitos de checagem):** conferidos por busca pela
  psicologia; o PDF do Zagal não abriu na pesquisa de mercado (◐).
- **Sucesso ou fracasso por recurso** (não do jogo inteiro): sem dado público para Passeio/Expedição de
  nenhum produto.
- **Sem dado de mercado próprio:** o Soulmon não tem usuários; toda previsão de efeito é hipótese.

---

## 8. Fontes (URL e data de acesso: 30/09/2026)

Cada URL está na linha da tabela em que é usada (§2 e §3). As de maior peso para as decisões:

- Chen, Wang & Xiao 2025, *dark patterns in mobile free-to-play games* — [DiGRA](https://dl.digra.org/index.php/dl/article/download/2765/2749) ✔
- Bogost, *Cow Clicker* — [bogost.com](https://bogost.com/games/cow_clicker/) ✔
- Zendle & Cairns 2018, *PLoS ONE* — [PMC6248934](https://pmc.ncbi.nlm.nih.gov/articles/PMC6248934/) ✔
- Finch — [finchcare.com/about-finch](https://finchcare.com/about-finch) ✔
- Pikmin Bloom — [expeditions](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2860-expeditions/) e [postcards](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2858-postcards/) ✔
- Stardew Valley Wiki — [Artifact Spot](https://stardewvalleywiki.com/Artifact_Spot) ◐
- Pareceres internos: `docs/reviews/2026-09-30-exploracao/` (três arquivos)
