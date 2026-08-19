# Plano de Design — a virada visual do Soulmon

> **Dono deste arquivo:** o Líder de Design. Este documento **decide**. Ele não
> lista alternativas, não pede escolha do dono e não reabre o que já foi
> decidido. Quem discorda abre um PR contra este arquivo.
>
> **Data:** 19/08/2026 · Base factual: `docs/INVENTARIO-TELAS.md` (114
> superfícies, medido) · Base conceitual: a direção de arte **"O Visor"** ·
> Base de regra: `CLAUDE.md` (regras visuais do dono, footguns 1 e 10) e
> `docs/PLANO-PRODUTO.md`.

---

## 0. O que este plano assume como fechado

Não reabro nada disto. Está aqui só para que cada onda possa ser conferida
contra a regra:

1. **A fronteira diegética "O Visor".** Pixel art existe **dentro** do visor do
   aparelho v-pet (sprite, cenário, decoração, partículas, FX). Tudo **fora**
   do visor é o aparelho: SVG limpo, Material Symbols Rounded, tipografia
   legível. As duas linguagens **nunca se misturam na mesma superfície**.
2. Bisel 20px · tela interna 12px · anel de cobre 4px · interior do visor
   **sempre escuro nos dois temas** · `image-rendering: pixelated` com escala
   **inteira** do sprite · grid de 4px.
3. **Paleta**: ciano-turquesa é a única luz forte; cobre envelhecido; petróleo.
   **Token de tinta ≠ token de fill** para cada acento.
4. **Tipografia**: Silkscreen = voz do dispositivo (só dentro do visor e em
   selos; ≥14px; CAIXA ALTA; nunca frase inteira). Fredoka = títulos.
   Rubik = texto e dado (`font-variant-numeric: tabular-nums`).
5. **Ícones**: Material Symbols Rounded variável. Eixo `FILL` 0→1 é o **sistema
   de estado**. `opsz` casado ao tamanho. `wght` 500.
6. **Movimento**: dentro do visor `steps()`; fora, curvas contínuas
   120/200/320ms. `prefers-reduced-motion` obrigatório em tudo.
7. **Regras do dono que continuam mandando** (`CLAUDE.md`): ícone **nunca**
   dentro de box; seleção na nav = **sublinhado ciano**; `.sm-pet-sticky` não
   rola para fora; `src/index.css` é o único CSS empacotado (footgun 1); não
   reintroduzir `var(--foreground)`/`var(--background)` em texto novo
   (footgun 10).
8. **Teste de aceitação da identidade**: recorte 200×200px de qualquer tela,
   sem logo. Se não dá para dizer que é o Soulmon, não está pronto. **Vale como
   critério de merge de cada onda.**

---

## 1. Os tokens que precisam existir antes da Onda 1

Sem isto nada abaixo é executável. Vai em `src/index.css` (footgun 1), no fim
do arquivo, sob `[data-theme="dark"]` e `[data-theme="light"]`.

### 1.1 Cor — tinta e fill são tokens SEPARADOS

```
--sm-ciano-fill      /* preenchimento/brilho: barras, sublinhado, FILL 1 */
--sm-ciano-ink       /* texto/ícone sobre superfície escura */
--sm-ciano-on        /* texto que vai EM CIMA do fill ciano */
--sm-cobre-fill      /* anel, molduras, selos */
--sm-cobre-ink
--sm-cobre-on
--sm-petroleo-900    /* interior do visor — MESMO valor nos dois temas */
--sm-petroleo-700    /* fundo do aparelho, tema escuro */
--sm-casco-100       /* fundo do aparelho, tema claro */
--sm-ink             /* texto padrão (já existe, mantém) */
--sm-ink-muted
--sm-perigo-fill / --sm-perigo-ink      /* HP baixo, assombrada */
--sm-sucesso-fill / --sm-sucesso-ink    /* dia perfeito, concluído */
```

**Regra travável por teste**: nenhuma superfície pode usar `*-fill` como cor de
texto, nem `*-ink` como fundo. É o que mata o bug recorrente de contraste do
footgun 10. Sugestão de guarda: um teste que varre `index.css` procurando
`color: var(--sm-*-fill)`.

### 1.2 Espaço, raio, elevação

```
--sm-space-1..6   = 4 / 8 / 12 / 16 / 24 / 32px   (grid de 4)
--sm-r-sm 6 · --sm-r-md 10 · --sm-r-lg 16 · --sm-r-visor 4 (o visor é quase reto)
--sm-bisel 20px · --sm-tela 12px · --sm-anel 4px
--sm-toque-min 44px   /* alvo mínimo, sem exceção */
```

### 1.3 Movimento

