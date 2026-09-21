# Decisões de wireframe — o que o dono respondeu antes do primeiro desenho

> **Dono:** `soulmon-design-lead` (registro) · decididas pelo **dono do produto** em 13/09/2026,
> em modal, uma a uma · **Estado:** vivo — recebe uma seção por fluxo a cada `decidir`
> **Verificação:** as 20 respostas abaixo casam 1:1 com as 11 dúvidas de
> [INVENTARIO-WIREFRAMES.md](INVENTARIO-WIREFRAMES.md) §3.2 e as 9 tensões de
> [PRINCIPIOS-DE-WIREFRAME.md](PRINCIPIOS-DE-WIREFRAME.md) §14. As cinco que reabrem decisão
> de produto estão também no [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §13.
> **Não cobre:** as decisões por fluxo (entra/volta/sai), que nascem a cada `decidir`.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Onde uma decisão abaixo
> reabre regra, o código ainda faz o antigo até alguém implementar — o wireframe desenha o
> NOVO e marca `[decisão 13/09]` no rodapé.

## 1. Estrutura dos canvases (dúvidas 1–3, 5, 9)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D1 | Sub-aba do pet (`PetPage`, `DreamDex`, `AdventureDiary`) | **Canvas próprio "Pet"** | 11º canvas; desenhado logo após Rituais (P0+). `EVO-22`→`EVO-29` migram para `PET-*` |
| D2 | Biblioteca (social, coop, presentes) | **Canvas próprio "Social"** | 12º canvas; o `soulmon-guarda-linha-vermelha` dá parecer sobre ele inteiro. `CONTA-26`→`CONTA-32` migram para `SOC-*`; o caminho de chegada continua sendo o menu |
| D3 | Posição do Onboarding | **Dividido**: funil (identidade → free/pago → objetivo → escolher personagem) em **5º** (logo depois do canvas Pet, que a D1 acrescentou); ritual do Oráculo em **último** | Dois canvases: `onboarding-funil/` e `onboarding-oraculo/` |
| D5 | `ShopModal` variante sheet (sem `asPage`, sem caminho vivo) | **Registrar como achado, não desenhar** | `LOJA-12` → `fora`; item no STATUS como candidato a remoção |
| D9 | Offline | **Artboard offline nas quatro superfícies de rede** (Biblioteca, Torneio, chat, geração de sprite) | +4 artboards; o `OfflineSeal` continua na raiz |

Ordem final dos canvases: Home · Atividades · Rituais · **Pet** · Onboarding-funil · Evolução ·
Jogos · Loja · Estatísticas · **Social** · Conta · Fora do app · Onboarding-oráculo.

## 2. Conteúdo e estados (dúvidas 4, 6, 7, 8, 10, 11)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D4 | Ramos de save antigo (`STAT-10`, `EVO-23`, `ONB-13`) | **Marcar `fora`; a conta vai ao STATUS** | Não se desenha. Apagar código continua decisão separada do dono |
| D6 | Seis superfícies sem descrição no manual (inclui o seletor de comida, P0) | **Medir no código antes de desenhar** | O cartógrafo acrescenta as subseções ao `03-FLUXO-DE-TELAS.md` §4 e troca `medição faltando` no inventário (rodada de 13/09/2026) |
| D7 | `reduced-motion` | **Artboard extra só onde a ESTRUTURA muda** (ex.: a intercalação de 3 s da evolução vira quadro estático); onde só desliga animação, nota no rodapé | |
| D8 | Idioma do artboard | **Inglês é a língua principal do wireframe** (é a base do produto — "inglês é a base, PT-BR é localização", `CLAUDE.md`). PT-BR vai como nota `PT: …` no rodapé; artboard extra só onde o comprimento muda a caixa (barra inferior, botões de largura fixa) | Corrige o handoff §5 e a regra W2 |
| D10 | Carga do dia (`isOvercommitted`) | **Linha no check-in + peça discreta no topo da lista** quando estourar; convite, sem vermelho | Aviso, nunca bloqueio (`02` §33) |
| D11 | As quatro divergências código × `CLAUDE.md` (loja 2 segmentos, `UnlockNudge` em 6 pontos, microfone vira "enviar", marco espera o gesto) | **Nenhuma reaberta: desenhar como o código faz** | O `CLAUDE.md` é corrigido pelo dono depois |

## 3. As nove tensões pesquisa × decisão (T1–T9)

Cinco foram **reabertas** pelo dono — são decisões de produto novas e estão no
`REGISTRO-DE-DECISOES.md` §13 com a alternativa que perdeu e o gatilho de revisão. Quatro
mantidas.

| # | Tema | Decisão do dono (13/09/2026) | Para o wireframe |
|---|---|---|---|
| T1 | Paywall no reveal | **REABERTA: oferta no reveal** | O reveal ganha a oferta — **dispensável pelo próprio card, largura parcial, container igual ao não-comercial, "agora não" com o peso do primário** (padrão Garmin, `PRINCIPIOS` §8). Sem tabela free × pago, sem preço riscado, sem contagem |
| T2 | Contador do dia no widget | **REABERTA: mostrar o contador** | O widget desenha "N de M" — **só quando ≥ 1 feita** e nunca com verbo de cobrança; a faixa de constância continua. Implementar exige mudar `widgetSemCobranca.contract.test.ts` e a linha do `CLAUDE.md` |
| T3 | "FOMO saudável" (live-ops rotativo) | **Segue a pesquisa** | Visita/conteúdo rotativo semanal **que aparece por tempo mas nunca tira o que já foi ganho** — a proibição #15 ("última chance", FOMO que tira) continua valendo na copy: nada de contagem regressiva nem "expira". Desenhar como ritual, não como tranca |
| T4 | Card compartilhável mensal | **REABERTA: card mensal também** | Dois gatilhos: evolução (existente) e mês fechado — ambos com **piso** (nenhum campo em zero) |
| T5 | Estoque de escudos | **REABERTA: visível sempre, inclusive zero** | Seção "o que você tem" na lista/estatísticas mostra os escudos como posse (leitura Yazio, `MOB §15.5`), zero incluído, **sem placar nem "faltam"** |
| T6 | Prestígio visual (D4: o que dói perder) | **Prestígio visível; escudo NÃO quebra a aura** | A aura de 28 dias (`steadyWindow`) aparece; dia protegido por escudo conta como feito. O que dói perder continua sendo só o coração (teto 1/dia) |
| T7 | Criatura do amigo no estágio real | **Mantido o veto (#21)** | Amigo aparece como é, sem escada nem rank ao lado do seu |
| T8 | Psicométrico invisível | **Mantido invisível** | Nome e descrição no reveal; nada de eixo nem "porque" |
| T9 | Valor antes de cadastro | **Mantido: conta primeiro, com o porquê visível** | A tela de conta desenha o valor (o que a conta guarda, a promessa) ANTES do campo, e o caminho "entrar depois" onde a regra permitir |

## 4. O que muda nos documentos por causa disto

- `HANDOFF-WIREFRAMES.md` §4 (ordem: +Pet, +Social, Onboarding em dois), §5 (inglês principal),
  §8 (as cinco reaberturas saem de "não se reabre").
- `INVENTARIO-WIREFRAMES.md`: `LOJA-12` e os três ramos de save → `fora`; ids `PET-*` e
  `SOC-*`; +4 artboards offline; as seis medições (rodada do cartógrafo).
- `PRINCIPIOS-DE-WIREFRAME.md` §14: coluna "decisão do dono 13/09" apontando para cá.
- `REGISTRO-DE-DECISOES.md` §13: as cinco reaberturas.
- `.claude/skills/squad-design/METODO.md` W2: inglês principal.

## 5. Home: entra / volta / sai (decisão do `soulmon-design-lead`, 13/09/2026)

> **Canvas:** [Soulmon — Wireframes Home](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/home/` (`Main.dc.html` + 27
> `<TelaEstado>.dc.html` + `canvas.json`; 48 linhas `HOME-*` do inventário em 28 artboards).
> **Crítica:** `design-critic` (W1–W10, a11y — rodada 1: "não passa", 6 bloqueantes; rodada 2:
> ver o carimbo no `docs/STATUS.md`), `soulmon-product-designer` (IA/fluxo, com a dobra
> **medida**: "Daily rituals" nascia a 739px com o dock a 722), `soulmon-guarda-linha-vermelha`
> (família **APROVADA COM RESSALVA** — 1 veto cirúrgico, 4 ressalvas que viraram aceite).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. O código ainda faz o antigo;
> o wireframe desenha o novo e marca `[novo]`.

### 5.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| E1 | **Play vira a 5ª célula do deck** (`feed · items · bath · sleep · play`); o PlayCard sai da coluna; o custo viaja no desejo do balão ("Want to play for a bit? It costs 1 energy." `[novo]`); a recusa é fala do pet; célula inerte com `aria-disabled` quando `playedToday` | `02 §13` "Onde a UI mostra" já manda ("na área do pet, junto de banho/dormir/itens, porque é gesto de cuidado, não minijogo"); `PD §5` "cartões contextuais da Home: 1 por vez" (slot + PlayCard eram dois); **fecha a dobra** — "Daily rituals" volta à primeira tela (product-designer §1, medido) | O parágrafo de custo/prêmio antes do toque (mitigado pelo desejo) e o "+ one attribute point" (volta no resultado do minijogo); a linha do buff (`+20% Bits · N min · Data`) sai da Home e vai para o canvas **Jogos**, onde o buff é gasto |
| E2 | **Slot de avisos abaixo do pet** (topo → pet → slot), não acima | O pet é fixo (`.sm-pet-sticky`, `M-vinc §1`) e o cartão do dia não pode mudar a posição do pet nem rolar por cima dele; o slot vira o primeiro item do "que eu faço" (Finch, `MOB §15.1`); o FirstDayCard fica adjacente aos gestos que nomeia | O topo da tela para HP ≤ 1 e para o primeiro dia — HP baixo já está na pose e no medidor; o FirstDayCard continua na primeira tela (o palco tem 200px) |
| E3 | **Medidores dentro do palco** (`HomeHud hideBrand compact`), topo só com `<h1>` + selo do foco; escala **real** (rookie 3 HP / 4 energia; ultra 5/6); rótulo de texto `HP`/`EN` no lugar de glifo | É o que o código faz desde 27/08/2026 ("o dono achou os medidores grandes demais acima do pet", `App.tsx`) — a rodada 1 reproduzia a composição rejeitada; `02 §1`/`progression.ts` para a escala; orçamento de ícones do `PD §5` (moldura = HomeHud + cabeçalho + ações do pet; a BottomNav tem linha própria): deck 5 + chat 1 = 6, + Evolve = 7, teto 8 | Os 2 glifos do HUD; se o segmento vira coração/raio é decisão da **Fase 2** (visual-designer) |
| E4 | **Sombra de contato** elíptica sob o sprite | `M-vinc §4`: única invariante de presença ausente (Finch, Yazio, Abode, Tolan, BitePal) | Nada |
| E5 | **Piso ≥ 1 para todo dígito de "feito"** na Home: HUD sem dígito em zero, `x/y` do painel só com `x ≥ 1`, "not yet today" `[novo]` na linha do hábito | Guarda 8b (`PRINCÍPIOS §4` "qualquer zero exposto"; ledger E4/C-P2); é a **mesma régua** da decisão 13.2 do dono para o widget ("só com ≥ 1 feita") | Nada. **Distinção a escrever uma vez** (pedido do guarda): escudos (13.5) são **posse** — "o que você tem" pode mostrar zero; `N of M` é **dívida do dia** — não pode. Não colidem |
| E6 | **Copy nova** `[novo]`, quatro linhas: aviso de HP sem "— or a rub gives half a heart back"; priming com "One a day. You can turn it off in Settings."; recomeço "Postponed items start from zero. Your evolution, habit milestones and dream collection stay exactly as they are."; desejo de brincar com o custo | Guarda 1b (perdão que esvazia: dois caminhos no mesmo prato), 1d (`PRINCÍPIOS §3`: escopo + reversibilidade), 1e ("nagging" nomeia uma cobrança que o produto declara não ter); E1 | Nada de regra: as quatro mudam só superfície. Viram tarefa de copy do `staff-frontend` na implementação |
| E7 | **Regra única de "não dá agora" no deck** (rodada 3): **célula inerte** (`aria-disabled`, borda tracejada, rótulo diz o porquê `[novo]`) = a ação não existe agora por regra — Bath em cooldown, Play já usado hoje, Play antes da primeira conclusão (`!jaConcluiuAlgo`, o gate que o cartão já tinha); **célula viva + fala do pet** = a ação existe e a criatura recusa — barriga cheia, sem energia, HP cheio. Nunca toast para recusa de cuidado | Crítico r2 #2–#4: o deck tinha três respostas para "não dá agora"; `02 §13` ("a recusa não é erro vermelho: é uma frase do pet"); `PRINCÍPIOS §13` (toast só para transição de estado) | Os dois toasts 🎈 de `handlePlay` ("We already played today! More tomorrow." / "A snack first, then we play.") — a recusa muda de canal `[novo — estrutura]` |
| E8 | **`HomeRolado`** (lista sob o pet fixo) e a **fronteira do sticky** desenhada em todo artboard de tela cheia | Crítico #9 e product-designer: a interação central (BitePal, `M-vinc §1`) não aparecia; a lista ganha 356px (≈ 6 linhas) ao rolar | Nada |
| E9 | **Ordem de foco** numerada e única em todo artboard de tela cheia e em toda folha (× por último, Escape anotado); rótulos reais do chat ("Record message · Send message · Stop recording · Sending message…"); `aria-disabled` e `aria-valuenow/max` onde o estado existia só por cor | W10 é o único aceite executável; crítico #3, #6, #14, #16 | Nada |

### 5.2 Volta (a crítica pediu; o lead recusa ou adia, com motivo)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Restringir a pastinha (Items) aos itens especiais — hoje ela também alimenta comida comum, duplicando a folha Feed (W4 cruzado, product-designer §5) | **Decidido pelo dono (14/09/2026): pastinha só com especiais** → `REGISTRO` 13.6 | Era regra, não wireframe; o canvas Loja/Atividades desenha a pastinha sem comida comum; a Home fica como está (a folha Alimentar é a única porta da comida) |
| V2 | Calar o pulso de presença de 3 min (`getIdlePhrase`) | **Volta parcial**: o pulso fica, o léxico muda | `M-vinc §8` pede trocar a frase, não calar; sai só o léxico de cobrança (ver S4). A fome vira pose + o desejo único de `needsAttention` (`02 §13`) |
| V3 | Skeleton "em forma de página" (GoFundMe, `MOB §3`) | **Volta**: desenhado como o código (visor 56×40 + "LOADING") | D11 (desenhar como o código faz); a proposta vai ao `docs/STATUS.md` como dívida, não ao wireframe |
| V4 | Tirar o lápis da `RitualRow` (3 controles contra `PD §5` "1 selo + 1 checkbox + 2 metadados") | **Adiado → canvas Atividades** | A linha é átomo do fluxo Atividades (inventário §0: "a composição fica na página; o átomo fica no fluxo que o possui") |
| V5 | Palco ≤ 140px (crítico #1) | **Volta**: 200px | `STAGE_HEIGHT = 250` e `PET_BOX = 152` no código; 140 não comporta o sprite. A dobra fechou por E1 + E2, não por encolher o pet |
| V6 | Feed e Items inertes no dia 1 com `foodStock = 0` (product-designer #7; entrou na rodada 2) | **Volta** ao código (rodada 3) | Crítico r2 #4: `MOB §15.1` limita por **pose**, não por engenharia; a folha vazia é a superfície que ensina de onde vem a comida (`CompanionHUD.cta.test.tsx` exige que o vazio explique); duas regras para a mesma condição (dim no D1, folha vazia no D2+) seria pior que uma |
| V7 | Nível do Vínculo em dígito sob o nome (`02 §55` "nível e título") | **Volta**: só o título ("Companion") | Teto de 5 leituras (`PD §5.1`) e piso de dígitos; o nível continua na ficha do pet (canvas Pet). Reversível na Fase 2 |

### 5.3 Sai (o que a Home de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **EvoTrail** (trilha de estágios ao lado da lista) | Escada Rookie→Mega com o nível marcado fora da própria tela — altura, não galho (`PRINCÍPIOS §6`; `MOB §16.2`; `M-LV §2` E3); "Locked future form" é o vocabulário que §6 manda trocar por `???`; devolve 54px à lista; o destino (`setCurrentView('evolution')`) é a célula 3 da barra, a um toque. Guarda 7 e product-designer 2a concordam |
| S2 | **PlayCard** como cartão (título, parágrafo, botão, `aria-live`) | E1 |
| S3 | **Medidores acima do palco** | E3 (composição rejeitada em 27/08/2026) |
| S4 | **Léxico de cobrança da fala idle**: `companionNeedHelp` ("I need your help! Complete tasks to keep me healthy!"), "Feed me!", "Clean me!", "Let's keep going!" | `M-vinc §8`; `PRINCÍPIOS §1` proibido (fala idle que pede trabalho); guarda 2b APROVADO |
| S5 | **Dígito "(N)" do "Tidy the pile"** | **VETADO** pelo guarda (1c): `02 §34` — não mostra total de pendências no topo; o contador mostra o que JÁ foi decidido, dentro da folha. O botão fica |
| S6 | "— or a rub gives half a heart back" · "pending nagging is cleared" · vermelho `sm2-notice-warn` no aviso de HP | Guarda 1b, 1e; W6 |
| S7 | Balão idle na Home vazia e no dia 1; linha de Vínculo abaixo do nível 2 | `PRINCÍPIOS §1` (nunca frase que descreve estado; nunca `0/75` sob o nome); `bondTitle()` devolve `null` |

### 5.4 O que fica registrado para depois (não muda agora)

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (E1, E2, E7 entram; 13.6 pastinha só especiais; 13.7 posse × dívida). Registro do que foi apresentado: (1) E1, E2 e E7 são as mudanças estruturais da Home — a recomendação era aprovar as três; (2) V1 (pastinha só especiais?) é decisão de regra sua; (3) a distinção posse × dívida de E5 fica escrita aqui para não colidir com a 13.5.
- **Para o cartógrafo:** a condição de `HOME-08` está errada (`hideMeters` é fixo no topo desde 27/08; o toggle é `HOME-05`); "retorno após ausência" (`welcomeBackLine`) e "Home rolada" não têm linha — anotado no inventário §2.1.
- **Para o `docs/STATUS.md` (dívidas):** o `ScreenSkeleton` não tem a forma da página (V3); o `HomeHud` entrega a regra por `title=` (invisível no toque/teclado); "+10%" não existe — o código imprime `+20%` (`PLAY_BUFF_MULTIPLIER = 1.2`), e o número deve ser dado, nunca escrito à mão.
- **Para o `staff-frontend`, quando implementar:** a lista de S1–S7 e E1–E7 é o diff da Home; nenhum item muda regra de jogo (`02`); as copies `[novo]` passam pelo `soulmon-guarda-linha-vermelha` como critério de aceite (já dado neste parecer).

## 6. Atividades: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Atividades](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1)
> (rodada 3 — carimbo do `design-critic` na rodada 2, ressalvas de amostra aplicadas) · arquivos em `docs/design/wireframes/atividades/` (`Main.dc.html` + 16
> `<TelaEstado>.dc.html` + `canvas.json`; 27 linhas `ATIV-*` em 17 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 9 bloqueantes — quase todos de fidelidade ao
> código; **rodada 2: CARIMBO passa**; rodada 3 aplicou as 7 ressalvas de amostra R1–R7), `soulmon-product-designer` (achado que
> mudou o canvas: o CTA da Home abre o `EditModal`, não o `CreateModal`; `handleAddNewTask` não
> tem chamador), `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** — 3 vetos
> cirúrgicos, todos de copy/superfície).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. As regras fechadas na Home
> (§5: piso de dígitos, regra de canal, célula inerte × recusa do pet) valem aqui.

### 6.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| A1 | **Um só modal de criação**: o CTA "+ New Activity" abre o `CreateModal` (uma linha de captura + "More options" fechado, como o código já desenha); o `EditModal` só edita | Hoje o CTA abre o `EditModal` sem `initialData` ("`create_modal` só abre a partir da tela de evolução", `App.tsx`) e `handleAddNewTask` não tem chamador — tarefa avulsa na Home só nasce pela barra; dois modais de criação são W4 cruzado (product-designer §6) | O funil "home_edit × create_modal" (duas populações na telemetria) muda de nome; **ATIV-18** (teto do demo dentro do `EditModal`) perde o caminho vivo — vira achado no STATUS, como o `LOJA-12` |
| A2 | **Linha de hábito com dois metadados**: a janela de 7 e o glifo de maturidade (a aura de 28 dias é tratamento do glifo, não chip). "N of the last 7", escudos, legenda e "Nothing resets here" vão para a **ficha do hábito**, no topo do `EditModal` (1 toque no nome) | `PD §5` (1 selo + 1 checkbox + máx. 2 metadados, "verificável por teste de DOM"); `M-const §1` (aura "já vestida" no ícone); a dobra: 358px sob o pet fixo, linha de 77px → 60px = 6 hábitos em vez de 4 (product-designer §2) | O dígito de constância na Home (fica no `aria-label` da janela e na ficha) |
| A3 | **Tarefas concluídas hoje ficam no fim do painel**, riscadas e inertes, lidas de `completedTasks` | A regra `completeTask` (remove de `tasks`, alimenta meta/selo/relatório; 6 testes) **não muda**; muda a superfície: o mesmo gesto tinha dois comportamentos (hábito feito fica, tarefa feita some); Finch mantém como prova (`MOB §15.5`); Todoist mostra no fim; a pergunta da tela é "o que eu escolho fazer" — o restante vem primeiro | ~60px por tarefa feita; a linha é `aria-disabled` (não existe desconcluir — dar undo seria regra) |
| A4 | **Cabeçalho `feitos/total` sobre o dia devido**: o denominador exclui o hábito fora do dia; o numerador inclui as concluídas de hoje; dígito só com feitos ≥ 1 | Guarda 1a (hábito inerte no denominador é dívida que não dá para pagar hoje: "5/5" nunca fecha num dia de hábito leve); E5/13.7 (piso); o código hoje conta só `tasks` (a concluída sai da conta) — achado para o STATUS | Nada de regra: é o cálculo da UI |
| A5 | **Carga do dia = 7ª entrada da fila 2** (`… → recomeco → carga`), como texto `role="status"` sem moldura, só depois do check-in e só enquanto `plannedEffort > OVERCOMMIT_EFFORT` (estritamente maior) | D10 (decisão do dono) + W7 (superfície nova entra numa das duas filas, com posição declarada); `PRINCÍPIOS §2` (aviso de carga é texto); a moldura tracejada era o léxico de célula inerte (Home E7) | Quando HP ≤ 1 e carga coincidem, a carga vira "+1" — HP é mais urgente. `filaDeAvisos.contract.test.ts` ganha a 7ª chave (estrutura). **Dívida registrada:** a lista não tem gesto de "amanhã"; o convite aponta para editar "When I plan to do it" (não contado, `02 §30`), nunca um `postpone` contado (guarda 3) |
| A6 | **Escudos por hábito** (T5/13.5): na lista só `> 0` (como o código); **zero visível na ficha do hábito e em Estatísticas**, três casas de `REST_SHIELD_MAX`, casa vazia = losango vazado (nunca o glifo de "não devido"); frase única para os dois estados `[novo]`: "They arrive with steady weeks and step in on their own when a day slips." | `HabitRhythm.shields` é **por hábito** (`earnShield(rhythm)`) — uma linha agregada mentiria (product-designer §5); três contornos × N hábitos na Home leem "você não tem" 3N vezes (`HabitConstancy.tsx`); guarda 2e ("Spent automatically…" sob casas vazias diz que foram gastos) | O "sempre visível" do dono fica a um toque (ficha) e em Estatísticas — não na linha da Home |
| A7 | **Copy nova** `[novo]`: título do nudge do teto "Want a ceiling that grows with you?" (o código diz "Want to create without limits?" — **VETADO** pelo guarda 4b: o pago tem teto, `activityCapFor`); "M steps" no lugar de "0/M steps"; "done today" no subtítulo da concluída | Guarda 4b (precedente C-S1: o app mentindo na tela em que cobra); piso E5 | Nada de regra; lote WP5.9 |
| A8 | **Estado "0 das últimas 7" = silêncio** (janela + glifo, nenhuma frase) | Guarda 2a: "não uma frase de consolo, que seria cobrança com sorriso"; piso E5 | Nada |

### 6.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Confirmação de "Delete" que nomeia o que vai ("This habit is a Sapling — 30 days.") ou "Put aside" para hábito (guarda 4e) | **Decidido pelo dono (14/09/2026): confirmar nomeando o marco** → `REGISTRO` 13.8 | Era regra (apagar hábito com histórico apaga marco, `02 §28`); o wireframe desenha o Delete como o código (abaixo, quiet, separado do primário) |
| V2 | Copy da recusa da barra "That didn't fit — you've reached your item limit." → "free mode holds N active habits. One-off tasks still fit." (guarda 9a) | **Volta ao código no canvas; vira critério de aceite** | W2 (texto real); a alternativa está na nota do artboard para o `staff-frontend` |
| V3 | Passos aceitos no nudge: substituem a tarefa ou somam? (guarda 5) | **Decidido pelo dono (14/09/2026): somam à mesma tarefa** → `REGISTRO` 13.9 | Regra do `onDecompose`; sem zeramento novo |
| V4 | Recompensa material ao terminar a triagem ("terminar rende recompensa", `CLAUDE.md`) | **Sai** (guarda 6d: VETADO; não existe no código — divergência já registrada em `02 §34`) | #16/#19; a copy real "You decided on N items…" fica: N é decidido (feito ≥ 1) |
| V5 | Foco do dia (0/1/2/3) na lista (`PRINCÍPIOS §2` estados) | **Não desenhado** | `02 §32` "Onde a UI mostra" = check-in e selo do HUD; inventar seria funcionalidade sem regra — lacuna registrada |

### 6.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O segundo modal de criação** (`EditModal` como criação) e, com ele, o teto do demo dentro do `EditModal` (ATIV-18) | A1; guarda 4d (trancar edição no teto seria paywall que interrompe fluxo — o código não tranca edição, `blocked = atCap && !initialData`) |
| S2 | **A linha agregada de escudos "para a lista inteira"** (rodada 1) e as casas vazias na linha da Home | A6 |
| S3 | **"N of the last 7" na linha** (vai para a ficha) | A2 |
| S4 | **"Want to create without limits?"** | A7 (veto 4b) |
| S5 | **A tarefa concluída que some da lista** (superfície; a regra fica) | A3 |
| S6 | **O cartão tracejado de carga do dia** (rodada 1) | A5 |
| S7 | O lápis — **não existe no código**; a rodada 1 o marcava como `[novo]` por engano (crítico B9). O nome da linha É o botão de editar | `RitualPanel.tsx`, decisão 5 do cabeçalho |

### 6.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (A1–A8 entram; 13.8 confirmar Excluir nomeando o marco; 13.9 passos do nudge somam). Registro do que foi apresentado: A1, A2, A3 e A5/A6 eram as mudanças estruturais — a recomendação era aprovar as cinco.
- **Para o cartógrafo:** `03 §4.5` está defasado em dois pontos (CTA → `CreateModal`; "toque no lápis"); `03 §4.1` diz "tarefas por `completed`" (concluídas nem estão em `tasks`); `ATIV-05` no inventário descreve a regra certa e a prova errada; `ATIV-18` deixa de ter caminho vivo.
- **Para o `docs/STATUS.md` (achados):** `feitos/total` cego às tarefas concluídas (`App.tsx`); `"0/3 steps"` impresso antes do primeiro passo (fura o piso); "Bring back" a 36px; "Want to create without limits?" (C-S1); `handleAddNewTask` sem chamador; o `CLAUDE.md` promete recompensa na triagem que o código não tem.
- **Para o `staff-frontend`:** A1–A8 e S1–S7 são o diff do motor de tarefas; nenhum item muda regra de jogo (`02`); as copies `[novo]` passam pelo guarda como aceite (dado neste parecer); a régua A4 é da UI, não do motor.

## 7. Rituais: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Rituais](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/rituais/` (`Main.dc.html` + 20
> `<TelaEstado>.dc.html` + `canvas.json`; 26 linhas `RIT-*` em 21 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 5 bloqueantes B1–B5 + 7 ressalvas — todos
> aplicados na rodada 2), `soulmon-product-designer` (10 achados; o que mudou o canvas: o
> `FirstTaskCompletedPopup` monta POR BAIXO dos intersticiais e o gatilho vive neste canvas; a
> ordem do relatório; o retorno de ausência), `soulmon-guarda-linha-vermelha` (família **APROVADA
> COM RESSALVA** — 1 veto de copy, 4 vetos ao código que o canvas já corrige, 9 ressalvas que viram
> aceite, 3 decisões para o dono).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. As regras fechadas na Home
> (§5: piso de dígitos, regra de canal, ordem de foco) e em Atividades (§6: léxico da janela de 7,
> carga como 7ª entrada da fila 2) valem aqui.

### 7.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| R1 | **O mapa completo do que vive fora das duas filas** (RIT-01): a cerimônia do marco (z-300) e a de evolução (z-500) de propósito; o `ProtectProgressModal` e o `FirstTaskCompletedPopup` **sem posição declarada**; o canal de VOZ (`falar`, `welcomeBackLine` no HUD, toast) como terceiro canal | W7 (superfície nova entra numa das filas, com posição declarada); `03 §3.1`; crítico B5/N2/N5; product-designer #1/#6/#10 | Nada — o quadro só passa a dizer a verdade: `interstitial === 'welcome'` é a condição de montagem do welcome prompt, não "nada aberto" |
| R2 | **Relatório em ordem de tempo**: ONTEM inteiro (linhas · notas · aventura · memória) → a pergunta de HOJE (humor) → convite → "Start the day" `[novo — estrutura]` | W4 (o humor é a única pergunta de hoje e fica colada ao CTA de hoje); product-designer #4; `02 §12` não é reaberto (o humor continua no relatório) | Nada de regra: nada entra nem sai, só a ordem do DOM |
| R3 | **Um caminho de volta por superfície**: a nota "A rub gives half a heart back, if you feel like it…" sai do relatório; o botão "I did it, forgot to log" fica | Guarda 1b (dois caminhos no mesmo prato — mesma ressalva da Home E6); o carinho é gesto da Home e se ensina lá (E7) | A menção ao carinho no relatório |
| R4 | **Retorno de ausência com o pet na peça**: o sprite no lugar do ícone e UMA linha da família `welcomeBackLine` (faixa de ausência, `welcomeBack.ts`, teste "nenhuma frase menciona o que ficou"); o **N de dias fora sai**; "Complete days saved" some com `perfectDays === 0` `[novo — estrutura]` | PRINCÍPIOS §4 ("quantificar a ausência é criar uma consequência para depois anunciar que ela não existe"; Lovi; Finch linha 1); `02 §45` (`AbsenceBucket`: faixa, nunca o número cru); guarda 1c (VETADO o "You were away N days" do código); product-designer #6/Q5 (uma fonte só de copy) | A frase do código "You were away N days and your Soulmon lost nothing waiting…" |
| R5 | **Piso de dígitos nos rituais** (E5/13.7 aplicados): "· chosen focus: 0" e "Planned load: 0 points" somem; "Yesterday's tasks" vira **"not logged"** com coração cobrado e some sem cobrança; no semanal a linha "N tasks done · N effort points" some com `tasksDone === 0`, e cada hábito tem **uma anatomia** — janela de 7 (léxico A2) + "N of M" só com N ≥ 1; plurais reais ("2 tasks", "1 point") | E5/13.7; guarda 4a/4c/4d/4e (VETADOS no código: "0 of 4", "chosen focus: 0"); crítico B2/R2; product-designer #5/Q4 (sem a linha, "I did it, forgot to log" perde o referente) | O "of M" quando feitos = 0; o "(s)" do código |
| R6 | **Estado "aceitei" da oferta reduzida** `[novo]`: o botão vira chip preenchido "Stretch · counted" — sem prêmio, sem confete | `02 §27` ("conta como feito" é literal); product-designer #3 (hoje o plano é congelado e nada muda na tela — achado) | Nada |
| R7 | **Copy nova** `[novo]`: "You two have a history now." no lugar de "You're on a good streak!" (`ProtectProgressModal`, `reason === 'streak'`) | Guarda 5a — **VETADO** o título do código: não existe streak (o gate é `completedTasks.length ≥ 5`); é o vocabulário que o produto trocou por constância, numa tela que pede dado pessoal (precedente C-S1: o app mentindo na tela em que pede); T9 | Nada de regra; lote de copy do `staff-frontend` |
| R8 | **Primeira tarefa concluída como cerimônia**: o sprite na peça (com o 🌱), uma frase, um botão; e a peça muda de classe — sai da `ModalSheet` (z-120, sob os intersticiais) para a classe da cerimônia do marco (fora das filas de propósito, z-300, espera o gesto) `[novo — estrutura]` | W7 (hoje monta POR BAIXO de um intersticial aberto, invisível, com trap próprio — e o gatilho é o "just 5 minutes today?" de RIT-06); PRINCÍPIOS §5 (é celebração, não folha de sistema; Alan: prova pelo uso); crítico N2; product-designer #1/Q5 | A folha; o "Got it" pode virar saída relacional na implementação (copy do lote) |

### 7.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | × no topo da cerimônia do marco (rodada 1, PRINCÍPIOS §5 "composição de 9 apps") | **Sai** | Crítico B3: `MilestoneCeremony.render.test.tsx` trava UM botão (teste > docs); × é postura de DISPENSA e o produto escolheu RELAÇÃO (Ahead, MOB §6A). Escape = o mesmo `onDone` cobre o teclado — vai como aceite a11y (ver STATUS) |
| V2 | A linha de carga do check-in reagindo ao foco ESCOLHIDO (hoje lê `plan.plannedEffort` congelado e ignora `focusEffort`) | **Adiado → STATUS / `staff-frontend`** | É comportamento do motor, não superfície; o wireframe desenha o código (D11). É a única tela em que a carga ainda é decisão — a proposta fica registrada |
| V3 | Versão máxima do retorno: sem as duas linhas de extrato ("Hearts untouched", "Complete days saved" → Estatísticas) | **Volta parcial** | O pet e a linha entram (R4); as linhas ficam — são o código, "Complete days saved" é posse (13.7) e some em zero |
| V4 | A missão semanal `mood-checkins` (2 Emblemas) recompensa responder um dado que a regra declara opcional e fora de pontuação (guarda 5b) | **Decidido pelo dono (14/09/2026): a missão fica, com alvo 5 em vez de 3** → `REGISTRO` 13.10 | É regra (`02 §12`, `02 §50`); o wireframe já desenha as carinhas sem rótulo de prêmio |
| V5 | "1×/semana" da oferta: hoje `offerShownWeek` é carimbado no TOQUE, não na exibição — na prática "todo dia completo até tocar ou dispensar" (guarda 3a-ii) | **Decidido pelo dono (14/09/2026): conta ao MOSTRAR** → `REGISTRO` 13.11 | É regra (`offerMoment.ts`); o guarda recomenda carimbar ao mostrar (o que WP5.1 aprovou) |
| V6 | O carinho continuar lembrado no relatório (guarda, decisão 3) | **Sai** (R3) | É superfície, não regra: um caminho por tela |

### 7.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"You were away N days…"** — o número de dias fora | R4 (PRINCÍPIOS §4; `02 §45`; guarda 1c) |
| S2 | **"0 of 4"** (semanal), **"0 task(s) done · 0 effort point(s)"**, **"chosen focus: 0"**, **"Planned load: 0 points"**, **"Yesterday's tasks 0 of M"** | R5 (E5/13.7; guarda 4a/4c/4d/4e) |
| S3 | **A nota do carinho no relatório** | R3 (guarda 1b) |
| S4 | **"You're on a good streak!"** | R7 (guarda 5a) |
| S5 | **O × da cerimônia** (rodada 1) | V1 |
| S6 | **O 4º candidato de foco sem pendência de ontem** (rodada 1, RIT-03) — sem `carryOver` o teto é 3 (`suggestedFocus.slice(0, 3)`) | Crítico B1 |
| S7 | **"(s)"** nos plurais do semanal | R5 |
| S8 | **A `ModalSheet` da primeira tarefa** (a peça vira cerimônia) | R8 |

### 7.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (R1–R8 entram; 13.10 `mood-checkins` fica com alvo 5; 13.11 a semana da oferta conta ao mostrar). Registro do que foi apresentado: R2, R3, R4, R5 e R8 eram as mudanças estruturais — a recomendação era aprovar as cinco; V4 e V5 eram decisões de regra do dono (o guarda recomendava tirar a missão; o dono preferiu mantê-la com alvo maior).
- **Para o cartógrafo:** `RIT-15` no inventário diz "item na pastinha → `applySpecialItem`" — é `handleRecoverHearts`, sem item; `03 §4.21` diz que o gate "substituiu" o `setTimeout(15 s)` — os dois coexistem ("o timer fica", `App.tsx`); `03 §3.1` precisa dizer que `interstitial === 'welcome'` monta o welcome prompt E libera o `ProtectProgressModal` (duas `ModalSheet` juntas); `RIT-26` não tem posição nas filas (R8); `RIT-13` "Forms lived" são nomes de estágio, não tiers.
- **Para o `docs/STATUS.md` (achados de código):** (a) `FirstTaskCompletedPopup` z-120 sob os intersticiais, fora do `filaDeAvisos.contract.test.ts`, alcançável pela oferta reduzida; (b) `ProtectProgressModal` × `WelcomePromptModal` no mesmo valor de `interstitial`; (c) a linha de carga do check-in cega ao foco escolhido; (d) `WeeklyReportCard` imprime "0 of 4", "0 task(s) done" e "(s)"; (e) oferta reduzida sem estado pós-aceite (plano congelado); (f) `MilestoneCeremony` `role="status"` sem trap nem Escape — Tab vaza para o check-in sob o véu; (g) "You're on a good streak!"; (h) `restDayUsed`/`weeklyRelief` sem `!welcome` (podem aparecer no retorno); (i) `offerShownWeek` gravado no toque; (j) "You were away N days"; (k) "chosen focus: 0"; (l) o comentário "some sozinha em 2,5s" (já em `03 §6`).
- **Para o `staff-frontend`:** R1–R8 e S1–S8 são o diff dos rituais; nenhum item muda regra de jogo (`02`) — V4 e V5 são regra e esperam o dono; os aceites do guarda viram critério: 1a (nenhuma superfície fora do check-in repete a oferta reduzida nem conta faltas), 2e (a raridade do sonho nunca vem com causa, comparação ou à noite), 3a-i (`heartsLost === 0` como trava explícita da oferta), 5b (as carinhas sem rótulo de prêmio), 5c (`soulStruggle` só na oferta reduzida — nunca push, chat ou telemetria), e "Escape = `onDone`" + `role="dialog"` na cerimônia.

## 8. Pet: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Pet](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/pet/` (`Main.dc.html` + 8
> `<TelaEstado>.dc.html` + `canvas.json`; 7 linhas `PET-*` em 9 artboards — `PET-02` é `fora` por D4).
> Canvas próprio por **D1** (os ids `EVO-22`→`EVO-29` viraram `PET-01`→`PET-08`; inventário §1.4a).
> **Crítica:** `design-critic` (rodada 1: "não passa", 1 bloqueante sistêmico B1 + 2 ressalvas — aplicados
> na rodada 2), `soulmon-product-designer` (8 achados; o que mudou o canvas: as sub-abas desenhadas com
> semântica que o código não tem; a data das formas mora no `FormAlbum`; a coluna sem wayfinding),
> `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** — 1 veto ao `[novo]` da rodada 1
> que suprimia o "0 of 30": reverteria 13.7 sem evidência nova).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem aqui E5/13.7 (posse × dívida),
> A6 (zero de posse como texto quieto) e D4 (save legado = fora).

### 8.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| P1 | **Dex vazio sem a barra de progresso em 0% e sem as frações "0 of 12 / 0 of 10 / 0 of 8"** — só enquanto as TRÊS raridades estão em zero; o dígito "0 of 30 · dreams discovered" **fica**, como texto quieto | PRINCÍPIOS §9 (Reddit: barra suprimida no zero; "zeros em série"); guarda 1b/1c; 13.7 + A6 (posse pode mostrar zero, como linha quieta — nunca banner + cadeado, que é o anti-padrão Withings); é branch `collected === 0` no `DreamDex.tsx`, não CSS | A barra vazia e o "0 · 0 · 0" do dia 1 |
| P2 | **Célula obtida do Dex ganha "#NN · data"** (`#NN` = índice GLOBAL no `DREAM_CATALOG`, 1–30; a data = `rest.dreamDates[id]` via `collectedAt`); o não obtido fica só com "???" | PRINCÍPIOS §9 ("data no obtido" — Reddit/Runna; "número de catálogo" — Finch #25); `02 §45` (o save já carimba a primeira data e a UI nunca a mostrou); crítico R1 (o número tem de vir do dado, como o "+20%"); guarda 1d | Nada de regra: `collectedAt` devolve `null` em save antigo → célula só com o nome (nunca data inventada) |
| P3 | **Sub-abas desenhadas como o código**: três `<button>` (`sm-btn` / `sm-btn-secondary`), o ativo só por classe — sem `tablist`, sem `aria-selected` | D11; crítico B1 (a rodada 1 desenhava um `tablist` que o código não tem, sem `[novo]`, e ainda numerava três paradas de Tab — um tablist real tem uma) | A semântica de aba vai ao STATUS como dívida a11y (roving-tabindex + setas é implementação, não wireframe) |
| P4 | **Estados da ficha que o inventário não tinha**: habilidades antes do "power N" chegar (o par qualitativo pinta primeiro), classe ainda não computada, o vazio (`formas.length === 0`), save que aponta para forma fora da lista (cai na última alcançada) | W3; `PetPage.tsx` (três `try/catch` independentes: "sem classe é melhor que sem página"); crítico item 3 (achado, rota certa = cartógrafo) | Nada |

