# Fase 2 do Oráculo — sequência de PRs pequenos e reversíveis (rodada 2)

Base: `docs/PLANO-ORACULO.md` §2 (Fase 2) + `plano-arquitetura.md` (rodada 1) +
`src/utils/oracle.ts` (3808 linhas), `src/deploy/orcamentoDeBytes.contract.test.ts`
(guard de bundle), `vite.config.ts`, `src/utils/soulProfile/pipeline.ts`,
`src/utils/soulProfile/derivedElements.ts`.

Achado novo desta rodada (medido, não repetido de memória): `ELEMENT_INFO` /
`ROLE_INFO` / `REALM_INFO` / `ALIGNMENT_INFO` só são lidos por
`src/components/OraclePage.tsx` (`grep -rn "ELEMENT_INFO\|ROLE_INFO\|REALM_INFO\|CLASS_MATRIX\|CREATURE_FAMILIES\|MOTIVO_ELEMENTO_CLASSE" src` fora de `oracle.ts`/testes — zero resultado em `App.tsx`, `PetPage.tsx`, `CompanionHUD.tsx`). E `OraclePage` **já é `lazy()`** em `App.tsx:642` (`const OraclePage = lazy(() => import('./components/OraclePage')...)`), consumida só na `OraclePage` interna (`App.tsx:6219`, sem entrada na navegação — confirma `CLAUDE.md` §Oráculo). Ou seja: nenhuma dessas quatro tabelas de vocabulário-INFO precisa ficar no chunk de entrada por causa da Home. O que a Home realmente consome é só `axes.ts` (`ELEMENT_ORDER`, `NUMBER_ELEMENTS`, etc. — as constantes de CÁLCULO, não as de exibição), e `axes.ts` roda dentro do pipeline assíncrono (`await import('../soulProfile')`), não estaticamente do `App.tsx`.

Isso muda o PR 2 da rodada 1: não é "parte do vocabulário fica, parte sai" —
é "o vocabulário inteiro pode sair do chunk de entrada", porque quem o lê
estaticamente (`oracle.ts` → `axes.ts`, síncrono) só o consome DENTRO do
`soulProfile/` que já é `await import`. A única consumidora fora desse caminho
(`OraclePage.tsx`) já está atrás de outro `lazy()`.

---

## PR 1 — `oracle/familias.ts`: `CREATURE_FAMILIES` + `MOTIVO_ELEMENTO_CLASSE` via import dinâmico

**Arquivos tocados**
- Novo `src/utils/oracle/familias.ts` — recorta de `oracle.ts`: `CREATURE_FAMILIES`
  (l.1284, tipo `CreatureFamily[]`, hoje 72 entradas — é a dívida citada em
  `orcamentoDeBytes.contract.test.ts` linha `'index.js': 667_718` como "candidato
  óbvio para pagar") e `MOTIVO_ELEMENTO_CLASSE` (l.1875). Só dado — zero função.
- `src/utils/oracle.ts` — os dois símbolos deixam de ser `const`/`export const`
  no topo do módulo; os únicos dois consumidores internos que hoje leem
  `CREATURE_FAMILIES`/`MOTIVO_ELEMENTO_CLASSE` de dentro de `generateOracle`
  (l.3082) passam a receber os dados por PARÂMETRO, carregados por
  `await import('./oracle/familias')` no call site.
- Call sites de `generateOracle` (hoje síncrono): viram o ponto de fricção.
  Duas opções, e a arquitetura recomenda a B:
  - **A) `generateOracle` vira `async`.** Rejeitada aqui: são ~20+ call sites de
    teste + 2 reais (`SoulmonOnboarding.tsx`, `App.tsx`) que já fazem `await` do
    lado de `pipeline.ts` — mudar a assinatura pública do meio do funil é raio
    de erro maior que o problema que resolve.
  - **B) Introduzir `generateOracleAsync(input, seed?, overrides?)`** em
    `oracle.ts`: faz `const { CREATURE_FAMILIES, MOTIVO_ELEMENTO_CLASSE } =
    await import('./oracle/familias')` e chama a função pura interna
    `generateOracleWithFamilies(input, families, motivos, seed?, overrides?)`
    (renomeio do corpo atual de `generateOracle`). `generateOracle` original
    fica como **alias sync que faz import estático** (`import { CREATURE_FAMILIES... }
    from './oracle/familias'` no topo do arquivo) — ou seja, PR 1 sozinho **não
    tira nada do chunk de entrada ainda**; só separa o dado em arquivo próprio e
    prova que a função pura não depende de estar no mesmo módulo. Isso é
    deliberado: dividir "extrair" de "tornar preguiçoso" em dois PRs reduz o
    raio de cada um.
  - Quem de fato vira async (PR 1.5, ver abaixo) é só quem estiver disposto a
    pagar o `await` — que já são os dois call sites reais, porque `pipeline.ts`
    já os envolve em `async`.

