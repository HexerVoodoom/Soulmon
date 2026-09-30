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


---

## Conferido em 30/09/2026

> **Registro, não reescrita.** O corpo acima (29/09/2026) ficou intacto; esta seção
> confere, por busca web, o que ele afirmou "de memória". Convenção de marcas:
> `docs/BENCHMARK-E-REFERENCIAS.md` §4.1. Acesso: **30/09/2026** em todas as linhas.
> Agente: `benchmark-pesquisador`.
>
> **Como ler as marcas aqui (critério estrito):**
> - **✔** só quando a fonte aberta é primária/oficial (estúdio, editora, loja, blog do
>   dev, relatório de terceiro que mede). **Wikipedia, wiki de fã, guia e review contam
>   como ◐** — quando duas fontes independentes concordam, a nota diz "2 fontes".
> - **(≈)** = a busca não devolveu e o item continua de memória (não sustenta decisão).
> - **✖** = duas leituras: *(a)* **contradita** — a fonte aberta diz outra coisa (a nota
>   traz a correção); *(b)* não achei nada. A nota diz qual das duas.
> - Ferramentas: `WebSearch` + `WebFetch`. **Bulbapedia bloqueou (HTTP 403)** e alguns
>   fandoms devolveram 402/403 — onde só o resumo da busca chegou, a URL é a que a busca
>   devolveu e a marca é no máximo ◐.
> - "Lição"/"O que isso significa" (§2 fecho de cada ficha, §5, §6) são **interpretação
>   do autor**: não são afirmação de fato, não foram marcadas (ver "Fora de escopo").

### C.1 — §2.1 a §2.3: Pokémon e derivados (Pokémon GO, Sleep, Pokéwalker)

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 1 | 18 tipos; dano ×2 / ×½ | ◐ | Wikipedia: "eighteen types", dobro/metade. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_(video_game_series) |
| 2 | Imunidade ×0 | (≈) | Não apareceu na fonte aberta (Bulbapedia 403). | — |
| 3 | STAB ×1,5 | ◐ | 1,5× (2 fontes); habilidade Adaptability sobe a 2×. | https://game8.co/games/Pokemon-Scarlet-Violet/archives/393159 · https://gamerant.com/pokemon-everything-about-same-type-attack-bonus-stab/ |
| 4 | Mega (Gen 6), Z (7), Dynamax (8), Terastal (9) | ◐ | Confere as gerações. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_(video_game_series) |
| 5 | Z-move e Terastal como recurso de 1× por luta | ◐ | Z "once per battle" (Wikipedia); Tera "uma vez por batalha, troca o tipo" (2 fontes). | https://en.wikipedia.org/wiki/Pok%C3%A9mon_(video_game_series) · https://www.serebii.net/scarletviolet/terastal.shtml |
| 6 | Mega e Dynamax também 1× por luta ("sempre um recurso de 1×") | (≈) | Fonte aberta só diz que Dynamax dura 3 turnos. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_(video_game_series) |
| 7 | Legends: Arceus (2022): estilos Ágil/Forte trocam dano por posição na fila de ação, fila visível | ◐ | 28/01/2022; Ágil = menos poder e próximo turno antes; Forte = mais poder e turno depois; ordem visível na tela (2 fontes). | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Legends:_Arceus · https://www.thesixthaxis.com/2022/01/28/pokemon-legends-arceus-strong-agile-style-fighting-guide/ |
| 8 | Legends Z-A (2025): tempo real com recarga de golpe | ◐ | 16/10/2025; tempo real; cada golpe com cooldown influenciado por Speed (2 fontes). | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Legends:_Z-A · https://www.rpgsite.net/preview/18322-pokemon-legends-z-as-shift-to-fully-real-time-battles-with-timed-cooldowns-allows-for-unconventional-tactics |
| 9 | Mystery Dungeon: roguelike em grade, turno por passo, fome | ◐ | Confere, com ressalva: a fome ("Belly") **não existe** no Gates to Infinity e voltou depois. | https://www.psypokes.com/dungeon/dungeons.php |
| 10 | Stadium: arena pura, sem mundo | ◐ | Stadium é só torneios/batalha. | https://gamerant.com/best-pokemon-stadium-games/ |
| 11 | Colosseum: arena pura, sem mundo | ✖ | **Contradita**: Colosseum tem modo história e mundo; só o Battle Mode é "arena". | https://gamerant.com/best-pokemon-stadium-games/ |
| 12 | Habilidades, itens, clima/terreno, status persistente, IV/EV/natureza | (≈) | Não pesquisado (catálogo geral). | — |
| 13 | GO ginásio/raid: toque = golpe rápido que carrega; carregado quando enche; deslizar = esquiva | ◐ | Confere; esquiva reduz 75% do dano, janela ~700 ms (2 fontes). | https://pokemongo.fandom.com/wiki/Attacks · https://pogo.gamepress.gg/gym-combat-mechanics |
| 14 | GO Battle League: 2 escudos por partida | ◐ | Confere (2 fontes). | https://www.imore.com/pokemon-go-battle-league · https://bulbapedia.bulbagarden.net/wiki/Trainer_Battle_(GO) |
| 15 | GBL: "golpes rápidos automáticos pelo toque" | ✖ | **Contradita em parte**: o golpe rápido é **por toque** (não automático), em turnos de 0,5 s. | https://pokemongo.fandom.com/wiki/Trainer_Battle |
| 16 | GBL: "minigame de potência" no carregado | ◐ | Existe minigame de toque/deslize que muda o dano do carregado (2 fontes; formato descrito de dois jeitos). | https://pokemongo.fandom.com/wiki/Trainer_Battle · https://techcrunch.com/2018/12/04/pokemon-go-is-finally-getting-player-versus-player-battles-heres-how-theyll-work |
| 17 | Raid: co-op síncrono, timer, recompensa = captura | (≈) | Só o título do Help Center apareceu; conteúdo não aberto. | https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/2187-what-are-raid-battles/ |
| 18 | Força do GO vem de "poeira estelar + doces obtidos andando" | (≈) | Doce por km com o Buddy confirmado (linha 19); poeira estelar **por caminhada** não confirmada. | — |
| 19 | Buddy dá doce por km | ◐ | 1 / 3 / 5 / 20 km conforme a espécie; 1 coração a cada 2 km, máx. 3/dia (2 fontes). | https://www.switchbladegaming.com/pokemon-go/buddy-guide/ · https://www.thegamer.com/pokemon-go-complete-buddy-pokemon-hearts-guide/ |
| 20 | Melhor Amigo dá bônus em batalha: CP extra | ◐ | +1 nível de CP em raid, ginásio, Rocket e PvP, só com o Buddy ativo (2 fontes). | https://gamerant.com/pokemon-go-best-buddy-cp-boost/ · https://pokemongohub.net/post/guide/buddy-adventure-guide-everything-you-need-to-know/ |
| 21 | "...e antes a chance de aguentar um golpe" (Buddy) | ✖ | Não achei (b). Não aparece nas fontes do bônus. | — |
| 22 | Monster Hunter Now: luta de ~75 s em tempo real ao toque | ◐ | 75 s; toque/segurar/deslizar; especial com recarga (2 fontes). | https://en.wikipedia.org/wiki/Monster_Hunter_Now · https://monsterhunterwiki.org/wiki/Monster_Hunter_Now |
| 23 | MH Now: lançamento 2023; arma "carregada com o que você farmou andando" | (≈) | Nem ano nem a parte da caminhada apareceram. | — |
| 24 | Dragon Quest Walk: combate quase automático, conteúdo por lugar | ◐ | Lançado em 12/09/2019; é possível resolver a luta automaticamente; andar destrava inimigos; co-op de até 12. | https://en.wikipedia.org/wiki/Dragon_Quest_Walk |
| 25 | Jurassic World Alive: turnos simultâneos, Speed resolve, esquiva/distração | ◐ | 15 s para escolher por rodada, maior Speed age antes; Dodge e Distraction são habilidades (2 fontes). | https://www.gamezebo.com/walkthroughs/jurassic-world-alive-battle-tips-your-guide-to-pvp/ · https://jurassic-world-alive.fandom.com/wiki/Dodge |
| 26 | Pokémon Sleep: zero combate | ◐ | "There is no combat." Lançado em jul/2023. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Sleep |
| 27 | Sleep: "força de ronco" do Snorlax; o dormir decide o que aparece | ◐ | Score de sono × score do Snorlax = "Drowsy Power"; o tipo de sono define quais Pokémon visitam. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Sleep |
| 28 | Sleep: a força do Snorlax "sobe com as criaturas que você cuidou" | (≈) | Fonte diz que amizade vem de PokéBiscuits; o vínculo com a força do Snorlax não foi confirmado. | https://en.wikipedia.org/wiki/Pok%C3%A9mon_Sleep |
| 29 | Pokéwalker (2009): passos viram watts | ◐ | Passo → XP do Pokémon dentro + watts; era da geração HGSS (2009–10). | https://en.wikipedia.org/wiki/Pok%C3%A9walker |
| 30 | Pokéwalker: watts pagam encontros "com 2 golpes: atacar / esquivar / capturar" | ✖ | **Contradita**: são **3 opções** (Attack, Evade, Catch), 4 HP para cada lado; atacar tira 1 HP (crítico 2). Watts pagam utilidades (ex.: Poké Radar = 10 W); que "pagam encontros" não foi confirmado. | https://pokemon.fandom.com/wiki/Pok%C3%A9walker · https://www.serebii.net/heartgoldsoulsilver/pokewalker.shtml |
| 31 | Pokémon Pikachu (v-pet): watts pelo pedômetro | ◐ | 1998; pedômetro; 7 passos = 1 watt (2 fontes). | https://www.serebii.net/virtualpet/pokemonpikachu/ · https://en.wikipedia.org/wiki/Pok%C3%A9mon_Pikachu |

