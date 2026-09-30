# Parecer — monster taming designer — Exploração (Passeio, Diário de Campo, Escavação)

Revisor: soulmon-monster-taming-designer
Data: 30/09/2026
Escopo: encaixe das três ideias finalistas com o Bestiário (`bestiary`, `enemyKey`), com o companheiro (o pet único e o "companheiro" do Oráculo) e com o vínculo (`bondLevelFor`). Lente de gênero (monster taming, v-pet, pets passivos). Não avalia psicologia, PI, arte final nem custo de engenharia.

**Declaração de limite.** Este parecer não faz diagnóstico; o Soulmon não é tratamento. Efeito esperado é previsão de design, não medição. Ninguém usou o app em produção: não há telemetria, e "o gênero ensina X" é evidência de OUTROS produtos, não deste. Onde o argumento vem de memória, vai marcado (≈).

Legenda: **VETO** (bloqueia) / **AJUSTE OBRIGATÓRIO** (condição de aceite) / **SUGESTÃO** (opcional). Condições numeradas R-n.

---

## 0. O que o código e a bíblia dizem (verificado por leitura)

1. **Existem DOIS "bestiários" com o mesmo nome.** (a) O runtime, `bestiary` no save, chave `linha-tier` de `enemyKey`: 36 artes possíveis (9 linhas × 4 tiers de arte), aba Estatísticas, silhueta para o que não apareceu, contagem de coleção, nunca percentual nem "faltam N" (CLAUDE.md, linha da Masmorra; `NARRATIVA-E-UNIVERSO.md` §10: "registro de padrões, não de indivíduos"). (b) O pool do Oráculo (`soulProfile/bestiary/pool.json`, 630 criaturas segundo o doc de regras), que é inspiração de geração e não álbum. Qualquer texto da proposta que diga "Bestiário" precisa dizer qual.
2. **O pet é um só, e é derivado, não capturado.** A tese e a rec. 13 de `guia-experiencia/04-monster-taming.md` ("nunca permitir segundo pet simultâneo; se um dia houver coleção, que seja de FORMAS vividas e sonhos") continuam de pé. `bondLevel` NÃO é persistido (invariante 4 de `bond.ts`, `NARRATIVA-E-UNIVERSO.md` §10: "Vínculo = tempo de convívio, derivado, nunca guardado"): nada do Passeio pode gravar "vínculo ganho em passeio".
3. **O "companheiro capturável" do Oráculo já existe e NÃO é um segundo pet.** `ficha/capture.ts` (`poderCaptura`, afinidade elemental + Evocação) escolhe, na geração, 1 de 32 criaturas do class-system (`ficha/companheiro.ts`: lobo, urso, fênix menor…), hoje mostrado como "parceiro visível e nomeado" na Ficha (decisão 2 do dono, `PLANO-ORACULO.md`). É determinístico, feito UMA vez, e é identidade. Não é captura por encontro. Isso importa para a candidata 6 (§4).
4. **A Aventura da noite já é o "pet sai e volta com achado"** (`adventure.ts`, `ADVENTURE_CATALOG` de 24 cenas, voz em 1ª pessoa da criatura, determinística por `dayKey`, não paga nada, `AdventureDiary` sem lacuna, sem raridade, sem contagem). A `REGISTRO-DE-DECISOES.md` (linhas "Aventura: só narrativa", "Diário NÃO mostra o que falta") é decisão do dono de 08/09/2026, baseada em Finch ("narrativa não satura").
5. **A bíblia já reserva o lugar do bicho fora de casa.** §6.7: as nove linhas são "o que o jogador encontra em expedição"; §7.1: fenda = lugar onde "ninguém mora", criaturas "de passagem"; §7.1 "O que se traz de lá": fragmentos que ainda não assentaram; §7.2: reino é "clima da Malha, não paisagem", nenhum hostil, nenhum prêmio.
6. As 13 cenas de `SPIRIT_BG_SCENES` são gruta/fenda/arena/forja (Gruta Azul, Caverna Verde, Salão Dourado, Abismo Violeta, Fenda Rósea, Ruína Submersa, Forja das Almas, Necrópole de Ossos, Núcleo de Dados, Céu Partido, Corredor em Ruínas, Arena Noturna, Coliseu Ancião). São paisagens de MASMORRA, não de "passeio". Duas são de arena (Torneio); a Forja é a cena fixa do Pesadelo (`NIGHTMARE_SCENE`); a Necrópole de Ossos tem nome e arte de morte.