```
--sm-dur-1 120ms (feedback de toque) · --sm-dur-2 200ms (troca de estado)
--sm-dur-3 320ms (entrada de superfície)
--sm-ease  cubic-bezier(.2,.8,.2,1)
--sm-steps steps(4,end)   /* SÓ dentro do visor */
```

### 1.4 O componente de ícone — dono único

Novo arquivo: **`src/components/SmIcon.tsx`**. Assinatura:

```
<SmIcon name="home" size={36} fill={ativo} weight={500} tone="ciano|cobre|ink" />
```

Ele é o **único** lugar do app autorizado a renderizar um ícone. Renderiza
Material Symbols Rounded (fonte variável carregada local, **não** por CDN — o
app precisa funcionar offline; ver Onda 6). `RowIcon.tsx`, que hoje é "a costura
entre PNG e lucide", **é absorvido por ele e apagado**.

---

## 2. A sequência de ondas

**Princípio inegociável**: a virada acontece por **superfície inteira** — todos
os botões, depois todos os cards, depois todos os ícones de uma classe. Nunca
tela a tela. Migração parcial por tela é o estado atual do app (12 arquivos com
duas linguagens ao mesmo tempo) e é pior do que não migrar.

**Prioridade = frequência de uso, medida no inventário.** Home e lista de
rituais são vistas todo dia. A `OraclePage` é vista uma vez na vida — e por
sinal, hoje, nenhuma.

---

### Onda 0 — Demolição (1 PR, nenhum pixel novo)

Vem **antes** de tudo porque todo redesenho que só adiciona é um redesenho que
falhou, e porque cada item abaixo é uma linguagem a menos para conciliar.

| Sai | Ação |
|---|---|
| `ArenaGame.tsx` | **apagar** (zero referências, medido) |
| `currentView === 'oracle'` + `OraclePage.tsx` | **sai da navegação e do bundle do app.** É ferramenta de criação interna, não tela de produto. Move para `src/dev/OraclePage.tsx` atrás de `import.meta.env.DEV`. Os 55 emojis dela saem da conta do app de uma vez |
| 6 PNGs órfãos | apagar: `icon-edit` · `icon-heart-crack` · `icon-plant` · `icon-shard` · `icon-torch` · `icon-warning` |
| "Refazer o ritual" no menu sanduíche | **sai de produção** (é DEBUG no código, destrutivo em produção — apaga `ONBOARDING_COMPLETE`/`USER_NAME`/`EGG_TYPE`). Fica sob `import.meta.env.DEV` |
| Os 142 PNGs de `E:\Soulmon-assets\out` (`iconRegistry.ts`) | **descartados formalmente.** São um kit de ícone raster; a decisão do dono foi sair de PNG. O registro vira comentário histórico ou é apagado |
| `src/components/ui/` (44 shadcn) | **decisão: morre inteiro, em duas etapas.** Etapa A (aqui): apagar os não-importados por nenhum arquivo de produção — é a maioria. Etapa B (Onda 5): os sobreviventes reais são reescritos no kit. **Exceção única: `ui/sonner.tsx`** (Toaster), que fica até a Onda 4 e então é substituído por um toast próprio. Motivo de matar: shadcn traz `--background`/`--foreground`, a raiz documentada do footgun 10 |

**Pronto quando**: `npx tsc --noEmit` limpo, `npx vitest run` verde,
`npm run build` limpo, e `grep -r "lucide-react\|components/ui" src --include=*.tsx`
cai para os arquivos listados na Onda 3 e nada mais.

---

### Onda 1 — Os tokens e o Visor (o chassi)

Nenhuma tela muda de layout. Muda o **chassi**.

Entregas:
1. Os tokens da §1 em `index.css`.
2. **`PixelFrame.tsx` vira o Visor de verdade**: bisel 20px, anel de cobre 4px,
   tela interna 12px, interior `--sm-petroleo-900` nos dois temas. Hoje ele já é
   "a moldura da tela" global — é o gancho certo, e ele já está em 100% das telas.
3. `SmIcon.tsx` + fonte Material Symbols Rounded variável **empacotada local**.
4. `body` confirmado em `--sm-bg`/`--sm-ink` (footgun 10) e uma varredura que
   proíbe `--foreground` novo.
5. Silkscreen com **piso de 14px** aplicado por classe (`.sm-px-arcade-label`,
   `.sm-px-arcade-value`) — hoje há rótulos a 8–11px (item 8 do backlog do
   PLANO-PRODUTO, resolvido aqui e não depois).

**Pronto quando**: o recorte 200×200 de QUALQUER tela já mostra bisel + anel de
cobre + interior escuro; nenhum texto Silkscreen abaixo de 14px; screenshot
Playwright nos dois temas com amostragem de PIXEL (não olho) provando contraste
AA em texto de corpo.

