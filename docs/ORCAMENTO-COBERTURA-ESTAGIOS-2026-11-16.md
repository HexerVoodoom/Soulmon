# Orçamento: cobertura de Soulmon por combinação de elementos e estágio (16/11/2026)

Só levantamento e orçamento. Nada foi gerado, nada foi gravado no KV, nenhum código foi alterado. Leituras: repo (`main` @ `2b89d639c`) e `wrangler kv key list --prefix sim:sprite:` (somente leitura). Contagens calculadas por script a partir dos arquivos de dados (`E:/tmp/claude/cov/*.mjs`, descartáveis).

## 1. Regra canônica (mapeamento elementos × estágio)

**Não existe um mapeamento rígido; existe uma tabela de probabilidades aprovada pelo dono** (REGISTRO §232, 05/11/2026, `docs/REGISTRO-DE-DECISOES.md:4073-4090`; código `src/utils/elementoCombinado.ts:57-63`, `CHANCES_POR_ESTAGIO`):

| Estágio | 1 elem. | 2 elem. | 3 elem. | 4 elem. |
|---|---|---|---|---|
| Rookie | 95 | 5 | 0 | 0 |
| Champion | 35 | **60** | 5 | 0 |
| Ultimate | 15 | 30 | **50** | 5 |
| Mega | 10 | 20 | **40** | 30 |
| Ultra | 5 | 10 | 25 | **60** |

O pedido original do dono (REGISTRO:4075) já dizia a regra em palavras: "Rookie praticamente sempre básico, Champion já com dois, Ultimate com três, Mega e Ultra com quatro, e um Ultra de um elemento só continua possível".

**Resposta à dúvida do dono: vale a segunda hipótese dele.** 1 = Rookie, 2 = Champion, 3 = Ultimate, 4 = Mega (4 elementos chega a 30% no Mega e domina só no Ultra, 60%). Ressalva honesta: no Mega o modal ainda é 3 elementos (40%); 4 elementos só vira a maior fatia no Ultra. "1 elemento = Champion" e "2 = Ultimate" não existem em lugar nenhum. A sorte `u` é única por Soulmon e só sobe (`elementoCombinado.ts:68-76`), então a regra é de distribuição, não de teto: todo par (k, estágio) com percentual > 0 é válido.

Nomes de tela são os do jogo (Desperto, Ascendente, Transcendente, Apoteose, Zênite; `docs/NOMENCLATURA-ESTAGIOS.md`).

## 2. Combinações válidas

Catálogo do jogo (`ELEMENT_DEX_MAX = 270`, `src/utils/elementDex.ts:14`): 

| Elementos | Combinações | Fonte |
|---|---|---|
| 1 | **20** | base (`BASE_ELEMENT_IDS`) |
| 2 | **190** (= C(20,2)) | `DERIVED_ELEMENT_PAIRS` (`soulProfile/derivedElements.ts`) |
| 3 | **40** | curados: 34 dos lotes 1-3, 3 do lote 4, 3 promovidos (205-207) |
| 4 | **19** | curados: 16 dos lotes 1-3, 3 do lote 4 |
| **Total** | **269** (+ `neutro`, só do corvo = 270) | `elementosCurados.ts` (59 curados) |

Observação: o catálogo de 3 e 4 elementos é curado (40 + 19), não todas as combinações matemáticas (1140 e 4845). Há ainda 21 "rookies extras" legados no roster (137, 138, 193-204, 208-211) que não são combinações novas (repetem pares).

## 3. Oferta atual por combinação e estágio

### 3.1 Roster de inimigos/Bestiário (`src/utils/enemyRoster.ts`, dados em `enemyRosterData.ts`, `elementos*.data.ts`)

