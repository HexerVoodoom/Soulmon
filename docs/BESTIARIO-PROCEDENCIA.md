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
2. **CC BY-SA.** As descrições são texto da Wikipédia lusófona e da Wowpedia,
   ambas CC BY-SA. Redistribuir sem atribuição viola a licença **inclusive nas
   114 entradas de domínio público que ficaram**. `docs/Attributions.md` não
   menciona Wikipedia nem Creative Commons. **Cortar as 64 bases não fecha este
   item.**
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

## 8. Sem migração de save

O pool não é persistido. `bestiaryPick` é derivado de `identityKey` + salt, então
trocar o pool muda a inspiração de um reroll futuro e **não quebra save nenhum**.