---

### Onda 2 — Todos os ícones de navegação e de ação (superfície: ÍCONE)

A classe de ícone inteira, de uma vez. É a onda de maior rendimento: `BottomNav`
está em 100% das telas e a action bar de cuidado é tocada todo dia.

Mapa de substituição (PNG → Material Symbols Rounded):

| Hoje | Vira | Onde |
|---|---|---|
| `icon-home` | `home` | BottomNav |
| `icon-activities` | `stadia_controller` | BottomNav (a view é "Atividades/jogos") |
| `icon-evolution` | `account_tree` | BottomNav |
| `icon-book` | `menu_book` | BottomNav (Biblioteca) |
| `icon-coin` | `storefront` | BottomNav (Loja) |
| `icon-menu` | `more_horiz` | BottomNav |
| `icon-items` | `backpack` | action bar do pet |
| `icon-bath` | `shower` | action bar |
| `icon-sleep` / `icon-wake` | `bedtime` / `wb_sunny` | action bar (toggle) |
| `icon-send` / `icon-mic` | `send` / `mic` | ChatBox |
| lucide `Square` (parar gravação) | `stop_circle` | ChatBox — **acaba a mistura PNG×lucide no mesmo controle** |
| `icon-close` (23 arquivos) | `close` | todos os modais |
| `icon-gear` / `gear-gold` | `settings` | menu, SettingsModal |
| `icon-search` | `search` | Biblioteca |
| `icon-bell` / `bell-off` | `notifications` / `notifications_off` | Configurações, modais |
| `icon-globe` | `language` | Configurações |
| **`icon-cloud-rain`** | **`cloud_done`** | **Configurações "CLOUD BACKUP"** — nuvem de CHUVA rotulando backup é o bug de semântica mais barato de matar do inventário |
| `icon-cloud-rain` no DailyReport | `bedtime` ou `nights_stay` conforme a linha | DailyReportModal |
| `icon-chevron-right` | `chevron_right` | Atividades |
| `icon-lock` | `lock` | Evolução, Loja |
| `icon-clock` | `schedule` | Torneio, modais |
| `icon-trash` | `delete` | modais de edição |
| `icon-reset` | `restart_alt` | conta, créditos |
| `icon-exit` | `logout` | conta |
| `icon-shield` | `verified_user` | conta, loja Torneio |
| `icon-profile` | `person` | Biblioteca |
| `icon-heart-handshake` | `volunteer_activism` | Home (banner de HP), Biblioteca, DailyReport |
| `icon-target` | `target` (ou `crisis_alert`) | RitualPanel |
| `icon-bolt` / `icon-star` | `bolt` / `star` | Stats |
| `icon-map` | `wallpaper` | Loja/Backdrops |
| `icon-potion` | `science` | Loja |
| `icon-skull` | `skull` | RPS |
| `icon-spellbook` | `auto_stories` | Configurações |
| `icon-flame` | `local_fire_department` | HomeHud |

**FICAM em PNG/pixel (são conteúdo do visor, não ícone de interface)**:
sprites das linhas (`lines/*`), `nest-base`, `bg/*`, decoração/mobília
(`furn-*`), `dungeon-spirit`, `mascot-raven`, os `node-*` da EvoTrail, os
frames de FX. Ver §3.

**Estado ativo da nav**: `FILL 0` inativo → `FILL 1` ativo + sublinhado ciano
(`--sm-ciano-fill`, 3px, largura do ícone). Nada de placa, box ou halo — regra
do dono, 18/ago.

**Pronto quando**: `grep -r "icons/icon-" src` só devolve os itens da lista
"ficam"; `lucide-react` some de `ChatBox`, `DinoGame`, `InstallPrompt`,
`ProtectProgressModal`, `App.tsx`; todo alvo de toque ≥44px; teste de 200×200
passa no recorte da nav.

---

### Onda 3 — Moedas, atributos e as 4 rodas de carregamento

A onda que conserta os **bugs de identidade** (§4) e a que resolve os spinners.

1. **As três moedas** (regra travada em `CLAUDE.md`, com testes):
   - **Bits**: continua **sem ícone** — número + "Bits" em `bitsStyle`. Não
     ganha ícone nesta onda nem em nenhuma outra.
   - **Créditos**: `SmIcon name="diamond"` com `tone="ciano"`, **um único
     desenho no app inteiro**. O **emoji 💎 dos degraus de troca da loja morre
     aqui** — hoje Créditos tem duas representações na mesma tela.
   - **Emblemas**: `SmIcon name="military_tech"` com `tone="cobre"` +
     tipografia com serifa (regra do dono). Nunca ciano.