### C.2 — §2.4 e §2.5: Digimon (aparelhos e jogos)

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 32 | Digital Monster (1997): batalha entre dois aparelhos conectados | ◐ | Lançado em 26/06/1997; batalha exige dois aparelhos; Win Ratio influencia chegar ao Perfect (2 fontes). | https://wikimon.net/Digital_Monster · https://en.wikipedia.org/wiki/Digital_Monster |
| 33 | "Automática, ninguém aperta botão; resultado = poder da forma + taxa de acerto derivada do cuidado" | (≈) | A fonte aberta **não especifica** o cálculo. Um resumo de busca descreve troca de 4 golpes com desfecho decidido nos aparelhos; não é fonte primária. Peso e cuidado afetarem digivolução e batalha aparece em 1 fonte. | https://wikimon.net/Digital_Monster · https://www.90stoys.com/electronic-toys/digital-monster-digimon-virtual-pet/ |
| 34 | Pendulum: sacudir o aparelho para treinar | ◐ | Confere: clacker/acelerômetro conta as sacudidas, define a força dos tiros no treino (2 fontes). | https://wikimon.net/Digimon_Pendulum · https://humulos.com/digimon/pen/manual/ |
| 35 | Digivice (1998/99): passos dão encontros; ataque por apertar botão rápido | ◐ | Confere no Digivice Ver.Complete: pedômetro (100 passos = 1 DP), apertar A 15+ vezes; **só quem ataca primeiro ataca**. Ano 1998/99 e "original" não confirmados. | https://wikimon.net/Digivice_Ver.Complete · https://lcd.withthewill.net/DigiviceIntro |
| 36 | D-Ark: slash de cartas ativa buff; D-Scanner lê código de barras p/ inimigos e itens | ◐ | Confere (buff temporário do parceiro; barcodes geram Digimon, inimigos, itens). | https://wikimon.net/D-Ark · https://wikimon.net/D-Scanner_Toy |
| 37 | D-3 / D-Power (aparelhos citados) | (≈) | Páginas listadas na busca, não abertas. | https://wikimon.net/D-Power_Digivice_Toy_(EU/AS) |
| 38 | Digimon Color: timing de mira em alguns modelos | ◐ | V1 = alto/baixo (3 de 5); V3 "hit game"; V4/V5 "timing" (2 fontes). | https://humulos.com/digimon/dmc/manual/ · https://withthewill.net/threads/digimon-color-v-pet-version-3-4-5-pre-order-details-images-info-promo-video.29411/ |
| 39 | Color: Vacina/Dado/Vírus com vantagem cíclica | ◐ | Confere; vantagem = **+5 pontos percentuais** na taxa de acerto; "Free" neutro. | https://humulos.com/digimon/dmc/manual/ |
| 40 | Vital Bracelet (2021→): exercício e frequência cardíaca; NFC; DIM cards | ◐ | Confere: passos e batimento → evolução; batalhas por NFC; DIM troca a área/Digimon (3 fontes). | https://p-bandai.com/us/item/N2559919001001 · https://noisypixel.net/vital-bracelet-digital-monster-impressions/ · https://tamapalace.tumblr.com/post/637054218302291968/bandai-japan-announces-digimon-digital-monster |
| 41 | Vital: treino é minigame de "shake/mash"; "Vital points" como moeda de luta | (≈) | Não confirmado; fonte diz que vencer repõe os "vitals". | https://p-bandai.com/us/item/N2559919001001 |
| 42 | Digimon World 1 (1999): parceiro luta com IA própria, você dá ordens | ◐ | Confere: ordens liberadas pelo atributo Brains (Attack, Defend, Change...). | https://gamefaqs.gamespot.com/boards/913684-digimon-world/69124222 · https://digimon.fandom.com/wiki/Digimon_World |
| 43 | DW1: "torcer/ralhar gasta um recurso" | ✖ | **Contradita (a)**: elogiar/ralhar mexem em disciplina e felicidade; não achei recurso gasto. "Torcer" como verbo é do Next Order. | https://gamefaqs.gamespot.com/ps/913684-digimon-world/faqs/75773/digimon-care |
| 44 | DW1: vida útil finita; care mistakes decidem a evolução | ◐ | Parceiro morre de idade e volta ao ovo; contador de care mistakes zera a cada evolução e cada forma tem teto (2 fontes). | https://gamefaqs.gamespot.com/ps/913684-digimon-world/faqs/73845/evolution-requirements · https://digimon.fandom.com/wiki/Digimon_World |
| 45 | Next Order (2016): 2 parceiros | ◐ | Vita/Japão 2016, PS4 2017; dois parceiros; vínculo por elogio, bronca, comida e item. | https://en.wikipedia.org/wiki/Digimon_World:_Next_Order |
| 46 | Next Order: ExE = fusão temporária dos dois quando o vínculo é alto | ◐ | Exige Bond 100 nos dois, 150 OP; 1× por dia; pode disparar sozinho quando os dois caem. | https://gamefaqs.gamespot.com/boards/196176-digimon-world-next-order/75975906 |
| 47 | Next Order: OP se acumula "torcendo" | (≈) | OP existe e é gasto (ExE = 150 OP); que se ganhe torcendo não foi confirmado. | https://gamefaqs.gamespot.com/boards/196176-digimon-world-next-order/75975906 |
| 48 | Digimon World 2 / 3 / 4: dungeon crawler de turno / time de 3 / beat'em up | ◐ | DW2 crawler em turnos; DW3 turnos com até 3 monstros; DW4 ação hack-and-slash p/ 4 (2005). | https://en.wikipedia.org/wiki/Digimon_World_2 · https://en.wikipedia.org/wiki/Digimon_World_3 · https://en.wikipedia.org/wiki/Digimon_World_4 |
| 49 | Cyber Sleuth (2015) / Hacker's Memory (2017) | ◐ | Japão: 12/03/2015 e 14/12/2017; Ocidente: 02/02/2016 e 19/01/2018. | https://en.wikipedia.org/wiki/Digimon_Story:_Cyber_Sleuth · https://en.wikipedia.org/wiki/Digimon_Story:_Cyber_Sleuth_%E2%80%93_Hacker's_Memory |
| 50 | CS: barra de ordem visível; sigla "CTB" | ◐ | Ordem na direita da tela; Speed decide; o custo da ação empurra o próximo turno (2 fontes). A sigla "CTB" não apareceu (≈). | https://www.player.one/digimon-story-cyber-sleuth-battle-guide-types-attributes-and-more-explained-510024 · https://gamefaqs.gamespot.com/ps4/207680-digimon-story-cyber-sleuth-hackers-memory/faqs/76546/battle-mechanics |
| 51 | CS: triângulo Vacina > Vírus > Dado > Vacina | ◐ | Confere (dobra/reduz o dano; "Free" neutro). | https://www.player.one/digimon-story-cyber-sleuth-battle-guide-types-attributes-and-more-explained-510024 |
| 52 | CS: "10 elementos por cima" | ✖ | **Contradita (a)**: a fonte lista **9** (Água/Fogo/Planta; Elétrico/Terra/Vento; Luz/Trevas; Neutro). | https://www.player.one/digimon-story-cyber-sleuth-battle-guide-types-attributes-and-more-explained-510024 |
| 53 | CS: digivolução/de-digivolução livre, com cópia de golpe ("memória") | ◐ | De-digivolver existe (volta ao nível 1) e habilidades herdadas persistem; "livre" tem condições (nível, ABI); "memória" não confirmado. | https://twinfinite.net/ps4/digimon-story-cyber-sleuth-how-to-digivolve/ |
| 54 | Digimon Survive (2022): tático + persuasão + karma que decide a evolução | ◐ | 28–29/07/2022; tático + visual novel; conversa com inimigo (3 perguntas, barra de 6 seções, recruta ou dá item); karma Moral/Wrathful/Harmony pesa na persuasão e nas decisões que moldam a evolução. "Em grade" não confirmado. | https://en.wikipedia.org/wiki/Digimon_Survive · https://gamefaqs.gamespot.com/pc/244573-digimon-survive/faqs/81000/general-information |
| 55 | Time Stranger (2025): personalidades afetam o crescimento | ✔ | **Oficial Bandai Namco**: lançamento 03/10/2025; personalidade acelera certos aspectos e "afeta o caminho de Digivolução"; 7 atributos incluindo Vírus/Vacina/Dado (dano de 50% a 300%). | https://en.bandainamcoent.eu/digimon/news/digimon-story-time-stranger-the-game-mechanics-explained |
| 56 | Time Stranger: "turno clássico" | ◐ | Página oficial fala em combate estratégico com Cross Arts; "por turnos" não está escrito ali. | https://en.bandainamcoent.eu/digimon/news/digimon-story-time-stranger-the-game-mechanics-explained |
| 57 | Rumble Arena / All-Star Rumble: brigas de plataforma com evolução temporária por barra cheia | ◐ | RA2 (2004) estilo Smash com Digipoints para digivolver; All-Star Rumble (2014). | https://en.wikipedia.org/wiki/Digimon_Rumble_Arena_2 · https://en.wikipedia.org/wiki/Digimon_All-Star_Rumble |

