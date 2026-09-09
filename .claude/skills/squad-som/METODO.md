# Método SQUAD-SOM — **só os deltas**

Este documento **não repete** o método da SQUAD-Alpha. Ele diz o que muda quando o artefato é
som. Tudo que não está aqui vale como está em
`C:\Users\spera\.claude\skills\squad-alpha\METODO.md` (as 6 fases, o ritmo
*abrir → despachar → coletar → loop adversarial → loop de verificação → CHECKPOINT*, os três
níveis de verificação L1/L2/L3, o modo divergente).

Ritmo, princípios e gate humano: **inalterados**. O que muda é o que conta como verificação.

> ⚠️ **Este método foi escrito antes de rodar. O run `som-01` rodou as 6 fases em 08–09/09/2026
> e corrigiu parte dele por medição.** Onde aparece a marca *corrigido por medição* com data, o
> texto novo manda. Três fatos que atravessam o documento inteiro:
> **(a)** a premissa da Fase 1 (A/B cego) segue **NÃO MEDIDA** — bloqueada por falta de crédito
> no gerador (`0.45 credits`, verificado), não medida **e não refutada**; a **S10 e sua emenda**
> (`docs/REGISTRO-DE-DECISOES.md` §6.1) tornaram o **procedural a solução vigente**, com os 12
> prompts prontos e engatilhados. **(b)** o **gate humano de escuta NUNCA foi exercido** — não
> houve um único asset, logo não há taxa de aprovação a citar. **(c)** `squad-alpha-runs/` está
> no `.gitignore`: o que precisa sobreviver vai para `docs/`, com ponteiro no `CLAUDE.md` — foi
> assim que nasceu `docs/SOM.md`, e o runbook completo ficou de fora de propósito.

---

## Delta 0 · A premissa fundadora do domínio

**Nenhum agente ouve.** "Soa bom" nunca é verificação, em nenhuma fase, por nenhum agente.
O que os agentes entregam é **medição e argumento**; o julgamento auditivo é humano, e há um
só ouvido no run (§9 do contexto: não existe dono de áudio).

Corolário permanente: **toda afirmação sobre o usuário vem marcada `[hipótese]`** — ninguém
nunca usou o app e não há telemetria (§1).

---

## Delta 1 · As 6 fases

### Fase 0 · Discovery — *"o que merece som, e o que merece silêncio?"*

Encurtada: sem pesquisa de campo e sem analytics (§1/§8). Vira:

- **Inventário sonoro** dos sons e dos chamadores, com uma coluna que a maioria dos runs
  esquece: **quais eventos passam a NÃO ter som**. *Fase 0 sem nenhum corte proposto é sinal
  de que a pergunta não foi feita.* Revisores obrigatórios do corte:
  `soulmon-behavioral-psychologist` + `alpha-requisitos` — nunca o autor.
  ✅ **Feito, e o resultado corrigiu o enunciado (09/09/2026):** os 11 sons viraram **8**;
  placar final **10 call-sites cortados e 3 símbolos apagados** (`playPoopAlert`,
  `playMenuOpen`, `playPoopClean` — este último provado **inalcançável** exceto pelo banho,
  `CareSystem.tsx:39`). ⚠️ **Nem a revisão dupla nem o primeiro passe adversarial pegaram o
  nono corte** — foi preciso um **segundo** passe. E a objeção **O-12** ficou de pé: a pergunta
  foi respondida **só para os eventos que já tinham som**; sete eventos do produto não foram
  avaliados nem recusados, apenas ausentes.
- **Baseline WAV dos 11 sons atuais, gravado ANTES de qualquer geração.** Sem esse arquivo
  não existe comparação na Fase 1, só memória.
- ~~Desempate do conflito de unidade e de alvo de loudness~~ — **RESOLVIDO em 08/09/2026
  (S3)**: ≤ **−16 LUFS integrado** (ITU-R BS.1770-4, K-weighting com gating) e **true peak
  ≤ −1 dBTP** com oversampling ≥4×, AES / EBU R 128, contra os −10/−12 dBFS de
  `references/audio.md`. O que sai da Fase 0 agora não é o alvo: é a **abertura** dele por
  categoria e por estado na `spec-de-loudness.md`.
