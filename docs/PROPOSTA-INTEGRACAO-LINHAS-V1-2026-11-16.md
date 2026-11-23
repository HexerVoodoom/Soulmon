# Proposta: integrar as 5 linhas v1 (SOM, ELETRICIDADE, TEMPO, ARCANO, MARCIAL) — 16/11/2026

Só análise. Nenhum código, asset ou commit alterado. Leitura: `main` local `2b89d639c` e `origin/main` `808686698` (a local está 171 commits atrás; onde difere, cito `origin/main`).
Arte nova: `E:\Soulmon-assets\_lote-16-11\recriar-v1\dono-folha\refinados\<elemento>-<estagio>.png` (25 PNGs, 256², RGBA, 1,65 MB; os 25 atuais dos mesmos elementos somam 1,22 MB).

## 0. O achado que muda a pergunta

**Essas 20 criaturas NÃO são o pet do jogador. São só inimigos e Bestiário.** `novosSoulmon.ts` só é importado por Arena, Bestiário, Relatório diário, Match-3, Torneio, `dungeon.ts`, `dungeonBase.ts` e `temaInimigos*.ts` (`grep` em `src/`, nenhum outro consumidor). Nada em `functions/` (nem `sprite:blob`, nem `sim:sprite:*`) cita `vibri`/`voltrix`/`chronib`/`runix`/`kenjo`/`enemyRoster`. O pet do jogador vem do Oráculo (`src/utils/oracle/formas.ts`, `motor.ts`) e é gerado por IA por pessoa, ou é um inicial (`src/assets/soulmon/starters/`). Logo:

- não existe "evolução do pet do jogador" passando por estas linhas, e **saves de pets não são afetados**;
- `sprite:blob` e `sim:sprite:*` (`functions/api/community.js:960`, `generate-sprite.js`) guardam sprite gerado por IA, independente dos PNGs do repo: **nada a migrar**;
- o único dado de save que referencia estas espécies é a lista `bestiary` (chaves `<id>-<estágio>`, `enemyRoster.ts:54`) e snapshots de combate com `stage`/`roster` (`<id>-<tier>`).

## 1. Como funciona hoje (com referências)

