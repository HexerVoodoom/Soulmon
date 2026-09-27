# Procedência do bestiário — o corte de 27/09/2026

> **Etiqueta:** registro. Fundamenta `scripts/bestiario-procedencia.mjs`, que é
> a régua VIVA. Se este doc e o módulo discordarem, o módulo vence.

Parecer do `soulmon-ip-brand-guardian` (27/09/2026), pedido pelo dono
("corrige o bestiário"). **Não é parecer jurídico** — é auditoria de risco de
produto. Os itens da §6 dependem de revisão jurídica.

## 1. O que havia

`pool.json` tinha **1.718 criaturas, 832 KB**, e entrava no bundle servido
(`dist/assets/pool-*.js`). Dessas, **1.101 (60,6%) eram de franquia de
terceiro** — não por acidente de dado, mas porque o sync as buscava.

**A causa-raiz não precisava de regex.** `scripts/sync-oracle-data.mjs` tinha:

```js
const FILES = ['variantes', 'enriched', 'faunaflora', 'pokemon', 'digimon', 'dnd'];
```

O script LIA `pokemon.json`, `digimon.json` e `dnd.json` de propósito, toda
vez, e só DEPOIS filtrava por `origem` — que nesses arquivos vem rotulada
`"Geração Procedural (Class-System)"`. O filtro inspecionava o rótulo errado de
um dado que tinha sido pedido deliberadamente.

**E a régua executável mentia.** `pipeline.test.ts` tinha um caso chamado
"nenhuma criatura do pool vem de franquia protegida" que passava **verde**. Ele
checava uma lista de onze nomes (`agumon|…|pokemon|pikachu|charizard|goku`),
**copiada** do script de sync. As duas cópias erraram igual — footgun 9 na
forma mais cara já paga aqui: régua copiada não diverge um pouco, mente nos
dois lugares ao mesmo tempo.

## 2. O que saiu — 64 bases procedurais + 2 entradas

As entradas procedurais são derivadas (`<Prefixo> <BASE> de <Elemento>`), então
poucas bases produzem muitas entradas. Alavanca medida: **64 bases → 1.101
entradas**.

| Titular | Bases |
|---|---|
| Nintendo / Game Freak / The Pokémon Company | **50** — a Pokédex Gen I (Bulbasaur…Zubat) |
| Wizards of the Coast (D&D) | 7 — ver §3 |
| Blizzard | Murloc, Deathwing, Zergling |
| Square Enix | Chocobo, Tonberry |
| Capcom | Rathalos |
| Tolkien Estate | Balrog |
| Marvel | as 2 `Ciclope` (a do pool era o **Scott Summers**; a `Ciclope Celeste` carregava o verbete da **Emma Frost**) |

⚠️ Franquias que o regex inicial **não podia achar**, encontradas pelo
guardião: Marvel, Gormiti (Giochi Preziosi), Fallout (Bethesda), Dragon Ball Z,
Anne Rice. É por isso que o critério é **allowlist, nunca denylist** — uma
denylist de franquia é uma lista mantida contra todo o entretenimento já
produzido, e essa corrida já foi perdida uma vez.

## 3. O D&D tem DUAS categorias, e fundi-las custa liberdade

| Base | Status |
|---|---|
| Beholder · Mind Flayer (Illithid) · Displacer Beast | **Product Identity, fora da OGL/SRD.** Nunca podem voltar. |
| Gelatinous Cube · Mimic · Tarrasque · Dragão Vermelho (Ancião) | **Estão no SRD 5.1, sob CC BY 4.0.** Saíram por outro motivo: a descrição não vem do SRD, vem da Wikipédia (e a do `Tarrasque` vinha do verbete do *Deathclaw*, de Fallout). **Podem voltar com texto próprio + atribuição CC BY.** |

Registrar a distinção é o ponto: quem fundir os dois grupos numa lápide só vai
achar que o SRD é proibido e jogar fora liberdade que o projeto tem.

## 3-A. ⚠️ Decisão do dono, 27/09/2026 (D-B1): o nome VAI no prompt

Posterior ao corte desta página, e muda uma premissa dela. A §4 abaixo
descreve como a inspiração era passada ao gerador **sem o nome**; hoje ela vai
**com**.

