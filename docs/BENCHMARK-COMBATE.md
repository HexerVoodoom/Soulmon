# Benchmark de mecânicas de combate — monster taming, v-pets e afins

> **Etiqueta: pesquisa** (29/09/2026). Não decide regra nenhuma — a precedência
> continua código > teste > `CLAUDE.md` > manual. Quem decide é o dono, no
> `REGISTRO-DE-DECISOES.md`.
>
> **Fonte:** conhecimento de catálogo dos jogos (sem verificação web nesta
> rodada). Números citados de memória estão marcados *(≈)* e devem ser
> conferidos antes de virarem argumento de decisão.
>
> **O que o Soulmon tem hoje** (lido do código em 29/09/2026):
> - **Masmorra** (`src/components/DungeonGame.tsx`): 5 andares × 6 inimigos,
>   combate por **barra de timing** (`TimingBar`) — atacar = parar o marcador
>   perto do centro (dano ∝ precisão², ≥92% = crítico ×1,5); defender = mesma
>   barra, centro esquiva, perfeito esquiva + contra-ataca. Stats por estágio
>   (`PLAYER_STATS`), profissão da ficha mexe em UM parâmetro do "jeito".
> - **Arena** (`src/components/ArenaGame.tsx` + `utils/arena.ts`): 5 rodadas
>   contra o bestiário, **anel de 17 elementos**, especial por escola com carga
>   e eco, todos os inimigos vivos revidam. Balanceada por simulação
>   (`arena.test.ts`, vitória 40–80% por arquétipo).
> - **Torneio** assíncrono com Emblemas; PvP atrás de `BOND_PVP_MIN_LEVEL`.
> - **Linhas vermelhas que filtram tudo abaixo:** perder combate não custa
>   coração; nada premia contagem de tarefas; sem streak que zera; Emblemas só
>   compram cosmético; dinheiro nunca compra a barra de cuidado.

---

## 1. Os eixos que diferenciam um sistema de combate

Antes dos jogos, a régua. Todo combate abaixo é uma escolha em cada eixo:

| Eixo | Polos |
|---|---|
| **Entrada** | nenhuma (auto/idle) · passos/movimento físico · comando por turno · timing/reflexo · tempo real contínuo |
| **De onde vem a força** | grind de XP · **criação/cuidado** · genética/breeding · equipamento/peças · atividade no mundo real · dinheiro |
| **Legibilidade** | triângulo de 3 · tabela de 17–18 tipos · reações/combos · stats ocultos |
| **Unidade de time** | 1 parceiro · 2–3 · 6 · "exército" |
| **Autonomia da criatura** | obedece 100% · IA própria com "ordens" · obediência depende do vínculo |
| **Custo da derrota** | nada · a run · recursos · a criatura (permadeath/lifespan) |
| **Contexto social** | solo · assíncrono (ghost) · síncrono · co-op contra chefe |

---

## 2. Os clássicos de referência

### 2.1 Pokémon (linha principal, 1996→)
- **Turno por comando, 4 golpes**, ordem por Speed + prioridade. **18 tipos**
  com tabela de multiplicadores (×2/×½/×0), STAB ×1,5.
- Camadas acumuladas por geração: habilidades, itens segurados, clima/terreno,
  status persistente (sono/paralisia/queimadura), IV/EV/natureza (força
  oculta via treino).
- **O "gimmick de geração"**: Mega Evolução (Gen 6), Movimentos Z (7),
  Dynamax (8), **Terastal** (9 — troca de tipo uma vez por batalha). Sempre
  um **recurso de 1× por luta** que vira o clímax.
- **Legends: Arceus** (2022): estilos **Ágil/Forte** que trocam dano por
  posição na fila de turnos (ordem de ação visível). **Legends Z-A** (2025):
  combate em tempo real com recarga de golpe.
- **Mystery Dungeon**: roguelike em grade, turno por passo, fome.
- **Stadium/Colosseum**: arena pura, sem mundo.
- **Lição:** o triângulo + um recurso épico por luta é o que torna o combate
  memorável; a profundidade (EV/IV) fica escondida para quem quer.

