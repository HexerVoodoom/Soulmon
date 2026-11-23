# Companheiro invocado: gatilho (Evocação), tipo por elemento, Maslin e plano em PRs

Data: 16/11/2026. Base: `origin/main` @ `773d10cf1` (a main local está atrasada). Só análise e proposta: nenhum código, commit nem escrita em produção. Complementa `docs/PLANO-COMPANHEIRO-INVOCADO-2026-11-16.md` e substitui, onde conflitar, as decisões Q1/Q2/Q5/Q7/Q8 dele.

Decisões finais do dono (16/11) que governam este documento:
a) o GATILHO é a classe Evocador ou o especial do tipo Evocação; o elemento só orienta o TIPO/aparência do companheiro (a descrição vem da descrição gerada do summon);
b) summons que JÁ têm companheiro na descrição não recebem sprite nem invocação, só os NOVOS;
c) só a jogadora Maslin recebe retroativo; o jogador real de Sabá existente não muda; descrições existentes nunca são reescritas; NPC, simulado e fake nunca;
d) estágios acompanham a forma (forma nova sem companheiro = perde), sem cura (só TANQUE=escudo e DANO=DoT), teto +2 gerações, sem backfill geral.

---

## 1. O que existe no código sobre "Evocação" (resposta direta)

1. **Não existe classe literal "Evocador".** Existem 79 arquétipos emergentes do class-system (`CLASS_TITLE_EN`, `src/utils/soulProfile/ficha/classTitle.ts:47-130`). Os de tema convocar/pacto/natureza/mortos são: `invocador` (Summoner, `:97`), `senhor_das_feras` (Beastlord, `:58`), `xama_totemico`, `necromante` (`:51`), `demonologista`, `verdejante` (Verdant Warden, `:52`), `senhor_dos_mortos_vis`, `bokor`, `escriba_do_pacto` (`:126`). O PT do nome vem ao vivo do motor `class-system` (pacote que NÃO está instalado aqui; as condições exatas de cada arquétipo ficam lá e não pude lê-las).
2. **Não existe "especial do tipo Evocação".** `EscolaSkillId = Exclude<EscolaId,'evocacao'>` (`ficha/types.ts:24`, comentário `:20-23`): evocação "nunca é escola de skill, de golpe, de papel da Arena nem de família do especial". `escolaDominante` (`ficha/skills.ts:151`) só olha as 5 escolas de skill. As famílias do especial são `direct, dot, heal, shield, atkBuff, defDebuff, spdBuff` (`combate/specials.ts:39`), nenhuma é "invocação". Hoje o único "tipo evocação" real é a ESCOLA `evocacao` como pontos da ficha (captura do companheiro, `ficha/capture.ts:25-37`; piso fixo `evocacaoFixo: 4` por estágio, `buildSheet.ts:47`, aplicado em `distribuirEscolas`, `:208-224`).
3. Logo, o gatilho "classe Evocador OU especial de evocação" precisa ser DEFINIDO. Proposta (recomendada) na seção 3: gatilho = escola dominante da ficha do estágio incluindo evocação, OU arquétipo do estágio na lista acima. Criar uma família de especial "invocação" não é necessário e mexeria no combate (fora do pedido).

## 2. A escola/classe muda ao longo dos estágios? (pergunta do dono)

**Escola dominante (com evocação): em regra NÃO muda entre rookie, champion, ultimate, mega e ultra do mesmo Soulmon. A classe (arquétipo) MUDA.**

