> # ⏸️ PARQUEADO PARA A v2.0 — decisão do dono, 22/09/2026
>
> **Esta spec não é trabalho em andamento.** O dono decidiu priorizar o
> balanceamento PRÉ-RENASCIMENTO e lançar a alocação de elemento junto do
> Renascimento na **v2.0 do app**. Nada aqui entra antes disso.
>
> **O que já está no código, e é INERTE.** Dois pacotes foram construídos e
> mergeados antes da decisão. Eles não fazem nada hoje porque **ninguém passa
> um plano de alocação**: não há campo no save, não há tela e não há chamador.
> Sem plano, `allocateElementos` é byte a byte a função de sempre — há teste
> exigindo isso estágio por estágio.
>
> | Pacote | Estado | Onde |
> |---|---|---|
> | WP4.22 — carve-out em `allocateElementos` | pronto, inerte | `ficha/buildSheet.ts` + `buildSheet.aloc.test.ts` |
> | WP4.22b — R-B, a alocação não compra combate | **verde**, medido | `arena.alocacao.test.ts` |
> | WP4.23 — T-PISO | **reprovou**, medido | `buildSheet.piso.test.ts` |
> | WP4.24…WP4.33 | não começados | — |
>
> ⚠️ **Ao retomar, comece lendo o bloco WP4.23 do `ledger/permanencia.md`** —
> a régua de §10.2 desta spec **não é atingível** pelos mecanismos testados, e
> o motivo é estrutural (par destrava com ≥50 pontos em cada componente contra
> um orçamento de 500). Há uma decisão do dono pendente ali, com quatro saídas
> medidas. **Não recomece a implementação antes de resolvê-la** — foi o que
> parou este trabalho, não falta de tempo.
>
> As sete decisões que sustentam esta spec (#72–#78) estão em
> `docs/PERGUNTAS-DO-DONO.md`, seção "ALOCAÇÃO DE ELEMENTO". Elas continuam
> valendo; o que mudou foi o QUANDO.

# G — Alocação manual de ELEMENTO destravada pelo Renascimento (SPEC)

> **Estado: SPEC. Nada implementado.** Escrita em 22/09/2026 pelo
> `soulmon-guarda-nascimento` a pedido do coordenador. A forma foi **decidida
> pelo dono** — esta spec não reabre nenhuma das decisões listadas em §0, só
> resolve o COMO com símbolo e dono.
> Domínio de destino: **permanência** (ledger `ledger/permanencia.md`), porque
> tudo aqui morde em evolução, `perfectDays` e teto de geração. Pacotes
> numerados na sequência daquele ledger: **WP4.22 … WP4.31**.

---

## 0. O que já está decidido (não reabrir)

| # | Decisão |
|---|---|
| D-G1 | **Gate**: só o Renascimento destrava. O registro `rebirth` no save (`utils/rebirth.ts` › `RebirthRecord`, nunca apagado) é a chave de modo. Pet não renascido = jogo de hoje, byte por byte. |
| D-G2 | **Cadência**: o renascido aloca **a cada evolução** (rookie → champion → ultimate → mega → ultra), não uma vez na cerimônia. |
| D-G3 | **Pontos**: uma FATIA do `ELEMENT_ORCAMENTO_BY_STAGE` que já existe. Redistribuição, não pontos novos. Sem ganho por desempenho, sem compra. |
| D-G4 | **Reversibilidade**: permanente, acumulando entre estágios. |
| D-G5 | **Geração tardia (só renascido)**: `soulmonStages` passa a ser escrito POR ESTÁGIO. Não renascido continua com as 11 de uma vez. |
| D-G6 | **Incubação**: a ocasião B de `utils/spriteTrigger.ts` (`faltam === 1`) ganha nome, estado persistido e visibilidade — aviso na fila da Home. Encaixar nas ocasiões A/B/C, não reinventar. ⚠️ **Revisto em 22/09/2026 (D-G8b)**: a incubação passa a ter DURAÇÃO — `INCUBATION_MIN_MS` = 30 min —, então o aviso pode dizer quando a forma fica pronta. O que continua proibido é contagem regressiva de PERDA: nada expira ao fim dos 30 min. |
| D-G8 | ⚠️ **REVOGADO em 22/09/2026 o prazo de 24h.** Não existe relógio de parede que FECHE nada, tolerância em horas nem contagem de tempo de espécie nenhuma. Motivos registrados: (a) seria a primeira mecânica do app em que *não abrir o app* produz perda permanente, contra `ABSENCE_FORGIVENESS_DAYS`, `REST_DAYS_PER_WEEK`, escudos automáticos e constância em janela; (b) com `MANUAL_EVOLUTION = true` o disparo já pertence ao jogador — pôr um relógio ao lado dele acrescenta coerção onde havia autonomia. **O gesto de evoluir continua sendo do jogador, e a incubação espera por ele indefinidamente.** |
| D-G8b | 🆕 **A incubação tem uma ESPERA MÍNIMA de 30 minutos** (decisão do dono, 22/09/2026 — `INCUBATION_MIN_MS`). Ao entrar em incubação o lote de sprite começa a ser gerado; a evolução só fica disponível depois dos 30 min, e o jogador volta para dar o gesto. **Isto NÃO reabre o D-G8, e a diferença é a única coisa que importa aqui: 30 min é um PISO, nunca um teto.** Voltar em 30 minutos, em três dias ou em três semanas dá exatamente o mesmo resultado — nada expira, nada fecha sozinho, nada é perdido por não abrir o app. A régua que separa os dois é `spriteTrigger.semPrazo.contract.test.ts`: proibida qualquer aritmética de data que PRODUZA perda; a comparação `agora − since ≥ INCUBATION_MIN_MS`, que só LIBERA, é a única permitida, e o teste a nomeia explicitamente para que a proibição não a engula. |
| D-G9 | Enquanto o estágio está aberto, a alocação é **livremente editável** — não é reversão, é *ainda não commitado*. Depois é permanente, e **reset de pontos (grátis, por Bits, por Créditos ou por item) está vetado preventivamente** (`ledger/vetos.md`, 22/09/2026). ⚠️ **O ponto de fechamento MUDOU com o D-G8b, por consequência necessária:** a alocação fecha no **início da incubação**, não mais no gesto de evoluir. O motivo é que o sprite é gerado A PARTIR da ficha, e a ficha é o que a alocação mexe — deixar a alocação editável durante os 30 min significaria gerar a forma a partir de uma alocação que o jogador ainda pode trocar, e então a alocação **não influenciaria a forma**, que é a razão inteira da funcionalidade existir. Isto RESTAURA o desenho original do dono ("o último dia é de incubação, deve deixar claro que status novos não influenciarão mais na evolução"), que o D-G8 tinha desfeito junto com o prazo de 24h. |
| D-G10 | **A alocação NÃO abre na cerimônia de evolução.** Cerimônia é celebração; decidir sob excitação piora a escolha. Ao fechar, a cerimônia deixa um **marcador calmo e persistente** na página de Evolução. |
| D-G11 | **Prévia obrigatória da cascata**, incluindo o que ainda FALTA ("faltam N pontos em Fogo para Vapor começar a despertar"). Arrependimento é função da opacidade, não da permanência. |
| D-G12 | **Vocabulário**: é *assinatura*, não otimização. Proibidos "distribua seus pontos", "build", "otimizar", "mais forte", "melhor". O pet **nunca** comenta a alocação avaliativamente — reage à essência, jamais à qualidade da decisão. |
| D-G7 | **Referência visual (requisito novo do dono, 22/09/2026)**: o sprite v2 de uma forma usa o sprite v1 **da mesma forma** como imagem de referência, somado ao prompt do input da cerimônia (`rebirthPromptClause`, `utils/oracle.ts`). Pareamento por FORMA, nunca por posição. |

---

## 1. Onde a escolha do jogador entra na ficha

**Dono único: `allocateElementos`, em `src/utils/soulProfile/ficha/buildSheet.ts`.**
Nenhum outro arquivo distribui ponto de elemento (footgun 9).

### 1.1 A escolha é PESO, não ponto final

O jogador mexe numa barra por elemento **base**. O que vai ao save é um vetor de
**pesos inteiros** por elemento base (`0..N`), nunca o número de pontos
resultante. Dois motivos, os dois duros:

- guardar ponto final congelaria um número de balanceamento dentro do save de
  cada jogador — o dano da família do `daysToEvolve` (WP4.1), só que persistido;
- `apportion` continua sendo **a única autoridade sobre a soma exata**. Peso
  entra, `apportion` devolve inteiros que somam exatamente o orçamento.

### 1.2 Carve-out, não mistura

`allocateElementos` ganha um 3º parâmetro **opcional**:

```
allocateElementos(shares, orcamento, plano?: PlanoElementos)
```

com `PlanoElementos = Partial<Record<ElementoBaseId, number>>` (pesos, só bases).

Sequência nova, dentro da MESMA função:

0. `manualOrc = plano ? Math.floor(orcamento * ALLOC_FRACTION) : 0`;
   `autoOrc = orcamento - manualOrc`. Sem plano, `manualOrc = 0` e **a função é
   idêntica à de hoje** — é essa identidade que mantém o save existente intacto
   e as fixtures de `pipeline.test.ts` bit a bit iguais.
1. `manuais = apportion(plano, CLASS_ELEMENT_ORDER, manualOrc)` — pesos zerados
   entram como 0; plano totalmente vazio ⇒ trata como sem plano.
2. `passe1 = apportion(shares, CLASS_ELEMENT_ORDER, autoOrc)`;
   `combinado[el] = passe1[el] + manuais[el]`.
3. A cascata (`cascataDosPares`, §passe 2 de hoje) roda sobre **`combinado`**, e
   o carve-out do par (`DERIVED_SPEND_FRACTION`) é calculado sobre **`autoOrc`**,
   nunca sobre a fatia do jogador — a fatia manual não é taxada.
4. `aindaDestravado` é reconferido sobre `bases + manuais`, exatamente como hoje.

**Duas travas que a spec impõe e o teste trava:**

- **T-SOMA**: `custoElementos(saida) === orcamento` para todo plano, todo
  estágio, com e sem boost de Rebirth. Hoje isso é garantido por construção;
  com o carve-out passa a ser *afirmação*, e afirmação sem teste apodrece.
- **T-LEGAL**: o plano **só toca elementos BASE**. Ponto direto em par continua
  vindo só da cascata. Deixar o jogador comprar par direto reintroduz o par sem
  o caminho — exatamente o que `applyElementBias` foi escrito para evitar.

### 1.3 O que o plano NÃO pode mexer (e por quê)

- **`seedKey` não muda.** O plano entra como DADO, nunca como semente. Se
  entrasse na seed, o embaralhamento de `allocateTalentos` e o `pick` de
  `pickProfissao` re-rolariam a cada alocação — o jogador mexeria numa barra de
  elemento e perderia um talento. (É o mesmo motivo pelo qual a profissão foi
  estabilizada na escala rookie.)
- **`pickProfissao` continua lendo a alocação AUTOMÁTICA rookie**
  (`rookieElementos` sem plano). A profissão é traço estável, decidido uma vez.
  Sem esta regra, alocar no ultra re-decidiria a profissão do rookie.
- **`applyElementBias`** (viés do elemento escolhido no Rebirth) roda ANTES, nos
  `focoShares`, e continua intacto: ela é a escolha da cerimônia; o plano é a
  escolha de cada evolução. Os dois somam, e essa soma é intencional.

### 1.4 Por que a cobertura de `pipeline.test.ts` não cai

As 4 simulações travadas (17/17 elementos, 65/65 talentos, 11/11 profissões,
32/32 criaturas) rodam sobre fichas **sem plano** → caminho idêntico, resultado
idêntico. O que se ACRESCENTA (WP4.23) é uma 5ª simulação: 120 perfis × 3 planos
adversários (tudo num elemento; tudo em dois; plano uniforme) exigindo que
(a) T-SOMA valha nos 3×5 estágios, (b) a profissão escolhida seja **a mesma** do
mesmo perfil sem plano, (c) nenhum talento elegível desapareça do universo
alcançável.

---

## 2. A fração alocável

**Proposta: `ALLOC_FRACTION = 0.25`**, constante nova, dono
`ficha/buildSheet.ts`, ao lado de `DERIVED_SPEND_FRACTION`.

Números, com `REBIRTH_BUDGET_MULTIPLIER = 1.5` (o renascido é o único que aloca):

| estágio | orçamento ×1.5 | fatia manual (25%) | o que isso compra |
|---|---|---|---|
| rookie | 45 | 11 | sabor. Não destrava nada |
| champion | 90 | 22 | inclina um base |
| ultimate | 180 | 45 | ~1 componente no marco de destrave |
| mega | 450 | 112 | 1 componente inteiro + metade do 2º ("quase destravando" — a antecipação que a curva já promete) |
| ultra | 750 | 187 | **os dois componentes** (~50+50) de um par escolhido pelo jogador, com folga |

Justificativas, uma a uma:

- **Contra `DERIVED_SPEND_FRACTION` (0.2)**: a fatia do jogador tem de ser
  *maior* que o gasto que o motor já faz sozinho em especialização — senão a
  autoria lê como ruído ao lado da máquina. 0.25 > 0.2 por pouco, de propósito:
  a leitura do oráculo continua dona de **3/4** do orçamento, que é o que
  mantém a frase "a criatura veio de quem você é" verdadeira.
- **Contra `CUSTO_PONTO_PAR` (2)**: a fatia é gasta só em BASE (custo 1), então
  187 pontos no ultra valem 187 de largura — o suficiente para o jogador
  *habilitar* um par por mérito de foco. Ele nunca compra o par direto; a
  cascata ainda cobra 2 por ponto e ainda decide.
- **Contra a curva de `FOCUS_EXPONENT`**: a fatia manual é aplicada DEPOIS do
  expoente (que já concentrou os `focoShares`). Um plano contrário ao foco
  achata a ficha em no máximo 25% — não consegue desfazer a especialização, só
  temperá-la. Era o risco real: alocação manual que permitisse espalhar 750
  pontos por 17 elementos reabriria o buraco que o `FOCUS_EXPONENT` fechou
  (medido no cabeçalho do módulo: 3 fichas com par no ultra, contra 88/120).
- **Rejeitado 0.5**: nesse patamar a leitura do oráculo deixa de ser leitura —
  o resultado passa a ser o que o jogador digitou, e a tese do Oráculo cai.
- **Rejeitado 0.1**: no rookie seriam 4 pontos. Escolher e não ver diferença é
  o pior resultado possível de uma tela de escolha (é o argumento que já está
  escrito no piso da escola em `buildFicha`).

**O que precisa ser re-simulado antes de mergear (WP4.23)**: a calibração de
`soulProfile/axes.ts` **não** é tocada (o plano não mexe em coeficiente de eixo),
então o aviso "mexer num deles sem refazer a simulação reabre o buraco" não se
aplica. O que se refaz é a simulação de **cobertura da ficha**, com planos
adversários, e o corte é numérico: nenhum elemento/talento/profissão sai do
universo alcançável.

---

## 3. Poder mecânico: a brecha é `getArenaAttributes` (R-B)

⚠️ **Correção de rota (22/09/2026).** A versão anterior desta spec apontava
`realSkillPower.ts`/`skills.ts` como o ponto de contato. **Não é.** O parecer de
linha vermelha (`ledger/vetos.md`, R-B) localizou a brecha real, e ela está
verificada no código:

`src/utils/arena.ts` › **`getArenaAttributes(ficha)`** rankeia os elementos da
ficha (par comprado pesa `CUSTO_PONTO_PAR` e credita os DOIS componentes) e
devolve `principal`/`secundario`. Esses dois alimentam `ADVANTAGE_MULT` (1.3) e
`DISADVANTAGE_MULT` (0.8) em `playerHitDamage`/`enemyHitDamage`. **Alocar para
cobrir os elementos mais comuns do roster É vantagem de combate** — e quem aloca
é quem pagou. É exatamente o que a equivalência "dinheiro compra identidade,
nunca comportamento" proíbe.

O que já é imune e **não pode mudar**: `getArenaPlayerStats` — hp/dmg vêm de
`STAGE_BUDGET` × `ROLE_SHAPE`, com o produto hp×dmg ≈ constante por papel.

### Os quatro aceites de R-B (bloqueantes)

| # | Aceite | Como se prova |
|---|---|---|
| (i) | A alocação **nunca** altera `STAGE_BUDGET`, `ROLE_SHAPE`, `SPECIAL_EFFECTS` nem nenhuma saída de `realSkillPower.ts` | contrato de fonte + teste de unidade |
| (ii) | A distribuição de elementos dos inimigos (masmorra/Arena) não pode ser previsível a ponto de existir um `principal` dominante — **ou** a simulação de `arena.test.ts` roda de novo com fichas **alocadas adversarialmente** mantendo a janela de vitória **40–80%** e **spread ≤ 20pp** | `npx vitest run src/utils/arena` com os arquétipos alocados em cada um dos 17 elementos |
| (iii) | **Teste novo**: para a MESMA ficha, mudar só a alocação **não muda** `getArenaPlayerStats` | igualdade profunda do retorno |
| (iv) | `REBIRTH_BUDGET_MULTIPLIER` (1.5) **não** pode virar mais pontos alocáveis do que a fatia declarada — o multiplicador existe para a profundidade da ficha, não para poder | `ALLOC_FRACTION` aplicada sobre o orçamento **já multiplicado**, e nada mais; teste de T-SOMA cobre |

**Se (ii) falhar na medição**, a saída declarada nesta spec **não é** afrouxar a
janela: é cortar o contato — `getArenaAttributes` passa a ler a distribuição
**automática** (sem a fatia manual) enquanto a exibição continua lendo a ficha
alocada. Custo: a alocação deixa de ter efeito de combate. É o preço certo, e a
decisão de pagá-lo cabe ao dono, com a medição na mão.

### A fronteira permanente

> **R-ALOC**: a alocação nunca entra em superfície onde o resultado é COMPARADO
> entre jogadores — PvP (`functions/api/community.js` › `power()`, que hoje lê
> `nível×10 + atributos + aleatório` e **não** lê a ficha), ranking, faixa de
> Torneio, presentes, `publicProfile`, **widget** e cartão do amigo (R-E/#21).

E a frase de venda **"pagar nunca deixa sua criatura mais forte" (C-S1) só pode
ser escrita na tela depois que R-B tiver teste verde** — senão o app mente
justamente onde cobra (R-C).

## 4. Os campos novos no save

### 4.1 `elementAllocation` (a alocação)

```ts
elementAllocation?: {
  v: 1;
  /** pesos inteiros por elemento BASE, por estágio. */
  byStage: Partial<Record<FichaStage, Partial<Record<ElementoBaseId, number>>>>;
  /** estágios cuja alocação já fechou (ver §6). */
  locked: FichaStage[];
};
```

Hidratação defensiva em `GameStateContext.tsx` (regra do `CLAUDE.md`, sempre
`?? padrão`), no mesmo formato dos vizinhos `soulmonSkills`/`soulmonClassTitles`:

- objeto não-array ou `v !== 1` → `undefined`;
- chave de estágio ∉ `FICHA_STAGE_ORDER` → descartada;
- chave de elemento ∉ `CLASS_ELEMENT_ORDER` → descartada;
- valor não-finito/negativo → descartado; teto por elemento `PLAN_WEIGHT_MAX`
  (proposta: 100) — peso é peso, e peso ilimitado vindo de save editado é
  entrada não confiável chegando na aritmética da ficha;
- `locked` filtrado contra `FICHA_STAGE_ORDER`.

**Tamanho** (`src/utils/saveSize.test.ts`): pior caso 5 estágios × 17 elementos
≈ **1,2 KB**, `locked` ≈ 60 B. O fixture sintético de 90 dias ganha um
`elementAllocation` cheio; o teto do servidor é 5 MB e a folga medida é de ordens de
grandeza.

### 4.2 O problema central: `soulmonSkills` deixa de ser derivável do perfil

Hoje `soulmonSkills`/`soulmonClassTitles` são **cache determinístico**:
`PetPage.tsx` lê `STORAGE_KEYS.SOULMON_PROFILE` (localStorage, não sobe para a
nuvem), chama `buildFichaESkills(saved, identityKey(saved))` e devolve por
`onSkillsComputed`. E `App.tsx` › `handleSkillsComputed` grava **só quando o
campo está ausente** (`prev.soulmonSkills ? prev : {…}`). Com alocação manual,
uma recomputação a partir do perfil sozinho devolve **outra ficha** — foi por
esse caminho exato que a QA rodada 1 viu skills sumindo num aparelho novo.

**Resolução, explícita:**

1. **A alocação é estado de primeira classe** (`elementAllocation`, no save, sincroniza
   com a nuvem). O perfil continua onde está; ninguém migra localStorage.
2. **`identityKey` NÃO muda.** Ela é a identidade da PESSOA — muda-la re-rolaria
   companheiro, linhagem do bestiário e seed de talentos de todo save existente.
3. A ficha passa a ser `f(perfil, plano)`: `buildFichaESkills(input, seedKey,
   plano?)` ganha o 3º parâmetro e repassa a `buildFicha` → `allocateElementos`.
   `PetPage` passa `gameState.elementAllocation`.
4. **O cache vira cache COM CHAVE.** Campo novo no save:
   `soulmonSheetKey?: string` = `sha1(identityKey | JSON canônico do
   elementAllocation)` — a mesma ideia do `dayKey` dos registros diários: não é o dado,
   é o carimbo que diz de que mundo ele veio. `handleSkillsComputed` passa a
   gravar quando `prev.soulmonSheetKey !== chaveAtual` (hoje: quando ausente).
5. **Aparelho novo sem perfil** continua exibindo o cache do save — que agora é
   o cache CERTO, porque o plano viajou junto no save. Sem perfil não há
   recomputação; com perfil, a recomputação reproduz exatamente o cache.

**Régua**: `soulmonSkills.cacheComChave.test.ts` — (a) mesmo perfil + planos
diferentes ⇒ chaves diferentes ⇒ recomputa; (b) mesmo perfil + mesmo plano ⇒
mesma ficha, sem gravação nova (o save não pode ser escrito a cada render);
(c) save sem perfil e com plano ⇒ skills do cache, nunca `undefined`.

---

## 5. Os DOIS caminhos de `soulmonStages`

**A FORMA do array nunca muda** — `Array<{ name; stage; branch? }>`. Muda só
**quando** cada entrada é escrita. Modo derivado, sem campo novo de modo:

```
isLazyStages(state) = !!state.rebirth && !!state.rebirthCreature
```

`rebirthCreature` (campo novo) guarda o que a geração tardia precisa para
produzir a forma N **dias depois** com a mesma mão criativa:
`{ v: 1; salt: number; baseName: string; family: string; escola; elemento; criatura }`
— tudo já existe hoje dentro de `RebirthRecord` + `OracleResult`; o que falta é
**persistir o salt**, sem o qual a forma gerada no dia 20 não pertence à mesma
criatura da forma gerada no dia 1.

Consumidores, verificados um a um — nenhum precisa de mudança de
comportamento, todos precisam de **teste**:

| consumidor | hoje | com array curto |
|---|---|---|
| `App.tsx` › `getStageNameById` (~1673-1676) | `.find` + fallback id capitalizado | já tolera. Fallback vira o nome visível até a forma nascer |
| `StatsPage` álbum (`soulmonStages?.find`, ~252) | silhueta quando não acha | já tolera |
| `EvolutionPath` (`stages={… ?? []}`) | WP4.21 já desenha a próxima forma borrada | reusar o borrão, **não** criar UI nova |
| widget Android (`SoulmonWidgetPlugin`) | lê `pet_name` + sprite por estágio | não lê a árvore → intocado |
| overlay desktop (`cloudSync.ts` › `soulmonMeta.baseName`) | só o nome-base | intocado; o snapshot test já tolera `soulmonStages: 'lixo'` |

**Régua nova**: `soulmonStagesParcial.contract.test.ts` — um array de 2 entradas
atravessa os quatro consumidores de `src/` sem lançar e sem string vazia na tela.

**Onde a PERMANÊNCIA morde**: `applyRebirth` **não zera `perfectDays`** (decisão
escrita, "o preço é abrir mão da forma, não meses de castigo"). Com `required`
4/5/5/6, o renascido reescala rookie→mega em ~14 dias perfeitos e pode chegar ao
ultra por `ULTRA_PATIENCE_DAYS` (45). Consequência direta: **a geração tardia
não é lenta** — as 11 formas do renascido podem ser pedidas em poucas semanas, o
que é exatamente o que torna §8 (tetos) o ponto de pressão desta spec.

---

## 6. A incubação — espera mínima de 30 min, **sem prazo de perda**

### 6.0 O que a incubação É e o que ela NÃO é

**É**: o nome, o estado persistido e a visibilidade da ocasião B que já existe
(`faltam === 1` ⇒ o lote da próxima forma começa a ser gerado) — agora com uma
**espera mínima de 30 minutos** (`INCUBATION_MIN_MS`, D-G8b). O jogador entra
em incubação, o sprite da forma seguinte é gerado nesse intervalo, e ele volta
depois para dar o gesto de evoluir.

**NÃO é**: janela, prazo de perda, tranca ou gatilho de expiração. Os 30
minutos são **piso, nunca teto** — voltar em 30 min, em três dias ou em três
semanas dá o mesmo resultado. Nada fecha sozinho, nada é perdido por não abrir
o app (D-G8 continua inteiro).

**A diferença que a régua tem de enxergar**, porque é sutil e é toda a
segurança do desenho: há **uma** comparação de data permitida no módulo,
`agora − since ≥ INCUBATION_MIN_MS`, e ela só **LIBERA**. Qualquer aritmética
de data que **produza perda** — fechar alocação, expirar lote, cancelar
incubação, devolver "tarde demais" — continua proibida, e o teste
`spriteTrigger.semPrazo.contract.test.ts` nomeia a permitida justamente para
que a proibição não a engula por acidente.

**Quem fecha a alocação é o INÍCIO DA INCUBAÇÃO** (D-G9, revisto pelo D-G8b).
No mesmo updater que grava `incubation`, o estágio de onde se sai entra em
`elementAllocation.locked`. ⚠️ **Isto mudou**: até 22/09/2026 esta seção dizia
que quem fechava era o gesto de evoluir. Não podia ser — o sprite é gerado A
PARTIR da ficha, e a ficha é o que a alocação mexe; com a alocação editável
durante os 30 minutos, a forma seria gerada de uma alocação que o jogador ainda
pode trocar, e a alocação **deixaria de influenciar a forma**, que é a razão
inteira desta funcionalidade existir. O fechamento no início da incubação
RESTAURA o desenho original do dono ("o último dia é de incubação, deve deixar
claro que status novos não influenciarão mais na evolução"), que a revogação do
prazo de 24h tinha desfeito por tabela.

**Consequência de UI, obrigatória**: como o fechamento agora acontece ANTES do
gesto, a tela tem de dizer isso **na entrada da incubação**, não na cerimônia —
é o último momento em que a escolha ainda é do jogador, e um fechamento que a
pessoa não soube que aconteceu é a definição de arbitrário (mesmo argumento do
`lastDayReport.restDayUsed`).

### 6.1 Onde mora e quem escreve

```ts
incubation?: { v: 1; formId: string; stage: FichaStage; since: string; notified: boolean };
```

- **Regra pura em `utils/spriteTrigger.ts`**, ao lado da ocasião B que ela
  nomeia: `incubationFor(input, prev): Incubation | null`. Um dono só.
- **Quem escreve é o chamador da ocasião B**: `useSpriteGeneration`
  (`App.tsx:644`). **A virada NÃO escreve** — `dailyReset.ts` não ganha campo
  nem ramo. `since` é registro (a tela pode contar desde quando), **nunca**
  insumo de expiração; há teste proibindo qualquer subtração de datas sobre ele.

### 6.2 Idempotência

Chaveada por `formId`: `prev.incubation?.formId === novo.formId` ⇒ devolve **a
mesma referência** (footgun 6 no StrictMode; e objeto novo a cada render vira
spam de cloud save).

### 6.3 Degeneração (R-G)

A trava 3 do `spriteTrigger` (§3.5, "queda não gera lote") vale igual aqui:

- degenerar **não abre** alocação, **não fecha** alocação aberta, **não desfaz**
  alocação já commitada;
- **re-subir a mesma forma não reabre**: o chaveamento é por alocação AUSENTE
  em `locked`, nunca por "já passei aqui" — a mesma regra que impede o acervo de
  errar ao re-subir;
- a incubação em si é limpa quando `faltam > 1` (ela descreve o lote, e o lote
  não existe mais). Limpar incubação ≠ mexer em alocação.

Motivo escrito: degeneração é caminho normal até o ultra. Se a queda mexesse na
alocação, o HP — única punição sancionada, com teto e perdões — passaria a
cobrar **identidade permanente**.

### 6.4 Se o jogador não abrir o app

Nada acontece. Nada fecha, nada expira, nada é perdido. Passados os 30 minutos
a evolução fica **disponível e assim permanece** — ela espera. A única coisa
que o relógio faz neste sistema é LIBERAR; ele nunca tira. **R-F**: um estágio que
chega ao gesto de evoluir sem alocação nenhuma é distribuído pelo oráculo
exatamente como hoje — a alocação fecha a *escolha*, nunca o *recurso*, e a tela
diz isso em palavra antes do commit.

### 6.5 Visibilidade — posição declarada na fila

Slot de avisos da Home (`avisos.push` no `App.tsx`, régua
`filaDeAvisos.contract.test.ts`). Ordem nova:

```
primeiro dia → HP → incubação → semanal → triagem → priming → recomeço
```

HP é a única coisa que cobra e mantém precedência; a incubação é rara (uma vez
por estágio) e **descritiva** — "a forma seguinte está tomando corpo" —, nunca
de perda iminente. Vence a triagem, que aparece todo dia (mesmo argumento que já
pôs o semanal na frente dela). Entrada obrigatória por
`avisos.push({ key: 'incubacao', … })`; o teste da fila exige que a condição
apareça **uma vez**, dentro do `if`.

### 6.6 Push — VETADO na forma antiga; opcional sob quatro travas (R-D)

O push que anuncia fechamento **está vetado** (sem prazo, não há o que anunciar).
Sem prazo, um **convite neutro e único** passa a ser admissível, e fica
**OPCIONAL** nesta spec (WP4.30b, mergeável separado). As quatro travas:

(a) só para quem já ligou notificações; (b) **cede a vez à janela de descanso**
pela mesma regra da copy das 20h (janela começando em ≤2h30 ⇒ não sai);
(c) nunca com o pet dormindo, nunca depois do `sleepReminderAt`; (d) copy na
fonte única `_pushCopy.js`, **sem hora impressa, sem "última chance", sem
"faltam N", sem contagem** e sem condicionar ao que o jogador fez no dia.
Se alguma das quatro não couber, **o push não existe** — o aviso na fila basta.

## 7. `MANUAL_EVOLUTION` continua intacto

A incubação **não evolui**. Concretamente:

- `incubationFor` não devolve estágio, não chama `getNextEvolution` para outra
  coisa além da forma-destino (que já vem de `evolutionTarget`, fonte única);
- o updater que grava a incubação toca **apenas** `incubation` e `spriteLibrary`;
- quem dispara a evolução continua sendo o toque do jogador na cerimônia.

**Régua**: `evolucaoManual.contract.test.ts` ganha o caso "a incubação não
evolui" — varredura do updater de incubação no fonte (nenhum
`evolutionStage:` dentro dele) + caso de unidade: estado com incubação viva e
`faltam === 1` ⇒ `computeDailyReset` não muda `evolutionStage`.

---

## 8. Tetos de geração — e a conta com a referência (D-G7)

Números reais: `AI_LIMITS.sprite` (`functions/api/_aiGuard.js`) =
`{ perAccount: 6, perAccountLifetime: 26, perFormLifetime: 3 }`.

### 8.1 O caminho tardio melhora a conta

Hoje (congelado) o pet gera pelas ocasiões A/B/C conforme avança — a árvore de
11 nunca é gerada inteira de uma vez, mas a *conta* de formas alcançáveis é 11.
No caminho tardio só nasce a forma que o jogador realmente alcança: o percurso
típico (uma linha + o galho de véspera) fica em **5–7 formas**, não 11.

### 8.2 Com a era v2, a conta DOBRA — e é aqui que aperta

| cenário | gerações |
|---|---|
| vida 1 (típica, sem retry) | 6–8 |
| vida 2 renascida (típica) | 6–8 |
| **total típico** | **12–16** ≤ 26 ✅ |
| vida 1 + vida 2, ambas colecionando as 3 megas + ultra | 11 + 11 = **22** ≤ 26, **sem nenhum retry** |
| qualquer uma das duas com retries (teto 3/forma) | estoura 26 |

**Veredito**: o vitalício de 26 comporta um renascimento inteiro **só no caso
sem falha**. Com retry — e retry é normal, é por isso que `perFormLifetime` é 3
— **não comporta**. Isto é decisão de DINHEIRO (custo por geração), então:

> ⚠️ **Depende do dono** (`STATUS.md`): elevar `perAccountLifetime` para quem tem
> registro `rebirth` (proposta: 26 → 40, que cobre 22 + margem de retry), ou
> aceitar que a segunda vida termine em arte de reserva. **A spec não escolhe.**

### 8.3 O que o jogador vê quando recusa

Nada novo é inventado — o vocabulário de estado já existe em
`spriteLibrary.ts` › `cardState`:

- **409 `sprite-form-cap`** (esta forma esgotou as 3): a forma cai em
  `RESERVA_FINAL`, as outras seguem. Texto PT/EN já existente.
- **402 `sprite-lifetime-cap`** (conta fechada): `isAccountCapped` faz
  `spriteBatch` devolver `null` — o app **para de pedir**, e a árvore continua
  crescendo com arte de reserva, que é o piso do Invariante nº 1 e **nunca é
  erro**. Uma frase na página de Evolução dizendo que a árvore segue com o
  traço da casa.
- **Proibido**: transformar qualquer uma das duas recusas em oferta de compra
  dentro da cerimônia. Paywall em momento de clímax é veto do
  `soulmon-guarda-nascimento`, e a superfície de venda é do
  `soulmon-guarda-sustento` (`UnlockNudge`, seis pontos declarados).

---

## 9. A referência visual v1 → v2 (D-G7)

### 9.1 O canal existe — usar, não recriar

`spriteGen.ts` (opção `referenceImageUrls`) → `POST /api/generate-sprite`
(body `referenceImageUrls`) → `generateHiggsfield`, que manda `image_url` +
`image_urls`. **Nenhum canal novo.** O que falta é *quem preenche o array*, e o
dono disso é o acervo (`spriteLibrary.ts`), não o hook.

`rebirthPromptClause` (`oracle.ts`) continua entrando **sempre**, nas duas
variantes de prompt (com e sem referências de gênero), junto da imagem.

### 9.2 A armadilha: a v2 apagaria a própria referência

`applyRebirth` é spread puro — não toca `spriteLibrary` nem `soulmonStages`.
Parece que a v1 "sobrevive sozinha", e é falso em dois passos:

1. `hasSprite(lib, formId)` responderia `true` e `generatable()` tiraria a forma
   do lote ⇒ **a v2 nunca seria gerada**;
2. se fosse, `rememberSprite` gravaria em `sprites[formId]` ⇒ **sobrescreveria
   a v1**, que é justamente a referência.

**Solução: a ERA entra na chave do acervo.**

```ts
// dono: src/utils/spriteLibrary.ts
export function acervoKey(formId: string, era: number): string {
  return era > 0 ? `${formId}@r${era}` : formId;   // era 0 === chave de hoje
}
```

- `SpriteLibrary` ganha `era?: number` (normalizado para `0`; hidratação: int
  finito `0..9`, senão `0`). `applyRebirth` passa a devolver `era + 1` — é a
  **única** escrita dele em acervo, e é um número, não uma cópia de dados.
- **Era 0 gera a chave de hoje** ⇒ **zero migração**, nenhum save mexido.
- `hasSprite`, `isFormCapped`, `reverted`, `tunedUnseen`, `pendingTune` e o
  gatilho passam a perguntar por `acervoKey(formId, lib.era)`. Como o gatilho já
  é "`sprites[chave]` ausente?" (§3.5), ele funciona sem uma linha de regra nova.
- A v1 fica **no lugar**, sob a chave antiga: não há campo de arquivo, não há
  cópia, não há segunda fonte do mesmo dado.

**`saveSize.test.ts`**: o acervo passa de 11 para até 22 entradas de URL
(~140 B cada) ⇒ **+1,5 KB**. O fixture sintético ganha as duas eras.

⚠️ **Consequência a declarar (não escolher)**: o servidor conta
`perFormLifetime` pelo `formId` que o cliente manda. Com a chave de era, a v2
chega como **forma nova** ⇒ 3 tentativas frescas. Isso é coerente (é outra
imagem), mas é gasto — e reforça a pendência de §8.2.

### 9.3 Quando não existe a v1 daquela forma

O jogador sobe um galho por vez: quem nunca desbloqueou `champion-vaccine` não
tem v1 dele. Regra, pura, dono `spriteLibrary.ts`:

```
referenceFormFor(formId, lib):
  1. v1 da MESMA forma (era anterior)            → usa
  2. senão, ancestral na MESMA linha, subindo por `getPreviousForm`
     (dono: dailyReset.ts — chamar, nunca copiar)  → usa o 1º que existir
  3. senão, nenhuma referência (só prompt)
```

**Nunca** a v1 de um galho irmão: importaria a silhueta errada e faria
`champion-vaccine` nascer com a cara do `champion-virus` — semelhança falsa é
pior que semelhança ausente. Como todo renascido passou pelo rookie, o passo 2
quase sempre resolve.

**Régua**: `referenciaRenascimento.test.ts` — (a) forma com v1 ⇒ ela mesma;
(b) forma sem v1 ⇒ ancestral existente; (c) galho irmão **nunca** é escolhido;
(d) acervo vazio ⇒ `[]` e a geração segue sem referência.

### 9.4 Fallback de provedor: a referência é CONDIÇÃO (decisão do dono #75)

`generateWithProviders` tenta Higgsfield (aceita imagem) e cai para Gemini
(**texto puro** — `generateGemini(env, prompt)` ignora a referência).

**Decisão do dono, 22/09/2026 (#75): a referência é condição, não preferência.**
Quando o lote é do renascido E existe uma referência a enviar, a geração **não
cai para o Gemini** — ela espera o provedor que aceita imagem.

Esta spec recomendava o contrário (best-effort), pelo Invariante nº 1: uma forma
sem sprite no dia da evolução seria pior que uma forma com parecença menor. O
dono decidiu ao contrário, e a razão é de produto: a continuidade visual entre
as duas vidas É a recompensa do Renascimento — uma v2 que não lembra a v1 não
entrega o que a cerimônia prometeu. Fica registrado que o Invariante nº 1 cede
aqui, **e só aqui**: no lote do renascido com referência disponível.

O que muda:

- **`referenceRequired`** entra no corpo do pedido quando há referência. O
  servidor, ao recebê-lo, não chama `generateGemini`: devolve o **202 que já
  existe** (`{ pending: true, retryAfter }`), que o cliente já sabe tratar como
  "fica na reserva, card `GERANDO`, repergunta". **Não é caminho de erro novo** —
  é o caminho de espera que o contrato da rota já tem.
- **O jogador nunca fica sem nada na tela**: a forma mostra a **arte de reserva**
  enquanto espera, exatamente como já faz hoje entre a evolução e a chegada do
  sprite. O que a condição muda é o que ele recebe no fim, não se vê algo agora.
- `SpriteEntry` ganha `referenced?: boolean` (booleano ou `undefined` na
  hidratação). Com a condição valendo, ele é `true` sempre que há referência —
  então a linha discreta do cartão (PT "ecoa a forma anterior" / EN "echoes its
  former shape") passa a ser a regra, não a exceção.
- **Sem toast de erro e sem contagem regressiva.** A espera é silenciosa, e o
  botão manual que já existe (`SPRITE_MANUAL_RETRY_CAP` 3, cooldown 60 s)
  continua sendo a saída.

⚠️ **O risco que a decisão aceita, escrito para quem vier depois**: se o
Higgsfield ficar fora por muito tempo, a segunda vida fica em arte de reserva
indefinidamente. Não há prazo e não há degradação automática para o Gemini — foi
isso que se decidiu. Se um dia isso doer, a alavanca é um teto de espera
**declarado ao jogador**, nunca uma queda silenciosa para texto puro.

---

## 10. A tela da alocação (condições bloqueantes de R-A e do parecer de psicologia)

### 10.1 Prévia da cascata — obrigatória, e o que FALTA é a parte importante

`cascataDosPares` é pura e determinística: a prévia é calculável a custo zero, a
cada movimento da barra, **antes** do commit. A tela mostra:

1. o que a alocação atual **destrava** agora;
2. **o que ela deixa a N pontos de destravar** — "faltam N pontos em Fogo para
   Vapor começar a despertar". Os números saem das CONSTANTES
   (`CUSTO_PONTO_PAR`, o limiar de passivos da cascata), **nunca** escritos à
   mão (a regra do `CLAUDE.md` sobre o guia vale igual aqui);
3. que a alocação pode ser refeita à vontade **até o gesto de evoluir**, e que
   depois dele é permanente.

Sem (2) a mecânica falha na pergunta do "homem atrás da cortina" do jeito mais
caro: oculta **e** permanente.

### 10.2 Piso de não-desastre

**Nenhuma alocação legal pode produzir ficha funcionalmente pior que a
distribuição automática do oráculo.** Escolher diferente, sim; escolher
quebrado, não. Dois mecanismos, e eles bastam:

- a fatia manual é **aditiva** (§1.2): ela nunca remove pontos que o oráculo
  distribuiu — 75% do orçamento segue pela leitura;
- a cascata roda sobre o **combinado**, então uma alocação "errada" no máximo
  deixa de destravar um par — nunca destrava menos do que a automática
  destravaria... **e isso precisa de teste**, não de argumento: `T-PISO` —
  para 120 perfis × 3 planos adversários, `custoElementos` igual, e o número de
  pares destravados **≥ o da ficha sem plano** em ≥ 95% dos casos; nos casos
  restantes a tela **nomeia o fato em palavra** antes do commit (R-A(c)), sem
  impedir a escolha.

### 10.3 `hideMetrics` — modo qualitativo, nunca ausência da tela (R-E)

Com `hideMetrics` ligado, a tela **existe inteira** e continua com os mesmos
graus de liberdade. O que muda:

- barra **sem rótulo numérico**; ênfase **relativa** entre elementos, em
  linguagem de mundo ("Fogo pesa mais que Água nesta forma");
- a prévia da cascata vira palavra: "Vapor ainda não desperta" / "Vapor está
  perto"; nada de "faltam N";
- nenhum número da alocação aparece na Home nem em push;
- a alocação **nunca** vai ao widget nem ao `publicProfile`.

**Régua**: render test com `hideMetrics` ligado e desligado — mesma quantidade
de controles, zero dígito no modo ligado.

### 10.4 Onde a tela mora, e onde NÃO mora

- **Não abre na cerimônia de evolução** (D-G10). A cerimônia deixa um
  **marcador calmo e persistente** na página de Evolução — o mesmo lugar onde o
  cadeado e a escada já vivem.
- A entrada é a página de Evolução, e só existe com registro `rebirth`.

### 10.5 Os três primeiros estágios ENSINAM (condição do parecer)

`ELEMENT_ORCAMENTO_BY_STAGE` = 30/60/120/300/500: rookie+champion+ultimate
somam **21%** do total. Os erros baratos vêm primeiro e as decisões caras
depois de quatro ensaios — o sistema ensina antes de cobrar, e isso é sorte de
desenho que precisa ficar **dita**. Condição: em rookie e champion a tela diz,
em texto, que **estes pontos alargam as bases** e que **os pares vêm depois**.
Sem isso o jogador conclui que o sistema é decorativo e para de olhar
exatamente nos estágios em que aprender é barato.

### 10.6 Vocabulário (D-G12)

É **assinatura**, não otimização. Vetados em PT/EN: "distribua seus pontos",
"build", "otimizar", "mais forte", "melhor", "poder". A palavra é *escolher a
essência*. **O pet nunca comenta a alocação avaliativamente** — ele reage à
essência ("sinto o calor crescendo"), jamais à qualidade da decisão. A régua é
`src/narrativa.contract.test.ts` (as doze leis + vocabulário vetado).

---

## 11. `rebirth` vira CHAVE DE MODO — e a alocação tem campo próprio (R-H)

Três aceites, os três verificáveis:

- **(a)** comentário-lápide em `src/utils/rebirth.ts` dizendo que o registro
  deixou de ser só histórico: apagá-lo **rebaixa o pet, apaga um modo pago e é
  irreversível**. Hoje o motivo escrito é "impedir a segunda vez", e um agente
  futuro lê isso como "histórico descartável".
- **(b)** **teste de contrato** provando que nenhum caminho remove ou
  sobrescreve `rebirth`: load da nuvem, `normalize*`/higienização do
  `GameStateContext`, migração de chaves, `applyFreshStart`, `applyRebirth`
  chamado 2×.
- **(c)** a alocação **não é lida de `rebirth`**: `elementAllocation` existe por
  si. Dois fatos, dois campos — sobrecarregar um campo com dois significados é o
  footgun 9 na forma mais cara, porque aqui o dano é apagar conteúdo pago sem
  nada ficar vermelho.

---

## 12. Réguas — arquivo por arquivo

| arquivo | novo/alterado | o que trava |
|---|---|---|
| `src/utils/soulProfile/ficha/buildSheet.aloc.test.ts` | **novo** | T-SOMA (`custoElementos === orcamento`) em 5 estágios × 3 planos × com/sem boost; T-LEGAL (plano nunca toca par); plano ausente ⇒ saída idêntica à de hoje |
| `src/utils/soulProfile/pipeline.test.ts` | alterado | 5ª simulação: 120 perfis × 3 planos adversários; profissão estável; cobertura 17/65/11/32 mantida |
| `src/contexts/GameStateContext.hydrate.fuzz.test.tsx` | alterado | `elementAllocation` lixo (array, `v:2`, elemento inventado, peso `NaN`/negativo/1e9) ⇒ `undefined` ou saneado; `spriteLibrary.era` lixo ⇒ 0 |
| `src/utils/saveSize.test.ts` | alterado | fixture com `elementAllocation` cheio + acervo de 2 eras; folga contra 5 MB |
| `src/components/soulmonSkills.cacheComChave.test.ts` | **novo** | recomputa quando `soulmonSheetKey` muda; não grava quando igual; aparelho sem perfil mostra o cache |
| `src/components/soulmonStagesParcial.contract.test.ts` | **novo** | array de 2 entradas atravessa `getStageNameById`, `StatsPage`, `EvolutionPath`, `PetPage` sem lançar |
| `src/components/filaDeAvisos.contract.test.ts` | alterado | `key: 'incubacao'` na posição declarada; condição aparece 1× |
| `src/components/evolucaoManual.contract.test.ts` | alterado | "a incubação não evolui" |
| `src/utils/spriteTrigger.test.ts` | alterado | `incubationFor` idempotente; degeneração limpa a incubação e **não toca** `locked` (R-G); `faltam===1` continua ocasião B |
| `src/utils/spriteLibrary.era.test.ts` | **novo** | `acervoKey(f,0)===f` (sem migração); v2 não sobrescreve v1; `hasSprite`/`isFormCapped` por chave de era |
| `src/utils/referenciaRenascimento.test.ts` | **novo** | §9.3 (a)–(d) |
| `src/utils/alocacaoForaDoPvP.contract.test.ts` | **novo** | **R-ALOC**: `functions/api/community.js`, `src/utils/dungeon.ts`, o bridge do widget e `publicProfile` sem `soulmonSkills`/`elementos`/`elementAllocation`/`impactoTotal` |
| `src/utils/arena.test.ts` | alterado | **R-B(ii)**: a simulação de balance roda também com fichas **alocadas adversarialmente** (17 alocações extremas) mantendo 40–80% e spread ≤ 20pp |
| `src/utils/arena.alocacao.test.ts` | **novo** | **R-B(i)/(iii)**: mudar só a alocação não muda `getArenaPlayerStats`; `STAGE_BUDGET`/`ROLE_SHAPE`/`SPECIAL_EFFECTS`/`realSkillPower` intocados |
| `src/utils/soulProfile/ficha/buildSheet.piso.test.ts` | **novo** | **T-PISO** (§10.2): 120 perfis × 3 planos, pares destravados ≥ os da ficha sem plano em ≥95% |
| `src/utils/rebirth.chaveDeModo.contract.test.ts` | **novo** | **R-H(b)**: nenhum caminho apaga/sobrescreve `rebirth` (nuvem, higienização, migração, `applyFreshStart`, 2ª chamada) |
| `src/components/AlocacaoPage.render.test.tsx` | **novo** | prévia da cascata com o "faltam N" vindo das constantes; `hideMetrics` ligado ⇒ zero dígito e os mesmos controles; sem `rebirth` a tela não existe; estágio em `locked` não aceita edição |
| `src/utils/spriteTrigger.semPrazo.contract.test.ts` | **novo** | **D-G8 + D-G8b**: a ÚNICA aritmética de data permitida sobre `incubation.since` é `agora − since ≥ INCUBATION_MIN_MS` (só libera), nomeada no teste; nenhuma outra, e nenhuma que produza perda; `INCUBATION_MIN_MS` tem dono único e não é reescrito em outro arquivo; quem escreve `locked` é só o updater que grava `incubation` (D-G9 revisto) |
| `src/utils/spriteTrigger.esperaMinima.test.ts` | **novo** | **D-G8b**: antes de 30 min a evolução não libera; depois libera e **continua liberada** indefinidamente (o caso que separa piso de prazo); a alocação está `locked` já na ENTRADA da incubação, não no gesto |
| `src/narrativa.contract.test.ts` | alterado | vocabulário PT/EN novo (incubação, eco da forma anterior) passa nas doze leis |

---

## 13. Fatiamento — ordem de construção

Cada pacote é mergeável sozinho, e nenhum é visível ao jogador antes do WP4.28.

| WP | O quê | Critério de aceite EXECUTÁVEL |
|---|---|---|
| **WP4.22** | `allocateElementos` aceita plano (carve-out, `ALLOC_FRACTION`); sem plano = comportamento idêntico | `npx vitest run src/utils/soulProfile/ficha/buildSheet.aloc` verde **e** `npx vitest run src/utils/soulProfile/pipeline` verde sem mudar fixture |
| **WP4.22b** | **R-B, e é BLOQUEANTE de tudo o que é visível**: aceites (i)–(iv), simulação de arena com alocação adversarial | `arena.alocacao` + `arena` verdes (40–80%, spread ≤20pp). **Se (ii) reprovar**, para tudo e leva a §3 ao dono |
| **WP4.23** | Simulação de equilíbrio com planos adversários; `ALLOC_FRACTION` confirmada ou corrigida **com a medição escrita no ledger**; **T-PISO** | 5ª simulação do `pipeline.test.ts` passa; profissão estável em 120/120; `buildSheet.piso` verde |
| **WP4.24** | `elementAllocation` + `soulmonSheetKey` no save: tipos, hidratação defensiva, tamanho. **Nenhuma UI.** | `npx vitest run src/contexts/GameStateContext.hydrate.fuzz` + `src/utils/saveSize` verdes |
| **WP4.25** | `buildFichaESkills`/`PetPage` passam o plano; cache com chave | `soulmonSkills.cacheComChave` verde; recomputar 2× não grava 2× (assert de identidade de referência) |
| **WP4.26** | Era no acervo: `acervoKey`, `SpriteLibrary.era`, `applyRebirth` incrementa; gatilho e caps por chave de era | `spriteLibrary.era` verde; `acervoKey(f,0)===f` para todas as 11 formas (sem migração) |
| **WP4.27** | `referenceFormFor` + fiação de `referenceImageUrls` no lote do renascido; `referenced` no `SpriteEntry` | `referenciaRenascimento` verde; grep: `referenceImageUrls` aparece no chamador do lote (não só no tipo) |
| **WP4.28** | `soulmonStages` tardio: `rebirthCreature` (com salt), escrita por estágio, consumidores tolerando array curto | `soulmonStagesParcial` verde + screenshot Playwright da página de Evolução com árvore de 2 entradas |
| **WP4.29** | Incubação com **espera mínima de 30 min e sem prazo de perda**: `incubationFor`, `INCUBATION_MIN_MS`, estado no save, idempotência, limpeza na degeneração; `locked` escrito no updater que grava `incubation` (D-G9 revisto) | `spriteTrigger` + `spriteTrigger.semPrazo` + `spriteTrigger.esperaMinima` + `evolucaoManual` verdes |
| **WP4.30** | Incubação visível: aviso **descritivo** na fila da Home, posição declarada, PT/EN | `filaDeAvisos` + `narrativa.contract` verdes + screenshot do aviso |
| ~~WP4.30b~~ | ⚰️ **CORTADO pela decisão #76 do dono (22/09/2026)**: não existe push de incubação, nem o convite neutro. Só o aviso na Home. Não reabrir como novidade — a alternativa perdeu com a medição na mão. | — |
| **WP4.33** | **Decisão #78**: o elemento alocado troca a ARTE do golpe, sem tocar em um ponto de dano. Usa `attackFxArt.ts` e as 1.078 peças de `fx-ataque/` (154 elementos × 6 estados), das quais só `aura` é chamada hoje pela D9. Escopo: **só o pet renascido** — a D9 continua valendo para todo o resto | `attackFxArt` verde + teste novo provando que trocar o elemento alocado muda a peça e **não** muda `getArenaPlayerStats` nem `playerHitDamage` |
| **WP4.31** | Tela de alocação: barras por base, prévia da cascata com o "faltam N", `hideMetrics` qualitativo, textos de ensino em rookie/champion, marcador na página de Evolução | `AlocacaoPage.render` + `alocacaoForaDoPvP` + `narrativa.contract` verdes + screenshot Playwright nos dois modos de `hideMetrics` |
| **WP4.32** | **R-H**: lápide no `rebirth.ts` + contrato de que ninguém apaga o registro | `rebirth.chaveDeModo.contract` verde |

**Ordem inegociável**: WP4.22b (R-B) antes de qualquer pacote visível — enquanto
ele não estiver verde, a alocação não pode aparecer na tela e a frase C-S1 não
pode ser escrita.

**Fora de escopo, e é do dono:** elevar `perAccountLifetime` para conta com
`rebirth` (§8.2). Enquanto não decidir, WP4.26/4.27 mergeiam e a segunda vida
pode terminar em arte de reserva — que é degradação declarada, não defeito.