### 8.2 Volta (a crítica pediu ou a rodada 1 tinha; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Suprimir o dígito "0 of 30" no Dex vazio (rodada 1) | **Sai — VETADO pelo guarda (1a)** | Reverteria 13.7 ("coleção é posse, pode mostrar zero") sem evidência nova; a régua já fechada em E5/A6 é a mesma: o dígito como texto quieto não é o padrão Withings (cadeado + vermelho + banner). Não vai ao dono |
| V2 | A data das formas anteriores na ficha ("Who they used to be") — PRINCÍPIOS §9 "data no obtido" | **Adiado → canvas Estatísticas, com recomendação** | Uma casa só (guarda 2a): o `FormAlbum` (STAT-08) já lê `collectedAt(reachedAt, id)` e é peça de COLEÇÃO; a ficha continua narrativa (Finch Micropet, MOB §15.3: a data mora no rodapé da coleção, não na ficha de identidade). Duas superfícies com a mesma data seria W4 cruzado |
| V3 | Wayfinding na coluna ficha → Dex → diário (chips de salto, ou cabeçalhos `sticky`) | **Adiado → STATUS / lead** | Não inventar navegação; a proposta menor (os `h2` de seção como `.sm-pet-sticky`, padrão já do dono) fica registrada. As setas ▲▼ do canvas são anotação, não componente |
| V4 | Um `Suspense` só para os três blocos (três "LOADING" empilhados leem como três falhas) | **Adiado → STATUS** | É custo medido (o chunk mais lento seguraria a ficha), não decisão de wireframe; desenhado como o código (D11) |
| V5 | A transição do primeiro sonho obtido (o dia em que `collected` vira 1) e a forma nova na ficha como momento | **Não desenhado** | O momento do sonho é o `MorningDream` (RIT-16, canvas Rituais); a forma nova é a `EvolutionCeremony` (canvas Evolução) — o Pet é o arquivo, não a celebração (PRINCÍPIOS §5 × §9) |

