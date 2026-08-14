# Soulmon — Kit pixel, rodada 2 (tipografia, ícones, FAB, barra de chat)

> Escopo: fechar os 3 primeiros itens do gap medido pelo orquestrador.
> Nada da rodada 1 nem do sweeper foi desfeito. **Não commitei, não dei push.**
> Nenhum teste foi afrouxado; `vitest.config.ts` e `*.test.*` não foram tocados
> (outro agente estava neles durante esta sessão — ver §6).

---

## 1. A fonte

### Escolha e licença

| Item | Valor |
|---|---|
| Fonte | **Silkscreen** (Jason Kottke) |
| Licença | **SIL Open Font License 1.1** — livre para uso comercial, inclusive embarcada em app pago |
| Origem | **npm: `@fontsource/silkscreen@5.3.0`** (campo `license: OFL-1.1` no próprio pacote). Não é download de site avulso; a licença viaja em `node_modules/@fontsource/silkscreen/LICENSE` e a origem fica rastreada no `package.json` |
| Formato | `woff2` (com `woff` de fallback emitido pelo pacote), `font-display: swap` |
| Subsets | **só `latin` 400 e 700**, importados em `src/main.tsx` |

Registrada em `docs/Attributions.md` (seção **Tipografia** nova).

### Cobertura de acento — conferida no arquivo, não no site da fonte

Escrevi um leitor de `cmap` (WOFF v1 = tabelas zlib, dá pra ler com o `zlib` do
node) e passei nos 4 arquivos do pacote antes de adotar:

```
silkscreen-latin-400-normal.woff      | glifos: 215 | faltando PT-BR: NENHUM
silkscreen-latin-700-normal.woff      | glifos: 215 | faltando PT-BR: NENHUM
silkscreen-latin-ext-400-normal.woff  | glifos:  18 | faltando: á à â ã é ê í ó ô õ ú ü ç À Ã É Ê … ç
silkscreen-latin-ext-700-normal.woff  | glifos:  18 | faltando: (idem)
```

Conjunto testado: `áàâãéêíóôõúüç ÁÀÂÃÉÊÍÓÔÕÚÜÇ º ª ° — … “ ”`. Todos presentes
no subset **latin**.

**Achado que muda a implementação:** o `latin-ext` da Silkscreen tem 18 glifos e
**nenhum acento do PT-BR** — os acentos estão todos no `latin` (U+0000–00FF).
Importar o `index.css` do pacote inteiro puxaria 6,8 kB de woff2 que o app nunca
usa. Por isso os imports são os dois arquivos de subset, com o motivo escrito no
`main.tsx`. (Se alguém trocar por Press Start 2P depois, **refaça a checagem**:
a divisão de subset é por fonte, não é regra do Fontsource.)

### Onde aplica e onde NÃO aplica

A fonte já existia **meia-ligada** no repo desde 12/ago: dois TTF em
`src/assets/fonts/` com `@font-face` no `index.css` e uso em **2 lugares**
(`DailyReportModal`, `IntroScreen`). O trabalho aqui foi (a) trocar o TTF pelo
subset woff2 do npm e (b) transformar 2 usos soltos em **hierarquia**.

**ENTRA** (`--sm-font-pixel` / `.sm-px-font` / `.sm-px-heading`):
marca `SOUL MON` · rótulo e valor das cápsulas de HUD (`ENERGIA 0/4`,
`CRÉDITOS 40`) · texto dos botões do kit · título de painel · rótulos das ações
de cuidado (`ITENS` / `BANHO` / `DORMIR`) · título e rótulo de seção da página
de Atividades.

**NÃO ENTRA** — e isto é a decisão, não uma pendência:
nome de tarefa/atividade · falas do pet · guia · glossário · relatório diário ·
qualquer parágrafo. Bitmap de 8px em caixa alta destrói leitura corrida, e em
português é pior: `ã õ ê` empilham acima da caixa maiúscula e a palavra some.
O **campo de digitação do chat** também ficou de fora de propósito — é onde se
escreve frase livre com acento.

Medido no DOM real (§5): `.sm-px-chip-value` → `Silkscreen`;
`.sm-px-panel p/h3` (nome de tarefa) → `ui-sans-serif`; os 32 parágrafos do
**Guia em PT-BR** → `ui-sans-serif`, único valor no conjunto.

