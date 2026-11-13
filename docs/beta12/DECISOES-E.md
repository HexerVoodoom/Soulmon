# Beta12 · Frente E (E2 — Tabela de Soulmons e NPCs): decisões

Escolhas abertas de E2.7, seguidas na opção mais conservadora (sem modal ao dono; a revisar quando ele quiser).

1. **Ataque sem ficha determinística:** a ficha depende do save, então toda linha de Soulmon sai com `origem_ataque = padrao`:
   `ataque_basico` e `ataque_especial_escola` = `ESCOLA_SKILL_PADRAO` (`conjuracao`), `ataque_especial_familia` = `ESCOLA_FAMILY_PADRAO[conjuracao]` (`direct`).
   Consequência: as 32 linhas de Soulmon têm o mesmo ataque. É o padrão do código, não uma escolha por espécie; o dono edita no painel e o CSV leva a mudança.
2. **Starters:** estágio único `rookie`, `ramo` vazio (rookie nunca tem ramo, como no corvo). Id `soulmon.<starter>.rookie`.
3. **Linhas de masmorra:** a tabela usa a arte de LINHA (`OWN_LINE_SPRITES`, 4 linhas x 4 estágios, sem ultra), não a do chefe da masmorra. O nome vem de `DUNGEON_LINE_NAMES` (Cinderhorn, Corallume, Obsidarch, Glimmerswarm), igual nos 4 estágios.
4. **Ramos das linhas:** só o que o nome do arquivo de arte diz. `kaelen` tem `-power` em champion/ultimate/mega (ids `soulmon.kaelen.champion-power` etc.); `thalindra`, `igni`, `astrase` não têm sufixo, `ramo` vazio.
5. **Ultra:** só o corvo tem `ultra` em arte de linha.
6. **NPC em mais de um registro:** uma linha por ARTE (arquivo). Precedência do registro canônico: `lot`, `area`, `stall`, `function`, `extra`, `novo`, `boss`, `torneio` (o nome vem do registro que o jogo mostra). Os outros registros ficam citados em `fonte_codigo` ("mesma arte tambem em"). Pares do mesmo personagem em poses diferentes (`alquimistaLimo`/`Costas`, `ossario*`, `serpentePlumada*`, `luaTrono*`) são artes distintas e mantêm uma linha cada.
7. **NPC:** `linha_id`, `estagio`, `ramo` vazios; `elemento` só onde o código tem (`BOSS_ELEMENT` dos 24 chefes, `DESAFIANTE_ELEMENT` dos 3 desafiantes do Torneio); `origem_ataque = sem_ataque`. Chefes e desafiantes entram porque E2.3 os lista (`bossRoster`, `tournamentNpcs`).
8. **Fora da tabela:** linhas aposentadas (`RETIRED_LINE_IDS`), `LIBRARY_NPCS` e `bestiary/pool.json`.
9. **Vocabulário de elemento:** os 8 `ElementId` do oráculo mais todos os valores de `SPRITE_ELEMENT` (criaturas base, combinados, chefes, iniciais, linhas, `neutro`). O teste confere linha a linha.
10. **Testes em `tests/`** (não em `src/`): `tests/tabelaSoulmonsNpcs.test.ts`. O jsdom do `node_modules` compartilhado está quebrado (falta `@asamuzakjp/css-color`), então o teste do filtro e do painel roda o trecho `LOGICA` extraído do HTML gerado; a cola de DOM foi conferida no navegador.

## Como regenerar
`node scripts/gerar-tabela-soulmons-npcs.mjs [pasta]` (padrão `docs/beta12/`): grava `tabela-soulmons-npcs.html` (publicar como Artifact privado), `.json` e `soulmon-npcs-beta12-v2.csv` (linha de base).
Validar um CSV editado antes de importar: `validarImportacao` em `scripts/tabela-beta12/importar.mjs`.

## Formato v2: coluna `usar_no_jogo`
11. **`usar_no_jogo`** ∈ {`sim`, `nao`}, default `sim`, ao FIM do cabecalho (14 colunas). Como a coluna muda, o formato sobe para v2: arquivo `soulmon-npcs-beta12-v2.csv` (o v1 gerado foi removido). No HTML e selecao editavel (sem opcao vazia) e filtravel (10 filtros). No importador: aceita v2 e v1 (sem a coluna; todas as linhas contam como `sim`); valor fora de {sim,nao} ou vazio e erro com o numero da linha. A coluna e so uma marca do dono: nada no jogo le `usar_no_jogo` ainda.