2. **Atributos** (Poder/Harmonia/Benevolência): **os SVG inline de
   `AlignmentIcons.tsx` vencem**; os 3 PNG `icon-attr-*` são apagados. Motivo:
   já são SVG, já são nossos, e o conflito PNG×SVG na mesma tela de Evolução é o
   bug mais visível do inventário. `types/attributes.ts` passa a apontar para
   `AlignmentIcons`.
3. **Chips de atributo** (`chip-virus/data/vaccine`): são **item de inventário**
   = conteúdo do visor. Ficam pixel, mas re-desenhados no mesmo grid de 4px que
   os sprites, e os emojis 🦠/💾/💉 do `foodInventory` saem em favor deles.
4. **Um único componente de carregamento**: `SmLoading.tsx`, animação de
   varredura do visor em `steps()`. Os 4 spinners lucide (`Loader`, `Loader2`,
   `LoaderCircle`×3) morrem.
5. **Os 13 `Suspense fallback={null}`** de `App.tsx` passam a
   `fallback={<SmScreenSkeleton/>}`: o Visor permanece desenhado, o interior
   mostra a varredura. **Fim da tela branca na navegação** — hoje é o momento em
   que o app parece quebrado.

**Pronto quando**: `grep -r "💎\|🦠\|💾\|💉" src --include=*.tsx` = 0 fora de
teste; `grep -c "fallback={null}" src/App.tsx` = 0; `lucide-react` some de
`package.json`… ou quase (ver Onda 5).

---

### Onda 4 — A superfície diária: RitualRow, RitualPanel, HomeHud, CompanionHUD

Aqui o app passa a **parecer** outro. Não antes: sem tokens, ícones e moedas
resolvidos, esta onda vira retrabalho.

1. **`RitualRow`** — o átomo mais repetido do app. Hoje o ícone é **emoji do
   usuário**. Decisão: o emoji **fica**, porque é *conteúdo escolhido pela
   pessoa*, não ícone de sistema — mas passa a viver dentro de um **selo de
   48px** com fundo `--sm-petroleo-900` e anel de cobre 1px, que é a moldura
   diegética que o normaliza. Isso não viola "ícone nunca dentro de box": não é
   ícone de interface, é o avatar da atividade. As **affordances** da linha
   (checkbox, editar, arrastar) são `SmIcon` pelados.
2. **`HabitConstancy`**: os tiers 🌱/🌿/🌳 **saem** — são ícone de sistema
   disfarçado de emoji. Viram `SmIcon`: `eco` (seed) → `psychiatry` (sprout) →
   `park` (sapling/tree), com `FILL` marcando o tier alcançado.
3. **`RitualPanel`**: contador "DAILY RITUALS x/y" em Silkscreen ≥14px; empty
   state com ilustração pixel do pet ocioso, não texto cru.
4. **`HomeHud`**: acaba a mistura de três fontes de arte. Coração deixa de ser
   `figma:asset/7e77e9ec….png` e vira **segmentos desenhados** (`PixelSegmentedBar`
   com meio-segmento para as frações de 0.5, que a regra de HP exige).
5. **`PixelSegmentedBar`** ganha o estado que falta: **"meta do dia cumprida"**
   ≠ "cheio". Hoje a Home do dia 1 promete `ENERGY 0/4` numa meta de 1. Desenho:
   um **marcador de meta** (traço de cobre) no segmento correspondente a
   `dailyGoalFor`; passar dele acende o preenchimento em `--sm-sucesso-fill`.
   Isto conserta uma promessa quebrada, não só um pixel.
6. **`CompanionHUD`**: o palco é o interior do visor. `GROUND_Y` 74% mantido,
   sprite em escala **inteira**, partículas de carinho em `steps()`.
7. **Toast próprio** substituindo `sonner`.

**Pronto quando**: recorte 200×200 da Home passa; nenhuma classe `sm-card`/
`sm-btn` sobrevive em `App.tsx`, `RitualPanel.tsx`, `RitualRow`, `HomeHud`,
`CompanionHUD`; Playwright com save semeado (cheio) e save novo (vazio),
nos dois temas, com amostragem de pixel.

---

### Onda 5 — Formulários, listas e modais (a saída do retrô)

A onda em que o kit `sm-px-*` **recua** do lugar onde ele nunca deveria ter
entrado. Superfície inteira: todos os campos, depois todos os botões de texto,
depois todos os contêineres de modal.

Alvos: `CreateModal`, `EditModal`, `TaskEditModal`, `MorningCheckIn`,
`TriagePile`, `SettingsPage`, `SettingsModal`, `AISettingsModal`,
`ConfirmDialog`, `LibraryPage`, `ShopModal`, `CreditsModal`,
`UnlockAccountModal`, `ProtectProgressModal`, `GuideModal`, `HelpModal`,
`SoulmonOnboarding`, `GameTutorialFlow`, `StatsPage`.

