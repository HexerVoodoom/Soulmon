# Quem recebe o companheiro invocado: jogadores reais, simulados e NPCs (levantamento)

Data: 16/11/2026. Somente leitura: nenhum código alterado, nada commitado, nada escrito em produção. Base de código: `origin/main` (a main local está atrasada). Complementa `docs/PLANO-COMPANHEIRO-INVOCADO-2026-11-16.md` e `docs/ELEMENTOS-COM-EVOCACAO-2026-11-16.md`.

Regra do dono (16/11), aplicada aqui: o companheiro invocado (32 sprites fixos) vale para TODO Soulmon cujo ARQUÉTIPO (nome da classe do estágio atual) esteja na lista de evocação OU cuja ESCOLA dominante da ficha seja Evocação. Vale para jogadores reais existentes, simulados e NPCs.

Legenda: **[medido]** = lido do KV de produção ou do código; **[inferido]** = deduzido de dado medido por regra do código, com a regra citada; **[proposta]** = decisão minha, a validar.

## 0. A lista de arquétipos de evocação (ids e nomes exatos)

Ids de `src/utils/soulProfile/ficha/classTitle.ts:50-130` (`CLASS_TITLE_EN`); PT do motor `vendor/class-system/index.js` (`ARQUETIPOS`). [medido]

| id | PT | EN |
|---|---|---|
| invocador | Invocador | Summoner |
| senhor_das_feras | Senhor das Feras | Beastlord |
| xama_totemico | Xamã Totêmico | Totem Shaman |
| necromante | Necromante | Necromancer |
| demonologista | Demonologista | Demonologist |
| verdejante | Verdejante | Verdant Warden |
| senhor_dos_mortos_vis | Senhor dos Mortos Vis | Lord of the Vile Dead |
| bokor | Bokor | Bokor |
| escriba_do_pacto | Escriba do Pacto | Scribe of the Pact |

Detalhes que mudam a contagem:
- O save guarda só o NOME (`soulmonClassTitles[estágio].nome.{pt,en}` + `origem`), sem o id. O casamento é pelo nome EN/PT acima. [medido]
- `origem: 'diluido'` ("Aspirante a X" / "X Aspirant") NÃO é o arquétipo: é meia-identidade. Tratei como NÃO. Se o dono quiser que aspirante conte, mudam 2 jogadores (um Bokor Aspirant no champion e um no ultimate, ambos em estágios que não são o atual deles hoje).
- `origem: 'generico'` ("Adepto de X") nunca conta.
- O cache `soulmonClassTitles` guarda os 5 estágios de uma vez (pré-computados no 1º recálculo, "primeiro valor vence"), então dá para saber a classe de estágios FUTUROS de quem tem cache. [medido]

## 1. Jogadores reais

### 1.1 O que foi lido e o método
- Namespace `SOULMON_SAVES` (20b3ba78...): 4.352 chaves. Saves de conta = 26 chaves hex de 32 caracteres + 1 chave em formato UUID (conta antiga, mesmo formato de save) = **27 saves não `sim_`**. Os 170 `sim_NNNN` e todas as chaves auxiliares (`profile:`, `nick:`, `rk:` etc.) ficaram de fora, exceto: `nickof:` das 27 contas (só para localizar a Maslin) e `profile:sim_*` dos 170 simulados (estágio vivo). [medido]
- Numeração "Jogador 01..27" = ordem alfabética do id da chave (arbitrária, estável enquanto não entrarem contas novas). Sem e-mail, sem nome, sem id. A Maslin é o Jogador 02.
- A **escola dominante não está salva**, mas é recuperável em 20 de 27 casos, sem recalcular o Oráculo (que exigiria nome completo e data de nascimento, que não estão no save):
  - Papel dominante: `soulmonSkills[estágio].{basica,especial}.recursoId` = `Object.keys(ficha.recursos)[0]` (`ficha/skills.ts`, `buildStageSkills`) = `ROLE_TO_RECURSO[dominantRole]` (`buildSheet.ts:478-495`): furia=físico, soullink=tanque, mana=mágico, fe=suporte, ressonancia=alcance. [inferido]
  - Caminho dominante: `soulmonMeta.dominantAlignment` (poder/harmonia/benevolência). [medido; 20 de 27 saves têm `soulmonMeta`]
  - Escola dominante = `ROLE_SCHOOL_BY_ALIGNMENT[papel][caminho]` (`buildSheet.ts:193-199`), com piso de liderança que a torna sempre a maior da ficha. Evocação lidera só em tanque+harmonia, tanque+benevolência e mágico+benevolência. Dá para concluir "não" só com o caminho (poder nunca é Evocação) ou só com o papel (físico, alcance e suporte nunca são Evocação). [inferido]
  - **Validação do método**: nos 15 saves com papel e caminho conhecidos, a escola prevista bate com `escolaId` das skills em todos os 10 em que a previsão não é Evocação (as skills excluem Evocação, `ficha/types.ts:24`), e nos 5 em que a previsão é Evocação o `escolaId` das skills é outra escola (a vice), como o código manda. Zero contradições em 15. [medido]
