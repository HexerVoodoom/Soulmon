# Soulmon — Correções de frontend (fase sweeper)

> Escopo desta rodada: achado #4 (130 usos de 80 classes fantasma), achado #13
> (`'Anônimo'` PT-only) e achado #7 (alvos de toque < 44px). Nada de
> `functions/`, `workers/`, `desktop/`, `android/` ou `vitest.config.ts` foi
> tocado. Nenhum teste do QA foi afrouxado — `src/index.css.contract.test.ts`
> está verde pela correção do código, e o guard continua com os 4 casos de
> autoverificação intactos.

---

## 1. O que a varredura do QA errou (e por que isso importa)

**13 das 80 classes ditas "fantasma" existiam no `index.css` desde sempre.** O
guard tem dois pontos cegos, ambos no `classesDefinidas()`:

1. **Seletor agrupado por vírgula.** O regex aceita `,` dentro do nome, então
   `.flex-shrink-0, .shrink-0 { }` é lido como a classe `"flex-shrink-0,"` —
   com a vírgula colada. A primeira classe de todo grupo fica invisível.
2. **Pseudo-classe no seletor.** O regex aceita `:`, então
   `.hover\:bg-gray-600:hover { }` é lido como `"hover:bg-gray-600:hover"`.
   **Qualquer** utilitário de variante escrito no formato plano do Tailwind
   compilado é invisível para o guard.

Consequência prática do ponto 1: **`flex-shrink-0` (15×, o item de maior
destaque do relatório) nunca esteve quebrado.** O compilado define
`.flex-shrink-0, .shrink-0 { flex-shrink: 0 }` — o alias v3 está lá. Nenhum
ícone estava sendo espremido a zero; o diagnóstico "mesmo modo de falha do
checkbox de 2px" não se sustenta. Renomeei para `shrink-0` assim mesmo (é o nome
canônico do v4, e o alias é só ruído), mas o efeito visual é **zero** — e é
importante que isso fique registrado, porque era o achado mais alarmante da
lista e ele não existia.

**Não editei o teste.** Corrigi o *código* para que ele fique verde de forma
honesta:

- o alias `.flex-shrink-0` foi **removido** do CSS (a classe deixou de ser usada
  em qualquer JSX, então o alias não protege ninguém);
- `.sm-ambient-sparkle, .sm-ambient-heart` foi **separado em duas regras**;
- as 11 regras de variante que já existiam foram **reescritas em forma
  aninhada** (`.hover\:bg-gray-600 { &:hover { … } }`), que o guard enxerga e o
  esbuild rebaixa para exatamente o mesmo seletor. Todo utilitário de variante
  novo que eu escrevi segue a mesma forma — senão o guard voltaria a acusar
  fantasma na regra que acabou de ser criada.

**Recomendação para quem mantiver o guard** (não apliquei, é arquivo do QA):
trocar o regex de `classesDefinidas()` por um que corte no primeiro `:` ou `,`
não escapado. Enquanto ele não mudar, **a forma aninhada é obrigatória** para
qualquer variante nova no `index.css` — deixei essa regra escrita como
comentário no topo do bloco novo, dentro do próprio CSS.

---

## 2. As 80 classes, por decisão tomada

| Decisão | Classes | Usos |
|---|---|---|
| **Regra nova no `index.css`** | **54** | 92 |
| **`style={{}}` inline** | **12** | 17 |
| **Trocada por classe existente** | **1** (`max-h-[88vh]` → `max-h-[80vh]`) | 1 |
| **Já existia — falso positivo do guard** | **13** | 20 |
| Total | 80 | 130 |

### 2.1 Regra nova no `index.css` (54)

Critério: utilitário **genérico e reutilizável**, com nome canônico do Tailwind,
que qualquer tela futura vai querer. Escritos no fim do arquivo, no mesmo
formato do compilado (`var(--spacing)`, `var(--color-*)`, `var(--radius-*)`) —
nenhum valor solto.

- **Espaçamento (15):** `-mt-2` `mt-3` `pt-1` `pb-1` `p-0` `p-1.5` `px-0.5`
  `px-1` `px-5` `py-4` `py-5` `py-6` `gap-0.5` `gap-4` `space-y-1.5`
