# Cobertura de criaturas por elemento (auditoria de 09/11/2026)

Origem: relato do dono ("Blue Flame mostra criatura de Vigor; no Selvagens só vai até o champion; era pra ter até o Ultra em todo elemento base e pelo menos 1 exclusivo por combinado"). Fonte dos números: `ENEMY_ROSTER` (`enemyRoster.ts`) lido por um teste descartável + listagem dos PNG em `src/assets/soulmon` e em `E:/Soulmon-assets`. Nenhuma arte foi gerada.

## 1. Elementos base (20) × estágio

| Estágio | PNG no app (`novos/<el>-<estágio>.png`) | No roster de inimigos | Observação |
|---|---|---|---|
| rookie | 20/20 | 20/20 | |
| champion | 20/20 | 20/20 | |
| ultimate | 20/20 | 20/20 | nomes em `FORMAS_ALTAS` |
| mega | 20/20 | 20/20 | |
| ultra | 20/20 | **0/20** | por desenho: Ultra é só o chefe da Arena (`enemyRoster.ts`, cabeçalho) |
| ramos (champion/ultimate/mega) | 2 ramos por elemento × 20 | 40 ramos × 3 estágios | benevolência/harmonia |

Os 20 elementos base têm as 5 formas instaladas e cada forma está classificada no próprio elemento (`novo:<el>` em `spriteElement.ts`, prefixo do arquivo = elemento). **Fogo e Vileza não estão incompletos**: têm rookie→ultra como os outros 18.
Por que o Selvagens para no champion: `wildFoeLabel` chama ultimate/mega de **Desgarrado** (aba própria), então "Selvagens" mostra só rookie/champion por regra, não por arte faltando. O Ultra nunca é sorteado como inimigo (só chefe).

## 2. Elementos combinados

- 269 elementos entram na Fenda (20 base + 249 combinados). **Todos têm ≥ 1 criatura exclusiva sorteável** (o teste novo falha se um não tiver). Cada combinado tem **1** criatura (só a forma rookie); a Fenda mostra sempre o rookie.
- 267 entradas `combinado|rookie` no roster; **6 sem PNG próprio** (mostram o rookie do base do 1º componente): `clareira`, `floresta_ancestral` (planta), `alto_forno`, `colosso_blindado` (industrial), `bencao_feerica`, `corte_feerica` (fada). Lista fixada em `dungeonElementos.arte.test.ts`.
- **Instalado e sem uso:** `novos-arquivo/combinados-formas/` tem champion/ultimate/mega de 50 combinados (212–261: geiser … cavaleiro_absoluto), 150 PNG, **sem nenhum consumidor** (`novosSoulmon.test.ts` declara). Os combinados 212–261 aparecem na Fenda só como rookie.

## 3. Criaturas cujo elemento declarado não bate com a arte

| Criatura | Declarado | Arte | Veredito |
|---|---|---|---|
| Embaha (`cmb009`, `009-chama_azul.png`) | chama_azul (fogo+morte) | urso-centopeia marrom com capa vermelha e brasas laranja; nada azul; mesma ideia da forma ultimate de Vigor (urso-centopeia com caveiras) | **arte errada** (provável "Embarra" do dono). Não existe arte azul em lugar nenhum |
| 6 do lote 4 (acima) | próprio | rookie do base | quebra-galho declarado |

Não achei outro caso por regra mecânica; o julgamento é visual e só 009 é flagrante. Histórico: antes de 27/10 (`6ec46b1df`, "regera 325 sprites") o 009 era um dragão preto com chamas laranja (também não azul), e o Vigor ultimate já era o urso-centopeia de caveiras. Não dá para provar por git se a arte atual do 009 saiu de um lote de Vigor desalinhado; a evidência é só visual.

## 4. Gerado em `E:/Soulmon-assets` e não instalado

- Sprites de criatura: **nada ausente do app**. As diferenças de hash em `linhas-elemento-api/novos` (10), `linhas-elemento-api/novos-arquivo` (7) e `sprites-elementos-novos/final` (1) são versões de 27/10 que o app já substituiu por versão mais nova de mesmo nome (checado por nome e data).
- `elementos-novos/lote1-3` e `curados-novos`: ícones de elemento (`el-*`), não criaturas; o app tem 280 `el-*`.

## 5. O que falta gerar (só com decisão do dono)

1. Embaha / Chama Azul com **cor azul** (REGISTRO §255, fila `ASSETS-A-GERAR` §29). Nenhum outro Blue Flame existe: o único é o 009.
2. 6 rookies do lote 4 (acima).
3. Se o dono quer mais de 1 exclusivo por combinado: só rookie existe hoje; 50 combinados já têm champion/ultimate/mega prontos e instalados, falta **ligar** ao roster (decisão de escopo, não arte).
4. Se o dono quer Ultra de inimigo selvagem: o roster não sorteia ultra por desenho; mudar isso é decisão de regra (afeta balanceamento), a arte dos 20 Ultra já está instalada.
