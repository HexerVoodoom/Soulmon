# Oráculo do Soulmon — mapa de arquitetura e plano de migração

## 1. Ponta a ponta

```
entrada (6 perguntas sempre + 20 opcionais)      [src/utils/soulProfile/ritualAnswers.ts, personality/questions.ts]
  → leitura: traços Big Five/HEXACO + junguianos  [personality/scoring.ts]
           + mapa astral real (astronomy-engine)  [astrology/chart.ts, prominence.ts]
           + numerologia pitagórica                [numerology.ts]
  → soulProfile/profile.ts:buildSoulProfile        (SoulProfile serializável)
  → soulProfile/axes.ts:generateOracleAxes          → 4 eixos (elemento 8 / papel 5 / alinhamento 3 / reino 9)
      ⚠ importa NUMBER_ELEMENTS/ROLES/ALIGNMENT, REALM_WEIGHTS de oracle.ts (vocabulário do jogo)
  → soulProfile/pipeline.ts (async)
      → ficha/buildSheet.ts × 5 estágios            → Ficha (orçamento 30/60/120/300/500, class-system 17 elementos)
      → ficha/capture.ts                            → companheiro capturável
      → bestiary/select.ts + bestiary/pool.json      → linhagem de inspiração (1/estágio)
      → ficha/classTitle.ts (motor real, import dinâmico) → arquétipo/classe (nunca exibido ao jogador)
      → computeClassTitle(fichaByStage.ultra)        → OracleInput.promptClassFlavor
  → oracle.ts:generateOracle (síncrono)               → arquétipo visual, CREATURE_FAMILIES (72), paleta,
                                                          nome, bio, as 11 formas, imagePrompt/imagePromptFallback
  → ficha/skills.ts + ficha/realSkillPower.ts (motor real, import dinâmico) → skills por forma
  → evolução em 5 estágios (rookie/champion/ultimate/mega/ultra), manual (MANUAL_EVOLUTION)
```

Fontes de arquivo+símbolo:
- Entrada/ritual: `src/utils/soulProfile/ritualAnswers.ts`, `src/utils/soulProfile/personality/questions.ts` (`items`, `totalItems`)
- Leitura: `src/utils/soulProfile/personality/scoring.ts` (`scoreProfile`), `src/utils/soulProfile/astrology/chart.ts` (`computeNatalChart`), `src/utils/soulProfile/astrology/prominence.ts`, `src/utils/soulProfile/numerology.ts` (`computeNumerology`)
- Eixos: `src/utils/soulProfile/axes.ts` (`generateOracleAxes`, `JUNG_DAMPING`, `REALM_SPLIT_COMPENSATION`)
- Pipeline: `src/utils/soulProfile/pipeline.ts` (async desde a rodada 9, `fichaByStage`)
- Ficha: `src/utils/soulProfile/ficha/buildSheet.ts` (603 linhas, `ELEMENT_ORCAMENTO_BY_STAGE`, `FOCUS_EXPONENT`), `ficha/cascata.ts`, `ficha/classeOcorrencia.ts` (via testes)
- Bestiário: `src/utils/soulProfile/bestiary/select.ts` (336 linhas), `bestiary/pool.json` (80 KB, hoje só originais curados — `scripts/bestiario-originais.mjs`)
- Criação visual: `src/utils/oracle.ts` (3808 linhas) — `CREATURE_FAMILIES` (l.1284), `MOTIVO_ELEMENTO_CLASSE` (l.1875), `NUMBER_ELEMENTS` (l.735), `composeSpritePrompts`
- Skills/classe real: `src/utils/soulProfile/ficha/realEngine.ts` (extrai `calcularProgressao` do class-system, import dinâmico compartilhado), `ficha/realSkillPower.ts`, `ficha/classTitle.ts`
- Sync: `scripts/sync-oracle-data.mjs`, `scripts/bestiario-originais.mjs`, `scripts/bestiario-catalogo-curado.mjs`

## 2. Dois sistemas de elemento — 8 vs 17, e onde divergem