- ~~Decisão do dono sobre trilha~~ — **RESOLVIDA em 08/09/2026 (S2)**: a trilha **existe**,
  **nasce desligada** e só toca **após gesto explícito**, nunca em `document.hidden`. O que
  a Fase 0 herda é a restrição operacional: o estado da trilha **persiste separado do `mute`
  global**, porque o som hoje nasce ligado (`readFlag` devolve `false` sem a chave).
- Parecer de PI (`soulmon-ip-brand-guardian`) · parecer curto de dados (`security-architect`) ·
  benchmark com fonte (`alpha-benchmark`) · proposta da métrica de som (`soulmon-guarda-medicao`).
- **Destino explícito de `playPoopAlert` e `playMenuOpen`** — exportados sem nenhum chamador
  (0 call-sites cada, por grep). Ou ganham dono e chamador que respeite D11, ou saem. Um
  "alerta" órfão é semente de violação futura.

**Bloqueio de abertura: FECHADO em 08/09/2026.** Os **28 testes falhando em 3 arquivos na
árvore intocada** (`TypeError: localStorage.clear is not a function`, causado pelo
`localStorage` global do **Node v25.2.1** sombreando o do jsdom) foram consertados em
`vitest.config.ts`, que acrescenta `--no-experimental-webstorage` ao `NODE_OPTIONS` do
processo principal antes de os workers nascerem. Saída real colada em
`squad-alpha-runs/som-01/sweeper/test-run.log`:

```
npx tsc --noEmit   → exit 0
npx vitest run     → Test Files 256 passed (256) | Tests 3666 passed | 1 skipped
```

Os portões estão **VERDES**; *"roda nos portões"* deixou de ser promessa. ⚠️ **O que NÃO é
regressão:** `src/assets/assets.contract.test.ts` **flaka por timeout sob contenção de CPU**
(6 CPUs na máquina; isolado passa em **2,40 s**; flakava igual **antes** do conserto). Esse
flake não pode ser confundido com falha de som.

### Fase 1 · Prototyper — *"a premissa sobrevive a um teste cego?"*

A premissa arriscada é **falseável**, e este é o delta que mais muda o run:

> Para pelo menos **3 dos 11 eventos existentes**, um asset gerado por IA reproduzido pelo
> grafo com mixer é preferido ao bipe procedural equivalente **em teste cego A/B** — mesmo
> evento, loudness percebido normalizado, ordem sorteada, o ouvinte não sabe qual é qual —,
> dentro do teto de bytes por evento e sem regressão de D11.
>
> **Refuta a premissa:** o procedural vencer **ou empatar** em ≥2 dos 3 pares. Nesse caso o
> run **muda de tese** na Fase 1 e ataca o sintetizador, **sem gerar o lote da Fase 2**.

⚠️ **O que aconteceu de fato (09/09/2026): a premissa segue NÃO MEDIDA.** O piloto A/B foi
bloqueado por **falta de crédito** no gerador (`pro plan, 0.45 credits`, verificado pelo
orquestrador): **zero candidatos gerados, nenhum par montado** — reusar o baseline dos dois
lados seria fraude de medição. Não medida **e não refutada**. A **S10 e sua emenda**
(`docs/REGISTRO-DE-DECISOES.md` §6.1) decidiram: o **procedural é a solução vigente**, calibrado
contra a escada, e os **12 prompts ficam prontos e engatilhados**. O gatilho de reabertura
permanece o A/B: se a IA vencer em ≥2 de 3 pares, o procedural volta a ser provisório de
verdade; se empatar ou perder, **S1 cai para SFX** e sobrevive só para trilha e ambiente.

**A infraestrutura da fase, porém, vale para os dois desfechos** — e é o que ela de fato
entregou: 47 renders no Chromium real, o ADR que decidiu **não** fazer o AudioWorklet limitador
(nenhum limitador de estoque cumpre −1 dBTP: `WaveShaper` 4× = **+0,50**, sem oversample =
**+1,51**, `DynamicsCompressor` = **+2,99**), o gate de loudness com prova de vermelho, e a
calibração procedural que levou a dispersão do lote de **41,63 dB → 8,02 dB** — e os 8,02 que
sobram **são a escada**, não resíduo.