**Dois ajustes que só apareceram com a fonte no lugar** (e que são o motivo de
"trocar a fonte" não ser um `font-family` e pronto):

1. Silkscreen é **bem mais larga** que a sans no mesmo `font-size`. A 14px a
   marca saía cortada em `SOUL MO`, invadindo a cápsula de Energia. Foi para
   11px + `minWidth: 0` no container flex. Mesma razão para o título da página
   de Atividades ter caído de 1.15rem para 0.95rem.
2. `line-height` folgado (1.4–1.5) em tudo que é bitmap: com 1.1, o `ç` de
   `CRÉDITOS` e o `ã` encostavam na linha de cima.

---

## 2. Ícones do kit no lugar dos emoji

`📚 🧘 📖 💧` nas fichas viraram os ícones de categoria do kit
(`src/assets/soulmon/icons/categories/icon-cat-*.png`, 8 arquivos que estavam
gerados e soltos). Ligados em **TaskCard** e **ActivityCard**.

- Ponto único: `categoryIconImg(category?)` em `src/types/category-icons.ts`.
  Ela **normaliza a caixa** (`'study'` → `Study`) porque save antigo e dado
  semeado gravaram categoria em caixa baixa, e devolve `undefined` quando não
  há correspondência — quem chama cai de volta no emoji em vez de renderizar
  imagem quebrada. Verificado nos dois casos na mesma tela (4 ícones ligados +
  1 tarefa sem categoria mostrando o emoji).
- **Mudança de dado no call site**: `App.tsx` passava
  `name={`${activity.emoji} ${activity.name}`}` — o emoji estava **assado
  dentro do nome**, então nenhum componente conseguia trocá-lo. Virou prop
  `emoji` própria. O emoji continua sendo o valor gravado na
  tarefa/atividade; nada de estrutura de dados mudou.
- O FAB perdeu o `<Plus/>` do lucide (ponta arredondada) por um "+" de dois
  retângulos retos.

**Não liguei** os ~20 ícones restantes de `HIGGSFIELD_UNUSED` — sem alvo real,
virariam decoração. Ficam para quando a tela que precisa deles existir.

---

## 3. FAB e barra de chat

| Peça | Antes | Depois |
|---|---|---|
| FAB "+" | círculo `border-radius: 50%`, teal chapado, sombra borrada | `.sm-px-fab`: chanfro de 9px, moldura de cobre 3px, miolo ciano, contorno duro de 2px + glow ciano. 52×52, `:focus-visible` com outline de cobre |
| Barra de chat | `rgba(30,41,57,.9)` + `#364153` + `#4a5565` — **cinza-ardósia cru, fora da paleta** — e `rounded-[10px]` | `.sm-px-chatbar`: moldura de cobre chanfrada; miolo no token de superfície do TEMA (branco no claro, `#10312f` no escuro) |
| Campo | `bg-[#364153]`, texto branco fixo | `.sm-px-chat-input`: `--sm-bg`/`--sm-ink`, borda de cobre, `:focus` com outline ciano. **16px mantidos** (anti auto-zoom do iOS) e a fonte segue monoespaçada |
| Botões enviar/mic | 36px de altura | `.sm-px-chat-btn`, **50×44** — subiu para o alvo mínimo de 44. Botão de mic ganhou `aria-label` e `title` **com par PT/EN** (estavam só em inglês) |

Contraste do "+": tinta `#04211f` sobre o ciano, o mesmo par do
`.sm-px-btn-primary` — usar `--sm-px-ink` (tinta clara) ali daria
claro-sobre-ciano, que não passa AA.

---

## 4. O que NÃO fiz (respeitando a instrução)

- `button-hover-*` / `button-active-*` do kit continuam **desligados**; os
  estados seguem derivados por filtro, como na rodada 1.
- Nada da rodada 1 nem do sweeper foi revertido: variantes seguem **aninhadas**
  (`&:hover`) — todas as regras novas também —, alvos de 44px intactos,
  `max-h` do AISettingsModal intacto.
- **Árvore de evolução (Ref C) não foi começada** — ver §7.

---

## 5. Verificação (Playwright + Chromium `E:/pw`, contra `vite preview` do build real)