| Elementos | Estágio-alvo | Combinações | Com ≥1 hoje | **Faltam (≥1)** | Unidades hoje | Falta p/ ≥2 | Falta p/ ≥3 |
|---|---|---|---|---|---|---|---|
| 1 | Rookie…Mega (+Ultra) | 20 | 20 em todos | 0 | 20 base + 40 ramos + 5 "api" | 0 | 0 (cada base tem 1 + 2 ramos) |
| 2 | **Champion** | 190 | 6 | **184** | 11 | 373 | 562 |
| 2 | Ultimate | 190 | 6 | 184 | 11 | 373 | 562 |
| 2 | Mega | 190 | 1 | 189 | 6 | 378 | 567 |
| 2 | Ultra | 190 | 0 | 190 | 0 | 380 | 570 |
| 3 | Champion | 40 | 34 | 6 | 34 | 46 | 86 |
| 3 | **Ultimate** | 40 | 34 | **6** (clareira, alto_forno, bencao_feerica, pestilencia, maldicao, cyber) | 34 | 46 | 86 |
| 3 | Mega | 40 | 34 | 6 | 34 | 46 | 86 |
| 3 | Ultra | 40 | 0 | 40 | 0 | 80 | 120 |
| 4 | Ultimate | 19 | 16 | 3 | 16 | 22 | 41 |
| 4 | **Mega** | 19 | 16 | **3** (floresta_ancestral, colosso_blindado, corte_feerica) | 16 | 22 | 41 |
| 4 | Ultra | 19 | 0 | 19 | 0 | 38 | 57 |
| 2/3/4 | Rookie | 190/40/19 | todos | 0 | 212/40/19 | (rookies de 2-4 elementos são o mais comum hoje, ao contrário da regra) | — |

Quem cobre os 6 pares de 2 elementos em Champion: vapor (Mareoror/Salsolura, 6 formas), praga (Krowlix), arco_iris (Mantralun), chama_azul, brinquedo e raiz_profunda (formas paralelas). Os 150 PNG "formas dos combinados" (REGISTRO:4436) cobrem só as 34+16 curadas dos lotes 1-3, em Champion, Ultimate e Mega.

Ponto crítico: `ENEMY_STAGES` (`enemyRoster.ts:24`) **não tem Ultra**; Ultra de roster só existe para os 20 base (chefe Desgarrado) e as 2 espécies do Oráculo (chefe Ultra da Arena, `arena.ts`, `ARENA_CHEFES_ULTRA`). Qualquer arte de Ultra de combinado nova exigiria código para entrar num pool.

### 3.2 Composição real dos pools (`pickEnemyComum`, `enemyRoster.ts:~318`)

Pool uniforme por estágio, excluindo `paralelo` e `forma` (as formas dos 50 curados e as paralelas **só** saem em masmorra temática de elemento). Contagem de entradas:

| Estágio | Pool comum | Combinados no pool | % combinado |
|---|---|---|---|
| Rookie | ~293 | ~271 | **~92%** |
| Champion | ~70 | 8 (duo + Oráculo) | ~11% |
| Ultimate | ~69 | 8 | ~12% |
| Mega | ~66 | 6 | ~9% |

Ou seja, o roster hoje é o **inverso** da regra canônica: quase tudo que é combinado está em Rookie (onde a regra pede 95% de elemento único) e quase nada em Champion+.

### 3.3 Simulados (KV de produção, namespace `20b3ba78a3e84265b5e2d4cd0d411d43`)

- `sim:sprite:*`: 338 chaves. 170 ponteiros (`sim:sprite:sim_NNNN`) + 168 chaves de forma (131 rookie, 37 champion), cobrindo **144 simulados**; os outros 26 usam `artLine`/roster de reserva.
- Melhor arte por simulado: **107 Rookie, 37 Champion, 0 Ultimate+** (a geração pára em `FORMA_GERADA_MAX = 'champion'`, `_simFormas.js:42`; simulados acima reaproveitam o sprite).
- Elementos nos metadados `el`: 13 elementos base distintos (planta 20, terra 19, industrial 19, fogo 21, ar 23, agua 23, luz 19, sombra 17, vileza 2, morte 2, fada 1, som 1, arcano 1). **Todos com 1 elemento.** O dado-fonte (`_simulados.data.js`) confirma: 170 simulados, 18 elementos, nenhum combinado.
- Estágio por âncora em 05/11: 149 rookie, 11 champion, 7 ultimate, 3 mega (a curva diária sobe com o tempo; não foi possível rodar `estadoDoDia` para hoje porque `node_modules` está vazio neste checkout).
- Conclusão: **simulados cobrem 0 combinações de 2+ elementos**, inclusive os que já estão em Champion+. Eles não são a fonte de oponentes combinados.

### 3.4 Como cada modo escolhe oponente por dificuldade