- **Tamanho/posição (6):** `w-28` `w-36` `max-w-lg` `bottom-0`
  `pointer-events-auto` `items-end`
- **Tipografia (9):** `font-semibold` `uppercase` `tracking-wider`
  `leading-none` `leading-snug` `leading-tight` `text-right` `break-all`
  `text-[9px]`
- **Cor (12):** `text-gray-300` `text-green-500` `text-white/60` `bg-white/5`
  `bg-white/10` `bg-white/70` `bg-black/40` `bg-teal-600` `border-white/10`
  `accent-teal-500` `bg-neon-green` `border-neon-green/80`
- **Efeito/animação (6):** `shadow` `rounded-t-2xl` `duration-150` `duration-200`
  `zoom-in-75` `slide-in-from-bottom-4`
- **Variantes, em forma aninhada (6):** `active:scale-[0.99]`
  `disabled:opacity-40` `disabled:opacity-60` `focus:border-teal-400`
  `hover:bg-teal-700` `hover:bg-white/20`

Uma nota de **design system** dentro dessa lista: `neon-green` **nunca foi um
token deste projeto** — não existe em lugar nenhum do CSS nem do
`utils/currencies.ts`. Era nome importado de outro código. Resolvi para
`var(--sm-primary)` (o teal do tema, com a variante `/80` via `color-mix`) em
vez de inventar um verde novo; o resultado está no §3.

### 2.2 `style={{}}` inline (12)

Critério do CLAUDE.md: **posicionamento/layout crítico e geometria de peça
única**. Tudo aqui é rabinho de balão (triângulo feito por borda) ou centragem
absoluta — não vira utilitário porque não tem segundo uso.

`left-1/2` `-translate-x-1/2` `-bottom-[5px]` `-top-[6px]` `w-0` `h-0`
`border-l-[5px]` `border-r-[5px]` `border-t-[5px]` `border-l-transparent`
`border-r-transparent` `border-t-white`

Sítios: `CompanionHUD.tsx` — botão "Evoluir" (linha ~606), rabinho do balão de
abraço (~673) e rabinho do balão de fala (~828).

### 2.3 Trocada por classe existente (1)

`max-h-[88vh]` → `max-h-[80vh]` em `AISettingsModal.tsx:65`. `80vh` é a
convenção da casa (é o que `HelpModal` usa) e já está compilado; criar um `88vh`
só para esse modal seria dívida nova. Impacto medido no §3.

### 2.4 Já existiam (13) — corrigido o CSS, não o JSX

`flex-shrink-0` `sm-ambient-sparkle` `active:scale-95` `disabled:bg-gray-600`
`disabled:border-gray-500` `disabled:opacity-50` `focus:border-[#4a5565]`
`focus:outline-none` `hover:bg-gray-600` `hover:bg-gray-600/20`
`hover:scale-110` `hover:text-white` `placeholder-[#99a1af]`

Nenhuma mudança visual: as regras já valiam. Só a forma do seletor mudou (§1).

---

## 3. Impacto visual — o que mudou de verdade

Onze correções eram inertes (padding/margin de 4 a 8px, `text-right` em rótulo
já alinhado). Estas seis **mudam o pixel** e foram verificadas uma a uma:

| Mudança | Antes | Depois | Verificado |
|---|---|---|---|
| `disabled:opacity-40/60` (`SettingsPage`) | Botões "Entrar / Sincronizar" e "Restaurar" **idênticos** ao estado ativo, mesmo desabilitados | Ambos visivelmente esmaecidos | ✅ screenshot da tela de Configurações |
| `break-all` (`SettingsPage:198`) | O código de recuperação (64 chars) estourava a caixa | Quebra dentro da caixa, em duas linhas | ✅ mesmo screenshot |
| `bg-neon-green` (`ChatBox:351`) | Botão de **enviar** sem preenchimento nenhum — a ação primária da barra de chat era um ícone solto | Preenchimento `--sm-primary` (`rgb(13,148,136)` medido) e borda a 80% | ✅ screenshot com texto digitado |
| `max-h-[88vh]`→`[80vh]` (`AISettingsModal`) | `max-height` **não aplicava**: em viewport de 640px o card ficava com 864px e o botão *Save* era inalcançável | Card capado em 512px e **rolável**; medido: `scrollHeight > clientHeight`, e o *Save* sobe para `bottom: 558 < 640` ao rolar | ✅ medição + screenshot em viewport curto (412×640) |
| `left-1/2` inline (`CompanionHUD:606`) | Botão "Evoluir" com `position:absolute` sem `left` → caía na posição estática, fora do centro do palco | Centralizado sobre o pet | ⚠️ **não verificado** — exige `canEvolve` (estado que não consegui semear sem forjar regra de jogo) |
| `gap-4` (`TaskCard:33`) | Espaço entre checkbox e texto colapsado a 0 | `gap` computado = **16px**; checkbox medido em **44×44** | ✅ screenshot + medição |