**PR 1.5 (mesmo PR ou o seguinte, à escolha de quem executa — ambos pequenos)
— trocar os 2 call sites reais para `generateOracleAsync`:**
- `src/components/SoulmonOnboarding.tsx` e `src/App.tsx`: trocam
  `generateOracle(input, seed, overrides)` por
  `await generateOracleAsync(input, seed, overrides)` — ambos já estão dentro
  de função `async` (ligados ao pipeline), então o `await` não sobe mais uma
  camada.
- `oracle.ts` deixa de ter `import { CREATURE_FAMILIES, MOTIVO_ELEMENTO_CLASSE }
  from './oracle/familias'` estático no topo — essa linha é o que hoje prenderia
  o dado no chunk de entrada de novo; ela só pode existir dentro da função
  `generateOracleAsync`, atrás do `import()`.
- Os ~20 call sites de TESTE que chamam `generateOracle(...)` direto continuam
  funcionando sem `await` **só se** mantivermos o alias síncrono. Decisão
  proposta: manter `generateOracle` sync (import estático) como **wrapper de
  teste/legado**, e só os dois call sites de produção migram para o
  `...Async`. Isso é reversível e barato agora; quando os testes forem
  migrados (fora do escopo desta fase — não é bundle, é ergonomia de teste),
  o alias sync morre e o dado sai de vez do caminho síncrono.

**Risco**
- Médio-baixo. O risco real é duplicar `CREATURE_FAMILIES` sem querer (um
  import estático esquecido em algum lugar novo) — mitigado pelo teste de
  bundle do PR 3.
- Risco de regressão comportamental: zero, se `generateOracleWithFamilies` for
  bit-a-bit o corpo atual de `generateOracle` só com os dois símbolos como
  parâmetro — nenhuma lógica muda.

**Teste que prova**
- `npx tsc --noEmit` limpo.
- `npx vitest run src/utils/oracle.test.ts src/utils/oracle.soulProfile.test.ts
  src/utils/soulProfile/pipeline.test.ts` — mesmos resultados de antes (mesma
  seed → mesma saída; comparar snapshot do `generateOracle` sync com o
  `generateOracleAsync` para uma seed fixa, novo `it` temporário de paridade
  no próprio `oracle.test.ts`, apagável no PR seguinte quando o sync sumir).
- **Prova do encolhimento do chunk**: `npm run build` antes/depois, medir
  `dist/assets/index-*.js` (`ls -l`). **Neste PR sozinho o chunk NÃO encolhe**
  ainda (o import estático em `App.tsx`/`SoulmonOnboarding.tsx` via
  `generateOracleAsync` some do caminho síncrono, mas o `generateOracle` alias
  ainda importa estático `familias.ts` no topo de `oracle.ts` para servir os
  testes/legado — e como `oracle.ts` inteiro ainda é importado estaticamente
  por `App.tsx` fora do pipeline em outro ponto, precisa confirmar isso no PR
  3). A medição de bytes real só é reivindicada como prova no PR 3 (guard de
  bundle), não aqui — não prometer redução de KB neste PR evita o guard
  reprovar por expectativa errada.