| Modo | Como escolhe | Estágio sobe com dificuldade? | Combinado predomina? |
|---|---|---|---|
| **Arena** | `buildArenaRound` (`src/utils/arena.ts:346-440`). Forma vem da **escada de vitórias** (`arenaLadderStage`, `arena.ts:323`; 5 vitórias só Rookie, depois +1 degrau a cada 3 até Ultimate, topo em 32; `ARENA_LADDER_FIRST_STEP`, `arena.ts:303`). Chefe Ultra (Mareoror/Salsolura) 25% da rodada 5 com escada ≥ 32 | **Sim** (Rookie→Champion→Ultimate pela escada) | **Não, ao contrário.** Metade das runs é "combinada" (`isComboSeed`, `strayFoes.ts:18`, 50%), mas combinado só existe em Rookie (`arena.ts` linha do `stage === 'rookie'`); em Champion/Ultimate o inimigo é sempre 1 elemento ou ramo |
| **Masmorra / Rift** | `buildDungeonWave` (`dungeon.ts:~20`): 6 slots fixos `LADDER_TIERS` (`dungeonBase.ts:54`: baby-i, baby-ii, rookie, champion, ultimate, mega), cada slot pede seu estágio via `getDungeonEncounter`→`pickEnemy` (`novosSoulmon.ts:~225`). Estágio de arte é limitado pelo level do jogador (`ENEMY_STAGE_UNLOCK_LEVEL`: champion 7, ultimate 14, mega 22). A profundidade (`floor`) só escala HP/dano (`dungeonFoe`), **não** muda estágio nem elemento | Não por profundidade; sim por level do jogador e por slot | Não: 3 dos 6 slots são Rookie (~92% combinado), 3 são Champion+ (≈90% 1 elemento) |
| **Torneio/Duelo PvP** | `pickRankedOpponents` (`functions/api/_rankedPick.js:26`) por proximidade de pontos, depois `ordenarPorEstagio` (`_oponenteEstagio.js:10`: -2 3%, -1 25%, 0 40%, +1 25%, +2 7%) | Estágio próximo ao do jogador | Não aplicável (simulados = 1 elemento) |
| Match-3 boss | `pickEnemy(99, …, {stage:'ultimate', semRamos:true})` (`match3Boss.ts:83`) | fixo Ultimate | Pool Ultimate comum (~12% combinado) |

**A regra "mais dificuldade → estágio mais alto, com predominância de elemento combinado" NÃO existe como regra única.** Existe a metade "estágio sobe" (escada da Arena, level cap na masmorra) e não existe a metade "combinado predomina" em lugar nenhum; na prática hoje o combinado predomina no estágio mais fácil.

## 4. Gap de gerações

Convenção: 1 imagem = 1 chamada = 1 forma, com 1 referência (a forma anterior), como no summon real (`src/hooks/useSpriteGeneration.ts:165-182`). Forma nova de combinação precisa da cadeia do Rookie até ela quando falta o degrau anterior. Variantes extras = os 3 ramos (poder/harmonia/benevolência), precedente: Mareoror/Salsolura (`ELENCO_ORACULO_DATA`), com a forma anterior como referência (não refaz a cadeia).

| Pacote | O que garante | k=2 Champion | k=3 Ultimate | k=4 Mega | k=4 Ultra | Outros | **Imagens** |
|---|---|---|---|---|---|---|---|
| **A. Mínimo canônico** | ≥1 por combinação no estágio dela (2→Champion, 3→Ultimate, 4→Mega) | 184 | 12 (6 combos × champion+ultimate) | 9 (3 combos × champion+ultimate+mega) | — | — | **205** |
| **A+** | A + 4 elementos também no Ultra | 184 | 12 | 9 | 19 (16 com Mega + 3 novos) | — | **224** |
| **B2. Variedade ≥2** | ≥2 por combinação no estágio-alvo + A+ | 373 | 52 | 28 | 19 | — | **472** |
| **B3. Variedade ≥3** | ≥3 por combinação (3 ramos) + A+ | 562 | 92 | 47 | 19 | — | **720** |
| **C. Pools por dificuldade** | cada célula (k, estágio) com peso ≥ 25% na tabela §232 tem ≥1 oponente: A+ mais 2 elementos em Ultimate (184), 3 elementos em Mega (6) e 3 elementos em Ultra (40) | 184 | 12+6 | 9 | 19+... | +184 +6 +40 | **454** |
| **B3 + C** | variedade e pools | | | | | | **~950** |
| Referência teto | todas as células com peso > 0 (inclui 2 elementos em Mega/Ultra, etc.) | | | | | | ~830 só para completar a matriz com 1 por célula |

