# Plano: companheiro invocado no especial (levantamento e proposta)

Data: 16/11/2026. Base lida: `origin/main` @ `32a9fd8b2` (a main local está atrasada; toda referência abaixo é `arquivo:linha` desse commit).
Escopo desta entrega: SÓ levantamento e proposta. Nada de código, commit nem escrita em produção. A leitura de produção foi só `wrangler kv key list` e `kv bulk get --remote` no namespace de saves; nenhum e-mail, nome ou dado pessoal entrou aqui, só contagens e ids de classe.

Pedido do dono, resumido: o companheiro capturado do Oráculo ("Vínculo com um companheiro X") é bom e deve ganhar função em combate. Em certos elementos o especial passa a INVOCAR o companheiro, que aparece um pouco à frente do Soulmon e dura 3 rodadas, com função por papel (tanque = escudo, dano = DoT, cura = HoT). É forma cosmética de efeitos que já existem. Cada Soulmon tem o SEU companheiro, com sprite gerado no mesmo pipeline. Só jogadores reais daqui para frente, ou que já tenham o companheiro descrito. O jogador de Sabá existente não pode ser alterado como efeito colateral.

---

## 0. Resumo executivo

1. A mecânica pedida JÁ existe e basta vestir. Escudo, DoT e HoT (3 golpes de quem os carrega) são `shield`, `dot` e `shield + effect:'hot'` no núcleo v3. O papel (tanque/dano/cura) sai da FAMÍLIA do especial que o jogador já tem; nenhuma regra nova de dano, nenhum botão de calibração novo.
2. O companheiro de hoje é só um id + nome no save (`soulmonCompanheiro`, só texto: sem descrição, sem sprite, sem papel) e uma frase na bio. Não há arte nem descrição por jogador. Precisa de 3 coisas novas: (a) descrição por jogador, (b) sprite gerado, (c) papel derivado.
3. O companheiro de hoje NÃO é "da natureza" para Druidismo: o save real de Druidismo tem `slime_cristalino`. A captura usa os elementos BASE da ficha, não o elemento derivado (Druidismo = planta+arcano; Sabá = arcano+sombra+vileza). Se o dono quer "Sabá = espírito das trevas" e "Druidismo = animal da natureza", é preciso uma tabela elemento -> companheiro (pergunta Q1).
4. Produção: 27 saves de jogadores não simulados (mais 170 `sim_`); 7 têm companheiro (26%, 5 criaturas distintas); 1 conta paga, 16 demo. Existe 1 save Sabá (`ultimate:sabbat`) SEM companheiro e 1 Druidismo (`ultimate:druidismo`) COM `slime_cristalino`. Backfill de quem já tem companheiro custa no máximo ~US$ 0,17.
5. Maior risco técnico: sprites de OUTROS jogadores. O servidor publica o sprite do oponente a partir do save (`spriteFromSaveState`), e esse extrator tem um fallback que pega QUALQUER entrada de `spriteLibrary.sprites`. Se o sprite do companheiro morar lá, ele vaza para o lugar do sprite principal. Tem de morar em campo próprio.
6. Plano em 7 PRs pequenos (seção 8), o primeiro só dados e o último a bandeira de ligar. Nada paga vantagem de combate; teste prova que `fight()` gera os MESMOS eventos com e sem companheiro.

---

## 1. (a) Como o companheiro é escolhido e capturado hoje

### 1.1 Fluxo
- Mecânica real do class-system copiada: `src/utils/soulProfile/ficha/capture.ts`
  - Constantes `CAPTURA_BASE=8`, `CAPTURA_POR_NIVEL_ELEMENTO=4`, `CAPTURA_POR_EVOCACAO=3` (`capture.ts:18-20`); `poderCaptura` (`:22-27`); `avaliarCaptura` exige `evocacao > 0` E afinidade > 0 E `poder >= poderBase` (`:36-42`).
  - `selectCompanion(ficha, seedKey)` (`:57-62`): sorteio semeado (`mulberry32(hashString(seedKey|companion))`) sobre TODAS as criaturas capturáveis, não só a mais forte. Determinístico por jogador.