### 2.2 Pokémon GO (2016→) e derivados de localização
- **Ginásio/Raid**: tempo real, **tocar = golpe rápido** que carrega energia;
  **golpe carregado** quando a barra enche; **arrastar para o lado = esquiva**.
- **GO Battle League** (PvP): golpes rápidos automáticos pelo toque,
  **2 escudos por partida** para bloquear carregados, e o **minigame de
  potência** no carregado. O jogo é gestão de energia + blefe de escudo.
- **Raids**: co-op síncrono contra chefe com timer, recompensa = captura.
- **Força vem de**: poeira estelar + doces obtidos **andando** (parceiro
  "Buddy" dá doce por km e aumenta afeto → bônus em batalha no nível Melhor
  Amigo: CP extra, e antes a chance de "aguentar" um golpe *(≈)*).
- **Monster Hunter Now** (2023): luta de ~75 s em tempo real ao toque, arma
  carregada com o que você farmou **andando**.
- **Dragon Quest Walk**: combate de turno quase automático, conteúdo por lugar.
- **Jurassic World Alive**: turnos **simultâneos** — os dois escolhem, a
  Speed resolve; esquiva/distração como estados legíveis.
- **Lição:** *o gesto físico no mundo real alimenta a força, a luta em si é
  curta (30–90 s)*. É o modelo mais próximo de "a produtividade alimenta o
  pet que luta".

### 2.3 Pokémon Sleep / Pokéwalker / Pokémon Pikachu (virtual pet)
- **Sleep**: zero combate; "força de ronco" do Snorlax sobe com as criaturas
  que você cuidou, e o dormir decide o que aparece. **Pokéwalker** (2009):
  passos viram "watts", que pagam **encontros com 2 golpes**: atacar /
  esquivar / capturar — combate de pedra-papel-tesoura sobre um recurso
  ganho andando.
- **Lição:** combate de 3 botões sobre um recurso de vida real é suficiente
  para aparelho de bolso. É praticamente o nosso Dino/masmorra.

### 2.4 Digimon — os v-pets e aparelhos (1997→)
- **Digital Monster (1997)**: batalha **automática** entre dois aparelhos
  conectados. O resultado vem de **poder da forma + taxa de acerto derivada
  do cuidado** (treino/"effort", peso, idade, care mistakes). Ninguém aperta
  botão na luta — **o combate É o relatório do cuidado**.
- **Pendulum**: você **sacode** o aparelho para treinar/atacar.
- **Digivice (1998/99, "Digivice"/pedômetro)**: passos dão **encontros**,
  ataque por **apertar botão rápido** (mash) contra o inimigo.
- **D-3 / D-Power / D-Ark / D-Scanner**: **slash de cartas** (D-Ark) que
  ativa buff; D-Scanner lê código de barras para gerar inimigos/itens.
- **Digimon Color / Digital Monster Ver.20th/X**: batalha com **timing de
  mira** (acertar o golpe numa faixa) em alguns modelos, ramo **Vacina / Dado /
  Vírus** com vantagem cíclica *(≈ por modelo)*.
- **Vital Bracelet (2021→) / Vital Hero / BE**: **exercício e frequência
  cardíaca** treinam o parceiro; **DIM/BEM cards** trocam o conteúdo;
  batalha por **NFC** entre dois relógios e contra NPCs; o treino é um
  minigame de **"shake"/mash** em janelas curtas. Tem **"Vital points"** vindos
  de atividade física como moeda de luta.
- **Lição central para o Soulmon:** o v-pet NUNCA fez do combate um teste de
  reflexo do dono — fez do combate **a prova visível de como você cuidou**.
  O Vital Bracelet é o parente mais próximo da nossa tese (vida real → força),
  com a diferença de que ele mede suor e nós medimos constância.

### 2.5 Digimon — os jogos
- **Digimon World 1 (1999)**: o parceiro luta **com IA própria**; você dá
  **ordens** (atacar, trocar golpe, "vai!") e **torcer/ralhar** gasta um
  recurso; obediência cresce com disciplina. Treino na academia, vida útil
  finita, **care mistakes** decidem a evolução. *O pai de todo o Soulmon.*