### C.3 — §2.6 a §2.12: Monster Rancher, Medabots, Final Fantasy, Yo-kai, SMT/Persona, DQM, MH Stories

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 58 | Monster Rancher: criatura gerada por CD (MR2 1999) | ◐ | MR1 1997, MR2 1999; qualquer CD gera monstro (2 fontes). | https://en.wikipedia.org/wiki/Monster_Rancher_(video_game) · https://legendcup.com/faq-generate-monsters.php |
| 59 | MR2: Guts que regenera sozinho; batalha em tempo real | ◐ | Pool até 99, começa em 50, regen por monstro; técnica gasta Guts. "Tempo real" implícito (medida em frames), não dito com essas palavras. | https://legendcup.com/mr2researchaiprocessing.php |
| 60 | MR2: alcance perto/médio/longe/muito longe | ◐ | São 4 faixas: Close / Short / Middle / Far; cada técnica só vale na sua faixa. | https://legendcup.com/mr2researchaiprocessing.php |
| 61 | MR2: "fúria/foco" e fuga | (≈) | Não confirmado. | — |
| 62 | MR2: treino semanal, expedições, lifespan cai com stress/fadiga, torneios com calendário e ranques E→S | ◐ | Treino, expedições e errantry ✔; −1 semana de vida por semana, índice = fadiga + 2×stress e ≥70 gasta semanas extras; 4 IMa Cups por ano definem rank. A escala literal "E→S" não confirmada (≈). | https://en.wikipedia.org/wiki/Monster_Rancher_2 · https://legendcup.com/faqmr2monsterdata.php |
| 63 | Medabots: robô de 4 partes; cabeça quebrada derruba | ◐ | Cabeça, braço E, braço D, pernas; cabeça destruída desativa o robô (2 fontes). | https://en.wikipedia.org/wiki/Medabots · https://medabots.fandom.com/wiki/Medabot |
| 64 | Medabots: "quebrar um braço tira aquele golpe" | ◐ | Cada braço concede uma habilidade (fonte aberta não diz literalmente o efeito de quebrar). | https://medabots.fandom.com/wiki/Medabot |
| 65 | Robattle 3×3; linha central com carga e recuperação | ◐ | Time = 1 Medafighter + até 3 Medabots; ir à Active Line = carga, voltar = recuperação. | https://medabots.fandom.com/wiki/Robattle |
| 66 | Medaforce carrega ao tomar dano | ◐ | "Usually fills a little when takes damage" + turno de carga. | https://medabots.fandom.com/wiki/Medaforce |
| 67 | Ganhar = tirar uma peça do adversário | ◐ | Confere, "com poucas exceções" (batalhas de aposta). | https://medarot.meowcorp.us/wiki/Robattle |
| 68 | Medabots (1997→); "Rokusho, tipos de medalha decidem que partes funcionam melhor" | (≈) | Ano e a frase de medalha/personalidade não confirmados. | — |
| 69 | FF: ATB estreia no FFIV, tempo corre enquanto se decide | ◐ | 1991 (FFIV); no modo Active as barras não param nos menus. "FFIV→IX" não confirmado (≈). | https://en.wikipedia.org/wiki/Active_Time_Battle |
| 70 | FFX "CTB": ordem visível e manipulável (Haste) | ◐ | FFX abandonou o ATB e é "estritamente por turnos" com troca de membros; a sigla CTB e o Haste não confirmados. | https://en.wikipedia.org/wiki/Active_Time_Battle |
| 71 | World of FF (2016): monster taming, Mirages empilhados | ◐ | 2016 (PS4/Vita); empilhar dá bônus e **reduz os turnos**; captura por "enfraquecer **ou** sequência de ações". O corpo diz "em vez de enfraquecer": só metade. "Pequeno/médio/grande" não confirmado. | https://en.wikipedia.org/wiki/World_of_Final_Fantasy |
| 72 | Record Keeper: ATB + Soul Breaks carregados | ◐ | Soul Break gasta 1 a 6 unidades da Soul Gauge (não é "1× por luta"). | https://finalfantasy.fandom.com/wiki/Soul_Break |
| 73 | Brave Exvius: chain por timing de toque entre unidades | ◐ | Chain = acertos em sucessão rápida de unidades diferentes, até 4× (alguns 6×); acaba se a mesma unidade repete. | https://exvius.fandom.com/wiki/Chaining |
| 74 | Opera Omnia: rouba Brave e converte em dano de HP | ◐ | Confere: ataque BRV rouba Brave; ataque HP gasta todo o Brave em dano; Break dá bônus. | https://operaomnia.fandom.com/wiki/Mechanics |
| 75 | Ever Crisis: ATB curto + gacha de arma | ◐ | Personagens grátis; gacha só de arma/traje; armas com efeitos de ATB. "Curto" não confirmado. | https://en.wikipedia.org/wiki/Final_Fantasy_VII:_Ever_Crisis · https://finalfantasy.fandom.com/wiki/Final_Fantasy_VII_Ever_Crisis |
| 76 | FF Tactics (grade + CT) | (≈) | Não pesquisado. | — |
| 77 | Yo-kai Watch: 6 numa roda, 3 lutam, você gira, eles atacam sozinhos | ◐ | Confere (2 fontes); cada um tem 4 golpes usados por vontade própria. | https://hardcoregamer.com/reviews/review-yo-kai-watch/178165/ · https://yokaiwatch.fandom.com/wiki/Yo-kai_Watch_(video_game) |
| 78 | Yo-kai: Soultimate carregado pelo tempo, disparado por minigame de toque; purificar por minigame | ◐ | Soul Meter enche ao longo da luta; minigame na tela de toque; Purify no tempo certo. Os gestos "girar, traçar, tocar bolhas", "mira/itens" e o ano 2013 não confirmados. | https://yokaiwatch.fandom.com/wiki/Yo-kai_Watch_(video_game) |
| 79 | SMT Press Turn: fraqueza dá turno extra, errar tira | ◐ | Confere (Nocturne). | https://en.wikipedia.org/wiki/Shin_Megami_Tensei_III:_Nocturne |
| 80 | Persona "One More" | ◐ | Derrubar (fraqueza/crítico) dá turno extra. | https://megamitensei.fandom.com/wiki/One_More |
| 81 | SMT: negociação recruta; demônio pede item, presente ou foge; fusão herda golpes | ◐ | Recruta, pode pedir item/dinheiro/HP/MP; fusão herda golpes (aleatório no Nocturne, escolhível no V). "Fugir" não confirmado. | https://en.wikipedia.org/wiki/Shin_Megami_Tensei_III:_Nocturne · https://megamitensei.fandom.com/wiki/Negotiation |
| 82 | Undertale: conversar/poupar como alternativa ao combate | ◐ | ACT + SPARE; rota pacifista sem matar ninguém. | https://undertale.wiki/w/True_Pacifist_Route |
| 83 | Dragon Quest Monsters: The Dark Prince (2023): síntese herda talentos; tamanhos ocupam slots | ◐ | Grandes ocupam 2 slots (4 pequenos ou 2 grandes); síntese herda talentos (2 fontes). Ano 1998 da série (≈). | https://www.dualshockers.com/dragon-quest-monsters-dark-prince-synthesis-explained/ · https://www.gematsu.com/2023/09/dragon-quest-monsters-the-dark-prince-details-new-battle-and-monster-recruiting-systems |
| 84 | DQM: táticas de IA ("mostrar força", "sem MP", "cura primeiro") | (≈) | A série tem táticas (Joker: 5 configurações; "Show No Mercy", "Focus On Healing" e "Mix It Up" são reais). Os **rótulos do corpo** e a presença no Dark Prince não foram confirmados. | https://dragonquest.fandom.com/wiki/Dragon_Quest_Monsters:_Joker |
| 85 | MH Stories: Força > Técnica > Velocidade > Força | ◐ | Confere; "Head-to-Head"; mesma escolha dupla = Double Attack (2 fontes). | https://en.wikipedia.org/wiki/Monster_Hunter_Stories · https://www.nintendolife.com/guides/monster-hunter-stories-2-battle-guide-how-to-win-battles |
| 86 | MH Stories: monstro furioso troca o tipo de ataque (tell) | ◐ | Confere no MHS2 (aura vermelha). | https://www.nintendolife.com/guides/monster-hunter-stories-2-battle-guide-how-to-win-battles |
| 87 | MH Stories: Kinship carrega, permite montar e o golpe de vínculo | ◐ | Confere (2 fontes). | https://en.wikipedia.org/wiki/Monster_Hunter_Stories · https://sportskeeda.com/esports/monster-hunter-stories-pc-review |
| 88 | MH Stories "(2016/2021/2025)" | ✖ | **Contradita em parte**: MHS2 = 2021 ◐; MHS1 = 2016 (≈); o terceiro é **Monster Hunter Stories 3: Twisted Reflection, lançado em 13/03/2026**, não 2025. | https://en.wikipedia.org/wiki/Monster_Hunter_Stories_3:_Twisted_Reflection · https://www.nintendo.com/my/news/article/7KCQr4zcllU3k4P0PJcIoz |