- **Motor de leitura (8 elementos do jogo)**: `ELEMENT_ORDER`/`ElementId` vive em `src/utils/oracle.ts`, consumido por `axes.ts` via import (`NUMBER_ELEMENTS`, l.735 de `oracle.ts`). É o vocabulário histórico do Soulmon (fogo/água/terra/ar/…), usado para escolher `CREATURE_FAMILIES` e a criatura visual.
- **Motor de ficha (17 elementos base do class-system + compostos 2º–4º nível)**: vive em `vendor/class-system` (vendorizado, snapshot) e é consumido só dentro de `ficha/buildSheet.ts` via `ELEMENT_ORCAMENTO_BY_STAGE`/orçamento próprio, e por `computeDominantClassElements` (`src/utils/soulProfile/derivedElements.ts`, exportado em `index.ts`) que faz a PONTE: lê os 4 eixos do motor de 8 + a proeminência planetária (`astrology/prominence.ts`) e projeta nos 17/88 combos do class-system.
- **Onde a divergência é estrutural, não um bug**: são dois vocabulários paralelos que nunca se fundem num tipo único — `ElementId` (8, jogo/visual) e o elemento do class-system (17 base) coexistem por design, ligados só por `derivedElements.ts`. Isso é deliberado (`ORACULO.md`: "as tabelas de afinidade... são vocabulário do jogo, não deste motor"), mas cria um acoplamento de leitura obrigatório: qualquer um que queira entender "qual elemento define a criatura" precisa saber que a resposta depende de QUAL metade do pipeline está perguntando — o jogador vê um elemento no visual (8) e a ficha calcula noutro (17), sem rótulo cruzado no `SoulProfile` salvo.
- Consequência prática já registrada: `CLAUDE.md` e `ORACULO.md` mostram que ambos foram calibrados/medidos separadamente (2000 perfis para os 4 eixos de 8; 800 perfis reais para cobertura 17/17) — duas simulações, dois pisos, nenhuma unificada.

## 3. Dados calculados e descartados

- `computeClassTitle` (`ficha/classTitle.ts`) é computado, persistido no save (`soulmonClassTitles`) mas **nunca renderizado** (`PetPage.tsx` não desenha o rótulo — decisão do dono, rodada 7 de `ORACULO.md`). Infra viva, output morto no momento — reversível a qualquer momento ("só falta o JSX").
- `personalitySummary`/eixos numéricos e pontuação de elemento/papel/alinhamento/reino: computados em `OracleAxes` mas **nunca exibidos ao jogador** — só aparecem na `OraclePage` interna (sem entrada na navegação). O jogador vê só nome + descrição breve.
- `ficha/classTitle.ts` (`arquetiposDiluidos`) é calculado dentro de `calcularProgressao` mas só o mais específico é usado — o resto do array é descartado a cada chamada.
- Nome da inspiração do bestiário é lido para escolher família (`CREATURE_FAMILIES`) mas historicamente era cortado do prompt final; hoje (27/09/2026, D-B1) entra só em `imagePrompt`, nunca em `imagePromptFallback`, bio, nome ou descrição — ainda um dado com vida parcial e descartado seletivamente por variante.

## 4. Duplicação e acoplamento frágil

- **Acoplamento síncrono/assíncrono.** `generateOracle` é síncrono e tem dezenas de call sites; o motor real do class-system só responde via `import()` dinâmico assíncrono. A costura (`pipeline.ts` virou `async`, rodada 9 de `ORACULO.md`) empurra a responsabilidade de `await` para ~20+ call sites de teste e os 2 reais (`SoulmonOnboarding.tsx`, `App.tsx`). Isso é dívida arquitetural aceita conscientemente ("reimplementar seria o footgun 9"), mas é um ponto de fragilidade: qualquer novo consumidor de `generateOracle` que precise da classe real herda a obrigação de já estar dentro de um contexto assíncrono, sem tipo que force isso — só convenção e comentário.
- **Duas contabilidades de geração convivendo** (nível efetivo antigo vs. cascata) em `ficha/buildSheet.ts`, com paridade garantida só por teste de fixture gerado a partir do motor real via `tsx` (`cascata.parity.test.ts`). Frágil por natureza: fixtures precisam ser regenerados a cada sync, e nada impede alguém de editar o fixture à mão (viola o próprio propósito do teste).
- **`ficha/realEngine.ts`** foi criado especificamente para eliminar uma duplicação anterior (construção de `Personagem` + chamada de `calcularProgressao` repetida em `realSkillPower.ts` e `classTitle.ts`) — bom exemplo de correção já feita, mas mostra que o padrão "import dinâmico do motor vendorizado" se replica a cada nova feature (skills, classe, e potencialmente o próximo pedido do dono) sem uma camada de fachada única (`ficha/realEngine.ts` é a fachada, mas ela cresce ad hoc conforme a necessidade aparece, não por design antecipado).
- **`oracle.ts` como monólito de 3808 linhas** concentra: tabelas de eixo (8 elementos, papéis, reinos), 72 `CREATURE_FAMILIES`, paletas, templates de nome/bio, composição de prompt de sprite E as tabelas que `axes.ts` importa. Um arquivo, muitas responsabilidades — mudar paleta e mudar tabela de afinidade de elemento moram no mesmo lugar; qualquer PR nesse arquivo é uma superfície de revisão grande demais.

## 5. Snapshot de repo irmão — como sincroniza