- Limite: sem o cache de skills (PetPage nunca aberta) e sem `soulmonMeta`, não há como decidir. Aí vai "indeterminado".

### 1.2 Resultado (27 saves)

| Resultado | Qtde |
|---|---|
| SIM | 6 |
| NÃO (medido: arquétipo atual lido e escola descartada) | 3 |
| NÃO provável (escola descartada e Rookie sem cache de classe; todo Rookie com cache medido é "Adepto", 8 de 8) | 11 |
| INDETERMINADO | 7 |

Quem recebe, por motivo: Maslin por arquétipo atual (Verdejante); 5 por escola Evocação (tanque ou mágico com caminho harmônico/benevolente).

### 1.3 Tabela por jogador

Colunas: elemento da leitura (`soulmonMeta.dominantElement`; "/x" = elemento do estágio atual em `elementoJornada`); estágio atual (`evolutionStage`); classes Rookie / Champion / Ultimate / Mega / Ultra do cache (`*` = Adepto genérico, `~` = Aspirante diluído, sem marca = arquétipo); papel+caminho inferidos e o veredito da escola; companheiro do save (`soulmonCompanheiro`); família do especial do estágio atual (`soulmonSkills[...].especial.familia`, igual nos 5 estágios em todos os saves que a têm).

| Jogador | Elemento | Estágio | Classes por estágio (cache) | Arquétipo atual na lista? | Papel+caminho => escola Evocação? | Companheiro no save | Família do especial | Recebe |
|---|---|---|---|---|---|---|---|---|
| 01 | planta | rookie | (cache vazio) | indeterminado (Rookie, provável não) | alcance+benevolência => não | vazio | heal | não (provável) |
| 02 (Maslin) | planta/druidismo | ultimate | Industrial Adept* / Industrial Adept* / Verdant Warden / Arcane Arsenal / Scribe of the Pact | **sim** (Verdejante) | alcance+benevolência => não | slime_cristalino | spdBuff | **SIM** |
| 03 | ar | rookie | (cache vazio) | indeterminado (Rookie, provável não) | mágico+harmonia => não | vazio | spdBuff | não (provável) |
| 04 | fogo | rookie | (cache vazio) | idem | tanque+poder => não | vazio | direct | não (provável) |
| 05 | sombra/sabbat | ultimate | (cache vazio) | **indeterminado** | ?+harmonia => indeterminado | vazio | ? | **INDETERMINADO** |
| 06 | terra | rookie | (cache vazio) | indeterminado (Rookie) | tanque+benevolência => **sim** | vazio | dot | **SIM** |
| 07 | industrial | rookie | (cache vazio) | indeterminado | ?+benevolência => indeterminado | vazio | ? | INDETERMINADO |
| 08 | terra | rookie | (cache vazio) | indeterminado (Rookie) | ?+poder => não | vazio | ? | não (provável) |
| 09 | sombra | rookie | (cache vazio) | idem | alcance+harmonia => não | vazio | heal | não (provável) |
| 10 | ? (sem meta) | rookie | (cache vazio) | idem | físico+? => não | vazio | shield | não (provável) |
| 11 | fogo | rookie | (cache vazio) | idem | ?+poder => não | vazio | ? | não (provável) |
| 12 | luz | rookie | (cache vazio) | idem | suporte+benevolência => não | vazio | defDebuff | não (provável) |
| 13 | ? (sem meta) | rookie | (cache vazio) | indeterminado | ?+? => indeterminado | vazio | ? | INDETERMINADO |
| 14 | ? (sem meta) | rookie | (cache vazio) | indeterminado | mágico+? => indeterminado | vazio | defDebuff | INDETERMINADO |
| 15 | ? (sem meta) | rookie | (cache vazio) | indeterminado | ?+? => indeterminado | vazio | ? | INDETERMINADO |
| 16 | industrial/pneumatica | champion | Industrial Adept* / Industrial Adept* / Spectral Arsenal / Inquisitor / Toxicologist | não (Adepto) | físico+poder => não | salamandra | spdBuff | **NÃO** |
| 17 | ? (sem meta) | ultra | (cache vazio) | **indeterminado** | ?+? => indeterminado | vazio | ? | **INDETERMINADO** |
| 18 | industrial | champion | Industrial Adept* ×3 / Verdant Warden / Dimensional Traveler | não (Adepto) | tanque+benevolência => **sim** | slime_cristalino | shield | **SIM** (e mega vira Verdejante) |
| 19 | luz | rookie | Light Adept* / Bokor Aspirant~ / Spectral Arsenal / Galvanic Engineer / Epidemiologist | não | mágico+benevolência => **sim** | fada | dot | **SIM** |
| 20 | ? (sem meta) | rookie | (cache vazio) | indeterminado (Rookie) | físico+? => não | vazio | shield | não (provável) |
| 21 | ? (sem meta) | rookie | (cache vazio) | idem | físico+? => não | vazio | shield | não (provável) |
| 22 | agua | rookie | (cache vazio) | idem | suporte+harmonia => não | vazio | heal | não (provável) |
| 23 | luz | rookie | (cache vazio) | idem | tanque+benevolência => **sim** | vazio | defDebuff | **SIM** |
| 24 | industrial | rookie | Earth Adept* ×3 / Primordial Avatar / Totem Shaman | não (Adepto) | tanque+harmonia => **sim** | gosma_acida | dot | **SIM** (ultra também por classe) |
| 25 | planta | rookie | (cache vazio) | indeterminado | ?+benevolência => indeterminado | vazio | ? | INDETERMINADO |
| 26 | planta | rookie | Water Adept* ×2 / Bokor Aspirant~ / Dark Troubadour / Spirit Vampire | não | alcance+benevolência => não | fenix_menor | direct | **NÃO** |
| 27 | terra | champion | Earth Adept* ×3 / Summoner / Summoner | não (Adepto) | suporte+benevolência => não | fenix_menor | shield | **NÃO agora; SIM a partir do Mega** (Invocador) |