### 8.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A barra de progresso em 0%** e as três frações em zero no Dex vazio | P1 |
| S2 | **O `tablist` da rodada 1** | P3 (B1) |
| S3 | **A miniatura de 56px empilhada em cartões iguais** (a ficha antes do revamp — ⚰️ já saiu do código) | `PetPage.tsx` cabeçalho |
| S4 | **Nível numérico, "N/M formas", escada Rookie→Mega na ficha** | PRINCÍPIOS §6 (altura fica na própria tela de Evolução); `02 §14` |
| S5 | **A seção "What they can do" no save legado** (`PET-02`) | D4: `fora`; não se desenha |

### 8.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (P1–P4 entram; sem decisão de regra nova — a tensão 13.7 × §9 foi resolvida pelo lead com a régua já aprovada em E5/A6). Registro do que foi apresentado: P1 e P2 eram as mudanças estruturais — a recomendação era aprovar as duas.
- **Para o cartógrafo:** o estado vazio da ficha (`formas.length === 0`) existe no código e não tem linha no inventário; as duas habilidades do estágio **não têm seção no `02-REGRAS-DE-NEGOCIO.md`** (a regra vive só em `utils/soulProfile/ficha/skills` — o `02 §15` é atributos e galhos); a data das formas tem de ter UM dono de tela (V2).
- **Para o `docs/STATUS.md` (achados de código):** (a) `DreamDex` sempre renderiza contador + `progressbar`, mesmo em zero; (b) `dreamDates` carimbado no save e nunca exibido; (c) a fileira de sub-abas são três `<button>` sem grupo nem estado ativo para leitor de tela; (d) a sub-aba Soulmon não tem sinal de posição ao rolar (ficha → Dex → diário); (e) três `ScreenSkeleton` empilhados; (f) as habilidades do estágio sem seção no manual.
- **Para o `staff-frontend`:** P1–P4 e S1–S5 são o diff do Pet; nenhum item muda regra de jogo; aceites do guarda: 1c (as frações somem só com as três em zero), 2a (a data das formas em uma casa só).

## 9. Onboarding-funil: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Onboarding-funil](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/onboarding-funil/` (`Main.dc.html` + 16
> `<TelaEstado>.dc.html` + `canvas.json`; 25 linhas `ONB-*` do funil em 17 artboards — `ONB-13` é `fora` por D4).
> Por **D3** o Onboarding são dois canvases: este é o FUNIL (splash → intro → portão → perguntas → grátis ×
> completo → personagem → cadastro demo → tutorial); o ritual do Oráculo (`ONB-21`→`ONB-33`, `35`→`38`) é o
> último canvas.
> **Crítica:** `design-critic` (rodada 1: "não passa", 4 bloqueantes B1–B4 + W3 — aplicados na rodada 2),
> `soulmon-product-designer` (6 achados; os que mudaram o canvas: o nascimento demo sem a criatura, o
> objetivo perguntado duas vezes, a justificativa do campo), `soulmon-guarda-linha-vermelha` (família
> **APROVADA COM RESSALVA** — nenhum veto; 2 ressalvas: rotular o estado pós-marcação em ONB-09 e a
> disclosure da IA no tutorial).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem T9 (conta primeiro, com o porquê),
> D4 (rascunho = fora), D8 (o objetivo não sai do aparelho para ordenar), D11.