### C.4 — §3: Steam / indie monster taming

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 89 | Cassette Beasts: turno 2v2 com AP, sem PP | ◐ | 2v2 com AP (Steam); "rather than PP" no blog oficial do estúdio, mas só o resumo do blog chegou; cada personagem ganha 2 AP por rodada. Ano 2023 (≈). | https://store.steampowered.com/app/1321440/Cassette_Beasts/ · https://www.cassettebeasts.com/2020/05/11/fusion/ |
| 90 | Cassette Beasts: "pool de AP **compartilhado**; passar gera AP" | (≈) | "Compartilhado" não confirmado (fonte diz que cada personagem ganha AP por rodada); "passar gera AP" não achado. | https://en.wikipedia.org/wiki/Cassette_Beasts |
| 91 | Cassette Beasts: fusão de qualquer par quando o vínculo enche | ◐ | Fusão = evolução temporária; liberada/potencializada pelo relacionamento com o parceiro (blog oficial, resumo) e por barra que enche com acertos vantajosos (Chemistry Mod). Fusão dobra o AP para 4/turno. | https://www.cassettebeasts.com/2020/05/11/fusion/ · https://gamerant.com/cassette-beasts-fusion-edgar-how-companion-fuse/ |
| 92 | Cassette Beasts: química de tipos "**transforma** o tipo" | ✖ | **Contradita em parte**: Wikipedia descreve *consequências* (ex.: fogo em água gera vapor curativo), não troca de tipo. | https://en.wikipedia.org/wiki/Cassette_Beasts |
| 93 | Cassette Beasts: stickers como golpes intercambiáveis | ◐ | Confere (2 fontes). | https://en.wikipedia.org/wiki/Cassette_Beasts · https://www.cassettebeasts.com/2022/09/16/show-your-moves/ |
| 94 | Monster Sanctuary (2020): 3v3, árvore de habilidade, metroidvania | ◐ | Confere (Moi Rai Games / Team17). | https://en.wikipedia.org/wiki/Monster_Sanctuary |
| 95 | Monster Sanctuary: combo = "acertos consecutivos no mesmo turno" | ✖ | **Contradita em parte**: o medidor de combo enche com **qualquer** ação (ataque, cura, escudo, buff, item) e turbina o golpe forte final. | https://www.rpgfan.com/review/monster-sanctuary/ · https://en.wikipedia.org/wiki/Monster_Sanctuary |
| 96 | Aethermancer (2025): roguelite do dev do Monster Sanctuary | ✔ | Steam: Early Access em 23/09/2025, moi rai games; 40 monstros, 19 tipos. | https://store.steampowered.com/app/2288470/Aethermancer/ |
| 97 | Aethermancer: "éter como recurso de mana por cor" | ◐ | Éter por elemento (Água/Fogo/Vento/Terra); ação exige éter do elemento; sem éter, o inimigo é interrompido. "Run curta" (≈). | https://aethermancer.wiki.gg/wiki/Aether_(Resource) |
| 98 | Temtem: estamina substitui PP; esgotar machuca | ◐ | Confere: overexertion custa HP (dobro) e o turno seguinte. Ano 2022 (≈). | https://temtem.wiki.gg/wiki/Combat · https://www.cbr.com/temtem-stamina-pokemon-pp-explained/ |
| 99 | Temtem: dupla sempre; sinergia com o parceiro | ◐ | Confere (2 fontes). | https://temtem.wiki.gg/wiki/Techniques · https://techraptor.net/gaming/guides/temtem-battle-guide |
| 100 | Temtem: **hold** = "golpe atrasa turnos" | ✖ | **Contradita em parte**: Hold = a técnica só fica disponível após N turnos em campo. | https://temtem.wiki.gg/wiki/Techniques |
| 101 | Coromon (2022): SP compartilhado, dificuldade real, "potencial" | ◐ | 31/03/2022; 4 golpes por Coromon sobre um pool de SP; Fácil→Insano (o mais alto tem regras Nuzlocke, perda permanente); Potencial 1–21. | https://en.wikipedia.org/wiki/Coromon |
| 102 | Siralim Ultimate (2021): 6 criaturas, traits empilháveis "aos milhares" | ◐ | 03/12/2021; 6v6; 1200+ criaturas, cada uma com **um** trait (não "milhares de traits"); fusão herda traits. | https://store.steampowered.com/app/1289810/Siralim_Ultimate/ · https://siralimultimate.wiki.gg/wiki/Creatures |
| 103 | Siralim: "turno automático-ish" | (≈) | Não confirmado. | — |
| 104 | Beastieball (2024/25): vôlei em turnos | ◐ | Early Access em 12/11/2024; tática em grade, passe e ataque (2 fontes). "Derrota = perder o ponto; tom 100% amigável" (≈). | https://store.steampowered.com/app/1864950/Beastieball/ · https://www.gematsu.com/2024/11/beastieball-launches-in-early-access-on-november-12 |
| 105 | Ooblets (2022): dance-off de cartas, sem dano | ◐ | 01/09/2022; "replaces combat with a card-based dance-off"; 20–40 pontos. | https://en.wikipedia.org/wiki/Ooblets |
| 106 | Palworld (2024): tempo real de ação, Partner Skill, pal como trabalhador | ◐ | Tempo real, Partner Skill por pal, bases com pals trabalhando. Ano 2024 e "terceira pessoa" não confirmados na fonte aberta (≈). | https://en.wikipedia.org/wiki/Palworld · https://palworld.wiki.gg/wiki/Partner_Skills |
| 107 | Potionomics (2022): negociação como deck-builder | ◐ | 17/10/2022; haggling em cartas estilo Slay the Spire. | https://en.wikipedia.org/wiki/Potionomics |
| 108 | Moonstone Island (2023): cartas com espíritos; combate "opcional e curto" | ◐ | 20/09/2023; life-sim + cartas com espíritos. "Opcional e curto" (≈). | https://en.wikipedia.org/wiki/Moonstone_Island |
| 109 | Monster Crown / Nexomon / Kindred Fates / Loomian Legacy / Pocket Mortys / Dokapon | ✖ | Não pesquisado (b). | — |
| 110 | "alchamy algumacoisa" → Aethermancer ou Potionomics | ◐ | Os dois candidatos existem e batem com o tema (linhas 96–97 e 107). Não é fato a conferir: continua pergunta ao dono. | ver linhas 96, 97, 107 |

