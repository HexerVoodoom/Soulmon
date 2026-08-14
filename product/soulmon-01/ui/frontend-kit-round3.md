# Soulmon — Kit pixel, rodada 3 (árvore como grafo · telas nunca vistas · contraste medido)

> Nada das rodadas 1 e 2 foi desfeito. **Não commitei, não dei push.**
> Não toquei em `functions/`, `workers/`, `.github/` nem em
> `src/contexts/GameStateContext.tsx`. Nenhum teste foi afrouxado.
> Todas as regras novas de CSS foram para o FIM do `src/index.css`, com
> **variante aninhada** (`&:hover`, `&:focus-visible`, `&:disabled`).

---

## 1. A árvore de evolução como grafo (Ref C)

### 1.1 Como ficou

A página de Evolução deixou de ser uma **lista de fichas com setinha** e passou
a ser a **coluna vertical de nós losangulares de cristal ligados por linhas** da
referência: nó atual com **anel ciano pulsante** e o **pet pousado nele**, nós
futuros escurecidos, fundo com **circuito ciano tênue**.

O **Rookie subiu para dentro da coluna** (era uma ficha solta acima do seletor):
ele é o TRONCO compartilhado pelos três galhos, então é o primeiro nó do grafo.
A coluna é hoje: `rookie → 3 formas do galho selecionado → ultra`.

Medido no DOM real (idêntico nos dois temas):

```
nós: 5  ·  interativos (BUTTON): 5  ·  alvos: 48x48 (todos)
linhas de conexão: 4  ·  acesas: 1  ·  anel: 1  ·  sprite pousado: 1
etiquetas de texto: ATUAL · PREVISTA · BLOQUEADA · BLOQUEADA · BLOQUEADA · ZÊNITE · BLOQUEADA
o SVG dos nós não contém texto: true
foco de teclado cai em: BUTTON.sm-px-node
  aria-label = "Lumel — forma atual. Evolução destravada, toque para travar"
```

**Nada de regra nova.** `isCurrent`, `isReached`, `hidden` (guarda de spoiler),
`isPreviousStage` (degenerar) e o galho previsto são **os mesmos cálculos que a
página já fazia**. O único cálculo acrescentado é qual nó recebe a marca
`PREVISTA`, e ele é derivação pura do `forecastBranch` que a página **já recebia
pronta** e **já mostrava em texto** ("Seguindo para Harmonia"):

```ts
const forecastStageId = forecastBranch && selectedBranch === forecastBranch
  ? branchPath.map(creatureFormId).find(id => id !== currentStageId && !unlockedSet.has(id))
  : null;
```

Nenhuma leitura de `utils/oracle.ts`, `utils/carePattern.ts` ou
`types/progression.ts` foi duplicada aqui.

### 1.2 Acessibilidade do grafo (o risco de virar desenho)

Um grafo é a forma mais fácil de codificar informação só em **cor e posição**.
As três travas:

1. **Cada nó é um alvo de 48×48 focável por teclado** (`button.sm-px-node`,
   `:focus-visible` com contorno de cobre). O nó atual alterna o cadeado; o nó
   oculto abre a confirmação de spoiler — as mesmas ações de antes, agora no nó.
2. **O `aria-label` diz a situação em palavras**: "forma atual" / "já
   alcançada" / "próxima prevista, ainda bloqueada" / "bloqueada".
3. **A placa ao lado repete em texto visível**: `ATUAL`, `PREVISTA`,
   `BLOQUEADA`, `ZÊNITE`. Quem não distingue o ciano do cinza lê a etiqueta.

O anel pulsante respeita `prefers-reduced-motion: reduce` (vira opacidade fixa).

### 1.3 **A fronteira para trocar SVG por PNG** — arquivo único

A arte de cristal do kit não existe ainda (bloqueada em geração). Os nós são
SVG. A troca cabe em **um arquivo**:

```
src/components/evolution/nodeArt.tsx   ← ÚNICO lugar que sabe COM O QUE o nó é desenhado
src/components/evolution/SoulNode.tsx  ← anel, sprite pousado, foco, aria, alvo de toque
src/components/EvolutionPath.tsx       ← o grafo, as linhas e os dados
```