Regras da onda:
- Campo de texto, select, switch, checkbox, tab: **SVG limpo**, raio
  `--sm-r-md`, foco visível em ciano de 2px, alvo 44px. `PixelCheckbox`,
  `PixelSwitch`, `PixelTabs`, `PixelChoiceChip` são **reescritos** (mesma API,
  desenho novo) — não são apagados, para não tocar 51 arquivos de chamada.
- **`sm-card`/`sm-btn` são apagados do `index.css`** ao fim da onda. Os 26+25
  arquivos passam para o kit novo. Enquanto os dois existirem, todo redesenho
  volta a divergir — é o item 9 do top-10 do inventário.
- **Tokens hardcoded** (`#22A900`, `#d9a441` em `TriagePile`) saem.
- **`SettingsPage`**: os 11 blocos empilhados viram **4 grupos**
  (Conta e backup · Notificações e descanso · Aparência e idioma · Ajuda e
  sobre), com âncoras. Nada de nova navegação — só agrupamento.
- **Focus-trap + Escape** em todo modal custom (autorizado no PLANO-PRODUTO,
  Parte 5; é risco de política de loja, não capricho).
- **Bottom sheets** no lugar de modais centrados nos que o polegar alcança
  (`ItemsWindow`, `CreateModal`, `TriagePile`).

**Pronto quando**: `grep -rc "sm-card\|sm-btn" src` = 0; nenhum arquivo importa
`sm-px-*` **e** o kit novo ao mesmo tempo (os 12 arquivos bilíngues zeram);
`components/ui/` apagado por completo; `lucide-react` sai do `package.json`.

---

### Onda 6 — O visor por dentro: coleção, cerimônia e arcade

A onda de **arte**, não de sistema. É a que exige produção (Higgsfield) e por
isso vem por último — mas é a que entrega desejo.

1. **DreamDex**: os **30 slots em emoji** viram 30 sprites pixel de 48×48 no
   grid de 4px. É a única coleção do jogo e hoje é desenhada com arte de sistema
   operacional ao lado dos nossos sprites. Slot não coletado = silhueta em
   `--sm-petroleo-900` com o anel de cobre; **nada de `???` em texto**.
   Resolve também a divergência de documentação (§4.4).
2. **`EvolutionCeremony`**: o clímax do jogo. Roteiro em 3 tempos dentro do
   visor — varredura, dissolução em `steps()`, revelação com o anel de cobre
   pulsando. `prefers-reduced-motion` = corte seco com o mesmo texto.
3. **`EvoTrail`** e os `node-*`: ficam pixel (são conteúdo do visor), mas
   redesenhados no grid.
4. **Masmorra / Dino / RPS**: território arcade puro. `sm-px-*` fica, mas
   **normalizado nos tokens novos** (ciano é a única luz forte; cobre nos
   selos). O overlay VHS fica.
5. **`MorningDream`, `NightmareBattle`**: cenas do visor.
6. **Estado de offline** — hoje **não existe nenhum**. Desenho: o anel de cobre
   do Visor perde o brilho e ganha um selo Silkscreen `SEM SINAL / OFFLINE` no
   canto superior do bisel. Ele é do **aparelho**, não do conteúdo, então
   aparece em todas as telas sem redesenhar nenhuma. É a peça de identidade mais
   barata do plano inteiro.
7. **Empty states com ilustração** onde hoje há texto cru: `StatsPage` (3
   seguidos), Biblioteca, Torneio.

**Pronto quando**: nenhum emoji sobrevive como ícone renderizado (§3.2); o
recorte 200×200 passa em DreamDex, masmorra e cerimônia; a Material Symbols
está empacotada local e o app inteiro renderiza sem rede.

---

### Onda 7 — Onboarding (16 templates)

Por último de propósito: é visto **uma vez na vida**, e o PLANO-PRODUTO já
mediu que o caminho grátis são 8 telas (perto do Finch). Redesenhar antes das
diárias seria otimizar a tela de menor frequência do app.

Escopo: os 16 templates, mais os dois bugs medidos — o botão "SUGGEST TASKS
WITH AI" que fica habilitado sem categoria e não dá retorno nenhum, e o
fallback offline que entrega **1** sugestão com emoji ao lado de 8 categorias em
arte própria. E o `"Planned load: 1 points"` do `MorningCheckIn` (o primeiro
texto que o usuário novo lê depois de nascer o pet).

---

## 3. Território retrô × território SVG — a lista nominal

### 3.1 FICA com `sm-px-*` (dentro do visor / arcade)