## 1. O que o gênero ensina (fontes; (≈) = memória)

- **Monster Rancher (MR2): errantry e expedition.** Confirmado por busca: no MR2 o monstro pode voltar de errantry com item especial de combinação, e expedições têm janela de dias (14 se bem-sucedida, 10 se falha) e entregam itens raros e desbloqueio de novas espécies ([Adventures, wiki](https://monster-rancher.fandom.com/wiki/Adventures), [legendcup](https://legendcup.com/faqmr2unlock.php)). Lição: a saída é o **motor de progressão do conteúdo** (desbloqueio), com risco de falha. Esse é exatamente o traço que o Soulmon proíbe (falha, cobrança). Transplantável: só "volta com algo raro e narrado"; NÃO transplantável: falha e utilidade mecânica.
- **Neko Atsume.** Confirmado por busca: os gatos só aparecem com o app fechado ou em segundo plano, cada gato tem um memento único depois de várias visitas, há álbum de fotos ([Wikipedia](https://en.wikipedia.org/wiki/Neko_Atsume), [Mementos](https://nekoatsume.fandom.com/wiki/Mementos)). Lição: **ausência do jogador é o mecanismo** e "acontecer sem você" é o produto. Mas aqui o protagonista são os visitantes, não o dono da casa: o afeto vai para o gato que chega, não para "o meu".
- **Nintendogs, Pokémon Sleep, Finch, Palworld, Pokémon Snap.** Nintendogs: passeio como interação presente, com achado de item (≈); o pet vai junto, não some. Pokémon Sleep: o Pokémon "dorme" e o jogador coleta a cena no dia seguinte, o produto é a coleção de sonhos (≈, e o Soulmon já tem o Dex de Sonhos equivalente). Finch: aventuras do pet enquanto a pessoa cuida de si, sem punição (≈; é a fonte declarada da decisão de 08/09). Palworld: Pals trabalham em base (≈), afeto por utilidade, já classificado em `04-monster-taming.md` como polo oposto do Soulmon. Pokémon Snap: observar criatura sem captura sustenta um jogo inteiro (≈). Nenhum destes foi reverificado por fonte nesta rodada; só MR2 e Neko Atsume foram.
- **Síntese.** Existem dois padrões que não se misturam: (A) "o pet sai e traz" (MR2, Finch, Soulmon-Aventura) e (B) "o mundo vem visitar o pet" (Neko Atsume, Sleep). O Soulmon já tem A (Aventura da noite) e B (sonhos, com a criatura desligada). Um Passeio com relógio novo seria um SEGUNDO A concorrendo com o primeiro.

---

## 2. Passeio (expedição do pet)

Veredito: **APROVADO COM RESSALVA**

Motivo: o padrão é legítimo no gênero e a lei L6/L5 da bíblia já o abriga ("a expedição" como perda permitida, ausência como saudade). O problema não é o conceito, é a duplicata: a Aventura da noite JÁ é o pet que sai e volta com achado narrado, sem pagamento, e o dono decidiu que não paga. Se o Passeio é a mesma coisa com relógio de N horas, é redundante; se paga Bits e decoração, contradiz a decisão de 08/09. Só faz sentido como **evolução da Aventura** (mesma narrativa, mais tempo de relógio real), não como sistema paralelo. Sem pet fora da Home, a saída vira um timer numérico e perde o que o gênero valoriza.

Sobre a pergunta central (a saída ancora o vínculo ou o dilui?): ancora **quando o pet é o sujeito da história** (voz em 1ª pessoa, como no `ADVENTURE_CATALOG`) e dilui **quando é mecânica de recurso** (MR2, Palworld). A voz em 1ª pessoa só ancora se não violar L11: "voltei" e "achei" são reação/relato, aceitável; "senti sua falta" é vetado.

Sobre o palco vazio: no v-pet clássico o pet ausente é o pet morto/doente ou a tela desligada, e a fantasia é "sempre presente". Um palco vazio sem explicação lê como bug ou abandono; um "passeando" diegético (a caixa mostra rastro, a decoração intacta, um bilhete) lê como vida própria. Recomendo o diegético e curto. Em Neko Atsume o palco vazio funciona porque o jogador ESPERA a visita, não a ausência de um dono.

Sobre biomas = `SPIRIT_BG_SCENES`: **não casam**. São 13 cenas de masmorra (fenda, gruta, forja, arena, ruína), e a bíblia diz que "ninguém mora numa fenda" e que o pet está lá "de passagem". Passeio para uma Gruta Azul é "descer na fenda" outra vez. Dos 9 reinos (§7.2: deserto, picos, oceano, pântano, floresta, cavernas, gelo, campina, akasha) só cavernas, oceano (Ruína Submersa) e talvez gelo têm cena correspondente; deserto, picos, pântano, floresta, campina não têm arte. Duas das 13 são arena do Torneio (não são bioma), uma é a cena fixa do Pesadelo, e a Necrópole de Ossos contradiz a regra de arte sem caveiras da Exploração e o veto de "nada é assustador por ser antigo" (§7.3). akasha não pode ser destino: "não se visita akasha e não se traz nada de lá" (§7.2.1).

Condições:
- **R-1 (AJUSTE OBRIGATÓRIO — bloqueante).** O Passeio não pode coexistir com a Aventura da noite como segundo sistema de "pet sai e traz". A proposta tem que dizer qual das duas é fundida na outra (ou que a Aventura é o desfecho do Passeio) e citar `adventure.ts`/`ADVENTURE_CATALOG` e a decisão "Aventura: só narrativa, sem recompensa material" (`REGISTRO-DE-DECISOES.md`). Critério: nenhum dia tem dois relatos de "achado" independentes.
- **R-2 (AJUSTE OBRIGATÓRIO).** Se o Passeio pagar Bits ou item, a proposta registra explicitamente a REVERSÃO da decisão de 08/09 (a alternativa que perdeu era "Bits/item pelo achado — o relatório viraria tela que a pessoa PRECISA abrir") e dá o "o que mudou desde que perdeu". Sem isso, o achado é só narrativa. Respeita `MINIGAME_BITS_PER_DAY` se pagar.
- **R-3 (AJUSTE OBRIGATÓRIO).** Biomas NÃO são as 13 `SPIRIT_BG_SCENES` no todo. Lista de exclusão verificável: fora Necrópole de Ossos, Arena Noturna, Coliseu Ancião, Forja das Almas (cena do Pesadelo) e qualquer destino "akasha". Destinos saem da §7.2 (clima do reino), não do nome da cena da fenda. Cena nova é decisão de arte, não desta lente.
- **R-4 (AJUSTE OBRIGATÓRIO).** Ausência longa: o relato acumulado nunca usa contagem de dias, nunca "esperou", nunca "sentiu falta" (L6, L11). Coerente com `ABSENCE_FORGIVENESS_DAYS` (=2 em `dailyReset.ts`), que perdoa dano, não gera relato; a proposta não cria um segundo mecanismo ligado a esse número.
- **R-5 (AJUSTE OBRIGATÓRIO).** Estado do palco durante a saída: mostrar o pet ausente em modo diegético (rastro/bilhete/pegada), nunca palco vazio sem explicação nem campo "volta em N h" com barra de progresso de cobrança. A ação do jogador durante a saída (alimentar, banhar, brincar) não pode ser bloqueada nem punida; nenhum efeito sobre HP, energia, `perfectDays`, evolução ou `bond` (`bondLevel` não persistido).
- **R-6 (SUGESTÃO).** Timer nunca pausa, mas a duração mostrada deve ser curta (o gênero de "volta em horas" funciona por ritmo de ida e volta, ≈) e o resultado ao voltar deve ser lido como cena, não como fatura.

---

## 3. Diário de Campo

Veredito: **APROVADO COM RESSALVA**

Motivo: como TERCEIRO álbum ao lado do Bestiário (36 artes, inimigos) e do `AdventureDiary`/Dex de Sonhos seria um álbum a mais sem eixo próprio: cada achado do Passeio já é (ou deveria ser) uma cena de aventura, e a página do pet já tem o Diário de Aventuras (`AdventureDiary`, ao lado do Dex de Sonhos) sem lacuna, sem raridade, sem contagem. O certo é **fundir**: o Diário de Campo é o `AdventureDiary` com um campo a mais (bioma/local), não um álbum novo. Também não pode herdar o "padrão de coleção do Bestiário (silhueta, contagem)" como a ideia diz: o Bestiário tem lacuna visível porque lá a coleção é o jogo; o `AdventureDiary` NÃO tem, por decisão do dono ("um diário com lacunas visíveis vira lista de pendências"). Silhueta em álbum de achados é o oposto da decisão registrada.

Sobre o Bestiário: são coleções de naturezas diferentes. O Bestiário cataloga "padrões" (§5.11, uma linha é o mesmo padrão reassentado, nunca indivíduo), e o achado de campo é uma cena vivida. Se o Diário de Campo mostrar a mesma linha (Ignar, Lumel…) como "achado", cria a impressão de encontro individual, contradizendo §5.11 ("encontrar duas vezes a mesma linha não é encontrar dois bichos"). Achados devem ser objetos, lugares, clima, gestos (como já são: orvalho, pedra lisa, eco), não "criaturas encontradas".

Condições:
- **R-7 (AJUSTE OBRIGATÓRIO — bloqueante).** Fundir com `AdventureDiary` (mesma página do pet, mesma peça `MiniGlass`) em vez de criar terceiro álbum. Critério: um único lugar onde o jogador vê o que o pet trouxe, e a proposta cita `AdventureDiary` e o registro "Diário NÃO mostra o que falta nem raridade".
- **R-8 (AJUSTE OBRIGATÓRIO).** Sem silhueta, sem "N de M", sem percentual, sem "faltam N", sem raridade rotulada no Diário (herda a decisão de `AdventureDiary`). A frase "padrão de coleção do Bestiário" sai da proposta: o modelo é o Diário de Aventuras, não o Bestiário.
- **R-9 (AJUSTE OBRIGATÓRIO).** Achados não podem ser "uma criatura encontrada de linha X" (§5.11). Se algum achado citar fauna, é a linha como padrão, sem indivíduo, sem população, sem captura.
- **R-10 (SUGESTÃO).** O campo novo (bioma/data/frase) reaproveita o `dayKeyLabel` já usado; a frase do pet segue L11 (relato, não emoção causada pelo histórico).

---

## 4. Escavação

Veredito: **APROVADO COM RESSALVA**

Motivo: minijogo de 1 toque, sem falha, sempre com resultado, é compatível com o Salão de Jogos e com o `GameKit`. A lente de encaixe pergunta: "cavar" o quê? A bíblia responde: **a fenda e o "o que se traz de lá"** (§7.1, fragmentos que ainda não assentaram). Cavar é descer na dobra e recolher fragmento, o que já é a Masmorra. Cavar a Malha "para achar história" conflita com a §9 ("não existe fundador", "não há ninguém que diga o que é") e com o buraco declarado das eras (§8: "o que a era NÃO explica"), pensado justamente para que o lore não vire catálogo de revelação. Fragmento de lore de era é aceitável só se ilustra o "vestígio visível hoje" da §8 (cobre, nove linhas, visor, maré), nunca se preenche o que a era declara não explicar (quem montou a primeira grade, por que a sobra insiste, se há era depois de Agora).

Sobre decoração rara do palco: `PALCO-E-DECORACAO.md` define cinco espaços (`rug`, `floor-left`, `trophy`, `floor-right`, `wall`) com caixa fixa e arte encomendada por espaço, com teste de que todo espaço tem item; o espaço `trophy` é exclusivo de itens do Torneio. Decoração rara vinda de escavação seria uma segunda fonte, fora de `shop.ts`; se entrar, é cosmético e ocupa `slot` existente; a bíblia lê decoração como "acúmulo de quem mora ali" (§7.1), e "encontrar" coisa na fenda e levar para casa casa bem com isso. Mas "rara" não pode significar sorte que pune quem não cavou, e não pode entrar em `trophy`.

Sobre o "companheiro capturável" (candidatas 6 e descarte de captura por sorte). O gênero sustenta "observar sem capturar": Pokémon Snap (≈) é um jogo inteiro nisso; o Soulmon já tem a base narrativa, pois §5.11 diz que o registro cataloga padrões e faz do Bestiário "coleção sem ser caçada". Portanto observar uma linha por afinidade é coerente com o universo e não conflita com "o companheiro é um só", DESDE QUE três coisas: (1) o "companheiro" do Oráculo (`ficha/capture.ts`, `companheiro.ts`) é uma identidade fixa criada uma vez, e não pode ser reaberta por encontro selvagem (seria segundo pet); (2) o "encontro" nunca entrega criatura ao jogador, só registro/cena (dá para chamar de "avistar", não "capturar"); (3) a captura por sorte é descartada corretamente: o próprio `capture.ts` é determinístico por afinidade+Evocação, e captura aleatória seria gacha (`BENCHMARK-COMBATE.md` recusa "gacha/equipamento pago que dá poder"). Nomenclatura: a palavra "captura" já é dívida do Oráculo; nada da Exploração deve usá-la.

Condições:
- **R-11 (AJUSTE OBRIGATÓRIO — bloqueante).** A Escavação não pode ser "a Masmorra em 1 toque" com outro nome: a proposta diz o que a distingue do que já se traz da fenda (§7.1) e do Glitchtama (1/dia, +1 `perfectDay`). Critério: recompensa da Escavação nunca é `perfectDay`, HP, energia, atributo ou evolução, e não toca o Glitchtama.
- **R-12 (AJUSTE OBRIGATÓRIO).** Lore só como "vestígio visível" das eras (§8, coluna 4). Proibido preencher a coluna 5 ("o que a era NÃO explica") e proibido fundador, data, século, país, empresa (§8 fim, §9). Cada fragmento passa nas doze leis, em PT e EN.
- **R-13 (AJUSTE OBRIGATÓRIO).** Decoração rara: cosmética, ocupa um dos cinco `slot` de `PALCO-E-DECORACAO.md` com a caixa fixa daquele espaço, nunca `trophy` (só Torneio), e a raridade não é rotulada ao jogador (mesma razão do `AdventureDiary`: rotular como "comum" diz que valeu pouco). Se ficar fora de `shop.ts`, o item precisa de `fits`/`slot` e do teste "todo espaço tem item".
- **R-14 (AJUSTE OBRIGATÓRIO).** Nenhuma superfície da Exploração usa "capturar", "capturado", "domar" para o que o jogador vê. A candidata 6, quando vier, se chama observação e não pode tocar `ficha/capture.ts` nem `companheiroVisivel` (o companheiro é fixo).
- **R-15 (SUGESTÃO).** Respeitar a regra de arte sem caveiras da Exploração: fragmento de "A Sobra" e "O Solo" ilustrado como cobre/diferença, não osso.

---

## 5. Respostas recomendadas às perguntas do dono que tocam este papel

- **P2 — o pet pode sair da Home?** Recomendo **diegético** ("passeando", rastro e bilhete no palco), nunca palco vazio mudo, e sem bloquear o cuidado. Motivo: v-pet sem pet é a tela desligada; o gênero tolera a saída quando ela é história (Finch, Aventura). Gatilho de revisão: se o dono medir (≥10 usuários × 14 dias, o próprio gatilho da Camada 3) que o palco vazio/diegético reduz abertura da Home, voltar para timer com o pet presente.
- **P3 — achados rendem decoração rara?** Recomendo **não no Passeio** (contradiz "Aventura: só narrativa"); **sim, só na Escavação e cosmética**, e nunca em `trophy`. Gatilho: se o dono reverter a decisão de 08/09, registrar a reversão (R-2). Gatilho de saída: se a Aventura mostrar queda de abertura depois que as 24 cenas se esgotam (aposta 9 do registro, "abertura do relatório caindo depois que o catálogo é visto"), a decoração vira a válvula de renovação.
- **P4 — Diário de Campo entra no `weeklyReport`?** Do lado do vínculo: **não como contagem**. O relatório hoje já traz `dreams`; um "N achados" seria contagem de coleção virando métrica de desempenho, o que a decisão do `AdventureDiary` proíbe. No máximo uma cena (a mais recente) como descrição, nunca número. Gatilho: se o dono quiser numeração, decidir junto com a política de `dreams`.
- **P5 — Escavação paga Bits?** Fora do meu escopo de gênero; do lado do encaixe, se pagar, com teto `MINIGAME_BITS_PER_DAY` e sem tocar Glitchtama (R-11). Lore sem Bits é o desenho mais coerente com "narrativa não satura".
- **P1 — exceção ao congelamento da Camada 3?** Sem opinião de gênero. Observação: como R-1 e R-7 pedem fundir com a Aventura (que já existe e não está sob a congelação da Camada 3 do mesmo modo), a parte que fundir pode nem precisar de exceção.

## 6. Tabela-resumo

| ideia | veredito | condição bloqueante |
|---|---|---|
| Passeio | APROVADO COM RESSALVA | R-1: não coexistir com a Aventura da noite como segundo sistema "pet sai e traz"; fundir e citar `adventure.ts` e a decisão de 08/09 |
| Diário de Campo | APROVADO COM RESSALVA | R-7: fundir com `AdventureDiary`, sem terceiro álbum, sem silhueta nem contagem (R-8) |
| Escavação | APROVADO COM RESSALVA | R-11: distinguir da Masmorra/Glitchtama e nunca tocar `perfectDay`, HP, energia, atributo ou evolução |

## 7. O que NÃO consegui verificar

- Se o `AdventureDiary` e o Bestiário aparecem hoje na MESMA aba ou em abas diferentes (li o cabeçalho de `AdventureDiary.tsx`, não a árvore de páginas).
- Contagem exata do pool do Oráculo (o doc de regras diz 630; a linha do `PLANO-ORACULO.md` cita 194 originais; não reconferi `pool.json`).
- Quais reinos (§7.2) têm arte disponível fora das 13 cenas: não varri `src/assets/soulmon/bg`.
- Nintendogs, Pokémon Sleep, Finch, Palworld, Pokémon Snap: de memória (≈), não reverificados. Confirmados por busca: MR2 (errantry/expedição, janelas de 10 e 14 dias, item raro) e Neko Atsume (visitas com o app fechado, memento por gato, álbum de fotos).
- Se `docs/reviews/guilda/02-psicologia.md` e o parecer de psicologia desta rodada endossam "palco diegético": esta lente é de gênero, e a decisão de ficar/não ficar mudo é da psicologia.
- Não medi retenção de nada: ninguém usou o app em produção.