Um só asset-piloto (**SFX** — a premissa acima é sobre os 11 eventos existentes, que são SFX)
e um só spike do grafo. A trilha existe desde S2, mas nasce desligada e por gesto: ela não é o
piloto desta fase.

Decisões que este gate também toma:
- **Escopo híbrido é explicitamente admissível** — SFX de UI procedurais (latência e peso) +
  IA para trilha, ambiente e stingers. Provavelmente é a resposta certa, e não nomeá-la é o
  defeito da proposta original.
- **Teste de escuta com 3–5 pessoas de fora**, cego, sobre os arquivos do lote-piloto. Custa
  uma pasta e um formulário; não exige telemetria, usuários nem app instalado. **Decisão do
  dono: fazer ou recusar, com o motivo escrito. Recusar é legítimo; não ter perguntado não é.**

### Fase 2 · Builder

Exit bar padrão **mais**: L2-som (as 4 camadas abaixo) **mais** o gate humano de escuta
**mais** `docs/Attributions.md` atualizado, com uma linha por asset.

### Fase 3 · Sweeper

Acresce: comportamento nas três superfícies (web/PWA · Capacitor · Electron), degradação sem
rede, e a medição de loudness como **regressão**. **Aprovação obrigatória do lote pelo
`som-diretor-sonoro`** — sem ela, a identidade da Fase 0 nunca é confrontada com o que foi
produzido. `alpha-benchmark` **volta aqui**, não na Fase 4.

### Fase 4 · Grower — condicional

Não é funil: é a **instrumentação da métrica de som** (§4), conduzida por
`soulmon-guarda-medicao`. **Pode não abrir** (lacuna 10 — métrica de áudio não instrumentada,
ainda aberta). Ela cria a medição a partir do zero e
**não pode alegar efeito**. Restrição herdada: a métrica de som **não é tempo de sessão nem
número de aberturas** — Princípio 7, *tempo de sessão é ANTI-indicador*.

### Fase 5 · Maintainer — **com líderes nomeados**

Era órfã na proposta v1, e é a fase que a própria proposta chama de condição de sobrevivência
da squad. Dois runbooks, dois donos:

- `som-engenheiro-audio` — runbook **técnico** da camada de áudio (barramento, categorias,
  formatos, o que fazer quando um som não toca numa das três superfícies).
- `som-produtor-assets` — runbook de **"como gerar, normalizar e registrar um som novo"**.

---

## Delta 2 · L2-som — a verificação executável, corrigida por execução

Obrigatória da Fase 2 em diante. **Quatro camadas**, todas com saída real colada.

> ✅ **A L2-som funcionou e EVOLUIU no run (corrigido por medição, 09/09/2026).** Ela não ficou
> no papel: a Camada 2 virou um gate executável (`prototyper/gate-loudness.mjs`, exige Chromium)
> com **seis assertivas — AC-0..AC-5**, cada uma nascida de um verde falso concreto:
>
> | | O que exige | Por que existe |
> |---|---|---|
> | **AC-0** | a amostra existe (renders contra `RENDERS_ESPERADOS`) | sem ele, **zero medições passavam como zero falhas**. A correção é achar por que o render sumiu — **nunca** ajustar o esperado ao observado |
> | **AC-1** | teto **−1 dBTP** | o teto do S3 |
> | **AC-2** | catraca **−3,29 dBTP** (pior caso medido **sobre a distribuição** + 1 dB) | **não é o teto**; é a catraca que impede regressão silenciosa |
> | **AC-3** | **o medidor se autovalida** com senoide em fs/4 a 45° e **aborta** se falhar | medidor cego aprova tudo; a primeira versão do script do run foi reprovada pela própria autovalidação por **3,017 dB** |
> | **AC-4** | cobertura — **lê o fonte de `sounds.ts`** e reprova **nomeando o som** sem categoria, alvo na spec ou linha na calibração | `playDegenerate` estava em `classe0`, e `classe0` **removia** o som da medição em vez de reprová-lo: o gate saiu verde sobre um som que nunca mediu |
> | **AC-5** | `\|offset\| ≤ 20 dB`, nomeando o asset | desvio 0,00 LU podia ser **identidade algébrica**; um asset 20 dB baixo demais sairia com desvio 0,00 do mesmo jeito |
>
> **Toda assertiva nova exige prova de vermelho gravada em disco** — no `som-01` são três
> arquivos (`saida-gate-vermelho.txt`, `prova-vermelho-C-amostra-vazia.txt`,
> `provas-vermelho-pos-ataque.txt`). Assertiva sem prova de vermelho não conta como verificação.
> E `--calibrar` passou a **gravar e sair**, exigindo segunda execução em modo gate: calibrar e
> aferir na mesma passada é a forma canônica de medir a própria resposta.
>
> **A regra geral que sai daí:** *alguma assertiva tem de olhar para **quem define a amostra***.
> Os dois verdes vazios do run foram exatamente isso — um dentro do próprio gate, outro na
> calibração. E a regra de ouro está escrita na saída do gate: ***"conserte a ESCADA, não a
> catraca"***. A catraca do AC-2 passou por **0,13 dB** e foi **registrada, não afrouxada**.