`DungeonGame` · `DinoGame` · `RPSGame` · `NightmareBattle` ·
`EvolutionCeremony` · `MorningDream` · `DreamDex` · `EvoTrail` ·
`PetStageDecor` · `CompanionHUD` (interior) · `WalkingPetStrip` ·
`PixelSegmentedBar` (HP/energia — é leitura do dispositivo) ·
`PixelSlot` (inventário e dex) · `PixelMeter` · `PixelFrame` ·
`HomeHud` (só os selos e valores em Silkscreen) · `TournamentPage`
(só a cena de arena; as listas e o switch migram).

### 3.2 MIGRA para SVG/Material (fora do visor)

Todos os outros. Nominalmente, os que hoje falam as **duas** línguas ao mesmo
tempo e por isso são prioridade cirúrgica na Onda 5:

`CreateModal` · `EditModal` · `TaskEditModal` · `SoulmonOnboarding` ·
`GameTutorialFlow` · `TriagePile` · `MorningCheckIn` · `CreditsModal` ·
`SettingsModal` · `OraclePage` (sai do app na Onda 0) · `EvolutionPath` ·
`StatsPage`.

Mais: `BottomNav` · `ChatBox` · `ActivitiesPage` · `LibraryPage` ·
`SettingsPage` · `AccountSection` · `ShopModal` (moldura, abas e preço; os
**itens** dentro dos slots continuam pixel) · `ItemsWindow` (moldura SVG,
itens pixel) · `DailyReportModal` · `WeeklyReportCard` · `ConfirmDialog` ·
`GuideModal` · `HelpModal` · `PlayerDetailModal` · `CityPicker` ·
`InstallPrompt` · `UnlockAccountModal` · `ProtectProgressModal` ·
`AISettingsModal` · `FirstTaskCompletedPopup` · `WelcomePromptModal` ·
`RitualPanel`/`RitualRow`/`StepRow`/`TaskMeta`/`HabitConstancy`.

### 3.3 Destino dos 44 shadcn

**Morrem todos.** Etapa A na Onda 0 (os não-importados), etapa B na Onda 5 (os
sobreviventes, reescritos no kit). Não há terceira linguagem no fim deste plano.
`ui/sonner.tsx` é o último a sair, na Onda 4.

---

## 4. Os bugs de identidade — decisão item a item

| # | Bug (medido no inventário) | Decisão | Onda |
|---|---|---|---|
| 4.1 | **💎 emoji ao lado de `icon-gem.png` na mesma tela da loja** — Créditos com duas representações, ferindo a regra das três moedas | Emoji apagado. Créditos = `SmIcon name="diamond" tone="ciano"`, um único desenho. Bits seguem **sem ícone**. Emblemas = `military_tech` em cobre + serifa | 3 |
| 4.2 | **`icon-cloud-rain` (nuvem de CHUVA) rotulando "CLOUD BACKUP"**, e o mesmo ícone no DailyReport | Backup → `cloud_done`. DailyReport → `bedtime`/`nights_stay` conforme a linha. Colisão dupla resolvida | 2 |
| 4.3 | **Atributos como PNG e SVG inline na mesma tela de Evolução** | **SVG vence.** Os 3 PNG `icon-attr-*` apagados; `types/attributes.ts` aponta para `AlignmentIcons` | 3 |
| 4.4 | **DreamDex com 30 sonhos; `CLAUDE.md` diz 18** | **O código manda: são 30.** `CLAUDE.md` é corrigido no mesmo PR (é doc desatualizada, não bug de regra). Os 30 ganham sprite próprio | 6 (doc: 0) |
| 4.5 | **13 `Suspense fallback={null}` → tela branca na navegação** | `SmScreenSkeleton`: o Visor fica desenhado, o interior mostra a varredura em `steps()`. Nunca mais tela branca | 3 |
| 4.6 | **Nenhum estado de offline desenhado** | Selo `SEM SINAL / OFFLINE` no bisel do Visor + anel de cobre sem brilho. É do aparelho, então cobre as 114 superfícies de uma vez | 6 |
| 4.7 | Splash `div.sp-link` possivelmente residente no DOM em todas as telas | Verificar com screenshot e remover do DOM ao fim do boot. Se ele existe em toda tela, é chrome global não intencional | 1 |
| 4.8 | `"Planned load: 1 points"` | Pluralização PT/EN no `MorningCheckIn` | 7 (ou junto, é 1 linha) |
| 4.9 | "Refazer o ritual" (DEBUG) visível em produção, destrutivo | Sai de produção | 0 |
| 4.10 | 4 spinners lucide diferentes | `SmLoading`, um só | 3 |

### 4.11 Os 468 emojis — quem vira ícone e quem é conteúdo