Observações por jogador:
- **Maslin (02)**: recebe pelo arquétipo atual (Ultimate = Verdejante), não pela escola (alcance+benevolência dá longo alcance). O cache mostra que no **Mega** a classe vira Arcane Arsenal (fora da lista) e ela PERDE a invocação nessa forma, e recupera no **Ultra** (Escriba do Pacto). Isso confirma na prática a regra "forma nova sem arquétipo de evocação perde" do plano. Companheiro: Slime Cristalino (`slime_cristalino`), já no save.
- **Jogador 05** parece ser o jogador "de Sabá" que o plano cita (elemento curado `sabbat`; identificação por elemento, não por nome). Está **indeterminado** nos dois critérios: sem cache de classe (estágio Ultimate!) e sem cache de skills (não dá papel), só o caminho (harmonia) é conhecido. Só decide com tanque, que é 1 papel em 5. Não alterar nada nele sem o dono.
- **Jogador 17** está no Ultra e sem NENHUM cache (classes, skills, meta): é o caso mais importante de resolver, porque é o estágio onde a classe é mais provável de ser de evocação.
- Jogadores 18 e 24 já "pré-mostram" evocadores em estágios futuros (Verdejante no Mega; Xamã Totêmico no Ultra), e o 27 vira Invocador no Mega.