- Reduzido ao que se mostra: `src/utils/soulProfile/ficha/companheiro.ts` (`CompanheiroVisivel = {id, nome:{pt,en}}`, `:61-64`; nome PT ao vivo do snapshot, EN em `COMPANHEIRO_EN` por id, `:25-58`; `companheiroVisivel`, `:73-76`). Decisão 2 do dono, `docs/PLANO-ORACULO.md` §9 ("companheiro nomeado e visível", marcado feito).
- Na criação: `generateOracleComplete` devolve `companion`; vira `companionName` no `OracleInput` (`src/utils/oracle.ts:125-136`) e a ÚLTIMA frase da bio: `Vínculo com um companheiro ${pt}.` / `Bonded with a ${en} companion.` (`src/utils/oracle/motor.ts:2524-2529`, concatenada em `richConceptPt/En` logo abaixo). Só entra quando não há `petDescription` do jogador. O companheiro NÃO entra no prompt de sprite do Soulmon (só na bio).
- No jogo: `PetPage.tsx:245-262` recomputa `selectCompanion(fichaByStage.mega, identityKey(saved))` e grava o cache `GameState.soulmonCompanheiro` (`GameStateContext.tsx:456-461`, hidratação tolerante `:1682-1688`) por `handleCompanheiroComputed` (`App.tsx:5920-5922`, "primeiro valor vence": `prev.soulmonCompanheiro ? prev : ...`). Também refaz em `jornadaRefresh.ts:34` (`App.tsx:5994`).
- ARMADILHA que explica o Sabá sem companheiro: o cache só é preenchido quando a PetPage monta num aparelho que tem o perfil do oráculo no `localStorage` (`saved`). Save restaurado/nuvem sem perfil local, ou jogador que nunca abriu a página do Pet depois da Fase 3, fica sem `soulmonCompanheiro` mesmo sendo capturável. Ausência no save não prova "não capturável".
- O servidor nunca lê `soulmonCompanheiro` (grep em `functions/` = só texto de chat). `save.js` passa o campo sem sanitizar.

### 1.2 Elementos e criaturas-companheiras (CLASS_DATA)
O registro (`src/utils/soulProfile/ficha/classSystem.data.json`, `CLASS_DATA.criaturas`, `buildSheet.ts:31`) tem 32 criaturas. Afinidade de cada uma é por elemento BASE (lista `CLASS_ELEMENT_ORDER`, 20 ids: `src/utils/soulProfile/types.ts:40-44`).

Criaturas por afinidade (poderBase entre parênteses):
- vida/vigor: lobo (24), urso (42); vida/sombra: felino (38); vigor/terra: javali (30), troll_montanhes (56); vigor/fogo: ciclope_forjador (74); marcial/vigor: batedor_orc (32)
- ar/vida: falcao (26); ar/arcano: coruja (34), arauto_elfico (46); ar/fogo: wyvern (90)
- agua: serpente_marinha (48); agua/sombra: tubarao (52); agua/vileza: gosma_acida (26); terra/agua: slime_cristalino (40)
- fogo: salamandra (30); fogo/terra: cao_de_lava (46); fogo/vida: fenix_menor (72); fogo/arcano: dragao_jovem (120); vileza/fogo: demonio_maior (80)
- morte: ghoul (28); morte/marcial: cavaleiro_morto (58); morte/arcano: espectro (44)
- sombra: sombra_rastejante (32); vileza: imp (30); vileza/arcano: olho_vil (50)
- vida/terra: trevo_carnivoro (22), ent (64)
- arcano/luz: fada (26); luz: anjo_menor (68)
- terra: golem_pedra (54); eletricidade/marcial: automato (60)

Elementos BASE SEM nenhuma criatura-companheira própria (nunca capturam por afinidade deles): `tempo`, `som`, `gravidade`, `espaco`, `fada` (a criatura "fada" liga em arcano/luz, não no elemento fada), `industrial` e `planta` (planta só pega criatura via vida/terra: ent, trevo). `eletricidade` só tem o autômato (junto com marcial). Os ~190 elementos derivados (pares) e os 59 curados NÃO têm afinidade própria: o jogador captura pelos pontos BASE da ficha.

Sabá (`sabbat`, curado nº 227, `arcano+sombra+vileza`, `src/utils/elementosLote1.data.ts:24`; base dominante pelo 1º componente = `arcano`, `functions/api/_elementoBase.js`): quem tem pontos em sombra/vileza/arcano + evocação pode capturar felino, tubarão, sombra_rastejante, olho_vil, imp, demônio_maior, espectro, coruja, fada, etc., mas é sorteio, não "espírito das trevas". Sem tabela por elemento o resultado não tem relação garantida com o elemento exibido.
Druidismo (`druidismo`, `planta+arcano`, `src/utils/soulProfile/derivedElements.ts:245`): a captura real do save de produção deu `slime_cristalino` (terra/água), não um animal.

### 1.3 "Classe/vocação"
O pedido fala em "classes/vocações com companheiro". Hoje classe é invisível ("classe salva e não exibida", PLANO-ORACULO) e a decisão 3 proíbe número/taxonomia visível. A proposta usa o ELEMENTO do Soulmon (o mesmo que decide o sabor do especial, `src/utils/fighterIdentity.ts:15-17, 96-103`) como chave, e a FAMÍLIA do especial como papel. Nenhuma classe vira texto visível.

---

## 2. (b) O especial no combate v3