> *"pode deixar o nome da criatura aparecer no prompt, mesmo se tiver questão
> de direito autoral. Se não aceitar, você dá fallback para tirar."*

O desenho é o mesmo que o app já usava para as referências de gênero:

| | leva o nome? |
|---|---|
| `imagePrompt` (1ª tentativa) | **sim** — `Draw inspiration from <base>.` |
| `imagePromptFallback` (2ª) | não |

`functions/api/generate-sprite.js` já refaz com o fallback quando `isRefusal`
reconhece uma recusa por política de conteúdo. **Quem decide o limite é o
provedor**, não uma lista nossa — e por isso o par de variantes é a parte que
não pode cair.

**O que NÃO mudou**, e está travado em `pipeline.test.ts`:
- a cláusula `Do not copy any existing franchise character` continua nas DUAS
  variantes (citar a inspiração não é licença para devolver personagem
  registrado);
- o nome continua **fora do que o jogador lê** — nome, bio e descrição por
  forma seguem sem ele.

**Interação com o corte desta página:** o pool filtrado não tem mais nome de
franquia, então na prática o que viaja hoje são as 12 bases de fauna/flora
real e a mitologia — domínio público. A decisão vale para o mecanismo, e a
premissa muda se o pool voltar a receber franquia.

## 4. O drift de descrição — sistêmico, e o risco mais alto

O campo `descricao` do upstream veio de busca textual que **não valida se o
artigo encontrado é o artigo pedido**. Medido: a base `Dragão Vermelho
(Ancião)` aparece com **três descrições diferentes** no mesmo pool — dragão,
*Gormiti* e a lista de episódios de *Dragon Ball Z*.

**Por que isso é pior que sujeira:** `pipeline.ts` monta o texto de inspiração
REMOVENDO o nome da criatura da descrição. Quando a descrição é de outro
personagem, remover o nome não remove nada — e o texto de um personagem
registrado entra no prompt que gera a arte do usuário. A cláusula *"Do not copy
any existing franchise character"* do `oracle.ts` estava sendo contrariada pelo
próprio insumo que o pipeline lhe entregava. **É o único vetor que produz obra
derivada nova, em vez de só transportar dado.**

É isso que a camada 3 (corroboração nome↔descrição) fecha.

## 5. O critério, em quatro camadas

Dono único: **`scripts/bestiario-procedencia.mjs`**, importado pelo script de
sync **e** pelo guard de `pipeline.test.ts`.

| Camada | O que faz |
|---|---|
| **0 — não ingerir** | `FILES` sem `pokemon`/`digimon`/`dnd`. Custo zero, não depende de acertar lista de nomes. |
| **1 — allowlist de BASES** | 12 bases, todas fauna/flora real. Base nova do upstream é **rejeitada por padrão**. |
| **2 — rede sobre a descrição** | vocabulário que declara ficção + os titulares. Não decide o corte; **grita** quando algo passa pelas camadas 0 e 1. |
| **3 — corroboração nome↔descrição** | ao menos um token significativo do nome aparece na descrição. Pega a contaminação que não se sabe nomear. |

## 6. Resultado medido

| | |
|---|---|
| Pool antes | 1.718 · 832 KB |
| Saíram | **1.101** |
| Pool depois | **617** · **374 KB** (−458 KB no bundle) |
| Sobreviventes com nome de franquia | **0** |
| Sobreviventes com titular na descrição | **0** |

## 7. O que NÃO foi resolvido, e depende do dono

1. **Diversidade de família.** Sobraram 617 entradas, mas de apenas **12
   espécies** procedurais. O eixo de parentesco do `bestiaryLineage` (que faz
   "dragão tender a dragão") fica com 12 nós. Cinco prefixos sobre o mesmo
   cachorro não são cinco criaturas. **O conserto não é encolher, é trocar a
   fonte**: subir o `POOL_TARGET` e deixar a amostragem estratificada colher
   fauna e flora reais — a biodiversidade real é maior que a Pokédex e é
   domínio público. **Exige rodar `npm run sync:oracle-data` com os repos
   irmãos clonados**, o que não é possível na sessão em nuvem.
