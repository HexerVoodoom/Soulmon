# Tabela de NPCs: personalidade, elemento, estágio e classe (beta12, B3)

Gerada de `src/data/npcFichas.ts` (dado versionado; a verdade é o arquivo). **Nada disto aparece ao jogador**: a ficha só se expressa na fala (decisão 3 do Oráculo, "a classe nunca aparece"). Decisão do dono (§F 5): papel e design de cada NPC definiram a ficha, aplicada sem pedir aprovação; **ajuste as linhas que quiser** (arquétipo, elementos, estágio, classe) e a fala acompanha.

Critérios: elementos são ids reais do class-system (20 base, pares, trios, quartetos; combinados valem); a classe é um dos 79 arquétipos do Oráculo cujas condições de elemento a ficha cumpre (conferido por teste); estágio: maioria Ultimate/Mega, poucos Ultra (Vesca, Hexsmith e Tessária são Ultra, por decisão do dono). **Tessária = Marcial + Vileza = o combinado "Serrilha"**, Ultra, classe Mestre de Armas, arquétipo direto.

Totais (90 fichas únicas): Ultra 7, Mega 26, Ultimate 54, Champion 3. Arquétipos usados: 7 de Soulmon + protetor, irônico, enigmático (só de NPC; ver `docs/design/PERSONALIDADE-BIG-FIVE.md`).

Falas: reescritas só nos NPCs principais (anfitriões, lotes, função, extras, novos; `areaNpcVoice.ts`) e nos convites dos prédios (`buildingIntroCopy.ts`), sem o enchimento "no seu tempo / se quiser / sem pressa" (régua em `npcFichas.contract.test.tsx`). A coluna "Fala" é a fala PT atual (ou o lore, para chefes). Resto do elenco (diálogos longos, missões, textos de tela) fica para lotes depois (§F 6).