Observações:
- Combinações de 1 elemento: 0 faltam em qualquer pacote. Os 20 base têm Rookie→Ultra e 2 ramos por estágio.
- A contagem de B2/B3 usa "forma anterior = referência" (variante de custo 1). Se for exigida cadeia fiel por ramo (cada ramo com seu Champion), B3 sobe para algo perto de 1.000 e B2 para ~650.
- **Pacote A é pouca coisa fora o k=2 Champion:** 184 de 205 imagens são os pares em Champion. 6 trios e 3 quádruplos são só 21 imagens.
- Ultra de combinado (A+, C) não entra em pool algum sem alterar `ENEMY_STAGES`/sorteio: tratar como decisão de produto, não só de arte.
- Fora dos pacotes: aplicar a mesma tabela aos **170 simulados** (hoje todos 1 elemento). Estimativa: ~60% dos que chegam a Champion seriam de 2 elementos, ~100 sprites Champion novos (mais Rookies de 2 elementos), custo de ~US$2-4 em geração, mas exige mudar `_simulados.data.js` (campo `element`), `ELEMENTO-POR-SPRITE` e ligar `SIMULADOS_FORMAS_ON` (hoje desligado, teto 8 formas/dia, 150/mês: `_simFormas.js:26-27`).

## 5. Orçamento

### 5.1 Pipeline, modelo, nº de chamadas, preço

- **Mesmo pipeline do summon real:** rota `functions/api/generate-sprite.js`, API REST `api.higgsfield.ai`, modelo **`alpha`** ("2.0 Alpha", `/marketing-studio/image`) por padrão; `flare` opcional. Corpo: `{prompt, quality: 'low', resolution: '1k', aspect_ratio: '1:1', moderation: 'auto', enhance_prompt: false, image_urls: [referência]}` (`generate-sprite.js:254-283`). Sem alfa nativo: o prompt pede fundo #00FF00 / #FF00FF / #0000FF (`escolherChroma`, `elementoCombinado.ts`) e o servidor aplica `chromaKeyPng`.
- **Chamadas por Soulmon:** 1 por forma (rookie, champion, ultimate, mega, ultra), cada uma com a forma anterior como `image_urls`. Não há 2ª chamada de recorte; o chroma é local.
- **Preço por imagem:** ~US$ 0,017 (alpha, medido 30/10: memória `soulmon-sprite-via-playground`) a ~US$ 0,024 (`CUSTO_POR_IMAGEM` em `scripts/simulados-sprites-fila.mjs:~33` e `linhas-elemento-api`). Em créditos Higgsfield: 0,5 (qualidade `low`) a 1,0 (`medium`) por imagem (REGISTRO §…, linhas 2330 e 2385). Premissa de repetição: +20% (imagem com fundo errado, recorte suspeito, NSFW falso positivo; **suposição minha**, não medida para este lote).

### 5.2 Custo e tempo

| Pacote | Imagens | US$ (0,017–0,024) | US$ com +20% | Créditos (0,5–1,0), +20% | Tempo de geração* |
|---|---|---|---|---|---|
| A | 205 | 3,49 – 4,92 | **4,2 – 5,9** | 123 – 246 | 16 – 26 min |
| A+ | 224 | 3,81 – 5,38 | **4,6 – 6,5** | 134 – 269 | 17 – 28 min |
| C | 454 | 7,72 – 10,90 | **9,3 – 13,1** | 272 – 545 | 35 – 57 min |
| B2 | 472 | 8,02 – 11,33 | **9,6 – 13,6** | 283 – 566 | 36 – 59 min |
| B3 | 720 | 12,24 – 17,28 | **14,7 – 20,7** | 432 – 864 | 55 – 90 min |
| B3 + C | ~950 | 16,2 – 22,8 | **19,4 – 27,4** | 570 – 1.140 | 73 – 119 min |