### 2.1 Onde mora
- Núcleo: `src/utils/combate/specials.ts` (famílias `SPECIAL_FAMILIES`: direct, dot, heal, shield, atkBuff, defDebuff, spdBuff, `:39`; orçamento `SPECIAL_BUDGET_HITS=3`, `:36`; potências `SPECIAL_POWER` PvP `:56-64`, `SPECIAL_POWER_PVE` `:70-72`, por motor `PVE_FAMILY_POWER` `:170-174`; energia 100 dispara, `ENERGY_TRIGGER`, `:130-131`).
- 1v1 (PvP, Torneio, treino, simulados): `src/utils/combate/fight.ts` — `cast` (`:325-350`); DoT fica em quem recebe e tica nos PRÓXIMOS 3 golpes dele (`DOT_TICKS = 3`, `fight.ts:231`, `functions/api/_combate.js:254`).
- Grupo/PvE (Arena, Masmorra, Pesadelo, Fenda, Raid): `src/utils/combate/group.ts` — `tickOwnTurn` (`:244-260`, tick de DoT e pulso de HoT no começo de cada golpe de quem os carrega, §334) e `cast` (`:263-330`). Escudo "hot" = `case 'shield'` com `sp.effect === 'hot'`: 3 pulsos de E/3 (`:298-305`).
- Efeito por elemento (sabor): `src/utils/combate/elementEffects.ts` — `TABELA`/`TABELA_11`/`MECANICA`, `efeitoDoEspecial` (derivado herda do 1º componente que tem efeito), `comEfeitoDoElemento`. `curaContinua`, `seiva`, `poDeFada`, `folego` = `hot`.
- Qual família o jogador tem: a da skill ESPECIAL da ficha (`StageSkill.familia`), `familyOfSkill` (`src/utils/arena.ts:188-191`; padrão por escola `:172-186`); a identidade única é `fighterIdentity` (`src/utils/fighterIdentity.ts:96-104`). Servidor: `duelSide` (`functions/api/_duel.js:222-`) com a família gravada em `fichaJornada` (imutável, PR15c) e Hexsmith (`hexOverrides`) podendo reescrever família e elementos.
- Espelho no servidor: `functions/api/_combate.js` (+ `.d.ts`) e `functions/api/combate.parity.test.js`; identidade `src/utils/fighterIdentity.parity.test.ts`; elemento base `elementoBase.parity.test.js`; calibração `efeitosPve.medicao.test.ts`.

### 2.2 Efeitos existentes que equivalem ao pedido (reuso, zero mecânica nova)
| Papel do dono | Efeito já existente | Prova no código |
|---|---|---|
| TANQUE = absorve dano 3 rodadas | família `shield` (absorção do orçamento de 3 golpes; contador `shieldHits`) | `fight.ts:340-342`, `group.ts:306-312` (`aplicarEspecialPessoal`), `specials.ts:26-33` (§327: absorve 100% do básico, 50% do especial direto e do tick) |
| DANO = 1 ataque por rodada | família `dot` (3 ticks nos próximos golpes de quem recebe) | `fight.ts:333-336`, `group.ts:276-282`, `tickOwnTurn` |
| CURA = cura por rodada | `shield` + `effect:'hot'` (3 pulsos), só PvE; no PvP não há `effect` (PvP nunca chama `comEfeitoDoElemento`) | `group.ts:298-305`, `elementEffects.ts` `MECANICA`, `EFEITOS_PVE_LIGADOS` |
| (cura instantânea) | família `heal` | `fight.ts:337-339`, `group.ts:309-312` |

Observações que mudam o desenho:
- "3 rodadas" na verdade é "3 golpes de quem carrega o efeito" (o combate é em tempo real por energia; `DOT_TICKS=3`), não turnos de cliente. A duração do companheiro em cena deve seguir o CONTADOR REAL que o núcleo expõe, não um timer.
- Esse contador já chega à cena: `withRealFx` (`src/utils/combatFx.ts:628-`) troca a aproximação por `shieldHits`, `dot`, `hot` reais por lutador (`:653-660`), e `StageStatus {kind, turns}` (`:524-528`) é o que `BattleStage` desenha. `FAMILY_STATUS` (`:447-455`) liga família a selo (`escudo`, `dot`, `cura`); `isSelfOnlySpecial` (`:466`) decide que cura/escudo/buff animam só no conjurador.
- Cura em PvP: a família `heal` é instantânea (sem duração) e `hot` não existe fora do PvE. Para o papel CURA no Duelo/Torneio há duas leituras (pergunta Q4).
- Famílias sem papel de invocação: `direct`, `atkBuff`, `defDebuff`, `spdBuff`. Nelas o especial continua exatamente como hoje (nada de companheiro).

---

## 3. (c) Renderização na cena de combate