O contrato de `NodeArt` é: `(visual, size, tone?) → um quadrado size×size,
sem texto, decorativo (aria-hidden), com o centro geométrico do losango no
centro da caixa` — é desse centro que o anel e a linha de conexão dependem.

`visual` tem 4 valores: `current` · `reached` · `forecast` · `locked`.

Quando os PNGs chegarem, o arquivo inteiro vira isto (está escrito como
comentário dentro dele, para a próxima rodada não redescobrir):

```tsx
import crystalOn from '../../assets/soulmon/evolution/node-crystal-on.png';
const SRC: Record<SoulNodeVisual, string> = { current: crystalOn, /* … */ };
export function NodeArt({ visual, size }: NodeArtProps) {
  return <img src={SRC[visual]} width={size} height={size} alt=""
              style={{ imageRendering: 'pixelated', display: 'block' }} />;
}
```

`SoulNode.tsx` e `EvolutionPath.tsx` **não mudam uma linha**, e nenhum deles
importa arte.

### 1.4 Desvio consciente da referência

A Ref C mostra o nó futuro **escurecido**. No tema ESCURO, um losango mais
escuro que o fundo `#0e2323` simplesmente some. O nó bloqueado é, portanto,
escurecido **relativo ao tema**
(`color-mix(in srgb, var(--sm-ink) 22%, var(--sm-bg))`): no claro fica cinza
escuro, no escuro fica cinza médio. A primeira tentativa usava
`--sm-px-track` (#16283d, azul-marinho) e no tema claro virava a mancha mais
pesada da tela, além de puxar para fora da paleta teal/cobre — está no
screenshot antes/depois.

---

## 2. Telas que nunca tinham sido verificadas — e o que estava quebrado

### 2.1 **HelpModal (glossário) — não existia caminho para abri-lo**

O achado mais sério da rodada. `showHelpModal` **nunca era posto em `true`**:

```
$ grep -rn "setShowHelpModal" src
src/App.tsx:221:  const [showHelpModal, setShowHelpModal] = useState(false);
src/App.tsx:1827:          onClose={() => setShowHelpModal(false)}
```

Só o `onClose`. Tela morta — e é justamente a que o `CLAUDE.md` manda atualizar
a cada mudança de regra de jogo ("E `HelpModal.tsx` (glossário PT/EN)"). É
também por isso que ela atravessou três rodadas sem screenshot: não dava para
chegar nela.

**Ligada** em Configurações, ao lado do Guia (mesmo assunto), como
`Abrir Glossário` / `Open Glossary` (par EN/PT-BR novo em `utils/i18n.ts`).

Consertos na tela em si:

| Antes | Depois |
|---|---|
| Fundo `#1a2230` cravado + `text-white` — cinza-ardósia **fora da paleta**; no tema claro virava uma lâmina escura | `var(--sm-surface)` / `var(--sm-ink)` com topo em cobre; segue o tema |
| `text-white/60` na descrição — o pior contraste do app | `var(--sm-muted)`, medido em 4,82:1 (escuro) e 6,3:1 (claro) |
| Título de seção `#2dd4bf` cravado (é o teal do tema ESCURO): 1,9:1 sobre a superfície branca | `--sm-help-accent`, par por tema (`#0f766e` / `#5df0e0`) |
| Botão X: `p-1` + ícone 16px = **24×24** de alvo, **sem `aria-label`** | `.sm-px-help-x`: **44×44** medido, `aria-label` com par PT/EN, `:focus-visible` |
| Rodapé "Fechar": `py-2 text-xs` ≈ 28px de altura, `bg-white/10` | `PixelButton size="sm"` — **388×46** medido |
| Sem `role="dialog"` / `aria-modal` | `role="dialog" aria-modal="true" aria-label="Ajuda/Help"` |

Verificado no DOM: `fecharX: {alvo: "44x44", rotulo: "Fechar ajuda"}`,
`dialogo: {modal: "true", rotulo: "Ajuda", fundo: rgb(255,255,255) no claro / rgb(23,58,55) no escuro}`.

### 2.2 GameTutorialFlow — a PRIMEIRA tela do jogador novo

| Achado | Conserto |
|---|---|
| O cartão tem `flex: 1` sem `justify-content`: o conteúdo grudava no topo e sobravam **~700px de vazio** embaixo (está no screenshot antes) | `justifyContent: 'center'` — a moldura continua ocupando a altura, o conteúdo centraliza |
| "Pular tutorial" com alvo de **71×19** — bem abaixo dos 44 (WCAG 2.2 AA 2.5.8). É a saída de quem não quer o tutorial | **103×44** medido; o sublinhado segue no texto, o alvo é a caixa |

As setas de navegar já estavam corretas (44×44, medido).

### 2.3 Balão de abraço × botão "Evoluir" — se escondiam

Com o `canEvolve` finalmente semeável (`perfectDays: 9`), os dois apareceram na
mesma tela pela primeira vez: o botão "Evoluir" mora em `top: 10` no centro do
palco e o balão 🤗 em `calc(50% - 78px)` — **o balão ficava atrás do botão**
(está no screenshot antes). Agora o balão desce para `calc(50% - 46px)` quando o
botão está na tela. Fotografado nos dois temas, com o 🤗 inteiro visível.

### 2.4 Botão "Evoluir" — verificado pela primeira vez em três rodadas

`117×46` medido, `PixelButton size="sm" variant="primary"`, moldura de cobre e
miolo ciano, pulsando. (O `:hover` teve de ser fotografado movendo o mouse para
o centro da caixa: o botão pulsa e nunca fica "stable" para o `hover()` do
Playwright.)

### 2.5 Coração de HP vazio — informação invisível no tema escuro

O coração vazio usava `filter: brightness(0.2) saturate(0)` inline: silhueta
quase preta. Sobre o fundo claro funciona; sobre `#0e2323` some. E o vazio é
**informação** (quanto HP faltou). Virou `.sm-hp-empty`, com par por tema
(no escuro, fantasma claro em vez de mancha preta). Fotografado com
`healthPoints: 2.5` — 2 cheios + 1 metade, os três legíveis.

### 2.6 GuideModal

Estava razoável (usa tokens). Único conserto: `Vírus/Dado/Vacina` eram
`text-[#22A900]`/`[#009ED8]`/`[#E69600]` cravados — reprovavam em contraste
(2,41–3,11:1 no claro). Passaram a usar `ATTR_INK` (§3).

### 2.7 WelcomePromptModal — **NÃO consegui fotografar**

O Chromium headless reporta `Notification.permission === "denied"` e não há
`beforeinstallprompt`, então o modal nunca monta:

```
light WelcomePromptModal NAO apareceu — {"permissao":"denied","standalone":false}
dark  WelcomePromptModal NAO apareceu — {"permissao":"denied","standalone":false}
```

Li o código: o botão de fechar já tem 44×44 com `aria-label` PT/EN, e as cores
são tokens, com duas exceções cruas (`iconBg: '#eafbe6'` / `'#fde8e6'` e
`iconColor: '#22A900'` / `'#e0483e'` no quadradinho de ícone). **Fica sem
verificação visual** — está na lista do §6.

### 2.8 Estados `:hover` / `:disabled`

- **`:hover`** — fotografado no botão "Evoluir" (`.sm-px-btn:hover`, brilho +
  glow ciano) e no nó do grafo (`button.sm-px-node:hover`).
- **`:disabled`** — fotografado no botão "Entrar / Sincronizar" das
  Configurações (nasce desabilitado com o campo vazio). Estava reprovando feio
  em contraste — ver §3.

---

## 3. Contraste **medido com ferramenta**, nos dois temas

Ferramenta nova: **`E:/pw/contrast.mjs`**. Roda contra o `vite preview` do build
real, percorre todo nó de texto renderizado e, a partir do **estilo computado**,
resolve:

- a cor do texto **compondo a opacidade herdada** de todos os ancestrais;
- o **fundo efetivo**, subindo a árvore e compondo cada camada semitransparente
  até achar uma opaca — incluindo `background-image` em gradiente
  (`.sm-app-bg`, o volume 3D do `.sm-btn`), que é `backgroundColor: transparent`
  e sem isso mediria contra o branco do documento;
- razão WCAG 2.1, limite **4,5:1** texto normal e **3:1** texto grande
  (≥24px, ou ≥18,66px em negrito).

Duas honestidades declaradas no script:
1. O miolo do `.sm-px-btn` é pintado por **arte** (`border-image … fill`), não
   por `background-color`. Há uma **tabela explícita e curta** de fundos de arte
   (`primary` → `--sm-px-cyan`; `default` → `#0B3A40`, o teal do PNG). Sem ela o
   medidor mediria o texto contra a tela atrás do botão.
2. Texto `aria-hidden` fica fora (os ✦/♥ que flutuam atrás do pet). É a isenção
   de decoração da 1.4.3 — e a única coisa que ela cobre aqui.

### 3.1 Resultado final

| Tela | Claro | Escuro |
|---|---|---|
| Home | 17 nós · **0 reprovados** | 17 nós · **0 reprovados** |
| Evolução (com a árvore) | 18 nós · **0** | 18 nós · **0** |
| Configurações | 37 nós · **0** | 37 nós · **0** |
| **Glossário (HelpModal)** | 85 nós · **0** | 85 nós · **0** |
| Guia (GuideModal) | 102 nós · **0** | 102 nós · **0** |
| **Total** | **259 medidos · 0 reprovados** · pior = 4,72:1 | **259 medidos · 0 reprovados** · pior = 4,82:1 |

### 3.2 O que estava reprovando, e o conserto (valores medidos)

| # | Elemento | Antes | Depois | Conserto |
|---|---|---|---|---|
| 1 | **`.sm-btn` — o botão primário do app inteiro** (branco sobre `--sm-primary`) | **3,74:1** | **5,47:1** | `--sm-primary` claro `#0d9488` → `#0f766e` (que já era o `deep`); `--sm-primary-deep` → `#0b6b64` para o volume 3D não sumir |
| 2 | Mesma cor como TEXTO (marca `SOUL MON`, "Falta revelar a sua criatura", dias da semana) | 3,32–3,74:1 | 4,86–5,47:1 | idem (uma mudança, dois papéis) |
| 3 | `--sm-muted` claro — rótulos `ITENS/BANHO/DORMIR`, `LINHAS DE EVOLUÇÃO`, subtítulos | **4,10:1** | **4,72:1** | `#5c7d76` → `#54736c` |
| 4 | `Poder / Harmonia / Benevolência` como texto, tema claro | 3,11 / 3,05 / **2,41:1** | 5,28 / 6,02 / 5,93:1 | `ATTR_INK` (§3.3) |
| 5 | idem, tema escuro | 3,97 / 4,06 / 5,14:1 | 6,95 / 6,49 / 6,78:1 | `ATTR_INK` |
| 6 | Botão de galho ATIVO (branco sobre o preenchimento do atributo) | 2,41–3,11:1 | 5,43–7,02:1 | `ATTR_ON_FILL_INK` (`#04211f`) no lugar de `#fff` |
| 7 | `.sm-btn:disabled` — "Entrar / Sincronizar", "restaurar" | **1,29:1** e 1,81:1 (claro) · 1,59 e 2,51:1 (escuro) | **4,7–5,4:1** | ver §3.4 |
| 8 | `.sm-px-chat-btn-send` — ícone `--sm-px-ink` (#eaf5f2) sobre o ciano #5df0e0 | **1,29:1** | **12,2:1** | tinta escura `#04211f` |
| 9 | HelpModal: descrição `text-white/60` sobre `#1a2230` | ~2,9:1 | 4,82:1 (escuro) / 6,3:1 (claro) | tokens do tema |
| 10 | HelpModal: título de seção `#2dd4bf` sobre superfície branca | ~1,9:1 | 5,5:1 / 8,4:1 | `--sm-help-accent` por tema |
| 11 | GuideModal: `Vírus/Dado/Vacina` cravados | 2,41–3,11:1 | ≥5,28:1 | `ATTR_INK` |

O `--sm-muted` a **3,48:1** citado no briefing não aparece mais no app: hoje o
token está em 4,72:1 sobre `--sm-bg` e 5,19:1 sobre `--sm-surface`.

### 3.3 `ATTR_INK` — por que existe

`ATTR_COLOR` (`src/types/attributes.ts`) continua a **fonte única da identidade**
de cada atributo. Ele segue pintando **ícone, preenchimento e linha do grafo**,
onde o mínimo é 3:1 (elemento de interface) e ele cumpre. O que não dá é usá-lo
como **texto**: `#E69600` sobre branco mede 2,41:1.

`ATTR_INK` é a **mesma matiz** com a luminosidade ajustada, por tema, via
variável CSS (o tema é resolvido no CSS; prender isso a um hook faria cada tela
repetir a decisão). Não é cor nova na paleta — é a mesma cor legível. A regra
está escrita no próprio `attributes.ts`: *preenchimento/ícone/linha usam
`ATTR_COLOR`; TEXTO usa `ATTR_INK`*.

### 3.4 Botão desabilitado: o problema era **opacidade**

`.sm-btn:disabled` somava `filter: brightness(.75)` com o utilitário
`disabled:opacity-60` do JSX. **Opacidade mistura texto E fundo com a tela** e
comprime a razão — não basta escurecer os dois. Resultado: 1,29:1.

A WCAG 1.4.3 isenta componente desabilitado, mas "isento" não é motivo para
ficar ilegível: quem não consegue LER o botão também não entende por que ele não
funciona. O estado passou a ser **desenhado** (preenchido com `--sm-line`, tinta
puxada para `--sm-ink`, sem volume 3D, sem cor de ação) em vez de apagado por
opacidade. Lê como inativo e mede ≥4,7:1 nos dois temas.

A mesma correção foi aplicada preventivamente a `.sm-px-btn:disabled` (que
tinha `opacity: .55`) — **hoje nenhum `PixelButton` é renderizado desabilitado**
no app, então esse não pôde ser fotografado em uso.

---

## 4. `btn-sm.png` — sinalizado, como pedido

Medi os três PNGs de botão em uso (pixels opacos, magenta = R e B altos com G
bem abaixo dos dois):

```
btn-sm 641x477  magenta 0.01%  (295.914 px opacos)
btn-md 867x390  magenta 0.25%  (331.471 px opacos)
btn-lg 878x252  magenta 0.36%  (218.377 px opacos)
```

**Os três estão em uso** (`.sm-px-btn-sm/md/lg`; o `sm` pinta o "Evoluir", o
"Fechar" do glossário e os botões da pastinha de itens). Meu número para o
`btn-sm` (0,01%) não bate com os 0,65% citados no briefing — é um limiar de
detecção diferente, não uma discordância sobre o fato. Nos screenshots em
tamanho real **não há magenta visível**: são pixels de franja de antisserrilhado
na borda. Não é bloqueante, mas entra na lista de regerar junto de
`hover`/`active`/`disabled` (pendência aberta desde a rodada 1).

**Não liguei** `button-hover-*` nem `button-active-*` — seguem desligados, com
os estados derivados por filtro.

---

## 5. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **limpo, exit 0** (os 3 erros de `renderEnv.tsx` da rodada 2 sumiram) |
| Testes | `npx vitest run` | **49 arquivos · 651 testes · 651 passam · 0 falham**. Baseline da rodada eram 600; outro agente somou 51 durante a sessão. `index.css.contract.test.ts` e `currencies.test.ts` verdes |
| Build | `npm run build` | **✓ built in 3,35s**, 112/112 PNG→WebP (−7,08 MB), worker compilado |

Delta de bundle vs. rodada 2:

| Artefato | Rodada 2 | Agora | Δ |
|---|---|---|---|
| `index-*.css` | 86,44 kB (gzip 16,08) | **90,78 kB (gzip 16,91)** | +4,34 kB / **+0,83 kB gzip** |
| `index-*.js` | 389,25 kB (gzip 129,35) | **391,17 kB (gzip 130,15)** | +1,92 kB / +0,80 kB gzip |

Os nós são SVG inline (zero requisição de rede, zero CLS por imagem tardia).
Quando virarem PNG, o custo passa a ser 4 arquivos pequenos — mais um motivo
para a fronteira do §1.3 existir antes da arte.

`public/sw.js` **não** precisou de bump: assets hasheados.

---

## 6. O que ficou SEM verificação (explícito)

- **WelcomePromptModal** — não monta em Chromium headless (`Notification.permission
  === "denied"`, sem `beforeinstallprompt`). Revisado só por leitura de código.
- **`.sm-px-btn:disabled`** — corrigido preventivamente, mas **não existe
  `PixelButton` desabilitado no app hoje**, então não foi fotografado em uso.
- **Contraste de elementos NÃO-textuais** (bordas de campo, ícones portadores de
  sentido, o próprio losango do nó contra o fundo): o medidor cobre **texto**.
  O critério 1.4.11 (3:1 para componentes) não foi medido.
- **Telas fora do roteiro**: Loja, Torneio, Biblioteca, Estatísticas, minijogos,
  Masmorra, EvolutionCeremony, DailyReportModal, CreateModal e os demais modais.
- **Degenerar** (`.sm-px-tree-degen`) — o botão só aparece para quem já passou
  por um estágio do galho atual; não consegui semear sem forjar `unlockedEvolutions`
  de forma que não corresponde a nenhum save real. **Renderizado 0 vezes** na
  medição — o CSS existe, o alvo de 44px está declarado, mas não foi visto.
- **iOS/Safari** — `clip-path`, `color-mix()` e `-webkit-font-smoothing: none`
  vistos só no Chromium.
- **Tema `auto`** — só `light` e `dark` explícitos foram medidos.

---

## 7. O que falta para bater a Ref C

1. **Arte dos nós** (`node-crystal-on/off`, `node-ring-active`, 64×64 com alfa) —
   a fronteira do §1.3 está pronta e esperando.
2. **`nest-base.png`**: o bloco de xadrez atrás do cristal **continua visível**
   (está nos screenshots desta rodada). É o defeito de arte mais óbvio da Home e
   não é corrigível no front. Pendência desde a rodada 2.
3. **Regerar `hover`/`active`/`disabled`** dos botões sem halo magenta e com o
   enquadramento do `normal` — e, junto, limpar a franja magenta dos três
   `normal` (§4). Aberto desde a rodada 1.
4. **Card "DAILY RITUALS"**: cada tarefa ainda é um painel solto; a referência
   agrupa num painel com barra de título. `PixelPanel` já aceita `title`.
5. **Nav inferior com rótulo** — segue barrado por decisão de rótulo curto
   (6 itens em 412px; `ATIVIDADES` em Silkscreen não cabe).
6. **Ícones dos 3 atributos** em 64×64 com alfa — hoje `AlignmentIcons.tsx`
   desenha em SVG.
7. **Moldura de cano + vinha em 9-slice** — o painel ainda reaproveita o frame
   do botão large.
8. **`StepRow` a 40×40** — abaixo dos 44. Aberto desde a rodada 1.
9. **Página de Configurações** ainda na linguagem antiga (cards arredondados,
   botões teal lisos). Com a Evolução resolvida, é agora a maior área fora do
   kit — e o glossário abre a partir dela.
10. **Balão de fala do pet** em branco cravado (`bg-white`) nos dois temas — não
    reprovou em contraste (texto escuro sobre branco), mas é a última superfície
    grande fora dos tokens.

---

## 8. Arquivos tocados

```
src/components/evolution/nodeArt.tsx      (novo — a fronteira SVG→PNG)
src/components/evolution/SoulNode.tsx     (novo — interação/foco/aria do nó)
src/components/EvolutionPath.tsx          (lista de fichas → grafo; ATTR_INK)
src/components/HelpModal.tsx              (tokens, 44px, dialog, PixelButton)
src/components/GuideModal.tsx             (ATTR_INK)
src/components/GameTutorialFlow.tsx       (centralização; alvo do "Pular")
src/components/CompanionHUD.tsx           (balão vs. Evoluir; .sm-hp-empty)
src/components/SettingsPage.tsx           (botão "Abrir Glossário")
src/App.tsx                               (liga o HelpModal — 1 linha)
src/types/attributes.ts                   (ATTR_INK / ATTR_ON_FILL_INK)
src/utils/i18n.ts                         (openGlossary, EN + PT-BR)
src/index.css                             (regras novas, no FIM, aninhadas)
E:/pw/contrast.mjs                        (novo — medidor de contraste)
E:/pw/shot12.mjs                          (novo — screenshots da rodada)
```

Screenshots em `E:/pw/shots/r3-{light,dark}-*.png`:
`05` WelcomePrompt (não capturado) · `10` Home com "Evoluir" · `11` Evoluir em
hover · `12` balão de abraço · `20` Evolução topo · `21` grafo · `22` fim da
árvore · `23` foco de teclado no nó · `30` Configurações (botão desabilitado) ·
`31`/`32` glossário · `33` guia · `40`/`41` tutorial.