### C.5 — §4: mobile de sucesso

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 111 | Monster Strike (2013): "um dos maiores faturamentos da história mobile" | ✔ | **Sensor Tower (primário de medição)**: passou de US$ 7,2 bi em 2018 e era o app de maior receita da história; a Wikipedia registra que o Honor of Kings o superou em 2020. | https://sensortower.com/blog/monster-strike-revenue · https://en.wikipedia.org/wiki/Monster_Strike |
| 112 | Monster Strike: estilingue, ricochete; co-op local de 4; partida de 1–3 min | ◐ | Estilingue/física ✔ (lançado 08/08/2013, Mixi). "Co-op local de 4" e "1–3 min" não confirmados (≈). | https://en.wikipedia.org/wiki/Monster_Strike |
| 113 | Puzzle & Dragons: match-3, cada cor ataca por um monstro, líder multiplica | ◐ | Confere: 5 s para arrastar; leader skill = multiplicador do time (2 fontes). | https://en.wikipedia.org/wiki/Puzzle_%26_Dragons · https://pad.fandom.com/wiki/Game_Mechanics |
| 114 | Summoners War: barra de turno (speed), runas, luta pode ser auto | ◐ | Confere (attack bar por Speed; runas; modo auto). | https://en.wikipedia.org/wiki/Summoners_War:_Sky_Arena · https://summonerswar.fandom.com/wiki/Attack_Bar |
| 115 | Dragon City / Monster Legends: turno simples, breeding por elementos | ◐ | Confere (2 fontes). "Combate é só vitrine" é opinião. | https://en.wikipedia.org/wiki/Dragon_City · https://monsterlegends.fandom.com/wiki/Breeding |
| 116 | Axie Infinity: cartas por parte do corpo | (≈) | Não confirmado. | — |
| 117 | Axie: "economia especulativa matou o jogo" | ◐ | 2022: SLP caiu ~98%, MAU de 2,7 mi para <400 mil; hack de US$ 620 mi; análise acadêmica de 2025 (3 fontes). "Matou" é forte: tem dezenas de milhares ativos em 2023–24. | https://www.coindesk.com/tech/2022/02/08/axie-infinity-reduces-slp-emissions-to-prevent-collapse · https://www.deconstructoroffun.com/blog/2022/6/17/axie-infinity-part-2-redemption-or-ruin · https://journals.sagepub.com/doi/10.1177/20539517251357296 |
| 118 | Neopets Battledome: turno com equipamento, 2 ações | ◐ | 2 itens por turno, até 8 equipados. | https://thedailyneopets.com/battledome/introduction-to-the-battledome · https://neopets.fandom.com/wiki/Battledome |
| 119 | Tamagotchi Uni: minigames, sem combate real; social por "Tama Verse" | ◐ | Wi-Fi, Tamaverse, 6 minigames ✔. **Atenção**: o Tamaverse inclui "Tama Arena"; que ela **não** seja combate não foi verificado (≈ para "sem combate"). | https://tamagotchi.fandom.com/wiki/Tamagotchi_Uni · https://www.gamespot.com/articles/the-tamagotchi-uni-reinvents-your-childhood-with-wi-fi/1100-6514872/ |
| 120 | Habitica: tarefa feita causa dano ao chefe; Daily perdida faz o chefe bater no grupo | ◐ | Confere e é pior que o corpo: o dano de Daily perdida atinge **todos os participantes**, não só quem faltou (wiki oficial + issue do repositório). | https://habitica.fandom.com/wiki/Quests · https://habitica.fandom.com/wiki/Boss · https://github.com/HabitRPG/habitica/issues/4831 |
| 121 | Finch: sem combate; cuidado basta | ◐ | Metas → energia → bicho vai em aventura; "no punishment for missing days". | https://finchcare.com/about-finch · https://www.bustle.com/wellness/finch-app-review-features-price |
| 122 | Forest: sem combate | ◐ | Sem combate ✔, **mas** a árvore **morre** se você sai do app (aversão à perda, sem luta) — contraexemplo útil, não é "sem punição". | https://en.wikipedia.org/wiki/Forest_(application) · https://techweez.com/2026/07/24/forest-productivity-app-review/ |