- Peça única: `src/components/games/BattleStage.tsx` (1281 linhas), usada por 8 chamadores: `ArenaGame.tsx:412`, `DuelScreen.tsx:337` (Duelo e Torneio fantasma), `DungeonGame.tsx:794`, `NightmareBattle.tsx:362`, `RogueFight.tsx:150`, `guild/BossFightScreen.tsx:235`, `guild/BossCheerPrelude.tsx:61`, `guild/GroveRaidFight.tsx:108`. Uma mudança aditiva no palco cobre todos.
- Layout em px (`stageLayout`, `BattleStage.tsx:187-222`): `me` embaixo à esquerda (x >= 0,32 L, tamanho até 300 px, pés abaixo do campo), inimigos em cima à direita (`foeSize` 0,66 ou 0,5 de `me`). "Um pouco à frente do invocador" cabe entre os dois: x ≈ `me.x + me.size*0.5`, y ≈ 0,78-0,82 da altura, tamanho ≈ 0,45 de `me.size`, `zIndex` acima do `me` e abaixo das barras. No modo `boss` (`:196-206`) o `me` já é pequeno; sugerido NÃO invocar em `boss` e em Raid.
- Peças reaproveitáveis: `Fighter` (`:390-440`, sprite com `useFeetShift`, `sm-bs-bounce`, espelho por `spriteUrlFacesLeft`) serve ao companheiro com um `StageFighter` sem barras; `Fx`/`sm-bs-pop` (entrada), `sm-bs-lunge` (investida do DANO a cada tick), `fxFrame(el,'aura')` (pulso do CURA, `:805-818` já faz o `selfOnly`), `sm-bs-hit` (pulso do escudo ao absorver).
- Gatilho e duração: derivados de `StageStatus` do `me`: aparece quando surge `escudo` (TANQUE) ou `hot`/`cura` (CURA) no `me`, ou `dot` com `source = me` no inimigo (DANO), e some quando `turns` chega a 0. Isso dá "3 golpes" de graça e acompanha a luta real, inclusive o §334 (tick no turno de quem carrega). No Duelo o evento do lado do oponente chega pelo mesmo `fx`.
- Reduced-motion: `prefersReducedMotion` (importado em `BattleStage.tsx`) já remove lunge/projétil; o companheiro vira só fade + pulso estático.
- Custo de render: 1 `<img>` 256² cacheado (o sprite) + 1 medição de pés por sprite (`useFeetShift`) + 1-2 animações CSS já existentes. Sem canvas novo, sem rAF novo. O custo real é de REDE: 1 PNG por jogador visível (dezenas de KB, `Cache-Control immutable`, `sprite-image.js`).
- Onde NÃO renderiza: Masmorra offline/`dungeonAway` e `focusDescent` são contas puras sem cena; a Guerra de Guilda mostra só silhueta de rival (`_guerra.js`). A Masmorra idle com cena (`DungeonGame.tsx:794`) e o Pesadelo usam o mesmo palco.

---

## 4. (d) Geração e guarda do sprite por jogador

### 4.1 Pipeline atual
- Cliente compõe o prompt: `composeSpritePrompts` em `src/utils/oracle/motor.ts:1651` (chamado por estágio em `:2590-2695`); o prompt é uma lista CURTA de traços (bloco "BLOCOS DO PROMPT", `motor.ts` ~`:2495-2511`) com paleta própria; 2 variantes (`prompt` com referência de gênero, `promptFallback` sem), com a cláusula "Do not copy any existing franchise character".
- Servidor: `functions/api/generate-sprite.js` — Higgsfield API pública (alpha 2.0 por padrão, `SPRITE_MODEL`), fundo verde `#00FF00` + chroma-key no servidor (`:252-262`, `_chroma.js`), fallback Soul/Gemini; republica o PNG em `sprite:blob:<token>` (KV, `:110, 181-`); cache do resultado em `sprite:img:<saveId>:<formId>`; dedupe multi-device + lock 120 s (`:82-100`); 402 para conta que não é paga (`requirePaidTier`, admin e beta-full passam); revisão automática `_spriteReview.js`; entrega `GET /api/sprite-image?k=<32hex>` imutável (`sprite-image.js:20-62`).
- Formas válidas hoje: `VALID_FORM_ID = /^(?:bb|rookie|(?:ultra|(?:champion|ultimate|mega)-(?:power|harmony|benevolence))(?:@[a-z_]{2,24})?)$/` (`_aiGuard.js:243`). O companheiro precisa de formId novo (ex.: `companheiro`) com teto por forma.
- Tetos (`_aiGuard.js:123-136`): produção prevista `perAccount 6 / perAccountLifetime 15 / perFormLifetime 1`; hoje liberados `60 / 500 / 20` para o teste; global `globalDay 40`, `globalMonth 800`. O vitalício de produção (15) é "11 formas + 4 de folga": um companheiro consome a folga, então o teto precisa de +1 ou +2 e o dono precisa saber (Q6).
- Armazenamento no save: `spriteLibrary.sprites[formId] = {url,...}` (`App.tsx:1384`).