**Restrição de localização, medida:** **todo teste de som mora em `src/`.** O `include` do
`vitest.config.ts` só enxerga `src/` · `functions/` · `workers/` · `desktop/renderer/` ·
`tests/`, e o Vitest 4 **rejeita `--include` na CLI** (`CACError: Unknown option --include`).
Teste de som fora dali existe e **nunca roda** — a forma mais barata de uma verificação virar
promessa.

### Camada 1 · Comportamento (`vitest`, nos portões do §5)

A técnica já existe no repositório (`src/utils/sounds.visorTune.test.ts`): `AudioContext` de
mentira que grava chamadas + `localStorage` em memória. Nem node nem jsdom têm `AudioContext`
— **não há mock a instalar; o duplo é a técnica.**

- ✅ **Com `SOUND_MUTED` ligado, nenhum `play*` constrói contexto ou cria nó** — os caminhos
  descobertos por **reflexão do módulo**, nunca por lista digitada. Provado: 3/3 verdes no
  protótipo do run.
- ✅ **Contraprova obrigatória, no mesmo arquivo:** com som ligado, todo `play*` cria nó. Sem
  ela, o guard do mudo passa por inércia se o duplo quebrar. **Os dois juntos é que valem.**
- ⚠️ **A asserção de D11 pertence aos CHAMADORES, não ao módulo.** `sounds.ts` **não tem uma
  única ocorrência de `document.hidden`** — a fronteira mora em `CompanionHUD.tsx` e nos
  demais chamadores. Teste escrito sobre o módulo seria **verde vazio**. Precedente correto a
  copiar: `CompanionHUD.voz.render.test.tsx`, que **lê o fonte** e exige a ocorrência do guard.
- ⚠️ **"Trilha respeita volume e para ao perder foco" sai da lista de verificação** e vira
  **critério de aceite da Fase 2**: não existe trilha, volume nem barramento hoje. Misturar o
  que se verifica com o que se promete é como uma camada de verificação vira decoração.
- ✅ **Todo `play*` exportado tem chamador** — varredura de `src/` com `src/test/tsAst.ts`, no
  padrão de `assets.contract.test.ts`.

### Camada 2 · Medição de loudness

**`ffmpeg` NÃO existe neste ambiente** (nem PATH, nem chocolatey, nem WinGet — provado por
execução), e o projeto tem **zero dependência npm de áudio**. O medidor é **Node puro**, e o
protótipo do run (`squad-alpha-runs/som-01/prototipo/medir-loudness.mjs`) já funciona e foi
validado contra âncora da norma. Saída em `sweeper/audio-loudness.log`.

- **LUFS, não dBFS.** ITU-R BS.1770-4 de verdade: K-weighting (shelf + RLB), blocos de 400 ms
  com 75% de sobreposição, gates absoluto e relativo. RMS cru **mede a coisa errada** e está
  proibido. A diferença entre as duas réguas foi medida: **3,017 dB**.