### 1.4 Criatura companheira que cada "SIM" receberia
Os sprites são fixos por criatura (as 32 do `class-system`); o companheiro vem de `soulmonCompanheiro` ou do `selectCompanion(ficha, seedKey)` (`ficha/capture.ts:57-62`, sorteio semeado sobre o conjunto capturável).

| Jogador | Companheiro |
|---|---|
| 02 (Maslin) | `slime_cristalino` (Crystal Slime), **do save** |
| 18 | `slime_cristalino`, do save |
| 19 | `fada` (Glimmering Fae), do save |
| 24 | `gosma_acida` (Acid Ooze), do save |
| 06 | save vazio. Seria sorteado por `selectCompanion` com a identityKey da pessoa (determinístico: mesmo seed e ficha dão a mesma criatura). **Não calculável aqui**: precisa da ficha, que depende de nome completo e Oráculo. Preenche sozinho quando a PetPage abrir (é o que já acontece hoje). |
| 23 | idem 06 |

Quem tem companheiro no save mas NÃO recebe hoje: 16 (`salamandra`), 26 (`fenix_menor`), 27 (`fenix_menor`, recebe no Mega). O companheiro dele fica guardado; só não invoca.

### 1.5 O que falta para fechar os 7 indeterminados (e os 11 "provável")
1. O cache já planejado (`soulmonEvocacao`, PR 2 do plano) gravado na próxima abertura do app de cada jogador, com o gatilho decidido NO CLIENTE (que tem nome, data e Oráculo). Resolve todos, inclusive os Rookies sem cache.
2. Alternativa sem esperar: não há como o servidor decidir sozinho (falta nome/data de nascimento, deliberadamente fora do save). Nenhum script offline resolve sem esses dados.
3. Para os 11 "não (provável)": a única incerteza é o arquétipo Rookie. Em 8 de 8 caches Rookie medidos a classe é Adepto (genérica) e a escola está descartada pelo método do item 1.1, então a chance de erro é baixa, mas não é zero.

## 2. Simulados (`sim_`, 170)

### 2.1 O que existe [medido]
- Registro `functions/api/_simulados.data.js` (170 itens): `id`, `nick`, `petName`, `line` (poder 52 / harmonia 52 / benevolência 66), `element` (do sprite, 18 elementos distintos), `artLine`, `faixa`, `ancora`, `bond0`, `skill`, `frequency`, `prefs`, `daysPlaying`.
- O save do simulado grava só `evolutionStage`, `perfectDays`, `totalXP` e `soulmonSkills[estágio].elementoDominante` (`_simulados.js:179-182`). **Sem ficha, sem classe, sem papel, sem escola, sem companheiro, sem `soulmonClassTitles`.** O `line` é o análogo do caminho do Oráculo, mas não há análogo do papel.
- Estágio vivo hoje (`profile:sim_*.stage`): rookie 68, champion 45, ultimate 36, mega 19, ultra 2.
- Elementos (170): planta 24, luz 21, agua 21, sombra 18, terra 17, ar 16, industrial 15, fogo 13, arcano 5, morte 4, marcial 3, vileza 3, tempo 3, som 2, vigor 2, fada 1, eletricidade 1, vida 1.

Conclusão medida: pelo que existe hoje, **zero simulados têm arquétipo de evocação ou escola Evocação**, porque não têm classe nem ficha. É preciso um mapeamento próprio.

### 2.2 Mapeamento proposto [proposta]
Três opções comparáveis, todas determinísticas e sem escrita no save do simulado:

**Opção A — por tema do elemento (conservadora).** Recebe quem tem `element` em {morte, vileza, vida, vigor, arcano, eletricidade}, os 6 elementos que compõem arquétipos de evocação (Necromante=morte, Demonologista=vileza, Verdejante=vida, Senhor das Feras=vigor+vida, Invocador=arcano, Xamã=eletricidade). **16 simulados** (9 se exigir também `line` ≠ poder).

**Opção B — por escola, com papel derivado do elemento (recomendada).** Papel por elemento: tanque = terra, planta, vida, vigor, industrial; suporte = agua, luz; físico = fogo, marcial; alcance = ar; mágico = todos os outros. Aplica-se a mesma tabela `ROLE_SCHOOL_BY_ALIGNMENT` do Oráculo com `line` no lugar do caminho: Evocação se (tanque e `line` ≠ poder) ou (mágico e `line` = benevolência). **45 simulados (26%)**. É a regra do dono (escola dominante Evocação) sem inventar classe. A tabela de papel é minha; trocar o papel de um elemento muda a contagem.