### 4.2 Visível para OUTRO jogador
- O sprite do oponente chega pelo servidor, não pelo cliente dele: `community.js` (lista de oponentes, `:1085-1109`) usa `loadDuelSideWithSprite` (`_duelLoad.js:13-36`), que extrai `{spriteUrl, artLine}` do save por `spriteFromSaveState` (`_artLine.js:50-72`) e valida com `spriteUrlOrNull` (`_artLine.js:31`).
- Os blobs são públicos por token (`sprite-image.js`, `Access-Control-Allow-Origin: *`, imutável); o cliente do oponente carrega a URL publicada sem autorização extra.
- PERIGO: `_artLine.js:68` faz `fallbackEntry = Object.values(sprites).find(url)`. Se o companheiro entrasse em `spriteLibrary.sprites`, poderia virar o "sprite do jogador" quando a forma atual ainda não tem arte. Campo próprio obrigatório (ex.: dentro de `soulmonCompanheiro`).
- Entrega proposta: `spriteFromSaveState` ganha `companionSpriteUrl` (mesmo `spriteUrlOrNull`: só `/api/sprite-image?k=<32hex>` da nossa origem) e `duelSide(...).fx` ganha `companheiro: {id}` em lista fechada, nunca texto do save (mesmo padrão de `familia`/`elEspecial`, `_duel.js:222-`; cliente antigo ignora campo ausente, contrato aditivo, regra 3 da Compatibilidade). O `fx` do SEU lado vem de `fxDoLutador` (`fighterIdentity.ts` final do arquivo).
- LGPD/exclusão: `account.js:251-290` apaga `sprite:img:<saveId>:*`, locks e os blobs apontados por prefixo. Se o formId novo usa a chave `sprite:img:<saveId>:companheiro`, a exclusão já cobre; o teste de paridade dos 3 literais de prefixo (`account.js:255-258`) continua valendo.

---

## 5. (e) Dimensionamento em produção (somente leitura)

Namespace `SOULMON_SAVES` (`20b3ba78...`), lido em 16/11/2026 com `kv key list` + `kv bulk get --remote`. Só contagens.

- 4.345 chaves no total; ids de save "soltos" (sem `:`): 197, dos quais 170 `sim_...` (simulados, fora do escopo) e 27 não simulados.
- Entre os 27: 7 têm `soulmonCompanheiro` (26%); por criatura: `slime_cristalino` 2, `fenix_menor` 2, `salamandra` 1, `gosma_acida` 1, `fada` 1. Nenhum save tem a frase de companheiro sem o campo.
- Elemento dominante dos 27: planta 4, industrial 4, terra 3, luz 3, fogo 2, sombra 2, agua 1, ar 1, sem elemento 7 (free/demo/corvo). Estágios: 21 rookie, 6 acima.
- Família do especial gravada (15 com registro): dot 3, heal 3, shield 3, defDebuff 3, direct 2, spdBuff 1; 12 sem registro. As 3 famílias que invocariam (`shield`, `dot`, `heal`) são 9 de 15 conhecidos (60%).
- Contas (`ent:*`): 17 com entitlement, 16 `demo` e 1 `paid`. A geração de sprite vale também para admin e beta-full (`generate-sprite.js`), por isso vários dos 27 têm sprites na biblioteca.
- Os dois casos nomeados: 1 save `ultimate:druidismo` (formas original+druidismo, 4 sprites) COM `slime_cristalino`; 1 save `ultimate:sabbat` (original+sabbat+fada, 6 sprites) SEM `soulmonCompanheiro`.
- Elegíveis pelo critério do dono ("já têm descrição/companheiro"): os 7. Backfill de 1 sprite cada = 7 x US$ 0,017-0,024 = US$ 0,12-0,17. Daqui para frente: ~US$ 0,02 por jogador que gerar sprite (um por conta, mais retentativa por recusa).
- Não consegui distinguir "jogador real" de "jogador real fake" pelos dados lidos (não há marca visível no save). Ver Q5.

---

## 6. (f) O que o save, o servidor e os testes exigem