- Dois artefatos commitados: `src/utils/soulProfile/ficha/classSystem.data.json` (20 KB; talentos/profissões/criaturas/famílias do class-system) e `src/utils/soulProfile/bestiary/pool.json` (80 KB; hoje só criaturas originais curadas, via `scripts/bestiario-originais.mjs` — o corpus do Besti-rio- deixou de entrar em 28/09/2026, superando a referência antiga de "2.000 do corpus de 6.709" citada em `ORACULO.md`, que está desatualizada nesse ponto específico).
- Gerado por `npm run sync:oracle-data` → `scripts/sync-oracle-data.mjs`, que clona/lê o repo irmão localmente (`CLASS_SYSTEM_DIR`, default `../Class-System`) e roda TypeScript do clone via `tsx` (evita `npx.cmd` por causa do CVE-2024-27980 no Windows — comentário no próprio script).
- Procedência: cada JSON carrega `{repo, ref, SHA, data}` — não é cópia silenciosa, é rastreável.
- Risco explícito já registrado em `ORACULO.md`: o pool do bestiário aponta hoje para uma branch específica do Besti-rio- até a classificação canônica mergear na main de lá — dependência de branch, não de main, é uma janela de fragilidade temporária mas real.
- Paridade de comportamento (não só de dado) é garantida por teste que roda o MOTOR REAL do repo irmão via `tsx` no momento do sync (`cascata.parity.test.ts`) — bom padrão, mas caro: exige o clone irmão presente na máquina para regenerar; sem ele, o teste de paridade não pode ser refeito, só validado contra o snapshot antigo.

## 6. Peso no bundle

- `oracle.ts` **não tem chunk próprio** — `vite.config.ts` só declara `manualChunks: { vendor: ['react','react-dom'] }`; tudo mais (incluindo `oracle.ts`, 3808 linhas com 72 famílias + tabelas + templates) cai no chunk de entrada porque é importado direto (estático) por `App.tsx`/`SoulmonOnboarding.tsx`.
- `soulProfile/` fica FORA do bundle inicial só porque (a) é sempre alcançado por `await import('../utils/soulProfile')` nos call sites reais, e (b) `oracle.ts` importa dele **só tipos** (`import type { SoulProfile } from './soulProfile/profile'`, l.25), que somem na compilação — não há import de valor de `soulProfile` dentro de `oracle.ts`. Essa é a única coisa que impede a `astronomy-engine` (pesada) de entrar no chunk inicial.
- Esse equilíbrio é frágil por construção: um `import` de valor (não `import type`) acidental de `soulProfile` dentro de `oracle.ts`, ou um novo import estático de `oracle.ts` que force um símbolo de `soulProfile`, quebraria o code-splitting sem nenhum erro de tipo — só um bundle maior, silencioso, sem teste que meça isso hoje (não encontrei um `bundle`/`chunk`-size contract test para o oráculo, diferente do que existe para sprites: `sprites.dungeonRoster.test.ts` varre `dist/assets/*.js`, mas para arte de franquia, não para peso de chunk).
- `oracle.ts` em si (3808 linhas, JSON-like data — `CREATURE_FAMILIES`, `MOTIVO_ELEMENTO_CLASSE`) sempre paga custo de parse/download no chunk de entrada, independente da leitura ser usada ou não — está lá porque a criatura visual sempre é necessária, mas o volume de dados de tabela dentro do mesmo arquivo que a lógica de composição não tem separação.

## 7. Arquitetura-alvo proposta

Fronteiras de módulo (mantendo a separação leitura/criação já estabelecida em `ORACULO.md`, mas resolvendo os pontos de fricção acima):

```
soulProfile/leitura/        (hoje: personality/, astrology/, numerology.ts) — sem mudança de fronteira
soulProfile/axes.ts          eixos de 8 elementos do JOGO — continua importando vocabulário de:
oracle/vocabulario.ts        [NOVO] — extrai de oracle.ts: ELEMENT_ORDER, NUMBER_ELEMENTS/ROLES/ALIGNMENT,
                              REALM_WEIGHTS, ROLE_ALIGNMENT, ALIGNMENT_ORDER, REALM_ORDER, ROLE_ORDER.
                              Zero lógica, só tabela. axes.ts importa DAQUI, não de oracle.ts inteiro —
                              corta o acoplamento onde axes.ts hoje puxa (por import) um arquivo de 3808
                              linhas de composição visual só para pegar 5 constantes.
oracle/familias.ts           [NOVO] — CREATURE_FAMILIES (72), MOTIVO_ELEMENTO_CLASSE — dados puros,
                              hoje misturados com lógica de composição em oracle.ts.
oracle/compose.ts            [renomeado de oracle.ts] — só lógica: generateOracle, composeSpritePrompts,
                              nome/bio, importando vocabulario.ts + familias.ts.
soulProfile/ficha/           mantém fronteira atual — mas ganha um tipo explícito
                              `ElementBridge` em derivedElements.ts que documenta e testa a PONTE 8→17
                              (hoje implícita em computeDominantClassElements). Um teste de contrato novo
                              trava que todo ElementId (8) tem mapeamento determinístico para pelo menos
                              1 elemento base do class-system (17) — hoje a cobertura só é medida do lado
                              dos 17 (17/17 alcançáveis), nunca do lado "todo elemento de jogo produz ficha
                              plausível".
soulProfile/pipeline.ts      mantém — mas o contrato assíncrono vira TIPO: `OracleInput` ganha uma
                              distinção estática (dois tipos: OracleInputSync sem promptClassFlavor,
                              OracleInputWithClass com ele) para que esquecer o await no futuro vire erro
                              de compilação, não um prompt mais genérico silencioso.
```