**Opção C — sorteio por hash do id com a distribuição real de papéis.** O comentário de `buildSheet.ts:178-186` diz que a Evocação lidera em cerca de 13,5% a 19,4% das fichas (medido pelo autor do código em N=800, não por mim): esperado ≈ 23 a 33 dos 170. Não dá para prever a lista antes de rodar. Vantagem: mesma taxa da população real. Desvantagem: o simulado "tanque" pode ter elemento fogo.

### 2.3 Contagem por elemento base (Opção A e B)

| Elemento | Simulados | `line` poder | A: tema | B: escola |
|---|---|---|---|---|
| planta | 24 | 11 | 0 | 13 |
| luz | 21 | 2 | 0 | 0 |
| agua | 21 | 3 | 0 | 0 |
| sombra | 18 | 8 | 0 | 4 |
| terra | 17 | 6 | 0 | 11 |
| ar | 16 | 0 | 0 | 0 |
| industrial | 15 | 5 | 0 | 10 |
| fogo | 13 | 9 | 0 | 0 |
| arcano | 5 | 1 | 5 | 1 |
| morte | 4 | 2 | 4 | 2 |
| marcial | 3 | 1 | 0 | 0 |
| vileza | 3 | 2 | 3 | 0 |
| tempo | 3 | 0 | 0 | 0 |
| som | 2 | 0 | 0 | 1 |
| vigor | 2 | 1 | 2 | 1 |
| fada | 1 | 0 | 0 | 1 |
| eletricidade | 1 | 1 | 1 | 0 |
| vida | 1 | 0 | 1 | 1 |
| **Total** | **170** | **52** | **16** | **45** |

Interseção A e B = 5. Opção B por estágio vivo: rookie 19, champion 11, ultimate 10, mega 4, ultra 1 (soma 45).

Pontos de atenção:
- Os simulados mudam de estágio por dia (`_simulados.js`), mas como a Opção B não depende de classe, a regra é estável por estágio (a escola é fixa; só o arquétipo mudaria).
- Companheiro do simulado: não há `selectCompanion` sem ficha. Proposta: criatura fixa por `hash(id) % 32` restrita às criaturas compatíveis com o elemento do simulado (a tabela por elemento de `docs/ELEMENTOS-COM-EVOCACAO-2026-11-16.md` §3.2), para o NPC não parecer sorteio solto. Isso é decisão de arte/produto.
- Linha vermelha: o simulado nunca recebe prêmio nem altera economia; o companheiro é só cosmético/combate de duelo (a mesma regra do resto do `sim_`).
- Mexer em `_simulados.js` ou no registro exige o espelho no servidor com teste de paridade (`guild.simParidade.test.js`, `simulados.aplicar.test.js`).

## 3. NPCs que combatem

Medição: nenhum desses módulos tem ficha, classe (`classTitle`/arquétipo) ou escola; `grep` em `enemyRoster.ts`, `dungeon.ts`, `nightmares.ts`, `endlessRift.ts`, `rogueDungeon.ts`, `match3Boss.ts`, `tournamentNpcs.ts` dá zero ocorrências de classe/escola de ficha. O único atributo do inimigo é o **elemento** (e o `kind`). [medido]