- **Next Order (2016)**: **2 parceiros**, **Order Points** que você acumula
  torcendo e gasta em comandos, **ExE** (fusão temporária dos dois quando o
  vínculo é alto).
- **Digimon World 2/3/4**: dungeon crawler de turno, time de 3 / beat'em up.
- **Cyber Sleuth / Hacker's Memory (2015/17)**: turno com **barra de ordem
  visível** (CTB), triângulo **Vacina > Vírus > Dado > Vacina**, 10 elementos
  por cima. **Digivolução/de-digivolução livre** entre formas com cópia de
  golpe ("memória").
- **Digimon Survive (2022)**: tático em grade + **persuasão/conversa** com
  inimigos; "karma" decide a evolução.
- **Digimon Story: Time Stranger (2025)**: turno clássico, personalidades que
  afetam crescimento *(≈)*.
- **Rumble Arena / All-Star Rumble**: brigas de plataforma com evolução
  temporária por barra cheia.
- **Lição:** DW1/Next Order provam que **a criatura agindo sozinha + o dono
  torcendo** é uma fantasia mais forte que "o dono escolhe o golpe" — e
  torcer é um verbo carinhoso, não um verbo de cobrança.

### 2.6 Monster Rancher 2 (1999) e família
- **Criatura gerada por CD** (qualquer disco vira um monstro) — o ancestral
  direto do nosso Oráculo.
- **Batalha em tempo real** com **Guts** (energia que regenera sozinha) e
  **distância**: cada técnica tem alcance (perto/médio/longe/muito longe), você
  se move e escolhe quando gastar Guts. Tem **fúria/foco** e fuga.
- Força vem de **treino semanal** (drills + expedições), **lifespan** que
  cai com stress/fadiga, torneios com calendário e ranques E→S.
- **Lição:** combate **curto, legível e com posicionamento em 1 eixo** (a
  distância) é profundo sem menu. E o torneio de calendário = nossa Rodada
  sexta–domingo.

### 2.7 Medabots / Medarot (1997→)
- Robô de **4 partes** (cabeça, braço E, braço D, pernas), cada uma com HP e
  função; **quebrar a cabeça derruba**, quebrar um braço tira aquele golpe.
- **Robattle** 3×3 em linha de ação: a parte escolhida define **tempo de
  carga** e de recuperação (barra que corre até a linha central).
- **Medaforce**: especial que carrega ao tomar dano. **Rokusho, tipos de
  medalha** (personalidade) decidem que partes funcionam melhor.
- Ganhar = **tirar uma peça do adversário** (troca de partes).
- **Lição:** **dano localizado** é legível para criança e dá estratégia sem
  tabela de tipos. Aplicável ao "cenário/decoração" como partes? Não —
  mas a ideia de "o especial carrega quando você apanha" já é a nossa carga.

### 2.8 Final Fantasy (as partes que conversam com o gênero)
- **ATB** (FFIV→IX): barra de tempo por personagem, o tempo corre enquanto
  você decide. **FFX CTB**: ordem de turnos visível e manipulável (Haste).
- **World of Final Fantasy (2016)**: **monster taming** puro — "Mirages"
  **empilhados** (pequeno/médio/grande) somam stats e golpes; empilhar/
  desempilhar é tática. Captura exige cumprir **condição** (curar, atacar com
  fogo) em vez de enfraquecer.
- **Mobile**: **Record Keeper** (ATB + Soul Breaks carregados), **Brave
  Exvius** (chain por timing de toque entre unidades), **Opera Omnia**
  (**Bravura** — você rouba "brave" do inimigo e depois converte em dano HP:
  dois recursos, um de preparo e um de golpe), **Ever Crisis** (ATB curto +
  gacha de arma), **FF Tactics** (grade + CT).
- **Lição:** Opera Omnia é o mais aproveitável — **acumular antes, gastar
  depois** é o mesmo formato que "o que você fez no dia vira carga do golpe".