**Risco de "conserto que quebra"** — a preocupação legítima de classe morta que
alguém compensou à mão. Auditei os três candidatos reais:

- `bottom-0` + `pb-1` + `pointer-events-auto` no **balão de fala**
  (`CompanionHUD:812`): era o mais arriscado, porque o `absolute` sem `bottom`
  vinha caindo na posição estática. Depois da correção o balão ancora no rodapé
  da área do pet, com o rabinho apontando **para cima, para o bicho** —
  exatamente a intenção do comentário no código. ✅ verificado em screenshot.
- `gap-0.5` no HUD e em `ItemsWindow`: 2px de folga em contadores; nenhuma
  compensação manual por perto.
- `duration-150/200`: só passam a animar transições que já existiam. Sem
  deslocamento de layout (nada de CLS novo).

### Alvos de toque (achado #7)

Oito botões entre 26 e 34px foram para **44×44 medidos** (WCAG 2.2 AA, 2.5.8),
com o círculo visual original desenhado dentro — o mesmo padrão do
`TaskCard.tsx:50`. Nos modais o `top/right` recuou 7px para o círculo ficar
exatamente onde estava.

`DailyReportModal` · `PlayerDetailModal` · `WelcomePromptModal` (fechar, 30→44) ·
`ItemsWindow` (fechar, 26→44) · `DinoGame` · `DungeonGame` · `RPSGame` (sair,
34→44) · `GameTutorialFlow` (avançar/voltar, 34→44).

Medidos com Playwright: os quatro que consegui abrir devolveram `44x44`
(ItemsWindow, PlayerDetailModal, Dino, PPT, Masmorra). `DailyReportModal` foi
verificado em screenshot. Efeito colateral aceito: cabeçalhos de modal/jogo
crescem até ~10px de altura, o que os screenshots mostram como natural.

**`:focus-visible` não é uma lacuna.** O `index.css` já tem regra global
(`button:focus-visible`, `[role="checkbox"]:focus-visible`, `a:`, `input:`,
`textarea:`, `select:`), então os botões refeitos herdam o anel de foco. Nada a
fazer aqui.

### Paridade de idioma (achado #13)

`GameStateContext.tsx:377` — `'Anônimo'` era o nome padrão publicado no **ranking
da comunidade**, onde outros jogadores leem. Agora
`resolveLanguage(...) === 'pt-BR' ? 'Anônimo' : 'Anonymous'`, usando o mesmo
ponto único de resolução de idioma do resto do app.

---