**Reverter se quebrar**
- `git revert` do PR único (extração + rename são o mesmo commit): `familias.ts`
  some, `CREATURE_FAMILIES`/`MOTIVO_ELEMENTO_CLASSE` voltam para dentro de
  `oracle.ts`, `generateOracleAsync` some, os dois call sites voltam a
  `generateOracle` sync. Nenhum dado de save é afetado (é reorganização de
  código, a função pura produz a mesma saída).

---

## PR 2 — cortar o alias síncrono; `oracle.ts` para de importar `familias.ts` estaticamente

**Arquivos tocados**
- `oracle.ts`: remove o `import` estático de `familias.ts` e o wrapper sync
  `generateOracle`. Os ~20 call sites de teste que chamavam `generateOracle`
  direto são atualizados para `await generateOracleAsync(...)` — mecânico
  (find/replace + `await` no `it`/`test` já `async`, que é o padrão vitest
  usual aqui).
- Nenhum arquivo de produção muda (já migraram no PR 1.5).

**Risco**
- Baixo tecnicamente (mudança mecânica em teste), mas **~20 arquivos de teste
  tocados num PR só** é superfície de revisão grande — se preferir menor,
  divide por arquivo de teste (`oracle.test.ts`, `oracle.soulProfile.test.ts`,
  os `*.render.test.tsx` de `EvolutionPath`/`PetPage`/`SoulmonOnboarding`) em
  sub-PRs, cada um com o mesmo teste de prova.