### C.6 — §5 e o "O que o Soulmon tem hoje" (leitura interna)

| # | Afirmação do corpo | Marca | Achado / correção | Fonte (acesso 30/09/2026) |
|---|---|---|---|---|
| 123 | §5.1 "Recurso épico 1× por luta" (Mega/Z/Dynamax/Tera, Soul Break, Soultimate, Medaforce, Fusão, ExE) | ◐ | **Generalização frouxa**: Z e Tera ✔ 1×; Soul Break gasta gauge (várias vezes); Soultimate/Medaforce carregam e repetem; ExE é **1× por dia**; a fusão do Cassette Beasts dura até desfazer ou acabar a luta. Padrão real = "recurso carregado que vira clímax", não "1×". | linhas 5, 46, 72, 78, 66, 91 |
| 124 | §5.5 "Lutas curtas (30–120 s) em tudo que é mobile de sucesso" | (≈) | Só o MH Now (75 s) está confirmado; o resto é generalização. | linha 22 |
| 125 | §5.7 "Co-op contra chefe com timer é o motor social mais forte" | ✖ | Sem fonte (b). Existe co-op (DQ Walk até 12; Habitica; raid), mas "mais forte" não é mensurável aqui. | linhas 24, 120 |
| 126 | §5.4 "força vem de fora da luta" (v-pet, Vital, GO, MR2) | ◐ | Confirmado caso a caso: cuidado/peso (DM), exercício (Vital), caminhada (Buddy), treino semanal (MR2). | linhas 19, 33, 40, 62 |
| 127 | Soulmon: Masmorra 5 andares (`MAX_FLOORS`), `TimingBar`, `PLAYER_STATS` | ✔ | Conferido no código em 30/09/2026: `MAX_FLOORS = 5` e `TimingBar` em `src/components/DungeonGame.tsx`; `PLAYER_STATS` está em `src/utils/dungeon.ts`. | `src/components/DungeonGame.tsx`, `src/utils/dungeon.ts` |
| 128 | Soulmon: Arena usa o motor de `utils/arena.ts`; anel de 17 elementos; PvP atrás de `BOND_PVP_MIN_LEVEL` | ✔ | `ArenaGame.tsx` importa o motor; `arena.ts` menciona os 17 elementos; `BOND_PVP_MIN_LEVEL = 5` em `src/utils/bond.ts`. | `src/components/ArenaGame.tsx`, `src/utils/arena.ts`, `src/utils/bond.ts` |
| 129 | Achado lateral: cabeçalho de `arena.ts` ainda diz "SEM CONSUMIDOR" | ✔ | Ainda vale em 30/09/2026 (cabeçalho intacto; `ArenaGame.tsx` importa o motor). **Continua sem corrigir** (fora do escopo desta edição). | `src/utils/arena.ts` |
| 130 | §6 "linhas vermelhas que filtram tudo" | ✔ | Conferidas contra `docs/manual/01-VISAO.md` §7: streak que zera (#1), contagem de tarefas (#16), Emblemas comprando vantagem (#4), Bits→Créditos (#3), "nunca métrica de outro jogador" (#21) existem. O texto do corpo cita corretamente. | `docs/manual/01-VISAO.md` |
| 131 | §6.2 ideia 2 e §6 "Vírus/Dado/Vacina vira triângulo de luta" | ✖ | **Desatualizado (a)**: em 29/09/2026 o dono reverteu esses rótulos (§14.5 do `REGISTRO-DE-DECISOES.md`; ver `CLAUDE.md`): hoje são **Poder / Harmonia / Benevolência** (`power`/`harmony`/`benevolence`) e a régua `branchRename.contract.test.ts` reprova os antigos. O corpo (do dia 29) cita o vocabulário velho. | `CLAUDE.md` (bloco "Os rótulos dos caminhos NÃO ficaram") |

### Resumo por marca

Linhas 1–131 (a linha 110 conta como ◐ — o item é uma pergunta em aberto, não um fato; a linha 131 é achado interno).

- **✔ verificado:** 7 (linhas 55, 96, 111 na web; 127–130 no código do repo)
- **◐ relato (Wikipedia, wiki, guia, review — 2 fontes quando dito):** 92
- **(≈) memória (continua não conferido):** 19
- **✖ não verificado / contradita:** 13 — **contraditas** (a fonte aberta diz outra coisa): 11, 15, 30, 43, 52, 88, 92, 95, 100, 131 (10); **sem fonte** (b): 21, 109, 125 (3).
- Total: 131 linhas. Várias linhas ◐ trazem sub-itens ainda (≈) dentro da nota (ex.: linhas 23, 35, 50, 71, 78, 89, 104, 106): a marca da linha vale para o núcleo verificado; o que ficou (≈) está dito na coluna "Achado".

### Correções ao corpo (para o dono ou o `benchmark-curador` decidir; o corpo NÃO foi editado)

1. **Colosseum** (§2.1) tem modo história; só o *Battle Mode* é "arena pura" (linha 11).
2. **GBL**: golpe rápido é por toque, não "automático" (linha 15).
3. **Pokéwalker** (§2.3): 3 opções (atacar/esquivar/capturar), não "2 golpes" (linha 30).
4. **Digimon World 1**: elogiar/ralhar mexe em disciplina/felicidade; **não** gasta recurso (linha 43). O "torcer que gasta recurso" vale, no máximo, para o Next Order (OP; linha 47, ainda ≈).
5. **Cyber Sleuth**: **9** elementos, não 10 (linha 52).
6. **MH Stories**: o terceiro jogo é de **13/03/2026**, não 2025 (linha 88).
7. **Cassette Beasts**: química de tipos gera *consequências*, não troca de tipo; AP "compartilhado" não confirmado (linhas 90, 92).
8. **Monster Sanctuary**: o combo enche com qualquer ação, não só acertos seguidos (linha 95).
9. **Temtem**: Hold = disponível só após N turnos em campo (linha 100). **Siralim**: 1200+ criaturas com 1 trait cada (linha 102).
10. **Habitica**: o dano da Daily perdida vai para o grupo **todo** — o contraexemplo é mais forte que o descrito (linha 120). **Forest**: também pune a saída (linha 122).
11. **§5.1**: "1× por luta" é frouxo; o padrão real é "recurso carregado que vira clímax" (linha 123).
12. **§6.2 ideia 2** usa vocabulário revertido em 29/09/2026 (linha 131) — ver Opção 2 abaixo.

### Opções propostas (nunca regra; filtradas por `docs/BENCHMARK-E-REFERENCIAS.md` §4.3 e `docs/manual/01-VISAO.md` §7)

Todas dependem do dono (`docs/PERGUNTAS-DO-DONO.md`) e de parecer da guarda de linha vermelha. Cada uma indica a evidência que a sustenta (linhas acima), o custo, o risco e a linha vermelha tocada.

1. **Ordem de ação visível na Arena, com escolha "cedo × forte"** — evidência: linhas 7 e 50 (Arceus e Cyber Sleuth mostram a ordem e trocam dano por posição). Custo: médio (UI da rodada + rebalancear `arena.test.ts`). Risco: subir a curva de leitura; a Arena já mostra 17 elementos. Linha vermelha: nenhuma cruzada.
2. **Triângulo curto com *tell* do inimigo, usando os três caminhos atuais (Poder / Harmonia / Benevolência)** — evidência: linhas 85–86 (Força > Técnica > Velocidade e o monstro que muda de tipo ao ficar furioso) e 51. Custo: médio-alto (copy + rebalanceamento + squad-narrativa). Risco: **não** reintroduzir Vírus/Dado/Vacina (linha 131; régua `branchRename.contract.test.ts`); os "tells" não podem soar como cobrança. Linha vermelha: nenhuma, desde que o rótulo seja o atual.
3. **"Torcer" na masmorra: o pet age sozinho e a `TimingBar` vira torcida no momento certo** — evidência: linhas 42, 45–47, 77 (parceiro autônomo + dono que intervém; Soultimate por minigame curto). Custo: baixo (copy + animação). Risco: **não** usar o verbo "ralhar" nem nada que gaste recurso do jogador (linha 43); ordens de DW1 dependiam de atributo. Linha vermelha: "nunca um cobrador" (essência) se houver bronca.
4. **Carga de preparo que enche com o gesto de cuidado do dia e é gasta no especial** — evidência: linhas 74 (Brave → HP), 78 (Soul Meter enche na luta), 72 (gauge que gasta unidades). Custo: médio. Risco: a carga **não pode sumir** como castigo; **não** pode ser contada por tarefas. Linhas vermelhas tocadas: #16 (contagem de tarefas) e "perda só sobre item recuperável".
5. **Modo de conversa/persuasão com o inimigo (alternativa opcional à luta)** — evidência: linhas 54, 81, 82 (Survive, SMT, Undertale) e 105 (Ooblets, combate sem dano). Custo: alto (arte, som — R-NOVA: nasce mudo — e texto sob as leis L1..L12). Risco: karma/morais que pesam na persuasão (linha 54) leriam como julgamento. Linha vermelha: L1/L3 da bíblia; nenhuma do manual.
6. **Fusão temporária por vínculo, com rede de segurança** — evidência: linhas 46 (ExE: exige vínculo máximo, 1× por dia, e pode disparar sozinho quando os dois caem em vez de perder) e 91 (fusão gated por relacionamento). Custo: alto; depende de `docs/PLANO-COOP.md` e da fatia 1. Risco: PI — o *conceito* é genérico, mas o nome não pode soletrar franquia; a "rede de segurança" casa com "perder combate não custa coração". Linha vermelha: #21 (métrica do outro) se houver fusão com amigo.
7. **Chefe semanal cooperativo sem culpa** (o oposto exato do Habitica) — evidência: linhas 24 (co-op de até 12 no Dragon Quest Walk) e 120 (o chefe do Habitica pune o grupo pela falha de um). Custo: alto; depende de save na nuvem confiável. Risco: pressão social. Linhas vermelhas: #19 (querer a notificação), #21; **vetada** qualquer variante em que a falta de um custe ao grupo.
8. **Duração-alvo curta para a run (referência de 75 s)** — evidência: linha 22 (única referência confirmada). Custo: baixo (informar, não impor). Risco: um cronômetro visível vira cobrança; usar só como alvo de desenho. Linha vermelha: nenhuma se não houver timer.

**Vetadas pelo filtro (não somem):** (a) chefe que pune o grupo pela falha (linha 120; essência + #21); (b) vida útil finita e morte do parceiro (linhas 44 e 62; "perda só sobre item recuperável"); (c) perda permanente/Nuzlocke e árvore que morre (linhas 101 e 122; mesma linha); (d) bronca que muda o estado do bicho (linha 43; "nunca um cobrador"); (e) gacha de poder por dinheiro — arma/runas (linhas 75 e 114; regra: **dinheiro nunca compra vantagem de combate**; Créditos pagam reroll, então "Créditos sem vantagem" era impreciso); (f) estamina que machuca ao esgotar (linha 98; contradiz "perder combate não custa coração").

### Fora de escopo desta conferência

- "Lição" de cada ficha (§2), §5 (padrões), §6 (o que significa) e "O que eu NÃO recomendaria": interpretação; não têm marca. A §5 foi conferida só nos fatos que ela usa (linhas 123–126).
- Não foram pesquisados: linha 12 (IV/EV/natureza), 76 (FF Tactics), 109 (cinco títulos), 116 (Axie por parte do corpo).
- Não foi editado nenhum outro arquivo; hub (`BENCHMARK-E-REFERENCIAS.md`) e MAPA ficam para o `benchmark-curador`.

### Parecer do guarda-linha-vermelha (30/09/2026)

Filtro aplicado às 8 opções acima contra `docs/manual/01-VISAO.md` §7 e a essência ("nunca um cobrador"). Resultado: **1 passa limpa, 7 passam com ressalva, nenhuma é vetada.** Ressalva = condição que tem de valer no desenho; se cair, a opção passa a vetada. Nada aqui vira regra sem o dono.

| # | Opção | Parecer | Ressalvas (o que tem de valer) |
|---|---|---|---|
| 1 | Ordem de ação visível na Arena, "cedo × forte" | Passa | Nenhuma. |
| 2 | Triângulo curto com tell do inimigo | Passa com ressalva | O tell é só gesto/animação, sem texto de cobrança; sem vantagem numérica paga. |
| 3 | "Torcer" na masmorra | Passa com ressalva | Errar ou não torcer não custa nada. |
| 4 | Carga de preparo por gesto de cuidado | Passa com ressalva (a mais frágil de desenho) | A carga nunca zera como castigo; não conta tarefas (#16); não vira número que desce; quem não cuidou luta igual. |
| 5 | Conversa/persuasão com o inimigo | Passa com ressalva | Sem karma/moral que pese; nasce muda (R-NOVA). |
| 6 | Fusão temporária por vínculo | Passa com ressalva | Vínculo sempre derivado (`bondLevelFor`); sem métrica do outro (#21); nome sem soletrar franquia; depende de coop/fatia 1. |
| 7 | Chefe semanal cooperativo sem culpa | Passa com ressalva (a mais arriscada) | Sem contribuição por membro visível; sem ranking (#21); não vira motivo de notificação (#19); a falta de um não custa nada ao grupo. |
| 8 | Duração-alvo curta (75 s) | Passa com ressalva | Só alvo de desenho, sem timer visível. |
