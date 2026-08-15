# Alinhamento — rodada 5 (o legado fala a língua do kit)

Sessão de 15/08/2026, pedido do dono: *"análise do app + tudo que falta para
ficar exatamente como as referências (`docs/ui-refs/`), com .md de prompts de
imagem e implementação de tudo que for possível"*.

Verificação: build real (`vite preview`) + Playwright headless (Chromium do
ambiente), viewport 412×915 @2x, PT-BR, **tema claro e escuro**, com o
onboarding percorrido de ponta a ponta por um driver automatizado (o seed das
demais telas é o `localStorage` que o próprio ritual produziu). Screenshots de
todas as telas navegáveis, antes e depois.

## 0. Onde o app estava (auditoria)

As rodadas 1–4 tinham vencido nas telas que tocaram: Home, Loja, Biblioteca,
Atividades, Masmorra, Dino e a árvore da Evolução estão alinhadas à Ref C — a
diferença restante nelas é conteúdo, não linguagem. O que a auditoria achou de
estrutural foi um padrão único com muitas caras: **as telas que nenhuma rodada
tocou ainda falavam Material**, e todas falavam Material pelos MESMOS dois
primitivos (`.sm-btn` estilo Duolingo, `.sm-card` arredondado com sombra):

1. **Onboarding inteiro** (a única tela que 100% dos usuários veem — buraco já
   apontado no gap-analysis r2 e nunca fotografado até aqui).
2. **Tutorial de jogo** (textarea/cards Material).
3. **Topo da página de Evolução** (abas EVOLUÇÃO/ESTATÍSTICAS em pílula,
   cards arredondados, chips de galho em pílula azul).
4. **Modais legados** (notificações/instalar, criar/editar tarefa, créditos,
   desbloqueio, relatório) — e todos os **backdrops eram roxo-tinta**
   `rgba(42,36,64,…)` da paleta ANTIGA, o que no tema claro pintava a tela
   inteira de cinza-lavanda.
5. **Popover do menu** (nav inferior) — arredondado, sombra difusa.
6. **Vazamentos de roxo**: fundo do Torneio (arte gerada na paleta velha, nos
   2 temas), gradiente da arena do PPT (`#14101f→#241a38`), valor de
   dificuldade da Masmorra (`#c084fc`).
7. **G10 nunca aplicado**: o fundo de circuito ciano tênue da Ref C.

## 1. O que foi feito (tudo verificado em screenshot depois)

**A jogada central: em vez de converter tela a tela, os dois primitivos
legados passaram a desenhar o kit.** `.sm-btn`/`.sm-btn-secondary`/
`.sm-btn-gold` e `.sm-card` agora são chanfro de octógono + moldura de cobre +
banda de quina (registrados na regra da rodada 4, com as 4 travas do contract
test passando). Nenhum call-site mudou de nome — onboarding, tutorial, modais
e o topo da Evolução converteram de uma vez.

Peças novas no kit (fim do `index.css`, seção "RODADA 5"):
- `.sm-px-pop` — popover chanfrado do menu (com `drop-shadow`, que segue o
  contorno; `box-shadow` seria recortado pelo clip).
- `.sm-px-field` — campo de texto chanfrado (onboarding + tutorial), foco em
  ciano com a banda acompanhando.
- `.sm-px-choice` — opção selecionável (quiz do ritual), estado por
  `aria-pressed` para o visível e o acessível nunca divergirem.
- `.sm-circuit-bg` — a grade de circuito da Ref C em CSS puro, no fundo padrão
  da Home (cenário equipado sobrescreve por inline). O `.sm-pet-sticky` ganhou
  a MESMA grade como fallback de `--sm-pet-scene` — com `background-attachment:
  fixed` as duas camadas casam pixel a pixel.

Conversões pontuais:
- Chips de galho da Evolução → `.sm-px-chip-btn` (banda repintada junto com a
  moldura via `--sm-cham-line` inline); botão de degenerar → `.sm-btn` (perigo).
- Barra "Evolução 0/10 dias" → trilho quadrado com fio de cobre.
- `WelcomePromptModal` → ícones pixel do kit (sino/casa) no lugar do
  lucide em quadrado pastel; era o modal que abria em cima da Home nova.
- Popover do menu → painel chanfrado, itens em Silkscreen caixa-alta.
- Backdrops dos 11 modais → teal profundo (`rgba(6,24,26,…)`/`rgba(4,18,20,…)`).
- PPT: arena roxa → gradiente teal. Masmorra: dificuldade roxa → ciano.
- Torneio: `hue-rotate(265deg) saturate(0.75)` no fundo roxo → teal
  (paliativo declarado; a regeração é o item A9 do BACKLOG-ARTE-GERAR).
- Wordmark "Soulmon" da intro → Silkscreen ciano com glow (era sans bold).
- 10 ocorrências de `background:` inline em peças com banda → `background-color`
  (+ `--sm-cham-line` onde a moldura é repintada), seguindo o footgun da rodada 4.

**Tentado e revertido:** aro do berço na frente do sprite (z-index) — a bacia
de 148px cobre o corpo do pet de 200px. O "sentado na bacia" da Ref C precisa
de arte mais larga e rasa (item A12 do backlog de arte, com o plano de código
anotado no comentário "RODADA 5" do `CompanionHUD.tsx`).

## 2. Portões

| portão | resultado |
| --- | --- |
| `npx tsc --noEmit` | 0 erros |
| `npx vitest run` | 73 arquivos, **1229 passando**, 1 pulado, **6 falhando — pré-existentes** |
| `npm run build` | ok (worker compilado, PNG→WebP) |

As 6 falhas são todas de `GameStateContext.storage.test.tsx` e **falham
idênticas no commit base** neste ambiente: o mock de "storage cheio" não
dispara quota no jsdom daqui. Não é regressão desta rodada — registrado no
STATUS.

## 3. O que falta para "exatamente como as referências"

**Só arte** (prompts prontos em `docs/BACKLOG-ARTE-GERAR.md`, itens novos
A9–A14): fundo do Torneio em teal · ícones Banho/Dormir/Acordar em pixel ·
mãos do PPT (hoje emoji ✊✋✌️, controle primário do jogo) · berço largo
"sentável" · splash da Ref A (wordmark, moldura de cano+vinha, cristais) ·
textura de circuito (opcional, o CSS cobre). Mais os itens antigos ainda
abertos: A2 (botões hover/active), A3 (atributos 128px nativos), A4 (nós de
cristal), A5 (barra segmentada fina), A7 (decoração), A8 (cocô).

**Polimento de código que sobrou** (baixa alavancagem, decidido não fazer
nesta rodada): P4 do r2 (600–1500px de vazio no fim de Masmorra/Dino/PPT/
Biblioteca — pede decisão de layout, não de skin); barra de progresso do
onboarding como `PixelSegmentedBar`; nós do Soul Link continuam SVG até a arte
A4 chegar (a fronteira `nodeArt.tsx` está pronta).

**Decisões que continuam com o dono** (herdadas da rodada 4): ≥3 unidades em
412×700 (sai a marca do HUD ou o dock de chat?) e `.sm-px-slot` na Loja.