2. ⚠️ **RESOLVIDO em 27/09/2026 pela curadoria (§9), para o pool de hoje.**
   As descrições eram texto da Wikipédia lusófona e da Wowpedia, ambas CC
   BY-SA — redistribuir sem atribuição violava a licença inclusive nas
   entradas de domínio público. A curadoria substituiu as 37 bases por texto
   ORIGINAL. **Continua sendo item a vigiar**: a régua de cobertura
   (`curadoria.contract.test.ts`) reprova qualquer base nova que chegue sem
   entrada na `CURADORIA` — é isso que impede o problema de voltar por um
   sync futuro sem que ninguém perceba.
3. **A saída que fecha 1 e 2 de uma vez** (recomendação arquitetural do
   guardião, para a v1.1): **parar de embarcar prosa de terceiro**. O pipeline
   só precisa de `elementos`, `familia`, `biologia`, `bioma`, `tamanho`,
   `atributos`. Sintetizar o texto de inspiração dos campos estruturados e
   **não gravar `descricao` no `pool.json`** elimina o vetor de copyright, o
   drift, a obrigação CC BY-SA e mais ~200 KB. É o análogo exato da decisão de
   07/09/2026 sobre `LEGACY_FORM_TIERS`: o dado não precisava existir.
4. **Revisão jurídica** — acima do limiar do guardião: a distribuição já
   ocorrida, o drift alimentando o gerador de imagem, a conformidade CC BY-SA,
   e se as três do SRD podem voltar.

## 9. Curadoria (27/09/2026) — nome, tags e descrição coerentes

Pedido do dono, depois do corte: *"vamos trabalhar no pool e no próprio
bestiário pra que tenha o nome da criatura, tags e descrições coerentes e
corretas"*.

Medido no pool JÁ filtrado (617 criaturas, 37 bases distintas):

| Problema | Medida |
|---|---|
| Descrição terminando no meio de uma palavra | **442/617 (72%)** — `.slice(0, 200)` cortava sem olhar limite de frase |
| `familia` corrompida pelo elemento | toda variante "de Fogo" de Cão/Elefante Africano/Urso-d'água virava `familia: "ignea"`, perdendo a família real (20 entradas) |
| `familia` fisicamente impossível | Mantícora (fera terrestre) e Welwitschia (planta do deserto) vinham `"aquatica"` |
| Drift não-franquia | Urso-d'água tinha variantes com a descrição de "zona habitável" (astronomia) e de um filo de **fungos** — nada a ver com o animal |

**Por que a `familia` corrompida importa e não é só estética:** ela decide o
bônus de continuidade de linhagem em `bestiary/select.ts` (a regra que faz
"dragão tender a dragão"). Um Cão de Fogo com `familia: "ignea"` ficava cego
para essa continuidade justamente nas 5 variantes de fogo.

**Conserto:** `scripts/bestiario-curadoria.mjs`, dono único, aplicado depois
de `entradaPermitida` — no script de sync (sobrevive ao próximo sync) e na
poda do `pool.json` atual. Cobertura: **37/37 bases** (as 12 espécies reais
procedurais + os 19 tipos/entradas únicas não-procedurais), com descrição
completa, família e biologia coerentes, e corroboração nome↔descrição
mantida (mesma régua da procedência).

**Efeito colateral que resolve a pendência §7.2 (CC BY-SA), para o que foi
curado**: as descrições novas são texto ORIGINAL, escrito a partir de
conhecimento geral de biologia e mitologia de domínio público — não mais
cópia da Wikipédia ou da Wowpedia. Como a cobertura é 100% do pool atual, a
obrigação de atribuição CC BY-SA **deixa de se aplicar** às 617 criaturas de
hoje. Ela volta a valer se um sync futuro trouxer descrição não-curada (base
nova fora da tabela) — por isso a régua `curadoria.contract.test.ts` exige
que toda base do pool tenha entrada na `CURADORIA`, e reprova silenciosamente
o que não tiver.

Régua: `src/utils/soulProfile/bestiary/curadoria.contract.test.ts`.

## 8. Sem migração de save

O pool não é persistido. `bestiaryPick` é derivado de `identityKey` + salt, então
trocar o pool muda a inspiração de um reroll futuro e **não quebra save nenhum**.