- **True peak em dBTP com oversampling ≥4×.** Medido no run: um arquivo com **−0,27 dBFS** de
  pico de amostra tinha **+0,32 dBTP** real — passaria num teto ingênuo e estoura no aparelho.
  **É o verde falso, e ele é real.**
- **Duas passagens, e a segunda é a que vale:** por **arquivo** (o produtor afere) e por
  **barramento** — render offline do grafo em cada estado declarado, medido contra a
  `spec-de-loudness.md`. Sem a segunda, arquivo conforme × ganho de categoria arbitrário = gate
  verde com o app fora do alvo.
- **O medidor se autovalida antes de medir e aborta se falhar.** Não é cerimônia: a primeira
  versão do script do run foi **reprovada pela própria autovalidação** por 3,017 dB. Medidor
  sem autovalidação é guard vazio.
- **Medir sempre no WAV mestre PCM 16-bit, antes de codificar** — medir depois do codec exigiria
  o `ffmpeg` que não existe.
- **Costura de loop é TRIAGEM, não veredito.** O número acusa; quem absolve é o gate humano.
- ⚠️ **Fonte estocástica mede-se por DISTRIBUIÇÃO, nunca por uma realização** (corrigido por
  medição, 09/09/2026). `playVisorTune` usa `Math.random()`: a catraca foi ancorada numa
  **captura** e anunciou **3,24 dB** de folga ao teto; sobre **12 realizações**, o pior caso era
  **−1,08 dBTP** e a folga real **0,08 dB**. **N ≥ 12, e o número reportado é o pior caso.**
- ⚠️ **"O grafo não introduz desvio" ≠ "o lote está calibrado"** (corrigido por medição,
  09/09/2026). Desvio **0,00 LU** pode ser **identidade algébrica**: com `offset = alvo −
  medido_em_P-A`, ganhos de categoria em 0 dB e offset aplicado por multiplicação escalar, o
  caminho P-A→P-B é ganho puro, e LUFS é invariante a ganho por soma em dB. Um asset entregue
  **20 dB baixo demais** sairia com desvio 0,00.
- ⚠️ **Categoria não vem do nível medido do arquivo** (**R-CAT**). Foi assim que o
  `playVisorTune` acabou em `arcade`, **dois degraus errado**, sem nada ficar vermelho — e a
  categoria certa (`sintonia`, −19,0) saiu do **perfil de repetição do evento**. O conserto
  também não foi de ganho: duas hipóteses de ganho do próprio autor caíram por medição (**0/12**
  cada); o que funcionou foi **envelope + duração** (180 → 400 ms com platô): **12/12**,
  dispersão 2,68 → **0,18 LU**, **+23,3 dB sem tocar no ganho**.
- ⚠️ **Nunca ancore medição em renderização própria sem validar contra o motor real.** O
  baseline reimplementado em Node divergiu do Chromium em **7 de 10 sons, 1,44–1,76 dB**, e foi
  reprovado e substituído pela captura do motor real.
- ⚠️ **Nunca afirme ausência no código a partir de um `grep` por string literal.** Caso real do
  run: a busca por `storage-not-bound` concluiu que só 3 arquivos guardavam, e um achado
  **grave foi escalado com base nisso** — a guarda existia em **três formas** (`'Storage not
  bound'`, a literal, e a indireta via `requirePaidTier`), e **o achado estava errado**. Procure
  **variantes** e **confira o caminho de execução** antes de afirmar que algo não existe.
- ✅ **O alvo está decidido (S3, 08/09/2026): ≤ −16 LUFS integrado** (ITU-R BS.1770-4,
  K-weighting com gating) **e true peak ≤ −1 dBTP** com oversampling ≥4× — AES / EBU R 128,
  desempatando contra os −10/−12 dBFS de `references/audio.md`. Vale **por categoria e por
  estado**, nunca pela sessão inteira, e quem abre esses valores na `spec-de-loudness.md` é
  `som-engenheiro-audio`, **dono único**. Fora da faixa = **FAIL**, não ressalva.

### Camada 3 · Orçamento de bytes

⚠️ **Não é `vitest.budget.mjs`** — esse arquivo é o orçamento de **TEMPO** da suíte
(`TEST_TIMEOUT_MS`, `LIMIARES`), com dono único declarado por escrito e dois leitores.
Estendê-lo para bytes juntaria dois orçamentos sem relação no arquivo que declara ser dono de
um número só.