Por quê, com arquivo:linha:
- `buildFicha(nome, oracle, stage, ...)` (`buildSheet.ts:391`) recebe sempre os MESMOS eixos do Oráculo (`oracle.roles/alignments/dominantRole/dominantAlignment`, fixos no perfil) e só troca o `stage` (orçamento: `STAGE_MULTIPLIER` `:55`). `fromInput.ts:62` chama `buildFicha(input.fullName, oracleAxes, stage, seedKey, undefined, plano, ...)` para os 5 estágios com o mesmo `oracleAxes`.
- A escola dominante é `ROLE_SCHOOL_BY_ALIGNMENT[dominantRole][dominantAlignment]` (`buildSheet.ts:193`, uso `:461`), tabela papel x CAMINHO do Oráculo. Evocação lidera em: tanque+harmonia, tanque+benevolência, mágico+benevolência (`:195-197`). O piso de liderança `DOMINANT_SCHOOL_LEAD=1.15` (`:164`) e `distribuirEscolas` (`:208`, até 6 rodadas, reconfere em PONTOS depois do piso fixo) fazem essa escola ser a maior em todos os estágios (medido em N=800 pelo autor do código, comentário `:170-190`).
- O "galho" de evolução do jogador (`champion-power` etc.; registrado em `fichaJornada.estagios[st].galhos`, `utils/fichaJornada.ts`) NÃO entra nas escolas. Ele entra só no `plano` de ELEMENTOS (`buildFicha(..., plano, PESO_COMPORTAMENTO)`, `:412-414`) e na FAMÍLIA do especial (`estabilidadeFamilia`, `fromInput.ts:53-67`). As escolas só mudam por `boost` (renascimento: `escolas[boost.escola] = max+1`, `buildSheet.ts:469-476`; entrada em `comportamento.ts:118,141`) ou se o jogador renasce/Hexsmith reescreve.
- Ressalva: não rodei a medição "escola dominante por estágio" (suíte pesada, disco quase cheio). Proposta de teste no PR 1: para N seeds, `argmax(ficha.escolas)` incluindo evocação nos 5 estágios; esperado = igual. Se a medição achar divergência (borda do loop de 6 rodadas), vale a ficha por estágio salva.
- A CLASSE (arquétipo) é por estágio e muda: `computeClassTitlesAllStages` (`classTitle.ts:285`) escolhe, por identidade, entre os arquétipos que a ficha DAQUELE estágio conquistou, e cai em "Adepto de X" (`origem: generico`) quando nenhum nasceu (rookie). Exemplo real em produção (só a classe, sem dado pessoal): o save de Druidismo tem rookie e champion = "Industrial Adept" (genérico), ultimate = "Verdant Warden", mega = "Arcane Arsenal", ultra = "Scribe of the Pact".

### O que muda por estágio

| Item | rookie | champion | ultimate | mega | ultra | Fonte |
|---|---|---|---|---|---|---|
| Eixos do Oráculo (papel/caminho) | fixos | fixos | fixos | fixos | fixos | `fromInput.ts:62` |
| Escola dominante (com evocação) | X | X | X | X | X (mesma) | `buildSheet.ts:461,208` |
| Orçamento de pontos de escola | menor | cresce | cresce | cresce | maior | `buildSheet.ts:55` |
| Elementos (plano do galho) | automático | muda | muda | muda | muda | `buildSheet.ts:412` |
| Família do especial | da seed | só muda com perfil forte | idem | idem | idem | `estabilidadeFamilia` |
| Arquétipo/classe | genérico (comum) | muda | muda | muda | muda | `classTitle.ts:285` |
| Escola de skill (sem evocação) | sempre exclui evocação | | | | | `skills.ts:151` |

### Regra de existência do companheiro (ajustada)

O companheiro de UM estágio existe enquanto, NAQUELE estágio, vale: (A) escola dominante da ficha (incluindo evocação) = evocação OU (B) o arquétipo do estágio está na lista de evocação (seção 1, item 1). Se a forma nova não satisfaz A nem B, o companheiro some naquela forma (não é apagado do save: fica guardado, ver Q5). Como A é estável pelos eixos, na prática o que faz alguém "perder" é B (a classe mudar), e quem entra por A só perde por renascimento com `boost` de outra escola.

### A ficha por estágio está salva?

NÃO. O save guarda: `fichaJornada.estagios[st] = {galhos, at, plano?, familia?}` (`fichaJornada.ts`), `soulmonSkills` por estágio (básica/especial), `soulmonClassTitles` por estágio (`GameStateContext.tsx:455`; "primeiro valor vence", `App.tsx:5914-5915`; guarda `{nome, origem, sigilo?}`, SEM o id do arquétipo) e `soulmonCompanheiro`. As pontuações de escola (a ficha) são recomputadas por `buildFichaESkills` na PetPage/App (`PetPage.tsx:237`, `App.tsx:5942,5962`). Consequência: o gatilho NÃO deve depender de recálculo ao vivo no combate nem no servidor. Proposta aditiva (PR 2): campo de cache `soulmonEvocacao?: Partial<Record<FichaStage, {gatilho:'escola'|'classe', classeId?:string}>>` gravado uma vez, "primeiro valor vence", no mesmo ponto em que hoje se grava `soulmonClassTitles`; e, se a lista de arquétipos for usada, `classTitle` ganha `id?` opcional (hoje só tem o nome EN). O servidor lê esse campo com lista fechada (estágio válido + gatilho em enum), nunca texto.