Campos novos, todos opcionais e aditivos (`GameState`, `src/contexts/GameStateContext.tsx:456-461` como modelo):
- `soulmonCompanheiro` ganha, SEM mudar `id` nem `nome` (o save real continua válido): `desc?: {pt?, en}` (descrição curta, base do prompt, limitada a ~200 caracteres, sanitizada) e `sprite?: {url, at, v}` (URL só da nossa rota `/api/sprite-image?k=<32hex>`, validada como `spriteUrlOrNull` no cliente e no servidor). O papel não é guardado: é derivado.
- Leitura tolerante em `hydrateSave` (`GameStateContext.tsx:1682`): campo faltando/malformado = companheiro "sem arte" (comportamento de hoje). Precisa da linha nova em `saveCompat.contract.test.ts` e no fuzz `GameStateContext.hydrate.fuzz2.qa.test.tsx`.
- Migração idempotente: não há migração de dados (o campo só ganha valor quando o jogador gera). Quem já tem `{id,nome}` só ganha `desc` computada uma vez (função pura, mesma semente `identityKey`, rodar duas vezes = no-op, "primeiro valor vence" como hoje). Nada é gravado no save do Sabá sem companheiro: sem `soulmonCompanheiro` não há desc, não há geração, não há invocação (critério de não regressão do dono).
- Espelho no servidor: (a) `save.js` passa a sanitizar `soulmonCompanheiro.sprite.url` (hoje o campo é opaco; um jogador poderia pôr URL arbitrária que o cliente do oponente carregaria); (b) `_artLine.js` `companionSpriteUrlFromSaveState`; (c) `_duel.js` publica `fx.companheiro` em lista fechada. Paridade: teste novo comparando os ids de companheiro/papel entre `src/` e `functions/` (modelo: `elementoBase.parity.test.js`, `fighterIdentity.parity.test.ts`).
- Contrato aditivo e retrocompatível (regra 3): cliente em cache ignora `fx.companheiro` e `companionSpriteUrl`; servidor antigo não publica e o cliente novo cai no especial atual.
- Mudança só web: sem APK novo (regra 5). `CACHE_VERSION` de `public/sw.js` só se o CSS/asset do palco exigir (provável).
- Rollback (regra 7): reverter o PR remove só a leitura; o campo extra no save é ignorado e inofensivo. Sem migração destrutiva.
- Linha vermelha do jogo: o companheiro é VISUAL. Teste obrigatório: nas 7 famílias, mesma semente e mesmos dados, `fight()`/`groupFight()` emitem eventos idênticos com e sem companheiro no save; `combate/*` não importa o módulo de companheiro (teste de grep, estilo `fighterIdentity.owner.test.ts`). Nenhuma moeda paga compra efeito: o especial é o que o jogador já tinha.
- Segurança do sprite: mesma revisão automática (`_spriteReview.js`), recusa de conteúdo (`isRefusal`) e limite de tamanho de prompt (`generate-sprite.js:533`).

---

## 7. Proposta de arquitetura mínima

### 7.1 Módulo dono único
`src/utils/companheiro/` (novo, funções puras, zero importação em `combate/*`):
- `companheiroPapel(familia, effect)` -> `'tanque' | 'dano' | 'cura' | null` (shield sem hot = tanque; dot = dano; shield+hot e heal = cura; o resto = null). Tabela `Record` tipada: família nova sem linha não compila (padrão de `FAMILY_STATUS`).
- `companheiroDoElemento(elemento)` -> tabela por elemento (7.3). Derivado/curado herda do 1º componente que tem linha, como `efeitoDoEspecial` (`elementEffects.ts`), com overrides explícitos (Sabá, Druidismo).
- `descricaoDoCompanheiro(elemento, identityKey, paleta)` -> descrição EN curta em lista de traços, determinística por jogador, sem LLM e sem custo: espécie do elemento + cor derivada da paleta do Soulmon + 1 traço do elemento secundário.
- `invocacaoNaCena(status[], layout)` -> o que o palco desenha (papel, turnos, spot). Puro, testável como `stageLayout`.
- Espelho mínimo no servidor `functions/api/_companheiro.js`: só a lista fechada de ids/papéis e o sanitizador de URL.

### 7.2 Estado, motor e cena
- Estado: `soulmonCompanheiro` evolui (seção 6); a invocação NÃO tem estado próprio: é derivada do quadro de status do combate.
- Motor: nada muda em `fight.ts`/`group.ts`/`_combate.js`. O companheiro lê o `StageStatus` já produzido por `withRealFx`.
- Cena: `BattleStage` ganha prop opcional `summon?: {sprite, papel, element}` por lado (`me` e `foes[i]`, para o oponente do Duelo); chamadores só passam quando o `fx`/save tem companheiro com sprite e o papel não é null.
- Estágios: UM sprite só, sem evolução (custo 1x; o companheiro é uma presença, não o Soulmon). Escala como o `me` via `petScaleFor` se quiser crescer. Alternativa (Q3): um sprite por estágio, 5x o custo.

### 7.3 Candidatos a elemento + descrição proposta
Chave por elemento BASE (20) com herança por componente para os ~250 derivados/curados, e overrides explícitos. Descrições EN no estilo "lista de traços" do prompt de sprite (pixel, personagem original, sem engrenagem/arreio, sem franquia). Regra de identidade do Soulmon: SEM cristal turquesa, cano de cobre, circuito ou folha como moldura, exceto onde o PRÓPRIO elemento pede (planta, industrial).

Os que o dono nomeou:
- **sabbat (Sabá)**: "small hunched shadow-demon familiar, violet-black smoke body, tiny curled horns, glowing violet eyes, ember-cinder runes along the arms, calm watchful expression" (espírito das trevas, não monstro).
- **druidismo**: "forest-spirit fox with a branching antler crown, moss-green and bark-brown fur, glowing violet rune marks on the flanks, leaf-tipped tail, gentle calm expression" (animal da natureza, com a faísca arcana do par planta+arcano).