\* 8 a 13 imagens/min com ~10 jobs em paralelo (referência: 290 imagens em 35 min, memória `higgsfield-navegador-api-pipeline`). Ordem de cadeia limita o paralelismo: Champion de 190 pares é paralelizável (referência = Rookie já pronto); Ultimate depende do Champion, e assim por diante, então fazer em ondas por estágio.

**Tempo total real** é maior que o de geração: prompts, upload das referências, QA visual de cada PNG (o dono vetou criatura sem olhar), instalação, código de roster, testes e Bestiário. Estimativa: A = 1 sessão longa; B3+C = 3-4 sessões.

### 5.3 Onde ver o saldo (não usei credencial)

- **Conta da API (a que paga sprites):** painel da conta Higgsfield dona da chave `HF_CREDENTIALS` (secret do Cloudflare, `keyId:keySecret`), host `platform.higgsfield.ai`. Último valor anotado: **~US$ 24 em 30/10/2026** (memória `soulmon-sprite-via-playground`); não confirmado hoje.
- **Conta do navegador (higgsfield.ai, plano Pro, ~0,4 crédito na última leitura):** não serve para sprite (falta o Element e o crédito); o saldo lê em `/fnf/workspaces/wallet` com a página logada.
- Se o saldo da API for ~US$ 24: A, A+, B2, C e B3 cabem; B3+C (~US$ 19-27) fica no limite ou estoura.

## 6. O que o pipeline precisa para gerar em lote "como summon real"

**Já existe:**
- `scripts/simulados-prompts.ts` + `simulados-prompts-run.mjs`: prompts do Oráculo real por simulado e forma (esbuild empacota o `class-system`). **É para simulados, não para o roster.**
- `scripts/simulados-sprites-fila.mjs`: plano, cache por `(id, forma, sha do prompt)`, `--lote` (grava pedidos pendentes em ordem de cadeia) e `--instalar` (baixa, `chromaKeyPng`, confere alfa, trava repetição por hash). Nunca grava no KV, nunca roda em CI.
- `scripts/simulados-sprites-publicar.mjs`: dry-run/gerar `wrangler kv bulk put` (3 escritas por simulado).
- Geração: método do playground (memórias `higgsfield-api-playground-headers`, `soulmon-sprite-via-playground`): `fetch` **dentro** da aba `open.higgsfield.ai` logada (Claude in Chrome), `Authorization` via Clerk `getToken({template:'api'})` (renovar a cada ~15 s) + `hf-api-key`; nada de chave local. O script `linhas-gen.mjs` sumiu (só no transcrito d77cec7b).
- `src/utils/elementoCombinado.ts`: `pistasVisuaisDoElemento`, `escolherChroma`, `aplicarChroma`, `stagesComElemento` (monta o prompt com o elemento combinado).

**Falta construir (nada pronto para combinados do roster):**
1. **Gerador de prompts de roster** (análogo a `simulados-prompts.ts`) para cada (combinação, estágio, ramo): prompt do Oráculo + frase "Elemental theme of this form" + pistas por componente (cada componente com sua palavra-chave) + chroma certo (verde/magenta/azul) para elementos com verde (planta, etc.).
2. **Upload das referências** (Rookie de `combinados/NNN-slug.png` como `image_urls`; mínimo 300 px por lado, ampliar com NEAREST; referências precisam estar numa URL pública aceita por `referenciasSeguras`, `generate-sprite.js:~540`).
3. **Fila + instalação** adaptadas a ids `cmbNNN` (arquivo `NNN-slug-<estágio>[-<ramo>].png`, 256², alfa binário), salvando prompt e tags em `_banco/registro.jsonl` (regra do dono 09/11).
4. **Código do roster:** linhas novas em dados + `enemyRosterArt.ts`, no **fim** do `ENEMY_ROSTER` (o `#N` do Bestiário não pode mudar), nomes por `nomeDaForma` (`enemyRoster.ts:~207`) ou nomes próprios; regras de pool (ver perguntas); testes `enemyRoster.test.ts`/guardas de cobertura.
5. **Se Ultra entrar:** `ENEMY_STAGES` e `pickEnemy*` hoje não conhecem Ultra.

