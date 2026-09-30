# Parecer — monster taming designer — Missões de Expedição (mapa do Passeio)

Revisor: soulmon-monster-taming-designer
Data: 30/09/2026
Escopo: [`PROPOSTA-MISSOES-EXPLORACAO.md`](../../PROPOSTA-MISSOES-EXPLORACAO.md). Olho o encaixe com o mapa de regiões (e os biomas, EXP-7), com o Bestiário, o companheiro, o vínculo (`src/utils/bond.ts`) e o nome, e pergunto se "abrir regiões" funciona como progressão de gênero. **Fica de fora:** psicologia, linha vermelha de conteúdo (M9), custo de engenharia e copy final.

**Limite deste parecer.** O Soulmon não é tratamento. Todo efeito citado aqui é previsão de design, e nenhum foi medido: ninguém usou o app em produção. "O gênero ensina X" fala de OUTROS produtos. Marcas de fonte: **✔** fonte primária aberta nesta rodada · **◐** wiki, review ou resumo de busca · **(≈)** de memória, sem conferir, e por isso não sustenta decisão.

Legenda: **VETO** (bloqueia) / **AJUSTE OBRIGATÓRIO** (condição de aceite) / **SUGESTÃO** (opcional). As condições deste parecer são R-1..R-n. A numeração recomeça aqui e não continua a da rodada de Exploração.

---

## 0. O que o código e a bíblia dizem (conferido por leitura)

1. **A bíblia já dá sentido a "Missões", e é justamente o desta proposta.** `NARRATIVA-E-UNIVERSO.md` §10 traduz "Missões (`missions.ts`, `weeklyMissions.ts`)" como *"Trechos do mundo que abrem quando se anda"*. A frase vetada ao lado é "Última chance; contagem de tarefas". Ou seja, a ideia de "região que abre" não é estranha ao mundo: ela está escrita lá. O problema é o **nome na interface**: "Missões" já é a aba da loja (`MISSIONS`, 6 objetivos → cenários `bg-mission-*`), e as semanais pagam Emblemas.
2. **"Expedição", a palavra que a proposta sugere, também já está ocupada na bíblia.** L5 (§2) usa "a expedição" como exemplo de **perda permitida** (coisa recuperável, apostada de propósito). §6.7 diz que as nove linhas são "o que o jogador encontra em expedição", e ali expedição significa descer na fenda (Masmorra). Um desafio de vida real que não tem perda nenhuma, batizado com a palavra que a bíblia reserva para "aposta com perda", confunde as duas coisas. Ver R-10.
3. **O mundo proíbe permissão por mérito.** §7.2: *"nenhum [reino] é prêmio"*. §9: *"Não existe entidade que conceda ou retire por mérito. Nada é permissão."* Uma região que "se abre quando a pessoa cumpre um desafio" corre o risco exato de ler como prêmio concedido. A frase-tese da proposta já aponta a saída: *"O pet vai aonde a pessoa foi"*. Nessa leitura, a região abre porque há **correspondência**, não porque alguém aprovou alguém (§9, "Não há autoridade: há encaixe").
4. **A Aventura da noite tem uma regra que a proposta fura.** `adventure.ts`, regra 4: *"O DIA MEXE NA CHANCE, NUNCA NO ACESSO… Não existe achado que só quem teve um dia bom possa ver."* Um achado que "vem da região" só existe para quem abriu a região. Isso é acesso condicionado a um ato da vida real. Não é o "dia bom" que a regra citava, mas é da mesma família. Ver R-2.
5. **O Vínculo não pode ganhar fonte nova.** O cabeçalho de `bond.ts` diz *"A trilha NÃO pode pedir nenhuma ação nova… Não existe evento aqui que só exista para alimentar o Vínculo"*. `BondEvent` tem 11 tipos, e nenhum é de missão. O nível é derivado e nunca persistido (invariante 4).
6. **O reino do pet NÃO está no save.** O reino sai da leitura do Oráculo (`soulProfile/axes.ts`). O perfil mora no `localStorage` (`STORAGE_KEYS.SOULMON_PROFILE`; `GameStateContext.tsx` › `onboardingTimeZone` confirma que ele fica só no aparelho). Quem joga com personagem pronto (demo) ou pulou o caminho pago não tem `soulProfile`. Qualquer regra do tipo "a região de casa é o reino do pet" precisa de fonte no save.
7. **Já existe arte de cenário para seis dos oito reinos, e ela está na loja, não nas 13 cenas.** Em `src/utils/backgrounds.ts`: `bg-desert` (Deserto Pixel), `bg-forest` (Floresta Nativa), `bg-ocean` (Fundo do Mar), `bg-snow` (Terra Gelada), `bg-swamp` (Pântano Fosforescente) e `bg-cloudsea` (Mar de Nuvens, "cume acima das nuvens"), que casa com `picos`. `cavernas` só tem cena de fenda (Gruta Azul, Caverna Verde, em `SPIRIT_BG_SCENES`). `campina` não tem arte clara. Duas colisões: `bg-forest` é recompensa do Vínculo no nível 4 (`bond-4-forest`), e os cenários da loja são vendidos em Bits. Não conferi o estilo visual deles (pixel, gradiente ou pintado) para saber se formam uma família coerente.
8. **As 13 `SPIRIT_BG_SCENES` continuam não sendo bioma** (parecer anterior, `2026-09-30-exploracao/03-monster-taming.md` §2 e R-3). Nada mudou aqui.