Base (rascunho para o dono aprovar): fogo "ember salamander with a candle-flame tail"; agua "river otter spirit with a droplet-shaped crest"; terra "boulder-backed mole with mossy plates"; ar "storm-feathered swift, cloud-tuft chest"; eletricidade "static-fur fox kit with a forked spark tail"; arcano "owl with rune-etched wing tips"; sombra "shadow cat dissolving into smoke at the paws"; luz "small lantern-winged moth, soft golden glow"; vileza "imp-like gremlin with curled thorns and a sly grin"; morte "pale bone-masked wisp hound"; vida "spotted fawn with budding antler nubs"; vigor "stout cub with banded muscle stripes"; marcial "crested hawk with armored-feather plates"; tempo "hourglass-winged moth with a sand-trail"; som "bell-throated songbird with ripple rings"; gravidade "floating stone pup circled by small orbiting pebbles"; espaco "star-speckled night hare with a portal-ring marking"; fada "tiny glimmering sprite-deer with petal wings"; industrial "brass-plated beetle with small steam vents" (peça de metal só aqui, por ser do próprio elemento, SEM engrenagem); planta "walking sprout-hound with a flower-bud tail".

### 7.4 Quando o sprite é gerado, fallback
- Quando: sob demanda, depois que o companheiro e a descrição existem, no reveal/PetPage ou no primeiro especial invocável; uma vez por conta, em fila depois das formas do Soulmon (nunca antes: não compete pelo teto das 11 formas). Reusa lock e dedupe de `generate-sprite.js` (UMA geração por forma).
- Falha: sem placeholder. Sem sprite o especial é exatamente o de hoje (aura/escudo no conjurador, `selfOnly`), sem erro na tela. Retentativa com backoff, no máximo 2; recusa de conteúdo refaz o prompt sem referências (comportamento atual); o `gate.release` devolve a cota quando não sai imagem. "Gerar de novo" fora do escopo.

---

## 8. Plano em PRs pequenos

| PR | Conteúdo | Testes e riscos |
|---|---|---|
| 1 | `src/utils/companheiro/` só dados puros: `companheiroPapel`, tabela de elementos, descrições, espelho em `functions/api/_companheiro.js`. Nada ligado. | Paridade `src` x `functions`; cobertura dos 20 base + herança de todos os derivados/curados (lista fechada, como `efeitoDoEspecial`); nenhum arquivo de `combate/*` importa o módulo. Risco baixo. |
| 2 | Campos `desc`/`sprite` em `soulmonCompanheiro` + `hydrateSave` + sanitizador em `save.js` + `_artLine` com `companionSpriteUrl`. Sem UI. | `saveCompat.contract.test.ts`, fuzz de hidratação, paridade do sanitizador de URL; save de produção (sem os campos) hidrata idêntico; rollback = ignorar campo. Risco médio (toca save). |
| 3 | formId `companheiro` em `_aiGuard.js` (regex + tetos +1/+2) e `generate-sprite.js`; compositor de prompt do companheiro (`motor.ts`, mesma cláusula anti-franquia). | Testes de `generate-sprite`, teto por forma/vitalício, kill-switch `SPRITE_DISABLED`, gasto em `globalDay/Month`, refeitura por recusa, exclusão LGPD (`account.js`). Risco: custo. |
| 4 | Cliente: geração sob demanda + armazenamento + backoff; sem render. Backfill só dos 7 que têm companheiro, sob demanda. | Idempotência (2 execuções = no-op); jogador sem companheiro nunca dispara; fixture "sabbat sem companheiro" intocado. |
| 5 | `BattleStage`: prop `summon` + `invocacaoNaCena` (derivado de `StageStatus`), animações existentes, reduced-motion, sem `boss`/Raid. Atrás de flag. | `BattleStage.test.tsx` de layout (1-3 inimigos, telas estreitas), render tests dos 8 chamadores, `combate.especialFx.render.test.tsx`. Risco: sobreposição com barras/foes; rede. |
| 6 | `fx.companheiro` no `duelSide` + `companionSpriteUrl` na lista de oponentes + `fxDoLutador`; Duelo/Torneio/treino mostram o do oponente. | `fighterIdentity.parity.test.ts` estendido; cliente antigo ignora campo; oponente sem sprite cai no especial normal. |
| 7 | Ligar a flag (por conta, depois geral) + monitorar custo/recusas. | Gate: prova de "mesmos eventos de `fight()` com e sem companheiro" nas 7 famílias verde; medir custo real por sprite antes do backfill geral. |

Em todos os PRs: leitura tolerante, nada de renomear/apagar chave, plano de rollback no corpo do PR, kill switch (`SPRITE_DISABLED` cobre a geração; flag de cena separada).

---

## 9. Riscos principais