**Teste que prova**
- `npx vitest run` completo (não só os arquivos do PR — a fronteira que
  interessa aqui é "nenhum teste no repo ainda importa `generateOracle` sync
  de `oracle.ts`"): `grep -rn "generateOracle[^A]" src --include=*.test.ts
  --include=*.test.tsx` deve devolver zero linhas fora de
  `generateOracleAsync`/`generateOracleWithFamilies`.
- **Prova do encolhimento do chunk (a que vale)**: `npm run build`, medir
  `dist/assets/index-*.js` antes/depois — espera-se queda perto dos **+15,1 KB**
  citados na `DIVIDA_ATUAL` de `orcamentoDeBytes.contract.test.ts` (comentário:
  "famílias visuais do Oráculo (48 → 72)... candidato óbvio: mover para chunk
  preguiçoso"), porque agora NADA estático (nem `oracle.ts`, nem quem o importa)
  arrasta `familias.ts`.
- `orcamentoDeBytes.contract.test.ts` deve reprovar sozinho se a queda não
  acontecer: a linha `'index.js': 667_718` fica **acima** do novo tamanho real
  medido, então o teste `dívida registrada é a REAL` falha ("linha de arquivo
  que já cabe no teto sai da lista") — **esse é o sinal, no próprio guard, de
  que a extração funcionou**: atualizar `DIVIDA_ATUAL['index.js']` para o novo
  valor medido (ou remover a linha, se cair abaixo de `TETO_JS_DE_ENTRADA` =
  250 KB, o que é improvável num PR só — o resto do chunk ainda é grande).

**Reverter se quebrar**
- `git revert`: o alias sync some outra vez, todo teste volta a chamar
  `generateOracle`. Sem efeito em dado de save.

---

## PR 3 — `oracle/vocabulario.ts`: `ELEMENT_INFO`/`ROLE_INFO`/`REALM_INFO`/`ALIGNMENT_INFO`/`CLASS_MATRIX` + `ELEMENT_ORDER` etc.

Correção da rodada 1: **nada disso precisa ficar no chunk de entrada por causa
da Home** — a Home não lê nome de elemento nenhum via essas tabelas (medido:
zero import fora de `oracle.ts` e `OraclePage.tsx`, e `OraclePage` já é
`lazy()`). A pergunta certa não é "o que a Home lê", é "o que `axes.ts` lê de
forma SÍNCRONA de dentro do pipeline assíncrono" — e a resposta é: nada que
precise ser síncrono, porque `axes.ts` só roda dentro de
`await import('../soulProfile')`.

Divisão proposta, em DOIS arquivos dentro de `oracle/vocabulario.ts` (mesmo
arquivo, duas seções, porque a fronteira real não é "exibição vs. cálculo" e
sim "quem lê"):

- **Tabelas de CÁLCULO** (consumidas por `soulProfile/axes.ts`, hoje `import`
  estático de `../oracle`): `ELEMENT_ORDER`, `ROLE_ORDER`, `ALIGNMENT_ORDER`,
  `REALM_ORDER`, `NUMBER_ELEMENTS`, `NUMBER_ROLES`, `NUMBER_ALIGNMENT`,
  `REALM_WEIGHTS`, `ROLE_ALIGNMENT`, tipos `ElementId`/`RoleId`/`AlignmentId`/
  `RealmId`. Mover para `oracle/vocabulario.ts`; `axes.ts` importa DAQUI, não
  de `../oracle` — corta o acoplamento onde `axes.ts` hoje arrasta (por tipo/
  parse) o arquivo de composição visual inteiro só para pegar ~10 constantes.
  Isso é seguro incondicionalmente porque `axes.ts` já só é alcançado por
  import dinâmico do `soulProfile/`.
- **Tabelas de EXIBIÇÃO** (`ELEMENT_INFO`, `ROLE_INFO`, `REALM_INFO`,
  `ALIGNMENT_INFO`, `CLASS_MATRIX`, l.2288): mesmo arquivo, ou
  `oracle/vocabularioExibicao.ts` separado se quem executar preferir granular
  — consumidas só por `OraclePage.tsx` (já `lazy()`) e por dentro de
  `generateOracleWithFamilies` (`CLASS_MATRIX`, usado para nome/flavor da
  classe). Como `generateOracleWithFamilies` já está atrás do
  `generateOracleAsync` (PR 1/2), `CLASS_MATRIX` pode entrar no MESMO
  `import()` de `familias.ts` ou em um próprio — recomendo próprio
  (`oracle/classMatrix.ts`) só se `CLASS_MATRIX` for grande o bastante para
  valer a pena medir separado; senão, junta em `familias.ts` para não
  multiplicar `import()`s pequenos (cada `import()` novo é uma promise extra
  no caminho crítico da criação, custo pequeno mas não zero).
- `oracle.ts` reexporta os símbolos de `vocabulario.ts` (`export * from
  './oracle/vocabulario'`) até que os poucos consumidores internos sejam
  migrados — mesma técnica de reexport do PR 1 da rodada 1, mantém
  `OraclePage.tsx` funcionando sem mudança nesta fase.

**Arquivos tocados**
- Novo `oracle/vocabulario.ts` (tabelas de cálculo + tipos).
- `oracle.ts`: remove as definições, reexporta.
- `src/utils/soulProfile/axes.ts`: import passa de `from '../oracle'` para
  `from '../oracle/vocabulario'`.
- `CLASS_MATRIX`/`ELEMENT_INFO`/etc.: ficam em `oracle.ts` reexportando de
  `vocabulario.ts` nesta fase (não precisam de import dinâmico ainda, porque
  já estão fora do chunk de entrada via PR 2 — `oracle.ts` deixou de ser
  arrastado estaticamente pelo `App.tsx`? **checar**: `App.tsx` ainda importa
  `oracle.ts` para outros símbolos como `hashString`/`normalizeName`/
  `ORACLE_QUESTIONS` — então `oracle.ts` continua no chunk de entrada mesmo
  depois do PR 2, só o CONTEÚDO pesado (`CREATURE_FAMILIES`) saiu dele. Logo
  `ELEMENT_INFO` etc., se ficarem em `oracle.ts` (mesmo que fisicamente
  movidos para `vocabulario.ts` e reexportados), continuam no chunk de
  entrada. **Se o objetivo é tirá-los também**, o PR precisa ADEMAIS trocar
  quem em `App.tsx`/`SoulmonOnboarding.tsx` usa `ORACLE_QUESTIONS`/
  `hashString`/etc. para importar só de um `oracle/nucleo.ts` enxuto, e mover
  `ELEMENT_INFO`/`ROLE_INFO`/`REALM_INFO`/`ALIGNMENT_INFO`/`CLASS_MATRIX` para
  trás do MESMO `import()` dinâmico de `OraclePage.tsx` (que já é `lazy()`,
  então já paga esse custo só quando a tela abre) — nesse caso `OraclePage.tsx`
  importa de `oracle/vocabularioExibicao.ts` direto, sem passar por
  `oracle.ts`.)

**Risco**
- Médio: é o PR que exige entender exatamente o que resta em `oracle.ts` vs.
  o que é núcleo síncrono real (`ORACLE_QUESTIONS`, `hashString`,
  `mulberry32`, `computeNumerology`, etc. — usados por `SoulmonOnboarding.tsx`
  antes do reveal, genuinamente síncronos e pequenos). Risco de over-engenharia:
  se o ganho de KB de mover só `ELEMENT_INFO`/`ROLE_INFO`/`REALM_INFO`/
  `ALIGNMENT_INFO`/`CLASS_MATRIX` for pequeno (são tabelas de tradução PT/EN,
  não 72 famílias com paleta+textura+objeto), medir ANTES de fazer — pode não
  compensar o PR.

**Teste que prova**
- `npx tsc --noEmit` limpo; `axes.test.ts` e `pipeline.test.ts` inalterados.
- `npm run build` + medir `dist/assets/index-*.js` de novo — se a queda for
  desprezível (<2-3 KB), documentar no ADR que este PR vale só pela fronteira
  de módulo (acoplamento de leitura), não pelo bundle, e ajustar a
  justificativa antes de abrir o PR.
- `OraclePage.tsx` continua renderizando igual (`grep` os testes de render
  existentes, se houver; senão screenshot manual via Playwright, regra do
  `CLAUDE.md` footgun #7).

**Reverter se quebrar**
- `git revert`: `vocabulario.ts` some, tabelas voltam para `oracle.ts`,
  `axes.ts` volta a importar de `../oracle`. Nenhum dado de save.

---

## PR 4 — teste de contrato de bundle (fecha a lacuna real, é o que prova os PRs 1–3)

**Arquivos tocados**
- Estender `src/deploy/orcamentoDeBytes.contract.test.ts` (já existe e já é o
  guard que serve) OU criar `src/deploy/oracleBundleSplit.contract.test.ts`
  dedicado — recomendo o segundo, porque a asserção é de NATUREZA diferente
  (não é "tamanho ≤ teto", é "símbolo X não aparece no chunk Y").
- Novo teste: varre `dist/assets/index-*.js` (o chunk de entrada, mesmo regex
  usado em `orcamentoDeBytes.contract.test.ts` linha `/src="\/assets\/(index-[...]+\.js)"/`)
  e falha se encontrar uma STRING exclusiva de `CREATURE_FAMILIES` (ex.: um
  nome de família visual só citado ali, tipo `'artrópode-elemental'` ou
  qualquer chave literal que só exista em `familias.ts` — pegar uma que
  sobreviva à minificação, já que nomes de `const` somem mas STRINGS literais
  do objeto não).

**Risco**
- Baixo. É teste novo, aditivo, não toca em lógica de produção.
- Cuidado real: escolher uma string que o minificador não pode "otimizar para
  fora" acidentalmente (evitar comparar chave de objeto que pode ser
  renomeada por terser — usar um VALOR string, não uma KEY).

**Teste que prova**
- O próprio teste é a prova. Passo de confiança exigido pelo framework
  (Alpha, barra de qualidade): rodar `npm run build` com um
  `import { CREATURE_FAMILIES } from './oracle/familias'` estático
  reintroduzido de propósito em `oracle.ts` (fora do `import()` dinâmico) e
  confirmar que o teste FALHA antes de aceitar que ele protege alguma coisa —
  documentar esse experimento no corpo do PR (paste do resultado vermelho),
  não só alegar.

**Reverter se quebrar**
- `git revert` do teste — sem risco de produção, é só guard.

---

## PR 5 — ponte 8↔17 elementos: tipo + teste de cobertura de SAÍDA

Este é o item do Plano-Oráculo Fase 1 ("Cobertura de SAÍDA da ponte 8→17") que
a Fase 2 formaliza em tipo. Não funde os dois sistemas (decisão registrada em
`ORACULO.md`: "as tabelas de afinidade... são vocabulário do jogo, não deste
motor").

**Arquivos tocados**
- `src/utils/soulProfile/derivedElements.ts`: adicionar tipo `ElementBridge`
  — algo como:
  ```ts
  type ElementBridge = {
    readonly from: ElementId;          // 8, jogo/visual (oracle/vocabulario.ts)
    readonly to: readonly ClassSystemElementId[]; // 17, base do class-system
  };
  ```
  documentando ao lado de `computeDominantClassElements` (a função existente
  que hoje faz a ponte implicitamente, lendo os 4 eixos de 8 + proeminência
  planetária e projetando nos 17/88 combos).
- Novo teste (mesmo arquivo ou `derivedElements.coberturaSaida.test.ts`):
  para cada um dos 8 `ElementId` (`ELEMENT_ORDER` de `oracle/vocabulario.ts`),
  gerar N perfis sintéticos dominantes nesse elemento e confirmar que
  `computeDominantClassElements` produz **ao menos 1** elemento base do
  class-system plausível — fecha a objeção do `alpha-skeptic` registrada no
  Plano-Oráculo §6/§7 ("a ponte 8→17 testaria cobertura de CHEGADA, não de
  SAÍDA" — hoje `criacaoDistribuicao.test.ts` mede que os 17/17 aparecem
  algures na simulação, não que CADA um dos 8 elementos de entrada alcança
  algum dos 17; este teste inverte o eixo).

**Risco**
- Baixo-médio: é teste novo sobre função existente, sem mudar comportamento.
  Risco real é achar, ao testar, que 1 ou mais dos 8 NÃO produzem uma saída
  plausível — nesse caso o PR vira dois: o teste (que documenta o achado) e a
  correção em `computeDominantClassElements` (fora do escopo "só
  arquitetura" — reportar como achado ao dono/QA, não consertar
  silenciosamente dentro do PR de refactor).

**Teste que prova**
- O teste novo em si, verde.
- `npx vitest run src/utils/soulProfile/pipeline.test.ts
  src/utils/soulProfile/ficha/buildSheet.*.test.ts` — nenhum resultado muda
  (o teste só OBSERVA `computeDominantClassElements`, não altera sua lógica).

**Reverter se quebrar**
- `git revert` do teste/tipo — sem efeito em produção (tipo é apagado em
  compilação, teste é só CI).

---

## PR 6 — `promptClassFlavor` sync × async: contrato por tipo

**Arquivos tocados**
- `src/utils/soulProfile/pipeline.ts` (e/ou `src/utils/oracle.ts`, onde
  `OracleInput` é definido — `oracle.ts:145` tem o campo
  `promptClassFlavor?: string`): dividir o tipo hoje único em dois:
  ```ts
  type OracleInputSync = Omit<OracleInput, 'promptClassFlavor'>;
  type OracleInputWithClass = OracleInputSync & { promptClassFlavor: string };
  ```
  e fazer `generateOracleAsync` (PR 1) aceitar `OracleInputWithClass` quando o
  chamador já tem a classe real calculada (`pipeline.ts` → `computeClassTitle`
  → `fichaByStage.ultra`) — hoje é convenção (comentário em
  `plano-arquitetura.md`: "a costura é só por convenção"), vira erro de
  compilação esquecer o campo.
- Call sites: `pipeline.ts` (que já tem `promptClassFlavor` calculado antes de
  chamar `generateOracleAsync`) passa a satisfazer `OracleInputWithClass`
  naturalmente; os ~20 call sites de teste que não passam classe real (fluxo
  legado/sem `soulProfile`) usam `OracleInputSync`.

**Risco**
- **O mais arriscado dos 6** (mesma avaliação da rodada 1, PR 6/"opcional"):
  mudança de tipo público exige tocar todos os call sites de uma vez (a
  distinção sync/async se torna um erro de compilação em cada um que estiver
  errado). Fazer **por último**, só depois que PR 1–5 estiverem estáveis em
  produção por ≥1 ciclo — isola o raio de erro.
- Risco funcional: zero, é tipo puro, TypeScript apaga em runtime — o risco é
  só de fricção de compilação/tempo de PR, não de comportamento.

**Teste que prova**
- `npx tsc --noEmit` pega em COMPILAÇÃO qualquer call site que não faça
  `await` ou que passe input incompleto para `OracleInputWithClass` — a prova
  é o build limpo, não um teste de runtime novo.
- `npx vitest run` completo, 100% verde, sem nenhum resultado numérico mudado
  (é refactor de tipo, não de lógica).

**Reverter se quebrar**
- `git revert`: os dois tipos colapsam de volta em `OracleInput` único
  opcional; call sites voltam a compilar sem a distinção. Sem efeito em save.

---

## Ordem recomendada e por quê

1 → 1.5 → 2 → 4 (guard antes de declarar vitória) → 3 → 5 → 6.

O guard de bundle (PR 4) vem logo depois da extração de família (PR 1/1.5/2)
e ANTES do PR 3 (vocabulário), porque é ele que vai medir se PR 3 vale a pena
— se o guard mostrar que `oracle.ts` sem `familias.ts` já cabe folgado no teto
de 250 KB, o PR 3 pode ser adiado ou reduzido ao mínimo (só a fronteira de
`axes.ts`, sem se preocupar com `ELEMENT_INFO`/`CLASS_MATRIX`, que são
pequenos). PR 5 e 6 são independentes dos PRs 1–4 (mexem em
`derivedElements.ts`/tipos, não em bundle) e podem rodar em paralelo por outro
executor, mas ficam depois na lista porque dependem de menos coisa estar
quebrada ao mesmo tempo (menor raio de revisão simultânea).

## O que este plano NÃO propõe (mantendo a decisão registrada)

Não funde `ElementId` (8, jogo/visual) com o elemento do class-system (17
base). A ponte (PR 5) fica mais explícita e testada do lado de saída; a
dualidade continua sendo vocabulário de camadas diferentes por design
documentado em `ORACULO.md`.


---

## Execução (28/09/2026)

- PR 1, 1.5, 2, 4, 5, 6 mergeados na `main` (#155–).
- **PR 3 (`oracle/vocabulario.ts`) ADIADO, medido**: `ELEMENT_INFO`+`ROLE_INFO`+`REALM_INFO`+`ALIGNMENT_INFO` somam ~6,8 KB (fonte sem espaço/comentário) e estão no `index-*.js`, mas quem os lê é o próprio `generateOracleWithFamilies`, que continua no grafo síncrono de `oracle.ts` (arrastado por `hashString`/`creatureFormId`/`ORACLE_QUESTIONS`). Tirá-los exige partir `oracle.ts` num núcleo enxuto — ganho < 7 KB contra 22,3 KB já pagos pelas famílias. Não compensa agora.