### 9.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| O1 | **O sprite grande do personagem escolhido no cadastro demo** (`ONB-34`), na tonalidade escolhida | O caminho grátis nasce sem a criatura na tela do nascimento — o `REGISTER` demo não tem `<img>` (product-designer #1, fatal); PRINCÍPIOS §3 ("o reveal tem a criatura desenhada"; Finch entrega o birb, não um parágrafo); a arte existe (`src/assets/soulmon/lines/`) | Nada de regra |
| O2 | **A justificativa do campo de objetivo** (`ONB-14`): "Your Soulmon brings this back on the days that count." | PRINCÍPIOS §3 "justificativa por campo" é obrigatório (crítico item 2: nota de rodapé não satisfaz; product-designer #4); a frase promete só o que `02 §21` permite (volta em momentos-chave — RIT-09, ONB-43; nunca vira nota, meta, cobrança) | Nada |
| O3 | **O objetivo do tutorial nasce pré-carregado com o `soulGoal`** (`ONB-40`), editável; com ONB-14 pulado, mostra o placeholder | "What do you want to improve in your life?" e "What’s your goal?" são a mesma pergunta duas vezes em três telas (product-designer #3); o valor já está no save — não é funcionalidade nova | O campo vazio |
| O4 | **Um "Back" nos três becos sem saída** — `STRUGGLE_STEP`, `CHOICE_STEP`, `REGISTER` | `back()` sabe voltar dos três e nenhum botão o chama (crítico B1: a rodada 1 os desenhava como se existissem); o botão quiet é o mesmo que os passos do ritual já têm | Nada de regra; achado de código |
| O5 | **Rótulo e teclado no skip da intro** (`ONB-03`): `aria-label="Skip intro"` na superfície, com Enter/Espaço | W10 (toda ação com rótulo e caminho de teclado); hoje a raiz só tem `onClick` (crítico B4) | Nada |
| O6 | **O aviso junto de "Suggest tasks with AI"** (`ONB-40`): "Your goal is sent to the AI to write suggestions." | Guarda 2e: o objetivo VAI para `/api/suggest-tasks` (`minimizeForAi` tira identificador direto, não dado de saúde) e a política de privacidade não menciona o endpoint — aceite: linha na política PT/EN antes de implementar + o aviso curto | Nada de regra |
| O7 | **Estados que a rodada 1 não tinha**: o par "Sign in" do e-mail (reset enviado como `role="status"`, `aria-invalid`, "I forgot my password"); ONB-05 como o que é (a tela sem-Firebase por um tick); o rótulo real do teto no tutorial ("Stage limit of N activities reached — unselect something to swap.") como UI; a barra do tutorial como pontinhos, como o código | W3 (crítico); B2, B3; fidelidade | Nada |

### 9.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **Reordenar o funil**: as duas perguntas abertas (ONB-14/15) DEPOIS do personagem e do cadastro (ONB-20/34), para a criatura subir da 7ª para a 5ª tela (product-designer #2, "criatura antes do pedágio") | **Decidido pelo dono (14/09/2026): MANTER a ordem de hoje** (a criatura continua na 7ª tela; as perguntas ficam entre a conta e o ritual) | Muda a ordem dos `step` em `SoulmonOnboarding.tsx` e o funil medido (PP Parte 0); é a maior alavanca do canvas e não é do wireframe decidir. Custo: perde "a conta fica atrás, o ritual à frente" das perguntas; ganha fundir com O3 (a pergunta do tutorial). Recomendação do lead: reordenar — o dono preferiu não mexer no funil medido; a proposta fica registrada como perdedora |
| V2 | O porquê da ausência de conta em ONB-09 (T9 parcial; product-designer #5): "No account here — your progress stays on this device." | **Adiado → lote de copy** | Copy nova numa tela que hoje tem hint próprio; registrada como candidata |
| V3 | A métrica "8 telas + WelcomePromptModal" (PP Parte 0) × as 10 telas contadas no canvas (o tutorial são 2) | **→ STATUS** | Reconciliar a régua, não o desenho |
| V4 | Copy dizendo que a 1ª atividade do tutorial é REAL (vai para `gameState.activities`), não demo | **Adiado → lote de copy** | Achado para o STATUS; nenhuma tela diz isso hoje |

### 9.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O campo de objetivo vazio no tutorial** | O3 |
| S2 | **O nascimento demo sem a criatura** | O1 |
| S3 | **O "carregando" do portão como tela própria** (rodada 1) — é a tela sem-Firebase por um tick | Crítico B2 |
| S4 | **A barra contínua do tutorial** (rodada 1) — são pontinhos | Fidelidade |
| S5 | **O rascunho retomado do portão** (`ONB-13`) | D4: `fora` |

### 9.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (O1–O7 entram; V1: a ordem de hoje do funil FICA — o lead recomendava reordenar, o dono decidiu manter; sem decisão de regra nova no `REGISTRO`). Registro do que foi apresentado: O1–O4 eram as mudanças estruturais — a recomendação era aprovar as quatro.
- **Para o cartógrafo:** `03 §2.3` não diz que `STRUGGLE`, `CHOICE` e `REGISTER` não têm volta; `03 §2.4` não diz que o campo de objetivo do tutorial é independente do `soulGoal`; a régua "8 telas" de PP Parte 0 exclui o tutorial.
- **Para o `docs/STATUS.md` (achados de código):** (a) três becos sem saída no funil (`back()` sem botão em `STRUGGLE_STEP`, `CHOICE_STEP`, `REGISTER`); (b) `REGISTER` demo sem `<img>`; (c) durante a checagem assíncrona o portão renderiza a tela sem-Firebase por um tick — quem toca "Continue" entra sem conta mesmo com Firebase configurado (`mostrarAuth = authUsavel && !authEmail`, `authUsavel` nasce `false`); (d) o skip da intro sem rótulo nem `onKeyDown`; (e) `/api/suggest-tasks` recebe `goalText` e a `privacidade.html` não o menciona; (f) o objetivo perguntado duas vezes (ONB-14 e ONB-40); (g) nenhuma copy diz que a 1ª atividade é real; (h) a métrica "8 telas" × 10 contadas.
- **Para o `staff-frontend`:** O1–O7 e S1–S5 são o diff do funil; nenhum item muda regra de jogo; aceites do guarda: 2c (as caixas de ONB-09 nascem desmarcadas — o artboard mostra o estado pós-marcação), 2e (linha na política antes de implementar a disclosure); V1 espera o dono.

## 10. Evolução: entra / volta / sai (decisão do `soulmon-design-lead`, 14/09/2026)

> **Canvas:** [Soulmon — Wireframes Evolução](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/evolucao/` (`Main.dc.html` + 14
> `<TelaEstado>.dc.html` + `canvas.json`; 21 linhas `EVO-*` em 15 artboards — a sub-aba Soulmon migrou para o Pet, D1).
> **Crítica:** `design-critic` (rodada 1: "não passa", 3 bloqueantes — B1 ordem de foco invertida em 7 artboards,
> B2 a cerimônia sem semântica de diálogo, B3 risco de flash na intercalação — + W3 o estado por nó da árvore;
> aplicados/registrados na rodada 2), `soulmon-product-designer` (8 achados; os que mudaram o canvas: a data e a
> saída relacional na cerimônia; a tag "LOCKED" duplicada), `soulmon-guarda-linha-vermelha` (família **APROVADA
> COM RESSALVA** — nenhum veto; 3 ressalvas que viram aceite: o cadeado avisa dos corações, a data na cerimônia,
> a pausa entre a cerimônia e o modal).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D7 (reduced-motion muda a estrutura da
> cerimônia), D9 (offline na geração de sprite), D11 (a 4ª divergência — marco espera o gesto — não é reaberta) e
> a régua viva `evolucaoManual.contract.test.ts`.

### 10.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| X1 | **A DATA na cerimônia de evolução** ("September 14, 2026" — `formReachedAt`, 02 §45) | PRINCÍPIOS §5 obriga (MOB §6A, 4 de 11 apps; "marco é memória, não aviso"); a cerimônia do marco já a tem (RIT-20); guarda 4a (aceite); product-designer #1 | Nada de regra |
| X2 | **"Continue" vira "Let’s keep going together"** na cerimônia | PRINCÍPIOS §5 (saída de RELAÇÃO — Ahead); o marco já usa esta frase: duas celebrações, uma saída (product-designer #2/#3); `onClose` intacto | O "Continue" neutro |
| X3 | **A tag do cadeado do jogador vira "ON HOLD"** (era "LOCKED", a mesma palavra da forma não alcançada) | Em EN duas coisas tinham um nome; o PT já desambigua (TRAVADA × BLOQUEADA); casa com o botão "Evolution on hold" (PRINCÍPIOS §6 "vocabulário único"; M-perm §3 item 6; crítico ressalva; product-designer #5) | Nada; a tag "LOCKED" da forma não alcançada fica |
| X4 | **A superfície do cadeado diz o que ele não protege**: "Holding the form doesn’t shield it — hearts can still drop on hard days." | 02 §17 ("o cadeado não protege de degeneração") vivia só em comentário de código; quem trava para "manter como está" podia ver a criatura cair sem aviso — teste do homem atrás da cortina (guarda 1c, aceite) | Nada |
| X5 | **Estados que a rodada 1 não tinha**: a linha de estado por NÓ da árvore (`linhaDeEstado` roda em cada card — "NEW · Visor tuned", "Not revealed yet", "The Oracle is drawing…"); o offline da geração de sprite (D9); a cerimônia em movimento reduzido como quadro antes → depois (D7); o `role="dialog"` na cerimônia; plural real no `EvolveTaskModal` | W3 (crítico); D7; D9; B2 | Nada |

### 10.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **O `EvolveTaskModal` em cima do clímax** (Continue → "cadastre mais tarefas" em dois toques; guarda 4b, product-designer #4) — alternativa: virar CARD na página de Evolução, onde a barra já mudou | **Decidido pelo dono (14/09/2026): vira CARD na página** → `REGISTRO` 13.12 | É a única mudança que reorganiza uma superfície inteira; o código já encadeou o modal para DEPOIS da cerimônia (03 §4.11) e a régua `filaDeAvisos` trava a string do `isOpen`. Recomendação do lead: virar card na página (o mesmo léxico do convite), sem modal |
| V2 | O gesto duplo do visor (alterna o cadeado; com a barra cheia, dispara a evolução) — separar "travar" de "evoluir" | **Adiado → STATUS / lead** | É IA do motor (product-designer #2/#4); o botão de 44px replica o cadeado; um botão "Evolve" separado seria funcionalidade nova — registrada como dívida, não desenhada |
| V3 | "N complete days to go." como leitura dominante (PRINCÍPIOS §6 família "faltam N", PARCIAL) — copy candidata "4 of 7 complete days" | **Adiado → lote de copy** | A frase está abaixo da barra e diz "complete"; trocar a ordem (feito primeiro) é copy, não estrutura |
| V4 | O × permanente no `UnlockNudge` (Garmin, PRINCÍPIOS §8) | **Volta ao código (D11)** | Decisão preexistente do dono (13/09): as quatro divergências não são reabertas; o guarda registra (3a) e segue |
| V5 | W9: nenhum artboard nomeia o que o Soulmon ATUAL perde (só anti-padrões de outros apps) | **Aceito como lacuna documental** | D11 manda desenhar como o código já faz; a coluna "Sai" desta seção é o delta |

### 10.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"Continue"** na cerimônia | X2 |
| S2 | **A tag "LOCKED" do cadeado do jogador** | X3 |
| S3 | **A intercalação de 3 s e o vídeo em loop** em movimento reduzido — viram quadro antes → depois | D7 (o código não lê `prefers-reduced-motion` — achado) |
| S4 | **"(s)"** nos plurais do `EvolveTaskModal` | X5 |
| S5 | **A ordem de foco começando no visor** (rodada 1) — as sub-abas vêm antes no DOM | Crítico B1 |

### 10.4 O que fica registrado para depois

- **Checkpoint fechado em 14/09/2026 — o dono APROVOU** (X1–X5 entram; 13.12: o aviso pós-evolução vira card na página, não modal). Registro do que foi apresentado: X1–X4 eram as mudanças estruturais/copy — a recomendação era aprovar as quatro; V1 era decisão de regra do dono — o lead recomendava o card.
- **Para o cartógrafo:** o botão "Degenerate" nos cards de estágio anterior (dois toques: "Confirm degeneration" → "Final warning") não tem linha no inventário nem seção no 03 §4.10; a linha de estado por nó da árvore (`linhaDeEstado`) não está no 03; no demo os estados de sprite (GERANDO/ERRO/A_SINTONIZAR) nunca disparam (`getSpriteForStage` é o fallback) — EVO-05/06/07 são só de conta paga.
- **Para o `docs/STATUS.md` (achados de código):** (a) **flash** — a intercalação da cerimônia decai de 420 ms até 55 ms (~18 trocas/s) de sprites brancos sobre fundo escuro, acima do piso do WCAG 2.3.1; capar em ≥ 334 ms independente da preferência (prioridade alta); (b) `EvolutionCeremony` sem `role`, `aria-modal`, trap nem Escape num z-500 que bloqueia o app; (c) `EvolutionCeremony` não lê `prefers-reduced-motion` (o `MilestoneCeremony` lê); (d) a cerimônia sem a data e com saída neutra; (e) "LOCKED" para duas coisas em EN; (f) o cadeado não avisa que não protege de degeneração; (g) `EvolveTaskModal` no kit antigo (Consolas, `sm-card`) com "Create new task" / "Got it" só em inglês; (h) o gesto duplo do visor; (i) o "Degenerate" fora do inventário.
- **Para o `staff-frontend`:** X1–X5 e S1–S5 são o diff da Evolução; nenhum item muda regra de jogo (`02`); V1 espera o dono; aceites do guarda: 1c (a frase do cadeado), 4a (a data), 4b (a pausa entre cerimônia e modal — resolvida por V1 se o dono aprovar o card).

## 11. Jogos: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Jogos](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/jogos/` (`Main.dc.html` + 15
> `<TelaEstado>.dc.html` + `canvas.json`; 25 linhas `JOGO-*` em 16 artboards).
> **Crítica:** `design-critic` (rodada 1: "não passa", 6 bloqueantes B1–B6 — todos aplicados na rodada 2),
> `soulmon-product-designer` (6 achados; os que mudaram o canvas: o chrome da run nas fases de luta, a
> instrução da barra no pesadelo, a tensão do "N pts" por pessoa), `soulmon-guarda-linha-vermelha` (família
> **APROVADA COM RESSALVA** — **1 veto** (3b: a faixa do Torneio ao lado do oponente), 3 ressalvas que viram aceite).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D9 (offline no Torneio), D11 e T7
> (a criatura do amigo no estágio REAL, sem escada nem rank).

### 11.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| J1 | **O card do oponente no Torneio = criatura + nome + "‹pet› · ‹estágio›"** (como o código: `o.petName || o.stage` · `getStageLevel`), sem a faixa | Guarda 3b (VETO à faixa da rodada 1: reusar o selo de "Your tier" no card alheio é a armadilha do #21 — Mimo); crítico B1 (a faixa só é calculada para o próprio jogador); T7 (estágio real) | A faixa ao lado do oponente (rodada 1) |
| J2 | **O chrome persistente da run** ("Dungeon · Floor N/5 · scene · enemy I/6" + ×) em todas as fases de luta | `DungeonGame.tsx` monta o cabeçalho sempre; sem ele o jogador não sabe onde está no turno (product-designer #1) | Nada |
| J3 | **Uma linha de instrução no pesadelo** `[novo]`: "Tap when the marker crosses the middle." | O pesadelo pode ser o PRIMEIRO combate do jogador (fila 1, antes de abrir Jogos) e o `NightmareBattle` não explica a barra (product-designer #5) | Nada |
| J4 | **Estados que a rodada 1 não tinha**: o erro `sem-motor` da Arena ("I could not load the challengers right now… try again in a bit." + "Go back"); o `fightError` do Torneio ("The match didn’t happen. Try again."); o relógio de defesa de 3,0 s como padrão (o "(no time limit)" só com `prefers-reduced-motion`); "2.4s" como instante, não constante; o offline do Torneio (D9) | W3 (crítico B4, B5, B6); D9 | Nada |
| J5 | **Fidelidade de a11y**: o × é o PRIMEIRO interativo em todo minijogo (`sm-px-arcade-close`); os cards da página sem `aria-label` — o nome acessível é a concatenação sem separador (como o código, registrado como achado); plural real em "N matches left today" | Crítico B2, B3; precedente RIT-18 | O `aria-label` inventado da rodada 1 |

### 11.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **"Against ‹oponente› · N pts" no resultado do Torneio** — número por pessoa (PRINCÍPIOS §10; MOB §13A), tensão nova fora de T1–T9 (product-designer #3) | **Decidido pelo dono (15/09/2026): MANTER** → `REGISTRO` 13.13 | O "N pts" é o poder DAQUELA partida (`result.points`, com aleatoriedade), nunca `lifetimePoints` (guarda 3c, aceite); mesmo assim é um número ao lado de um nome. Recomendação do lead: manter (é o placar da partida, não do jogador; some com o "Continue") — registrar no `REGISTRO` como decidido |
| V2 | Confirmação ao sair da run pelo × (hoje `exitRun` sai imediatamente em qualquer fase, inclusive após "Go deeper") | **Adiado → STATUS** | É comportamento do motor; o wireframe desenha o código (D11) e registra |
| V3 | A fonte pixelada (`sm-px-arcade-value/-label`, Silkscreen) no popup "PERFECT!" e no placar — contra PRINCÍPIOS §7 / Life Reset | **Adiado → STATUS** | O wireframe desenha sans-serif (a fronteira certa); o vazamento é do código, para a Fase 2 / `staff-frontend` |
| V4 | Viewport curto (iPhone SE): a 5ª card da página pode sair da dobra sem affordance | **Aceito como nota** | 390×844 é o viewport do canvas; a rolagem é natural |

### 11.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A faixa ao lado do oponente** (rodada 1) | J1 (veto 3b) |
| S2 | **O `aria-label` "‹título› — ‹descrição›" dos cards** (rodada 1) — o código não o tem | J5 (B2); vira achado a11y |
| S3 | **"(no time limit)" como padrão do pesadelo** (rodada 1) | J4 (B6) |
| S4 | **A Biblioteca como card da página** (PD §5 dizia que viraria) — o código não tem; é o canvas Social (D2), pelo menu | D2 |

### 11.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — o dono APROVOU** (J1–J5 entram; 13.13: o "N pts" do resultado fica, como poder da partida). Registro do que foi apresentado: J1–J3 eram as mudanças estruturais/copy — a recomendação era aprovar; V1 era decisão de regra do dono — o lead recomendava manter.
- **Para o cartógrafo:** `JOGO-22` no inventário cita a faixa do oponente? (não — o inventário está certo; a rodada 1 do wireframe errou); a Arena tem o estado `sem-motor` sem linha; o `fightError` sem linha.
- **Para o `docs/STATUS.md` (achados de código):** (a) o × da masmorra sai da run sem confirmação em qualquer fase, inclusive após gastar Bits; (b) `sm-px-arcade-value/-label` (Silkscreen) no popup e no placar — fonte pixelada no corpo do texto (PRINCÍPIOS §7); (c) os cards da página de Jogos sem `aria-label` (nome acessível = concatenação sem separador); (d) "N match(es)" e o "(s)"; (e) o pesadelo sem instrução da barra.
- **Para o `staff-frontend`:** J1–J5 e S1–S4 são o diff dos Jogos; nenhum item muda regra de jogo; aceites do guarda: 2b (a barra "You" da run nunca usa ❤️), 2c ("N matches left today" nunca vira push nem contagem regressiva), 3c ("N pts" = poder da partida); V1 espera o dono.

## 12. Loja: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Loja](https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/loja/` (`Main.dc.html` + 6
> `<TelaEstado>.dc.html` + `canvas.json`; 12 linhas `LOJA-*` em 7 artboards; `LOJA-12` `fora` por D5).
> **Crítica:** `design-critic` (rodada 1: "não passa", 4 bloqueantes B1–B4 e 5 ressalvas — todos aplicados
> na rodada 2), `soulmon-product-designer` (5 achados: `mood-checkins` alvo 3 × 13.10; a troca sem teste;
> `!asPage` ramo morto; cadeado sem sinal não textual; legibilidade do número de Bits),
> `soulmon-guarda-linha-vermelha` (família **APROVADA** — **1 veto** (2b: o Coraçãozinho à venda), 1 ressalva
> (2a: os chips são +3), 3a/3b aceites).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D5 (LOJA-12 fora), D11 (dois
> segmentos, não cinco abas) e a linha #13 (não se vende proteção contra punição).

### 12.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| L1 | **O saldo do topo é UMA leitura só** — Bits no segmento Shop, Emblemas no Tournament (como `ShopModal.tsx` ~300–311) | Crítico B1 (a rodada 1 mostrava os dois juntos; o código nunca mostra); PRINCÍPIOS §8 (três moedas inconfundíveis) | Os dois saldos lado a lado (rodada 1) |
| L2 | **A seção Itens vende só os três chips** ("+3 Power/Harmony/Benevolence", `CHIP_BOOST = 3`); o Coraçãozinho NÃO está na vitrine — nota ⚰️ no artboard: `SPECIAL_ITEMS`, fonte única = drop raro da masmorra, `HEART_HEAL = 1` | Guarda VETO 2b + ressalva 2a; crítico B2/B3 (o `heart` saiu da venda em 06/09/2026 — D7+D15 — para fechar Créditos→Bits→cura sem esforço; "half a heart" era falso); **decisão do dono (15/09/2026, no início da meta): fica fora → `REGISTRO` 13.14** | O card "Little Heart — 80 Bits" (rodada 1) |
| L3 | **O card travado é `button disabled`**, com o 🔒 como sinal não textual (`aria-hidden`) e o rótulo "‹name› — locked: ‹missão›" sem marcação vazada; a missão em palavras, o progresso só com `cur > 0` | Crítico B4 (o `<span class="tag">` escapado dentro do `aria-label`) e ressalva 7 (todo card é `<button>`); product-designer #4 | O card travado como `div` inerte (rodada 1) |
| L4 | **Fidelidade de detalhe**: a missão da semana em DOIS `<p>` (descrição / "cur/target"); a borda da recusa em 1px; o `chevron_right` no fim do convite demo; a saída da tela é outra célula da `BottomNav` (em `asPage` não há × e `onClose` nunca é chamado) | Crítico ressalvas 5, 6, 8, 9; D11 | A nota "`onClose` → `setCurrentView('main')`" (rodada 1) |

### 12.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Legibilidade do número de Bits no topo (product-designer #5: o valor em `<b>` de 12px dentro do chip) | **Adiado → Fase 2** | Tamanho de fonte é identidade; o wireframe fixa a estrutura (chip, sem ícone, à direita) |
| V2 | `mood-checkins` com alvo 3 no `weeklyMissions.ts` contra `REGISTRO` 13.10 (alvo 5) | **Adiado → STATUS** (já registrado em 14/09 no checkpoint de Rituais) | Código é da implementação; o wireframe desenha "on 5 days" com a nota 13.10 |
| V3 | A troca Créditos → Bits não tem teste que monte os botões (product-designer #2) | **Adiado → STATUS** | Achado de cobertura, não de desenho |
| V4 | `!asPage` (a variante modal) é ramo morto — remover do código (product-designer #3, crítico "o que o autor não viu") | **Adiado → STATUS** (candidato a remoção; D5 já tira do inventário) | Decisão de código |

### 12.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"Little Heart — 80 Bits" na seção Itens** (rodada 1) | L2 (veto 2b; 13.14) |
| S2 | **Os dois saldos juntos no topo** (rodada 1) | L1 (B1) |
| S3 | **"+2" nos chips** (rodada 1) | L2 (ressalva 2a: `CHIP_BOOST = 3`) |
| S4 | **A variante modal `LOJA-12`** | D5 (nenhum caminho vivo) |
| S5 | **As cinco abas do `CLAUDE.md`** (Itens/Cenários/Mobílias/Torneio/Missões) | D11 (dois segmentos; a aba Missões vive no topo do Tournament) |

### 12.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono de 15/09: cada canvas fecha quando o `design-critic` carimba PASSA e o guarda não tem veto pendente do dono).** L1–L4 entram. A única decisão de regra (o Coraçãozinho na vitrine) o dono já tinha tomado no início da meta: **tirar da loja → `REGISTRO` 13.14**; os chips de atributo por Bits **ficam** (também decidido pelo dono, 15/09).
- **Para o cartógrafo:** `LOJA-01` cita `kind === 'heart'` na seção Itens — corrigido nesta rodada (o `heart` está em `SPECIAL_ITEMS`); o `03 §4.6` ainda lista o Coraçãozinho como item da loja? (conferir no próximo sync).
- **Para o `docs/STATUS.md` (achados de código):** (a) `weeklyMissions.ts` `mood-checkins` alvo 3 × 13.10 (alvo 5); (b) nenhum teste monta os botões da troca Créditos → Bits; (c) `ShopModal` sem `asPage` é ramo morto (o `App.tsx` sempre passa `asPage`) — candidato a remoção; (d) o `aria-label` do card travado concatena o `lockLine` sem separador de progresso legível ("· 2/5").
- **Para o `staff-frontend`:** L1–L4 e S1–S5 são o diff da Loja; nenhum item muda regra de jogo; aceites do guarda: 3a (a recusa sem saldo não abre convite de Créditos), 3b (o convite demo passivo, sem ×, fim da lista).

## 13. Estatísticas: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Estatísticas](https://claude.ai/code/artifact/b35cbac1-de65-4b5d-a17a-760f94e4d6df)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/estatisticas/` (`Main.dc.html` + 6
> `<TelaEstado>.dc.html` + `canvas.json`; 9 linhas `STAT-*` em 7 artboards; `STAT-10` `fora` por D4).
> **Crítica:** `design-critic` (rodada 1: "não passa", 8 bloqueantes B1–B8 — todos aplicados na rodada 2;
> re-carimbo na rodada 2), `soulmon-product-designer` (6 achados: o cartão da jornada sem separadores; o
> "0" grande; `hideMetrics` não chega à `StatsPage`; as duas listas como fecho frio; `epithet` nunca passado;
> o estado "entre estações" sem linha), `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** —
> sem veto; ressalva (c): o "0" grande no primeiro uso vai ao dono; (f) `hideMetrics` vira critério de aceite).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D4 (STAT-10 fora) e D11 (o "#25"
> e o "-" do PRINCÍPIOS §9 não existem no código — registrados, não inventados).

### 13.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| E1 | **O Vínculo pela PALAVRA** ("Companion" — singular, `bond.ts`), "Level N" como legenda, `progressbar` rotulada, a frase "It only goes up…" | `StatsPage.tsx` (a palavra vem primeiro; o número é a legenda dela); PRINCÍPIOS §9; 13.7 | "Companions" (rodada 1) |
| E2 | **A data de nascimento SEM ano** ("September 3" / "3 de setembro") e **sem epíteto** na Estatísticas | `BirthCard.tsx` (`dataPorExtenso` sem `year`: "6 de setembro é uma lembrança; 2026-09-06 é um registro"); o `App.tsx` nunca passa `epithet` a esta instância (product-designer #5; crítico B6) | "September 3, 2026" e "the Quiet Flame" (rodada 1) |
| E3 | **O vazio com forma corrigida**: "Who they are" e "The season" MONTAM no primeiro uso (o traço é sorteado na criação do save; o `season` é sempre passado); encontros, formas, feitos e "Started for" somem; as duas listas trocam o `<ul>` por uma frase de futuro | Crítico B3 (código > inventário > `03 §4.8a`, que erram os dois); WP4.12 | A nota "Who they are e The season não montam" (rodada 1) |
| E4 | ~~**Uma frase de contexto ao lado do "0" de dias completos no primeiro uso**~~ `[novo]` — **REVOGADA pelo dono (15/09/2026, modal final): só o dígito, como o código**: "You two just met — the first complete day starts the count." — o dígito FICA (posse, 13.7) | Guarda (c): o "0" em fonte display não é "quieto"; a recomendação do lead é manter o dígito e amolecer com uma frase, nunca esconder; aplicada por meta autônoma (15/09) e listada para o dono | Nada |
| E5 | **Fidelidade de detalhe**: "The journey" é UM cartão contínuo (o artboard rolado diz "the same card, continued"); `formatDate` relativa até 7 dias ("3h ago" · "Yesterday" · "2d ago" · depois "Sep 03"); "Sep 3" (en-US) no álbum; moldura 56×56 no bestiário; o estado "entre estações"; W4 explicitado (três artboards = recorte de UMA pergunta) | Crítico B4, B5, B7, B8 + ressalvas; product-designer #6a | A nota invertida sobre datas (rodada 1) |

### 13.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Separadores (hairline) entre os blocos de "The journey" (product-designer #1) | **Adiado → Fase 2** | O código não os tem (um `section`, `marginTop:16`); D11 desenha como o código; a hierarquia interna é tipografia/espaço |
| V2 | Reduzir o peso visual do "0" grande / decidir se é "quieto" para 13.7 (guarda c; product-designer #2) | **Decidido pelo dono (15/09/2026, modal final):** SÓ O DÍGITO, como o código — a frase de contexto (E4) SAI do canvas | É leitura de regra (o que conta como "quieto" na 13.7); o lead recomenda E4 (dígito + frase); as alternativas — só o dígito, ou dígito menor — ficam no modal final |
| V3 | `hideMetrics` não chega à `StatsPage` (os comentários dizem que obedece; a interface de props não o tem) — guarda (f), product-designer #3 | **Adiado → STATUS, como critério de aceite do WP** | Código; o wireframe não desenha o estado "descanso ligado" nesta tela porque ele não existe hoje |
| V4 | As duas listas do fim como "painel de produtividade" (product-designer #4) | **Aceito como nota** | Sem posição, teto 5/10, sem comparação; guarda (e) passa; título/copy podem enquadrar melhor na Fase 2 |
| V5 | O "#25" e o "-" do não obtido (PRINCÍPIOS §9) | **Adiado → Fase 2** | Não existem no código (D11) |

### 13.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A linha de texto legada "Forms reached so far: …"** (`STAT-10`) | D4 (save sem `album`; a conta vai ao STATUS) |
| S2 | **O ano na data do nascimento e o epíteto** (rodada 1) | E2 |
| S3 | **"The journey (continued)" como segundo cartão** (rodada 1) | E5 (B8) |
| S4 | **Data absoluta nas conclusões recentes** (rodada 1) | E5 (B4) |

### 13.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono de 15/09).** E1–E5 entram. **Pendente do dono (modal final):** V2 — o "0" grande no primeiro uso: (a) dígito + frase de contexto `[novo]` (recomendação do lead, desenhada), (b) só o dígito como o código, (c) dígito com peso reduzido. Nunca esconder o dígito (posse). **Modal final (15/09/2026): o dono escolheu SÓ O DÍGITO — E4 revogada; o canvas foi republicado sem a frase.**
- **Para o cartógrafo:** `STAT-02` corrigido nesta rodada ("Who they are" e "The season" montam sempre); falta uma linha para "entre estações" (`seasonProgress() === null`); o `03 §4.8a` repete a premissa errada — ⚠️ divergência para o sync do manual.
- **Para o `docs/STATUS.md` (achados de código):** (a) `hideMetrics` não chega à `StatsPage` — a interface de props não o tem e o `App.tsx` não o passa; os comentários do arquivo afirmam o contrário; (b) o `App.tsx` nunca passa `epithet` ao `BirthCard` da Estatísticas — só o reveal passa; (c) nenhum teste monta a `StatsPage` (o vazio não tem régua); (d) `03 §4.8a` diz que "Quem é" e "A estação" somem no primeiro uso — falso.
- **Para o `staff-frontend`:** E1–E5 e S1–S4 são o diff da Estatísticas; nenhum item muda regra de jogo; critério de aceite obrigatório: `hideMetrics` até a `StatsPage` (cobrindo `streakDays` e `daysTogether`); aceites do guarda: (a) contagens de coleção só com ≥ 1, (b) estação sem contagem regressiva, (d) "Level 0" como legenda quieta, (e) as listas sem posição.

## 14. Social: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Social](https://claude.ai/code/artifact/7abe2a04-90db-43f1-9d75-dd8a742f3ff0)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/social/` (`Main.dc.html` + 7
> `<TelaEstado>.dc.html` + `canvas.json`; 7 linhas `SOC-*` em 8 artboards — D2: `CONTA-26`→`CONTA-32` viraram
> `SOC-01`→`SOC-07`; chegada pelo menu).
> **Crítica:** `design-critic` (rodada 1: **PASSA**, zero bloqueante; 5 ressalvas — apóstrofo, `busyId` por linha,
> nota D7, offline na aba Group, `gap` — e a maior alavanca: formalizar duas tensões soltas como T10/T11),
> `soulmon-product-designer` (8 achados; bloqueantes de método: a lista vertical × "árvore/cena" e o "N days
> playing"; estados que faltavam: `aviso` dentro do grupo, `ocupado` nas ações do grupo, `copiado`),
> `soulmon-guarda-linha-vermelha` (canvas inteiro, D2: **APROVADA COM RESSALVA**, 0 vetos — (a) `daysPlaying`
> precisa ser formalizado no `REGISTRO` §5.5; (d) o "0 of 20" do grupo sozinho pede uma linha na 13.7).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D2, D9 (offline na Biblioteca), D11 e a
> decisão 8b (a criatura do amigo no estágio real; galho, não altura — ⚠️ o comentário do código cita "D13", que
> não existe: achado).

### 14.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| C1 | **A Biblioteca como canvas próprio**, três abas (All · Friends N/5 · Group), a linha do jogador = UM botão + até duas ações de 44px com rótulo em palavras (presente / amizade); NPCs misturados e marcados "· demo" | D2; `LibraryPage.tsx`; PRINCÍPIOS §10 (só verbos de dar; presente desabilitado sem cronômetro nem contador) | Nada (rodada 1 já assim) |
| C2 | **Quatro estados declarados, de propósito** — carregando · vazio (amigos / busca) · erro do diretório · sem rede (D9: o mesmo bloco `loadError` + `OfflineSeal` na raiz; os NPCs ficam) — e a linha degradada "Friend (didn't load)" com presente e remover de pé | 03 §4.22 (⚰️ `.catch(() => setPlayers([]))`); D9; D11 (o código não lê `navigator.onLine`; o selo distingue) | Nada |
| C3 | **O perfil do outro é OLHAR**: criatura grande, nome do pet, "Demo character", "Pet's path · ‹galho›", "Close" — sem HP, sono, escada, presente de dentro | Decisão 8b + proibição #21; guarda (e) passa integralmente | O custo de voltar à lista para presentear — assumido |
| C4 | **O grupo com a meta SOMADA**: "N of M this week" (do grupo), "showed up today / not yet today" por pessoa, o check-in só com a meta própria do dia, sozinho com texto próprio, meta batida em uma frase de todos | 02 §56; `CoopPanel.tsx`; guarda (d) passa | Nada |
| C5 | **Estados que a rodada 1 não tinha**: `aviso` dentro do grupo ativo; `ocupado` em criar/entrar/check-in/sair; `copiado` (o ícone vira `check` por 2 s); a nota de que `busyId` é por linha (tocar "remove" gira o presente também); as notas D7 nos `sync` girantes | Product-designer #6/#8; crítico ressalvas 2–3; W3 | Nada |

### 14.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **"N days playing" por pessoa** (PRINCÍPIOS §10 proíbe "qualquer número por pessoa"; o código o mantém desde 06/09 como duração) — product-designer #4 (alta), guarda (a), crítico ponto 6 | **Decidido pelo dono (15/09/2026, modal final):** MANTER e formalizar → `REGISTRO` 13.15 | Nunca foi formalizado no `REGISTRO` §5.5 — é racional de comentário. Recomendação do lead e do guarda: **manter** (monotônico, não é desempenho, não ordena) e escrever a exceção com a alternativa (tirar — Finch puro) e o gatilho (se virar ordenação/comparação, sai). Aplicado por meta autônoma; vai ao modal final |
| V2 | **Lista vertical × "árvore/cena, nunca lista vertical"** (PRINCÍPIOS §10 regra 2) — product-designer #3 (alta: é estrutura, não identidade) | **Decidido pelo dono (15/09/2026, modal final):** MANTER a lista (T11 fechada: exceção documentada à regra 2 do §10) | O código não tem cena; desenhar uma seria inventar estrutura sem função e sem fonte (W2/D11). Recomendação do lead: manter a lista como diretório sem posição (ordem do servidor, sem número de posição) e, se o dono quiser a cena, encomendá-la ao `staff-frontend` antes da Fase 2 |
| V3 | Gancho de descoberta fora da Biblioteca (só o menu chega) — product-designer #1 | **Adiado → STATUS** | É decisão de outra tela (Home/menu), não desta |
| V4 | A aba "Group" ecoar o estado (nome do grupo) como "Friends N/5" ecoa a contagem — product-designer #2 | **Adiado → Fase 2 / copy** | Rótulo; o código não o tem |
| V5 | Explicar por que a energia cheia é pré-condição do presente — product-designer #5 | **Adiado → `redator-ux`** | Copy, não estrutura |
| V6 | Apóstrofo reto como o código; `gap: 4` — crítico ressalvas 1 e 5 | **Aceito como nota** | Cosmético; o rodapé avisa para não colar do wireframe em teste de string |

### 14.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O `rank` e o `tasksDone` por jogador** | ⚰️ 06/09/2026 (WP4.11, #21) — não voltam |
| S2 | **A escada inteira Rookie→Mega no perfil do amigo** | Decisão 8b (galho, não altura) |
| S3 | **Cronômetro / contador no presente desabilitado** | PRINCÍPIOS §10; MOB §13A |
| S4 | **"Quanto cada um fez" no grupo; push de quem faltou** | 02 §56 |

### 14.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono de 15/09; o crítico carimbou PASSA na rodada 1; o guarda não tem veto).** C1–C5 entram. **Pendente do dono (modal final):** T10 ("N days playing" — manter e formalizar em §5.5 / tirar) e T11 (lista × cena — manter a lista / encomendar a cena). **Modal final (15/09/2026): T10 → manter e formalizar (13.15); T11 → manter a lista.**
- **Para o cartógrafo:** `SOC-06` cobre sete estados do `CoopPanel` numa linha só (sem grupo, com grupo, sozinho, já avisei, meta batida, aviso com grupo, ocupado/copiado) — desdobrar; o offline na aba Group não tem linha.
- **Para o `docs/STATUS.md` (achados de código):** (a) `branchLevels` calculado e nunca renderizado em `PlayerDetailModal.tsx`; (b) o comentário do mesmo arquivo cita "D13", que não existe (é a decisão 8b); (c) `busyId` é por linha, não por botão; (d) o `LibraryPage` não distingue erro de sem rede (um `loadError`); (e) a 13.7 merece uma linha dizendo que cobre contador SEMANAL de grupo (guarda d).
- **Para o `staff-frontend`:** C1–C5 e S1–S4 são o diff do Social; nenhum item muda regra de jogo; aceites do guarda: (b) "Friends N/5" é número próprio, (c) o presente desabilitado em palavras, (d) a meta somada, (e) o perfil sem métrica, (f) a linha degradada mantém as ações pelo id.

## 15. Conta: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Conta](https://claude.ai/code/artifact/c5fba27a-548f-444c-890f-10f4d482229f)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/conta/` (`Main.dc.html` + 13
> `<TelaEstado>.dc.html` + `canvas.json`; 25 linhas `CONTA-*` em 14 artboards; `CONTA-13` `fora` pelo precedente
> da D5; a Biblioteca já migrou para o Social — D2).
> **Crítica:** `design-critic` (rodada 1: "não passa", 2 bloqueantes — o preço da Nova Leitura era 20 e é 50; o
> `ConfirmDialog` é um `ModalSheet` com × e `role="dialog"` — e 2 ressalvas ("BRL" nos packs; 19 termos) — todos
> aplicados; re-carimbo na rodada 2), `soulmon-product-designer` (9 achados: a Janela de Descanso P1 no fim de uma
> página P2; o prazo de 15 min invisível; o lembrete que dispara o toggle geral; "Default" que não salva; a porta de
> mão única Créditos → Nova Leitura; os 2 ramos de corpo para 4 motivos; três estados que faltavam),
> `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA**, 0 vetos — `accountTier ?? 'paid'`; o corpo
> do `UnlockAccountModal` por motivo; a copy do lembrete).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D5 (precedente), D11 e a linha #13.

### 15.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| K1 | **A `SettingsPage` em sete grupos por intenção** (Install no topo; Your account · Your data · Your story · What Soulmon sends you · Appearance · Help · Your rhythm) + o `RestWindowCard` e o `StepsCard` montados pelo App abaixo | `SettingsPage.tsx` (ordem do DOM); 03 §4.23; PRINCÍPIOS §11 | Os 11 blocos sem agrupamento (19/08) |
| K2 | **A saída de dados na própria superfície**: exportar / apagar com o inventário de três blocos; o 503 como ESTADO (painel em tinta neutra + botões desabilitados com o motivo); "Go back" quieto | `AccountDataSection.tsx`; Speak (MOB §15.6) | Nada |
| K3 | **A Janela de Descanso própria**: a janela sem sugestão; "N of M" só com `window > 0`; o vazio como ramo neutro; o switch que esconde números e preserva os sonhos; o lembrete com a prévia do push | `RestWindowCard.tsx`; 02 §40; 02 §58; Headspace (MOB §8B) | Nada |
| K4 | **Os modais com fidelidade de detalhe**: Nova Leitura a 50 créditos ("Read again — 50 credits"); "R$ N BRL" nos packs em inglês; o `ConfirmDialog` como `ModalSheet` (× + `dialog`); 19 termos no Glossário; "Recover with a code" aberto; "Usage stats" aberto; "Watch ad" em "Loading ad…" / "limit reached" | Crítico B1/B2/R1/R2; product-designer #9 | "20 credits", `alertdialog` sem × (rodada 1) |
| K5 | **`CONTA-13` (`SettingsModal`) fora pelo precedente da D5** — **confirmado pelo dono (15/09/2026, modal final)**: sem caminho vivo (medido em 13/09) → não se desenha; achado no STATUS como candidato a remoção | D5; 03 §4.23a; crítico R3 e product-designer #8 concordam | Nada |

### 15.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Reordenar por prioridade — a Janela de Descanso (P1) antes dos grupos P2; Install no fim (product-designer #1) | **Decidido pelo dono (15/09/2026, modal final):** MANTER a ordem de hoje | É estrutura; o App monta em ordem fixa. Recomendação do lead: mover o `RestWindowCard` para logo depois de "Your account" e o `InstallPrompt` para o fim — sem tocar copy; se o dono não quiser, fica |
| V2 | Um corpo do `UnlockAccountModal` por motivo (`report`/`shop` recebem a copy da Evolução) — guarda (c), product-designer #7 | **Adiado → STATUS** (copy/código) | A manchete do nudge já é por motivo; o corpo é do código |
| V3 | Mostrar o prazo de 15 min no inventário de apagar (product-designer #3) | **Adiado → `redator-ux`** | Copy |
| V4 | O lembrete de deitar dispara o toggle GERAL de notificações (guarda e; product-designer #4) | **Adiado → STATUS** | Fiação; a copy promete um lembrete específico |
| V5 | "Default" que não salva (product-designer #5) | **Adiado → `redator-ux` / STATUS** | Microcopy ou comportamento |
| V6 | Voltar aos Créditos a partir da Nova Leitura (product-designer #6) | **Aceito como nota** | Porta de mão única, sem perda de dado |
| V7 | `accountTier ?? 'paid'` (guarda a) | **Adiado → STATUS** (confirmar com o dono se é proteção intencional) | Integridade de dado, não linha vermelha |

### 15.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **O `SettingsModal` "Quick settings"** | K5 (sem caminho vivo) |
| S2 | **O ramo "This device has no step counter…" do `StepsCard`** | Morto: o App só monta com `available` literal |
| S3 | **"Heal 1 heart — 10 credits"** | ⚰️ saiu do `CreditsModal` (linha #13) |
| S4 | **"20 credits" e o `alertdialog` sem ×** (rodada 1) | K4 |

### 15.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono).** K1–K5 entram. **Pendente do dono (modal final):** V1 (reordenar a página por prioridade) e K5 (CONTA-13 fora — confirmar). **Modal final (15/09/2026): a ordem de hoje fica; CONTA-13 fora confirmado.**
- **Para o cartógrafo:** `CONTA-25` cita "6 pontos"; os dois de `evolution` e o `reveal` são o mesmo componente com `variant`; "Recover with a code" e a telemetria aberta não têm linha; o `StepsCard` `declined` sem caminho de volta (registrado).
- **Para o `docs/STATUS.md` (achados de código):** (a) `onEntitlementChange` nunca é passado pela `SettingsPage` — restaurar compras ali não atualiza o `gameState`; (b) só o botão de exportar tem `aria-describedby` no 503; (c) o corpo do `UnlockAccountModal` tem 2 ramos para 4 motivos; (d) o lembrete de deitar dispara o toggle geral; (e) `accountTier ?? 'paid'`; (f) "Soulmon 1.0.2" literal; (g) recusar o diálogo nativo de instalar não persiste; (h) o ramo sem sensor do `StepsCard` é morto; (i) o erro da Nova Leitura persiste até a próxima tentativa; (j) sem teste para `AccountSection`, `RestWindowCard`, `StepsCard`, `InstallPrompt`; (k) o termo "Complete Day" do Glossário com comentário de defasagem; (l) três `Suspense` independentes na página.
- **Para o `staff-frontend`:** K1–K5 e S1–S4 são o diff da Conta; nenhum item muda regra de jogo; aceites do guarda: (a) Créditos sem cura, (b) Nova Leitura sem cobrança nula, (d) o nudge com `maxWidth 280`, (f) `declined` definitivo, (g) o vínculo do recibo fica, (h) CONTA-13 fora.

## 16. Fora do app: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Fora do app](https://claude.ai/code/artifact/89cc5550-5b1a-4f2b-8929-759a4a68373b)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/fora-do-app/` (`Main.dc.html` + 6
> `<TelaEstado>.dc.html` + `canvas.json`; 18 linhas `FORA-*` em 7 artboards, três páginas: widgets, overlay, pushes).
> **Crítica:** `design-critic` (rodada 1: "não passa" — 7 bloqueantes, todos no overlay: a barra de título fixa
> (🔮 "Soulmon" + ⚙ _ ✕) e o cabeçalho do painel ("‹" + título) colapsados numa linha só, um "Back" inventado, e
> quatro textos EN retraduzidos do PT em vez de colados do código — todos aplicados; páginas 1 e 3 "com nota alta";
> re-carimbo na rodada 2), `soulmon-product-designer` (7 achados: comprimir × remover; o idioma pela bridge; o "—";
> o overlay como mini-app; o widget E; o pior caso são QUATRO pushes; estados que faltavam),
> `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA** — **1 veto ao CÓDIGO**, não ao desenho:
> "Don't forget about me today!" segue viva em `CHAT_FIXED_PHRASES`; ressalvas: o badge de pendentes, o "⚡3/5",
> o imperativo das 20h).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem T2/13.2 (o contador só com ≥ 1 feita),
> a regra ⭐ P5 ("dia completo"), D11.

### 16.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| F1 | **Os 5 widgets nos tamanhos reais** (A 3×1 · B 2×2 · C 1×1 só sprite + 💩 · D chat 3×1 com nome e contador em duas linhas · E 3×2 só corações + energia + sprite), um alvo só (toque abre o app) | `widget_soulmon*.xml`; `WidgetRenderer.kt`; PRINCÍPIOS §12 (o sprite sobrevive a todos os tamanhos) | Nada |
| F2 | **O contador "N/M" só com ≥ 1 feita; "—" com zero** (T2/13.2) — ⚠️ o código imprime "0/5": achado de implementação já previsto na D-T2 | `DECISOES` §3 T2; `REGISTRO` 13.2 | "0/5" |
| F3 | **A escada de 7 frases como o código (PT)**, com "✨ Dia completo!" pela regra ⭐ P5 (o código diz "perfeito") e a glosa EN `[novo]` (o bridge não leva idioma) | `WidgetRenderer.kt` `contextualMessage`; CLAUDE.md › Idioma; P5 | "Dia perfeito!" |
| F4 | **O overlay com as DUAS linhas reais** — a barra fixa (🔮 "Soulmon" + ⚙ _ ✕) e, em Tarefas/Configurações, "‹ + título" — e os textos EN literais de `menu.ts`; a fila de cuidado 🫶🍎🚿💤/☀️; as falas de `phrases.ts` (idle, sleep, wake, full, noFood); as tarefas em três estados; as configurações em três estados de conta + carteira + "📱 Open full Soulmon" | Crítico B1–B7; `menu.html`; `menu.ts`; `phrases.ts` | O cabeçalho único e o "Back" no rodapé (rodada 1) |
| F5 | **Os 7 pushes com título e corpo literais** de `_pushCopy.js`; as 4 guardas das 20h em ordem; a precedência do lembrete de deitar; o pior caso declarado: QUATRO num dia (10h · 16h · 22h + as 20h OU o deitar) | `_pushCopy.js`; `NotificationManager.tsx`; product-designer #6 | "Três por dia" (rodada 1) |

### 16.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | Não mostrar a linha do contador quando `completed == 0` em vez do "—" (product-designer #3) | **Decidido pelo dono (15/09/2026, modal final):** NÃO mostrar a linha → `REGISTRO` 13.16; o canvas sai do "—" | O "—" é ambíguo; o lead recomenda remover a linha (§12: remover, não comprimir) — é ajuste da própria T2, decisão do dono |
| V2 | O badge "✅ Today's tasks · N" do overlay conta PENDENTES — "quantidade que falta"? (guarda e) | **Decidido pelo dono (15/09/2026, modal final):** TIRAR o dígito → `REGISTRO` 13.17 | Recomendação do lead: tirar o dígito; alternativa: total registrado no dia |
| V3 | "⚡3/5" no overlay — o piso da 13.7 se estende à energia? (guarda e) | **Decidido pelo dono (15/09/2026, modal final):** SIM, mesmo piso → `REGISTRO` 13.16 | Recomendação: sim, mesmo piso do contador (nunca "⚡0/5") |
| V4 | O idioma dos widgets pela bridge (product-designer #2; guarda g) | **Decidido pelo dono (15/09/2026, modal final):** a copy dos widgets é SÓ EM INGLÊS → `REGISTRO` 13.18 (diverge do CLAUDE.md › Idioma — registrar lá) | Recomendação: acrescentar `language` ao `SoulmonWidgetPlugin` (permitido pela #20) no próximo WP dos widgets |
| V5 | O widget E expõe "abatido" na tela inicial — piso visual? (product-designer #5) | **Decidido pelo dono (15/09/2026, modal final):** MANTER, sem piso | Recomendação: manter (corações são posse de vitalidade; guarda d aprovou) |
| V6 | A/B/D comprimem (ellipsis) em vez de remover camadas (§12) — product-designer #1 | **Adiado → STATUS/backlog** | Débito de implementação, regra já decidida em §12 |
| V7 | O imperativo das 20h ("Log what you did today and feed it…") — guarda (f) | **Adiado → `redator-ux`** | Copy |
| V8 | Paridade de copy overlay × push sem teste (§12) | **Adiado → STATUS** | Teste de contrato a criar |

### 16.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **"Don't forget about me today!"** (widget D) | VETADA (PRINCÍPIOS §12; ledger E1); ⚠️ segue viva em `CHAT_FIXED_PHRASES`, fora do teste — veto do guarda ao código |
| S2 | **"0/5"** com zero feitas | T2/13.2 |
| S3 | **"✨ Dia perfeito!"** | Regra ⭐ P5 |
| S4 | **A das 21h** | ⚰️ "quarta visita" |
| S5 | **Corações vermelhos, "⚠️", "Cuide de mim", fileira semanal, `constancy_pct`, escudos** | PRINCÍPIOS §12; o teste de contrato |

### 16.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono).** F1–F5 entram. **Pendente do dono (modal final):** V1 (o "—" × remover a linha), V2 (o badge de pendentes), V3 (o piso da energia), V4 (o idioma pela bridge), V5 (o widget E em HP crítico). **Modal final (15/09/2026): sem a linha do contador no zero e sem "⚡0/5" (13.16); o badge sem dígito (13.17); widgets só em inglês (13.18); o widget E sem piso. Canvas republicado.**
- **Para o cartógrafo:** `FORA-01` corrigido nesta rodada (corações/energia são do E, o cocô do C); os estados do widget D (HP baixo, sem tarefas) e as falas por evento do overlay não têm linha.
- **Para o `docs/STATUS.md` (achados de código):** (a) "Don't forget about me today!" viva em `WidgetRenderer.kt` `CHAT_FIXED_PHRASES` — veto de 02/09 não cumprido, fora do teste; (b) "0/5" com zero feitas — T2/13.2 por implementar; (c) "Dia perfeito!" no widget — P5 atrasada; (d) a escada só PT / o chat só EN — o bridge não leva idioma; (e) A/B/D comprimem com `ellipsis`; (f) overlay × push sem teste de paridade; (g) a linha `FORA-01` do inventário estava errada; (h) `pet-goodnight` (22h) e o lembrete de deitar (22h30) a 30 min.
- **Para o `staff-frontend`:** F1–F5 e S1–S5 são o diff do Fora do app; nenhum item muda regra de jogo; aceites do guarda: (b) a escada não cobra, (d) o widget E é posse, (f) nenhum push tem culpa, (g) a glosa EN não reverte nada.

## 17. Onboarding-oráculo: entra / volta / sai (decisão do `soulmon-design-lead`, 15/09/2026)

> **Canvas:** [Soulmon — Wireframes Onboarding-oráculo](https://claude.ai/code/artifact/6dcb1aed-d52c-4c7c-ada1-c3de69f0de38)
> (rodada 2, pós-crítica) · arquivos em `docs/design/wireframes/onboarding-oraculo/` (`Main.dc.html` + 10
> `<TelaEstado>.dc.html` + `canvas.json`; 17 linhas `ONB-*` (21→33, 35→38) em 11 artboards — o segundo canvas do
> Onboarding por D3, o último da Fase 1).
> **Crítica:** `design-critic` (rodada 1: "não passa", 5 bloqueantes — a oferta do reveal (T1/13.1) não desenhada;
> a escala likert/frequência inventada; a barra a 100% no `REGISTER`; "1 = skip link" falso no ritual; o eco do
> `soulGoal` no `BirthCard` — todos aplicados; re-carimbo na rodada 2), `soulmon-product-designer` (9 achados: a
> barra que "encolhe"; a 1ª pergunta sem voltar; o teste como primário numa decisão sem volta; o muro que zera um
> typo; a copy do batismo igual no upgrade; o frame vazio sem frase; T1 sem superfície; o upgrade sem ponte; quatro
> estados sem linha), `soulmon-guarda-linha-vermelha` (família **APROVADA COM RESSALVA**, 0 vetos — T1 sem piso no
> funil atual; a 1ª pergunta sem voltar; T8 problema 1 segue).
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Valem D3, D9 (= ONB-33), T8, T9, D17 e a 13.1
> (desenhada; ver V1).

### 17.1 Entra (estrutura ou copy nova, marcada `[novo]` no canvas)

| # | O que entra | Motivo (fonte) | O que perde |
|---|---|---|---|
| R1 | **O ritual passo a passo como o código**: nome (não pulável) → data (mapa astral E 18+; o muro de idade sem erro, saída única) → hora (ou "não sei": meio-dia, sem Ascendente) → cidade (busca embarcada, sem rede) → favorita (opcional, pulável) → as 6 perguntas que avançam sozinhas (dica de ORIGEM, nunca de alvo) → a bifurcação SEM VOLTA (20 itens ou revelar) → os 20 itens em 4 formatos (5 botões empilhados com o rótulo inteiro) → geração → reveal → cadastro | `SoulmonOnboarding.tsx`; `CityPicker.tsx`; `SoulTestItem.tsx`; `oracle.ts`; PRINCÍPIOS §3 | A escala "1–5" inventada (rodada 1) |
| R2 | **A barra de progresso pela fórmula**: só com `step > 0`; o denominador é `REGISTER + 1` (nunca chega a 100%: 35/36 ≈ 97%) e desconta os 20 itens recusados | Crítico B3 + ressalva; o comentário do código | O "100%" (rodada 1) |
| R3 | **O reveal**: eyebrow → `BirthCard` (sem ano; "‹essence› essence · ‹profession›"; "You said: “…”. ‹nome› was born from that.") → a descrição → o batismo pré-preenchido → "Hatch ‹nome›"; sem sprite (D9): o casulo até 12 s, depois a moldura vazia, nunca arte de reserva | `REVEAL`; `BirthCard.tsx`; T8; D9 | Nada |
| R4 | **A oferta no reveal (T1/13.1) desenhada** `[novo]` `[decisão 13/09]`: card dispensável, largura 280, mesmo container, "Not now" com 44px — condicionada a `accountTier === 'demo'`, condição que o código de hoje NÃO produz (ver V1) | 13.1 é decisão registrada (§5.3 é a alternativa que perdeu); crítico B1 | Nada |
| R5 | **O upgrade** (`mode='upgrade'`): entra no passo 1 sem portão; `back` no passo 1 sai; termina no reveal com `onRevealed`; `bornAt` intocado (D17); **nenhum skip link** no ritual (o App só o monta após `hasCompletedOnboarding`) — a numeração de foco começa em 1 (vale também para o funil) | `App.tsx` `handleUpgradeRevealed`; D17; crítico B4 | "1 = skip link" (rodada 1) |

### 17.2 Volta (a crítica pediu; o lead recusa ou adia)

| # | Pedido | Decisão | Motivo |
|---|---|---|---|
| V1 | **T1/13.1 sem piso no funil** — a oferta está desenhada, mas ninguém chega ao `REVEAL` como demo (quem chega já pagou no `CHOICE_STEP`; o demo escolhe personagem — D3) | **Decidido pelo dono (15/09/2026, modal final):** SIM, o funil ganha um REVEAL DEMO → `REGISTRO` 13.19 (o quiz de 6 para todos; a oferta mora no reveal demo; a criatura própria só pagando) — Fase 1 reaberta só nisso: um artboard novo no canvas do Oráculo | Pergunta: o funil ganha um REVEAL DEMO (o quiz de 6 para todos; a criatura própria só pagando) — e é ali que mora a 13.1? Recomendação do lead: sim (product-designer #7); o guarda: não forçar oferta no reveal pago — se for testar cedo, `CHOICE_STEP`. Até lá a 13.1 fica represada |
| V2 | "Voltar" na 1ª pergunta do ritual (product-designer #2; guarda; crítico) | **Decidido pelo dono (15/09/2026, modal final):** DAR voltar na 1ª pergunta (→ `FAVORITE_STEP`) — entra como `[novo]` no canvas | Recomendação: dar voltar (→ `FAVORITE_STEP`); é o único passo do ritual pago sem saída de correção |
| V3 | Os dois botões da bifurcação com o MESMO peso (product-designer #3) | **Adiado → Fase 2** | O código dá primário ao teste; o custo está declarado; o guarda (c) passa |
| V4 | "Corrigir a data" no muro de idade sem perder o nome (product-designer #4) | **Adiado → STATUS** | Fluxo/código |
| V5 | Copy do batismo diferente no upgrade (D17: é a MESMA criatura) — product-designer #5 | **Adiado → `redator-ux`** | Copy |
| V6 | Uma frase sob a moldura vazia do reveal sem sprite (product-designer #6) | **Adiado → `redator-ux`** | Copy (o código não tem) |
| V7 | Uma ponte / estimativa de tempo no passo 1 do upgrade (product-designer #8 e "o que o autor não viu") | **Adiado → `redator-ux`** | Copy |
| V8 | A barra com denominador fixo (não "encolher") + rótulo de fase (product-designer #1) | **Aceito como nota** | O código escolheu medir o caminho que a pessoa escolheu |

### 17.3 Sai (o que a superfície de hoje tem e o wireframe não tem)

| # | Sai | Motivo |
|---|---|---|
| S1 | **A escala "1 2 3 4 5" com 3 legendas** (rodada 1) | R1 (B2) |
| S2 | **"1 = skip link"** (rodada 1) | R5 (B4) |
| S3 | **"REGISTRO §5.3 (não cobrar no reveal)" como regra vigente** (rodada 1) | É a alternativa que perdeu na 13.1 |
| S4 | **Arte de reserva / "retry" no reveal sem sprite** | D9; `BirthCard.tsx` |

### 17.4 O que fica registrado para depois

- **Checkpoint fechado em 15/09/2026 — aprovação automática (meta do dono).** R1–R5 entram. **Pendente do dono (modal final):** V1 (o reveal demo como piso da 13.1) e V2 (voltar na 1ª pergunta). **Modal final (15/09/2026): o reveal demo entra (13.19) — artboard novo; o voltar entra na 1ª pergunta. Canvas republicado.**
- **Para o cartógrafo:** quatro estados sem linha (a cidade com fuso escolhido; o rascunho retomado; `unlockMessage`; `submitting`); o estado `essence === null` (ramo legado) a confirmar; o skip link inexistente no ritual vale para o funil (§9).
- **Para o `docs/STATUS.md` (achados de código):** (a) a 1ª pergunta do ritual sem `back`; (b) o `setTimeout(1400)` continua no 20º item do teste (só saiu do "revelar agora"); (c) o muro de idade zera até o nome num typo; (d) "Hatch ‹nome›" e a copy do batismo idênticas no upgrade (D17 diz que é a mesma criatura); (e) o reveal sem sprite não diz ao jogador que o desenho vem depois; (f) o ritual não estima o tempo; (g) a favorita nunca é ecoada no reveal (o `soulGoal` é); (h) T8 "problema 1" (retorno invisível de 20 telas) segue sem solução.
- **Para o `staff-frontend`:** R1–R5 e S1–S4 são o diff do Oráculo; nenhum item muda regra de jogo; aceites do guarda: (b) o muro sem erro, (c) a bifurcação sem empurrão, (d) o reveal sem números, (f) o apelido sem dado íntimo, (g) D17, (h) dicas de origem.

## 18. Sistema (identidade — o primeiro canvas da Fase 2): entra / volta / sai (16/09/2026)

- **Canvas:** `docs/design/wireframes/sistema/identidade/` — 8 artboards (SIS-01 Main escuro + claro, SIS-02 Botões, SIS-03 Cards/campos, SIS-04 Folha+Nav, SIS-05 Visor, SIS-06 Estados, SIS-07 Dados). Crítica em `CRITICA.md` (rodada 1: VOLTA, 2 fatais + 13 fixáveis; rodada 2 fechou todos — F1 alvo 44 no chip, F2 fronteira `--sm2-muted` 1px ≥3:1, X1 casado com o `FormKit`, X2 moldura só dentro do vidro, X9 cobre a API inteira do `PixelKit`).
- **Checkpoint do dono (16/09/2026): ENTRA.** Decisões: **P1** tokens de espaço `--sm2-space-1..6` = 4/8/12/16/24/32 + `--sm2-space-half` 2px — aprovados, entram no `index.css` nos dois temas; **P2** criatura no visor = **(a)** 256² desenhada a 128 CSS (0,5× em DPR 2, 1,5× em DPR 3 — transição declarada; regerar a arte em 64² fica como aposta futura); **P3** ícone da nav = 32 (código vence o `CLAUDE.md`, corrigir o texto).
- **Para o `staff-frontend`:** reimplementar os primitivos de `components/pixel/PixelKit.tsx` sobre os tokens `--sm2-*` e o `FormKit` (mesma API — `PixelButton` primary/outline/ghost × sm/md/lg, `PixelPanel`, `PixelTabs`, `PixelChoiceChip`, `PixelTag`, `PixelCheckbox`, `PixelSwitch`, `PixelMeter`, `PixelSegmentedBar`, `PixelSlot`, `PixelChip`), sem PNG fora do visor; `.sm-px-*` sai do `index.css` quando o último consumidor migrar; `ModalSheet` mantém os literais; moldura 9-slice (`hudArt.frame`) como overlay dentro do `.screen` do `Viewport`; `VisorBar` a 1× por `scale`.
- **Para o guarda (`soulmon-guarda-linha-vermelha`):** X10 (contador "moved 3×" em `muted`, nunca âmbar/vermelho), R3 (contagem de comida na folha), R8 (HP crítico em `viewport-danger` dentro do vidro é leitura, não cobrança), medidores do `Dados`.
- **Para o `docs/STATUS.md`:** achados 1–9 do `README.md` do canvas (pixel fora do visor em 28 `.tsx`; `navRotulo.contract.test.ts` mede largura, não fonte; sprites 256² são ilustração e não grade; duas leituras de HP na Home; `components/ui/` em `--foreground/--background`).

## 19. Home (identidade): entra / volta / sai (16/09/2026)

- **Canvas:** `docs/design/wireframes/home/identidade/` — 28 artboards com os nomes do wireframe + `MainClaro`; `CRITICA.md` (rodada 1: VOLTA — F1 tarefa assombrada por opacidade a 2,3:1, F2 dobra reaberta no `Main`/`HomeVazio`; rodada 2 fechou F1, F2 e X1–X12; fidelidade 28/28 pares, 0 texto <12, 0 alvo <44). D-H1…D-H9 como o crítico decidiu: D-H5 reduzido ao balão (não cobre o sprite), "Evolve" em Silkscreen 14 na moldura pixel; D-H8 = `toys`/`groups`.
- **Checkpoint do dono (16/09/2026): ENTRA.** Decisões: **P6** `toys` (Brincar) e `groups` (Biblioteca) entram no subset da Material Symbols (+2 nomes, `.woff2` refeito, `CACHE_VERSION` +1); **P4** `home-scene-1547.png` entra como **textura de página a 10% de opacidade** (`opacity: .1` numa camada `fixed` sob a Home, cards continuam sólidos — exceção declarada à tese do Visor, em nome do dono; contraste medido contra a superfície sólida, não contra a cena); **P5** cor PRÓPRIA para a tarefa assombrada — token novo `--sm2-haunted` com par claro/escuro proposto pelo lead (escuro **`#85A0B8`** (o `#6E8AA3` proposto media 4,21 — corrigido no §20) / claro `#4E6A83`, azul-acinzentado "fantasma", ≥4,5:1 sobre `surface` nos dois temas — validar no `tokens.contrast.test.ts`); **P7** segmento = cubo.
- **Para o `staff-frontend`:** implementar a Home sobre o canvas: `CompanionHUD` (vidro 348×200 com anel 356, `bg-room`/cenário equipado, sprite 256² a 128 CSS, `VisorBar` HP/EN com placa `color-mix(viewport-bg 78%)`, berço 220×104, decoração, balão sem borda acima da cabeça, FX do `animArt`, "EVOLVE" Silkscreen 14 na moldura `hudArt.frame` ½× sobre a placa), `HomeHud` (barra DOM do topo em vetor — decidir com o lead se a duplicidade de HP sai: **sai**, a leitura fica no vidro; o topo mantém só rituais x/y e Bits), fileira de ações com ícones pelados 32 (`restaurant`, `inventory_2`, `shower`/`cleaning_services`, `bedtime`, `toys`), avisos (`sm2-notice` em âmbar — nunca vermelho), lista de rituais, folhas (`AlimentarFolha`, `ItensPastinha`, `PlayEstados`, `ChatEstados`), `BottomNav` Rubik 12/500 + sublinhado 3px, textura P4, `--sm2-haunted` na tarefa assombrada (linha em tinta `haunted` sólida + chip `gold-ink`), `ScreenSkeleton` sem Silkscreen fora do vidro, cocô sai do `figma:asset` (usar `soulmon/icons` ou o poop de `_gemini_out/icons/poop.png`).
- **Para a `squad-arte`:** caps da `VisorBar` ao `max`, berço 110×52 e cenário 176×100 nativos (transição), `anim-sleep-z` em tom claro, sombra 64×16.
- **Para o lead (Atividades):** selo do hábito na Home `eco` → `event_repeat` (Atividades D-A2 usa `eco` como maturidade).

## 20. Atividades (identidade): entra / volta / sai (16/09/2026)

- **Canvas:** `docs/design/wireframes/atividades/identidade/` — 17 artboards + `MainClaro`; `CRITICA.md` (rodada 1: VOLTA — F1 opacidade herdada do bloco da Home, X1–X9; rodada 2 fechou tudo: gerador reprova `opacity < 1` no telefone; fidelidade 17/17). D-A1…D-A9 como o crítico decidiu (D-A3 derrubada → tinta, nunca alpha; `--sm2-haunted`).
- **Checkpoint do dono (16/09/2026): ENTRA.** Sem pendência do dono. Decisões do lead: `--sm2-haunted` escuro **`#85A0B8`** / claro `#4E6A83` (corrige o §19); selo do hábito na Home `eco` → `event_repeat` (`eco` é maturidade); Someday = `nightlight`; glifo de assombrada = `visibility`.
- **Para o `staff-frontend`** (depois da Home, porque partilham `RitualPanel`/`TaskMeta`/`StepRow`): lista de atividades sobre o canvas — janela de 7 em formas 12px (● fill · ◆ contorno · ○ anel · —), selo = tipo (`task_alt`/`event_repeat`) 24 `muted`, maturidade = `eco` FILL 0/.34/.67/1 (`TIER_FILL`), aura de 28 dias = FILL 1 + halo `primary-soft`, esmaecer por tinta `muted`, assombrada `haunted` + chip âmbar, contador de adiamentos 24px sem borda em alvo 44, aviso de carga = `role=status` em `gold-ink` sem moldura, folhas de decisão sem primário (`outline`), folhas > 844 em fluxo, ícones de categoria por `CATEGORY_ICON_NAME` (sem `icon-cat-*.png`), `CriarAtividade`/`EditarTarefa`/`CapturaRapida`/`TriagemFila`/`TriagemFim`/`EquilibrarSemana`/`NudgeAdiamento`/`GuardadasEstados`/`FichaHabito`/`CargaDoDia` conforme os artboards. Achados 1–17 do README (dois modais de criação, "0/3 steps", `<details>` a `.75`, "Bring back" 36px) são para consertar junto.
- **Para a `squad-arte`:** quadro de bocejo do pet (CargaDoDia).

## 21. Rituais (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/rituais/identidade/` — 21 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X5 aplicados: escala inteira na cerimônia — sprite 128, emblema 64; confete fora do título; cerimônia sem 🌿 na copy; emblemas de marco `habit-7/21/66`; `role=dialog` na cerimônia). D-R1…D-R12 confirmadas. Fidelidade 21/21.
- **Checkpoint do dono (20/09/2026): ENTRA.** Sem pendência do dono.
- **Para o `staff-frontend`:** os 8 componentes de ritual sem pixel fora do visor (`MorningCheckIn`, `DailyReportModal`, `WeeklyReportCard`, `MorningDream`, `MilestoneCeremony`, `ProtectProgressModal`, `FirstTaskCompletedPopup`, `WelcomeInstall/Notifications`) sobre `.dlg` SIS-06 + scrim literal; manchetes Material (`bedtime`/`star`/`wb_sunny`/`nightlight`), confete em SVG vetor na faixa da estrela; sonho 96 a 1× e aventura 48 dentro de vidro; cerimônia de marco num `.dlg` com vidro 208×144 (sprite 128 + emblema `emblemFor(tier)` 64), `MILESTONE_TEXT` sem emoji, `tierIcon` → `emblemFor`; carinhas de humor = emoji (copy de `mood.ts`); saídas em `outline`, nunca `quiet`; `.focus-row` inerte por forma+tinta, não opacidade; copy S1–S8 e ordem R2 do relatório; `FirstTaskCompletedPopup` sob os intersticiais (R8) e a tensão × vs V1 fica como está (fidelidade). Achados 1–19 do README.
- **Para a `squad-arte`:** ✅ `habit-21`/`habit-66` gerados e instalados em `663b9de5`.

## 22. Pet (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/pet/identidade/` — 9 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X7 aplicados). D-P1…D-P12 confirmadas (D-P1 aba ativa em `primary-soft`+`primary-ink`; D-P5 visor de emblemas como exceção declarada `[novo — código 15/09]`).
- **Checkpoint do dono (20/09/2026): ENTRA.**
- **Para o `staff-frontend`:** `PetPage` — heroína 256² a 128 centrada no vidro 192² (hoje estica a 192), aura `fx-<el>-aura` a 2× com corte declarado (opacidade 1), sigilo de classe 192²→48 no canto superior esquerdo do vidro (quando a classe existir no save; hoje sem consumidor), visor de emblemas: com 9 conquistas não cabe em 284 → **duas linhas de 158×20 (×2)** ou 1× a partir de 9, gap 2, só abertos, linha quieta "Achievements · N of 9" sob o visor; ícone de habilidade Material (`bolt`/`auto_awesome`), sem `el-*.png` na ficha; Dex = slot SIS-07 (mini-visor 64² sem anel) com cena a 48, silhueta por `mask-image` em `color-mix(viewport-bg 58%, viewport-ink)`; diário Rubik 14 `ink`; `#NN · data` alinhados. Achados 1–15 do README.
- **Para a `squad-arte`:** aura 96² para o vidro 192 (canto livre para o sigilo).

## 23. Onboarding-funil (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/onboarding-funil/identidade/` — 17 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X6 aplicados: `TutorialTarefa` sem estado impossível, "Enter a valid email." em `role=alert` âmbar, chama do portão num slot-visor `viewport-bg`, intro = `.screen.splash` full-bleed, rodapés corrigidos com a 13.19 citada, `aria-busy` declarado, "·" órfão fora). D-O1…D-O16 confirmadas (D-O3/D-O4 revistas). 5 exceções de fidelidade declaradas (6 personagens, `role=img` da heroína ×2 e do slot da marca, `role=alert`, `aria-busy`).
- **Checkpoint do dono (20/09/2026): ENTRA.**
- **Decisão do lead (13.19):** o reveal demo (`REGISTRO-DE-DECISOES.md` §13.19) já vive no canvas `onboarding-oraculo/` (ONB-44); ONB-16/20/34 ficam onde o wireframe os pôs — a bifurcação não muda de lugar, só o destino do demo ganha reveal. `customKey` (objetivo como 1ª linha selecionável em `GameTutorialFlow`) é achado para o cartógrafo, mantido no código.
- **Para o `staff-frontend`:** splash = visor em tela cheia (chama do kit a 4× já vetorizada, sem opacidade/sombra, barra de 8 segmentos sem alfa — achado 2), paleta do visor num ÚNICO escopo `.sm2-visor` no `index.css` (D-O16; par visor × `viewport-bg` claro no `tokens.contrast.test.ts`); intro = mesmo `.screen.splash` com o vídeo `cover` dentro, corvo só no vidro, quadro inteiro `role=button` "Skip intro"; portão: chama num slot 64×80 `viewport-bg`, segunda porta `outline`, links legais `role=link` ghost 44 sem "·"; e-mail malformado = `role=alert` "Enter a valid email." âmbar + anel; alertas âmbar, nunca vermelho; perguntas abertas puláveis; `EscolherPersonagem` com os 6 personagens (heroína 128 em vidro 192², tonalidades como slots 64); tutorial = aparelho (chips/sugestões vetor, inerte por forma; teto do tutorial com `role=status`), `TutorialTarefa` com "Suggest tasks with AI" vivo quando há objetivo. Achados 1–13 do README.

## 24. Evolução (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/evolucao/identidade/` — 15 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X9 aplicados: burst 3× na cerimônia e nenhum na reduzida, faísca quadro 4 no canto sem sobrepor, vidro do nó **80** com corte 0 %, anel ALCANÇADO `primary-deep` 3px, BLOQUEADO `muted` 3px, demo sem aura, plural real, degeneração em `outline`). D-E1…D-E12 confirmadas; fidelidade 15/15 (o wireframe `EvolveTaskModal.dc.html` ganhou o plural — X7).
- **Checkpoint do dono (20/09/2026): ENTRA.** Sem pendência.
- **Para o `staff-frontend`:** `EvolutionPath`/`SoulNode`/`EvoTrail`: nó = `<svg>` por token (H1 a) em volta de um vidro circular 80 (`viewport-bg`) com sprite a 0,25× (64) ou silhueta por `mask-image`; anéis: atual `primary-ink` 3px + halo, prevista tracejada `primary-deep`, bloqueada `muted` 3px, alcançada `primary-deep` 3px; cadeado = seleção (`primary-soft`+`primary-ink`, `lock` FILL 1) e placa "ON HOLD" Silkscreen 14 dentro do vidro (mesma peça do "EVOLVE"); visor da forma atual 192² com sprite 128, aura só com oráculo (demo sem aura); placeholders v3 a 64 nos nós (GERANDO/RESERVA_FINAL, já ligados); `Cerimonia` = visor de tela cheia com o vídeo como cenário dentro do vidro, `gain-evolution-burst` a 3× atrás do sprite 128, faísca quadro 4 no canto, faixa de aparelho "EVOLVED INTO"/nome/data/primário; reduzida = 64 → `arrow_forward` → 128 sem burst; `EvolveTaskModal` "complete N tasks per day" plural real; degenerar/confirmar `outline`, "Be reborn" inerte por superfície, recusa motivada (`not-paid` UnlockNudge, `not-ultra` sem convite, `already-used` registro); `.sm-px-node-*`/`.sm-px-tree-*` saem. Achados 1–17 do README (V2 "tap to lock" → `aria-label` diz o que o toque faz).

## 25. Jogos (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/jogos/identidade/` — 16 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X7 aplicados: faísca no lugar do inimigo derrubado, `favorite` 20, Arena sem estado impossível + `auto_awesome`, visor da run 176 em todas as fases, Bits em `ink`, README medido). D-J1…D-J16 confirmadas; fidelidade 16/16.
- **Checkpoint do dono (20/09/2026): ENTRA.** Decisões do lead: (a) D-J13 mini-visor 32 do ranking = transição condicionada aos 36 ícones 32² (linha × tier) que a `squad-arte` gera (+ 64² para Dino/oponentes); (b) D-J5 barra do inimigo em `gold-fill` com a regra "a barra do outro nunca divide tela com Emblemas/faixa"; Bits em `ink` (mesma resposta para Loja X4) — `bitsStyle.color` → `--sm2-ink` na migração + par no `tokens.contrast.test.ts`.
- **Para o `staff-frontend`:** `ActivitiesPage` (hub de jogos: cards com ícone Material pelado, Bits "N Bits" mono sem ícone, Emblemas serifa dourada), `DungeonGame`/`NightmareBattle` (o minijogo é o conteúdo do vidro 348×176: cena `cover`, pet/inimigo 128, FX 128 a 1× — faísca no inimigo derrubado, espírito 1×; chrome = aparelho vetor: Fredoka 20, × 44 pelado primeiro, barras de HP `.meter` fora do vidro "You" ciano / o outro `gold-fill`, nunca ❤️/vermelho; popups `role=status` com FX em mini-visor 64 + título Rubik, mesma tinta em "PERFECT!" e "Too slow!"; `.sm-px-arcade-*`/`.sm-px-card`/`.sm-px-dark-ctx`/`.sm-px-jump` saem), `DinoGame` (chão/parallax 1×, pet 64 no vidro; pular = aparelho), `RPSGame` (mãos 64 + "VS" Silkscreen 14 no vidro; `.sm-px-chip-btn` sai), `ArenaGame`, `TournamentPage` (sprite solto → mini-visor 64; abas → sublinhado; alerta → filete âmbar; faixa antes do ranking; oponente sem faixa; ranking com mini-visor 32 como transição). Achados 1–16 do README (a11y: "Fight" com nome acessível "Challenge ‹nome›" — WCAG 2.5.3).
- **Para a `squad-arte`:** 36 ícones-ficha 32² (9 linhas × 4 tiers) + 64² para Dino/oponentes; cenas de jogo em grade 1× (176×88 / 154×80) opcional.

## 26. Loja (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/loja/identidade/` — 7 artboards + `MainClaro`; `CRITICA.md` (rodada 1: VOLTA — F1 palco `[novo]` com prova falsa; rodada 2: palco SAI, X1–X6 aplicados: tag "Equipped" na coluna de texto, recusa só no filete + região, valores em mono, Bits em `primary-ink` como `bitsStyle`, README medido, `aria-label` em `<span>` → `<p>`/`<output>`; amostras alinhadas ao `shop.ts`). D-L1…D-L11 confirmadas; D-L12 sai; fidelidade 7/7.
- **Checkpoint do dono (20/09/2026): ENTRA.** Correção da §25: Bits ficam em **`primary-ink`** (`bitsStyle` do `currencies.ts` vence; Jogos alinha na implementação).
- **Para o `staff-frontend`:** `ShopModal` — segmentos (Itens/Cenários/Mobílias/Torneio/Missões) ativos em `primary-soft`+`primary-ink` + sublinhado; card = aparelho vetor com o item em mini-visor 72² sem anel (chips 96²→48, mobílias 0,5×), cenário em miniatura 96×52 (transição até a `squad-arte` gerar 1×); equipado = anel 2px `primary-ink` por fora do vidro + tag `check_circle` na coluna de texto; travado inerte por forma (tracejado, `muted`, véu `color-mix`, `lock` na tag) com a dica da missão; sem saldo = preço em `muted` + recusa em filete/região `gold-ink` (nunca `danger`); três moedas: Bits mono `primary-ink` sem ícone, Emblemas `military_tech` + serifa dourada, Créditos `diamond` `--sm2-credit-ink`; troca 1 Crédito = 10 Bits com degraus em mono; convite passivo sem ×; `.sm-px-*` da loja saem; uma única região `status` para saldo. Achados 1–14 do README (R4 `UnlockNudge` 440 × nudge 280; R6 diâmetros 64/72/80 — padronizar 64 fora da loja, 72 na loja).
- **Para a `squad-arte`:** miniaturas 96×52 a 1× dos 28 cenários.

## 27. Estatísticas (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/estatisticas/identidade/` — 7 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X4 aplicados: amostra sem a Serah — as 3 tiras foram recortadas em `7ea27825` e o guard `sprites.umQuadro.contract.test.ts` trava D5 —, `Lucky → star`, marcador de dobra no `Vazio`, README). D-S1…D-S12 confirmadas; fidelidade 7/7.
- **Checkpoint do dono (20/09/2026): ENTRA.** Bestiário = **36** (9 × 4; os 4 lugares que diziam 24 corrigidos em `dec06406`).
- **Para o `staff-frontend`:** `StatsPage` — vínculo como PALAVRA Fredoka 24 + "Level N" + `.meter`; traço/ritmo com ícone Material 24 pelado (mapa D-S2: `restaurant`/`event_repeat`/`star`…); `BirthCard` = o mesmo do reveal (sprite 128 em vidro 192² com anel), sem epíteto quando não houver; encontros (`BestiaryCard`) e álbum em mini-visores 64² com sprite 0,25× ou silhueta `mask-image`; estação = calendário, medalhas `military_tech` `gold-ink`; só o dígito no "0"; **`hideMetrics` tem que chegar à `StatsPage`** (hoje não chega — aceite cobre o `progressbar` do vínculo e "Level N"); teste de render da `StatsPage` (hoje nenhum). Achados 1–15 do README.

## 28. Social (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/social/identidade/` — 8 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X4: D-C7 volta ao `.seal` SIS-06 literal, D-C10 com "Create" `primary` e "Join" `outline` vivos, tiras da Serah registradas, D-C9 `.dlg` primitivo). Fidelidade 7/8 + `GrupoSemGrupo` com exceção declarada (strip de estados).
- **Checkpoint do dono (20/09/2026): ENTRA.**
- **Para o `staff-frontend`:** `LibraryPage`/`CoopPanel`/perfil — criatura do outro em mini-visor 64² (0,25×) / 192² (0,5×) no perfil, nunca avatar; abas `role=tab` tonais + sublinhado; inerte por forma (tracejado + `muted`, e `aria-disabled` não focável); `add` ciano, `paid` tinta, remover `muted`; alertas `role=alert` âmbar (o `danger-ink` sai); `OfflineSeal` = `.seal` (já é); galho do perfil em `ink`; perfil em `.dlg` (`RitualDialog`), "Create" primário, "Join"/"Try again"/"Leave" `outline`; 🌿 fora do `role=status` (`CoopPanel.tsx:183`); `astrase-rookie` com margem no 64 (squad-arte). Achados 1–18 do README.

## 29. Conta (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/conta/identidade/` — 14 artboards + `MainClaro`; `CRITICA.md` (0 fatais, X1–X4: "2 of 3" (`AD_DAILY_CAP`), "4 of 30" (`DREAM_CATALOG`), contagens em Rubik 500 tabular e valores contínuos em mono, **"Redo" volta a `primary`** — D-K6 só para perda irreversível). D-K1…D-K10 confirmadas; fidelidade 14/14.
- **Checkpoint do dono (20/09/2026): ENTRA.**
- **Para o `staff-frontend`:** `SettingsPage`/`AccountSection`/`AccountDataSection`/`CreditsModal`/`RestWindowCard`/`StepsCard`/`NewReadingModal`/`UnlockAccountModal`/`GuideModal`/`HelpModal`/`SoulTestItem` — tudo aparelho: grupos = card SIS-03 Fredoka 20, `SwitchRow`/`ActionRow`/`Disclosure` 44, radiogroups tonais, horas/saldos/preços/passos em mono `tabular-nums`, contagens em `.sm2-num`, Créditos `diamond` `credit-ink` + número `ink`, `.meter` para constância/passos, `hideMetrics` mantém os sonhos; `outline` para "Erase now"/"Cancel", `quiet` para "Go back"/"Sign out"/"Default"/"Already bought", "Redo" `primary`; `role=alert` âmbar; 503 = painel neutro; inerte por forma; `UnlockNudge` 440 × nudge 280 (padronizar 280 nas folhas); skeleton sem Silkscreen; `RestWindowCard`/`StepsCard` sem kit pixel, `ModalSheet` sem 9-slice. Achados 1–15 do README.

## 30. Fora do app (identidade): entra / volta / sai (20/09/2026)

- **Canvas:** `docs/design/wireframes/fora-do-app/identidade/` — 7 artboards + `MainClaro`; `CRITICA.md` (rodada 1: VOLTA — F1 widgets fora de escala, F2 widget D com "—" contra a 13.16; rodada 2: widgets a **1:1 dp** com texto 13sp/12sp, sprite 64/48/32dp, coração 16dp, camadas removidas em vez de comprimidas; D sem contador no zero (e o wireframe cinza corrigido); X1–X10). D-F1…D-F15 confirmadas; fidelidade 7/7 com as exceções declaradas (B sem frase, D sem contador).
- **Aprovação automática (regra do dono, 20/09/2026): ENTRA.** Decisões do lead: (a) criatura real no widget via `setImageViewBitmap` (as 11 formas de estágio; uma cara só — `rookie.png` = Pixel); (b) B sem frase / D sem contador aceitos como exceção de fidelidade; (c) pool de frases do widget D com teto ~22 chars (`redator-ux`; `ellipsize` como rede).
- **Para o `staff-frontend`/Android:** widget = visor (anel `<shape>` stroke chapado 3dp `#C68642`, vidro `#071413`, raio `system_app_widget_background_radius`), sprite via `setImageViewBitmap` nos tamanhos 64/48/32dp, corações `VectorDrawable` do `favorite` em `#E9F5F2` (vazio = contorno) — `heart_full.xml` vermelho SAI, `bar_on` verde SAI → `primary-fill`; texto `sans-serif-medium` 13sp/12sp, `tnum`; contador só com ≥1 (`setViewVisibility(GONE)` no zero); `partner_area.png` (68 B) e `ui_t_bg_01` saem; paleta fixa nos dois temas (exceção declarada). Overlay Electron: faixa `STRIP_HEIGHT` 72 com `rookie.png` a 64 e balão Rubik, menu 340×≤520 vetor (`local_fire_department` + wordmark, `settings`/`expand_more`/`close` 44, estado `favorite`/`bolt`/`restaurant`, retrato 128, `volunteer_activism`/`restaurant`/`shower`/`bedtime`, "Today's tasks" sem dígito, `diamond` `credit-ink`), dormindo por filtro (nunca opacidade), paleta roxa do DigiApp sai do `style.css`, 3 `.woff2` no build do desktop. Push: `ic_notification` chama; `largeIcon` = mini-visor redondo com a chama; acento `#0B6F68`; `badge-96.png` alfa-only no `sw.js` do Web Push; copy literal de `_pushCopy.js`. Achados 1–23 do README.
- **Para a `squad-arte`:** sprites 96²/48² nativos (opcional), `poop_32`, `glyph-food-32`/`glyph-sleep-32`.
- **Implementado pelo `staff-frontend` (20/09/2026, commits `bf732d1c` widgets · `faad9c18` overlay · `e3851a92` push). Onde a regra venceu o canvas, ou o código pediu outra coisa:** (1) o cocô do widget C não esperou `poop_16.png` — é o quadro 3 de `anim-poop-plop` recortado (`drawable-nodpi/fx_poop.png`, 40², a 16dp); (2) os `sprite_*` foram para `drawable-nodpi/` e o renderer decodifica cru (`inScaled=false`) e reescala UMA vez para `dp × density` — o bucket de densidade (D-F2) ficou dispensável; (3) o raio do anel é `system_app_widget_background_radius` só em `drawable-v31/`; abaixo (API 26–30) 12dp; (4) o texto secundário do widget é `#AAB6B4` (o literal do canvas, 8,99:1), não o `muted` do tema (`#9DBCB4`) — o widget não tem tema; (5) FX de comida e sono no overlay usam `restaurant`/`bedtime` Material até os glifos pixel existirem (D-F10 pendente da `squad-arte`), nunca emoji; (6) `MENU_SIZE` no Electron = card 340×520 + 12 de sombra por lado (a janela é 364×544; o CARD é o que o canvas mede); (7) meio coração na linha de estado do overlay conta como contorno; (8) FCM v1 não tem `largeIcon` e `image` vira BigPictureStyle — o mini-visor redondo fica no Web Push e no `AlarmReceiver` (`setLargeIcon`), o FCM leva só `icon` + `color`; (9) "Don't forget about me today!" saiu do pool do widget D e o guard `widgetSemCobranca.contract.test.ts` agora trava `"0/"`, o traço e a frase; a poda do pool a ~22 chars continua com o `redator-ux` ((c)). O que só o CI/aparelho prova: o build Android (sem JDK local — XML validado por parser), `setImageViewBitmap` dentro do teto do RemoteViews, o raio do sistema no launcher, o badge alfa-only na barra de status.

## 31. Onboarding-oráculo (identidade): entra / volta / sai (20/09/2026) — o 13º e último canvas

- **Canvas:** `docs/design/wireframes/onboarding-oraculo/identidade/` — 12 artboards + `MainClaro`; `CRITICA.md` (rodada 1: VOLTA — F1 "Continue with a demo character" sem peso de primário contra a 13.1; rodada 2: F1 `primary`, X1 criatura do demo em SILHUETA (13.19), X2 âncora da oferta fora do telefone, X3 casulo pulsando de verdade, X4 barra do demo pela fórmula, X5 as duas portas da bifurcação em `outline`, X6 README). D-Q1…D-Q13 confirmadas; fidelidade 11/12 (`Reveal` pago sem a âncora — exceção declarada).
- **Aprovação automática (regra do dono, 20/09/2026): ENTRA.** Com isto os 13 canvases de identidade estão aprovados (§18–§31).
- **Para o `staff-frontend`:** `SoulmonOnboarding` (ritual, bifurcação, teste, gerando, reveal, batismo, upgrade) — barra do ritual `.meter` 8px, voltar `arrow_back` 24 pelado em alvo 44, opções = cards 44 tonais (`role=button aria-pressed`), bifurcação = duas portas `outline` de mesmo peso (teste primeiro), `Gerando` = `forming` 128 no vidro 192² pulsando por posição (`steps(2)`, nunca opacidade; reduced-motion parado; `sync` girando; texto oculto no `role=status`), `Reveal` = `BirthCard` (sprite 128/vidro 192²/anel) + epíteto `gold-ink` + batismo pré-preenchido, oferta 13.1 fora do reveal pago; `RevealDemo` = silhueta da linha (`mask-image`) + "Continue with a demo character" `primary`; `RevealSemSprite` = `forming` → `dormant` após o teto (nunca `glitch`, nunca arte de reserva) + "The drawing is still being made — it arrives on its own, later."; erros em âmbar; muro de idade sem alerta; corvo e spinner saem do `Gerando`. Achados 1–10 do README.