Ponto de extensão correto: um arquivo **novo** em `src/`, modelado em
`src/utils/sprites.dungeonRoster.test.ts` — o único guard do repositório que abre
`dist/assets/` (commitado, portanto sempre o do commit atual). Três casos:

1. **Existe bundle para conferir** — senão o guard diz "limpo" sobre nada.
2. **Bundle inicial sem áudio** — nenhum `.mp3/.ogg/.m4a/.webm/.wav` em `dist/index.html` nem
   no chunk de entrada, **e nenhum áudio em `PRECACHE_URLS` de `public/sw.js`**. Esta segunda
   metade é a que a v1 esquecia: o service worker pré-cacheia por lista própria, e asset "sob
   demanda" listado ali é baixado no primeiro load do mesmo jeito.
3. **Teto por categoria** — nasce `it.todo` até o dono dar o número (lacuna 7). **Não nasce
   com valor inventado.**

Dono único do número: `alpha-perf-a11y`.

### Camada 4 · Variação contável (proxy de fadiga) — **NOVA**

Fadiga por repetição é o modo de falha mais citado pela pesquisa e, por definição,
**indetectável numa escuta única**. Ela não vira opinião; vira contagem:

1. Para todo SFX, o pool de variações tem **≥3 entradas** e o seletor **nunca repete a
   última** (round-robin).
2. Render de **30 disparos consecutivos** e checagem de que não são amostra-a-amostra
   idênticos.
3. Para música, o loop tem **≥2 camadas ou ≥2 segmentos**. Faixa fechada única **falha o gate**.

Isto é **proxy**, e é declarado como tal. ⚠️ *"Irrita na 20ª repetição?"* nenhum gate responde
enquanto não houver uso real: continua `[hipótese]` mesmo depois de um APROVADO. O mitigador é
de **design** (variação e teto de frequência por evento, declarados no DS sonoro), não de gate.

---

## Delta 3 · O gate humano de escuta, com registro

Não delegável. O agente entrega medição; o julgamento auditivo é do humano.

> ⚠️ **NUNCA EXERCIDO (09/09/2026).** No `som-01` **não houve um único asset** para escutar — a
> geração por IA ficou bloqueada por crédito, e o procedural vigente por **S10** não passa por
> este gate como arquivo. Logo: **não existe `escuta/<fase>.md` preenchido, não existe taxa de
> aprovação, e a squad não pode alegar que exercitou o gate.** Todo o procedimento abaixo
> continua válido e **não testado** — a primeira vez que ele rodar de verdade será a primeira
> vez. Consequência já registrada em **S7/S8**: o design system sonoro será aprovado por
> **N=1**, e esse N=1 aprovou o conceito **antes** de ouvir.

- **Registro por asset** em `escuta/<fase>.md` — as três perguntas fechadas (*companheiro ou
  chefe? · irrita na 20ª repetição? · dá para usar no transporte público sem constrangimento?*)
  mais o par A/B contra o procedural, quando existir. **Asset sem linha de escuta não entra no
  app.**
- **Lote ≤ 8 assets por sessão.** Acima disso a resposta é fadiga, não julgamento.
- **Duas sessões separadas por ≥24 h**, e a pergunta da segunda é *"algum destes você já não
  quer ouvir de novo?"*. Uma escuta não mede repetição; duas medem a derivada, que é o sinal
  que interessa. Custo aceito: um dia de calendário a mais no gate da Fase 2.
- **Fone e alto-falante de celular**, alternados.
- **Se o dono não escutar no prazo combinado, a fase NÃO trava** — fecha com escopo reduzido, e
  os pendentes ficam registrados como **não aprovados**.
- **Taxa de aprovação de 100% é sinal de gate não exercido**, não prova de lote bom. Vigiado
  por `alpha-governanca`.

---

## Delta 4 · Eixos transversais