Não propõe fundir os dois sistemas de elemento (8 vs 17) — são vocabulários de camadas diferentes por decisão deliberada e documentada (`ORACULO.md`), e fundir criaria acoplamento maior entre o app e o balanceamento do class-system (o mesmo risco que `realSkillPower.ts` já evitou de propósito, "custo é QUALITATIVO por desenho"). A correção proposta é tornar a PONTE explícita e testada, não eliminar a dualidade.

## 8. Sequência de migração (fases pequenas, cada uma verificável)

1. **Extrair `oracle/vocabulario.ts`** de `oracle.ts` (mover `ELEMENT_ORDER`, `NUMBER_ELEMENTS`, `NUMBER_ROLES`, `NUMBER_ALIGNMENT`, `REALM_WEIGHTS`, `ROLE_ALIGNMENT`, `ROLE_ORDER`, `ALIGNMENT_ORDER`, `REALM_ORDER`, tipos `ElementId`/`RoleId`/`AlignmentId`/`RealmId`), reexportar de `oracle.ts` para não quebrar call sites.
   - Verificação: `npx tsc --noEmit` limpo; `npx vitest run` (todos os testes de `axes.ts`, `pipeline.test.ts`) passam sem alteração de assinatura; `git diff --stat` mostra 0 mudança de comportamento (só movimentação).
2. **Trocar o import de `axes.ts`** para `oracle/vocabulario.ts` direto (em vez de `../oracle`).
   - Verificação: build local (`npm run build`) + medir `dist/assets/*.js` tamanho do chunk de entrada antes/depois (`ls -la dist/assets`) — deve reduzir, porque `axes.ts` deixa de arrastar (mesmo que só por tipo/parse) o arquivo de 3808 linhas.
3. **Extrair `oracle/familias.ts`** (`CREATURE_FAMILIES`, `MOTIVO_ELEMENTO_CLASSE`) de `oracle.ts`, mesma técnica de reexport.
   - Verificação: `pipeline.test.ts` e testes de família/fusão passam; `oracle.ts` cai de ~3800 para bem menos linhas (medir com `wc -l`).
4. **Adicionar teste de contrato de bundle**: um teste que varre `dist/assets/*.js` do chunk de entrada e falha se encontrar um símbolo exclusivo de `astronomy-engine` (ex. nome de função interna conhecido) fora do chunk dinâmico — fecha a lacuna apontada na seção 6 (hoje não há guard automático para a regressão "import de valor acidental").
   - Verificação: o teste passa hoje; rodar localmente introduzindo de propósito um `import { buildSoulProfile } from './soulProfile'` estático em `oracle.ts` e confirmar que o teste FALHA (prova de que o guard funciona antes de confiar nele).
5. **Documentar e testar a ponte 8→17** em `derivedElements.ts`: adicionar `ElementBridge` (tipo) e um teste que, para cada um dos 8 `ElementId`, confirma que `computeDominantClassElements` produz ao menos um elemento base do class-system plausível — fecha a lacuna da seção 2 sem mudar comportamento.
   - Verificação: teste novo passa; nenhum teste existente (`pipeline.test.ts`, `buildSheet.*.test.ts`) muda de resultado.
6. **(Opcional, mais arriscada) Separar `OracleInput` em dois tipos** (sync/with-class) só depois que as fases 1–5 estiverem estáveis em produção por pelo menos um ciclo — mudança de tipo público, exige atualizar os ~20 call sites de teste de uma vez; fazer por último e sozinha, para isolar o raio de erro.
   - Verificação: `npx tsc --noEmit` pega em compilação qualquer call site que não faça `await`; `npx vitest run` continua 100% verde.

Nenhuma fase exige tocar em `vendor/class-system` nem no repo irmão do bestiário — a migração é inteiramente interna ao Soulmon, reversível fase a fase (cada uma é um commit isolado, `git revert` único desfaz sem tocar nas seguintes), sem ponto de não-retorno: a extração de arquivos é só reorganização com reexport, e o teste de bundle/ponte são aditivos.