## 1. O que o gênero ensina (fontes)

| Referência | Mecanismo | Lição para esta proposta | Marca |
|---|---|---|---|
| **Pokémon GO: Special Research** | Linha de missões em passos, e a Special Research **não tem prazo**: fica na conta até ser concluída (a Timed Research, ao contrário, expira) | Precedente direto de M2: missão narrativa sem relógio existe e funciona no gênero. O que o GO **não** transplanta é o gatilho por sensor (passos, captura) | ◐ ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Special_Research), [One More Catch](https://www.onemorecatch.site/pokemon-go-precious-paths-special-research-quest-steps/), via resumo de busca) |
| **Duolingo: desafio mensal e Friends Quest** | O distintivo do mês só pode ser ganho uma vez: quem não bate a meta até o fim do mês perde. A Friends Quest dura cerca de 4 a 5 dias | O **contraexemplo** de M2: missão com prazo e prêmio que some. A proposta faz certo em recusar | ◐ ([duoplanet](https://duoplanet.com/duolingo-challenges/), [duoplanet FQ](https://duoplanet.com/duolingo-friends-quest/)) |
| **SuperBetter** | "Epic win" (meta), quests diárias, "power-ups", "bad guys", aliado. Tudo **autodeclarado** | Precedente de M3 (declarar basta) e de desafio de vida real enquadrado como jogo. Atenção: ali quem escolhe e escreve o desafio é a pessoa, e aqui a região propõe três | ◐ ([Zendesk SuperBetter](https://superbetter.zendesk.com/hc/en-us/articles/13566227442075-What-is-a-Challenge), [rtor.org](https://www.rtor.org/2017/02/28/superbetter/)) |
| **Habitica: quests de chefe** | Tarefas cumpridas causam dano no chefe. Dailies perdidas machucam **o grupo inteiro**, e o próprio jogador leva o dano duas vezes | O contraexemplo de missão que pune a falha e cria cobrança social. A proposta recusa isso com M2 e M6, e está certa | ◐ ([Habitica wiki, Boss](https://habitica.fandom.com/wiki/Boss)) |
| **Finch** | Tarefas cumpridas enchem a energia do pássaro, que sai em aventura. Com o tempo ele "viaja para outros países" e explora lugares novos | O parente mais próximo de "o mundo do pet cresce com a vida real". O gatilho no Finch é a energia do dia, não um desafio escolhido | ◐ ([screensdesign](https://screensdesign.com/showcase/finch-self-care-pet), [whistleout](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review)). A mecânica-base foi ✔ na rodada anterior ([finchcare.com](https://finchcare.com/about-finch)) |
| **Zombies, Run!** | Missões de história ligadas a correr de verdade, em temporadas, em ordem cronológica. No modelo gratuito libera-se uma missão por semana | Mapa e história que avançam por um ato real funcionam como gênero. Mas a ordem fixa e o sensor (a corrida) são justamente o que o Soulmon não tem | ◐ ([Wikipedia](https://en.wikipedia.org/wiki/Zombies,_Run!), [blog oficial](https://blog.zombiesrungame.com/2015/05/14/the-all-new-zombies-run-is-out-now-and/)) |
| **Pikmin Bloom** | Recursos liberados por nível (expedições no nível 3 ou 6, desafios no 15). Expedição por caminhada, em tempo real | O "mapa que abre" dele é **por nível e por passos**, as duas coisas que o Soulmon descarta. Só a forma (postal) serve | ◐ ([Pikipedia](https://www.pikminwiki.com/Expedition), [gamerant](https://gamerant.com/pikmin-bloom-how-to-do-challenges-mushrooms/)) |
| **Digimon World 1** | Recrutar criaturas para File City abre atalhos e caminhos para áreas novas. Algumas passagens pedem a criatura em champion ou acima | **O modelo clássico do gênero para "o mapa se abre":** a região abre pelo que você **fez no mundo**, e a abertura muda o que o parceiro pode fazer. Serve como prova de que a progressão por regiões é nativa do monster taming. O gate por estágio evolutivo é o que **não** pode vir (M4) | ◐ ([wiki DW1](https://digimon-world-psx.fandom.com/wiki/Digimon_recruitment), [almarsguides](https://almarsguides.com/retro/walkthroughs/PS1/Games/DigimonWorld/FullPlaythrough/Chapter1/)) |
| Metroid, Zelda e mapas que se revelam | A região abre por capacidade adquirida, e a névoa do mapa mostra o que falta | A névoa é lacuna visível por natureza (ver M10) | (≈) |

**Síntese de gênero.**
- **A progressão por regiões funciona.** DW1, Zombies Run e o crescimento de mundo do Finch mostram que "o mundo do meu parceiro cresce quando eu ajo" é um motor legítimo de antecipação, que é o motor do gênero.
- **A diferença do Soulmon é dupla, e as duas partes precisam ser sustentadas juntas.** (a) Nos jogos, a região abre por **capacidade** e traz **jogabilidade**. Aqui ela abre por um **ato escolhido** e traz só **narrativa**. (b) Nos jogos, o mapa acaba, e acabar é bom. Aqui, um mapa que acaba mata a mecânica.
- **As referências vivas se dividem em dois grupos.** De um lado, o que não tem prazo (Special Research, SuperBetter). Do outro, o que tem prazo ou pune (Duolingo mensal, Habitica). A proposta está do lado certo.

---

## 2. Veredito geral

**APROVADO COM RESSALVA.**

A ideia tem a coisa mais rara num plano de Camada 3: ela **dá destino à Aventura sem criar um segundo sistema de "pet sai e traz"** (atende a R-1 da rodada anterior), e a bíblia já a abriga (§10, "trechos do mundo que abrem quando se anda"). Como gênero, "o mundo do parceiro cresce quando eu ajo" é nativo do monster taming (DW1) e do pet de autocuidado (Finch).

Três coisas impedem aprovação limpa:

1. **O furo na regra 4 da Aventura** (acesso a achado condicionado a um ato), que exige decisão explícita do dono (R-2).
2. **A hierarquia entre reinos.** "Regiões mais distantes propõem desafios maiores" transforma reino em escada de dificuldade, contra *"nenhum é prêmio"* (§7.2). Ver R-3.
3. **O fim do mapa.** Oito reinos acabam, e a proposta não diz o que acontece depois (R-6).

O nome também precisa sair de "Expedição" (R-10).

## 3. Veredito por regra (M1..M12)

| Regra | Veredito | Motivo (lente de gênero) |
|---|---|---|
| **M1** opt-in, 3 desafios determinísticos por região | **APROVADO COM RESSALVA** | Determinismo por região repete a regra 3 da Aventura (reabrir não re-sorteia). Ressalva: os 3 têm que vir de **áreas diferentes** (§4 da proposta). Senão uma região "de Social" fica trancada para quem não tem essa área na vida, e a região vira filtro de perfil (R-4) |
| **M2** uma ativa, sem prazo, trocar sem custo | **APROVADO** | Tem precedente na Special Research do GO (sem prazo, ◐) e é o oposto do distintivo mensal do Duolingo (◐) |
| **M3** autodeclaração | **APROVADO COM RESSALVA** | SuperBetter (◐) sustenta. Não há competição no gênero aqui que exija prova. Ressalva: como é autodeclarado, **não pode alimentar nada que se some**: nem Vínculo (R-5), nem ranking, nem faixa |
| **M4** recompensa só no mapa | **APROVADO COM RESSALVA** | Correto não tocar em evolução nem atributo. É o que separa isto do gate por estágio do DW1. Ressalvas: o "achado da região" esbarra na regra 4 da Aventura (R-2), e "região como recompensa" esbarra em §7.2 e §9 (R-3) |
| **M5** nada de quantidade | **APROVADO** | Coerente com `weeklyMissions.ts` ("nenhuma premia contagem de tarefas") e com o veto da §10 |
| **M6** nunca é condição | **APROVADO** | É o anti-Habitica |
| **M7** nenhum push, badge ou widget; o pet não pergunta | **APROVADO COM RESSALVA** | Acréscimo: o estado "passeando" do palco (EXP-2) só existe **depois** do "Fiz", nunca como lembrete da Expedição pendente. Um pet que "fica esperando para ir" seria cobrança muda (R-7) |
| **M8** versão pequena conta igual | **APROVADO** | Mesma lógica de `needsIntervention` (a versão reduzida conta como feita) |
| **M9** filtro de conteúdo | fora da lente | Linha vermelha |
| **M10** sem percentual nem "faltam N"; névoa sem número | **APROVADO COM RESSALVA** | Oito regiões em névoa **já são** uma contagem visual (5 abertas, 3 na névoa). O gênero aceita isso: a silhueta do Bestiário é o precedente interno, e o parecer anterior aceitou. A ressalva é que não pode haver estado de "mapa completo", cerimônia de 100% ou barra, e as névoas precisam ser **iguais entre si**, sem "a próxima" destacada (R-3, R-6) |
| **M11** nasce muda, EN primeiro, L1..L12 | fora da lente, com nota | O nome é da lente (R-10). Nota para a `squad-narrativa`: pela L11, o pet pode **relatar onde foi** ("fui até o gelo"), nunca **avaliar o ato** da pessoa ("tenho orgulho do que você fez") |
| **M12** não duplica o subir de nível nem a assombrada | **APROVADO** | Certo em tratar "o próximo nível" como prova de uma vez, sem trocar o nível do hábito |

## 4. Encaixes

**Mapa e biomas (EXP-7).**
- Os destinos são os **oito reinos** da §7.2. `akasha` fica fora: *"Não se visita akasha e não se traz nada de lá"* (§7.2.1).
- A arte de seis reinos pode vir dos cenários da loja (§0.7), como ilustração do mapa. Isso é melhor que as `SPIRIT_BG_SCENES`, que são fenda.
- `cavernas` pode usar a Gruta Azul ou a Caverna Verde: é gruta, e a §7.2 diz "fagulha como única fonte".
- `campina` pede arte (ou `bg-guild-clareira`, que não conferi).
- **Emprestar a imagem não é dar o cenário** (R-8).

**Bestiário.** Nenhuma ligação. As nove linhas são fauna de fenda (§6.7), e o registro cataloga padrões (§5.11). Não se "encontra Nautil no oceano". Se uma região citar uma linha, é como textura ("aqui assenta bem o que muda de forma"), nunca como encontro, contagem ou silhueta nova (R-9).

**Companheiro.** O pet que viaja é **o** pet. O companheiro da Ficha (`ficha/companheiro.ts`, fixo, criado uma vez) não aparece nas regiões nem é "achado" lá. Senão reabre a porta do segundo pet (R-9).

**Vínculo.** Nenhum `BondEvent` novo. Três razões: o cabeçalho de `bond.ts` proíbe evento que só exista para alimentar o Vínculo; a declaração é autodeclarada e por isso farmável; e o Vínculo é "tempo de convívio", não desempenho (R-5).

**Nome.**
- "Missões" está ocupado na loja.
- "Expedição" colide com L5 e §6.7 (§0.2).
- "Quest" e "Desafio" soam como tarefa.

Minha sugestão para a `squad-narrativa` decidir, EN primeiro: **Crossing / Travessia**. O pet atravessa para um reino novo, e a pessoa atravessa para fora da rotina. A palavra não carrega perda nem ordem, e não está na bíblia. Segunda opção: **Invitation / Convite** (do reino), coerente com M11 ("o texto convida, nunca manda"). Não verifiquei colisão de marca de nenhuma das duas.

## 5. Condições

- **R-1 (AJUSTE OBRIGATÓRIO — bloqueante).** Um relato por noite. Abrir uma região **não cria um segundo relato**: o achado daquela noite é o da Aventura, só que vindo da região nova. Critério: um único `AdventureEntry` por `dayKey`, e o `AdventureDiary` continua sendo o único álbum, com um campo novo de reino (herda R-1 e R-7 da rodada anterior).
- **R-2 (AJUSTE OBRIGATÓRIO — bloqueante; decisão do dono).** A proposta declara explicitamente que cria uma **exceção à regra 4 de `adventure.ts`**: as cenas de uma região só entram no sorteio de quem abriu a região. Precisa registrar a exceção no `REGISTRO-DE-DECISOES.md`, com o motivo: o acesso vem de um ato **escolhido, sem prazo e sem falha**, não do desempenho do dia. A regra 4 original continua valendo dentro de cada região (o dia mexe na chance, nunca no acesso). A alternativa, que é as cenas regionais aparecerem raramente para todos, esvazia o sentido de abrir. Não recomendo, mas ela precisa estar escrita como a opção que perdeu.
- **R-3 (AJUSTE OBRIGATÓRIO — bloqueante).** Sem escada entre reinos.
  - Sai da proposta a frase *"regiões mais distantes propõem desafios maiores"*.
  - Toda região oferece versão plena e versão pequena, e **quem levanta a barra é a pessoa** (isso já está em §1, terceiro item).
  - Ordem **livre**: todas as névoas iguais, sem "a próxima" destacada, sem trilha linear desenhada.
  - Motivo: §7.2 ("nenhum é prêmio"), §9 ("nada é permissão"), e o fato de que o pet **tem** um reino de origem. Uma escada põe o reino dele como "fácil" ou "difícil".
- **R-4 (AJUSTE OBRIGATÓRIO).** Os 3 desafios de cada região vêm de **3 áreas diferentes** (§4 da proposta). O clima do reino colore a copy, e a área não fica presa ao reino. Critério: nenhuma região exige uma área específica para abrir.
- **R-5 (AJUSTE OBRIGATÓRIO).** A Expedição não gera `BondEvent`, XP, faixa nem título. Um teste no padrão de `bond.ts` trava isso: marcar "Fiz" não altera `totalXP`.
- **R-6 (AJUSTE OBRIGATÓRIO).** Depois do mapa, a mecânica **não acaba e não celebra 100%**.
  - Região aberta continua oferecendo os próximos 3 desafios do pool dela (determinísticos).
  - Cada nova travessia a uma região já aberta traz uma cena ainda não vista daquela região. Quando as cenas acabam, repete, no mesmo padrão de `rollAdventure`.
  - Não existe tela de "mapa completo".
- **R-7 (AJUSTE OBRIGATÓRIO).** O "passeando" diegético (EXP-2) só aparece **depois** do "Fiz" e só na noite da ida. A Expedição pendente não muda nada no palco, na pose nem na fala do pet.
- **R-8 (AJUSTE OBRIGATÓRIO).** Abrir uma região **não concede** o cenário do reino (`bg-desert`, `bg-forest` etc.). Esses cenários são vendidos em Bits, e `bg-forest` é recompensa do Vínculo 4. A arte entra no mapa como ilustração, não no inventário. Se o dono quiser o contrário, é reversão de M4 e fica registrada.
- **R-9 (AJUSTE OBRIGATÓRIO).**
  - Nenhuma região entrega, mostra como "encontrada" ou registra no Bestiário uma criatura, seja das nove linhas, do pool do Oráculo ou o companheiro da Ficha.
  - Não se usa "capturar", "domar" nem "encontrei um X" (§5.11, e R-9/R-14 da rodada anterior).
- **R-10 (AJUSTE OBRIGATÓRIO).** O nome de interface não é "Missões" (colide com a loja) nem "Expedição" (colide com L5 e §6.7). A decisão é da `squad-narrativa`, EN primeiro. Sugestões: Crossing/Travessia ou Invitation/Convite.
- **R-11 (AJUSTE OBRIGATÓRIO).** A **região de casa** (aberta desde o início, sem desafio) é:
  - o reino do pet, **se ele estiver no save**;
  - senão, `campina` ("clima neutro e generoso"), igual para todo jogador demo e para quem não tem `soulProfile`.
  Ler o reino do `localStorage` faria dois aparelhos discordarem do mapa (footgun 9 e a família do `playerDay`).
- **R-12 (SUGESTÃO).** Cena de **chegada** fixa por região: a primeira noite numa região nova traz sempre a mesma cena de chegada, sem sorteio. A chegada vira um marco reconhecível ("esse foi quando ele chegou no gelo"), no espírito da regra "mantém a data da PRIMEIRA vez" de `collectAdventure`.
- **R-13 (SUGESTÃO).** As 24 cenas atuais do `ADVENTURE_CATALOG` não têm lugar (campo, riacho, vale). Declarar que elas pertencem à região de casa, ou a "nenhum reino", para que o save antigo não precise de migração.

## 6. Sugestão de estrutura

| Pergunta | Recomendação | Por quê |
|---|---|---|
| Quantas regiões? | **8 reinos** (`akasha` fora). 1 de casa aberta desde o início + **7 que se abrem** | É a geografia que a bíblia já tem (§7.2), e tem arte parcial (§0.7). No ritmo de uma travessia por semana, 7 regiões dão cerca de 2 meses de abertura, e R-6 cuida do que vem depois |
| Ordem fixa ou livre? | **Livre** | R-3: não existe reino mais longe nem melhor. Zombies Run tem ordem fixa porque é uma história seriada, e aqui não há roteiro sequencial para proteger |
| O que abre? | A região no mapa (sai a névoa) + a cena de chegada (R-12) + as cenas dela entram no sorteio da Aventura | O mundo do pet cresce em **variedade de cena**, que é a recompensa que "não satura" (a tese do `adventure.ts`) |
| O que o pet traz de cada região? | Uma **cena em 1ª pessoa**, da região, no `AdventureDiary`, com o reino marcado. Nada material: sem cenário, decoração, Bits ou XP | M4, R-5, R-8, e a decisão de 08/09 |
| Quantas cenas por região? | 4 a 6 por reino (uma de chegada + 3 a 5 de revisita), escritas a partir da coluna "O que um viajante veria" da §7.2 | O suficiente para R-6 não repetir cedo demais. É conteúdo da `squad-narrativa` |
| E o clima do reino? | Dá **tom** aos desafios sem prender a área. Exemplos para a `squad-narrativa` avaliar: `gelo` ("tudo como assentou") ↔ retomar um contato antigo; `cavernas` ("o que brilha por si") ↔ tempo sem tela; `floresta` ("crescimento por acréscimo") ↔ o próximo nível de um hábito; `campina` ("muita companhia") ↔ social; `pantano` ("tolera ficar inacabado") ↔ criar algo sem terminar | Casa cada reino com o sentido que a bíblia já deu a ele. **Nunca** um reino = uma área só (R-4) |

## 7. Perguntas ao dono (sugestão de redação para MIS-n)

1. **Exceção à regra 4 da Aventura** (R-2): as cenas de uma região ficam só para quem a abriu? *Recomendo sim, registrado.* Gatilho de revisão: se aparecer relato de "sinto que perco cenas por não fazer desafios".
2. **Ordem livre ou fixa?** *Recomendo livre, sem escada de dificuldade* (R-3).
3. **Região de casa:** o reino do pet (o que exige gravar o reino no save) ou `campina` para todos? *Recomendo o reino do pet quando existir no save, com `campina` como padrão* (R-11).
4. **Nome de interface:** Crossing/Travessia, Invitation/Convite, ou outro da `squad-narrativa`? (R-10)
5. **Depois do mapa aberto:** as regiões continuam convidando (R-6) ou a mecânica encerra? *Recomendo que continuem, sem estado de "completo".*
6. **Abrir uma região dá o cenário do reino?** *Recomendo não* (R-8). Se sim, é reversão de M4 e colide com a loja e com `bond-4-forest`.

## 8. Tabela-resumo

| Item | Veredito | Bloqueante |
|---|---|---|
| Proposta geral | APROVADO COM RESSALVA | R-1 (um relato por noite), R-2 (exceção à regra 4, decisão do dono), R-3 (sem escada entre reinos, ordem livre) |
| M1, M3, M4, M7, M10 | APROVADO COM RESSALVA | R-4, R-5, R-2/R-3, R-7, R-3/R-6 |
| M2, M5, M6, M8, M12 | APROVADO | — |
| M9, M11 | fora da lente | nome em R-10 |

## 9. O que NÃO consegui verificar

- O estilo visual dos seis cenários da loja (pixel, gradiente ou pintado), para saber se formam uma família de mapa. Li só o `backgrounds.ts`, não as imagens. Também não conferi `bg-guild-clareira` para `campina`.
- Todas as referências de gênero são ◐ (resumos de busca, wikis de fã, reviews). Nenhuma página oficial foi aberta nesta rodada. A "viagem a outros países" do Finch vem de review, não de fonte oficial.
- Se o reino calculado pelo Oráculo já tem algum caminho para o save (li só `GameStateContext.tsx` › `onboardingTimeZone` e procurei `realm`/`reino` em `src/types` e no contexto, sem resultado).
- Colisão de marca de "Crossing" ou "Invitation" em apps do segmento: não pesquisei.
- Nenhuma medição de efeito: ninguém usou o app em produção.