Script novo: **`E:/pw/shot11.mjs`**. Seed por `addInitScript`, viewport 412×880 @2x.
**Os dois temas rodam em PT-BR de propósito** — o risco desta rodada é acento
quebrado, e rodar em inglês é exatamente como isso passaria batido.

| Tela | Antes (rodada 1) | Depois claro | Depois escuro |
|---|---|---|---|
| Home (HUD + fichas) | `kit-light-10-home.png` / `kit-dark-10-home.png` | `E:/pw/shots/r2-light-10-home.png` | `r2-dark-10-home.png` |
| Home (rolada) | `kit-*-11-home-cards.png` | `r2-light-11-home-cards.png` | `r2-dark-11-home-cards.png` |
| Foco de teclado no FAB | `kit-dark-41-foco.png` (elemento **não** confirmado) | `r2-light-12-foco-fab.png` | `r2-dark-12-foco-fab.png` |
| Atividades | `kit-*-20-atividades.png` | `r2-light-30-atividades.png` | `r2-dark-30-atividades.png` |
| Configurações | — | `r2-light-20-config.png` | `r2-dark-20-config.png` |
| **Guia (texto longo PT-BR)** | — | `r2-light-21-AbrirGuia.png` | `r2-dark-21-AbrirGuia.png` |

**Medições no DOM real** (idênticas nos dois temas, salvo onde dito):

- **Fonte, por elemento**: `.sm-px-chip-value` → `Silkscreen` (2×);
  nome de tarefa/atividade → `ui-sans-serif` (3×);
  campo de chat → `ui-monospace`, `16px`.
- **Texto longo em português**: no modal do Guia, **32 parágrafos, 30 com
  acento**, conjunto de fontes = `["ui-sans-serif"]` — um único valor, ou seja
  nada de bitmap vazou para leitura corrida. Amostra renderizada e conferida na
  imagem: *"A evolução é sua: toque no seu Soulmon na página de Evolução…"*,
  *"Corações (HP) — Perdidos em proporção…"*, `ã õ ç é á` todos íntegros.
- **Ícones de categoria**: 4 `.sm-px-cat-icon` na Home; **1** ficha ainda com
  emoji — exatamente a semeada sem categoria (prova do fallback).
- **FAB**: `52×52`, `border-radius: 0px`, `clip-path: polygon(9px 0px, …)`.
- **Foco**: `Tab` cai em `BUTTON.fixed.sm-px-fab`, `aria-label="Nova Atividade"`
  — desta vez **confirmei qual elemento**, o que a rodada 1 não tinha feito.
- **Barra de chat**: fundo `rgb(255,255,255)` no claro / `rgb(16,49,47)` no
  escuro, borda `rgb(198,134,66)` (o cobre `#c68642`) — o tema claro continua
  claro.
- **Alvos**: 8 checkboxes a `44×44`; botão do chat `50×44`; campo `282×44`.
- **Guardrail das moedas**: `240 Bits` na página de Atividades segue **verde de
  calculadora e sem ícone** (screenshot); `CRÉDITOS` no HUD segue com
  `icon-gem` e nome real. `currencies.test.ts` verde.

### O que ficou SEM verificação (explícito)

- **Contraste medido com ferramenta** — de novo não rodei medidor. A afirmação
  de AA para `#04211f` sobre `#5df0e0` e para a tinta clara sobre teal profundo
  é por leitura de token, não por medição.
- **Estados `:hover` / `:disabled`** do PixelButton e do FAB — não fotografados
  (só `default` e `primary`).
- **Botão "Evoluir"** e **"+ Nova atividade" do estado vazio** — mesma pendência
  das duas rodadas anteriores; dependem de estado de regra de jogo que eu não
  consigo semear sem forjar.
- **Chat com texto digitado** — fotografei a barra vazia (mic); o botão de
  enviar (variante ciano) só foi medido no CSS, não fotografado.
- **Telas não tocadas**: Evolução, Loja, Torneio, Biblioteca, minijogos, demais
  modais. A **página de Configurações** aparece no screenshot e continua com a
  linguagem antiga (cards arredondados, botões teal lisos) — não estava no
  escopo, mas é a maior área ainda fora do kit depois da Evolução.
- **iOS/Safari** — o `-webkit-font-smoothing: none` e o `clip-path` foram vistos
  só no Chromium.

---