---

## 3. Quem dispara e como o elemento orienta o TIPO

### 3.1 Gatilho recomendado

Companheiro invocado do estágio S só quando TODAS valem:
1. Soulmon NOVO criado com a flag ligada (marcador `soulmonCompanheiro.origem = 'novo'`, só escrito pelo fluxo de criação; saves existentes não têm o marcador, então nunca entram, inclusive o Sabá real) OU conta na allowlist da Maslin (seção 5);
2. estágio S satisfaz A ou B da seção 2;
3. a família do especial do jogador é `shield` (TANQUE) ou `dot` (DANO) (Q2);
4. a conta não é NPC/`sim_`/fake (seção 5).

### 3.2 Elemento = guia de aparência (tabela por elemento BASE; derivado/curado herda do 1º componente)

Quantos elementos existem: 20 base + 190 pares (`derivedElements.ts`, C(20,2)) + 59 curados (`elementosCurados.ts`: 50 dos lotes 1-3 + 6 do lote 4 + 3 promovidos) + `neutro` = **270** (`elementDex.ts:13`). O elemento não decide QUEM recebe (isso é o gatilho), só o TIPO. "Tendência a gerar companheiro" abaixo = o elemento tem criatura capturável própria no `CLASS_DATA.criaturas` (32 criaturas, `classSystem.data.json`); "só tabela" = sem criatura: o companheiro vem desta tabela porque a captura nunca o produziria (tempo, som, gravidade, espaço, fada, industrial; planta só via vida/terra).

| Elemento | Tendência | Tipo | Papel sugerido (postura do sprite) | Nome PT / EN (provisório) | Descrição EN (prompt do sprite) |
|---|---|---|---|---|---|
| vida | alta (lobo, urso, felino, falcão, fênix menor) | animal | tanque (shield/curaContinua) | Cervo-Broto / Budfawn | spotted fawn with budding antler nubs, warm cream and moss coat, calm watchful eyes |
| planta | só tabela (ent/trevo via vida+terra) | planta/espírito | tanque (shield/seiva) | Raposa-Cipó / Vinefox | forest-spirit fox with a crown of woven branches, bark-brown fur, leaf-tipped tail, gentle expression |
| fada | só tabela | espírito | tanque (shield/poDeFada) | Lumela / Glimmerling | tiny moth-winged sprite with a dandelion-puff mane, soft pastel glow, playful calm face |
| fogo | alta (salamandra, cão de lava, fênix, dragão jovem) | elemental/animal | dano (dot/queimadura) | Salamandra-Brasa / Embercrawl | ember salamander with a candle-flame tail, charcoal skin with glowing orange cracks |
| agua | alta (serpente marinha, tubarão) | animal | tanque (shield/defesaAgua) | Lontra-Fonte / Brooklet | river otter spirit with a droplet-shaped crest, teal-blue sheen, relaxed pose |
| terra | alta (javali, golem, slime) | construto/animal | tanque (shield/defesaTerra) | Toupeira-Rocha / Pebblemole | boulder-backed mole with mossy stone plates, small amber eyes |
| ar | alta (falcão, coruja, wyvern) | animal | dano (spdBuff; temático) | Andorinha-Nuvem / Cloudswift | storm-feathered swift with a cloud-tuft chest, sky-grey and white plumage |
| eletricidade | baixa (autômato) | elemental | dano (temático) | Filhote-Faísca / Sparkkit | static-fur fox kit with a forked spark tail, pale yellow fur |
| arcano | alta (coruja, arauto élfico, dragão jovem) | espírito/animal | dano (temático; selado) | Coruja-Runa / Runeowl | owl with rune-etched wing tips and a floating violet rune, deep indigo feathers |
| sombra | alta (felino, sombra rastejante, tubarão) | espírito | dano (maldição; temático) | Gato-Fumaça / Smokecat | shadow cat dissolving into smoke at the paws, faint violet eyes |
| luz | média (anjo menor, fada) | espírito | tanque (temático; ofuscado) | Mariposa-Lanterna / Lanternmoth | small lantern-winged moth, soft golden glow, serene |
| vileza | alta (imp, demônio maior, olho vil) | demônio | dano (dot/veneno) | Diabrete-Espinho / Thornimp | imp-like gremlin with curled thorns and a sly grin, plum-red skin |
| morte | alta (ghoul, cavaleiro morto, espectro) | espírito/morto-vivo | dano (maldição; temático) | Cão-Névoa / Wisphound | pale bone-masked wisp hound, translucent grey body, quiet gaze |
| vigor | alta (urso, lobo, javali, troll) | animal | tanque (shield/folego) | Filhote-Faixa / Bandcub | stout cub with banded muscle stripes, amber chest mark |
| marcial | baixa (batedor orc, cavaleiro morto, autômato) | animal | tanque (temático; postura) | Falcão-Crista / Plumeguard | crested hawk with armored-feather plates, steady stance |
| tempo | só tabela | espírito | tanque (temático; retardo) | Coruja-Areia / Hourglassowl | small sand-drift owl with an hourglass-shaped chest patch |
| som | só tabela | espírito | dano (temático; silêncio) | Gralha-Sino / Bellfinch | small bronze-bell finch that hums, brass-gold feathers |
| gravidade | só tabela | construto/espírito | tanque (shield/escudoPeso) | Seixo-Órbita / Orbitpebble | dark stone pup with a small ring of pebbles orbiting it |
| espaço | só tabela | espírito | dano (temático; distorção) | Gato-Estrela / Starcat | small cat-shaped spirit with a ring of stars around the neck, deep blue body |
| industrial | só tabela (autômato é marcial/eletricidade) | construto | tanque (shield/blindagem) | Autômato-Rebite / Rivetling | small aged-plate automaton with a round lantern eye, no gears on the outside, calm |