**Vira `SmIcon` (era ícone de sistema disfarçado):**
- 💎 dos degraus de troca (§4.1)
- 🌱/🌿/🌳 dos tiers de hábito (`HabitConstancy`) → `eco`/`psychiatry`/`park`
- 🍴 e os demais ícones de **traço de nascimento** em `StatsPage` → conjunto
  Material fixo, um por traço (`restaurant`, `favorite`, `shield`, `casino`,
  `wb_twilight`)
- 🦠/💾/💉 dos chips de atributo → sprites pixel do inventário (§3, Onda 3)
- 🔒 dos itens travados da loja → `lock`
- Os emojis de rótulo de `constants/labels.ts`, `GuideModal` (24) e `HelpModal`
  (35) quando estiverem marcando **seção** — viram `SmIcon`

**Fica como conteúdo (não é ícone):**
- **Os 30 do DreamDex** — são conteúdo do visor, e por isso viram **sprite
  pixel próprio** (Onda 6), não Material. Sair de emoji, sim; virar ícone de
  interface, não.
- **O emoji da atividade escolhido pelo usuário** (`RitualRow`, `TaskMeta`) —
  é a expressão da pessoa. Fica, dentro do selo de 48px (§Onda 4.1).
- **Comida e itens da pastinha** — conteúdo do visor. Mesmo tratamento do dex.
- Emoji dentro de **texto corrido** de fala, toast e mensagem: fica; não é
  ícone. Lembrar que `speak()` já remove emoji das falas.
- `supabase/functions/server/chat.tsx` (40 ocorrências): **servidor, não UI.**
  Fora de escopo deste plano.

---

## 5. Orçamento de complexidade por tela

Teto **duro**, verificável por teste de DOM. Uma tela que estoura não merge.

| Superfície | Teto | Observação |
|---|---|---|
| Moldura/chrome de qualquer tela | **8 ícones simultâneos** | conta HomeHud + cabeçalho + ações do pet |
| `BottomNav` | **4 destinos + menu** | hoje são 5 + menu. **Decisão: a Biblioteca sai da nav** e passa a ser card em Atividades (frequência medida: rara), igual ao Torneio |
| Home, leituras numéricas simultâneas | **5** | ver §5.1 |
| Modal | **1 título + 1 fechar + no máx. 3 ações** | `ConfirmDialog` é o padrão |
| `RitualRow` | **1 selo + 1 checkbox + no máx. 2 metadados visíveis** | o resto entra em "mais" |
| Loja, abas | **5** (já está no teto) | nenhuma aba nova sem tirar uma |
| Cartões contextuais da Home | **1 por vez** | prioridade fixa HP > triagem > semanal > recomeço; resto vira "+N avisos" (item 3 do backlog do PLANO-PRODUTO, adotado aqui) |

### 5.1 A pendência do PLANO-PRODUTO: "o Vínculo só entra na home se duas outras leituras saírem no mesmo PR"

**As duas que saem: os 3 atributos (Poder/Harmonia/Benevolência) e o contador de
Créditos.**

- **Atributos**: são um insumo de *galho de evolução*, não uma leitura diária.
  Já têm casa própria na Evolução ("CURRENT ALIGNMENT"), onde a pessoa está
  justamente decidindo. Na Home são três números que ninguém age sobre. O
  PLANO-PRODUTO já reconhece isso ao propor esconder atributos na criação de
  tarefa até `unlockedEvolutions.length > 1`; esta decisão é a mesma tese, um
  nível acima.
- **Créditos**: moeda de dinheiro real, gasta em reroll/cura/troca — tudo fora
  da Home. Mostrar saldo permanente de moeda paga na tela principal é vitrine de
  loja, e o produto não é isso. Vai para o menu e para a Loja, onde é acionável.

**Ficam na Home**: HP, Energia, contador de rituais x/y, Bits (é a moeda dos
minijogos, ganha na própria sessão) e o Vínculo. **Cinco leituras, no teto.**

---

## 6. Acessibilidade — desenhada, não parafusada

- **Contraste AA** em todo texto de corpo, verificado por **amostragem de pixel**
  (`PIL` sobre o PNG do Playwright ou `getComputedStyle().color`), nunca por
  olho no screenshot — o cinza quase-preto sobre fundo escuro "parece" legível
  (footgun 10).
- **Alvo mínimo 44px** (`--sm-toque-min`) — inclui checkbox de ritual e os
  chevrons, hoje os menores do app.
- **Foco visível** em ciano 2px, ordem de foco declarada, focus-trap + Escape em
  todo modal custom (Onda 5).
- **`prefers-reduced-motion`**: `steps()` vira estado final imediato; nenhuma
  informação existe só no movimento.
- **Silkscreen ≥14px, CAIXA ALTA, nunca frase**. Texto funcional é Rubik.
- Todo `aria-label` em **PT + EN** pelo padrão `language === 'pt-BR'` — já
  houve `aria-label` só em português (regra do `CLAUDE.md`).

