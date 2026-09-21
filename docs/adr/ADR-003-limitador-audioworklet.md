<!-- doc-historico -->
# ADR-003 — Teto de −1 dBTP por construção; `AudioWorklet` adiado

**Dono:** `alpha-architect` (autor original); custódia em `docs/adr/`: `doc-mantenedor`
**Data:** copiado para o repo em 21/09/2026 (QA GERAL #35); a data da decisão está no corpo
**Estado:** `registro` — cópia FIEL de `squad-alpha-runs/som-01/prototyper/adr-limitador-audioworklet.md` (pasta fora do git, `.gitignore`); o corpo abaixo NÃO foi reescrito, e cita código por `arquivo:linha` como estava na época — linhas escorregaram, procure pelo SÍMBOLO
**Verificação:** `git ls-files docs/adr` (existe no git) · `diff <(tail -n +14 docs/adr/ADR-003-limitador-audioworklet.md) squad-alpha-runs/som-01/prototyper/adr-limitador-audioworklet.md` (corpo idêntico ao original, enquanto a pasta local existir)
**Não cobre:** o estado atual do código — para isso leia a linha "Vale em" abaixo e o `docs/manual/05-ARQUITETURA.md`
**Precedência:** código > teste > `CLAUDE.md` > manual > esta ADR

**Vale em 21/09/2026?** Sim: `src/utils/audioBus.ts` não tem `AudioWorklet` nem `DynamicsCompressor` (`grep -nE "AudioWorklet|DynamicsCompressor" src/utils/audioBus.ts` → 0); o "limitador" é política em `src/utils/loudness.ts`. A numeração provisória do original vira definitiva aqui. O gatilho de revisão (§6) nunca foi medido. Fonte: `docs/reviews/2026-09-21-qa-geral/05-arquitetura.md` §8.

---
# ADR-003: O teto de −1 dBTP é cumprido por construção, não por limitador em runtime — o `AudioWorklet` fica adiado

> Owner: `principal-architect`. Uma decisão, suas forças e suas consequências.
> **Status:** proposed (vive em `squad-alpha-runs/som-01/prototyper/` até aprovação do dono)
> **Data:** 08/09/2026 · **Run:** `som-01`, gate da Fase 1
> **Numeração:** o repositório **não tem arquivo de ADR** (`find` por `*adr*` fora de
> `node_modules`/worktrees devolve só `.claude/skills/prod-squad/templates/adr.md`). A única ADR
> citada é a **ADR-002** (`docs/STATUS.md:740` e `docs/PLANO-DESKTOP-STEAM.md`), e ela existe como
> referência, não como arquivo. **`ADR-003` é provisório** — quem aprovar renumera ao promover.

---

## 0. A resposta, antes do contexto

**Não vamos implementar o `AudioWorklet` agora.** O teto de **−1,00 dBTP** (decisão **S3**,
`docs/REGISTRO-DE-DECISOES.md` §6.1) passa a ser cumprido **por construção** — pela escada de
ganhos e pelas regras de exclusão de fonte —, e **verificado por um gate offline executável em
P-B**, que é o ponto de medição que a `spec-de-loudness.md` §2.1 já declara como o gate.

O que fica no caminho quente do runtime é **uma guarda de clipe declarada**, que **não cumpre o
S3 e não pode ser chamada de limitador**.

A justificativa em uma linha: **o limitador nunca trabalhou.** No pior caso declarado da spec
(§7.2) o master mede **−4,29 dBTP** — **3,29 dB abaixo do teto** — e a redução de ganho do
limitador foi de **0,00 dB** (spike, G-7). Na colisão do banho, **−7,91 dBTP**, com
`g4-sem-limitador` e `g4-waveshaper` medindo **exatamente o mesmo número**. Os três nós de
estoque só reprovam num cenário **artificial de +20 dB** que nenhuma combinação real de fontes
produziu. Trocar isso por uma dependência nova de plataforma em três superfícies, um arquivo no
`PRECACHE_URLS`, um caminho de boot assíncrono e latência não medida no único caminho que o
usuário percebe é **complexidade especulativa paga para consertar um caso que não aconteceu**.

---

## 1. Contexto — as forças que obrigam a decidir agora

### 1.1 O achado que abriu a decisão (medido, não argumentado)

Spike da Fase 1 (`prototyper/spike-grafo.md`, achado **A-1**), Chrome 152.0.7977.76 via CDP,
`OfflineAudioContext` mono 48 kHz, medidores autovalidados do run (`prototipo/medir-loudness.mjs`,
BS.1770-4 anexo 2, oversampling 4×; autovalidação colada na saída: **−3,004 LUFS** contra −3,01
esperado). Com as fontes empurradas **+20 dB**:

| Candidato | dBTP | pico de amostra | cumpre −1,00 dBTP? |
|---|---|---|---|
| nenhum (controle) | **+18,34** | +18,34 dBFS | — |
| `WaveShaper`, `oversample:'4x'` | **+0,50** | +0,50 dBFS | **não** (excede por 1,50 dB) |
| `WaveShaper`, `oversample:'none'` | **+1,51** | **−1,00 dBFS** | **não** (excede por 2,51 dB) |
| `DynamicsCompressorNode` (ratio 20, knee 0, atk 1 ms) | **+2,99** | +2,61 dBFS | **não** (excede por 3,99 dB) |

**Os três de estoque reprovam.** E a linha do meio é o motivo pelo qual esta ADR existe com
número: `ws-sem-os` clipa a **amostra** em **−1,00 dBFS exato** e mesmo assim entrega
**+1,51 dBTP**. Ela **passaria em qualquer gate que medisse pico de amostra** e estouraria no
conversor do aparelho. Qualquer critério de aceite desta decisão que não meça dBTP é um gate
que já sabemos que mente.

### 1.2 O achado que ninguém tinha examinado, e que muda a conta

O mesmo spike mediu, no mesmo motor e com o mesmo medidor, **o que realmente chega ao master**:

| Cenário | dBTP em P-B | folga até o teto S3 | trabalho do limitador |
|---|---|---|---|
| pior caso declarado da spec §7.2 (`g7-sem-limitador`) | **−4,29** | **3,29 dB** | — |
| o mesmo com `WaveShaper` (`g7-waveshaper`) | **−4,29** | 3,29 dB | **−0,00 dB** |
| o mesmo com `DynamicsCompressor` (`g7-compressor`) | −3,72 | 2,72 dB | −0,57 dB |
| colisão do banho, como hoje (`g4-sem-regra`) | **−7,91** | 6,91 dB | — |
| colisão do banho com a regra 3 (`g4-com-regra`) | **−12,49** | 11,49 dB | — |
| categoria mais alta sozinha (`playVisorTune`, G-1) | −4,63 | 3,63 dB | — |
| trilha sozinha, todos os estados (G-3) | −22,11 … −19,46 | ≥ 18,46 dB | — |

**Nenhum cenário real chegou perto do teto.** O `g4-sem-limitador` e o `g4-waveshaper` deram o
**mesmo −7,91 dBTP**: o limitador não moveu uma amostra. O próprio spike escreve isso como
*"o G-7, como escrito, não testa o limitador; testa a escada de ganhos"* — e essa frase é a
descoberta arquitetural, não o defeito. **A escada de ganhos é que cumpre o teto.** O limitador
é redundância.

> **Escopo desta medição (correção do passe adversarial, O-8, 09/09/2026).** O *"limitador mediu
> 0,00 dB de trabalho"* foi medido **exclusivamente no conjunto de fontes cujo nível é conhecido
> em build** — tautologicamente onde a garantia por construção funciona. Fora dele, **não foi
> medido**. E o O-1 mostrou que esse conjunto não é o escopo inteiro: `playVisorTune` sintetiza
> ruído em runtime. A decisão de §5 **continua de pé pelos outros cinco argumentos**, que são
> independentes desta linha; o que cai é usar este 0,00 como se fosse universal.

### 1.3 O que ATRAVESSA a decisão (NFRs que ligam)

- **Teto (S3, `docs/REGISTRO-DE-DECISOES.md` §6.1):** true peak ≤ **−1,00 dBTP**, oversampling
  ≥4×. **Esta ADR não reabre o S3** — o teto continua idêntico, palavra por palavra. Muda o
  **mecanismo** que o cumpre, não o número.
- **Ponto de medição (`spec-de-loudness.md` §2.1):** **P-B, a saída do master, depois do
  limitador, é o gate**; em desacordo entre P-A e P-B, **P-B vence**. E P-B é **medido por render
  offline determinístico**, escrito na própria spec. Isto é o eixo da decisão: **o gate já é
  offline e determinístico** — se ele é a régua, o teto é verificável **antes** do runtime.
- **Três superfícies (contexto §5):** web/PWA, Capacitor 8.4 (WebView Android) e Electron
  (`desktop/`). O spike mediu **um** motor (autocrítica 3: *"nada aqui roda em Capacitor nem em
  Electron … a disponibilidade de `AudioWorkletNode` não foi medida"*).
- **Latência percebida:** o caminho atual agenda SFX pré-decodificado com erro de **1 amostra
  (0,0208 ms)**. A **D11** (contexto §7) exige que o som de presença saia **em resposta a gesto** —
  então a latência do SFX é a latência do feedback ao toque, o único número de áudio que o
  usuário sente. A **latência de saída real das três superfícies continua sem medição** (L-1;
  a sonda em `AudioContext` real devolveu `outputLatency: 0` e relógio parado no ambiente
  headless).
- **Peso e cache (contexto §5, decisão S6):** `dist/` é **commitado**, então todo byte é
  permanente no histórico do git. S6 declara **300 KB de áudio no total, ZERO no bundle inicial**.
  **Não existe orçamento de BYTES no repositório** (correção medida do §5 do contexto: o
  `vitest.budget.mjs` é orçamento de TEMPO). Um worklet é **arquivo próprio servido pela origem**
  e toca `public/sw.js`.
- **Regra copiada diverge em silêncio (`CLAUDE.md`, footgun 9):** quatro casos custaram
  comportamento — o `saveId` com salt errado, as tabelas de HP rebaixando um mega a rookie, seis
  consertos de cuidado atrasados no desktop, a energia da comida recalculada por cima. Qualquer
  constante de teto de áudio nasce com **um dono único** ou nasce com este bug latente.
- **Custo de complexidade:** produto pessoal, dono único, **ninguém nunca usou o app em
  produção** (`CLAUDE.md`). Não há operação de áudio para pagar dívida de plataforma.

### 1.4 Por que decidir AGORA, e não depois do lote

Porque o `som-engenheiro-audio` está parado nisto: o A-1 apontou o worklet como saída e escreveu
que a escolha é ADR do `principal-architect` (contexto §10 — *"trocar a stack de áudio … sem ADR
aprovado"* está fora de escopo). E porque a decisão é **de que lado o teto é garantido** — disso
dependem o formato do gate da Fase 2 e o manifesto do lote de assets. Decidir depois do lote é
decidir com o lote já errado.

---

## 2. Decisão

**O teto de −1,00 dBTP do S3 passa a ser cumprido por CONSTRUÇÃO e verificado por GATE OFFLINE.**
Concretamente, quatro coisas, e nenhuma delas é um `AudioWorklet`:

1. **Quem cumpre o teto é a escada de ganhos** (`spec-de-loudness.md` §6.4: ganho de bus de
   categoria como constante) **somada às regras de exclusão de fonte** (§4.3 do inventário,
   regra 3: duas fontes da mesma classe nunca somam; Marco silencia tudo; Presença exclui
   Cuidado). Foi isso que produziu os −4,29 dBTP do pior caso e os −12,49 dBTP do banho com
   regra, e é isso que fica responsável pelo número.
2. **O gate é o render offline em P-B**, com os medidores já autovalidados do run
   (`prototipo/medir-loudness.mjs`, `prototipo/medir-lufs-m.mjs`). Ele é **executável, roda em
   `npx vitest run` e reprova o merge** (§5 abaixo). O teto deixa de ser promessa de runtime e
   vira **assertiva de build**.
3. **No runtime fica uma `guarda-de-clipe` declarada, e ela NÃO é o limitador do S3.** Um
   `WaveShaper` com curva de clipe rígido em **−1,00 dBFS** e `oversample:'none'`, no fim do
   master. O que ela garante é **exatamente o que foi medido**: pico de amostra ≤ −1,00 dBFS
   (medido ao milésimo) e a conversão de um acidente de +18,34 dBTP em +1,51 dBTP — **16,83 dB
   de contenção de dano**. O que ela **não** garante, e tem de estar escrito no código e no nome
   da variável, é o teto de true peak: **ela reprova o S3 por 2,51 dB sob pressão**.
   Escolhi `oversample:'none'` sobre `'4x'` **apesar** de o 4× medir dBTP melhor (+0,50 contra
   +1,51): o 4× deixa o **pico de amostra em +0,50 dBFS**, ou seja, entrega ao sink um sinal
   acima de 0 dBFS, que clipa **deterministicamente em todo conversor**; o `'none'` limita o
   domínio de amostra ao teto e deixa escapar só o *intersample over* — que é precisamente o
   defeito que o worklet consertaria e que estamos adiando de propósito. Trade-off explícito:
   **prefiro um modo de falha que só um medidor de true peak enxerga a um que todo aparelho
   reproduz.**
4. **O `AudioWorklet` com look-ahead fica registrado como caminho conhecido e ADIADO**, com
   gatilhos de revisão escritos (§6). Ele **não é proibido**; ele é **não pago agora**.

**O que esta ADR NÃO faz:** não reabre S3 (o teto é o mesmo), não reabre D11, não introduz
dependência de terceiros (o `package.json` continua sem nenhuma dependência de áudio), não toca
`src/`, `public/` nem `docs/`.

### 2.1 O argumento que fecha a alternativa — o fallback do worklet É esta decisão

Este é o ponto que torna a decisão de baixo risco, e ele vale mesmo para quem discordar do resto.

`AudioWorklet` exige **contexto seguro** e **`addModule()` assíncrono**. Logo, todo desenho com
worklet precisa responder: *o que roda quando ele não existe ou falha ao carregar?* As opções
reais são três — e as três já foram **medidas neste run**:

- degradar para `WaveShaper` 4× → **+0,50 dBTP**, reprova;
- degradar para `WaveShaper` sem OS → **+1,51 dBTP**, reprova;
- degradar para `DynamicsCompressor` → **+2,99 dBTP**, reprova.

**Não existe fallback que cumpra o teto.** Portanto, num desenho com worklet, a superfície que
não carregar o módulo **só está protegida se o teto já for cumprido por construção**. Ou seja:
**a garantia por construção é obrigatória de qualquer jeito**, e o worklet só poderia ser
**aditivo**, nunca substitutivo. Esta ADR entrega a parte obrigatória e não compra a aditiva.

Corolário de governança: quem propuser o worklet depois **não precisa desfazer nada** — ele entra
como um nó a mais no fim do master, atrás da mesma medição em P-B. É por isso que esta é uma
**porta de duas mãos** (§4.3).

---

## 3. Alternativas consideradas

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **A · Teto por construção + gate offline em P-B + guarda-de-clipe declarada** (escolhida) | Cumpre o número medido no pior caso real (−4,29 dBTP, 3,29 dB de folga) · zero dependência de plataforma · zero arquivo novo servido pela origem · zero mudança em `public/sw.js` · zero latência acrescentada (SFX segue com erro de agendamento de 1 amostra) · verificável **antes** do deploy, em `vitest` · idêntica nas três superfícies porque não usa API que varie entre elas | O teto passa a depender da **disciplina do lote de assets** — e o A-3 mediu **5,20 LU** de dispersão intra-categoria e ganhos de bus de **+36,18 dB** (`arcade`) e **+18,05 dB** (`presenca`), ou seja, a escada **ainda não está calibrada** · não protege contra fonte cujo nível não seja conhecido em build · a guarda-de-clipe **não cumpre o S3**, e isso tem de ficar escrito | ✅ |
| **B · `AudioWorklet` com look-ahead e detecção em true peak** | É o único caminho conhecido que cumpre −1,00 dBTP **sob qualquer nível de entrada** · resolve o intersample over de verdade, não por contenção | **Corrige um caso que nenhum cenário real produziu** — o limitador mediu **0,00 dB** de trabalho em G-7 e em G-4 · **dependência nova de plataforma nas três superfícies**, e o spike mediu **uma** (autocrítica 3: Capacitor e Electron não medidos) · **não existe fallback que cumpra o teto** (§2.1), então a garantia por construção continua obrigatória e o worklet vira custo aditivo · **arquivo próprio servido pela origem** → entra no `PRECACHE_URLS` e obriga bump de `CACHE_VERSION` a cada versão do módulo · **`addModule` é assíncrono** contra um áudio de UI que hoje sai com 1 amostra de erro, e a D11 faz o primeiro gesto poder chegar antes do módulo · **look-ahead custa latência igual à janela**, acrescentada ao feedback do toque, e a **latência real das três superfícies não foi medida** (L-1) · **custo de CPU não medido, e não há aparelho no laço** — o §3 do contexto declara *condição de uso* (celular no bolso, no mudo, fone às vezes), **não** um modelo de aparelho, então qualquer número de CPU aqui seria inventado · callback JS por quantum de render, para todo usuário, para sempre | **rejeitada por ora** — é o mandato do arquiteto ao contrário: pagar complexidade permanente por uma dimensão que não cresceu. Fica com gatilho de revisão escrito (§6) |
| **C · Manter `WaveShaper` (com ou sem 4×) e CHAMÁ-LO de limitador do S3** | Zero trabalho | **Mentira medida**: +0,50 / +1,51 dBTP sob pressão. E pior — a variante sem oversampling é a que **passa num gate de pico de amostra** com −1,00 dBFS exato. Seria o defeito se autocertificando | **rejeitada**: é exatamente o anti-padrão que o A-1 encontrou. Aceitamos o nó (§2, item 3) e **recusamos o nome** |
| **D · `DynamicsCompressorNode` com ratio alto** | Nó de estoque, curva suave | **+2,99 dBTP** (o pior dos três) · e mediu **−0,57 dB** de redução no pior caso, ou seja **já está achatando a hierarquia** sem necessidade — a forma final da objeção O-7 citada na spec §6.5 | **rejeitada** |
| **E · Biblioteca de terceiros de mixagem/limiting** | Trabalho pronto | Contexto §10 proíbe sem ADR aprovado; §5 não tem nenhuma dependência de áudio hoje; `dist/` é commitado (todo byte é permanente); e ela **não resolve** nada que A já não resolva, porque o problema nunca foi implementar um limitador — foi descobrir que ele não é chamado a trabalhar | **rejeitada** |
| **F · Baixar o teto / afrouxar o S3 para caber nos nós de estoque** | Faria os três candidatos "passarem" | Reabre S3, que tem norma citada (ITU-R BS.1770-4 / EBU R 128) e cujo gatilho de revisão escrito é *"medição mostrando que −16 LUFS deixa o app inaudível"* — nada disso foi medido. E é desnecessário: o material real está **3,29 dB abaixo** do teto atual | **rejeitada** |

---

## 4. Consequências

### 4.1 Positivas

- **O teto passa a ser verificável antes do deploy**, num render determinístico, em vez de
  confiado a um nó em runtime que nunca foi exercitado.
- **Nada muda em `public/sw.js`.** Sem arquivo novo servido pela origem: **nenhuma entrada nova
  em `PRECACHE_URLS`** e **nenhum bump de `CACHE_VERSION`** por conta desta decisão (valor medido
  hoje: **`v108`**, `public/sw.js:3` — nota lateral: o `CLAUDE.md` ainda diz "v101", e o número
  apodreceu de novo, exatamente como o próprio arquivo avisa).
- **Nenhum byte novo em qualquer orçamento.** Não gasta do S6 (300 KB) nem do bundle.
- **Paridade das três superfícies de graça**: a decisão não usa nenhuma API que varie entre
  Chrome, WebView do Capacitor e Electron — o conjunto de nós é o mesmo. (Isto **não** dispensa
  medir o resto do grafo nas três; dispensa medir *esta* decisão.)
- **Latência intocada**: SFX pré-decodificado segue com erro de agendamento de **1 amostra**.
- **A `spec-de-loudness.md` ganha o gate que ela mesma pediu**: o §6.5 diz que o limitador é
  *"rede de segurança, não ferramenta de mixagem"* e que redução >1,0 dB significa que a escada
  está errada. Esta ADR leva a frase às últimas consequências: se o limitador é rede, a garantia
  tem de estar na escada — e a escada é auditável offline.

### 4.2 Negativas / custo que aceitamos

- **Aceitamos conscientemente que, se algo escapar da escada, o app estoura o teto.** A
  guarda-de-clipe contém o dano em **+1,51 dBTP** sob +20 dB, e isso **não é conformidade com o
  S3** — é contenção. Está escrito, tem número, e não pode ser vendido como outra coisa.
- **O peso da correção muda de lugar**: passa a ser do **lote de assets** e da tabela de ganhos.
  E hoje esse lugar **está ruim** — A-3 mediu 5,20 LU de resíduo intra-categoria contra tolerância
  de ±1,0 LU, e A-5 mediu 4,62 LU de dispersão no alvo de trilha. **Esta decisão só é segura com o
  gate ligado**; sem o gate, ela é pior que a alternativa B.
- **Fica uma dívida nomeada**: a `spec-de-loudness.md` §6.5 precisa ser editada pelo dono dela
  (`som-engenheiro-audio`) para dizer **com que mecanismo** o teto é cumprido, e o **G-7 precisa
  do cenário `lim-over-*`**, porque o G-7 atual é **verde vazio** (mede 0,00 dB de redução e por
  isso nunca reprova). Enquanto essa edição não acontece, a spec e esta ADR discordam no papel.
- **Uma classe de conteúdo fica fora da garantia**: qualquer fonte cujo nível não seja conhecido
  em build (áudio do usuário, stream de terceiro, TTS de provedor, `playbackRate` variável em
  runtime, **ou síntese estocástica em runtime**).
  **Uma já existe.** `src/utils/sounds.ts`, em `playVisorTune`, sintetiza ruído branco por
  `canal[i] = Math.random() * 2 - 1` **a cada toque**. Enquanto ela existir, a garantia por
  construção vale **para a realização medida, não para a fonte**. Não é hipótese: a dispersão
  foi medida no motor real na Fase 0, com 12 realizações
  (`discovery/baseline-medicao.md`, `discovery/visor-realizacoes/`) —
  **σ(LUFS-M) = 0,67 LU** (faixa 2,29 dB) e **σ(dBTP) = 1,53 dB** (faixa 5,05 dB), contra um
  critério de refutação de σ ≤ 0,1 LU. **Quase 7× o limite.**
  Consequência operacional, e é ela que muda o instrumento: uma fonte estocástica é medida por
  **distribuição**, não por captura única, e **nenhuma catraca pode ser ancorada numa realização**
  (ver AC-2, §4.4 e `gate-loudness.md`). Voz/TTS continua fora de escopo por decisão do dono
  (contexto §10); a síntese estocástica **não** estava, e a frase anterior desta ADR — *"hoje
  nenhuma existe no escopo"* — **era falsa**.
- **A guarda-de-clipe é um nó cujo nome mente se ninguém cuidar dele.** Mitigação obrigatória: o
  identificador no código **não pode conter "limiter"/"limitador"**, e o guard de aceite **AC-4**
  varre por isso.

### 4.3 Porta de uma via só?

**Não.** É porta de duas mãos, e essa é metade do motivo da escolha:

- Adicionar o worklet depois é **acrescentar um nó no fim do master**, atrás do mesmo ponto de
  medição P-B. O grafo, a escada, as regras de exclusão e o gate **não mudam de forma**.
- Nada nesta decisão grava estado no save, no localStorage ou no servidor. Não há migração.
- Nada é publicado a terceiros nem entra permanentemente em `dist/` por causa dela.

**A alternativa B é que é a porta pesada**: um arquivo no `PRECACHE_URLS` fica no cache do usuário
até o próximo `CACHE_VERSION`, e um caminho de boot assíncrono, uma vez que a UI dependa dele
("som só depois de pronto"), é caro de desfazer. **De-risking de B, para quando vier:**
(a) medir `AudioWorkletNode` e `addModule` nas três superfícies **antes** de escrever o módulo;
(b) entrar por **bypass declarado** (§4.4), nunca por gate de boot; (c) mesmo com worklet,
**manter o gate offline como a régua**.

### 4.4 Regras que ficam registradas para o dia em que B for aprovada

Escritas agora **porque a pergunta foi feita agora**, e porque um ADR que não responde deixa o
implementador decidir sozinho:

1. **`addModule` assíncrono vs. som de UI síncrono → BYPASS DECLARADO.** O grafo toca desde o
   primeiro gesto **sem** o worklet; o nó é inserido quando o módulo resolve. **Não é fila**
   (fila atrasa o feedback do toque, que é o número que o usuário sente, e a D11 faz do gesto o
   único gatilho legítimo). **Não é "som só depois de pronto"** (isso engole em silêncio o
   primeiro gesto da sessão, que é justamente o `playPresence` — uma vez por sessão; se perder,
   perdeu). **O bypass só é seguro porque o teto não depende do worklet** — que é o conteúdo desta
   ADR. Sem ela, bypass seria falha em silêncio.
2. **Falha de `addModule` (ou ausência de `AudioWorkletNode`) é EVENTO, nunca silêncio.**
   Degrada para o mesmo grafo do bypass, e **registra**. O instrumento já existe: `telemetry.ts`
   + `functions/api/metrics.js`, 25 eventos, `EVENT_SCHEMA` como allowlist que **falha fechada** e
   é **DUPLICADA entre cliente e servidor** — evento novo entra nos dois ou morre na allowlist.
   Consequência medível declarada: na superfície degradada o teto continua garantido pela
   construção e pelo gate; **a proteção que se perde é só a contra o caso de +20 dB**, que nenhum
   cenário real produziu.
3. **`PRECACHE_URLS` e `CACHE_VERSION`: sim para os dois.** O módulo **entra** no `PRECACHE_URLS`
   de `public/sw.js` — se não entrar, o primeiro load offline (e o do PWA instalado) roda **sem**
   limitador, que é exatamente o cenário de degradação silenciosa que o item 2 proíbe. E **toda**
   mudança do módulo exige **bump de `CACHE_VERSION`** no mesmo commit, pela regra de deploy do
   `CLAUDE.md`. Guard executável: **AC-5**.
4. **De que lado da régua o worklet cai: CÓDIGO, não áudio. Sem ambiguidade.** Os bytes do
   worklet **não** debitam dos **300 KB do S6** — o S6 mede *asset de áudio*, e sua régua é
   "**zero bytes de áudio no bundle inicial**", com guard previsto em
   `sprites.dungeonRoster.test.ts` (que abre `dist/assets/`) e no `PRECACHE_URLS`. Worklet é
   JavaScript. Debitá-lo do orçamento de áudio faria um SFX ser cortado para caber um limitador,
   o que é absurdo de contabilidade. **E isso não é passe livre:** o orçamento de **bytes de
   código não existe no repositório** (correção medida do §5 do contexto — `vitest.budget.mjs` é
   orçamento de TEMPO). Então o módulo nasce com **teto próprio declarado no PR que o
   introduzir**, medido em `dist/`, ou não entra. Referência de ordem de grandeza, e só isso: o
   grafo inteiro do spike (`grafo.ts` + `cenarios.ts`) deu **15 712 bytes** em esbuild sem
   minificar, sem nenhuma dependência.

### 4.5 Onde o código mora, e quem é o dono único

O spike vive em `squad-alpha-runs/som-01/prototyper/` e é **descartável** — `grafo.ts`,
`cenarios.ts` e `harness.mjs` não são código de produção e não devem ser copiados linha a linha.

Para a produção, e valendo já para a escada de ganhos (que é quem cumpre o teto):

- **O barramento, a escada de ganhos e a guarda-de-clipe são módulo PURO em `src/utils/`**, no
  padrão do motor de tarefas (sem React, sem `localStorage`, tudo por parâmetro). **Dono único:
  `som-engenheiro-audio`.** O nome do arquivo é escolha dele; o que esta ADR trava é que seja
  **um** arquivo.
- **O número do teto (−1,00 dBTP) e os ganhos de categoria são declarados em UM lugar só**, e
  **o teste importa a constante — nunca a redigita**. O precedente de dano é do próprio repo e
  está no `CLAUDE.md`: `computeDailyReset` foi reimplementado dentro do teste (`simulateReset`), e
  o teste passou **afirmando uma evolução automática que `MANUAL_EVOLUTION` impede**. Um gate de
  loudness com o teto copiado tem exatamente essa forma.
- **`src/utils/sounds.ts` e os 7 chamadores** (`App.tsx`, `CompanionHUD`, `DinoGame`,
  `DungeonGame`, `EvolutionPath`, `NightmareBattle`, `RPSGame`) passam a falar com o barramento;
  **nenhum deles ganha ganho hardcoded novo** — hoje há ganhos de 0,045–0,12 espalhados por
  chamada, nunca medidos em dBFS, e é essa dispersão que a escada substitui.
- **Se o overlay Electron um dia emitir som, ele IMPORTA, não copia.** Precedente medido: o
  desktop ficou **seis** consertos atrasado enquanto as regras de cuidado eram cópia (`CLAUDE.md`,
  footgun 9), e a fronteira correta é um adaptador que **não decide nada**
  (`desktop/renderer/src/care.ts`). O `menu.ts` é onde a divergência se esconde, porque toca o DOM
  no topo e **nenhum teste em `node` consegue importá-lo**.

### 4.6 CPU, latência e o aparelho que não existe

**Não há número de CPU nesta ADR, de propósito.** O §3 do contexto declara **condição de uso**
(celular no bolso, frequentemente no mudo, fone às vezes; sessões longas em casa) — **não** um
modelo de aparelho —, e o spike declara que **não há aparelho no laço** e que a sonda de
`AudioContext` real devolveu `outputLatency: 0` com o relógio parado no ambiente headless (L-1).
Qualquer "custa X% de CPU no aparelho fraco" aqui seria inventado, e este run derrubou seis erros
de fato e cinco campos de contexto exatamente por esse motivo.

O que **pode** ser afirmado, e sustenta a decisão:

- O grafo escolhido usa **`GainNode`, `AudioBufferSourceNode` e um `WaveShaper`** — todos nativos,
  sem callback em JavaScript por quantum de render.
- **Look-ahead custa latência igual à janela de antecipação, por definição**, somada a **todo** som
  que passa pelo master — inclusive o SFX de resposta ao gesto, que hoje sai com 1 amostra
  (0,0208 ms) de erro de agendamento.
- Portanto a alternativa B pede para **acrescentar latência não quantificada ao único caminho que
  o usuário percebe**, num aparelho não caracterizado, para cobrir um caso que mediu **0,00 dB** de
  necessidade. **Não cabe** — não porque o custo seja grande, mas porque é **desconhecido e
  desnecessário ao mesmo tempo**.

### 4.7 Raio de explosão

Constrange: `src/utils/sounds.ts` e os 7 chamadores · o formato do gate da Fase 2 e o manifesto do
lote (o teto agora é responsabilidade do lote) · a `spec-de-loudness.md` §6.5 e o cenário G-7 · o
futuro adaptador de áudio do `desktop/`. **Não** constrange: `public/sw.js`, `package.json`,
`dist/`, telemetria, save, servidor.

### 4.8 Custo em escala (10× / 100×)

A dimensão que cresce aqui **não é usuário** — é **fonte simultânea**, e ela é **limitada por
regra, não por hardware**: as exclusões do §4.3 (Marco silencia tudo; Presença exclui Cuidado;
duas fontes da mesma classe nunca somam) fazem o máximo simultâneo ser o conjunto fechado do §7.2.
**10× mais SFX no catálogo não produz 10× mais fontes somando** — produz mais entradas na tabela
de ganhos e mais bytes no orçamento do S6 (300 KB), que é onde a conta realmente aparece.
Custo desta decisão em CPU: **constante e nativo** (n `GainNode` + 1 `WaveShaper`), independente do
tamanho do catálogo. Custo de manutenção: **linear no número de categorias** (uma constante medida
por categoria) e **linear no lote** (um render por cenário no gate). A alternativa B, ao contrário,
tem custo de CPU **proporcional ao tempo de reprodução × todo usuário × para sempre**, e custo de
manutenção proporcional a **três superfícies × cada release de navegador/WebView**.

---

## 5. Critério de aceite executável — como um teste reprova esta decisão

Réguas: `squad-alpha-runs/som-01/prototipo/medir-loudness.mjs` (BS.1770-4 anexo 2, oversampling 4×,
**autovalidação que aborta o script** se a senoide de 1 kHz a −23 dBFS não ler −23,0 ±0,1) e
`medir-lufs-m.mjs`. Motor: `OfflineAudioContext` no Chrome via CDP, como o spike já fez. Material:
os 11 WAVs de `discovery/baseline-wav/`, com hash publicado. Portão: `npx vitest run`.

| # | Assertiva | Reprova quando | Por que existe |
|---|---|---|---|
| **AC-1 · o teto** | Em **todos** os renders G-1…G-7 medidos em **P-B**: **dBTP ≤ −1,00**, com oversampling ≥4× | qualquer render passar de −1,00 dBTP | É o S3 literal. Se cair, a decisão "por construção" foi refutada |
| **AC-2 · a folga (catraca)** | No pior caso do §7.2: **dBTP ≤ −3,29** em P-B | a folga encolher mais de **1,0 dB** em relação aos **−4,29 dBTP** medidos em 08/09/2026 | Não é número novo: é o **§6.5 da spec** reescrito como assertiva ("redução do limitador ≤ 1,0 dB" ⇔ "não chegar a 1,0 dB do teto"), ancorado no valor **medido**. É a catraca que impede a folga de ser gasta em silêncio até o dia em que a construção deixa de bastar |
| **AC-3 · o gate não pode ser cego** | O teste mede **dBTP** e **pico de amostra**, e **falha se medir só pico de amostra** (guard sobre o próprio teste) | alguém "simplificar" o gate para pico de amostra | O contraexemplo está medido: `ws-sem-os` dá pico de amostra **−1,00 dBFS exato** e **+1,51 dBTP**. Um gate de amostra aprova o defeito |
| **AC-4 · a guarda não pode se promover** | Nenhum identificador do módulo do barramento casa `/limit(er\|ador)/i`; a curva de clipe é declarada em **−1,00 dBFS**; o teto (−1,00 dBTP) e os ganhos de categoria existem em **um** arquivo, e o teste **importa** a constante em vez de redigitá-la | o nó voltar a se chamar limitador, ou a constante ser copiada | Consequência 4.2 + footgun 9 (`simulateReset`) |
| **AC-5 · o worklet, se um dia vier** | Se existir arquivo de worklet servido pela origem: seu caminho **está** em `PRECACHE_URLS` (`public/sw.js`) **e** `CACHE_VERSION` foi bumpado no mesmo commit **e** existe teto de bytes declarado para ele | qualquer uma das três faltar | Fecha 4.4, itens 3 e 4, antes que o implementador precise lembrar |
| **AC-6 · sem dependência nova** | `package.json` continua sem dependência de áudio | alguém introduzir biblioteca sem ADR | Contexto §10 |

**Como esta decisão morre, em uma frase:** se **AC-1** ou **AC-2** falhar com o lote real da
Fase 2, a garantia por construção não se sustenta e a alternativa **B** volta à mesa **com
evidência**, em vez de por analogia com o cenário artificial de +20 dB.

---

## 6. Gatilho de revisão

Qualquer **um** destes reabre a ADR (não é preciso o conjunto):

1. **AC-1 falha** com o lote real: um render de G-1…G-7 mede acima de −1,00 dBTP em P-B.
2. **AC-2 falha**: a folga do pior caso encolhe para menos de 1,0 dB (dBTP > −3,29 em P-B). Este é
   o gatilho *precoce* — ele dispara **antes** de o teto ser rompido.
3. **Fonte cujo nível não é conhecido em build.** Voz/TTS (hoje fora de escopo por decisão do
   dono, contexto §10), áudio de terceiro/stream, conteúdo do usuário, `playbackRate`/pitch
   variável em runtime, **ou síntese estocástica**.
   **Este gatilho já está DISPARADO desde antes de a ADR ser escrita**: `playVisorTune` é
   estocástico (§4.2). Ele portanto não é um "se um dia" — é uma condição vigente, e o que ela
   exige está escrito: enquanto a fonte existir, o AC-2 é derivado do **pior caso de N ≥ 12
   realizações** e a fonte é marcada como estocástica no gate (`FONTES_ESTOCASTICAS`), nunca
   tratada como constante.
   **B (`AudioWorklet`) passa de "não paga" a "obrigatória"** no dia em que a distribuição medida
   encostar no teto: o critério operacional é `max(dBTP) sobre N realizações > CATRACA`. Hoje,
   com N = 12 medidas, ela **não** encosta — mas essa é uma afirmação sobre uma amostra de 12, e
   a ADR a declara como tal. O caminho barato de fechar o gatilho **de vez** é a pendência 4 do
   `gate.md`: trocar `playVisorTune` por asset determinístico; feito isso, o escopo volta a não
   ter fonte estocástica e este item volta a ser hipotético.
4. **Medição em aparelho real (L-1)** mostra estouro que o render offline não prevê — por exemplo
   um caminho de saída da superfície (WebView do Capacitor / Electron) que aplique ganho depois do
   nosso master. Isto exige o aparelho no laço, que **o dono precisa fornecer**.
5. **O S3 muda** (`docs/REGISTRO-DE-DECISOES.md` §6.1) — teto novo, régua nova, decisão nova.
6. **A escada de ganhos deixa de ser constante**: se algum dia o ganho de categoria virar knob de
   runtime (usuário, mixagem dinâmica, ducking dependente de conteúdo), o valor em P-B deixa de ser
   calculável em build e o gate perde a força.

---

## 7. Pendências que esta ADR NÃO fecha (e de quem são)

| Pendência | Dono | Nota |
|---|---|---|
| Editar `spec-de-loudness.md` §6.5 (com que mecanismo o teto é cumprido) e dar ao **G-7** um cenário que faça o limitador trabalhar — o atual é **verde vazio** (0,00 dB) | `som-engenheiro-audio` (dono único da spec) | Sem isto, spec e ADR discordam no papel |
| Calibrar a escada: A-3 (resíduo intra-categoria **5,20 LU** contra ±1,0) e A-5 (tabela de **5 estados × 4 camadas** medida) | `som-engenheiro-audio`, Fase 2, com o lote real | **É de onde a garantia desta ADR vem.** Sem calibração, o teto não tem quem o cumpra |
| A-2 (colisão do banho é regra de despacho, **4,58 dB**) e A-4 (espera pelo compasso, 0–2400 ms) | `som-diretor-sonoro` | Fora do escopo desta ADR; citados porque a regra 3 do §4.3 **é parte do mecanismo** que cumpre o teto |
| **L-1 — latência de saída real nas três superfícies** e paridade do grafo em Capacitor/Electron | dono (aparelho no laço) | Não bloqueia esta decisão (ela não usa API que varie); bloqueia o gatilho 4 |
| Captura de microfone em produção contra a Data Safety declarada (contexto §10, corrigido) | escalado ao dono | Não é áudio de saída, não tem relação com esta ADR; citado para não sumir |

---

## 8. Autoavaliação contra a barra

| Dimensão | 🟢/🟡/🔴 | Evidência |
|---|---|---|
| Justificada por NFR, não por moda | 🟢 | A decisão gira em torno de dois números medidos: **−4,29 dBTP** no pior caso declarado e **0,00 dB** de trabalho do limitador. A opção "moderna" (`AudioWorklet`) foi a **recusada** |
| Complexidade paga, não especulativa | 🟢 | Zero dependência, zero arquivo novo, zero mudança no service worker, zero latência acrescentada |
| Porta de uma via identificada e desarmada | 🟢 | §4.3: esta é de duas mãos; a de uma via era a B, e o de-risking dela está escrito para quando vier |
| Curva de custo em 10×/100× | 🟡 | §4.8 — a dimensão que cresce (fonte simultânea) é **limitada por regra**, e isso é medido; mas a curva de **bytes** do S6 depende do lote da Fase 2, que ainda não existe |
| Um engenheiro novo entende o **porquê** | 🟢 | §1.2 (o limitador nunca trabalhou) e §2.1 (o fallback do worklet é esta decisão) são o argumento inteiro |
| Nenhum número inventado | 🟢 | Todo valor vem de `prototyper/saida-execucao.txt`, de `spike-grafo.md`, da `spec-de-loudness.md` ou do `REGISTRO-DE-DECISOES.md`. Onde não há medição — CPU do worklet, aparelho fraco, latência real — está escrito que **não há** (§4.6) |
| Reprovável por teste | 🟢 | §5, seis assertivas, com o medidor autovalidado que já existe no run |

---

## 9. Conferência da barra dura

- ✅ **Nada implementado.** Esta ADR é decisão escrita; quem implementa é `som-engenheiro-audio`.
- ✅ **Nada tocado em `src/`, `public/`, `docs/`.** O arquivo vive em
  `squad-alpha-runs/som-01/prototyper/` até ser aprovado.
- ✅ **Nenhum número inventado** (ver §8, última linha).
- ✅ **S3 e D11 não reabertos**; o teto continua −1,00 dBTP.
- ✅ **A conclusão "não vale um worklet" foi dita com todas as letras**, e é a recomendação.