Regra de herança (como `efeitoDoEspecial`, `combate/elementEffects.ts:70-80`): derivado/curado usa o tipo do 1º componente (o dominante) e acrescenta UM traço do segundo. Overrides dos casos nomeados pelo dono (valem só para Soulmon NOVO desses elementos):
- **Druidismo** (planta+arcano; `derivedElements.ts:245`): animal da natureza. EN: "forest-spirit fox with a branching antler crown, moss-green and bark-brown fur, glowing violet rune marks on the flanks, leaf-tipped tail, gentle calm expression". PT/EN: Raposa-Ramo / Antlerfox.
- **Sabá** (curado nº 227, arcano+sombra+vileza, `elementosLote1.data.ts:24`; `base: sombra` no save real): espírito das trevas/demônio. EN: "small hunched shadow-demon familiar, violet-black smoke body, tiny curled horns, glowing violet eyes, ember-cinder runes along the arms, calm watchful expression". PT/EN: Familiar-Cinzas / Cinderfamiliar.

Papel real = família do especial do jogador (Q2); o papel da tabela só decide a postura do sprite. Descrições originais, sem franquia; regra de identidade do Soulmon: sem cristal turquesa/cano de cobre/circuito/folha como moldura, a menos que o próprio elemento peça (planta, industrial); sem engrenagem.

Elementos que tendem a gerar companheiro por ESCOLA (gatilho A): os que o Oráculo manda para tanque/mágico com harmonia/benevolência, independentemente do elemento. Por ARQUÉTIPO (B): os de natureza/trevas/mortos (vida, planta, fada, vileza, morte, sombra, arcano) dominam a lista. Não há corte por elemento: todo elemento de 270 tem tipo definido pela herança.

---

## 4. Estágios, perda e teto de gerações

- O companheiro do estágio S existe se A ou B vale em S. Forma nova sem A nem B: perde (some da cena e do texto), sem apagar nada do save. Evoluir de volta (degeneração e reevolução ao mesmo estágio reusa o registro imutável, `fichaJornada.ts`) devolve o mesmo companheiro.
- Teto +2 gerações vitalício (1 sprite + 1 refeitura por recusa) NÃO comporta um sprite por estágio (5 estágios). Para "evoluir junto" com esse teto, o companheiro é 1 sprite reaproveitado, escalado como o Soulmon (`petScaleFor`) e com o texto/bio acompanhando a forma (Q3).