## 6. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **limpo nos meus arquivos**. Restam 3 erros em `src/test/renderEnv.tsx` (`TS2591`, falta `@types/node`) — arquivo criado às 08:38 desta sessão pelo agente de testes, **não é meu** e está na área que me pediram para não tocar |
| Testes | `npx vitest run` | **37 arquivos · 491 testes · 491 passam · 0 falham**. (Eram 413 na rodada 1; o agente de testes acrescentou 78 no meio desta sessão. `index.css.contract.test.ts` e `currencies.test.ts` verdes) |
| Build | `npm run build` | **✓ built in 3.39s**, **112/112** PNG→WebP (−7,08 MB), worker compilado |

### Delta de bundle

| Artefato | Rodada 1 | Agora | Δ |
|---|---|---|---|
| `index-*.css` | 83,09 kB (gzip 15,51) | **86,44 kB (gzip 16,08)** | +3,35 kB / **+0,57 kB gzip** |
| `index-*.js` | 388,75 kB (gzip 129,08) | **389,25 kB (gzip 129,35)** | +0,50 kB / +0,27 kB gzip |
| `vendor` | 141,72 kB | 141,72 kB | 0 |
| **Fonte** | 2 TTF referenciados no CSS: **61,1 kB** | 2 woff2: **15,92 kB** (8,40 + 7,52) | **−45,1 kB de transferência** |

A fonte **baixou** o peso em vez de subir: o TTF de 30 kB já estava sendo
carregado desde 12/ago. O pacote também emite `.woff` (4,94 + 4,60 kB) como
fallback — nenhum navegador com suporte a woff2 chega a pedir esses arquivos.
Não há font-loading síncrono: `font-display: swap` vem do próprio Fontsource, e
o texto de leitura nem depende da fonte, então não há risco de CLS por bloqueio.
Subset não foi necessário além do que o Fontsource já entrega (só `latin`).

`public/sw.js` **não** precisou de bump de `CACHE_VERSION`: os assets são
hasheados e a fonte cai no `RUNTIME_CACHE` cache-first, não na lista de precache.

---

## 7. O que falta para bater a Ref C

1. **Árvore de evolução como grafo de nós de cristal** — não começada, e é o
   maior *delta* que sobra (metade esquerda da Ref C). Especificação do que
   falta, para a próxima rodada não redescobrir: precisa de **3 assets**
   (`node-crystal-on`, `node-crystal-off`, `node-ring-active`, 64×64 com alfa) +
   a linha de conexão; o layout é uma coluna vertical de nós ligados por linhas
   ciano, **futuros dessaturados** (`filter: grayscale(1) brightness(.5)`),
   **atual com anel ciano pulsante** e o sprite do pet pousado nele. Fonte de
   dados: `EvolutionPath.tsx` já sabe o galho previsto e o critério de
   desempate — é reapresentação, não regra nova. O grafo tem que continuar
   **navegável por teclado** (hoje a página tem alvos de toque de verdade) e a
   linha não pode ser o único portador de informação (o `aria-label` do nó
   precisa dizer "bloqueado / atual / previsto").
2. **Regerar `hover`/`active`/`disabled`** dos botões sem o halo magenta e com
   o enquadramento do `normal` (pendência da rodada 1, intocada).
3. **Card "DAILY RITUALS"**: hoje cada tarefa é um painel solto; a referência
   agrupa num painel com barra de título. `PixelPanel` já aceita `title`.
4. **Nav inferior com rótulo** (Ref C rotula HOME/COMMUNITY/SHOP). **Não fiz de
   propósito**: são 6 itens em 412px e `ATIVIDADES` em Silkscreen não cabe sem
   truncar — precisa de decisão de rótulo curto antes de código.
5. **Ícones dos 3 atributos** (Poder/Harmonia/Benevolência) 64×64 com alfa.
6. **Moldura de cano + vinha em 9-slice** — o painel ainda reaproveita o frame
   do botão large.
7. **`nest-base.png`**: o bloco de xadrez à esquerda do cristal **continua
   visível** nos screenshots desta rodada (`r2-*-10-home.png`). É o defeito de
   arte mais óbvio da Home e não é corrigível no front.
8. **`StepRow` a 40×40** — abaixo dos 44 do WCAG 2.2 AA, medido na rodada 1,
   ainda aberto.
9. **Página de Configurações** ainda inteira na linguagem antiga (§5).
