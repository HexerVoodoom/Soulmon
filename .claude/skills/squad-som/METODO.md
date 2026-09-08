# Método SQUAD-SOM — **só os deltas**

Este documento **não repete** o método da SQUAD-Alpha. Ele diz o que muda quando o artefato é
som. Tudo que não está aqui vale como está em
`C:\Users\spera\.claude\skills\squad-alpha\METODO.md` (as 6 fases, o ritmo
*abrir → despachar → coletar → loop adversarial → loop de verificação → CHECKPOINT*, os três
níveis de verificação L1/L2/L3, o modo divergente).

Ritmo, princípios e gate humano: **inalterados**. O que muda é o que conta como verificação.

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

- **Inventário sonoro** dos 11 sons e dos 7 chamadores, com uma coluna que a maioria dos runs
  esquece: **quais eventos passam a NÃO ter som**. *Fase 0 sem nenhum corte proposto é sinal
  de que a pergunta não foi feita.* Revisores obrigatórios do corte:
  `soulmon-behavioral-psychologist` + `alpha-requisitos` — nunca o autor.
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
  residual escala ao dono — não há jurídico (§9).