**Riscos:**
- **Peso do bundle:** 205-720 PNG 256² a ~60-150 KB (amostra do REGISTRO: 150 KB sem otimização) somam ~12-100 MB em `src/assets`; há orçamento de bytes (`vitest.budget.*`) e o app já carrega o roster num chunk de ~40 KB + arte. Precisa de lazy chunk ou compressão (`pngquant`/nearest 4:1) antes de decidir tamanho do lote.
- **Aba oculta congela tudo** (Clerk pendura; memória `higgsfield-navegador-api-pipeline`): checar `document.visibilityState`.
- **Token expira em ~1 min**; renovar a cada 15 s. Credencial nunca sai da página.
- **Chroma:** criatura com verde/magenta precisa da chave certa; `semChromaSeguro` marca os casos sem cor segura para o dono. Conferir `a0%` e franja em cada PNG.
- **Falso positivo "nsfw"** e fundo opaco: separar e repetir; imagens idênticas entre combinações: `hashRepetido` pára o lote.
- **Identidade dos 190 pares:** a referência é o Rookie combinado existente (arte de 25-30/10, estilo anterior); o Champion novo herda o desenho. Se o dono não gosta de algum Rookie, o Champion repete o defeito.
- **Regra do dono (09/11):** sprite de criatura nunca no ChatGPT, só API alpha. Ver `sprites-de-personagem-so-via-api`. Ultra de 4 elementos pede, no jogo real, os 3 Megas fundidos; aqui usamos 1 Mega como referência (decisão de produto: aceitável para inimigo?).
- **Árvore compartilhada:** várias sessões na mesma árvore perdem trabalho; usar worktree/branch própria e `git status` antes.
- **Simulados fora do orçamento:** continuam 100% 1 elemento até decisão (D3).

## 7. Perguntas só do dono (recomendada primeiro)

**D1. Que pacote gerar agora?**
1. **A+ (224 imagens, ~US$ 4,6-6,5)**: todo par em Champion, todo trio em Ultimate, todo quádruplo em Mega e Ultra. Fecha a regra mínima.
2. B2 (472 imagens, ~US$ 10-14): dois por combinação, mais variedade na masmorra.
3. B3 + C (~950 imagens, ~US$ 19-27): três por combinação e pools completos; só com saldo confirmado.

**D2. Mapeamento oficial (e regra de Ultra):**
1. **1 = Rookie, 2 = Champion, 3 = Ultimate, 4 = Mega**, e Ultra é "qualquer, com 4 mais provável" (é o que a tabela §232 diz; só Mega mínimo).
2. 4 só no Ultra (mais barato em Mega, mas contradiz "Mega com quatro").

**D3. As regras dos pools mudam?** Hoje o combinado predomina em Rookie (92%) e é raro em Champion+.
1. **Usar a própria tabela §232 como peso do sorteio de inimigos por estágio** (Rookie ~95% 1 elemento, Champion 60% de 2, Ultimate 50% de 3, etc.), na Arena (escada), na masmorra/Rift (slot × level) e no Match-3; e tirar o Rookie combinado do predomínio.
2. Só acrescentar as formas novas ao sorteio existente (sem mexer na proporção).
3. Deixar como está (cobertura só por masmorra temática de elemento).

**D4. Ultra de combinados e `ENEMY_STAGES`:**
1. **Não gerar Ultra de combinado agora** (sem pool que o use): corta 19 imagens (A) e 40 (C).
2. Gerar e adicionar Ultra ao sorteio (exige código, vira chefe).

**D5. Simulados:**
1. **Não mexer agora** (170 todos de 1 elemento; custo fica fora deste orçamento).
2. Aplicar a tabela §232 aos simulados e ligar `SIMULADOS_FORMAS_ON` (~100 sprites de 2 elementos, ~US$ 2-4, mais mudança em `_simulados.data.js`).

**D6. Variantes ao pedir 3 por combinação:**
1. **Três ramos poder/harmonia/benevolência** (precedente do Oráculo, referência = forma anterior, custo 1 por variante).
2. Variante livre de prompt (menos coerência de linhagem).

**D7. Bundle:** aceitar crescimento do app (lote A+ ~15-35 MB de PNG) ou exigir chunk preguiçoso/compressão antes de instalar? Recomendado: chunk preguiçoso + vizinho-mais-próximo 4:1 (como no REGISTRO §68).