| Chave | NPC | Papel | Personalidade | Elemento(s) | Estágio | Classe | Fala (PT) |
|---|---|---|---|---|---|---|---|
| `area:mercado` | Grom, o mercador | anfitrião de área | irônico | Ouro Vivo | Ultimate | Geomante | Entra aí e dá uma olhada. Tem de tudo nas prateleiras. |
| `area:arena`<br>= `lote:arena:torneio` | Vultrak, mestre da arena | anfitrião de área | direto | Marcial + Titã | Mega | Mestre de Armas | Chão antigo, mantido por costume. Sempre tem alguém aqui pra encarar. |
| `area:exploracao`<br>= `lote:exploracao:fenda` | Zeph, a guia | anfitrião de área | curioso | Ar + Aurora | Ultimate | Bardo | A névoa esconde caminhos. A Fenda tá logo ali. Bora descer? |
| `area:forja`<br>= `lote:forja:ferreiro` | Vitra, a Soulsmith | anfitrião de área | mentor | Forja + Fornalha | Mega | Forjador de Guerra | O forno tá aceso. O que se faz com cuidado pega a forma certa. |
| `area:jogos`<br>= `lote:jogos:salao` | Pipo, o anfitrião | anfitrião de área | brincalhão | Fada + Brinquedo de Corda | Ultimate | Feiticeiro de Cartas | Oba, visita! Bora brincar um pouco com seu Soulmon? |
| `area:laboratorio`<br>= `lote:laboratorio:evolucao` | Vesca, a alquimista | anfitrião de área | mentor | Maré + Essência | Ultra | Arquimago | Toda forma que ele já teve cresce nesta árvore. Vem ver pra onde os galhos vão. |
| `area:hall` | Lumi, a anfitriã | anfitrião de área | acolhedor | Santidade + Aurora | Ultimate | Santo Guardião | Todo Soulmon que já cruzou o seu caminho tem uma página aqui. |
| `lote:mercado:background` | Panora, a sonhadora | lote mercado:background | enigmático | Constelação | Ultimate | Astromante | Esse horizonte tem cheiro de chuva. Quer ver de perto? |
| `lote:mercado:itens` | Lamela, a mascate | lote mercado:itens | acolhedor | Druidismo | Ultimate | Mestre Encantador | Tudo o que cabe nos meus bolsos serve pra alguma coisa. Olha só. |
| `lote:mercado:decoracao` | Lasca, a marceneira | lote mercado:decoracao | calmo | Seiva | Ultimate | Verdejante | Cada peça daqui foi lixada à mão. Já pensou em qual canto ela fica? |
| `lote:mercado:conquistas` | Medra, o guardião dos marcos | lote mercado:conquistas | mentor | Fossilização + Tempo | Ultimate | Cronomante | Cada placa do meu casco lembra um trecho atravessado. |
| `lote:mercado:cambista` | Farthing, o cambista | lote mercado:cambista | irônico | Pacto | Ultimate | Escriba do Pacto | Minha balança pesa toda moeda igual. Os Créditos entram, os Bits saem, e a taxa é a mesma pra todo mundo. |
| `lote:mercado:restaurante` | Snapjaw, a chef carnívora | lote mercado:restaurante | animado | Queimada + Seiva | Ultimate | Mestre de Banquete | Mesa posta! Traga o que você colheu e eu transformo em prato. |
| `lote:arena:duelo` | Tessária, a gladiadora | lote arena:duelo | direto | Serrilha | Ultra | Mestre de Armas | Um duelo, uma rodada de cada vez. Pode vir. |
| `lote:arena:guerra` | Mirevesper, a quimera do brejo | lote arena:guerra | enigmático | Pântano + Sombra | Mega | Geomante | Eu vigio a roda dos clãs. Ela se abre quando o seu esquadrão chega junto. |
| `lote:hall:feira` | Fanfare | lote hall:feira | animado | Harmonia + Estampido | Ultimate | Menestrel | Toda semana algo chega da névoa. A roda chega até ele. |
| `lote:hall:guilda` | Aurea, a sacerdotisa do Salão | lote hall:guilda | protetor | Bravura + Chama Solar | Mega | Paladino | Algumas criaturas cuidam de um bosque juntas. Ele só cresce. |
| `lote:jogos:mente` | Tessela, a enigmista | lote jogos:mente | curioso | Fluxo | Ultimate | Mestre Encantador | Este quebra-cabeça espera. As peças não vão a lugar nenhum. |
| `lote:exploracao:dungeon` | Corva, a vigia do calabouço | lote exploracao:dungeon | protetor | Espectro + Sombra | Ultimate | Atirador Fantasma | Três caminhos a cada passo. Escolha um e veja até onde vocês chegam hoje. |
| `lote:exploracao:passeio` | Lisel, a mariposa do caminho | lote exploracao:passeio | calmo | Estratosfera | Ultimate | Astromante | A névoa abre um pouco mais a cada passo. Vem andando. |
| `lote:forja:hexsmith` | Hexsmith | lote forja:hexsmith | enigmático | Runa + Artifício | Ultra | Mestre das Runas | Traga suas poções de elemento. Eu forjo HEXes e reescrevo o código hex do seu Soulmon, Porta por Porta. |
| `lote:forja:refugio` | Yuzu, a guardiã da fonte | lote forja:refugio | acolhedor | Nascente + Vapor | Ultimate | Verdejante | A água tá morna. Entra, vai por mim. |
| `lote:forja:oficina` | Sépia, a copista | lote forja:oficina | calmo | Artifício | Ultimate | Mestre Encantador | Foco é copiar uma linha de cada vez. |
| `lote:forja:caderno` | Trilho, o maquinista dos croquis | lote forja:caderno | enigmático | Continuum + Relojoaria | Ultimate | Viajante Dimensional | Desenhei a paisagem que passou pela janela do trem. O caderno da Forja guarda. |
| `lote:laboratorio:pet` | Tinta, a escriba do Arquivo | lote laboratorio:pet | calmo | Erosão | Ultimate | Cronomante | Tudo o que você guardou está em ordem. Pode olhar. |
| `lote:laboratorio:stats` | Sumi, o guardião do Vínculo | lote laboratorio:stats | mentor | Maré + Correnteza | Mega | Alquimista | Cada dia fica anotado aqui. É só para olhar. |
| `lote:laboratorio:perfil` | Soulmon misterioso (o Corvo) | lote laboratorio:perfil | enigmático | Sombra + Ocultismo | Mega | Arquimago | Aqui se vê quem ele é, do jeito que ele é. |
| `lote:laboratorio:biblioteca` | Glifa, a arquivista | lote laboratorio:biblioteca | calmo | Runa | Ultimate | Mestre das Runas | Todo Soulmon que já cruzou o seu caminho tem uma página guardada aqui. |
| `lote:laboratorio:amigos` | Zumi, o filhote de mel | lote laboratorio:amigos | acolhedor | Coração | Champion | Verdejante | Cada um traz um pouco de doçura para o Círculo. |
| `funcao:onboarding` | Ambra | função | acolhedor | Ar + Aurora | Ultimate | Bardo | Tá tudo arrumado pra você. É só entrar. |
| `funcao:oraculo` | Iris | função | enigmático | Constelação + Eclipse | Ultra | Astromante | A luz se dobra com gentileza hoje. Dá uma olhada. |
| `funcao:cuidados` | Nuri | função | protetor | Nascente | Ultimate | Verdejante | Água fresca, cantinho limpo, tigela cheia. Simples assim. |
| `extra:forja` | Scoria | Forjadora de equipamentos | direto | Forja | Mega | Forjador de Guerra | A bigorna está quente. Traga qualquer coisa que valha guardar. |
| `extra:treino` | Kama | Mestra de combate do dojo | mentor | Maestria + Marcial | Mega | Mestre de Armas | Primeiro a postura. O golpe vem sozinho. |
| `extra:cacadora` | Sable | Caçadora de recompensas da Masmorra | irônico | Assassínio | Ultimate | Sombra Ambulante | Algo escapou das profundezas. Eu sei onde ele dorme. |
| `extra:guarda` | Bastia | Capitã da guarda | protetor | Bravura + Aço | Mega | Paladino | O portão aguenta. Descanse tranquilo aqui dentro. |
| `extra:feras` | Zahra | Guardiã das feras da Arena | acolhedor | Vitalidade | Ultimate | Senhor das Feras | Toda fera aqui escolheu ficar. Venha conhecer. |
| `extra:cura` | Salvia | Curandeira | acolhedor | Nascente + Santidade | Ultimate | Santo Guardião | Sente um pouco. A nascente faz o resto. |
| `extra:mercenaria` | Gila | Mercenária de expedição | direto | Ceifa | Ultimate | Cavaleiro da Morte | Qualquer estrada, qualquer fundura. Minha lâmina já está pronta. |
| `extra:navegadora` | Vela | Navegadora estelar do Passeio | curioso | Estratosfera + Cometa | Ultimate | Astromante | As estrelas mudaram esta noite. Desenhei um caminho novo pra você. |
| `extra:barda` | Trill | Barda da Feira | animado | Cântico | Ultimate | Menestrel | Mais uma canção antes das lanternas apagarem. |
| `extra:venenos` | Datura | Alquimista de venenos | irônico | Veneno | Ultimate | Toxicologista | Veneno ou cura. Tudo depende da dose. |
| `extra:arqueira` | Rime | Arqueira | calmo | Tempestade + Gelo | Ultimate | Olho da Tormenta | Daqui vejo o vale inteiro. Nada passa. |
| `extra:sacerdotisa` | Oriel | Sacerdotisa do Oráculo | enigmático | Éter + Alma | Mega | Arquimago | A maré trouxe um presságio. Dá uma olhada. |
| `extra:lua`<br>= `novo:luaTronoSentada`, `novo:luaTronoDePe` | Selene | Deusa da lua, das sombras e do pântano | enigmático | Crepúsculo + Eclipse | Ultra | Arquimago | A lua guarda tudo o que a noite esconde. Senta aqui que eu te conto. |
| `extra:ferreiro` | Mallo | Ferreiro e forjador de martelos | calmo | Aço + Forja | Mega | Forjador de Guerra | O martelo já aqueceu a minha mão. Traga o que precisa de forma. |
| `extra:ferreira` | Kova | Ferreira | direto | Têmpera + Aço | Mega | Mestre de Armas | Peça boa leva o tempo que leva. Eu espero junto. |
| `extra:arauto` | Tilin | Arauto do ranking | animado | Estrondo + Cadência | Ultimate | Menestrel | Os sinos tocam pra quem subiu neste mês. Vem ler o pergaminho. |
| `novo:alquimistaLimo`<br>= `novo:alquimistaLimoCostas` | Lodi | Alquimista de limo | curioso | Mutação | Ultimate | Corruptor | Tudo que escorre guarda uma receita. Chegue mais perto. |
| `novo:enfermeira` | Rubra | Enfermeira da Sombra | acolhedor | Parasita | Ultimate | Vampiro Espiritual | Senta aí. Eu cuido do que dói. |
| `novo:colheita` | Espiga | Guardiã da colheita | calmo | Florescer + Seiva | Ultimate | Verdejante | O que se planta com paciência volta em dobro. |
| `novo:tempo` | Clepsi | Guardião das horas | mentor | Cronomancia | Mega | Cronomante | O tempo é um rio. Hoje ele corre do seu lado. |
| `novo:musa`<br>= `lote:hall:grove` | Lilia, a musa do jardim | Musa do jardim | acolhedor | Seiva + Jardim Encantado | Ultimate | Verdejante | Até a pedra floresce quando alguém ouve a música. |
| `novo:ossarioFera`<br>= `novo:ossarioForma` | Ossel | Guardião do ossuário (forma de dragão) | enigmático | Ossuário + Sombra | Mega | Necromante | Tudo que cai vira raiz. Eu só guardo o caminho. |
| `novo:serpentePlumadaFera`<br>= `novo:serpentePlumadaForma` | Tzali | Serpente emplumada (forma de dragão) | enigmático | Ímpeto + Aurora | Mega | Bardo | O vento me conhece pelo nome. Quer ouvir o seu? |
| `novo:broto` | Faísca | Espírito dos elementos | animado | Fotossíntese + Queimada | Champion | Xamã Totêmico | Eu cresço com fogo, raio e chuva. Hoje deu os três! |
| `novo:corvo` | Corvino | Médico da neblina | mentor | Miasma + Alma | Ultimate | Necromante | A neblina some quando a lanterna fica acesa. Eu levo a minha. |
| `novo:cozinheiro` | Caldo | Cozinheiro do caldeirão | brincalhão | Fênix + Vapor | Ultimate | Mestre de Banquete | A sopa está no ponto. Pegue uma tigela, tem para todo mundo. |
| `novo:besouro` | Brio | Sentinela besouro | protetor | Aço + Carvalho | Ultimate | Mestre de Armas | Minha casca brilha mais depois da chuva. Eu fico de guarda. |
| `novo:sereiaPintora` | Maré, a sereia pintora | Sereia pintora | calmo | Maré + Prisma | Ultimate | Alquimista | Cada onda é uma tinta. Pinto o que o mar guardou para você. |
| `boss:arauto-do-fim` | Arauto do Fim | Chefe da Arena (final do Torneio) | enigmático | Juízo Final + Julgamento + Réquiem + Ocaso | Ultra | Inquisidor | Não ruge nem ataca primeiro: toca a trombeta uma vez, e a arena inteira sabe que a última rodada começou. |
| `boss:cinderhorn` | Cinderhorn | Guardião da Arena (preliminar do Torneio) | direto | Fervor + Lava + Brado | Ultimate | Lavamante | Crava as garras no chão três vezes antes de cada luta; só então a arena acende. |
| `boss:thrummer` | Thrummer | Guardião da Corrida (largada e obstáculos) | animado | Tempestade + Estampido + Ímpeto | Ultimate | Tempestário | Chega antes do próprio trovão e para na linha de chegada, esperando o barulho alcançá-la. |
| `boss:squallstride` | Squallstride | Chefe da Corrida (chefe do percurso) | brincalhão | Trovão + Furacão | Mega | Xamã Totêmico | Não corre na pista: é a pista que passa debaixo dele. |
| `boss:orbitant` | Orbitant | Chefe do andar 3 (câmara de gravidade) | calmo | Peso Descomunal + Asteroide | Ultimate | Senhor da Gravidade | O que é pequeno cai em órbita em volta dele; o que é grande, ele deixa passar. |
| `boss:mycelar` | Mycelar | Chefe do andar 4 (caverna úmida) | enigmático | Miasma + Parasita + Ossuário | Mega | Vampiro Espiritual | É uma criatura só por baixo da caverna inteira; o urso é só a parte que resolveu se levantar. |
| `boss:obsidarch` | Obsidarch | Chefe do andar 5 (último andar da masmorra) | protetor | Obsidiana + Titã + Galvanismo | Mega | Engenheiro Galvânico | Uma montanha de vidro escuro que só se move quando alguém chega ao fim. |
| `boss:bladeveil` | Bladeveil | Guardião do Duelo (mestre de esgrima) | irônico | Lâmina Viva + Espectro + Esgrima | Ultimate | Cavaleiro Dragão | Cumprimenta com a ponta da lâmina e devolve a primeira rodada, sempre. |
| `boss:sabrefin` | Sabrefin | Chefe do Duelo (campeão) | direto | Lâmina Oculta + Contratempo + Reflexo | Mega | Mestre de Armas | Nunca ataca primeiro; o golpe dela sempre chega um instante antes do seu. |
| `boss:glimmerswarm` | Glimmerswarm | Guardião da Feira (vitrine e multidão) | brincalhão | Alento + Fulgor | Ultimate | Bardo | Mil pontinhos de luz formam uma asa enorme e, no fim do dia, se dispersam devagar. |
| `boss:corallume` | Corallume | Guardião do Bestiário (vitrine aquática) | acolhedor | Maré + Sinfonia + Vitalidade | Mega | Alquimista | Um recife inteiro que respira junto; cada peixinho é uma voz de um coro muito antigo. |
| `boss:halorune` | Halorune | Guardião do Ateliê (biblioteca) | curioso | Runa + Ocultismo + Eco | Ultimate | Mestre das Runas | Um anel que lê em voz baixa tudo o que passa perto, e nunca repete em voz alta. |
| `boss:chorale` | Chorale | Chefe do Ateliê (constructo de cristal) | calmo | Cristal + Harmonia + Cântico | Mega | Menestrel | Toca sozinho a nota que faltava a quem entrou. |
| `boss:drifela` | Drifela | Guardião do Refúgio (piscina de repouso) | acolhedor | Nascente + Melodia Vital | Ultimate | Menestrel | Sobe e desce com a água do salão; as franjas acendem quando alguém passa por baixo. |
| `boss:hollowmere` | Hollowmere | Chefe do Refúgio (lago de repouso) | protetor | Florescer + Selva + Âncora Vital | Mega | Verdejante | Dorme de olhos abertos; o jardim nas costas só floresce quando o salão inteiro está em silêncio. |
| `boss:astrawing` | Astrawing | Guardião das Travessias (rota de migração) | curioso | Estratosfera + Constelação | Ultimate | Bardo | Migra todo ano pelo mesmo caminho e deixa, em cada parada, uma estrela pendurada. |
| `boss:nebulara` | Nebulara | Chefe das Travessias (raia-celeste) | enigmático | Nebulosa + Vazio | Mega | Astromante | A raia que nada pelo céu e deixa estrelas novas na esteira. |
| `boss:voltbloom` | Voltbloom | Guardião do Laboratório (estufa) | animado | Sinapse + Bosque | Ultimate | Xamã Totêmico | Uma flor que cresceu em volta de uma bobina e nunca soube qual das duas veio primeiro. |
| `boss:graftfang` | Graftfang | Chefe do Laboratório (câmara de mutação) | irônico | Mutação + Galvanismo + Vitalidade | Mega | Corruptor | Cada parte veio de um bicho diferente; foi ele quem decidiu que agora são uma só. |
| `boss:duskveil` | Duskveil | Guardião dos Sonhos (limiar) | calmo | Crepúsculo + Sussurro + Espectro | Ultimate | Atirador Fantasma | Um manto sem dono que carrega uma única lanterna e nunca a apaga. |
| `boss:dawnloom` | Dawnloom | Guardião dos Sonhos (amanhecer) | acolhedor | Aurora + Santidade | Ultimate | Santo Guardião | Tece o amanhecer em fios; o que sobra fica pendurado no teto. |
| `boss:aeonyx` | Aeonyx | Chefe dos Sonhos (sonho lendário) | enigmático | Éon + Entropia + Continuum | Ultra | Cronomante | A areia cai das rachaduras e volta a subir; ele nunca acaba, só muda de lado. |
| `boss:tallyjack` | Tallyjack | Guardião do Mercado (balcão) | irônico | Ouro Vivo + Magnetismo | Ultimate | Geomante | Conta cada peça duas vezes e, no fim, devolve o troco em sorriso. |
| `boss:cuprex` | Cuprex | Chefe do Mercado (golem-mercador) | protetor | Aço + Núcleo + Titã | Mega | Berserker | Um titã de cobre velho; a pátina verde é a única coisa que ele deixa alguém tocar. |
| `torneio:npc-espina` | Espina | desafiante do Torneio (treino) | direto | Espinheiro | Ultimate | Demonologista |  |
| `torneio:npc-quartzo` | Quartzo | desafiante do Torneio (treino) | calmo | Cristal | Ultimate | Geomante |  |
| `torneio:npc-mare` | Maré, a desafiante | desafiante do Torneio (treino) | brincalhão | Maré + Correnteza | Ultimate | Alquimista |  |
| `biblioteca:npc-pyraka` | Kaelen (jogador de teste) | jogador de teste da Biblioteca | animado | Fervor | Champion | Berserker |  |
| `biblioteca:npc-orrin` | Orrin (jogador de teste) | jogador de teste da Biblioteca | mentor | Éter + Ocultismo | Ultimate | Arquimago |  |
| `biblioteca:npc-thalindra` | Thalindra (jogadora de teste) | jogador de teste da Biblioteca | acolhedor | Santidade | Mega | Santo Guardião |  |