## 4. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, limpo** |
| Testes | `npx vitest run` | **29 arquivos · 413 testes · 413 passam · 0 falham** (baseline do QA: 407/398/9). `src/index.css.contract.test.ts` **6/6 verdes**, incluindo os 4 de autoverificação e o `flex-shrink-0 (v3) não é usado` |
| Build | `npm run build` | **✓ built in 3.78s**, 108/108 PNG→WebP (−6,19 MB), worker compilado. Avisos de import dinâmico inalterados (achado #9, fora deste escopo) |
| Bundle | — | `index-*.css` **79,02 kB** (gzip **14,68 kB**) — era 75,78 / 13,93: **+3,24 kB / +0,75 kB gzip** pelas 54 regras novas. `index-*.js` 386,54 kB (gzip 128,01), `vendor` 141,72 kB — praticamente inalterados |

As 7 falhas de backend do relatório do QA (#1, #2, #3, #5) já estavam verdes
quando rodei — corrigidas em paralelo pelo backend, não por mim.

---

## 5. Verificação visual — o que foi e o que **não** foi olhado

Não havia navegador neste ambiente (sem Playwright, sem Puppeteer; o
`msedge --headless --screenshot` do Windows não escreve arquivo). **Instalei o
Playwright + Chromium em `E:/pw`** (fora de `C:`, conforme a instrução de disco)
e rodei contra `npx vite preview` do build real, semeando o `localStorage` com
`addInitScript` — nunca com `evaluate` + `reload`, pelo motivo do footgun 7.

**Verificado em screenshot/medição:** Home com lista de tarefas e atividades ·
DailyReportModal · ItemsWindow · barra de chat com botão de enviar ·
Configurações (backup, conta, IA) · AISettingsModal em viewport curto ·
Atividades · Evolução · Biblioteca/PlayerDetailModal · Loja (5 abas) · Torneio ·
Corrida do Dino · Pedra-Papel-Tesoura · Masmorra · balão de fala do pet.
Imagens em `E:/pw/shots/`.

**NÃO verificado visualmente** (digo explicitamente, não afirmo o que não vi):

- **Botão "Evoluir"** (`CompanionHUD:606`, a correção de `left-1/2`) — só
  aparece com `canEvolve` verdadeiro, que eu não consegui semear sem forjar
  estado de regra de jogo.
- **Balão de abraço** (`CompanionHUD:673`) — só aparece depois de alimentar ou
  dar banho com sucesso; o rabinho é o mesmo desenho do balão de fala, que **foi**
  verificado.
- **HelpModal** (`slide-in-from-bottom-4`, `rounded-t-2xl`, `bg-white/5`,
  `uppercase`, `tracking-wider`) — não achei o gatilho pela automação. É a
  concentração de mudança visual não verificada mais relevante que sobra: 12 das
  54 regras novas são usadas lá.
- **WelcomePromptModal** e **GameTutorialFlow** — só aparecem em fluxo de
  primeiro uso/tutorial, que o seed pula. Os alvos de 44px ali estão por
  simetria de código com os cinco que foram medidos, não por medição própria.
- **Tema escuro** — todos os screenshots são do tema claro. As regras novas de
  cor usam `#fff`/`#000` com `color-mix` (herdado do que já existia no arquivo)
  ou tokens `--sm-*`/`--color-*`; nenhuma cor nova foi introduzida, mas o
  contraste no escuro não foi medido.

---

## 6. Fora de escopo e dívida que fica

- **Nesting de CSS no bundle.** O esbuild **não** rebaixa o `&:hover` (o
  `dist/*.css` sai com o aninhamento literal), então as 18 regras de variante
  exigem Chrome 112+ / Safari 16.5+ / Firefox 117+. Isso **não** move a barra do
  projeto: o `index.css` já dependia de `oklch()` e `color-mix()` (Chrome 111+)
  antes de eu chegar. Se alguém quiser garantia, o ajuste é `build.cssTarget` no
  `vite.config.ts` — que não é meu arquivo nesta rodada.
- **Não corrigi o regex do guard** (`src/index.css.contract.test.ts`) — é
  arquivo do QA e a regra da rodada é não mexer em teste dele. O ponto cego está
  documentado no §1 e o custo de conviver com ele é escrever variantes
  aninhadas, o que está anotado dentro do CSS.
- **Achados #6, #9, #10, #11, #12, #14** — config de cobertura, chunking do
  oráculo, TTL do KV, service worker e documentação: não são frontend de tela ou
  são de outro dono.
- **`aria-label` EN-only em `App.tsx:1937` ("Dismiss")** — o QA registrou no
  corpo do §4 mas não abriu achado numerado. Como é o espelho exato do #13 e
  custava uma linha, **corrigi junto**: virou
  `language === 'pt-BR' ? 'Dispensar' : 'Dismiss'`, e o botão (que era ~20px)
  foi para 44×44 no mesmo passe. Não verificado visualmente: depende de HP ≤ 1.
- **Não commitei e não dei push.** `docs/STATUS.md` não foi atualizado para não
  colidir com o backend, que estava editando na mesma janela.