| Eixo | Status neste run |
|---|---|
| 🔍 **Benchmarking** | **fica** — Fase 0 e **retorno na Fase 3** (contra o lote pronto). O retorno na 4 é **condicional**: sem métrica instrumentada, não há o que comparar. |
| 🛡️ **Security & Privacy** | **reduzido a parecer pontual** — §10 tira microfone; áudio é asset estático sem coleta. `security-architect` na Fase 0, e só volta se o escopo mudar. |
| ⚖️ **Conformidade** | **fica, com dono trocado** → `soulmon-ip-brand-guardian`. §6 é a linha vermelha mais concreta do run. |
| 🎼 **PI / atribuição** (**novo**) | **entra.** Todo asset é gerado por IA e `docs/Attributions.md` é obrigatório. Nenhum asset atravessa fase sem linha de atribuição (origem, modelo, prompt, data). Verificado por execução, no mesmo teste que checa que **nenhum prompt contém texto do usuário** (D8/#18). |
| 📋 **Delivery-ops** | **sai.** §8: não há rastreador; o trabalho vive em markdown + PR. |
| 🎨 **Lane de marca** | **não abre** (§7: DS visual canônico). |

---

## Delta 5 · Fronteiras que não se movem

- **Loudness tem UM dono:** `som-engenheiro-audio`. O produtor **mede e reprova; não define
  alvo**. Duas fontes da verdade sobre loudness é o footgun 9 aplicado ao som.
- **A regra de disparo adaptativa é do `som-diretor-sonoro`**, entregue como contrato escrito.
  O engenheiro implementa; não inventa.
- **D11 é do `soulmon-guarda-vinculo`**, com **veto bloqueante nas Fases 0 e 2 — não
  liderança**. Em dúvida sobre se um som é presença ou sistema, prevalece ele.
- **Orçamento de bytes é do `alpha-perf-a11y`**, dono único.
- **O parecer de PI e de termos comerciais é do `soulmon-ip-brand-guardian`**, e o risco
  residual escala ao dono — não há jurídico (§9). ⚠️ **Não existe `grep` por melodia:** o guard
  executável prova **procedência**, nunca **originalidade** (S9). O único controle de
  originalidade que existe é a escuta humana do dono (S8).
- **A regra de exclusão de fonte (R-EX) é do `som-diretor-sonoro`**, não do grafo — medido: o
  limitador fez **0,00 dB** sobre uma soma de **+4,58 dB**. O engenheiro implementa.
- **A categoria de um som é do EVENTO (R-CAT)**, e superfície nova nasce muda (**R-NOVA**).

---

## Delta 6 · Lições de orquestração — pagas em erro no `som-01`

1. **Todo achado veio de execução contra o código; nenhum de leitura de documento ao lado.**
   7 erros de fato caíram assim, e a própria Fase 0 corrigiu 4 achados do seu inventário. O
   maior risco registrado no gate da Fase 0 é o espelho disso: o pedaço do lote que descrevia um
   sistema **que ainda não existia** era estruturalmente imune ao que pegou todo o resto.
2. **Não despache dois consertos em paralelo quando um consome número do outro.** A
   `spec-de-loudness.md` foi calculada sobre um **baseline reprovado no mesmo dia** pela objeção
   O-8. Erro de orquestração, não de agente: o conserto de baixo não soube que o chão tinha
   mudado. Sequencie, ou declare a dependência de número no briefing.
3. **O loop adversarial não é opcional — a Fase 1 provou por falta.** Na Fase 0 o passe
   adversarial achou, **duas vezes**, o que duas revisões obrigatórias não tinham achado. Na
   Fase 1 o loop formal não rodou de primeira, e o próprio gate registrou estar *"uma camada
   abaixo do da Fase 0"*; o passe posterior **derrubou uma conclusão da fase**.
4. **Verifique contra qual commit você está auditando.** A Fase 3 começou contra `cfd74884`,
   onde `audioBus.ts` não existia, e a `main` mudou no meio da auditoria (PR #36). Tudo teve de
   ser reauditado contra `0d84cdcc`. Fixe e declare o alvo no artefato.
5. **Planeje o destino do artefato antes de escrevê-lo.** `squad-alpha-runs/` está no
   `.gitignore`: o que precisa sobreviver vai para `docs/`, com ponteiro no `CLAUDE.md`.
