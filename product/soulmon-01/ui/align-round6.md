# Alinhamento — rodada 6 (cinco passadas de QA de design)

Sessão de 15/08/2026, na sequência da rodada 5 e no mesmo branch/PR (#5).
Pedido do dono: *"mais 5 rodadas de QA de design para deixar idêntico à
referência"*. Mesmo método: build real + Playwright, 412×915 @2x, PT-BR,
claro e escuro; cada passada = fotografar → comparar com `docs/ui-refs/` →
corrigir → re-fotografar.

## Passada 1 — as telas que nenhuma câmera tinha visto

Fotografadas pela primeira vez: **Estatísticas** (aba), **Guia**, **Glossário**,
**Relatório diário**, **CreateModal/EditModal** e a Masmorra **em batalha**.
Achados corrigidos:

- **Guardrail de moeda violado em Estatísticas**: Bits apareciam com ícone 💠
  e fonte comum — exatamente a confusão que a regra das três moedas proíbe.
  Agora: sem ícone, número em fonte de calculadora (`bitsStyle`/`bitsStyleLight`
  de `utils/currencies.ts`, escolhido pelo tema).
- ⚡/⭐ do overview → ícones pixel do kit (`icon-bolt`/`icon-star`).
- Cartões de traço/ritmo e tiles da jornada: pílula arredondada → canto reto
  com fio de cobre.
- **Relatório diário**: quadrado pastel arredondado do cabeçalho → placa reta
  com fio de cobre; X de fechar quadrado; carinhas de humor em caixa reta com
  fio de cobre (emoji continua sendo o conteúdo — item A16 do backlog de arte
  cobre o cabeçalho line-art).
- **Create/Edit/TaskEdit**: todos os campos (nome, passos, data, hora) →
  `.sm-px-field`; segmento Atividade/Tarefa → chanfro ciano do kit.

## Passada 2 — a batalha da Masmorra e o vazio (P4)

- **"Atacar!" era a última pílula Material dentro de um jogo**: virou `.sm-btn`
  com a cor de ação do turno repintando moldura e banda de quina juntas.
- Barra de timing e barras de HP: pílula → trilho quadrado com fio de cobre.
- **Dino**: o miolo (canvas + botão de pular) agora centraliza entre o header
  e a nav (`margin: auto`) — mata os ~800px de vazio morto no rodapé sem tocar
  no canvas de 240px. PPT já preenchia a tela (flex) e a Masmorra já centrava.

## Passada 3 — onboarding fino

- Barra de progresso do ritual: **segmentada** (blocos discretos via camada de
  gradiente sobre o preenchimento ciano — a leitura da barra do kit, sem asset).
- Conferidos em screenshot: DEMO_PICK (cards chanfrados), REGISTER (campos com
  foco ciano), quiz (opções `.sm-px-choice` com `aria-pressed`).
- **O REVEAL não é fotografável em sandbox**: só existe no fluxo pago
  (`purchase` real) ou no ritual de upgrade — registrado como o único buraco
  de cobertura restante do T6.

## Passada 4 — varredura do tema claro

Todas as telas re-fotografadas no claro depois das mudanças. Nenhuma peça
divergiu: HUD/painéis mantêm a identidade (chips escuros, painel branco com
moldura), campos chanfram, Torneio ficou teal nos DOIS temas (a rodada 5 só
tinha sido verificada no escuro), Dino centralizado idem. O fundo
cinza-lavanda que assombrava o claro era o backdrop roxo dos modais — já
convertido na rodada 5 e confirmado aqui.

## Passada 5 — quinas no pixel + portões

Recortes ampliados (DPR 8) das peças novas: `.sm-px-pop`, `.sm-btn`,
`.sm-px-field`, `.sm-card` — **as quatro fecham a quina** (banda diagonal
encostando nas duas bordas). No `.sm-px-field` há uma emenda de ~0,25px real
onde duas camadas semitransparentes se sobrepõem — invisível em 1×, registrado
por honestidade.

## Portões

| portão | resultado |
| --- | --- |
| `npx tsc --noEmit` | 0 erros |
| `npx vitest run` | 1229 passando, 1 pulado, 6 falhas pré-existentes de ambiente (idênticas no commit base) |
| `npm run build` | ok |

## O que segue sendo só-arte (prompts em `docs/BACKLOG-ARTE-GERAR.md`)

A9 fundo do Torneio teal · A10 banho/dormir/acordar pixel · A11 mãos do PPT ·
A12 berço "sentável" · A13 splash · A14 textura de circuito · **A15 traços de
nascimento** e **A16 ícones do relatório diário** (novos desta rodada) ·
mais os antigos A2–A8.