1. Vazamento de sprite por `fallbackEntry` em `_artLine.js:68` (4.2). Mitigado com campo próprio.
2. URL arbitrária no save de outro jogador carregada pelo cliente do oponente: validar sempre `/api/sprite-image?k=<32hex>` no servidor.
3. Teto de sprite vitalício de produção (15) sem folga para companheiro; sem ajuste, o 15º sprite nega uma forma real do Soulmon.
4. "Cura" em PvP: `hot` só existe em PvE; no Duelo o companheiro de cura teria só um pulso instantâneo (Q4).
5. Sobreposição visual com inimigos e barras em tela estreita (3 inimigos em triângulo, `BattleStage.tsx:217-222`); exige teste de layout e limite de tamanho.
6. Custo: 1 sprite por conta, ~US$ 0,02, mais retentativas; o dono fixa o teto (Q6). O teto global de 40/dia já protege.
7. Captura inconsistente entre aparelhos (cache só preenchido na PetPage com perfil local): parte dos jogadores elegíveis pode nunca receber companheiro. Fora do escopo, ou capturar no servidor (Q8).
8. Expectativa: o companheiro existente do Druidismo não é "da natureza" (`slime_cristalino`); se a tabela por elemento for adotada, regra proposta: quem já tem NÃO muda (primeiro valor vence); só vale para quem ainda não tem (Q1).
9. PI: descrições originais, sem franquia; a cláusula anti-franquia do compositor permanece.

---

## 10. Perguntas para o dono (cada uma com opções e UMA recomendada)

**Q1. De onde vem o companheiro de cada jogador?**
- A (recomendada): TABELA por elemento do Soulmon (7.3), usada só para jogador que ainda NÃO tem `soulmonCompanheiro`; quem já tem (inclusive o Druidismo com slime) mantém o que tem e só ganha descrição e sprite.
- B: manter a captura aleatória do class-system para todos (Sabá pode sair demônio ou tubarão; Druidismo segue "slime cristalino").
- C: a tabela SUBSTITUI também os existentes (muda o companheiro de quem já tem; fere "descrito na build").

**Q2. Quais elementos entram na primeira leva?**
- A (recomendada): só Sabá e Druidismo (os dois citados) + herança automática por componente para os derivados deles; os 20 base entram num segundo pacote depois de o dono aprovar as descrições.
- B: os 20 base de uma vez, com a tabela de 7.3.
- C: só elementos que hoje têm famílias invocáveis em produção, a medir primeiro.

**Q3. O companheiro tem estágios?**
- A (recomendada): UM sprite só, sem evolução (~US$ 0,02 por conta).
- B: um sprite por estágio (5x o custo e 5x as chances de recusa).
- C: um sprite, com uma segunda versão só no Ultra.

**Q4. Papel CURA no Duelo/Torneio, onde só existe cura instantânea (`heal`) e não há `hot`?**
- A (recomendada): o companheiro de cura aparece no instante da cura e fica só enquanto durar o pulso/aura (honesto: não promete 3 rodadas que o PvP não tem); no PvE segue os 3 pulsos reais.
- B: fica 3 golpes em cena mesmo no PvP, só como cenário (cosmético, mas mente sobre o efeito).
- C: no PvP só TANQUE e DANO invocam; CURA não.

**Q5. Como identificar "jogador real" e excluir NPCs, simulados e "jogadores reais fake"?**
- A (recomendada): invocação só quando o save tem companheiro COM sprite gerado (campo próprio) e a geração só roda para conta paga/beta-full verificada; simulados nunca têm o campo; as contas de teste do dono ficam de fora por lista explícita de ids (o dono informa quais).
- B: só `ent.tier === 'paid'` (hoje 1 conta).
- C: allowlist manual de ids ligada pelo dono.

**Q6. Teto de custo de geração.**
- A (recomendada): +2 no vitalício por conta (1 companheiro + 1 refeitura por recusa), 1 por forma, sem "gerar de novo"; custo-alvo por conta <= US$ 0,05.
- B: +1 só (sem refeitura).
- C: sem teto novo, reaproveitar a folga de 4.

**Q7. Backfill dos 7 que já têm companheiro (custo <= US$ 0,17).**
- A (recomendada): sob demanda, quando o jogador abrir o app/PetPage depois da flag; sem script em massa.
- B: script único feito na mão pelo dono.
- C: sem backfill; só jogadores novos.

**Q8. O Sabá existente (sem companheiro) deve receber um quando abrir a Ficha?**
- A (recomendada): sim, pelo fluxo normal "primeiro valor vence" (captura determinística e, se Q1=A, tabela do elemento), mas SÓ quando ele mesmo abre a Ficha; nada é gravado nem gerado em lote nem pelo servidor.
- B: não, nunca (zero mudança até o dono pedir).
- C: o dono libera manualmente para esse jogador depois de ver a descrição.

---

## 11. Fora de escopo e dúvidas abertas
- Mudar a mecânica do especial (dano, duração, potência) não é parte do pedido; a duração "3 rodadas" é a do núcleo (3 golpes), explicitada em 2.2.
- Cena da Guerra de Guilda e Raid: rivais em silhueta/chefe; não recebem companheiro.
- Texto visível do companheiro: usar o nome PT/EN já existente (`companheiroNome`); nada de número, papel nem classe na UI (decisão 3).
- Calibração (`efeitosPve.medicao.test.ts`, gate ±3pp; régua pareada ±5%) NÃO é afetada: não há mudança de potência. O PR 7 só confirma por teste de igualdade de eventos.