---

## 7. Riscos e o que eu recuso

### 7.1 O que estou deixando de fora **de propósito**

1. **Não redesenho a `OraclePage`.** É a maior superfície de emoji do app (55) e
   a mais tentadora de arrumar. Recuso: ela é **inalcançável pela navegação**
   (medido) e é ferramenta interna de criação, não produto. Redesenhá-la é
   pintar uma parede que ninguém vê, e ainda mantém 55 emojis dentro do bundle.
   Ela **sai** do app (Onda 0). Se um dia virar tela de produto, entra como
   produto novo, com plano próprio.

2. **Não crio ícone para os Bits.** É a lacuna mais óbvia da paleta de moedas e
   eu recuso deliberadamente. A ausência de ícone **é** a distinção — é o que
   torna estruturalmente impossível repetir o bug do 💎 compartilhado. Número +
   "Bits" em fonte de calculadora é identidade suficiente, está travado por
   teste, e três ícones de moeda numa tela pequena voltariam a colidir em seis
   meses.

3. **Não ligo os 142 PNGs de `E:\Soulmon-assets\out`.** São trabalho já pago e
   pronto — e é exatamente por isso que são perigosos. Ligá-los reintroduz a
   linguagem raster que o dono decidiu abandonar, e o custo afundado não é
   argumento de design.

4. **Não faço "modo claro do visor".** O interior do visor é escuro nos dois
   temas. Um visor claro é uma tela de LCD apagada; a identidade inteira do
   aparelho depende de o conteúdo brilhar contra o escuro. O tema claro age no
   **casco**, não na tela.

### 7.2 Riscos deste plano

| Risco | Mitigação |
|---|---|
| **Migração parcial** — a onda 5 é a maior e a mais tentadora de fatiar por tela | O critério de "pronto" de cada onda é um `grep` que retorna 0. Ou a classe inteira migrou, ou a onda não fechou |
| **Ondas 1–3 não mudam a percepção do dono** — 3 PRs de "chassi" sem tela nova | A Onda 2 (nav + ações do pet) já é visível todo dia. Se o dono precisar de sinal antes, a ordem correta é 0 → 1 → 2, nunca pular para a 4 |
| **Material Symbols por CDN quebra offline** | Fonte variável **empacotada local** (Onda 1), e o `CACHE_VERSION` do `public/sw.js` sobe junto |
| **`sm-px-*` são ~470 usos em 51 arquivos** | Os componentes do `PixelKit` mantêm a **API** e mudam o desenho; os call sites não são tocados. É o que torna a Onda 5 viável |
| **`dist/` é commitado e `CACHE_VERSION` esquecido prende usuário em cache velho** | Bump obrigatório do `CACHE_VERSION` no PR de cada onda que toca asset ou CSS |
| **Redesenho competindo com a Parte 5 do PLANO-PRODUTO** (telemetria e distribuição são a prioridade dos 30 dias) | Reconhecido. A Onda 0 e a Onda 1 são baratas e destravam tudo; as ondas 4–7 esperam o funil estar instrumentado. **Não proponho parar o plano de produto para pintar telas** |

---

## 8. Resumo em uma tabela

| Onda | Superfície | Entrega | Fecha quando |
|---|---|---|---|
| 0 | — | Demolição: ArenaGame, OraclePage, 6 PNGs, shadcn, kit de 142 PNGs, debug em produção | `tsc`/`vitest`/`build` limpos |
| 1 | Chassi | Tokens, Visor, `SmIcon`, Material local, Silkscreen ≥14px | recorte 200×200 já é Soulmon |
| 2 | **Ícone** | ~35 PNG → Material Symbols Rounded; FILL como estado; sublinhado ciano | `icons/icon-*` só nos "ficam"; lucide fora de 6 arquivos |
| 3 | **Moeda, atributo, carregamento** | 3 moedas separadas, atributos em SVG, `SmLoading`, fim da tela branca | 0 emoji-ícone de moeda; 0 `fallback={null}` |
| 4 | **Diária** | RitualRow, RitualPanel, HomeHud, CompanionHUD, marcador de meta na barra | 0 `sm-card`/`sm-btn` nesses arquivos |
| 5 | **Formulário, lista, modal** | Saída do retrô; shadcn morto; focus-trap; SettingsPage em 4 grupos | 0 arquivo bilíngue; lucide fora do `package.json` |
| 6 | **Interior do visor** | 30 sprites do dex, cerimônia, arcade normalizado, **offline**, empty states | 0 emoji como ícone renderizado |
| 7 | **Onboarding** | 16 templates + os 2 bugs do tutorial | uma vez na vida, feito por último de propósito |