## 5. Quem recebe: Maslin, Sabá, NPC (dados lidos em produção, somente leitura, 16/11)

Leitura: `wrangler kv key list` e `kv bulk get --remote` no `SOULMON_SAVES`; nenhum e-mail, id de conta nem dado pessoal foi copiado para este documento.

- **Existe um save real da Maslin: sim.** Foi achado pelo índice de apelido (`nick:` aponta para um id de save que NÃO é `sim_` e tem registro de conta). Ela é o save de DRUIDISMO: elemento `druidismo` (base planta) no ultimate, estágio atual `ultimate-benevolence`, 4 sprites na biblioteca (rookie, champion, ultimate, ultimate@druidismo), JÁ TEM companheiro `slime_cristalino` (Slime Cristalino). Classe por estágio: Adepto Industrial (rookie, champion) > Verdant Warden (ultimate, arquétipo da lista = gatilho B) > Arcane Arsenal (mega) > Scribe of the Pact (ultra, também da lista). A família do especial gravada dela é `spdBuff`: pela regra 3.1.3 ela NÃO teria invocação mesmo com sprite (Q2).
- **O save de Sabá:** é outro save real (elemento `sabbat`, base `sombra`; formas original+sabbat+fada, estágio `ultimate-power`), SEM companheiro. Por (c) fica como está: não tem o marcador `origem='novo'`, não está na allowlist, nada é gravado nele. Não há Sabá no save de Maslin e vice-versa.
- Identificar a Maslin no código: por LISTA DE IDS no servidor (variável/segredo de ambiente, nunca apelido nem e-mail), nunca por nome no cliente; o id não consta aqui por ser dado de conta.
- NPC, `sim_*`, jogadores fake: fora por construção (marcador `origem='novo'` só no fluxo de criação de conta real; geração só para conta paga/beta-full verificada; lista de exclusão explícita de ids de teste que o dono informar). `spriteFromSaveState`/`duelSide` ignoram quem não tem o campo.
- Descrições existentes nunca reescritas: a bio da Maslin ("Vínculo com um companheiro Slime Cristalino") fica; o sprite dela é gerado a partir da descrição do companheiro que ELA já tem (Q4).

---

## 6. Plano em PRs atualizado (o que muda em relação ao de ontem)

Mudanças em relação a `PLANO-COMPANHEIRO-INVOCADO` §8: (1) o papel CURA sai (sem `heal`, sem `hot`, sem Q4 do plano antigo); só `companheiroPapel`: `shield` sem hot = tanque, `dot` = dano, o resto = nenhum; (2) a tabela por elemento deixa de decidir quem recebe: passa a ser só guia de TIPO (seção 3.2); (3) o gatilho passa a ser A/B por estágio, cacheado no save; (4) estágios acompanham a forma; (5) teto +2 (não +N); (6) sem backfill geral, só Soulmon novo + allowlist da Maslin; (7) tudo atrás de UMA flag que gateia geração, cena e `fx.companheiro`.