| Família | Onde | Tem ficha/classe? | O que identifica o NPC | Candidatos a receber |
|---|---|---|---|---|
| Roster de inimigos (Arena, Fenda/Endless Rift, Masmorra, Pesadelo-luta, Desgarrados, Arena de Desgarrados) | `src/utils/enemyRoster.ts` (659 entradas: 80 base, 267 combinado, 31 api, 1 mascote, 120 ramo, 10 paralelo, 150 forma) | Não | `element` + `elements` (componentes) + `kind` + estágio | Por tema do elemento (ver abaixo) |
| Desafiantes NPC do Torneio (3) | `src/utils/tournamentNpcs.ts` (Espina, Quartzo, Maré) | Não: a luta usa a **ficha do próprio jogador** a 0,85× (sombra) | linha `starter`: Espina=vida, Quartzo=industrial, Maré=nascente (água) | Só Espina (vida) por tema; mas na luta a "sombra" é clone do jogador, então o gatilho real é o do jogador, não do NPC |
| Treino (Sparring), duelo ranqueado | `functions/api/_treino.js`, `_duel.js` | Os oponentes são jogadores reais ou `sim_` | save do oponente | Seguem as seções 1 e 2, nada novo |
| Pesadelos (corrida) | `src/utils/nightmareShadows.ts` | Não é combate: obstáculos de corrida | n/a | Fora (não luta) |
| Pesadelo (luta curta) | `nightmares.ts` usa `dungeonFoe` | Não | o mesmo roster | Mesma regra do roster |
| Guilda / Feira (raid do fenômeno) | `functions/api/_feira.js`, `guild.js` | O atacante é o jogador (`fichaDoAtacante`); o fenômeno é um alvo, não combatente com ficha | n/a | Fora |
| Chefes (Arena Ultra, Match-3, Rift) | `match3Boss.ts`, `dungeonBase.ts` | Não | elemento do chefe | Só se o dono quiser chefe evocador por design |

Contagem do roster por tema do elemento [medido via execução do próprio `ENEMY_ROSTER`]: entradas que contêm pelo menos um dos 6 elementos de tema (morte, vileza, vida, vigor, arcano, eletricidade) = **273 de 659 (41%)**: base 24, combinado 136, ramo 36, paralelo 2, forma 72, api 3. Entradas **puras** de um elemento de tema (sem componente fora da lista): base 24 (6 elementos × 4 estágios) + ramo 36 (6 × 6) = **60 (9%)**.

Como decidir [proposta], da mais restrita à mais ampla:
1. **Só puros de tema (60 entradas)**: o elemento sozinho já "diz" evocador (necromante-like = morte etc.). Mais fácil de justificar e de desenhar, mas não cobre os combinados.
2. **Qualquer componente de tema (273 entradas)**: segue a regra do dono ao pé da letra para NPC, que não tem classe: elemento como proxy do arquétipo. Custo: 41% dos inimigos passam a invocar; em Arena em grupo (N×1) isso multiplica invocações e muda o balanço (`arena.v3.test.ts`, medição em `_sim/cv3-medir/grupo.ts`). Precisa recalibrar.
3. **Só chefes e desafiantes nomeados** (Torneio, chefes de Arena/Match-3): poucas entradas, com ficha própria futura.

Para NPC decidir de forma verdadeira por "arquétipo ou escola" seria preciso criar ficha para ele (não existe). Recomendação: tratar NPC por elemento (opção 1 ou 2), e dizer isso explicitamente na especificação, porque "escola/arquétipo" não se aplica a quem não tem ficha. Os sprites do companheiro seguem a mesma tabela por elemento do doc de elementos.

Cuidado de produto: a invocação do companheiro em NPC precisa ser espelhada no servidor (`_combate.js`) e passar por teste de paridade se o NPC participar de luta com resultado no servidor. O roster de inimigos e a Arena são client-side (`arena.ts`, `dungeon.ts`), então o impacto servidor só existe para `sim_` e jogadores reais em duelo.

## 4. Resumo executivo

| Categoria | Total | Recebe | Não | Indeterminado | Base |
|---|---|---|---|---|---|
| Jogadores reais | 27 | 6 | 14 (3 medido + 11 provável) | 7 | medido + inferido pelo recurso das skills |
| Simulados | 170 | 45 (opção B) / 16 (A) / ~23-33 (C) | resto | n/a (sem ficha) | mapeamento proposto |
| Roster de NPC | 659 entradas | 60 (puros) a 273 (qualquer tema) | resto | n/a | elemento como proxy |
| Torneio NPC | 3 | 1 por tema (Espina) | 2 | n/a | proposta |

Perguntas que continuam abertas para o dono (não decididas aqui): Aspirante (diluído) conta como arquétipo? Para NPC e simulado o gatilho é por elemento (tema) ou por escola derivada (opção B)? Em Arena em grupo, quantas invocações simultâneas são aceitáveis?