### 2.9 Yo-kai Watch (2013→)
- 6 yo-kai numa **roda**, 3 lutam, **você gira** a roda em tempo real; eles
  **atacam sozinhos**. Você intervém com **mira/itens** e com o
  **Soultimate**, carregado pelo tempo, disparado por **minigame de toque**
  (girar, traçar, tocar bolhas). **Purificar** yo-kai com status por minigame.
- **Lição:** "criatura autônoma + intervenção do jogador por minigame curto"
  é exatamente onde a nossa `TimingBar` já está.

### 2.10 Shin Megami Tensei / Persona
- **Press Turn / One More**: acertar fraqueza dá turno extra, errar tira.
- **Negociação**: conversar para recrutar (e o demônio pode pedir item, dar
  presente ou fugir). **Fusão** de demônios herda golpes.
- **Lição:** a conversa como alternativa ao combate (também em Survive e em
  Undertale) é a mais alinhada à essência "encoraja, não bate".

### 2.11 Dragon Quest Monsters (1998→, *The Dark Prince* 2023)
- Time de monstros com **táticas de IA** ("mostrar força", "sem MP", "cura
  primeiro") em vez de comandos — ou comandos se quiser. **Síntese**
  (breeding) herda talentos. Tamanhos ocupam slots.
- **Lição:** "estratégia por **postura** e não por golpe" — cabe num v-pet.

### 2.12 Monster Hunter Stories (2016/2021/2025)
- Turno de **pedra-papel-tesoura** declarado: Força > Técnica > Velocidade >
  Força, e **o monstro tem padrões lidos** (fica furioso → muda de tipo).
  **Kinship** carrega e permite montar e disparar o golpe de vínculo.
- **Lição:** um triângulo **com tells** é jogável por quem nunca jogou RPG.
  Nosso Vírus/Dado/Vacina poderia ser isso, com o inimigo telegrafando.

---

## 3. Steam / indie monster taming

| Jogo | Núcleo do combate | O que é original |
|---|---|---|
| **Cassette Beasts** (2023) | Turno 2v2, **pool de AP compartilhado** (golpe custa AP; passar gera AP) — sem PP | **Fusão** de qualquer par em batalha quando o vínculo enche; **química de tipos** (golpe de tipo X numa criatura Y **transforma** o tipo/gera status em vez de só multiplicar); stickers como golpes intercambiáveis; relacionamento com parceiro humano |
| **Monster Sanctuary** (2020) | Turno 3v3 | **Contador de combo** — acertos consecutivos no mesmo turno multiplicam; árvore de habilidade por criatura; habilidades de exploração (metroidvania) |
| **Aethermancer** (2025, dev do Monster Sanctuary) | Roguelite de monstros, turno | **Éter** como recurso de mana por cor; monstros com traits que sinergizam; run curta |
| **Temtem** (2022) | **Dupla sempre**, turno | **Estamina** substitui PP (esgotar machuca o próprio temtem); técnicas com **sinergia** se o parceiro for de certo tipo; **hold** (golpe atrasa turnos) |
| **Coromon** (2022) | Turno | **SP compartilhado** por criatura (recurso único), níveis de dificuldade reais, "potencial" como raridade |
| **Siralim Ultimate** (2021) | 6 criaturas, turno automático-ish | **Traits** empilháveis aos milhares — o jogo é o *build*, não a luta |
| **Beastieball** (2024/25) | **Vôlei** em turnos: saque/passe/ataque com posicionamento na quadra | Combate que **não é briga** — esporte; derrota = perder o ponto; tom 100% amigável |
| **Ooblets** (2022) | **Dance-off**: deck-builder de cartas de dança, placar de pontos | Nenhum dano: você **dança** melhor. Prova que o gênero sobrevive sem violência |
| **Monster Crown / Nexomon / Kindred Fates** | Turno clássico | Breeding com genética visível (Crown); tons diferentes |
| **Palworld** (2024) | **Tempo real de ação** (terceira pessoa, arma + pals autônomos que atacam; "Partner Skill") | Criatura como **trabalhador** da base — o mesmo pal luta e produz |
| **Potionomics** (2022) | Negociação como **deck-builder** | Alquimia + "combate social" — se era isto o "alchemy" citado, a ideia útil é **batalha como conversa** |
| **Moonstone Island** (2023) | Batalha de **cartas** com espíritos | Life-sim + monstros + deck: o combate é opcional e curto |
| **Loomian Legacy, Pocket Mortys, Dokapon** | Variações de turno | — |

> ⚠️ "alchamy algumacoisa": não identifiquei com certeza. Os candidatos que
> casam com monster taming na Steam são **Aethermancer** (éter/"alquimia"
> de mana) e **Potionomics** (alquimia + batalha de cartas). Se for outro,
> me diga o nome e eu incluo.

---

## 4. Mobile de sucesso (fora de Pokémon GO)

| Jogo | Mecânica | Por que funciona no celular |
|---|---|---|
| **Monster Strike** (2013, um dos maiores faturamentos da história mobile *(≈)*) | **Estilingue**: arrasta e solta o monstro, que ricocheteia (bilhar); co-op local de 4 | **Um gesto**, física legível, partida de 1–3 min |
| **Puzzle & Dragons** | **Match-3** com tempo para arrastar orbes; cada cor ataca por um monstro do time | Habilidade de puzzle vira dano do time; líder dá multiplicador |
| **Summoners War** | Turno com **barra de turno** (speed), **runas** como equipamento | Profundidade de build, luta pode ser **auto** |
| **Dragon City / Monster Legends** | Turno simples, **breeding** por elementos | Coleção + construção de base; combate é só vitrine |
| **Axie Infinity** | Cartas por parte do corpo da criatura | (Serve de alerta: economia especulativa matou o jogo) |
| **Neopets Battledome** | Turno com equipamento, 2 ações | Pet de cuidado + arena — o parente cultural do Soulmon |
| **Tamagotchi Uni / Smart** | Minigames, sem combate real | O cuidado basta; social por "Tama Verse" |
| **Habitica** | **Chefe de party**: suas tarefas feitas causam dano; tarefas perdidas fazem o chefe **bater no grupo** | ⚠️ É exatamente o que o Soulmon **não pode** copiar — ver §6 |
| **Finch / Forest** | Sem combate | Mostram que o público de produtividade não exige luta |

---

## 5. Padrões que se repetem (a síntese)

1. **Recurso épico uma vez por luta** (Mega/Z/Dynamax/Tera, Soul Break,
   Soultimate, Medaforce, Fusão do Cassette Beasts, ExE do Next Order). É o
   clímax que o jogador lembra. *Nós temos:* o especial com carga da Arena.
2. **Triângulo curto + tells** vence tabela grande para público casual
   (Vacina/Dado/Vírus, MH Stories, Monster Strike por cor). Tabelas grandes
   só funcionam com anos de aprendizado (Pokémon). *Nós temos:* 17 elementos
   na Arena (grande) e Vírus/Dado/Vacina como rótulo — **não usado em luta**.
3. **A criatura age, o dono intervém** (DW1, Next Order, Yo-kai Watch,
   Palworld, DQM). Fantasia de parceiro > fantasia de marionete.
4. **A força vem de fora da luta** (v-pet por cuidado, Vital Bracelet por
   exercício, GO por passos, MR2 por treino semanal). Luta curta, preparo longo.
5. **Lutas curtas** (30–120 s) em tudo que é mobile de sucesso.
6. **Combate que não é briga** existe e vende: dança (Ooblets), vôlei
   (Beastieball), conversa (SMT, Survive, Undertale, Potionomics).
7. **Co-op contra chefe com timer** (Raids, Monster Hunter Now, Habitica) é
   o motor social mais forte — e o mais perigoso para culpa.

---

## 6. O que isso significa para o Soulmon

### Filtro das linhas vermelhas (antes de qualquer ideia)

| Padrão de mercado | Veredito para o Soulmon |
|---|---|
| Habitica: tarefa perdida → chefe machuca o grupo | ❌ **Vetado.** Transforma falha em dano social. Viola "nunca um cobrador" e "perder combate não custa coração" |
| Força = **número** de tarefas feitas | ❌ **Vetado** ("nenhuma recompensa por contagem de tarefas"). Se a luta ler algo do cuidado, que leia **constância/ritmo/atributos**, que já existem |
| Lifespan/permadeath (MR2, v-pet) | ❌ Contra "perda só sobre item recuperável" |
| Stamina que acaba e trava o jogo (energia de gacha) | ❌ Já decidido: masmorra sem gate de entrada |
| Gacha/equipamento pago que dá poder | ❌ Créditos não compram vantagem |
| PvP síncrono de ranking absoluto | ⚠️ Faixas antes de ranking já é regra do Torneio |

### Ideias que passam no filtro (hipóteses, não decisões)

Em ordem de custo crescente — **nenhuma entra sem o dono**:

1. **"A luta é o relatório do cuidado" (Digimon 1997).** Um modo de batalha
   **automática** entre dois Soulmons (PvP assíncrono do Torneio já existe)
   em que a taxa de acerto sai do **ritmo de cuidado** (`carePattern.ts`) e
   dos **atributos** — sem botão. Custo baixo: reusa `simulateArenaRun`.
   Pergunta ao dono: o assíncrono deve ser espectador puro?
2. **Vírus/Dado/Vacina vira triângulo de luta, com tells** (Digimon Cyber
   Sleuth + MH Stories). Hoje é só rótulo de galho. Daria significado de
   combate ao que o jogador já escolheu ao cuidar. Precisa de squad-narrativa
   (lore: Ruptura/Trama/Guarda) e de rebalancear a Arena.
3. **Torcer em vez de comandar (DW1/Next Order).** Na masmorra, o pet ataca
   sozinho e o jogador **torce** (a `TimingBar` vira "torcida no momento
   certo" que dá bônus). Mesma mecânica, outra fantasia — e o verbo "torcer"
   é carinhoso. Mudança quase só de copy + animação.
4. **Carga de preparo (Opera Omnia / GO Buddy).** Um recurso de luta que
   **enche com o gesto de cuidado do dia** (carinho, comer, dormir na janela)
   — nunca com contagem de tarefas — e é gasto no especial. Cuidado: regra
   de ouro "perda só sobre item recuperável"; a carga não pode sumir como
   castigo.
5. **Modo de luta que não é briga** (Ooblets/Beastieball). Um "desafio" de
   ritmo/dança para quem não quer violência — coerente com o público de
   produtividade e com a L-leis de escrita. Custo alto (arte + som, R-NOVA:
   nasce muda).
6. **Fusão temporária por vínculo (Cassette Beasts/ExE)** no PvP ou co-op
   (`docs/PLANO-COOP.md`): dois Soulmons de amigos fundem por uma rodada.
   Casa com o Ultra (fusão dos 3 Megas) — conferir PI: o conceito de fusão é
   genérico, o nome não pode soletrar franquia.
7. **Co-op contra chefe sem culpa** (Raid às avessas): o chefe semanal só
   **recebe** dano das contribuições; ninguém perde nada se não ajudar, e a
   recompensa é por participação, não por ranking. É o Habitica com o
   dente arrancado. Depende do save na nuvem confiável (fatia 1).

### O que eu NÃO recomendaria

- Tabela de 18 tipos estilo Pokémon por cima dos 17 elementos: já temos
  complexidade demais para o público; a Arena mostra 17 e ninguém lê.
- Tempo real de ação (Palworld/Z-A): custo de arte e de acessibilidade alto,
  e o app é de sessão curta.
- Qualquer mecânica de "defender o pet do seu próprio dia ruim".

---

## 7. Próximos passos sugeridos

- **Dono**: escolher 1–2 ideias do §6 para virar pergunta em
  `PERGUNTAS-DO-DONO.md`; confirmar o jogo "alchemy".
- **soulmon-monster-taming-designer + soulmon-guarda-permanencia**: parecer
  sobre as ideias 1–3 (as baratas) com conta de balanceamento.
- **soulmon-guarda-linha-vermelha**: veto formal das ideias 4 e 7.
- Achado lateral desta leitura: o cabeçalho de `src/utils/arena.ts` ainda
  diz "SEM CONSUMIDOR", mas `ArenaGame.tsx` importa o motor — comentário
  desatualizado (não corrigido aqui para não misturar escopo).