| PR | Conteúdo | Notas / testes |
|---|---|---|
| 1 | `src/utils/companheiro/`: `companheiroPapel` (sem cura), tabela elemento→tipo/descrição/nomes (20 base + overrides Druidismo/Sabá + herança), lista de arquétipos de evocação, `gatilhoDoEstagio(fichaOuCache)`; espelho `functions/api/_companheiro.js`. Nada ligado. | Paridade src x functions; cobertura dos 270 ids; teste "escola dominante com evocação igual nos 5 estágios" em N seeds; `combate/*` não importa o módulo. |
| 2 | Campos aditivos no save: `soulmonCompanheiro.{origem,desc,sprite}`, `soulmonEvocacao` por estágio, `ClassTitle.id?`; sanitizador em `save.js`; `_artLine.js` com campo próprio (nunca em `spriteLibrary.sprites`, `_artLine.js:68`). | `saveCompat.contract.test.ts`, fuzz; "primeiro valor vence" idempotente; save sem os campos hidrata idêntico. |
| 3 | formId `companheiro` em `_aiGuard.js` + teto de gerações +2 (1 + 1 refeitura); compositor do prompt (descrição do summon + tipo da tabela + cláusula anti-franquia). | Tetos por forma/vitalício, kill switch, exclusão LGPD. |
| 4 | Cliente: geração sob demanda só para Soulmon novo com `origem='novo'` e gatilho válido, e para a allowlist (Maslin). Sem backfill em lote. | Idempotência; Sabá real e saves antigos intocados (fixture); NPC/sim nunca disparam. |
| 5 | `BattleStage` `summon` (derivado de `StageStatus`), só quando papel é escudo/dot e o estágio atual tem o gatilho; sem `boss`/Raid. | Layout 1-3 inimigos, 8 chamadores, reduced-motion. |
| 6 | `fx.companheiro` (lista fechada: estágio + papel) e `companionSpriteUrl` do oponente. | Paridade `fighterIdentity`; cliente antigo ignora. |
| 7 | Ligar flag (conta a conta; Maslin primeiro) e prova "mesmos eventos de `fight()`/`groupFight()` com e sem companheiro" nas famílias. | Medir custo real por sprite. |

---

## 7. Perguntas restantes para o dono (cada uma com opções e UMA recomendada)

**Q1. O que conta como "classe Evocador / especial de evocação" (hoje não existe nenhum dos dois por nome)?**
- A (recomendada): escola dominante da ficha do estágio = Evocação (inclui tanque harmonia/benevolência e mágico benevolência) OU arquétipo do estágio na lista: invocador, senhor_das_feras, xama_totemico, necromante, demonologista, verdejante, senhor_dos_mortos_vis, bokor, escriba_do_pacto.
- B: só a escola (A sem lista de arquétipos); mais simples e estável nos estágios, mas a Maslin só entra se a escola dela for evocação (não medi).
- C: criar uma família de especial "invocação" no combate (muda `combate/*`, balanceamento).

**Q2. O papel vem de onde?**
- A (recomendada): da família do especial que o jogador JÁ tem (`shield` = tanque, `dot` = dano); quem tem outra família não vê invocação. Efeito: a Maslin (`spdBuff`) não veria nada até trocar de especial.
- B: da tabela por elemento, aparecendo para toda família (cosmético, mente quando a família não tem escudo/DoT).
- C: A, e o dono autoriza trocar o especial da Maslin para escudo ou DoT (Hexsmith/`hexOverrides`) só para teste dela.

**Q3. "Evolui junto" com teto +2 gerações:**
- A (recomendada): 1 sprite único reaproveitado e escalado em todas as formas que têm o gatilho; some quando a forma não tem.
- B: um sprite por forma (até 5 gerações, estoura o +2).
- C: 1 sprite no Champion/Ultimate e 1 refeitura no Ultra (cabe no +2, mas só 2 aparências).

**Q4. Maslin já tem Slime Cristalino (não é "animal da natureza" do Druidismo):**
- A (recomendada): manter o Slime (não reescrever descrição existente) e gerar o sprite dele.
- B: trocar para a raposa-ramo do Druidismo só no sprite e na descrição dela (contradiz "descrições existentes nunca reescritas").
- C: Slime agora; raposa-ramo se ela renascer.

**Q5. Forma sem gatilho: o que acontece com o sprite e o registro?**
- A (recomendada): fica guardado (sem apagar, sem nova geração) e reaparece se a forma voltar a ter o gatilho.
- B: apagado ao evoluir (obriga gerar de novo e gasta o teto).

**Q6. Quem é "jogador real" e como excluo os fake?**
- A (recomendada): marcador `origem='novo'` só no fluxo de criação de conta real paga/beta-full + allowlist de ids (Maslin) + lista de exclusão de ids de teste que o dono informar.
- B: apenas allowlist manual de ids (ninguém além da Maslin enquanto a flag estiver em teste).

**Q7. Quando medir a escola dominante por estágio (teste do PR 1)?**
- A (recomendada): antes de qualquer outro PR; se divergir em algum estágio, o gatilho passa a depender do cache `soulmonEvocacao` por estágio.
- B: aceitar o cache de saída (PR 2) e não medir.

(Não pendentes: cura fora, sem backfill, Sabá real intocado: decididas.)