- **Dados puros:** `src/utils/novosSoulmonData.ts:25-67` `NOVOS_DATA` (id, `line` poder/harmonia/benevolência, elemento, nome rookie e champion, golpes). Ids relevantes: `vibri` (som, l.46), `voltrix` (eletricidade, l.48; o dono diz "Voltix", o id/nome atual é Voltrix desde §67, REGISTRO:2599), `chronib` (tempo, l.40), `runix` (arcano, l.38; exibe Runeko), `kenjo` (marcial, l.36; exibe Kenvar). Nomes de Ultimate/Mega/Ultra: `FORMAS_ALTAS` (l.70-91).
- **Arte:** `src/utils/novosSoulmon.ts:121-143` `ART` (rookie/champion, 1 import por PNG) e `:145-167` `FORMAS_ALTAS_ART` (ultimate/mega/ultra), tudo de `src/assets/soulmon/novos/<elemento>-<estagio>.png`. `spriteOf` em `:173`. 100 PNGs (20 × 5); `novosSoulmon.test.ts:33-43` exige exatamente esses 100 nomes, 256² RGBA, < 150 KB cada.
- **Linhas/ramos:** a criatura tem UMA linha de alinhamento própria (`line`) e as outras duas viram "ramos" como INIMIGOS: `RAMOS_INIMIGOS_DATA` (`enemyRosterData.ts:270-322`, 40 ramos × champion/ultimate/mega = 120 PNGs em `src/assets/soulmon/novos-arquivo/ramos/<elemento>/<ramo>-<estagio>.png`, §220, REGISTRO:3936). Id do ramo = `<criatura><ramo>` (ex.: `vibripoder`), chave `vibripoder-champion`. Os 5 elementos já têm 2 ramos cada (som/eletricidade/tempo/arcano: benevolência+poder; marcial: benevolência+harmonia). Nomes gerados por sufixo (`Vibrarok`...). Arte entra por `enemyRosterArt.ts` (`import.meta.glob` eager de `novos-arquivo/ramos`), único consumidor permitido do arquivo (`novosSoulmon.test.ts:157-165`).
- **Onde cada estágio é escolhido:** `enemyRoster.ts` `ENEMY_ROSTER` (origin/main l.285) = base + combinados + corvo + ramos + paralelos + formas dos combinados + duo + elenco do Oráculo + `buildUltimates2Comp`. Estágio por level: `ENEMY_STAGE_UNLOCK_LEVEL` rookie 1 / champion 7 / ultimate 14 / mega 22. Masmorra/Rift: `getDungeonEncounter` (`novosSoulmon.ts:218`) → `pickEnemy`. Arena: `arena.ts` + `ArenaGame.tsx:253` (sprite por `novoSoulmonById(e.creature)?.sprite(form)`), ramo na Arena só em rodada Ultimate (§221 revogado em parte, REGISTRO:3914). **Ultra das 20 não tem consumidor em runtime** (nenhum `'ultra'` em `arena.ts`/`dungeon.ts`/`enemyRoster.ts`; o chefe Ultra da Arena é só Mareoror/Salsolura, `arena.ts:253,282`): os 20 ultras existem em arquivo e teste, mas hoje o jogador não os vê.
- **Bestiário:** `BestiaryCollection.tsx:26-27` ordena `ENEMY_ROSTER` por estágio com sort estável; o `#N` é a posição dentro do estágio. Regra já em uso: entrada nova vai no FIM do roster, então os `#N` existentes não mudam (`enemyRoster.ts:152`, `:182`).
- **Regeneração de 27/10 (`6ec46b1df`):** regerou 325 PNGs (85 de `novos/`, 102 ramos, 138 combinados) "com o mesmo nome e o mesmo enquadramento". Precedente direto: troca de arte in-place, mesmo nome de arquivo, zero mudança de código, ids e chaves intactos.
- **Renomear sem migrar:** §78/§67 (REGISTRO:2669) já renomeou Kenjo→Kenvar e Runix→Runeko mudando só o nome exibido; o id não muda, "nada a migrar em saves ou no bestiário".
- **Regra de dificuldade (#965, REGISTRO §437, `dificuldadeEstagio.ts`):** o sorteio escolhe a CÉLULA (estágio × nº de componentes do elemento, tabela §232) e só depois a criatura. As 20 bases e os ramos têm 1 componente (célula k=1). Trocar PNG não mexe em nada disso; acrescentar entradas k=1 só dilui DENTRO da célula k=1.
- **Nomes em i18n/docs:** os nomes das espécies vivem só em `novosSoulmonData.ts`, `enemyRosterData.ts` (ramos) e no REGISTRO (l.2599, 2630, 2669). Nenhuma string em `locales`/`i18n`, nenhum doc fora o REGISTRO (grep em `docs/`, `src/`, `public/`).

## 2. Opções para (a) "as formas atuais viram ramos de outros elementos e tipos"

Restrição de base: dá para trocar a arte das 5 linhas nos MESMOS ids/chaves sem tocar em save (precedente 27/10). O que está em aberto é onde as 20 formas antigas (champion/ultimate/mega + 5 ultras; os 5 rookies antigos, exceto os 4 que ficam, vão para arquivo) passam a viver.

- **Opção A (recomendada): "Ramos Legado" em elemento hospedeiro, nome novo, sem nenhuma pista da linha de origem.** Cada linha antiga (champion→ultimate→mega) vira UM ramo extra de uma criatura base de OUTRO elemento. Id novo `lg<origem>` sem hífen (ex.: `lgvibri`), chave `lgvibri-champion`; nome novo derivado da RAIZ DO HOSPEDEIRO + sufixo próprio (como os ramos atuais), nunca "Sonorana/Sonorath/Echoreign" fora da linha de som. Elemento e golpes = os do hospedeiro (como já é em todo ramo: `buildRamos`, `enemyRoster.ts:155-169`). Tipo/alinhamento: o ramo ocupa o "tipo" que o hospedeiro ainda não mostra com essa arte (o jogador vê a forma antiga como mais uma irmã do hospedeiro). Arte vai para `novos-arquivo/legado/<id>-<estagio>.png` (arquivo, fora do bundle de JS) lida só por `enemyRosterArt.ts`. Ultras antigos: arquivo (sem consumidor, como hoje). Mapeamento SUGERIDO (a confirmar olhando as 20 imagens, não vi os sprites): som→ar, eletricidade→industrial, tempo→espaço, arcano→luz, marcial→vigor.
  - Prós: ninguém vê "espécie de som" dentro de outra linha; mantém 100% da arte antiga viva; segue o padrão `ramo` já testado; `#N` existentes intactos (entradas no fim).
  - Contras: 15 entradas novas por estágio (5 linhas × champion/ultimate/mega) no pool k=1 diluem chance de cada forma; arte antiga com silhueta de som aparece com elemento ar (golpes/FX de ar): coerência visual depende da escolha do hospedeiro.
- **Opção B: variantes/skins da MESMA linha** (ex.: `sonorana` clara/escura, ou 2º ramo por linha). Mesmo elemento, sem hospedeiro. Prós: zero conflito de identidade; golpes iguais. Contras: um jogador vê dois "Sonorana" diferentes no Bestiário (o dono pediu "outros elementos e tipos"); cria duplicata de espécie com nome parecido.
- **Opção C: só arquivar (sem uso no jogo).** Mais barata (0 código), mas contraria a regra do dono de que os atuais "continuam no jogo".
- **Opção D: hospedeiros espalhados por forma** (cada estágio da linha antiga em elemento diferente). Descartada: quebra a cadeia visual rookie→champion→ultimate→mega e multiplica ids.

Pergunta residual do nome (também decide o dono): **a linha NOVA mantém os nomes atuais** (Vibri/Sonorana/Sonorath/Echoreign/Cacophonarch etc.), preservando ids, chaves e ramos existentes, ou ganha nomes novos? Recomendado: manter (zero migração; precedente de renomear só em `NOVOS_DATA`/`FORMAS_ALTAS`).

## 3. (b) Saves existentes

- **Pets dos jogadores: sem impacto** (secção 0).
- **Bestiário (`bestiary`):** com a Opção A e ids mantidos, as chaves `vibri-champion`, `vibri-ultimate`, `vibri-mega`, `vibripoder-*` etc. continuam válidas; quem "já viu" Sonorana passa a ver a CÉLULA com a arte nova (a mesma chave). As formas antigas viram chaves novas `lg*-*`, que começam "não vistas" para todos. Chave desconhecida de cliente antigo é ignorada pelo Bestiário (`bestiaryMigrate.ts:5`), idempotente. **Não é preciso função de migração**; só decidir (pergunta 2) se se quer marcar `lg*` como vistas para quem já tinha a chave antiga (recomendado NÃO: o jogador ainda não encontrou o ramo com a cara dele em outro elemento).
- **Snapshots de combate em andamento** (`stage`/`roster` com `<id>-<tier>`): ids inalterados, apenas o PNG muda; um combate aberto na virada de versão mostra a arte nova.
- **Cache/CDN:** os PNGs têm hash de nome (Vite); `public/sw.js:47` `PRECACHE_URLS` precisa ser conferido (não vi os PNGs de `novos/` listados; se estiverem, trocam de hash sozinhos no build).

## 4. (c) Nomes, Bestiário e numeração #N

- Linha nova com ids/nomes atuais: nenhum nome muda, nenhum `#N` muda.
- Opção A: +15 entradas (5×3) no FIM de `ENEMY_ROSTER` (depois de `buildUltimates2Comp`, origin/main l.209/285) → entram como os maiores `#N` dentro de champion, ultimate e mega; nada anterior muda de número. O contador `X / total` do Bestiário sobe em 15.
- Rookie de TEMPO: troca só a arte (`tempo-rookie.png`, id `chronib`); o nome "Chronib" pode ficar. O rookie antigo de tempo vai para arquivo (a menos que o dono queira reaproveitar como ramo-rookie, o que o roster não suporta: ramos só têm champion/ultimate/mega).
- Testes que fixam contagem: `enemyRoster.test.ts:28` (`toHaveLength(20*4 + 211 + ... + 120 + ...)`, origin/main l.31 já tem `+ 14`) e `novosSoulmon.test.ts:157-165` (manifest/ramos). Entradas novas exigem atualizar só a soma.

## 5. (d) Arquivos e peso

- Troca in-place: 25 PNGs em `src/assets/soulmon/novos/` (5 linhas × 5 estágios; mas 4 rookies ficam e só o de tempo troca, então são 21 substituições): **+0,43 MB** no total (novos = 1,65 MB vs atuais 1,22 MB para os 25; o `novosSoulmon.test.ts:42` exige < 150 KB por arquivo, e vários novos passam: `som-champion` 318 KB no total da categoria, por arquivo pode estourar; checar um a um e, se preciso, paletizar como foi feito nos widgets) .
- Opção A: 15 PNGs (champion/ultimate/mega das linhas antigas) movem de `novos/` para `novos-arquivo/legado/` (≈ 0,76 MB): **peso de rede/APK +~0,76 MB** (assets emitidos pelo Vite), **JS +15 strings** (via glob eager em `enemyRosterArt.ts`, mesmo padrão dos ramos). Os 5 ultras antigos e 4 rookies antigos ficam só em arquivo, fora do bundle (já é o regime de `novos-arquivo/` sem import).
- `dist/` é commitado e o APK espelha `android/app/src/main/assets/public/...`: regenerar só no próximo build de integração (REGISTRO:2794); orçamento de bytes JS (`orcamentoDeBytes.contract.test.ts`) não é tocado por PNG, só pelos +15 itens de tabela (desprezível).
- `manifest.json` de `novos-arquivo/` (hoje 120 ramos + 267 combinados) precisa listar os 15 novos, senão o teste de órfãos (`novosSoulmon.test.ts:134-150`) falha.

## 6. (e) Oráculo, dificuldade (#965) e pacote de combinados em andamento

- **Oráculo:** não consome estas espécies; o `ELENCO_ORACULO_DATA` (Mareoror/Salsolura) é outro bloco (`enemyRosterData`), no fim do roster. Sem impacto.
- **#965 (tabela §232):** nova arte nas 20 bases não muda a regra. Os 15 `lg*` entram na célula k=1 (1 componente, como todo ramo): a chance da célula (champion 35%, ultimate 15%, mega 10%) não muda; só repartem a fatia k=1 com mais 15. Efeito: cada ramo/base individual aparece um pouco menos. Conferir com `dificuldadeEstagio.test.ts` e a simulação da Arena (`ENEMY_STAGE_UNLOCK_LEVEL` e `RAMO_CHANCE` seguem iguais).
- **Colisão com o pacote de combinados (`novos-arquivo/combinados-formas` e linhas novas no fim do `ENEMY_ROSTER`):**
  - Arquivos novos: caminhos diferentes (`novos-arquivo/legado/`, `src/assets/soulmon/novos/*` já existentes). Sem colisão de arquivo.
  - Código: **a linha 285 de `enemyRoster.ts` (declaração de `ENEMY_ROSTER`) e a soma do teste (`enemyRoster.test.ts:28/31`) são editadas pelos dois lados.** Mitigação: abrir a branch a partir de `origin/main` depois que o pacote de combinados mergear, e acrescentar `...buildLegado()` DEPOIS de `buildUltimates2Comp()`; ou receber o pacote deles e rebasear. Não colidem em `novosSoulmon.ts` (só trocam-se PNGs, os imports não mudam) se se mantiverem os mesmos nomes de arquivo.
  - Para não fixar uma ordem mais frágil, a nova tabela fica num arquivo próprio (`enemyRosterLegado.data.ts`) em vez de crescer `enemyRosterData.ts`.

## 7. (f) Plano em passos pequenos (PRs separados)

1. **Arte in-place (PR 1, sem código):** copiar os 21 PNGs novos sobre `novos/<elemento>-<estagio>.png` (rookie só tempo; champion/ultimate/mega/ultra das 5). Rodar `novosSoulmon.test.ts` (256², RGBA, < 150 KB; ajustar paleta se algum estourar). Antes de sobrescrever: mover os 20 PNGs antigos (champion/ultimate/mega/ultra de 5 linhas) e o rookie antigo de tempo para `E:\Soulmon-assets\_lote-16-11\legado-v0\` (backup fora do repo) e `novos-arquivo/legado/`. Risco: perde-se o original se não arquivar antes. Teste: `novosSoulmon.test.ts`, `enemyRoster.test.ts`, lint de sprites (`sprites.dungeonRoster.test.ts`).
2. **Conferência visual (no mesmo PR 1):** folha de contato de rookie atual × champion novo por linha. Risco: o champion v1 foi desenhado a partir do rookie v1, não do rookie atual que fica (continuidade da cadeia); o dono vê a folha antes do merge.
3. **Ramos Legado (PR 2, depende da decisão de a):** `enemyRosterLegado.data.ts` (tabela `[hospedeiro, elemento, id legado, nome champion/ultimate/mega]`, nomes novos sem a raiz de origem), `buildLegado()` em `enemyRoster.ts` (kind `'ramo'`, artFile `legado/<id>-<estagio>`), glob `novos-arquivo/legado` em `enemyRosterArt.ts` (como `RAMOS_ART`, `enemyRosterArt.ts:55`), `manifest.json`, atualizar a soma do `enemyRoster.test.ts`. Só depois do pacote de combinados mergear (conflito de linha). Risco: sorteio com ramo muda quem aparece nos ~1/3 de `RAMO_CHANCE`; teste de determinismo da Arena (card = luta) deve continuar passando, sem `rng` a mais.
4. **Verificação:** `arena.test.ts`, `dificuldadeEstagio.test.ts`, `arenaTema.test.ts`, `dungeonElementos.arte.test.ts`, `spriteElement.contract.test.ts`; e olhar Bestiário + Arena no navegador com level 22+ (Mega).
5. **Publicação:** commit por caminho (árvore compartilhada perde trabalho: memória do projeto), PR, merge ff. Sem deploy do site-beta.

Rollback: reverter o PR 2 retira os `lg*` (bestiário ignora chave desconhecida); reverter o PR 1 devolve os PNG antigos (por isso o arquivo antes).

## 8. Resumo (dos números)

| Item | Valor |
|---|---|
| Arte nova | 25 PNGs; 21 substituições (rookie só do tempo), 4 rookies atuais ficam |
| Saves de pet impactados | 0 |
| Chaves de Bestiário que mudam de sentido | 0 (mesmas chaves, arte nova); +15 chaves novas (Opção A) |
| `#N` existentes que mudam | 0 |
| Peso de assets | +0,43 MB troca + ~0,76 MB legado (APK/rede); JS ≈ +15 strings |
| Colisão provável | linha de `ENEMY_ROSTER` e soma de `enemyRoster.test.ts` com o pacote de combinados |

## 9. Perguntas que só o dono decide

1. **Onde vivem as formas antigas?** (a) **Recomendada: A**: viram ramo extra de outro elemento hospedeiro com nome novo (sugestão som→ar, eletricidade→industrial, tempo→espaço, arcano→luz, marcial→vigor; a confirmar olhando os sprites). (b) Opção B: variantes na mesma linha. (c) Só arquivar. (d) Outro mapeamento seu.
2. **Nomes da linha nova:** manter os atuais (Vibri/Sonorana/Sonorath/Echoreign, Voltrix/Fulgurion, Chronib/Tempora, Runeko/Arcanowl, Kenvar/Shihanor, e Ultimate/Mega/Ultra de `FORMAS_ALTAS`)? **Recomendado: sim.** Ou nomes novos para a v1?
3. **O Bestiário marca os `lg*` como já vistos** para quem tinha a chave antiga? **Recomendado: não** (o jogador ainda não encontrou o ramo com a cara dele no hospedeiro).
4. **Ultras:** os 5 ultras novos entram só em arquivo (sem uso, como os 20 de hoje) ou quer dar uma função (chefe especial da Arena)? **Recomendado: só arquivo agora** (decisão futura, como o chefe Ultra de §10/11 que hoje só existe para Mareoror e Salsolura).
5. **Rookies antigos de tempo e dos outros 4:** arquivar (recomendado) ou ainda mostrar em outro lugar?
6. **Ordem de entrega:** liberar a troca de arte (PR 1) já e deixar os Ramos Legado (PR 2) para depois do pacote de combinados? **Recomendado: sim.**
