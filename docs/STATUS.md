# Status do Soulmon — registro vivo

Documento único de acompanhamento. **Se algo importante for decidido, descoberto
ou concluído, registre aqui**, senão se perde entre sessões.

- Estado do código e do que está no ar → seções 1 e 2
- **O que depende de você (dono do projeto)** → seção 3
- Dívidas conhecidas que ainda não valem o custo → seção 4

> ## 🌳 14/09/2026 — WIREFRAMES DA EVOLUÇÃO: DESENHADOS, CRITICADOS, CORRIGIDOS — CHECKPOINT DO DONO PENDENTE
>
> Sexto canvas da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed**
> (15 artboards em 3 páginas; `docs/design/wireframes/evolucao/`). 21 linhas `EVO-*`
> desenhadas (a sub-aba Soulmon migrou para o Pet, D1); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §10.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 ordem de foco
>   invertida em 7 artboards; B2 a cerimônia sem semântica de diálogo; B3 risco de FLASH
>   na intercalação; W3 o estado por nó — aplicados/registrados), `soulmon-product-designer`
>   (8 achados: a data e a saída relacional na cerimônia; o gesto duplo do visor; o modal em
>   cima do clímax), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, sem veto:
>   o cadeado avisa dos corações; a data; a pausa antes do modal).
> - **Decisões estruturais** (`[novo]`): a DATA na cerimônia (X1); "Let’s keep going
>   together" no lugar de "Continue" (X2); a tag do cadeado vira "ON HOLD" (X3); o cadeado
>   diz que não protege os corações (X4); estado por nó, offline (D9), reduced-motion
>   como quadro (D7), `role="dialog"` (X5). **Sai:** "Continue", a tag "LOCKED" do cadeado,
>   a intercalação em movimento reduzido.
> - **⏳ DEPENDE DE VOCÊ (checkpoint):** aprovar / devolver / mandar sair. Uma decisão sua:
>   o `EvolveTaskModal` ("cadastre mais tarefas") continua como MODAL logo depois da
>   cerimônia, ou vira um CARD na página de Evolução? O lead recomenda o card.
> - **Achados de passagem (código):** ⚠️ **flash** — a cerimônia intercala sprites brancos
>   de 420 ms até 55 ms (~18 trocas/s) sobre fundo escuro, acima do piso do WCAG 2.3.1 —
>   capar em ≥ 334 ms sempre; `EvolutionCeremony` sem `role`/`aria-modal`/trap/Escape num
>   z-500; não lê `prefers-reduced-motion` (o `MilestoneCeremony` lê); sem a data e com
>   saída neutra; "LOCKED" nomeia duas coisas em EN; o cadeado não avisa que não protege
>   de degeneração; `EvolveTaskModal` no kit antigo com botões só em inglês; o gesto duplo
>   do visor (travar × evoluir); "Degenerate" (dois toques) sem linha no inventário; no
>   demo os estados de sprite nunca disparam.
> - **Branch:** `design/wireframes-evolucao` (pushada). Merge só após o seu OK.
>   Próximo canvas: Jogos.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `ba957ca7` (wireframes do Onboarding-funil)
>
> `doc-mantenedor` (sessão): delta `1ceb3bc8` → `ba957ca7`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — cinco fluxos em
> `aprovado`, 133 das 272 linhas, 12 canvases (D3), `DECISOES-WIREFRAME.md` §9, os 17
> artboards de `onboarding-funil/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md`
> §11 e §17 — a decisão do funil, com a ordem mantida pelo dono, e o bloco de 14/09; nada
> em §13). `01-VISAO.md` fora do delta. Verificados pelo `doc-verificador` em
> 14/09/2026; guard verde (10/10).

> ## 🚪 14/09/2026 — WIREFRAMES DO ONBOARDING-FUNIL: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Quinto canvas da SQUAD-DESIGN (Fase 1; D3 divide o Onboarding em funil + oráculo — este é
> o funil). Canvas publicado:
> **https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6**
> (17 artboards em 4 páginas; `docs/design/wireframes/onboarding-funil/`). 25 linhas `ONB-*`
> desenhadas (`ONB-13` = `fora`, D4); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §9.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 três "Back" que o código
>   não tem; B2 o "carregando" do portão; B3 o rótulo do teto como UI; B4 o skip sem teclado;
>   W3 o par "Sign in" — todos aplicados), `soulmon-product-designer` (6 achados: o nascimento
>   demo sem a criatura; a criatura só na 7ª tela; o objetivo perguntado 2×),
>   `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA**, nenhum veto: rotular o estado
>   pós-marcação em ONB-09; disclosure da IA no tutorial).
> - **Decisões estruturais** (`[novo]`): o sprite grande no cadastro demo (O1); a
>   justificativa do campo de objetivo (O2); o objetivo do tutorial pré-carregado com o
>   `soulGoal` (O3); "Back" nos três becos sem saída (O4); skip da intro com rótulo e teclado
>   (O5); aviso da IA junto do botão (O6). **Sai:** o campo vazio do tutorial, o nascimento sem
>   criatura, a barra contínua (são pontinhos).
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU O1–O7 e decidiu MANTER a
>   ordem de hoje do funil (a criatura continua na 7ª tela; o lead recomendava reordenar).
>   Sem decisão de regra nova.
> - **Achados de passagem (código):** `STRUGGLE_STEP`, `CHOICE_STEP` e `REGISTER` não têm
>   botão de voltar (`back()` sabe, ninguém chama); o `REGISTER` demo não tem `<img>`; durante
>   a checagem assíncrona de auth o portão renderiza a tela sem-Firebase por um tick — tocar
>   "Continue" ali entra sem conta mesmo com Firebase configurado; o skip da intro não tem
>   rótulo nem `onKeyDown`; `/api/suggest-tasks` recebe o objetivo e a `privacidade.html` não
>   menciona o endpoint; o objetivo é perguntado em ONB-14 e de novo em ONB-40; nenhuma copy
>   diz que a 1ª atividade do tutorial é real; a régua "8 telas" (PP Parte 0) × 10 contadas.
> - **Branch:** `design/wireframes-onboarding-funil` — mergeada na `main` (ff) após o OK.
>   Próximo canvas: Evolução.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `b3e4631f` (wireframes do Pet)
>
> `doc-mantenedor` (sessão): delta `8f23d5fd` → `b3e4631f`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — quatro fluxos em
> `aprovado`, 108 das 272 linhas, 11 canvases, `DECISOES-WIREFRAME.md` §8, os 9
> artboards de `pet/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` §11 e §17 —
> a decisão do Pet e o bloco de 14/09; nada em §13: o `REGISTRO` não mudou).
> `01-VISAO.md` fora do delta. Verificados pelo `doc-verificador` em 14/09/2026;
> guard verde (10/10).

> ## 🐾 14/09/2026 — WIREFRAMES DO PET: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Quarto canvas da SQUAD-DESIGN (Fase 1; canvas próprio por D1 — `EVO-22`→`EVO-29`
> viraram `PET-01`→`PET-08`, inventário §1.4a). Canvas publicado:
> **https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e**
> (9 artboards em 3 páginas; `docs/design/wireframes/pet/`). 7 linhas `PET-*`
> desenhadas (`PET-02` = `fora`, D4); decisão do design-lead em
> `docs/design/DECISOES-WIREFRAME.md` §8.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa" — B1 sistêmico: sub-abas
>   desenhadas como `tablist` sem `[novo]`; R1 índice global do `#NN`; R2 raridade em zero
>   num Dex parcial — todos aplicados), `soulmon-product-designer` (8 achados), `soulmon-guarda-linha-vermelha`
>   (**APROVADA COM RESSALVA** — VETO 1a ao `[novo]` que suprimia o "0 of 30": reverteria 13.7).
> - **Decisões estruturais** (`[novo]`): Dex vazio sem a barra em 0% e sem as frações
>   enquanto as três raridades estão em zero — o dígito fica como texto quieto (P1); célula
>   obtida com "#NN · data" (índice global + `dreamDates`, P2); sub-abas como o código (P3);
>   estados da ficha que o inventário não tinha (P4). **Sai:** a barra vazia, o `tablist`,
>   o nível numérico na ficha.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU P1–P4. Sem decisão de
>   regra nova (a tensão 13.7 × PRINCÍPIOS §9 no Dex vazio foi resolvida pelo lead com a
>   régua de E5/A6: dígito quieto fica, barra e frações-todas-em-zero saem).
> - **Achados de passagem (código):** `DreamDex` sempre renderiza contador + `progressbar`
>   mesmo em zero; `rest.dreamDates` é carimbado e nunca exibido; as sub-abas são três
>   `<button>` sem grupo nem estado ativo para leitor de tela; a coluna ficha → Dex → diário
>   não tem sinal de posição ao rolar; três `ScreenSkeleton` empilhados; as duas habilidades
>   do estágio não têm seção no `02-REGRAS-DE-NEGOCIO.md` (só em `utils/soulProfile/ficha/skills`);
>   o estado vazio da ficha (`formas.length === 0`) não tem linha no inventário; a data das
>   formas anteriores tem dois candidatos a dono (`FormAlbum` × ficha) — recomendação: `FormAlbum`.
> - **Branch:** `design/wireframes-pet` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Onboarding-funil (D3).

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `f673a082` (wireframes de Rituais)
>
> `doc-mantenedor` (sessão): delta `96d8dbdb` → `f673a082`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — três fluxos em
> `aprovado`, 101 das 272 linhas do inventário, `DECISOES-WIREFRAME.md` §7, os 21
> artboards de `rituais/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` —
> 13.11 na §4, 13.10 na §8, a decisão de Rituais e o bloco de 14/09 na §11, §17),
> `doc-redator-regras` (`01-VISAO.md`: **sem alteração** — 13.10 mantém "humor nunca
> pontua"; 13.11 não toca no que o doc descreve). Verificados e carimbados pelo
> `doc-verificador` em 14/09/2026; guard verde (10/10). Aviso do redator de regras:
> 13.10 (alvo 5 em `mood-checkins`) e 13.11 (carimbo ao mostrar) são decisões
> registradas, **não implementadas** — o código segue em `target: 3` e no toque.

> ## ☀️ 14/09/2026 — WIREFRAMES DE RITUAIS: DESENHADOS, CRITICADOS, CORRIGIDOS E APROVADOS PELO DONO
>
> Terceiro fluxo da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a**
> (21 artboards em 4 páginas; `docs/design/wireframes/rituais/`). As 26 linhas
> `RIT-*` desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §7.
> - **Crítica em duas rodadas:** `design-critic` (r1 "não passa", 5 bloqueantes B1–B5 +
>   7 ressalvas, todos aplicados na r2), `soulmon-product-designer` (10 achados — o que
>   mudou o canvas: o `FirstTaskCompletedPopup` monta POR BAIXO dos intersticiais e o
>   gatilho é a oferta reduzida; o relatório em ordem de tempo; o retorno com o pet
>   falando), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** — 1 veto de
>   copy: "You're on a good streak!"; 4 vetos ao código que o canvas já corrige; 9
>   ressalvas que viram aceite).
> - **Decisões estruturais** (`[novo]`): o mapa do que vive fora das filas (R1);
>   relatório em ordem de tempo — ontem → humor → convite → CTA (R2); um caminho de
>   volta por superfície — a nota do carinho sai do relatório (R3); retorno de
>   ausência com o pet na peça e a linha da faixa, sem o N (R4); piso de dígitos nos
>   rituais — "not logged", sem "0 of 4", sem "chosen focus: 0", uma anatomia por
>   linha no semanal (R5); estado "aceitei" da oferta reduzida (R6); primeira tarefa
>   como cerimônia, fora das filas de propósito (R8). **Sai:** o × da cerimônia, o
>   número de dias fora, os zeros de dívida, "streak".
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** o dono APROVOU R1–R8. Duas decisões de
>   regra novas no `REGISTRO-DE-DECISOES.md` §13: **13.10** a missão semanal `mood-checkins`
>   fica, com alvo 5 em vez de 3; **13.11** o "1×/semana" do convite no relatório conta ao
>   MOSTRAR (`offerShownWeek` na exibição, não no toque).
> - **Achados de passagem (código):** `FirstTaskCompletedPopup` (`ModalSheet` z-120)
>   monta SOB um intersticial aberto, invisível, com trap próprio — e a 1ª conclusão
>   da vida pode ser o "just 5 minutes today?" do check-in; `ProtectProgressModal` e
>   `WelcomePromptModal` montam no MESMO valor de `interstitial` (duas folhas, dois
>   traps); a linha de carga do check-in lê `plan.plannedEffort` congelado e ignora
>   `focusEffort`; `WeeklyReportCard` imprime "0 of 4", "0 task(s) done" e "(s)";
>   a oferta reduzida não muda nada na tela depois do toque; `MilestoneCeremony` é
>   `role="status"` sem trap/Escape (Tab vaza para o check-in sob o véu z-300);
>   "You're on a good streak!" com gate de 5 tarefas; `restDayUsed`/`weeklyRelief`
>   sem `!welcome`; `offerShownWeek` gravado no toque; "You were away N days";
>   "chosen focus: 0"; `03 §4.21` diz que o gate "substituiu" o timer — coexistem.
> - **Branch:** `design/wireframes-rituais` — mergeada na `main` (ff) após o OK. Próximo
>   canvas: Pet (D1). Para o `staff-frontend`: 13.10 muda `weeklyMissions.ts` (alvo 5);
>   13.11 muda `onOpenOffer`/`offerMoment.ts` (carimbo na exibição).

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `5540226c` (wireframes de Atividades)
>
> `doc-mantenedor` (sessão): delta `f3bec2ce` → `5540226c`, 5 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.7 — dois fluxos em
> `aprovado`, 75 das 272 linhas do inventário, `DECISOES-WIREFRAME.md` §6, os 17
> artboards de `atividades/`), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md` —
> decisões 13.8/13.9 na §2, a decisão de Atividades e o bloco de 14/09 na §11, §17),
> `doc-redator-regras` (`01-VISAO.md`: **sem alteração** — 13.8 e 13.9 aplicam as
> regras de perda 1 e 3, não as mudam). Verificados e carimbados pelo
> `doc-verificador` em 14/09/2026; guard verde (10/10). De passagem: o parágrafo
> "Decididas em 14/09/2026" do `REGISTRO-DE-DECISOES.md` §13 apontava só para a §5
> do `DECISOES-WIREFRAME.md` — 13.8/13.9 moram na §6; corrigido em commit à parte.

> ## 📋 14/09/2026 — WIREFRAMES DE ATIVIDADES: DESENHADOS, CRITICADOS, CARIMBADOS E APROVADOS PELO DONO
>
> Segundo fluxo da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1**
> (17 artboards em 4 páginas; `docs/design/wireframes/atividades/`). As 27 linhas
> `ATIV-*` desenhadas; decisão do design-lead em `docs/design/DECISOES-WIREFRAME.md` §6.
> - **Crítica em três rodadas:** `design-critic` (r1 "não passa", 9 bloqueantes — quase
>   todos de fidelidade ao código; **r2 CARIMBO passa**; r3 = as 7 ressalvas de
>   amostra aplicadas), `soulmon-product-designer` (achado que mudou o canvas: o
>   CTA "+ Nova atividade" abre o `EditModal`, não o `CreateModal`; `handleAddNewTask`
>   não tem chamador), `soulmon-guarda-linha-vermelha` (**APROVADA COM RESSALVA** —
>   3 vetos fechados: "Want to create without limits?", teto trancando edição,
>   recompensa fantasma na triagem).
> - **Decisões estruturais** (`[novo]`): um só modal de criação (CTA → `CreateModal`);
>   linha de hábito = janela de 7 + glifo de maturidade, o resto na **ficha do hábito**
>   (topo do `EditModal`); tarefas concluídas hoje ficam no fim do painel, riscadas e
>   inertes (regra `completeTask` intacta); cabeçalho `feitos/total` sobre o dia devido;
>   carga do dia = 7ª entrada da fila 2 como texto (D10); escudos por hábito, zero só
>   na ficha/Estatísticas (T5). **Sai:** o segundo modal de criação (ATIV-18 perde o
>   caminho vivo), a linha agregada de escudos, "N das últimas 7" na linha.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** aprovado. Decisões novas no `REGISTRO` §13:
>   **13.8** excluir hábito com histórico confirma nomeando o marco; **13.9** passos aceitos no
>   nudge somam à mesma tarefa.
> - **Achados de passagem (código):** o cabeçalho `feitos/total` do painel conta só
>   `tasks` — a tarefa concluída sai da conta, e "5/5" nunca fecha num dia de hábito
>   fora do dia; `"0/3 steps"` impresso antes do primeiro passo (fura o piso);
>   "Retomar" a 36px; "Want to create without limits?" mente para quem paga (o pago tem
>   teto — C-S1); `handleAddNewTask` sem chamador; o `CLAUDE.md` promete recompensa
>   ao terminar a triagem e o código não tem (já em `02 §34`); `03 §4.5` defasado
>   (CTA → CreateModal; "toque no lápis"); `ATIV-05` e `ATIV-18` no inventário
>   precisam de nota do cartógrafo.
> - **Branch:** `design/wireframes-atividades`, mergeada na `main` após o OK.
>   Próximo fluxo P0: Rituais.

> ## 📚 14/09/2026 — MANUAL SINCRONIZADO COM `708893c0` (wireframes da Home)
>
> `doc-mantenedor` (sessão): delta `d2d8dcf9` → `708893c0`, 9 commits, sem módulo
> novo. Redatores: `doc-bibliotecario` (`00-MAPA.md` §6.1/§6.7/§8.1 e
> `12-COMO-MANTER.md` §11 — o hook lê `Test Files` além de `Tests`; a Home
> aprovada e o canvas no índice), `doc-historiador` (`10-DISCUSSOES-E-DECISOES.md`
> — decisões 13.6/13.7, a decisão da Home e o bloco de 13–14/09), `doc-redator-regras`
> (`01-VISAO.md`: **sem alteração**, o doc não descreve o que 13.6/13.7 mudam).
> Verificados e carimbados pelo `doc-verificador` em 14/09/2026; guard verde.
> De passagem: o blob do `REGISTRO-DE-DECISOES.md` tinha virado CRLF no commit
> das decisões 13.6/13.7 — normalizado de volta a LF (conteúdo inalterado); o
> inventário dizia "26 `<TelaEstado>`" para a Home — são 27 (+ `Main`); e o parágrafo da §2.1 do inventário (Home + achados para o
> cartógrafo) nunca tinha chegado ao arquivo — o `replace` de 13/09 falhou em
> silêncio por CRLF; entrou em `ed4d18d3`. Na reverificação o bug do shebang **não
> reproduziu** (vitest 4.1.9 aceitou `#!` com o cache de transform quente); a
> evidência é o commit `95e60ff9` + a saída original desta sessão.

> ## 📐 13–14/09/2026 — WIREFRAMES DA HOME: DESENHADOS, CRITICADOS, CARIMBADOS E APROVADOS PELO DONO
>
> Primeira sessão de desenho da SQUAD-DESIGN (Fase 1). Canvas publicado:
> **https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332**
> (28 artboards em 4 páginas; arquivos em `docs/design/wireframes/home/`:
> `Main.dc.html` + 27 `<TelaEstado>.dc.html` + `canvas.json`). As 48 linhas
> `HOME-*` do inventário estão desenhadas, com rodapé fixo em cada artboard
> (Pergunta · Chega/Sai · Sai da tela atual · Fontes · PT) e ordem de foco
> numerada. Inglês é a língua do artboard (D8).
> - **Crítica em três rodadas:** `design-critic` (rodada 1: "não passa", 6
>   bloqueantes; rodada 2: 1 gate; **rodada 3: CARIMBO passa**),
>   `soulmon-product-designer` (mediu a dobra: "Daily rituals" nascia a 739px
>   com o dock a 722) e `soulmon-guarda-linha-vermelha` (família **APROVADA
>   COM RESSALVA**: 1 veto — o dígito "(N)" do "Arrumar a pilha", `02 §34` —
>   e 4 ressalvas que viraram aceite).
> - **Decisão do design-lead** em `docs/design/DECISOES-WIREFRAME.md` §5
>   (entra / volta / sai). As mudanças estruturais, todas marcadas `[novo]`
>   no canvas: **Play vira a 5ª célula do deck** (`02 §13` já manda; fecha a
>   dobra), **slot de avisos abaixo do pet fixo**, **medidores dentro do
>   palco** (como o código faz desde 27/08 — a rodada 1 reproduzia a
>   composição que você rejeitou), regra única de célula inerte no deck,
>   piso ≥ 1 para dígitos de "feito", sombra de contato, 4 copies novas.
>   **Sai:** EvoTrail da Home, PlayCard, léxico de cobrança da fala idle,
>   o "(N)" da pilha, "ou um carinho" do aviso de HP, "nagging" do recomeço.
> - **✅ Checkpoint fechado em 14/09/2026 (modal):** aprovado. Decisões novas no `REGISTRO` §13: **13.6** pastinha só com itens especiais; **13.7** zero visível só em posse, nunca em dívida do dia.
>   Duas decisões de regra ficaram para você: (a) a pastinha (Itens) também
>   alimenta comida comum, duplicando a folha Alimentar — restringir a
>   especiais é `REGISTRO`, não wireframe; (b) escudos (13.5) são POSSE e
>   podem mostrar zero; "N de M" é dívida do dia e não pode — a distinção
>   está escrita na decisão E5 para não colidir com a 13.5.
> - **Achados de passagem:** (1) `src/docsManual.contract.test.ts` falhava
>   inteiro (0 testes) por causa do `#!/usr/bin/env node` em
>   `scripts/docs-inventario.mjs` — o vite-node avalia o módulo dentro de uma
>   função; **corrigido** (shebang removido; `node scripts/…` continua
>   funcionando). (2) **O hook de sessão mascarava esse FAIL**: só lê a linha
>   `Tests`, não a `Test Files` — vale acrescentar `Test Files` ao grep de
>   `.claude/hooks/session-start.sh`. (3) Inventário: a condição de `HOME-08`
>   não bate com o código (`hideMeters` é fixo no topo desde 27/08; o toggle
>   é `HOME-05`); "retorno após ausência" e "Home rolada" não têm linha —
>   anotado no §2.1. (4) Dívidas de UI: o `ScreenSkeleton` não tem a forma da
>   página; o `HomeHud` entrega a regra por `title=` (invisível no toque e no
>   teclado); "+10%" não existe — o código imprime `+20%`
>   (`PLAY_BUFF_MULTIPLIER`), e o número tem de ser dado, nunca escrito.
> - **Branch:** `design/wireframes-home`, mergeada na `main` após o OK. O hook
>   de sessão passou a ler `Test Files` além de `Tests`. Próximos fluxos:
>   Atividades, Rituais (P0).

> ## ✅ 13/09/2026 — O DONO RESPONDEU AS 20 DECISÕES PRÉVIAS DOS WIREFRAMES
>
> Em modal, uma a uma: as 11 dúvidas do `docs/design/INVENTARIO-WIREFRAMES.md`
> §3.2 e as 9 tensões pesquisa × decisão do `PRINCIPIOS-DE-WIREFRAME.md` §14.
> Registro completo em **`docs/design/DECISOES-WIREFRAME.md`**. O que muda:
> - **Canvases**: Pet e Social ganham canvas próprio; Onboarding parte em
>   funil (5º) e oráculo (último). Ordem final no `HANDOFF-WIREFRAMES.md` §4.
> - **Inglês é a língua do artboard** (PT no rodapé; artboard extra só onde a
>   caixa muda).
> - **Cinco decisões de produto REABERTAS** → `REGISTRO-DE-DECISOES.md` §13:
>   oferta no reveal (dispensável, padrão Garmin); contador "N de M" no widget
>   (só com ≥ 1 feita); live-ops rotativo que não tira; card compartilhável
>   mensal com piso; escudos visíveis sempre, inclusive zero. **O código ainda
>   faz o antigo** — implementar passa pelo guarda dono e muda
>   `widgetSemCobranca.contract.test.ts` (13.2) e a linha correspondente do
>   `CLAUDE.md`.
> - Mantidas: prestígio visível sem o escudo quebrar a aura (fecha a D4: o
>   que dói perder é só o coração), veto #21 ao estágio do amigo, psicométrico
>   invisível, conta primeiro com o porquê visível.
> - `fora` do desenho: os três ramos de save antigo (`STAT-10`, `EVO-23`,
>   `ONB-13`) e a variante sheet do `ShopModal` sem caminho vivo — **candidatos
>   a remoção de código, decisão sua**.
> - As seis superfícies sem descrição no manual foram **medidas no código** e
>   entraram no `03-FLUXO-DE-TELAS.md` §4 (§4.2a, §4.2b, §4.6a, §4.6b, §4.8a,
>   §4.23a). Três achados da medição: **`SettingsModal` é inalcançável** —
>   `handleOpenAISettings` desce `App.tsx` → `CompanionHUD` → `ChatBox` e o
>   `ChatBox` só desestrutura a prop, nunca a chama (mesma família da
>   `OraclePage`; o caminho real de Personalidade é menu → Configurações →
>   "Personalidade"); a recusa de comida com o pet cheio **não é tela** (fala de
>   3500 ms, sem decrementar); e **quatro superfícies não têm régua nenhuma**
>   (`ItemsWindow` vazio, o visual da recusa da loja, os botões de troca de
>   Créditos, a `StatsPage` inteira — nenhum teste as monta).

> ## 🎨 13/09/2026 — REDESENHO EM DUAS FASES: A SQUAD-DESIGN E O HANDOFF DOS WIREFRAMES
>
> O dono pediu o redesenho do app começando por wireframes de TODAS as telas,
> com o que a pesquisa (Mobbin, estudos) ensinou, e a identidade só depois.
> Não havia squad de design formal — havia agentes soltos. Entrou:
> - **`/squad-design`** (`.claude/skills/squad-design/`): método **W1–W10**
>   (cinza, texto real, todo estado, uma pergunta por tela, frequência manda,
>   nada cobra, filas como estrutura, referência com procedência, o que sai é
>   nomeado, aceite executável), duas fases com checkpoint do dono entre elas.
>   Dois agentes novos — `design-curador-padroes` e `design-wireframer` — e
>   seis reusados (design-lead decide, cartógrafo mede, product-designer
>   opina, design-critic critica bloqueante, guarda-linha-vermelha veta,
>   visual-designer na Fase 2).
> - **`docs/HANDOFF-WIREFRAMES.md`**: o que a próxima sessão lê primeiro — a
>   ordem de leitura, os 10 fluxos por frequência, o formato do canvas
>   (`docs/design/wireframes/<fluxo>/`, artboards 390×844, skill `design`),
>   o aceite e a Fase 2 combinada.
> - **`docs/design/PRINCIPIOS-DE-WIREFRAME.md`** (a pesquisa por família de
>   tela, com seção de origem) e **`docs/design/INVENTARIO-WIREFRAMES.md`**
>   (toda tela × estado, com prioridade e estado do wireframe).
>
> Por que wireframe antes: o redesenho de agosto aplicou identidade sobre
> estrutura não decidida — `04-IDENTIDADE-VISUAL.md` §11 mede o resultado.
> **Nada foi desenhado ainda**: a primeira sessão de desenho começa pela Home
> (`/squad-design desenhar home`).

> ## 🤖 10/09/2026 — TODA SESSÃO COMEÇA PELO COORDENADOR, E O MANUAL SE SINCRONIZA A CADA MERGE
>
> Dois agentes novos e a automação que os aciona:
> - **`soulmon-coordenador`** (`/soulmon [start|rotear|status|fechar]`): o
>   especialista que toda sessão consulta primeiro. Lê `docs/manual/00-MAPA.md`,
>   este STATUS e o `CLAUDE.md`; roteia o pedido pela tabela da skill
>   (`.claude/skills/soulmon-coordenador/SKILL.md`) para o orquestrador dono —
>   maestro, os sete guardas, squad-som, squad-docs, prod-squad, design-lead,
>   security/qa — e no fechamento cobra portões, bloco aqui, PR + merge na hora
>   e a sincronização do manual.
> - **`doc-mantenedor`** (`/manter-docs [auto|desde <sha>|status]`): sincroniza
>   `docs/manual/` com o código depois de cada merge — `scripts/docs-delta.mjs`
>   mede o que mudou desde `docs/manual/.sincronizado.json`, um redator por doc
>   recebe o diff, o verificador recarimba, o SHA é gravado. Delta só.
> - **Hook de sessão** `.claude/hooks/session-start.sh` (em `.claude/settings.json`):
>   instala `node_modules` se faltar (uma sessão web de 09/09 nasceu sem) e
>   imprime o briefing com a ordem de invocar `/soulmon start`. Síncrono.
> - **Workflow `docs-sync.yml`**: a cada push na `main`, job `delta` (sempre:
>   mede + guard + sumário) e job `mantenedor` (só com delta **e** o segredo
>   `ANTHROPIC_API_KEY`) que roda `/manter-docs auto` e abre/mergeia
>   `docs/sync-<sha>`. Anti-loop: o commit de sincronização só toca `docs/`,
>   então o push dele volta com delta vazio.
>
> ⏳ **Depende do dono:** criar o segredo `ANTHROPIC_API_KEY` em Settings →
> Secrets → Actions para o job `mantenedor` rodar no servidor. Sem ele nada
> quebra — a sincronização acontece no início da próxima sessão, pelo hook.

> ## 📚 10/09/2026 — O MANUAL COMPLETO EXISTE: `docs/manual/00-MAPA.md` é a porta de entrada
>
> A SQUAD-DOCS (`.claude/skills/squad-docs/`, 9 agentes `doc-*`, comando
> `/documentar`) escreveu, verificou e travou o manual em `docs/manual/`:
> mapa central com guia de leitura para IA e três índices (assunto ·
> pergunta · arquivo), visão e linhas vermelhas, **59 regras de negócio**
> com dono/régua/decisão, fluxo de telas, identidade visual e sonora,
> arquitetura, **referência de todos os 268 módulos não-teste** (`node scripts/docs-inventario.mjs`, 10/09/2026; guard
> exige 100%), dados e save campo a campo, integrações e deploy, histórico
> (826 commits, por era), índice de discussões, glossário e como manter.
> Método R1–R10 (`METODO.md`): referência por SÍMBOLO nunca por linha,
> número com nome de constante, nada morto sem lápide, um dono por doc,
> **verificação bloqueante por outro agente** antes do carimbo. Régua viva:
> `src/docsManual.contract.test.ts` (todo doc no mapa, links resolvem,
> todo módulo na referência, zero `arquivo:linha`, cabeçalho com dono).
> Inventário medido: `node scripts/docs-inventario.mjs`.
>
> **Regra de precedência escrita no mapa: código > teste > `CLAUDE.md` >
> manual.** A rodada achou **41 divergências** entre o `CLAUDE.md`/comentários
> e o código — a lista está em `docs/manual/02-REGRAS-DE-NEGOCIO.md` §59
> (D1–D26) e nas seções de divergência dos docs 03 §6 e 04 §13. **Nenhuma
> foi "corrigida" no `CLAUDE.md`, que é seu**; as que importam para decidir:
>
> 1. 🔴 **JWT do Supabase da era DigiApp ainda estava no repositório** — em
>    `docs/APK-BUILD-INFO.md` (texto plano) e em `assets/info-*.js`, um build
>    velho restaurado na raiz sem consumidor. O guard afirmava "sumiu" varrendo
>    só `src/`. Redigido, pasta removida, guard ampliado para o repositório
>    inteiro (`571a8b4f`). **Revogar a chave no painel do Supabase é seu** — o
>    histórico do git a carrega.
> 2. 🐛 **A exclusão da linha do jogador na masmorra nunca dispara** (D5):
>    `getDungeonEnemySprite(tier, excludeLine)` espera id de LINHA e
>    `buildDungeonWave` passa o ESTÁGIO. A função tem teste; o chamador não.
> 3. 🐛 **Tetos da masmorra moram no `localStorage`** (D10): `DUNGEON_HEART_DROPS`
>    (2/dia, com `toDateString()`), `DUNGEON_DIFFICULTY`, `DUNGEON_BEST` — o
>    mesmo furo que `careCaps` fechou para carinho e comida. `stepsDayKey`
>    também usa o dia do aparelho (D23).
> 4. 🐛 **Renascimento também derruba `maxActivityCap`** de até 10 para 6
>    (`handleRebirth`), contra o "estágio e três atributos, e SÓ" (D13).
> 5. 🐛 **Selo de foco**: `GuideModal`/`HelpModal`/`CLAUDE.md` dizem "3 completas";
>    `focusComplete` exige todos os ESCOLHIDOS (D16) — decidir qual é a regra.
> 6. 🐛 **Widget Android** só em PT-BR e ainda diz "Dia perfeito!" (03 §6 #8).
> 7. ⚰️ **Código morto para decidir apagar**: `LanguageContext`/`translations`
>    (nunca montados), `PixelFrame`, `figma/ImageWithFallback`,
>    `CareSystem.scheduleCareEvents`, `handleEvolveToUnlocked`,
>    `XP_THRESHOLDS`→`nextLevelXP`, `attributesSinceLastEvolution`; `OraclePage`
>    e `PixelizerCard` **inalcançáveis** (o atalho de segurar o mascote perdeu
>    os chamadores).
> 8. 📝 **`CLAUDE.md` para você acertar** (cada um com o comando no doc): loja
>    tem 2 segmentos, não 5 abas (D3); `canPvp` não existe, é `meetsPvpBond`
>    (D4); `fallbackSpriteForStage` é `legacySpriteForStage`; cura instantânea
>    por Créditos foi removida (D2); coraçãozinho não é mais vendido (D1);
>    escala de ícone é 20/24/32, não 36/42/30; `npm run build` tem três
>    passos; check-in não tem humor (D20); `UnlockNudge` em 6 lugares, não 3;
>    `DREAM_CATALOG` citado por linha (D22); `MATCHES_PER_DAY` = 5 e a season
>    MENSAL do ranking não constam (D7/D8); bestiário grava 36 chaves, lê 24 (D9).
> 9. 📝 **Docs velhos**: `README.md` e `PROJETO.md` ainda se chamam DigiApp;
>    `brand/design-system.md` é da Consultech360 (outro produto);
>    `docs/reviews/2026-08-03/` foi criado em 14/08; §3.2 deste STATUS diz que
>    `wrangler.jsonc` não tem `d1_databases` — tem (`DB` → `soulmon-billing`).
>
> Fechado na rodada: `docs/00-START-HERE.md` aponta para o mapa; o `CLAUDE.md`
> ganhou UM bloco de ponteiro (nada mais foi tocado).

> ## ⏳ DEPENDE DO DONO (09/09/2026) — três decisões abertas
>
> **1. Criar o projeto Supabase do Soulmon.** O recado falado está pronto e
> DESLIGADO: sem `SUPABASE_PROJECT_ID` + `SUPABASE_ANON_KEY` no ambiente do
> servidor, `/api/config` devolve `transcribeAvailable: false` e o botão de
> microfone **não é desenhado**. Nada quebra sem elas. ⚠️ `ANON_KEY` **não**
> leva prefixo `VITE_` — o prefixo a colocaria de volta no bundle, que é o
> defeito que `/api/transcribe` existe para desfazer. A Edge Function a
> implantar está em `src/supabase/functions/server/`.
>
> **2. O redirecionamento do login: `getRedirectResult`.** O app NÃO o usa. A
> volta do redirect funciona pelo caminho felizmente correto —
> `getCurrentEmail()` espera `authStateReady()` e o Firebase restaura a sessão
> do IndexedDB. O que NÃO existe é mensagem quando o redirect FALHA do lado do
> Google (a pessoa cancela lá, o domínio é recusado lá): ela volta sem sessão e
> **sem explicação nenhuma**, reencontrando o portão de conta como se nada
> tivesse acontecido. `getRedirectResult` é o que exporia isso.
> Não foi acrescentado porque é mudança de comportamento no caminho de
> autenticação, e ela não é verificável em suíte nem no servidor de
> desenvolvimento (o redirect exige o handler do Firebase). O que ENTROU foi o
> que dá para provar: `src/utils/auth.redirect.test.ts` trava a ORDEM
> (persistência antes de a página sair — inverter faz a pessoa voltar deslogada
> sem erro nenhum), quais códigos NÃO redirecionam (`unauthorized-domain` é o
> mais provável aqui, e mandar a pessoa ao Google para voltar ao mesmo erro
> custa o que ela digitou) e que o código cru sempre chega ao console.
> ⚠️ E o problema de fundo continua em aberto: `authDomain`
> (`soulmon-app.firebaseapp.com`) ≠ domínio do app, e desde o SDK 9.19 o
> redirect para de funcionar em navegador que bloqueia armazenamento de
> terceiro, a menos que `/__/auth/handler` seja servido pelo domínio do app.
>
> **3. A palavra do rótulo do Bestiário na Home.** Não é uma decisão pendente
> minha — é observação: o Bestiário fica ESCONDIDO até a primeira descoberta
> (`bestiary?.length > 0 &&`). Isso é defensável ("oferta que não pode ser
> aceita é ruído") e tem um custo: quem nunca entrou na masmorra não descobre
> que ela alimenta uma coleção. Mudar é decisão de produto; não mexi.

> ## ✅ RESOLVIDO em 09/09/2026 — o recado falado foi ASSUMIDO, não apagado
>
> O achado abaixo foi levado ao dono, e a decisão dele foi **declarar e fazer
> funcionar**, em vez de remover: `06ef9ea0 feat(voz): o recado falado passou a
> existir de verdade — e declarado`. O POST direto para `<projectId>.supabase.co`
> com o JWT no bundle saiu; a transcrição passa a ir por
> `functions/api/transcribe.js`. A `PLAY-DATA-SAFETY.md` §2.4 passou a declarar
> **"Gravações de voz ou som — Sim, coletado e compartilhado"**, com processamento
> efêmero e retenção explicados, e `RECORD_AUDIO` entrou na tabela de permissões.
>
> ⚠️ **Sobrou uma contradição, corrigida no mesmo dia** (PR #33): a tabela do §2.4
> mudou, mas as duas **listas-resumo do fim do documento** ficaram para trás — "não
> coletado" ainda listava `áudio`, e "coletado e compartilhado" não citava a
> transcrição. **É da lista-resumo que se preenche a ficha da Play**, não da tabela
> que ninguém relê na hora do formulário. Regra que ficou escrita lá: ao mudar a
> §2.4, mudar as duas listas no mesmo commit.
>
> O bloco original fica abaixo, para auditoria.

> ## 🔴 08/09/2026 — O APP PEDE O MICROFONE E MANDA O ÁUDIO PARA FORA, E A DATA SAFETY DIZ QUE NÃO
>
> Achado por um parecer de privacidade da squad de som, **fora do escopo dela**, e
> verificado nas quatro pontas. Não é o desenho novo de áudio: **é o app de hoje.**
>
> `src/components/ChatBox.tsx` chama `navigator.mediaDevices.getUserMedia({ audio: true })`,
> grava com `MediaRecorder` e faz POST do blob para um endpoint de **Supabase**:
> `https://<projectId>.supabase.co/functions/v1/make-server-7de212d9/transcribe`.
> O componente é montado pelo `CompanionHUD` e **está no bundle servido**
> (`getUserMedia` presente em `dist/assets/index-*.js`).
>
> Contra isso, `docs/PLAY-DATA-SAFETY.md` **§2.4** declara fotos/vídeo/**áudio**
> como **❌ Não**, com a frase *"O app não pede nenhuma dessas permissões"*, e a
> lista de "Não coletado" repete **áudio**. **Supabase não aparece como destino
> declarado em lugar nenhum** — nem na Data Safety, nem em `public/privacidade.html`.
>
> ⚠️ O `CLAUDE.md` afirma que "o chat paralelo do Supabase" saiu na limpeza da
> herança do DigiApp em 07/09/2026. **A transcrição por voz sobreviveu.**
>
> `AndroidManifest.xml` **não** declara `RECORD_AUDIO` (grep = 0), então no APK a
> gravação provavelmente falha em silêncio — mas **PWA e Electron concedem
> normalmente**, e é a PWA que está no ar.
>
> **Isto é decisão do dono, e são três saídas:** (a) remover a gravação por voz e o
> endpoint; (b) mantê-la e **corrigir a Data Safety, a política de privacidade e o
> destino declarado** antes de qualquer publicação na Play; (c) mantê-la desligada
> por flag até (b) estar feito. Enquanto não for decidido, **a declaração da loja
> está incorreta**, e é a declaração que a Play cobra.
>
> Parecer completo, com as perguntas numeradas:
> `squad-alpha-runs/som-01/discovery/parecer-pi-e-dados.md`.

> ## ✅ 08/09/2026 — o Node 25 e os testes: consertado na raiz, não mais por contorno
>
> O bloco de 07/09 abaixo registra que o Node 25 "cria um `localStorage` global
> vazio que sombreia o do jsdom e derruba 7 testes", e manda usar o Node 22
> portátil de `E:/tools/node/node-v22.23.2-win-x64` para rodar o gate.
>
> **Duas atualizações.** Primeiro, o número cresceu: em 08/09/2026 eram **28 testes
> em 3 arquivos** (`storageKeys.migration`, `telemetryWiring.render`,
> `SoulmonOnboarding.portao.render`). Segundo, o contorno tinha dois furos — não
> ajudava **o CI** (que roda o Node da workflow, não o da máquina do dono) e
> dependia de todo mundo lembrar de trocar de Node.
>
> Consertado no `vitest.config.ts`, que acrescenta `--no-experimental-webstorage`
> ao `NODE_OPTIONS` do processo principal **antes de os workers nascerem** — a
> única camada por onde toda invocação passa, inclusive o `npx vitest run` cru que
> o `CLAUDE.md` manda rodar antes de todo commit. `poolOptions.*.execArgv` **não**
> funciona: o Vitest monta a própria lista (verificado). Reatribuir no
> `setupFiles` também não: no jsdom do Vitest o `window` **é** o `globalThis`, então
> os dois já apontam para o objeto morto e não existe referência para o certo.
>
>     npx tsc --noEmit  → exit 0
>     npx vitest run    → 256/256 arquivos · 3666 testes · 1 skipped
>
> **O Node 22 portátil continua útil** para reproduzir o ambiente do CI, mas deixou
> de ser necessário para a suíte ficar verde.
>
> ⚠️ **Achado junto, e este continua ABERTO:** o job `tsc + vitest` roda também
> `npx tsc -p tsconfig.server.json --noEmit`, que o `CLAUDE.md` **não lista** na
> seção de comandos pré-commit — e ele reprova. Eram 5 erros; 2 foram consertados
> (subtração de dois `Date` em `community.js`). Os **3 restantes** são
> `KVNamespace` citado no JSDoc de `_kv.js` sem nunca ter sido declarado, e
> **declará-lo de verdade desmascara mais de 90 erros latentes** em nove arquivos,
> incluindo dinheiro, conta e save — porque enquanto o nome não resolve, `kv(env)`
> devolve `any` e tudo a jusante passa trivialmente. A conta e os três caminhos
> estão em `squad-alpha-runs/som-01/sweeper/achado-typecheck-servidor.md`.

> ## ✅ 07/09/2026 (sessão LOCAL) — a infra que dependia do dono FOI LIGADA
>
> A sessão anterior rodava na nuvem, sem navegador logado, e parou no Firebase.
> Esta rodou na máquina do dono e terminou o `docs/HANDOFF-SESSAO-LOCAL.md`,
> seções 2.1 a 2.4. O que mudou **em produção**:
>
> 1. **Projeto Firebase PRÓPRIO** — `soulmon-app` (nome "Soulmon"). O id
>    `soulmon` estava tomado por outra conta. Gemini no Firebase e Google
>    Analytics ficaram DESLIGADOS. Provedor **E-mail/senha com link de e-mail**
>    ativado (os dois são acoplados no console: não dá para ter o link sem o
>    pai). Domínio `soulmon.mateus-sprnd.workers.dev` autorizado.
> 2. **`FIREBASE_PROJECT_ID` LIGADO** → `_auth.js` saiu do MODO ABERTO.
>    Verificado na borda: `GET`/`POST /api/save?id=…` sem token devolve **401
>    `unauthenticated`** (antes devolvia 200 e gravava), e `/api/account` saiu
>    do 503 — exportação e exclusão de conta estão vivas. Isso fecha o SEC-1
>    em produção, não só no código.
> 3. **VAPID girado e o Web Push saiu do zero.** O `VAPID_JWK` nunca existiu no
>    scheduler, então o envio era pulado inteiro, em silêncio. Par novo gerado;
>    privada só no secret. ⚠️ Achado no caminho: o `PROJETO.md` tinha a chave
>    **privada** do par antigo em texto plano, commitada — girar o par
>    neutralizou o vazamento, e o exemplo virou placeholder.
> 4. **`SEASON_ADMIN_KEY` nos DOIS lados** (worker `soulmon` + scheduler), com
>    valor novo. O fechamento de season deixa de dar 401.
> 5. **KV próprio e D1 ativos** — o deploy da raiz passou a expor
>    `env.SOULMON_SAVES` e `env.DB`, e a trava "um recibo, uma conta" saiu do
>    papel.
>
> **Duas coisas que o handoff errava e ficam registradas:**
>
> - A chave pública do VAPID estava fixada em **QUATRO** lugares, não três — o
>   `PROJETO.md` também, e o teste de paridade não o cobre.
> - O `FIREBASE_PROJECT_ID` mora no **`wrangler.jsonc`**, não no painel.
>   Variável de runtime comum (ao contrário de secret) é substituída pelo
>   conteúdo do arquivo a cada `wrangler deploy`: posta só no painel, o próximo
>   deploy a partir do repo a apagaria e o servidor voltaria ao modo aberto
>   **em silêncio**.
>
> **Ambiente:** esta máquina roda Node 25, e o projeto declara Node 22
> (`.nvmrc`, e as 5 workflows). O Node 25 cria um `localStorage` global vazio
> que sombreia o do jsdom e derruba 7 testes. Há um Node 22 portátil em
> `E:/tools/node/node-v22.23.2-win-x64` — **use ele para rodar o gate**, senão
> a suíte mente. Dois guards que só passavam no Linux foram consertados no
> caminho (montagem de caminho no Windows e CRLF).
>
> **O que ainda depende do dono:** o teste ponta-a-ponta do login (pedir o link
> por e-mail, receber e completar — só o dono tem o e-mail), a seção 2.5 (FCM
> nativo) e a 2.6 (Play Console). E as decisões da seção 3, intocadas.
>
> ### ✅ Continuação da mesma sessão — o login FOI ao ar e foi usado
>
> O parágrafo acima envelheceu no mesmo dia. **O desenho de login mudou de
> link-por-e-mail para Google + e-mail/senha**, e o dono se cadastrou com o
> Google em produção com sucesso ("entrou, deu certo"). O portão de conta é
> agora a **primeira** tela do app, em três passos — ver
> `docs/PLANO-TELA-IDENTIDADE.md`, seção 3-bis.
>
> **Três defeitos de produção que só apareceram porque o fluxo foi exercido de
> ponta a ponta**, e que nenhum teste unitário teria pego:
>
> 1. **A CSP bloqueava o login com Google.** `public/_headers` não tinha
>    `https://apis.google.com` em `script-src`; o Firebase reporta isso como
>    `auth/internal-error` **genérico**, sem dizer que foi a CSP. Só foi achado
>    depois de logar o `err.code` cru. Travado agora por
>    `src/security/csp.test.ts`.
> 2. **Cada push matava o login em produção.** As `VITE_*` são inlinadas em
>    BUILD; o CI rebuilda sem o `.env` da máquina do dono, então o deploy manual
>    correto das 19:51:16 foi desfeito pelo build do CI das 19:52:19. Correção:
>    `.env.production` passou a ser **commitado** (`!.env.production` no
>    `.gitignore`), guardado por `src/deploy/firebaseNoBuild.contract.test.ts`.
>    São só as quatro chaves públicas do cliente — nenhum segredo de servidor.
> 3. **`getCurrentEmail`/`getIdToken` liam o estado de auth de forma síncrona**,
>    antes de o Firebase reidratar do IndexedDB. Resultado: chamadas de API sem
>    token logo após abrir o app. Agora esperam `auth.authStateReady()`.
>
> **A verificação de 403 fechou** (o dono pediu para fazer):
> `{"meuComToken":200,"alheioComToken":403,"meuSemToken":401,"tokenFalso":401}`
> — save alheio é recusado com token válido, e token forjado não passa.
>
> **A verificação de idade virou checkbox** (decisão do dono): `ageOnMonth`,
> `isAgeBlockedByMonth` e `monthYearFromText` foram removidos de
> `src/utils/consent.ts`. Menos dado pessoal coletado para o mesmo efeito.
>
> **Duas "decisões pendentes" da seção 3 já estavam IMPLEMENTADAS** e o doc
> mentia ao pedi-las de novo: a retenção de 5 anos e a aleatoriedade do reroll.
> Conferido no código antes de riscar.
>
> **P4 entregue** — "Equilibrar minha semana" (`src/utils/weekBalance.ts`,
> presets de rotina em `taskModel.ts`, `BalanceWeekModal`): espalha os hábitos
> de dias fixos pela semana **sem mudar a frequência semanal de nenhum**, só
> com confirmação explícita, e avisa quando não cabe em vez de prometer alívio.


> ## 📋 08/09/2026 — o que a sessão local entregou, e o handoff do QA
>
> Duas sessões seguidas mudaram muita coisa. O inventário do que entrou, o que
> merece desconfiança e o **prompt pronto para abrir a sessão de QA** estão em
> **`docs/HANDOFF-QA-REVISAO.md`** — inclusive a lista honesta de onde eu
> provavelmente errei (guards ajustados pela mesma sessão que mudou a regra).
>
> Entregue em 08/09/2026: **P1** (meta de coração a 60%), **P2** (folga
> semanal), **P5** ("dia perfeito" → "dia completo"), a **barra de Quick Add**
> na tela inicial e a **aventura narrada** da noite — que fecha a Fase 2 do
> `PLANO-TAREFAS.md`. Mais a política de privacidade corrigida, as respostas do
> formulário de Segurança de Dados (`docs/PLAY-DATA-SAFETY.md`) e o passo de
> bundle assinado no CI, inerte até o dono criar a keystore.
>
> **Adiado por decisão do dono:** a **P3** e a **arte** (A20 — as 24 cenas da
> aventura — e o 5.1 da decoração), esta última para uma sessão dedicada, cujo
> handoff pronto (com prompts, critérios de aceitação e o prompt de abertura)
> é **`docs/HANDOFF-ARTE-GEMINI.md`**.
>
> **O gargalo continua sendo distribuição, não produto:** a corrente do
> lançamento inteira depende da keystore de release, que só o dono pode gerar.
>
> **`docs/REGISTRO-DE-DECISOES.md`** (08/09/2026) consolida toda a pesquisa —
> benchmark, literatura, transcrições, Mobbin — e cada decisão tomada a partir
> dela, com a alternativa que perdeu e o gatilho para rever. É o lugar para
> conferir se uma escolha ainda faz sentido antes de rediscuti-la. A **§7** traz
> as 12 apostas falseáveis, com limiar e instrumento, para o dia em que houver
> telemetria; a **§12** traz o que a revisão adversarial confirmou e derrubou.
>
> ### ⬜ O que sobrou aberto e é do dono (08/09/2026, fim da revisão)
>
> Nenhum destes é bug a consertar — os quatro são decisão:
>
> 1. **Os nove emojis que renderizam caixa vazia** (▯) em aparelho com fonte
>    anterior ao Emoji 12.0 — atingem o marco de 21 dias, 5 mobílias, 3 cenas da
>    aventura e 4 sonhos. O guard `emojiSuportado.contract.test.ts` congela a
>    dívida e lista a troca proposta; **escolher o glifo é seu**.
> 2. **A hipótese do `signInWithRedirect`** — a única saída para popup bloqueado
>    pode estar barrada pela mesma proteção de armazenamento de terceiros
>    (`authDomain` ≠ domínio do app). Precisa de conta Google real e popup
>    barrado para confirmar. **É a mais grave**: o portão é a primeira tela.
> 3. **A folga semanal não cobre o dreno de cocô** — ou passa a cobrir, ou fica
>    escrito que cocô é a única cobrança que sobrevive ao descanso.
> 4. **O preço aparece em R$ para quem usa o app em inglês.**

> ## 🔎 08/09/2026 — sessão de QA e revisão do app inteiro
>
> Rodada a partir de `docs/HANDOFF-QA-REVISAO.md`, com Node 22 portátil. Gate
> final: **255 arquivos, 3659 testes passando, 1 pulado**, `tsc` limpo nos dois
> projetos e `npm run build` refeito (o `dist/` commitado está em dia).
>
> ### Item 1 — os guards de P1/P2 NÃO foram ensinados a concordar
>
> Onze mutações no código de produção, cada uma com a suíte inteira rodando.
> **Nenhuma sobreviveu.** A prova que interessava: tornar a folga da semana
> sempre disponível derruba **10 arquivos e 37 testes**, e os OITO que ganharam
> `restDaysLeft: 0` no `44b7a7c3` estão todos entre eles — ou seja, nenhum
> deles estava passando através da folga. O inverso fecha junto: desligar a
> absorção da folga só derruba o `restDay.test.ts`, então nenhum guard estava
> sendo carregado por ela. E quem pega a virada trocando de régua (o footgun 9)
> é o guard diferencial de `dailyGoalSources.test.ts`, que é **anterior** ao
> commit da regra.
>
> ### Item 2 — a degeneração continua alcançável por negligência real
>
> Simulado dia a dia, duas semanas, em `src/utils/degeneracao.cenarios.test.ts`
> (novo, e agora é guard permanente): mega que não faz nada cai de estágio em
> menos de uma semana mesmo com a folga e desce dois em quatorze dias; 2 de 6
> por dia também derruba; e 4 de 6 todo dia atravessa duas semanas sem perder
> um coração, como a P1 prometeu.
>
> ⚠️ **O que a simulação achou de errado é anterior a P1/P2 e é decisão sua:**
> quem abre o app **a cada 3 dias** e não faz NADA nunca perde um coração —
> `ABSENCE_FORGIVENESS_DAYS` perdoa a virada e a rampa de retorno cobre as
> seguintes. O padrão MAIS negligente do jogo é o único imune, e a folga sequer
> é tocada. Está afirmado em teste como FATO OBSERVADO para ninguém "consertar"
> a folga achando que a culpa é dela.
>
> ### Corrigido nesta sessão
>
> | O quê | Onde | Gravidade |
> |---|---|---|
> | `restWeekKeyFor` andava para trás no horário de verão (folga extra de graça, 1×/ano, todo fuso com DST) | `utils/dailyReset.ts` | borda |
> | O relatório anunciava perda de coração que o piso da raiz já tinha engolido — todas as noites, para o jogador mais frágil, com botão de "recuperar" junto | `utils/dailyReset.ts` | produção |
> | O relatório anunciava o alívio de segunda sem ele ter acontecido | `utils/dailyReset.ts` | produção |
> | Check-in do coop perdido quando dois membros marcavam na mesma noite (ler-modificar-gravar sobre o blob; KV não tem CAS) | `functions/api/community.js` | produção |
> | "Você entrou" falso na corrida por uma vaga: 200 + ponteiro gravado, e o grupo sumia na abertura seguinte | `functions/api/community.js` | borda |
> | Grupo coop ativo expirava por partes: só o blob renovava TTL, os dois índices não | `functions/api/community.js` | borda |
> | Código de convite sorteado por cima de outro, sem conferir | `functions/api/community.js` | dívida |
> | A manchete do "dia completo" ficava ATRÁS do confete (elemento posicionado pinta sobre o estático) | `DailyReportModal` | produção |
> | O `×` que dispensa o convite de compra PARA SEMPRE tinha 32 px | `DailyReportModal` | borda |
> | A caixa do aceite dos Termos renderizava achatada (14,95 × 20) por falta de `flexShrink: 0` | `form/FormKit` (`CheckRow`) | borda |
> | "Atalhos" da barra de Quick Add com 20 px de alvo de toque | `QuickAddBar` | dívida |
> | `back()` do onboarding tinha piso 0 — o passo da intro apagada, que não renderiza nada | `SoulmonOnboarding` | dívida |
> | `utils/auth.ts` sem NENHUM teste; o fallback de popup bloqueado não era vigiado | novo `auth.popupBloqueado.test.ts` | dívida |
> | Colisão latente de código de telemetria: `GOOGLE_STEP` e `REGISTER` a UM número de distância | `telemetry.test.ts` (guard) | borda |
> | Referências a `CONSENT_STEP`, apagado no dia anterior | `gateDraft`, `oracleDraft`, `telemetry` | dívida |
> | `.claude/launch.json` apontava para a porta 5173; o dev sobe na 3000 | — | dívida |
>
> ### ✅ Segunda rodada (mesma sessão) — as decisões do dono, aplicadas
>
> | Decisão | O que foi feito |
> |---|---|
> | **Preço**: "se não der para ser USD, explica que é BRL" | **Dava, e já era pela metade.** `getLocalizedPrice` (WP5.8) devolve o preço do Play na moeda da conta e o desbloqueio já usava; **os pacotes de crédito não** — imprimiam a constante em real para o planeta, na mesma tela, um andar abaixo. Corrigido. E onde a loja não responde (web/PWA/desktop) o fallback agora carimba `BRL` **só em inglês e só quando é fallback** (`precoComMoeda`) — carimbar sobre um preço vindo do Play seria transformar um preço certo em mentira, e isso tem caso próprio. |
> | **Folga × cocô**: corrigir o texto | O docstring de `REST_DAYS_PER_WEEK` dizia "do save inteiro"; agora diz "na VIRADA DO DIA", com o porquê — o dreno cobra presença com descuido, a folga perdoa ausência —, e o mesmo parágrafo foi para o cabeçalho de `poopDrain.ts`, com o aviso de mudar os dois juntos. **Nenhuma regra mudou.** |
> | **Login**: só melhorar a mensagem | Parou de prometer "estamos te levando para lá" (o redirecionamento pode não concluir). Agora oferece as duas saídas que sempre funcionam: liberar o pop-up, ou entrar com e-mail e senha, que não abre janela nenhuma. |
> | **Emoji**: gerar prompts de arte | Entrada **A21** em `docs/BACKLOG-ARTE-GERAR.md`, com prompts prontos (folha única, fundo verde `#00FF00`, `Square 1:1` no fim, recorte por chroma-key). |
> | **Marco de 21 dias** | 🪴 → **🌾**. Era o único caso em que arte não resolve: o glifo está dentro da frase, e texto inline não aceita `<img>`. |
> | **Sufixo `-mon`** | Pyrakamon/Akashaoimon/Nimbratamon → **Pyraka/Akashaoi/Nimbrata**. O `id` da linha não mudou. A regra do `CLAUDE.md` virou executável em `sprites.dungeonRoster.test.ts`. |
>
> ⚠️ **Correção do que a primeira rodada reportou.** Eu disse "9 emojis na
> tela"; conferindo um a um, são menos. **Não** chegam à tela: os 4 sonhos (o
> DreamDex já renderiza o PNG de `dreamArt.ts`), o `HABIT_TIER_EMOJI` (mapa sem
> consumidor) e o 🪙 dos Bits (só em comentário). O guard foi corrigido caso a
> caso.
>
> ⚠️ **Ao renomear apareceu um footgun 9 que ninguém tinha visto**: os três
> nomes estavam escritos à mão em TRÊS arquivos (`sprites.ts`,
> `monetization.ts`, `libraryNpcs.ts`). Renomear num só deixaria o inimigo da
> masmorra e o NPC da Biblioteca chamando a mesma criatura por outro nome, em
> silêncio. Hoje `DUNGEON_LINE_NAMES` é o dono único e os outros dois leem dele.
>
> ⚠️ **`dist/` ficou para trás de propósito nesta segunda rodada.** Havia outro
> agente trabalhando na MESMA árvore (arte de decoração, `vitest.config.ts`,
> `sw.js`), e um build meu levaria o trabalho dele pela metade junto. **Rode
> `npm run build` e commite o `dist/` quando as duas frentes fecharem.** Pelo
> mesmo motivo, o `assets.contract.test.ts` fica vermelho de forma intermitente
> na suíte cheia enquanto ele reescreve os PNGs de decoração — passa sozinho,
> não é defeito do repositório.
>
> ### Aberto — precisa de você
>
> 1. **Emojis que renderizam como caixa vazia** (bloco U+1FA70–U+1FAFF, Emoji
>    12+). O que ainda falta, depois da 2ª rodada, é ARTE — e cada um já tem
>    entrada de backlog: 3 cenas da aventura (**A20**), 5 mobílias da loja e do
>    palco (**A7** — que o agente de arte fechou em 08/09/2026, conferir), o
>    traço Carinhoso (**A15**) e os dois controles do overlay de desktop
>    (**A21.1**, com o prompt pronto). O inventário caso a caso, e o que NÃO
>    chega à tela, está em `src/styles/emojiSuportado.contract.test.ts`, que
>    também impede a dívida de crescer.
> 1-bis. **⚠️ `Cross-Origin-Opener-Policy` — decisão sua, e é a raiz de um
>    defeito.** Achado em 09/09/2026, no console de produção do dono, ao testar
>    o item 2 abaixo (o pop-up NÃO foi bloqueado, então aquele teste não rodou —
>    mas o console entregou outra coisa):
>
>    ```
>    Cross-Origin-Opener-Policy policy would block the window.closed call.
>      pollUserCancellation → setTimeout → …
>    ```
>
>    `pollUserCancellation` é o laço do Firebase que lê `popup.closed` de 2 em 2
>    segundos, e é a ÚNICA coisa que rejeita com `auth/popup-closed-by-user`. O
>    `accounts.google.com` manda COOP, corta a relação com a janela que o abriu,
>    e esse `closed` fica ilegível deste lado. Conferido com `curl`: a produção
>    **não manda cabeçalho `Cross-Origin-Opener-Policy` nenhum**.
>
>    O caminho felizo passa (o dono entrou normalmente). O risco é fechar a
>    janela sem escolher conta: aí a promessa pode não terminar, e o
>    `authOcupado` nunca voltaria a `false`. **HIPÓTESE, não reprodução** — o
>    navegador automatizado navega na mesma aba em vez de abrir pop-up, então
>    não houve janela para fechar, e não foi verificado se o Firebase desiste
>    sozinho.
>
>    Já entrou a REDE DE SEGURANÇA (`GOOGLE_SEM_RESPOSTA_MS`, 2 min): passado o
>    prazo o botão volta com uma mensagem honesta, **sem cancelar a promessa** —
>    um login que conclua depois entra normalmente. Isso torna a falha
>    recuperável mesmo que a causa continue.
>
>    **O que falta é seu:** pôr `Cross-Origin-Opener-Policy: same-origin-allow-popups`
>    no `public/_headers`, que é o valor documentado para quem usa pop-up de
>    login. Não fiz porque cabeçalho já derrubou este login uma vez (a CSP sem
>    `apis.google.com`, em 07/09/2026, reportada como `auth/internal-error`
>    genérico). Se autorizar, o push publica em ~2 min e o login precisa ser
>    testado em produção depois.
>
> 2. **`signInWithRedirect` pode estar morto no navegador do usuário.** É a
>    única saída quando o popup do Google é bloqueado, e o `authDomain`
>    (`soulmon-app.firebaseapp.com`) é um domínio diferente do app: desde o SDK
>    9.19 o Firebase avisa que o redirecionamento não funciona onde o
>    armazenamento de terceiros é bloqueado (Chrome, Safari/ITP, Firefox/ETP), a
>    menos que `/__/auth/handler` seja servido pelo domínio do próprio app.
>    **HIPÓTESE, e AINDA EM ABERTO** — a tentativa de 09/09/2026 não conseguiu
>    bloquear o pop-up (ele abriu), então o caminho do redirecionamento nunca
>    foi exercido. Para testar de novo: janela anônima, o site na lista de
>    bloqueio de pop-up de `chrome://settings/content/popups`, console aberto, e
>    olhar se a linha `[auth] entrarComGoogle falhou` aparece com
>    `auth/popup-blocked`. Se confirmar, a correção é servir o handler no
>    domínio do app — a mesma do item 1-bis.
> 3. ~~A folga da semana não cobre o dreno de cocô~~ — ✅ decidido na 2ª
>    rodada: o TEXTO estava errado, não a regra. Corrigido nos dois arquivos.
> 4. ~~Preço em R$ para quem está em inglês~~ — ✅ resolvido na 2ª rodada.
> 5. ~~Sufixo `-mon` nos três personagens prontos~~ — ✅ resolvido na 2ª rodada.
>
> ### O que foi conferido e está CERTO (para ninguém revisitar à toa)
>
> - Contraste: **nenhuma falha** em nenhuma tela, medido sobre a cor composta.
>   Menor razão por tela: 6,46 · 5,57 · 7,43 · 6,30 · 6,30.
> - Nenhum controle sem nome acessível; nenhuma rolagem horizontal em 375 px;
>   nenhum alvo de toque abaixo de 44 px depois dos dois consertos.
> - **Texto num idioma só: nada encontrado** em `src`, `functions`, `workers` e
>   `desktop/renderer`.
> - Build sem `.env` conferido NO NAVEGADOR: o portão degrada e dá para
>   atravessar o app inteiro.
> - Nenhuma rota `coop*` devolve `saveId`; as cinco passam por
>   `denyUnlessOwner`; `coopOf:` órfão se autolimpa; força bruta do código de
>   convite é inviável (32^8 contra 120 req/min/IP).
> - A tela cheia do relatório não é o empilhamento que se temia: `restDayUsed` e
>   o convite de compra **nunca** aparecem juntos (a folga exige perda; o
>   convite exige dia completo; dia completo não perde). Piores casos reais:
>   1,11 e 1,37 tela.
> - Nenhuma tela órfã alcançável depois da remoção do consentimento e da intro.

> ## ⚠️ 07/09/2026 — NINGUÉM NUNCA USOU O APP EM PRODUÇÃO
>
> Informado pelo dono. É o fato mais consequente registrado aqui, porque **44
> pontos do código e da documentação decidem coisas com base na premissa
> contrária** — "renomear quebraria o save de quem já joga", "os APKs já
> instalados", "quem não atualizou". Não há quem.
>
> O que isso muda, em ordem de peso:
>
> 1. **57 nomes de personagem registrado da Bandai estão no bundle de
>    produção** (`LEGACY_FORM_TIERS`, `src/types/progression.ts` — `agumon`,
>    `greymon`, `veemon`, `tapirmon`, `salamon`…, conferido no `dist/`). A
>    ÚNICA justificativa escrita para eles é compatibilidade de save. O
>    `docs/Attributions.md` declara que "saiu tudo" da Bandai: a arte saiu, os
>    **nomes não**. Com zero saves de terceiros, isso é superfície de risco de
>    IP sem nenhum benefício — e vai para a Play Store junto.
> 2. **A telemetria não tem urgência.** Sem usuários não há dado: as chaves
>    `METRICS_ADMIN_KEY`/`SEASON_ADMIN_KEY` da seção 3.2 deixam de ser
>    bloqueio e viram pré-requisito de lançamento. Nada se perdeu — a escrita
>    funciona e o KV guarda por 730 dias.
> 3. **Toda a régua de retenção D1/D7/D30 e a curva D30–D90 são HIPÓTESE.**
>    Estão implementadas e coerentes com a pesquisa, e nenhuma foi confrontada
>    com um usuário real. Nenhum número do produto foi observado.
> 4. **O gargalo não é mais o produto, é a DISTRIBUIÇÃO.** Sete sprints de
>    polimento foram feitos para zero pessoas.
>
> **A limpeza foi feita no mesmo dia** (fatias 1 a 5, oito commits em `main`).
> Além dos quatro itens acima, ela achou três coisas que ninguém tinha visto:
> o `AndroidManifest` anunciava os cinco widgets como **"DigiApp"** na lista de
> widgets do celular (texto que o usuário lê); o `assetlinks.json` servia o
> **pacote do DigiApp como padrão** no nosso domínio, ou seja, uma declaração
> falsa de propriedade; e `src/supabase/.../chat.tsx` era um **segundo endpoint
> de LLM, publicado, sem autenticação e sem nenhuma** das treze proteções do
> `functions/api/chat.js` (bloco NEVER, redação, allowlist de contexto, teto de
> custo do `_aiGuard`). Os três foram fechados.
>
> **O que sobra depende de você, não do código:** separar o namespace KV
> (`docs/SEPARACAO-DIGIAPP.md`, passo 2 — o NOME do binding já não trava, o
> `_kv.js` aceita os dois) e o projeto Firebase (passo 4).
>
> O que isto NÃO autoriza: apagar a compatibilidade de save por conta própria.
>
> **Fecho da sessão (07/09/2026, noite).** Os 17 achados da
> `docs/AUDITORIA-ALINHAMENTO.md` foram trabalhados até o fim e o arquivo
> ganhou a tabela de verificação, com o comando que responde por cada um.
> Depois da limpeza, três coisas a mais:
>
> - **WP3.1 fechou de verdade**: o chat agora manda o estado de agora (HP,
>   energia, Vínculo, dias fora, humor do dia) e as últimas trocas. Quem corta
>   a memória é o SERVIDOR, e toda fala do usuário no histórico passa pela
>   mesma minimização da mensagem atual. `goalCategory` saiu do schema — era
>   declarado, enviado por ninguém e lido por ninguém.
> - **Guard de fiação do KV** (`_kv.fiacao.test.js`): todo teste de rota semeia
>   o binding ANTIGO e passa pelo fallback, então um `env.DIGIAPP_SAVES` cru
>   reintroduzido ficaria verde até o dia em que o painel expusesse só o nome
>   novo. Agora uma rota real é exercida com **só** `SOULMON_SAVES`.
> - **Lixo de edição no `App.tsx`**: o nó do `FirstDayCard` carregava uma
>   expressão-vírgula sobrando de um `sed` malfeito. Compilava e funcionava por
>   acidente (a vírgula devolvia a `dayKey`, sempre verdadeira). Apagado.
> O dono pode ter o próprio save no aparelho dele, e "ninguém em produção" não
> é o mesmo que "nenhum save existe". É decisão dele, e o custo de errar é o
> save dele — recuperável, mas dele.

> **01/09/2026** — entrou o **`docs/GUIA-EXPERIENCIA.md`** (guia mestre de
> melhoria de experiência: onboarding/Oráculo, "streak" sem punição, vínculo,
> paywall, retenção, DON'Ts e roadmap P0→P3) + 7 relatórios de pesquisa em
> `docs/guia-experiencia/` (canais Mobbin/Tim Gabe, Tamagotchi effect,
> gamificação, monster taming, onboarding, monetização, retenção). Só docs —
> nenhuma regra de jogo mudou. As 8 decisões que dependem do dono estão na
> seção final do guia. Gate na árvore desta mudança: `tsc` EXIT=0,
> `vitest` 2852 passed · 2 skipped.

> **06/09/2026 — SPRINT 2 COMPLETO: 7 lotes, 26 pacotes verificados.** O que as
> decisões destravaram foi implementado no mesmo dia, e o fio condutor de quase
> tudo foi **código escrito, testado e mudo**:
> · **as 12 recompensas do Vínculo** (níveis 2–13) nunca chegavam a ninguém —
> `bondRewardsClaimed` jamais era escrito. Só o título chegava, porque é
> derivado, e era essa a única peça que não precisava de ninguém para funcionar
> · **a medalha da estação NÃO PODIA SER GANHA por ninguém** desde que
> `seasons.ts` existe: 500 linhas, teste próprio, cinco regras inegociáveis no
> cabeçalho, zero consumidores · **o canal de fala do pet estava desligado**:
> treze pontos do app mandavam "fale agora" e o HUD não lia nenhum · **a oferta
> dos "5 minutos" e o selo dos 3 focos**, os dois prometidos por escrito no guia
> e no CLAUDE.md, não existiam · **`daysToEvolve` + `EVOLVE_SEGMENTS`**: dois
> números mortos ao lado do vivo, apagados junto com os campos de save que eles
> alimentavam.
> **Dinheiro parou de comprar coração pelos dois caminhos** (D7+D15) — e só por
> isso a frase "pagar nunca deixa sua criatura mais forte" pôde entrar na tela
> de compra, com teste amarrando a frase ao fato. **O perfil do amigo perdeu a
> métrica de desempenho** (E3/#21) em três camadas, e a terceira ninguém tinha
> visto: o diretório era ORDENADO por rank, o que faz dele um placar mesmo sem o
> número aparecer. **O leitor de métricas existe** e espera só a chave (D1).
> Três achados foram maiores que o pacote que os encontrou; estão no `LEDGER.md`.
> Gate em cada lote: tsc app + desktop EXIT=0, vitest **193 arquivos · 2998
> passed · 2 skipped**, build OK.

> **06/09/2026 — O PLANO INTEIRO FOI PERCORRIDO: 87 pacotes, PROPOSTO em ZERO.**
> Sprints 3 a 7 rodaram na mesma sessão, em lotes com gate completo
> (`tsc` app + desktop, `vitest`, `build`) e merge ff-only em `main` a cada
> lote. O estado final: **77 VERIFICADO · 8 IMPLEMENTADO · 2 RECUSADO · ZERO
> PROPOSTO · ZERO BLOQUEADO** (`docs/plano-melhorias/LEDGER.md`).
>
> **Os 8 IMPLEMENTADOS não são pendências esquecidas** — o código está no repo,
> testado e mergeado, e o que falta em cada um não é código:
> · **WP0.1** espera `METRICS_ADMIN_KEY` no Pages;
> · **WP0.6, WP2.6, WP5.8** esperam um APK novo (§3.2);
> · **WP4.6** tem o álbum e o bestiário e deixou o **Abismo** (andares 6–8)
> declarado como aberto; **WP4.7** tem o motor de missões semanais e falta a
> fiação dos contadores; **WP3.1** tem o bloco CONTEXT e falta a memória de
> sessão; **WP1.2** tem o eco do `soulGoal` e a cerimônia, e falta a régua da
> bio em `composeBio`.
>
> O fio condutor de tudo isso, em uma frase: **o app parou de prometer coisas
> que não fazia.** O pet olha a assombrada, o título do Vínculo chega na home,
> o `soulStruggle` volta na hora que dói, o reveal mostra a criatura, a faixa
> do Torneio não rebaixa mais por motivo que não é do jogador, o lembrete de
> deitar existe, os Bits têm onde ser gastos, a queda tem volta e a compra não
> cobra duas vezes. Cada uma dessas era uma frase escrita em algum documento
> deste repositório e falsa no código.
>
> Gate final: tsc app + desktop EXIT=0, vitest **223 arquivos · 3359 passed ·
> 2 skipped**, build OK.

> **06/09/2026 — NOVA MECÂNICA: RENASCIMENTO (Rebirth).** Pedido do dono nesta
> sessão, com as quatro decisões de forma respondidas antes do código
> (**D-R1..D-R4**, em `docs/RENASCIMENTO.md`). Depois do **Ultra**, quem
> comprou pode devolver a criatura ao ovo **uma vez só**: ela volta a Rookie e
> os três atributos zeram, e em troca o jogador escolhe **criatura** (campo
> aberto), **escola** (as 6 do Class-System) e **elemento** (base ou par de 2º
> nível), com o orçamento da ficha multiplicado por 1.5 em TODOS os estágios.
> Quatro coisas que definem a peça:
> · **não reabriu o estágio `egg`** — ele foi apagado da escada com motivo; o
> ovo aqui é a CERIMÔNIA, e `types/progression.ts` não mudou;
> · **perde-se o estágio e os atributos, e SÓ** — Bits, Emblemas, Créditos,
> decoração, cenários, sonhos, hábitos, tarefas, `perfectDays` e
> `unlockedEvolutions` passam intactos, com teste listando campo por campo. A
> regra geral (perda só sobre item recuperável) continua de pé: o Rebirth é
> uma TROCA declarada, não uma exceção a ela;
> · **as escolhas têm consequência medível**, não são enfeite: orçamento
> (`REBIRTH_BUDGET_MULTIPLIER`), piso da escola na ficha, viés do elemento na
> cascata, e as três dentro do prompt das 11 formas — o campo aberto entra
> **entre aspas**, que é o que impede o texto do jogador de virar instrução;
> · **gera antes de gravar**, porque a chance é única: perfil corrompido faz a
> geração lançar, e queimar o Rebirth sem entregar criatura seria a pior falha
> possível deste app.
> Gate: tsc app + desktop EXIT=0, vitest **198 arquivos · 3098 passed · 2
> skipped**, build OK.
> ⚠️ **Aberto**: a arte do ovo, telemetria do degrau final e a fala do pet ao
> renascer — os três listados no fim de `docs/RENASCIMENTO.md`.

> **06/09/2026 — SPRINT 3 COMPLETO: 5 lotes, 7 pacotes verificados** (WP4.2,
> WP5.7, WP3.9, WP1.16, WP2.11, WP0.8, WP4.18). O fio condutor mudou: no Sprint 2
> era código mudo; aqui é **promessa que dependia de alguém lembrar**.
> · **WP4.2 (D6) — o Ultra deixa de exigir degeneração.** `canReachUltra` abre a
> forma por COLEÇÃO (os três megas) **ou** por PERMANÊNCIA (`ULTRA_PATIENCE_DAYS`
> = 45 dias perfeitos). O único caminho antes passava por deixar o pet chegar a
> HP 0 — o jogo pedindo descuido para dar a maior recompensa.
> · **WP5.7 — o reroll virou Nova Leitura, e é DETERMINÍSTICA.** Pagava-se 50
> Créditos por um `Math.random`; agora o resultado sai das 6 respostas (semente
> FNV-1a sobre a ordem FIXA de `ORACLE_QUESTIONS`, nunca `Object.keys`) e o botão
> fica desligado enquanto nada mudou. A regra é dita ANTES de cobrar, e os termos
> (`public/termos.html` §5) foram reescritos nos dois idiomas.
> · **WP3.9 — ponte de ajuda no chat.** A checagem roda ANTES de qualquer rede,
> num módulo puro (`chatSafety.ts`); a distinção entre desabafo e declaração é
> pelo COMPLEMENTO ("morrer de sono" ≠ "morrer"), com a única exceção do PT-BR
> ("de vez") escrita como regra e não como lista de frases.
> · **WP1.16 + WP2.11 — `bornAt`, aniversário e "dias juntos".** Nunca inferido
> de save antigo: sem o campo, não há aniversário; `daysTogether` devolve `null`
> se o relógio andou para trás, nunca número negativo.
> · **WP0.8 — o esforço virou HISTOGRAMA no servidor.** A média era dominada por
> quem cadastra projeto e era ela que decidia leitura de produto; agora o leitor
> imprime MEDIANA de verdade, com a média rebaixada a nota. O balde é derivado do
> `effort` que já chegava — **nada de novo sai do aparelho**.
> · **WP4.18 — a season do Torneio fecha sozinha.** Os troféus 🥇🥈🥉 existiam
> inteiros (rota, vitrines no palco) e só chegavam se o dono lembrasse de
> disparar a rota à mão. Cron das 10h BRT do dia 1, rodando ANTES do `return` de
> hora sem push declarado, com a idempotência (`closed:<season>`) no SERVIDOR —
> cron repete, e a trava tem de morar onde a escrita acontece.
> Gate: tsc app + desktop EXIT=0, vitest **197 arquivos · 3080 passed · 2
> skipped**, build OK. Ledger: **33 VERIFICADO, 1 IMPLEMENTADO, ZERO BLOQUEADO**.
> ⚠️ **Depende de você**: `SEASON_ADMIN_KEY` (secret do wrangler no worker de
> push, mesmo valor do Pages) — sem ela o fechamento é pulado com log; e
> `METRICS_ADMIN_KEY` no Pages, que segue pendente do Sprint 2.

> **06/09/2026 — AS 16 DECISÕES DO DONO, RESPONDIDAS. A coluna BLOQUEADO zerou.**
> Estavam abertas desde a criação do plano; foram respondidas de uma vez (§15 do
> `PLANO-MELHORIAS.md`). Onze pacotes saíram do bloqueio, um virou RECUSADO com
> motivo, um nasceu — o plano vai a **87 pacotes, zero esperando por você**.
> As de maior consequência:
> · **D7+D15 — dinheiro para de comprar coração pelos DOIS caminhos**: sai a cura
> instantânea por Créditos E o 💗 sai da loja de Bits (fica só como drop da
> masmorra). Era a única forma de "dinheiro nunca compra cuidado" virar verdade
> sem asterisco, porque o trilho Créditos→Bits→💗 vendia +1 coração por 15
> Créditos sem cap.
> · **D4 — a AURA é o que dói, e só ela.** É a régua das ondas 2 e 4: nenhuma
> outra mecânica ganha peso de perda, e nenhum perdão novo entra sem passar por
> ela. Junto com D7, fecha a tensão que o plano carregava desde a rodada 3 (o
> produto empilhava perdões para o coração não doer **e** vendia a cura).
> · **D5 — `daysToEvolve` será APAGADO.** O gate é `required` (4/5/5/6) e ponto.
> · **D6 — Ultra sem degeneração forçada**: o topo deixa de exigir que o jogador
> machuque a criatura de propósito.
> · **H.4 — o reroll vira "Nova Leitura" determinística**, fechando a única
> violação declarada da lista de proibições que ainda estava de pé no código.
> · **D1 resolvida sem depender de você**: o leitor de métricas é escrito e
> testado ANTES da chave, e passa a esperar por ela.
> · **D3 — escudo fica em 3** (nossos escudos são conquistados, os do Duolingo
> são dados: o dado não transfere) e **D12 — a árvore grátis não ramifica, e a
> copy muda** (o modo grátis assume que é demonstração em vez de fingir paridade).
> · **D16 PARCIAL**: entra a ponte de ajuda no chat (CVV 188), não entra a linha
> de disclaimer. Só docs; nenhuma regra de jogo mudou ainda — a implementação é
> o próximo sprint.

> **06/09/2026 — SPRINT 2, LOTE 1 (6 pacotes VERIFICADOS)** — **WP4.17: o guia
> mentia sobre a regra mais importante do jogo.** Ele dizia "Rookie→Champion
> pede 10 dias perfeitos" lendo `daysToEvolve`, um campo que NENHUMA regra
> consulta; o gate real é `required` = **4**. O botão de evoluir acendia e o
> guia dizia que faltavam mais 6 — na tela que a pessoa abre justamente quando
> não entendeu. No caminho apareceu coisa pior: o `CompanionHUD` recebia
> `digivolutionSegments`, `digivolutionSegmentsNeeded` e `requiredDays` — três
> fontes do mesmo número — e **não desenhava nenhuma**; as três saíram ·
> **WP4.20**: o cabeçalho de `dungeon.ts` afirmava reset mensal, limite diário
> de partidas e derrota que custa coração; as três eram falsas desde que
> `handleDungeonLose` virou callback vazio. Corrigido, e a REGRA travada por
> teste (a derrota não pode voltar a cobrar da barra de cuidado) · **WP1.9**: o
> "porquê" escrito no onboarding agora recebe um eco ("Anotado. Seu Soulmon vai
> lembrar disso") — só para quem escreveu · **WP1.10**: a oferta do teste longo
> diz o que muda e quanto custa, em vez de prometer que "afina" a criatura ·
> **WP0.13/WP0.14**: `haunted_done` e `checkin_shown` — o numerador de "a pilha
> de culpa virou loop de jogo?" e o denominador que faltava para `checkin_commit`.
> Aqui também apareceu um defeito: **`ONCE_PER_DAY` valia pela metade** (o dedupe
> de fila era um `if` literal para `day_active`), então o denominador novo poderia
> ser contado várias vezes por dia. Generalizado.
> Gate: tsc EXIT=0 (app + desktop), vitest **184 arquivos · 2927 passed · 2 skipped**.

> **03/09/2026 — RODADA 4: o corpus PRÉ-Mobbin destrinchado** — os relatórios
> 01–07, as transcrições 08 e o guia alimentaram o plano na criação, mas só o
> dossiê Mobbin tinha sido confrontado linha a linha com o código. Agora os seis
> guardas fizeram isso (`docs/plano-melhorias/estudo/`, ~300 linhas fonte × código
> × veredito) e a linha vermelha deu parecer a 41 candidatas (17 aprovadas, 23 com
> ressalva, 1 vetada). **O plano vai a 86 pacotes** (+36, seção 14). O achado
> transversal é **código escrito, testado e sem consumidor**: `needsIntervention`
> (o "só 5 minutos" que o guia promete nunca aparece), `focusComplete` (o selo dos
> 3 focos), `BOND_REWARDS` (12 recompensas do Vínculo que ninguém recebe),
> `SEASON_PATHS`/`applySeasonMedal` (estações desligadas), `sleepReminderAt`,
> `triggerMessage` e 7 dos 9 eventos de telemetria novos. Sete premissas do plano
> caíram; a métrica-farol é MÉDIA onde a fonte proíbe média. **Decisões novas:
> D15** (o trilho Créditos → Bits → 💗 vende +1 coração por 15 Créditos sem cap —
> a linha vermelha vetou "aceitar e nomear"; alternativa: 💗 sai da loja de Bits),
> **D16** (texto de saúde mental no chat) e **D17** (upgrade mantém `bornAt`?).
> Só docs; nenhuma regra de jogo mudou.

> **03/09/2026 — SPRINT 1, LOTE 3 (2 VERIFICADOS; sprint fechado com 9+1)** —
> WP3.7: a criatura deixou de ser "ele" no Guia/push/Configurações e "ela" na
> página do Pet — **36 trechos** em 22 arquivos viraram "seu Soulmon" ou frase
> reestruturada, PT e EN (dois "he" ingleses saíram); push das 16h mudou nos
> dois lados (`NotificationManager` + `_pushCopy.js`) · WP1.7: **rascunho do
> ritual do Oráculo** (`utils/oracleDraft.ts`, chave `ORACLE_DRAFT`): fechar o
> app no item 15 de 20 volta ao item 15 com tudo preenchido; retoma só entre o
> nome e o último item do teste (nunca na geração), guarda o `ConsentRecord` e
> nunca e-mail/idade/resultado; apagado na geração, no `finish()` e no muro de
> idade. Gate: tsc EXIT=0 (app + desktop), vitest **180 arquivos · 2900 passed · 2 skipped**.

> **03/09/2026 — SPRINT 1, LOTE 2 (2 VERIFICADOS, 1 RECUSADO)** — WP2.3: o botão
> do check-in virou compromisso ("Assumir minha meta de hoje" / "Commit to
> today’s goal"; volta a "Começar o dia" sem meta cadastrada) e
> `handleCheckInConfirm` emite `checkin_commit { focus_count }` — só o confirm,
> nunca o pular · WP5.5: `UnlockAccountModal` ganhou **"Agora não"** com a mesma
> largura do primário, emitindo o evento novo `unlock_dismiss { reason }`
> (dois schemas, paridade, linha PT+EN na política; no caminho, `REASON_LABEL`
> do agregador só tinha 2 rótulos para 4 valores — `report`/`shop` viravam
> `unknown`) · **WP4.4 RECUSADO — premissa falsa**: as estações NÃO expiram em
> 2027, `coversDay` compara mês/dia desde a origem e havia teste em 2031; o
> único `null` é a folga deliberada de 28/29/fev. Teste novo varre 2026–2036.
> Não houve bump de `CACHE_VERSION`: `privacidade.html` não está no
> `PRECACHE_URLS` e navegação é network-first. Gate: tsc EXIT=0 (app + desktop),
> vitest **178 arquivos · 2890 passed · 2 skipped**.

> **02/09/2026 — SPRINT 1, LOTE 1 (5 pacotes VERIFICADOS)** — WP0.3 (política de
> privacidade dizia "sete eventos", eram dez; agora não escreve número e um teste
> exige todo evento do `EVENT_SCHEMA` na tabela PT/EN) · WP0.5 (8 eventos novos
> nos DOIS schemas com paridade: `reveal_seen`, `checkin_commit`, `milestone`,
> `shield_used`, `welcome_back`, `evolve`, `dungeon_run`, `bond_level`;
> `unlock_view.reason` até 3) · **WP0.7 — o save foi medido pela primeira vez:
> 79.602 bytes (77,7 KB) para 90 dias pesados, 64× abaixo do teto de 5 MB** ·
> WP2.9 (teste de guarda: `HabitConstancy` nunca imprime `N%` no texto visível)
> · WP4.9 (o "roster de 60" era falso — comentário morto de `progression.ts`
> reescrito; teste novo trava que a masmorra só sorteia das 6 linhas nossas).
> Gate: tsc EXIT=0 (app + desktop), vitest **176 arquivos · 2880 passed · 2 skipped**.

> **02/09/2026 — RODADA 3 (dossiê Mobbin)** — o plano foi a **50 pacotes** (+14).
> O código está **exposto em 5 anti-padrões catalogados**: o widget Android cobra
> (`"N task(s) left, let's go!"`), Créditos compram HP (D7), o perfil do amigo
> mostra rank e escada (nova proibição #21), Missões mostram 🔒 + `0/100`, e a
> faixa do Torneio **caduca todo mês** (lê pontos da season). Duas premissas do
> plano caíram por `grep`: não existe "roster de 60" na masmorra, e o HUD não tem
> nome do pet. As 8 decisões de produto do §16 do dossiê foram confrontadas com o
> código (1/5/7 já são assim; 4 o código é melhor que a decisão; 8b vetada no
> código até fechar E3) — pareceres em `ledger/vetos.md`. Novas decisões D12–D14.

> **02/09/2026 — SISTEMA DE GUARDA** — o plano ganhou custódia: **7 agentes
> guardas** (`.claude/agents/soulmon-guarda-*.md`), **3 skills**
> (`/guarda-soulmon`, `/implementar-wp`, `/destrinchar-estudo`) e um **livro-razão
> durável** (`docs/plano-melhorias/LEDGER.md` + `ledger/*.md`). Cada guarda possui
> uma fatia dos 36 pacotes, destrincha o estudo contra o código, e **só marca
> VERIFICADO rodando o comando de aceite e colando a saída** — sem isso o estado
> máximo é IMPLEMENTADO. O guarda da linha vermelha não possui pacote nenhum, de
> propósito, e tem veto. Linha de base medida na criação: 28 PROPOSTO, 8
> BLOQUEADO por decisão do dono. ⚠️ **A contagem "30 pacotes" estava errada —
> são 36** (`grep -c '^### WP'`), corrigida aqui e no guia.

> **02/09/2026 — PLANO DE MELHORIAS** — entrou `docs/PLANO-MELHORIAS.md`:
> 36 pacotes de trabalho em 5 ondas, sequenciados em 6 sprints, cada um com
> arquivo + símbolo verificado por seis mapeamentos do código
> (`docs/plano-melhorias/A–F`). **O código contradisse os relatórios em doze
> pontos** — os que mudam decisão: a telemetria JÁ EXISTE (10 eventos; falta
> `METRICS_ADMIN_KEY` e a coorte é impossível por desenho declarado);
> `daysToEvolve` é dado morto (evolução real = 4/5/5/6 dias perfeitos, mega em
> 14 dias, depois nada); ultra só é alcançável **degenerando de propósito**;
> `bondRewardFor` devolve `null` do L14; `SEASONS` expira em 2027-02-27; o
> catálogo de Bits esgota em D15–D23; o chat tem memória zero; a push não tem
> win-back nem dedup PWA×APK; e `setObfuscatedAccountId` NÃO EXISTE no Play
> Billing. Onze decisões do dono estão na seção 10 do plano — **D1
> (`METRICS_ADMIN_KEY`) destrava tudo**. Nenhuma regra de jogo mudou.

> **01/09/2026 (rodada 2)** — as transcrições dos vídeos foram lidas via
> NotebookLM (`docs/guia-experiencia/08-transcricoes-notebooklm.md`, 16/16
> respondidas) e analisadas na **seção I do `GUIA-EXPERIENCIA.md`**. Três
> achados que mudam decisão: (1) **`REST_SHIELD_MAX = 3` provavelmente deveria
> ser 2** — o Duolingo testou 2 vs 3 freezes e o terceiro "não foi melhor que
> dois" e "treinava o usuário a tirar mais tempo de folga" (experimento P1,
> depende de telemetria existir); (2) o Soulmon empilhou **oito** mecanismos de
> perdão sem nunca decidir **onde é a sua linha** — o risco nomeado pelo PM de
> retenção do Duolingo é a mecânica perder significado ("extinction level
> event"); (3) o caso mais forte contra gamificar produtividade (Errant Signal /
> Extra Credits) acerta a comida-por-tarefa, e fica registrado como critério de
> decisão permanente, não como pedido de remoção. **Nada de código mudou** —
> a mudança de `REST_SHIELD_MAX` é decisão do dono e está na seção H.

Última atualização: **26/08/2026 (4ª passada — a consolidação do dia)** — fecha
o dia inteiro contra `HEAD = e8aef62a`. Gate reexecutado nesta árvore:

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | **EXIT=0** |
| `npx tsc -p desktop/tsconfig.json --noEmit` | **EXIT=0** |
| `npx vitest run` | **167 arquivos · 2793 passed · 2 skipped** |

> ⚠️ **A 3ª passada dizia "3ª e última do dia" e estava errada.** Ela fechou em
> `33fd94cc`; vieram **mais ~20 merges depois**, e vários deles mudaram o ESTADO
> de achados de segurança que esta página declarava. A trajetória do dia:
> 135/2392 → 142/2483 → 149/2631 → **167/2793**. **+18 arquivos e +162 casos**
> só na noite.
>
> A lição operacional não é "escrever de novo": é que **"última passada" é uma
> afirmação sobre o futuro**, e este documento não tem como fazê-la. Ver a lição
> 2 de `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

**O que entrou depois de `33fd94cc`** está na seção "Merges de 26/08/2026 —
parte 3" e, no que toca a segurança, **reconferido achado a achado na seção 1**.

> ### 📌 Mudança de FORMATO das referências, e o motivo
>
> **As referências de linha escorregaram TRÊS vezes hoje** — de manhã (auditoria
> `df3275de`), à tarde (`51401559`, depois de `b2a35465` acrescentar ~53 linhas
> de comentário de TTL no topo de `_entitlements.js`) e agora à noite (as onze
> referências de `App.tsx` da linha 🧮 do `CLAUDE.md`, todas invalidadas quando
> `dcbeb42d` tirou ~85 linhas do arquivo). Nenhuma dessas três vezes algo ficou
> vermelho: **referência `arquivo:linha` é um ponteiro sem dono.**
>
> A lição já estava formulada — *o endereço apodrece mais rápido que o número* —
> mas continuávamos pagando por ela porque o conserto adotado era **corrigir de
> novo**, que é a operação que se repete. **A partir desta passada o formato
> canônico deste documento é `arquivo` + SÍMBOLO**, com a linha só como
> conveniência opcional e sempre depois do símbolo:
>
> | ❌ Não escreva | ✅ Escreva |
> |---|---|
> | `_entitlements.js:256` | `claimOrder` em `_entitlements.js` |
> | `App.tsx:3091` | `rubDecision`, chamado no `App.tsx` |
> | `menu.ts:412` | `doPet` em `menu.ts` |
>
> **Por que o símbolo resolve e a linha não:** o símbolo é o que o leitor vai
> `grep`ar, e ele só muda quando alguém renomeia — que é uma mudança
> intencional, revisada e rara. A linha muda quando alguém acrescenta um
> comentário três telas acima, que é acidental, invisível e frequente. Quando o
> símbolo some, o `grep` vazio **diz** que o achado precisa ser reavaliado; a
> linha escorregada mente, apontando para código não relacionado — que foi
> exatamente o que aconteceu com `community.js:122` e `subscribe.js:33`.
>
> Onde o ponteiro precisa mesmo ser exato (um bloco de comentário sem símbolo, a
> saída de um `grep`), a linha fica — mas **com o símbolo mais próximo junto**,
> para o leitor conseguir se reorientar sozinho. As referências de linha que
> sobraram abaixo foram reconferidas contra `33fd94cc`; as novas já nascem no
> formato de símbolo. Ver `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

A série X (X-1…X-8) **não é rastreada nesta página** e
continua não sendo — quem a acompanha é `squad-alpha-runs/`.

## 🔴 Class-System saiu do `npm ci` — artefato vendorizado (25/08/2026, ADR-002 §1)

**O problema, que já era verdade antes desta mudança:** o `class-system` é
CÓDIGO EXECUTÁVEL dentro do bundle (`src/utils/soulProfile/ficha/realEngine.ts:26`,
`await import('class-system')`) e entrava como dependência npm de git, resolvida
no `package-lock.json` como `git+ssh://git@github.com/HexerVoodoom/Class-System.git`.
Isso **só funcionava porque o repositório é público** (o npm cai para HTTPS
anônimo quando o SSH falha). O Cloudflare Pages roda `npm ci` a cada deploy —
então no dia em que o dono clicasse em "make private", **o `npm ci` do Cloudflare
falharia e a `main` pararia de publicar no push seguinte**. Não é degradação: é o
site fora do ar, sem aviso.

**O que entrou:** `vendor/class-system/` — bundle ESM + árvore de `.d.ts` +
`_provenance.json` (repo, ref, SHA, data, sha256 do bundle), tudo commitado,
gerado por `npm run vendor:class-system` a partir do clone irmão. Alias em
`vite.config.ts` e `paths` no `tsconfig.json`; o `realEngine.ts` **não mudou uma
linha** e o import DINÂMICO continua igual — o motor segue fora do bundle
inicial (medido: bundle inicial idêntico antes/depois, 620.523 B). A dependência
saiu do `package.json` e do `package-lock.json`.

**O `.d.ts` é autossuficiente de propósito**: o motivo original do snapshot
(`scripts/sync-oracle-data.mjs:14-19`) é que o typecheck estrito não pode
depender do `tsconfig` de outro repositório. Declaração não é compilada, e
`skipLibCheck` cobre o resto.

**Atualizar o vendor** é `npm run vendor:class-system` **junto** com
`npm run sync:oracle-data`. Os fixtures da cascata **não vêm mais do sync**: são
gerados do próprio vendor (`npm run gen:cascata-fixtures`), com repo/SHA/sha256
gravados no arquivo, e o `cascata.parity.test.ts` **asserta** que o SHA do fixture
é igual ao do vendor. Divergir passou a ser vermelho, não comentário.

**✅ RESOLVIDO (25/08/2026) — a réplica da cascata bate com o motor canônico.**
O achado original registrava "35 de 538 pares" — o número estava subdimensionado
porque a metodologia daquela varredura não ficou registrada. A varredura definitiva
(300 fichas × 5 estágios, gerador determinístico, contando todo par com passivos > 0
dos dois lados) mediu **21.795 de 79.199 pares divergentes**. Depois da correção:
**0 de 79.013**.

Causa, lida em `vendor/class-system/index.js:1019-1053`:
`alimento(base) = direto + Σ floor(direto(origem) × razao)` das `SINERGIAS` com
`para.length === 1`, **antes** da divisão. Sinergia de leque (`vida`→primais,
`arcano`→7) fica de fora — há teste travando isso.

**O antídoto do footgun 9 foi reconstruído**, porque a causa-raiz era ele mesmo
falhando: fixture de sync envelhecia em silêncio. Agora o fixture nasce do motor
vendorizado, SHA do fixture == SHA do motor **por construção**, e há teste falhando
se divergirem. 7 → **19 casos, 13 exercitando o transbordo**. A tabela de sinergia é
**dado**, não regra reescrita — o teste a confronta com o filtro do motor vivo.

**Cobertura travada por simulação, refeita** (400 perfis × 5 estágios): 17/17
elementos, 65/65 talentos, 11/11 profissões, 32/32 criaturas — **iguais**, com as
distribuições **byte a byte idênticas** (terra 40,8% … vileza 0,1%; ferreiro 21,8%
… luthier 2,8%). Era esperado: a correção não toca `axes.ts`. O que muda é a
largura dos pares: **44 → 50** pares destravados distintos, **240 → 265** fichas
ultra que compram um par. **Ninguém perde alcance.**

**🟠 PERGUNTA AO DONO — save antigo muda, e só no `ultra`.** A ficha é recomputada
do `SOULMON_PROFILE` a cada visita (`src/components/PetPage.tsx:163`) e regravada
no save. Medido em 120 perfis × 5 estágios: **10 perfis (8,3%) mudam, exclusivamente
no estágio `ultra`**. Muda `elementos` e o **nome da skill especial**, sempre subindo
de base para par (`Colosso de Sombra` → `Colosso de Obsidiana`; `Fúria de Luz` →
`Fúria de Chama Solar`). **`classTitle` e companheiro não mudam em nenhum perfil**,
nem rookie/champion/ultimate/mega. Ou seja: quem já está no `ultra` vê o nome da
própria skill trocar **uma vez**. Não há como evitar sem congelar a regra antiga.


**O que foi feito.** Três decisões novas do dono viraram código e entraram no
`docs/PLANO-TAREFAS.md` (Partes 3a, 3b, 3c + Roadmap reescrito):

1. **Pesadelos** (`src/utils/nightmares.ts`) — o sono deixou de ser passivo e
   virou conteúdo de combate, reaproveitando o motor da Masmorra
   (`buildNightmareWave` chama `buildDungeonWave`; nada de combate
   reimplementado). Regra central e inegociável: **a quantidade NUNCA escala com
   a duração do sono, só com a regularidade** — duração é resultado fisiológico
   que ninguém comanda às 3h da manhã (premiar resultado é como se fabrica
   ortossonia) e é farmável (é daí que veio o exploit do Pokémon Sleep, com
   gente forjando semanas de sono). Regularidade é comportamento controlável,
   tem teto natural (1 noite por noite) e é a métrica mais forte que existe
   (UK Biobank, n=60.977). O arquivo **não lê `sleptAt`/`wokeAt`**, e há teste
   travando: noites de 3h e de 11h com a mesma regularidade devolvem resultado
   idêntico. 1 pesadelo por noite dentro da janela, onda curta de 2 inimigos
   (é de manhã), vencer devolve energia e até **meio coração** — o sono
   contribui para a saúde do pet **através do combate**, nunca por bônus
   passivo, que seria score de sono disfarçado. Perder não custa nada; não
   combater também não (expira em silêncio). Sonho é a coleta, pesadelo é o
   combate: as duas faces da mesma noite.
2. **Passos** (`src/utils/steps.ts`) — substitui a antiga dependência de Health
   Connect para passos. Sensor `TYPE_STEP_COUNTER` via
   `@capgo/capacitor-pedometer`, permissão `ACTIVITY_RECOGNITION` (runtime
   simples), **sem** Health Connect e **sem** Google Fit. Princípio mantido:
   *declarado pontua, inferido confirma* — passo nunca pontua sozinho, só dá
   selo de "verificado" + bônus pequeno a um hábito JÁ marcado, e quem não tem
   sensor não fica em desvantagem estrutural. Guarda-se só o agregado diário.
   Limitação técnica registrada: o plugin conta desde o início da sessão de
   medição, então há reset por relançamento **além** do reset de boot — os dois
   caem no mesmo caminho puro (`stepsDeltaFrom`/`updateStepBaseline`, que nunca
   devolve negativo), e passos com o app morto ficam de fora. Aceitável
   justamente porque passo não pontua sozinho.
3. **Nada de mais medidores** (`src/utils/petNeeds.ts`) — decisão de NÃO
   adicionar barras. O app já tem cocô, energia, banho, dormir e carinho; do kit
   clássico faltava só brincar. Cada barra nova é uma cobrança nova (Habitica:
   usuários gastando mais tempo administrando o app que fazendo os hábitos; quem
   retém tem MENOS sistemas). Entraram no lugar: **brincar como dreno de
   recurso** (1×/dia, gasta energia que veio de comida que veio de tarefa real,
   buff de +20% no minijogo seguinte; nunca condição de dia perfeito/HP/
   evolução) e **cansaço como estado DERIVADO** (sobrecarga de ontem + noite
   fora da janela, apenas cosmético — nunca reduz recompensa nem trava ação,
   porque reduzir puniria exatamente quem trabalhou demais). Regra de ouro
   registrada para qualquer parâmetro futuro: ou é alimentado por tarefa real
   cumprida, ou gasta recurso que veio de tarefa real.

**O que ficou pendente desta rodada.**

- 🔴 **O APK precisa ser rebuildado.** O plugin de pedômetro é código nativo e
  mudou `android/` — e a regra normal ("mudança web não precisa de APK") **não
  vale aqui**. O `android-build.yml` builda no push; o artefato sai em
  `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`. **Sem APK novo nada
  quebra**: a camada de passos degrada sozinha (`isStepsAvailable() === false`,
  `readStepsToday() === null`), exatamente como já degrada na PWA, e o app segue
  idêntico — só sem passos.
- 🟡 A camada de cima dos passos ainda não existe: **selo de "verificado"** nos
  hábitos de Fitness/Health e **missões corporais** com teto diário. Quando
  forem ligadas, é sempre como confirmação de algo já declarado — nenhuma
  função de `steps.ts` pode passar a devolver HP, energia, `perfectDays` ou peso
  de esforço.
- 🟡 UI dos Pesadelos (a tela de manhã que apresenta a luta) e do Brincar são de
  outros donos desta mesma rodada.
- ⛔ **Health Connect continua FORA, e agora por decisão registrada**, não por
  falta de tempo: conta de organização verificada no Play, declaração de health
  app, política de privacidade dedicada e consentimento LGPD art. 11 por
  finalidade — custo desproporcional para um selo cosmético que a mecânica de
  sono já entrega **sem sensor nenhum**. Google Fit segue morto (APIs até o fim
  de 2026); nada deve ser escrito contra ele.

---

Antes disso: **motor de tarefas — Fases 1 a 3 do `docs/PLANO-TAREFAS.md`
(19/08/2026)**.

**O que foi feito.** Cinco módulos novos, todos funções puras com testes:
`src/types/taskModel.ts` (dono único dos tipos e das constantes),
`utils/habitRhythm.ts` (constância "N das últimas 7", escudos automáticos,
never-miss-twice, marcos 7/21/66), `utils/taskTriage.ts` (esforço, quando ×
prazo, contador de adiamentos, assombrada, someday/dropped, foco do dia, aviso
de sobrecarga, fila de triagem), `utils/restWindow.ts` (Janela de Descanso,
média móvel, 18 Sonhos) e `utils/rituals.ts` (check-in, relatório semanal com
sugestão de habit stacking, fresh start). E a mudança de regra mais profunda:
**a meta do dia passou a ser PONDERADA POR ESFORÇO** em `utils/dailyReset.ts`
(hábito pesa 1, tarefa pesa o próprio `effort` 1–3; `someday`/`dropped` não
entram) — enquanto tudo valia 1, cadastrar cinco triviais rendia mais que
encarar a difícil, que é o defeito documentado do Karma do Todoist. É
retrocompatível por construção (`normalizeEffort` devolve 1 para item sem o
campo, então em save antigo peso == contagem). A documentação do jogador foi
atualizada junto: `GuideModal` ganhou 6 seções novas (esforço e meta, os três
modos de recorrência incl. "contar da conclusão", constância/escudos/marcos,
tarefas e suas saídas, Janela de Descanso e Sonhos, rituais) e `HelpModal`
ganhou 13 verbetes novos, PT+EN, com **todos os números saindo das
constantes** — nenhum literal escrito à mão. As linhas de ⭐ Dia perfeito e
❤️ Corações do `CLAUDE.md` foram corrigidas (diziam "min(cadastradas,
requisito)" contando ITENS; agora dizem peso) e a tabela de regras ganhou o
bloco "Motor de tarefas".

**O que ficou pendente.**

- 🔴 **Fase 4 (sensores via Health Connect) NÃO foi implementada, e é DECISÃO DO
  DONO.** Nada no código de hoje lê sensor: a Janela de Descanso funciona
  inteira sem permissão de saúde, igual na PWA e no APK, e isso é escolha de
  arquitetura, não limitação. Ligar a Fase 4 custa, **antes de qualquer linha de
  código**: (1) **conta de organização verificada no Google Play** — enforcement
  de jan/2026; se o publisher for conta pessoal, isso é bloqueador absoluto;
  (2) **declaração de health app** no Play Console; (3) **política de privacidade
  dedicada** (sono/passos são dado sensível sob LGPD art. 11, exigindo
  consentimento específico e destacado por finalidade — checkbox dentro dos
  Termos é juridicamente inválido); (4) **APK novo** (é mudança em `android/`).
  Some-se a janela de 30 dias do Health Connect (só lê os 30 dias anteriores à
  concessão, e reinstalar recomeça a contagem), que empurra a espelhar dado
  sensível no backend. Se e quando o dono decidir seguir: guardar **agregados
  diários** ("regularidade da semana = 0,82"), nunca séries brutas — isso sai
  quase inteiro do escopo de dado sensível. O plano só previa a Fase 4 **se** a
  Fase 3 provar que move retenção; ela é opt-in e só Android.
- ⛔ **Google Fit está sendo desligado e NADA deve ser escrito contra ele.**
  Cadastros novos fechados desde 01/05/2024, APIs suportadas só até o fim de
  2026. Não existe uma linha contra o Fit no repositório, e isso é de propósito.
  O caminho — se e quando o dono decidir — é **`@capgo/capacitor-health`**, o
  único plugin Capacitor vivo e mantido em 2026 que expõe `SleepSessionRecord`
  (o `capacitor-health` original do mley **não** expõe sono). O app já é
  Capacitor: seria adicionar plugin + permissões ao build Android existente, não
  fazer app novo. Na **PWA pura não existe caminho nenhum** — não há ponte web
  para Health Connect nem HealthKit.
- 🟡 A UI dos módulos novos é de outros agentes desta mesma rodada (`App.tsx`,
  `CreateModal.tsx`, `src/utils/`): guia e glossário já descrevem as regras, então
  qualquer tela que chegue depois precisa bater com o que está documentado ali —
  se divergir, o texto está certo e a tela está errada (o guia lê as constantes).
- 🟡 Fase 2 do plano com entrega parcial: `Quick Add` de uma linha (parsing
  PT-BR/EN, `!1..!3`, `#categoria`, `*3x semana`) e a **aventura narrada** do pet
  no relatório noturno ainda não existem como código.

Antes disso: **kit de UI pixel — rodada de arte (18/08/2026)**. 142 PNGs
gerados (Gemini no navegador + desenho determinístico quando a cota travou),
recortados por algoritmo e medidos contra o guard de asset. Três itens do
`docs/BACKLOG-ARTE-GERAR.md` saíram: **A4** (nós da árvore de evolução, SVG →
PNG), **A2** (estados do botão — a quarentena de magenta ficou VAZIA pela
primeira vez) e a setinha de line-art da Activities, que era a última lucide
solta no meio dos sprites. Suíte 1143 → 1149. Detalhe de cada um nos ✅ do
backlog de arte; o kit completo (incl. o que ainda não foi ligado) está
indexado no fim de `src/utils/iconRegistry.ts`.

> ⚠️ Achado ao mesclar (18/08/2026): `GameStateContext.storage.test.tsx` falha
> nos 6 casos **em Node 25** e passa em Node anterior. Não é regressão de
> código e não afeta o navegador: o Node 25 traz `localStorage` NATIVO, então
> `globalThis.localStorage` deixa de ser o do jsdom e espiar
> `Storage.prototype` (que é o que o arquivo faz, e explica na nota do topo)
> não intercepta mais a escrita. É a mesma armadilha que a nota do teste já
> descreve, numa encarnação nova. Quem for consertar: ou espiar a instância em
> uso, ou fixar a versão do Node do projeto — decidir antes de mexer, porque
> mudar o alvo do spy foi justamente o que a nota diz que NÃO funciona no
> jsdom 29.

Antes disso: **oráculo dentro da UI + controles diretos desligados
(18/ago/2026)** — duas direções do dono. (1) A `OraclePage` (e o teste de
personalidade dentro dela) estava FORA da UI: card branco com botões cinza
dentro do app pixel escuro. Passou a usar as MESMAS classes do kit que o
onboarding já passava ao `SoulTestItem`/`CityPicker` (`sm-px-choice`,
`sm-px-field`) + tokens de tema no lugar de hex solto. (2)
`DIRECT_CONTROLS_ENABLED = false`: elemento favorito, bioma/reino e a
descrição livre de 50% saíram — a criatura vem da leitura. É flag, não
deleção (o dono pediu para reativar se usuários pedirem mais controle);
`alignment` não estava na lista e ficou. Achado ao implementar: o gate não
podia ficar só no JSX — os inicializadores chamam `generateOracle` com o
rascunho do localStorage direto, então um formulário salvo antes seguiria
influenciando a criatura de forma invisível; a poda ficou em
`loadSavedForm()`. Ver `docs/ORACULO.md` (rodada 12).

Antes disso: **fechamento do redesign noturno (18/ago/2026,
madrugada)** — sweep final de QA (Playwright, claro+escuro, todas as views
principais) achou e corrigiu 1 regressão da rodada 5: rótulos
Itens/Banho/Dormir invisíveis no tema claro (`--sm-px-ink` fixo sobre fundo
claro → `--sm-ink` do tema). Estado entregue da noite, tudo mergeado na
main: regra "ícone nunca dentro de box" aplicada (nav/ações/chat),
`.sm-pet-sticky` confirmado, moldura de canos (`PixelFrame`), splash
SOUL_LINK no index.html, trilha de evolução na Home (`EvoTrail`), clamp de
2 linhas no nome do ritual. O que NÃO foi feito e por quê: recorte de
assets das 4 imagens de referência (chegaram como imagem no chat, não como
arquivo — sem os bytes não há o que recortar) e geração de imagem nova
(chaves Higgsfield/Gemini são secrets do Cloudflare, ilegíveis do sandbox;
login de navegador é do dono). Se o dono commitar as imagens + a pasta
`icones` do desktop dele, dá pra substituir as aproximações CSS/SVG por
recortes reais.

Antes disso: **trilha de evolução na Home (18/ago/2026, madrugada)**
— terceiro item do redesign: o caminho de nós da referência agora mora na
Home, à esquerda do painel de rituais (`EvoTrail.tsx`). É RESUMO, não a
árvore: linha rookie→…→ultra do galho atual/previsto, nós `SoulNode`
reaproveitados (cristal verde = alcançado, pet pousado + anel = atual,
escuro = trancado), tocar abre a página de Evolução. Zero regra nova:
galho vem de `getStageBranch` ?? `resolveBranch` (o MESMO da página),
`ALIGN_TO_ATTR` mudou de cópia local do EvolutionPath para
`types/attributes.ts` (footgun 9). Nome de forma trancada NÃO aparece nem
em aria-label (spoiler guard preservado). Junto: `.sm-px-ritual-name`
virou clamp de 2 linhas (com o trilho ao lado, "Meditation" truncava em
"Medita…"; a referência quebra o nome em 2 linhas) — teste do RitualPanel
atualizado pro mecanismo novo, propósito mantido.

Antes disso: **moldura da tela + splash (18/ago/2026, madrugada)** —
os dois primeiros itens do redesign guiado pelas 4 imagens de referência que
o dono mandou (kit "SOUL MON"). (1) `PixelFrame.tsx`: moldura fixa nas
bordas — linhas de cobre via box-shadow inset + 4 cantos em PIXEL ART
programática (grid de chars → rects SVG, `crispEdges`): cano de cobre,
junta aparafusada, trepadeira e nó de cristal ciano. `pointer-events: none`
(nunca captura toque), z-index 80 (é o "bezel" do aparelho), zero PNG novo.
Montada no App e no onboarding. (2) Splash "SOUL_LINK ESTABLISHED" no
`index.html`: ESTÁTICA de propósito — aparece antes do bundle carregar
(loading de verdade, sem timer artificial), chama pixel + wordmark + barra
segmentada animada + selo + cristais, PT/EN por `navigator.language`. O
React a remove com fade no primeiro frame (main.tsx); o aviso de WebView
antigo também a remove (senão cobriria o próprio aviso). CSP: o script
inline novo e o do aviso (editado) entraram no `_headers` com hash
recalculado — o `csp.test.ts` pegou, como desenhado.

Antes disso: **regra "ícone nunca dentro de box" (18/ago/2026,
madrugada)** — direção do dono, vale no app INTEIRO (registrada no
CLAUDE.md): nada de moldura/placa/chanfro em volta de ícone; o ícone aparece
GRANDE e pelado. Aplicado em: nav inferior (26→36px, placa preenchida do
ativo virou SUBLINHADO ciano — barra não é caixa, e mantém uma pista de
seleção que não é só cor), fileira Itens/Banho/Dormir (moldura da actionbar
saiu, 30→42px), botões do chat (moldura saiu, 20→30px). A barra inferior
subiu 68→80px pra caber o ícone grande com rótulo (token
`--sm-bottomnav-h`, o dock do chat acompanha sozinho). Confirmado no mesmo
passe: `.sm-pet-sticky` (pet fixo, só a lista rola) segue funcionando — o
dono pediu de novo, mas já estava no ar; harness de screenshot novo em
`scratchpad/shot.mjs` mede o sticky em vez de confiar no olho.

Antes disso: **o gesto oculto virou o LOGO inteiro (18/ago/2026,
madrugada)** — o dono pediu ("mergeia esse toggle com o corvo no título"):
corvo + wordmark "SOULMON" agora são um wrapper único, e é ele o alvo do
long-press. Alvo maior acerta mais fácil no dedo. Como o alvo passou a
incluir texto, entrou `userSelect: none` + `WebkitTouchCallout: none` (segurar
texto no mobile abriria seleção/menu e comeria o gesto). Achado ao testar, e
anotado em `docs/ORACULO.md`: a intro tem animação de entrada e, antes de
assentar, o logo fica em OUTRA posição com `pointer-events: none` — medir
cedo faz o teste reprovar um gesto que funciona (`document.fonts.ready` não
basta; espere ~3s).

Antes disso: **atalho oculto pro modo debug (18/ago/2026, madrugada)**
— o dono perguntou onde ficava o checkbox de modo debug e, ao saber que
`OraclePage.tsx` não tem NENHUM ponto de entrada no app real, pediu um jeito
de chegar lá pela tela de intro que aparece na captura que ele mandou. Como
essa tela é a primeira coisa que todo jogador real vê, perguntei antes de
mexer: o dono confirmou que queria um atalho ESCONDIDO só pra ele, não um
controle visível pra qualquer um. Implementado como gesto: segurar o mascote
da intro por ~1.8s (`SoulmonOnboarding.tsx`) abre a `OraclePage` por cima,
já com o checkbox de modo debug pré-marcado (`initialDebugMode`, prop nova),
com um botão "Fechar" pra voltar. Toque curto (< 1.8s) não faz nada — testado
com Playwright (hold abre, toque curto não abre, Fechar volta pra intro).
Ver `docs/ORACULO.md` (rodada 11).

Antes disso: **modo debug na geração de imagem (17/ago/2026,
madrugada)** — pedido do dono: uma versão com "custo 0" que entrega o prompt
em vez de gerar sozinho no Higgsfield. `OraclePage.tsx` (ferramenta interna,
sem nav) já tinha um botão "Prompts" sem custo separado do "Gerar imagens"
(que chama a API paga); agora tem um checkbox "🐛 Modo debug" que faz o
PRÓPRIO botão de gerar nunca chamar a API quando ligado — zero chamada de
rede, não um limite que ainda bateria nela. Ver `docs/ORACULO.md`
(rodada 10).

Antes disso: **classe real no prompt de sprite (17/ago/2026, noite)**
— o dono achou um prompt de exemplo mais genérico que o anterior e pediu
mais detalhe: a classe (arquétipo do class-system), mas SÓ no prompt de
imagem, nunca em texto que o jogador vê. `pipeline.ts` virou `async` (só
ele — `generateOracle` continua síncrono) pra computar
`computeClassTitle(fichaByStage.ultra)` — constante nos 11 prompts, mesmo
tratamento que os outros traços de identidade — e passar o nome EN como um
4º traço do prompt (`OracleInput.promptClassFlavor`, novo campo, só o
pipeline preenche). Cogitado e descartado: sincronizar os arquétipos num
snapshot pra evitar o `async` — o casamento de condição real depende de
`niveisEfetivos` de elementos DERIVADOS, que só o motor real deriva certo;
reimplementar seria o footgun 9 que as outras integrações evitaram. Teste
novo confere as duas pontas: a palavra da classe aparece no `imagePrompt`
de toda forma, nunca em `description`/`bio`. Ver `docs/ORACULO.md`
(rodada 9).

Antes disso: **sufixo "-mon" removido dos nomes (17/ago/2026, noite)**
— o dono pediu um exemplo real de ponta a ponta e notou: toda criatura
terminava em "-mon" (`rookieName` etc. em `oracle.ts`). Achado ao investigar:
combinado com os prefixos de linha (War/Chaos/Zeed no Vírus, Omega no Mega
Vírus, Omni no Ultra), isso soletrava nomes REAIS de outra franquia —
WarGreymon, e o pior, Omegamon/Omnimon (a fusão dos 3 Megas, exatamente o
conceito do Ultra aqui). Mesmo tipo de risco que já tirou os 74 sprites da
Bandai do projeto, só que na camada de TEXTO. Corrigido: nenhum sufixo fixo
em nenhum estágio; `Omni` (Ultra) virou `Triune` ("três em um", mesmo
conceito, sem o nome emprestado). Teste que fixava o prefixo antigo
atualizado. Ver `docs/ORACULO.md` (rodada 8).

Antes disso: **classe da criatura (17/ago/2026, noite)** — pedido do
dono: "senti falta de ter também a classe da criatura, gerada a partir do que
ela faz, suas skills, talvez talentos e também de seus elementos". Achado:
o class-system já tem exatamente esse conceito — **arquétipos** (79 no
registro, `registry/arquetipos.ts`), identidades que EMERGEM de elemento +
escola + recurso, nunca escolhidas. `ficha/classTitle.ts` chama o motor real
(`calcularProgressao`, mesmo import dinâmico das skills) e escolhe o
arquétipo mais específico entre os que a ficha desbloqueou (pleno → diluído
"Aspirante a X" → fallback genérico pelo elemento dominante). Medido em 24
perfis: rookie nunca bate arquétipo pleno, mega e ultra batem em 100% —
mesma escada da cascata de pares. Nome PT vem AO VIVO do motor (zero cópia);
EN é tradução própria por id, com teste de paridade contra os 79 ids reais.
Extraído `ficha/realEngine.ts` (Personagem + progressão real), compartilhado
entre poder de skill e classe. Persistido no save (`soulmonClassTitles`).
**Decisão do dono no mesmo dia: não aparece pro jogador** — `PetPage.tsx`
computa e cacheia a classe, mas não renderiza o rótulo; infraestrutura fica
pronta pra um dia mostrar, sem custo de exibir nada agora. Ver
`docs/ORACULO.md` (rodada 7).

Antes disso: **contraste do tema escuro (17/ago/2026, noite)** —
feedback ao vivo do dono: "troca o nome pet por Soulmon e olha esse
contraste aí, em fundo escuro tem que ser texto branco". (1) A aba "Pet" virou
"Soulmon" (`App.tsx`). (2) O contraste era um bug REAL, não só percepção: o
scaffold shadcn importado do Figma define `body { color: var(--foreground) }`,
e `--foreground` só troca de valor sob a classe `.dark` — que este app NUNCA
aplica (o tema alterna via `[data-theme]` no `<html>`). Resultado: todo texto
sem `color` próprio herdava `--foreground` sempre no valor CLARO
(`oklch(.145 0 0)`, quase preto) mesmo com o tema escuro ativo. Pego por
amostragem de PIXEL na página do Pet (não só `getComputedStyle` — o preview
visual enganava, o cinza quase-preto sobre o verde bem escuro do card ainda
parecia "vagamente legível" no screenshot pequeno): nome da criatura, descrição
por forma e nome da skill renderizavam em `rgb(10,10,10)` sobre
`rgb(23,58,55)`. `body` agora usa os tokens de verdade (`--sm-bg`/`--sm-ink`),
que já respondem a `[data-theme="dark"]` — `--background`/`--foreground`
continuam intactos para quem os usa via `.bg-background`/`.text-foreground`
explícito (alguns modais em `components/ui/`). Ver footgun 10 em "Footguns".

Antes disso: **descrição por forma + poder real da skill (17/ago/2026,
noite)** — feedback ao vivo do dono testando o app: (1) a descrição por forma
só falava do FÍSICO, faltava o comportamento ("o que ele faz") — agora soma
uma frase real do papel+alinhamento dominante (`behaviorSentence`, extraída do
`personalitySummary` que já existia só na ferramenta interna); (2) o custo das
skills era um rótulo fixo por tipo — `ficha/realSkillPower.ts` chama o motor
DE VERDADE do class-system (`calcularSkill`, import dinâmico) e mostra um
`poder` real ao lado, verificado crescendo do rookie ao ultra e da básica pra
especial. Também no Class-System (PR #8 de lá): sinergia de alvo único
(fogo→vileza etc.) agora alimenta a cascata de destravamento — sinergia de
LEQUE (vida→5 primais) fica de fora de propósito, senão reabria o exploit que
a rodada 2 fechou — e a lista de investimento mostra os derivados "em
progresso" (passivos acumulando, ainda sem poder pontuar direto). Ver
`docs/ORACULO.md` (rodada 5).

Antes disso: **revisão profunda do oráculo (17/ago/2026, tarde)** — a
pedido do dono ("cada usuário com personagem único, interessante e fiel").
Medição com 200 perfis reais achou e as correções fecharam: (1) NOMES — a
colisão de baseName caiu de 20,5% para **1,5%** (mais bits da identidade,
RNG dedicado, bancos dobrados, 4 padrões de composição; estilo intocado);
(2) PAPÉIS no caminho só-6 — alcance caiu de 46% para 12–22% e suporte subiu
de 5% para 18–22% (recalibração validada em 3 seeds, direções de fidelidade
intactas); (3) IDENTIDADES FANTASMA — sombra/água/pântano/akasha/gelo agora
todos ≥3–4% (piso compensando o racha das perguntas de reino). Fidelidade
confirmada forte: respostas opostas mudam a identidade 10/10, todos os 6
traços movem eixos em direções coerentes; bestiário sem concentração
(top-10 = 10,5%). No Class-System, auditoria adversarial da cascata rendeu
9 achados corrigidos (PR #5 — medidor de orçamento cobrava pontos crus,
custo em paridade com os pais {1,2,3,4}, invariantes de aridade/pressa
refechados na curva inteira, taxonomy.json v2 como contrato de máquina). O
Besti-rio- ganhou superfície de máquina (PR #3 — export canônico com
procedência + AGENTS.md; uso principal = servir este pipeline). Custo do
par espelhado no Soulmon (CUSTO_PONTO_PAR 3→2) e snapshot re-sincronizado.

**QA rodada 2 (17/ago/2026)** — dois buracos medidos e fechados. (1)
**Paridade dos diais**: mutar `CUSTO_PONTO_PAR` de 2 para 3 não derrubava
NENHUM teste (1253/1253 verdes) — os fixtures da cascata medem comportamento
(passivos/destrave) e preço não entra em cascata nenhuma, então o dial podia
divergir do class-system em silêncio (footgun 9). O sync agora copia o bloco
`geracoes` do `taxonomy.json` v2 para o snapshot e `cascata.parity.test.ts`
afirma os QUATRO diais (divisor, limiar, custo base, custo do par) contra ele;
verificado por mutação: cada um dos 4 agora mata teste. (2) No Class-System,
**a armadilha de retrancar**: com a lava destravada, investir 1 ponto direto e
depois baixar um componente retrancava o par — o ponto continuava cobrando
orçamento e não sobrava nenhum `−` na tela (só "Resetar", que apaga a build).
Agora existe `desinvestirElemento` no motor e a tabela lista `alocaveis` ∪
{derivados com ponto direto}, os travados só com `−`.

Antes disso: **alocação geracional + página do Pet (17/ago/2026)** —
rodada 2 da fusão, a pedido do dono: (1) o class-system ganhou a CASCATA
geracional (PR HexerVoodoom/Class-System#5 — ponto direto só em base; 5+5→1
passivo no par; 10 passivos destravam alocação direta; peso de geração como
CUSTO {1,3,10,30}, não multiplicador); (2) a ficha do Soulmon distribui por
essa regra com orçamento próprio de elementos (30/60/120/300/500) e
especialização progressiva — medido: rookie–ultimate só bases, mega chega
"quase destravando", ultra compra o par em ~73% dos perfis (réplica gen-2 com
teste de PARIDADE contra fixtures do motor real, gerados no sync); (3) o
bestiário ganhou LINHAGEM com continuidade de espécie (uma inspiração por
estágio; 86,8% das transições preservam a família, travessia rara por
sobreposição); (4) cada estágio ganhou o par de skills básica/especial
derivado da ficha (a especial do ultra usa o PAR comprado — ex.: "Fúria de
Prisma"); (5) página nova do **Pet** (chip Evolução | Pet | Estatísticas):
formas já desbloqueadas (nunca futuras), a descrição por forma que existia no
save e nunca era renderizada, e as duas skills — verificada com Playwright em
PT e EN. Decisão de arquitetura confirmada pelo dono: dados por SNAPSHOT
embarcado (não API).

Antes disso: **fusão class-system + bestiário no oráculo (ago/2026)** —
o pipeline completo agora distribui os pontos do usuário na ficha do
class-system (constelação ancorando os 17 elementos, 65 talentos cientes de
pré-requisito, 11 profissões), captura o companheiro pela mecânica real e
busca a criatura-inspiração num pool de 2.000 do corpus canônico do
Besti-rio- — com cobertura TOTAL travada por simulação e o nome da inspiração
proibido em prompt por teste. Dados por snapshot com SHA
(`npm run sync:oracle-data`). Pendência do dono: mergear
`claude/canonical-classification` na main do Besti-rio- (o pool aponta para a
branch até lá). Ver `docs/ORACULO.md`.

Antes disso: **UI rodada 6 (15/ago/2026)** — cinco passadas de QA de
design sobre a rodada 5: guardrail de moeda restaurado em Estatísticas (Bits
sem ícone, fonte de calculadora), relatório diário/modais de tarefa/batalha da
Masmorra no kit, Dino sem vazio, barra do ritual segmentada, varredura do tema
claro e closeup das quinas. Relatório: `product/soulmon-01/ui/align-round6.md`;
prompts de arte ganharam A15–A16.

Antes disso: **UI rodada 5 (15/ago/2026)** — os primitivos legados
`.sm-btn`/`.sm-card` passaram a desenhar o kit pixel (chanfro + cobre + banda
de quina), o que converteu de uma vez onboarding, tutorial, modais, popover do
menu e o topo da Evolução; backdrops roxos viraram teal, os vazamentos de roxo
de Torneio/PPT/Masmorra saíram, e o fundo de circuito da Ref C entrou por CSS.
Relatório: `product/soulmon-01/ui/align-round5.md`. O que falta é ARTE —
prompts prontos em `docs/BACKLOG-ARTE-GERAR.md` (itens A9–A14 novos).
⚠️ Registro de ambiente: os 6 testes de `GameStateContext.storage.test.tsx`
falham em sandbox Linux (o mock de storage cheio não dispara quota no jsdom de
lá) — **pré-existente**, falha idêntica no commit base; nos ambientes das
rodadas anteriores passavam.

Antes disso: **novo motor do oráculo (ago/2026)** — o teste de
personalidade do repositório `teste-personalidade` virou a LEITURA do oráculo do
Soulmon (`src/utils/soulProfile/`), no lugar do signo por faixa de datas, do
ascendente chutado de 2 em 2 horas e das 6 perguntas do quiz antigo. A metade
criativa (`utils/oracle.ts`: arquétipo, famílias, as 11 formas, prompts de
sprite) não foi tocada, e o caminho legado segue inteiro para quem já tinha
perfil salvo. Detalhes e o porquê de cada decisão em `docs/ORACULO.md`.

Antes disso: **loop de QA multi-agente (ago/2026)** — 3 rodadas, suíte de
379 → 600 testes, mais uma frente de aplicação da UI pixel-art. Ver
`product/soulmon-01/` para os relatórios de cada rodada. O achado estrutural
está resumido na seção 5 abaixo e é o que vale ler primeiro.

Antes disso: auditoria de segurança multi-agente (3 agentes, escopo
dinheiro / auth+dados / IA+push+segredos).

---

## 🆕 Merges de 26/08/2026 — parte 3 (a virada da noite), `33fd94cc..e8aef62a`

**~20 merges.** A parte 2 dizia fechar "o dia inteiro" e não fechava. A natureza
do que entrou aqui é diferente das três passadas anteriores: a parte 1 e a 2
fecharam **dívida estrutural** e depois **bugs de comportamento**; esta fechou
**segurança e cadeia de suprimentos** — e ligou uma feature inteira que já
existia com outro nome.

### 🔐 Segurança — seis frentes, todas na seção 1

Detalhe achado a achado em **1.1** (N-3 a N-8) e **1.5**. Resumo:

| | O quê | Merge |
|---|---|---|
| ✅ | Oráculo e-mail→conta morto **na raiz** — o `pid` deixa de ser derivável | `d3094918` |
| ✅ | Diretório público respeita `pvpEnabled`; aba Amigos resolve por `pid` | `08b04038` |
| ✅ | Guarda de esquema na URL de sprite — dados **e** os dois componentes | `7f3f6193`, `8148f34f` |
| ✅ | Electron: `will-navigate`+`will-redirect` travados; IPC checa `senderFrame` | `16effec2` |
| ✅ | Service worker para de cachear resposta de outra origem | `3b45df1b` |
| ✅ | `customKeywords` delimitado no prompt; `temperature` `clamp`ada | `4997bccb` |
| ✅ | Keystores: são do **DigiApp**, e com Play App Signing a rotação é formulário | análise |
| 🔴 | SEC-3 (resgate atômico) e SEC-4 (`PLAY_REQUIRE_ACCOUNT_BINDING`) **seguem abertos** | — |

### 📦 Suprimentos — e o achado mais desconfortável do dia

`node_modules` **saiu do rastreamento** (19.035 arquivos), permissões declaradas,
actions presas por SHA, `npm ci` no desktop — e **o gate do CI estava morto**,
então `tsc` e `vitest` provavelmente não rodavam em push nenhum. Seção **1.5**.

### 🚦 Workflows — publicar vira ato deliberado

Build e release do desktop foram **separados em dois arquivos**: release só sai
de tag `v[0-9]+.[0-9]+.[0-9]+`. O motivo é medível — enquanto publicar disparava
em push de branch, um commit numa branch de rascunho virava **atualização
automática instalada na máquina do jogador**, sem assinatura Authenticode. Ver
`desktop/README.md` e a linha de Deploy do `CLAUDE.md`. O step do
`SIBLING_REPOS_TOKEN` foi **provado inútil** e saiu dos dois workflows de build.

### 🎮 Produto

| | O quê | Merge |
|---|---|---|
| 🏷️ | **Nick reenquadrado no onboarding** + batismo do Soulmon no cadastro. O apelido é **identidade pública**, e o texto anterior convidava a digitar o nome real — que é exatamente o dado que o diretório público expunha | `6054e747` |
| 🔓 | **O cap do demo consertado E afrouxado no MESMO release** — ver abaixo | `cc0ba3f2` |
| 🔗 | **Vínculo LIGADO** — ver abaixo | `e8aef62a` |

#### 🔓 O cap do demo: **a lição 7 sendo obedecida à risca**

A pendência **A** do dono era um bug que vazava **a favor** do jogador: o
`DEMO_ACTIVITY_DAILY_CAP` só era consultado dentro do `CreateModal`, e o botão
principal de criar da tela inicial abre o `EditModal`, que salvava sem checar
nada. Consertar sozinho seria um **APERTO**.

**Saiu conserto e afrouxamento no mesmo release, e a fronteira mudou de EIXO:**

- o teto deixa de ser **diário** e passa a ser **TOTAL**:
  `DEMO_ACTIVITY_TOTAL_CAP = FORM_REQUIREMENTS.rookie.cap` — **6 hábitos
  ativos**, derivado da constante e não um literal (confirmado no código);
- **tarefa avulsa fica livre**, sem limite nenhum;
- **todo caminho de criação passa pela mesma porta** — os dois modais e os dois
  vazamentos menores (`handleAICreateActivity`, `handleCompleteTutorial`);
- o `UnlockNudge` passou a aparecer também no `EditModal`, senão a recusa nova
  chegaria sem saída (por isso o `CLAUDE.md` dizia "dois lugares" e hoje são
  três).

> **O argumento de produto, e é o que justifica o eixo novo:** a paywall estava
> caindo sobre o **cuidado** — o grátis era impedido de registrar o que fez, que
> é justamente o que o produto diz existir para fazer. 6 hábitos ativos é a
> rotina inteira do Rookie. A fronteira passou a cair sobre **quantidade de
> rotina mantida**, não sobre **poder usar o app hoje**.

#### 🔗 Vínculo: o level de conta que **já existia com outro nome**

`0f38f303` / merge `e8aef62a`. A suspeita inicial era de que não existia nada —
e estava errada. O XP já era acumulado; faltava fiação, nome e consequência.

- **O nível NUNCA vai para o save**: é sempre `bondLevelFor(totalXP)`, derivado
  na leitura. Persistir `bondLevel` seria o footgun 9 na forma mais cara — duas
  fontes para o mesmo número, uma delas já gravada no aparelho de quem joga.
- **Gate de PvP no nível 5** (`BOND_PVP_MIN_LEVEL`), **nos dois lados**:
  cliente (`canPvp`) e servidor (ação `profile` em `community.js`). O servidor é
  quem decide, porque o cliente é editável.
- **O gate vale para LIGAR**, não para manter: quem já estava com
  `pvpEnabled: true` continua. Como `bondLevelFor` é monótona e `totalXP` só
  cresce, é um **limiar**, não uma manutenção — ninguém é rebaixado.
- Os eventos de XP são os de esforço que já existiam (check-in, conclusão, run
  de masmorra, partida), e passam pelo teto diário suave de `bond.ts`.

⚠️ **Nota de método, e é a terceira vez no dia:** *verificar antes de construir*.
Três vezes hoje a suspeita de "isso não existe" era falsa — o teste do D1, o
campo de nick, e o Vínculo inteiro. Lição **15** de `LICOES-DE-METODO.md`.

---

## Merges de 26/08/2026 — parte 2 (a tarde e a noite), `2be666d5..33fd94cc`

Verificado nesta árvore (`HEAD = 33fd94cc`), não lembrado. Gate:
`tsc` EXIT=0 · `vitest` **149 arquivos / 2631 passed / 2 skipped**.

### 💗 O coraçãozinho queimado — 150 Bits gastos para curar ZERO

**É o achado do dia, e é dinheiro do jogador.** A tarefa era estrutural (tirar
regra de dentro de três updaters inline do `handleFeed`); o que apareceu foi um
bug de moeda.

A recusa de "vida já cheia" só era lida do `gameState` **de fora** do updater;
dentro, o código se limitava a clampar a cura com `Math.min`. Dois toques no
mesmo lote do React leem o **mesmo** `gameState` — com 4/5 de vida, `4 < 5`
passa **as duas vezes** — e a segunda passada decrementava o inventário para
curar **zero**. Um Coraçãozinho custa **150 Bits** na loja, ou é drop de 5% na
masmorra. Sumia em silêncio, sem toast, sem log, sem nada.

**É a família do X-6 num lugar novo**, e a assinatura é idêntica: o defeito é a
**procedência do argumento**, não o tipo dele. Trocar `prev` por `gameState`
dentro de um updater compila; apagar a recusa de dentro dele também.

O conserto: `applySpecialItem` reconfere a recusa **sobre o `prev`**, como
`applyRub` e `applyFeed` já faziam. A regra foi para um arquivo **novo**,
`src/utils/specialItemUse.ts`, e a escolha está argumentada no cabeçalho dele —
não no `careUpdaters.ts`, que existe para guardar o **teto**, e item especial
não tem teto; não no `shop.ts`, que é **catálogo**. O arquivo novo **consome**
`CHIP_BOOST` e `HEART_HEAL` em vez de redeclarar, para os números seguirem com
um dono só. Nenhum número de progressão se mexeu.

`dcbeb42d` (merge `96a62b86`) · `specialItemUse.ts`, `specialItemUse.test.ts`

### Os outros quatro bugs reais

| O quê | Dano concreto | Commit |
|---|---|---|
| **O overlay rebaixava save legado a rookie — e devolvia o erro ao SAVE.** `cloudSync.ts` tinha `MAX_HP_BY_LEVEL`, `ENERGY_BY_LEVEL` e uma `stageLevel` própria que lia só o **prefixo** do id; a `getStageLevel` do app cai em `LEGACY_FORM_TIERS`, a compatibilidade que mantém um save antigo em `gaioumon` como **mega**. A justificativa escrita da cópia ("importar `types/progression` arrasta o roster legado da masmorra") era **falsa** — aquele arquivo não importa nada. | O jogador via **3 corações em vez de 4**, e o `maxHealthPoints` errado **voltava para o save** em `normalizeForRules`, fazendo `applyRub` cortar a cura do mega no teto de um rookie. | `2bc9af3a` (merge `d56bba7a`) |
| **Banho e dormir do overlay não escreviam NADA.** `doShower` eram três linhas — frase, efeito, render — e zero escrita. `doSleepToggle` virava um booleano no `localStorage` do overlay. | Medível em corações: `applyPoopDrain` tira **1 coração a cada 6h** de cocô não limpo, e o banho é o **único** jeito de parar esse relógio — o jogador via o pet perder coração apertando exatamente o botão que existe para impedir isso. E pelo overlay `rest.nights` nunca recebia nada: sem constância, sem raridade de sonho, sem pesadelo. | `3e1e92d5` (merge `86341fcb`) |
| **O teto de carinho do overlay era por APARELHO** (`{ healed: 0 }` fixo). | Quem tinha o overlay aberto curava 1 coração no celular **E** mais 1 no desktop, todo dia. O teto de 1/dia do produto não existia para essa pessoa. | `f6fb5f30` (merge `69f7f157`) |
| **O botão "Tentar de novo" do sprite existia, era testado, e NÃO EXISTIA NA TELA.** A prop `onRetrySprite` é opcional, o `App` não a passava, e **nada acusava** — nem o `tsc` nem a suíte. | O jogador com falha de credencial via um card sem saída. `canManualRetry` já sabia tudo (teto manual de 3, cooldown de 60 s); faltava um chamador. A execução do lote virou `executarLote()`, usada pelo lote automático **e** pelo retry — mesma trava serial, mesmo `runSpriteBatch`, sem segundo caminho de geração. | `46a6e542` (merge `9ebd35f4`) |

### 📦 Steam: o empacotamento foi EXECUTADO pela primeira vez — e rodar provou algo

`npm run dist:steam` **nunca tinha sido rodado por ninguém**. Rodou:
**EXIT=0**, `release/win-unpacked` com **274 MB**, `Soulmon.exe` de **188 MB**,
`app.asar` de 5,1 MB.

**O achado que só aparece rodando:** lendo de dentro do asar,
`-c.extraMetadata.steamBuild=true` vira **BOOLEANO**. A comparação estrita de
`main.js` (`steamBuild === true`) portanto acerta, e o auto-update fica
desligado no build de Steam. **Se tivesse virado a string `"true"`**, o build da
Steam se auto-atualizaria pelo GitHub por cima do que o SteamPipe instalou —
exatamente o conflito que essa variante existe para evitar, e **ninguém sabia de
que lado estava**. Saída real e o tropeço do caminho em `desktop/STEAM.md`.

`2f3cd4f6` (merge `33fd94cc`)

### 🔐 Login do desktop: **guarda deliberada**, não bug

Veredito, para ninguém "consertar" o que não está quebrado:
`startDesktopAuthBridge` (`src/utils/auth.ts`) sai na primeira linha porque
⚠️ **Desatualizado desde 07/09/2026** — as `VITE_FIREBASE_*` agora existem
(projeto `soulmon-app`, no `.env` local) e o login está configurado. O texto
abaixo descreve o estado ANTERIOR.

`isAuthConfigured()` exige três `VITE_FIREBASE_*` que **não existem em lugar
nenhum desta árvore** (nem `.env`, nem CI, nem vite config) — e o próprio
arquivo documenta que isso é proposital. O chamador existe e roda (`App.tsx`).
**Depende da fatia 1 do dono**, não de código. Não foi forçado nem mockado.

O que dava para exercitar foi exercitado: `desktop/electron/auth-preload.js`,
código nosso, síncrono, sem rede, que **nunca tinha rodado uma vez** — sete
casos carregando o arquivo de PRODUÇÃO com um `electron` falso só no lugar do
host, provados vermelhos mutando o preload (`authBridge.test.ts`).

### Infra e medição que entraram junto

| O quê | Commit |
|---|---|
| **CI passou a rodar `tsc -p desktop/tsconfig.json` em PR.** O buraco era menor do que "não existe CI do desktop" — os testes do desktop já rodavam em PR (`vitest.config.ts` inclui `desktop/renderer`). Faltava exatamente UM comando, que só existia no `desktop-build.yml` (não roda em PR, e com filtro de `paths` que **não inclui** `src/utils/careRules.ts` nem a família de cuidado). Custo medido: **2,4 s**, sem `npm install` dentro de `desktop/`, sem segredo nenhum — roda em fork. O caminho de FALHA foi exercitado, não suposto. | `3795020b` (merge `a3c581d5`) |
| **Métrica-norte instrumentada e legível.** Não havia evento que permitisse calcular NEM "ativo na semana" NEM "≥4 de 7" — `day_active` é diário e anônimo, e `count(day_active)` não distingue 1 pessoa em 5 dias de 5 pessoas em 1 dia. Agora a conta fecha **no aparelho** e sai agregada: ledger local acumula dias ativos e dias no objetivo, e na virada da semana ISO despacha **dois inteiros de 0 a 7**. O servidor guarda o **histograma**, então mudar o alvo depois não exige reinstrumentar nem perde histórico. | `fae95fc5` (merge `149ea0e4`) |
| **Rota de leitura de `m:*` criada, fail-closed.** Havia dado gravado com TTL de 730 dias que **ninguém conseguia abrir** — nenhuma rota, nenhum painel, nenhum script. Agora há leitor, fechado por segredo: **sem `METRICS_ADMIN_KEY` a rota responde 404, não 401** (401 confirmaria o endpoint). Precisa do secret configurado para existir. | idem · `functions/api/metrics.js` |
| **O vazamento do cap do demo foi INSTRUMENTADO, nunca corrigido.** `activity_create` distingue o caminho que consulta o teto do que o contorna, então dá para **medir** quanto do teto é furado. Nenhuma linha do comportamento mudou — o conserto isolado seria um **aperto**, e espera decisão do dono. | idem |
| **Falha de credencial ganhou voz.** Com 401/403 no acervo, o card mostrava arte de reserva e **silêncio total**. Agora 401 pede entrar de novo e 403 pede **sincronizar o progresso** — e há teste que falha se as duas saídas forem iguais, porque são conserto de coisas diferentes (403 é `SAVE_ID` errado; re-login não conserta). A copy provisória virou copy de verdade em `e1da4e2f`. | `60b0c89b` (merge `8296d66e`) + `e1da4e2f` (merge `fd4562ee`) |
| **Retentar virou orçamento POR MOTIVO, não booleano.** `auth` (401) ganha **uma** retentativa — o SDK do Firebase renova o token de hora em hora, então uma pega a renovação e a segunda é bateria gasta; `identity` (403) já não retentava. O que estava quebrado no 403 era só a **classificação** (gravava kind `error` no acervo). | `84209ded` (merge `689e2dcc`) |
| **A cópia da energia da comida saiu do overlay — e escondia um cast mentiroso.** `menu.ts` recalculava `Math.min(maxEnergy, energy+1)` depois de `feedFood` já ter aplicado o teto. Por baixo havia um `as unknown as` rodando sobre `undefined` (`DesktopState` não tem `evolutionStage`, `energyPoints`, `virusPoints` nem `totalXP`): a regra devolvia energia errada e atributos `NaN`, e **só não aparecia porque o `menu.ts` jogava tudo fora e recalculava à mão**. A cópia era o curativo que mantinha o cast quebrado invisível. | `d9765d09` (merge `f6716ec5`) |

---

## Merges da tarde de 26/08/2026 — parte 1

Verificado à época contra `HEAD = 2be666d5`.

| O quê | Commit | Onde |
|---|---|---|
| **Retenção de `ent:` e `ord:`: 5 anos, RENOVADOS a cada escrita.** Até aqui os dois eram gravados **sem TTL nenhum**. A renovação não é detalhe: com prazo contado do nascimento, o `ent:` expiraria e levaria junto o `tier: 'paid'` de quem comprou e continua jogando, e o teto VITALÍCIO de IA (26 gerações) resetaria. O registro só morre após 5 anos de silêncio absoluto. | `b2a35465` (merge `b3cdfabc`) | `_entitlements.js:20-65`, escrita em `:164-170` e `:271`; testes em `_entitlements.ttl.test.js` |
| ⚠️ **O caminho D1 (`order_claims`) NÃO expira** — banco não apaga linha sozinho. Com D1 ligado, a decisão de 5 anos **não se aplica ao recibo**. Falta uma limpeza que não existe. | idem | `_entitlements.js:61-63` (aviso já está no código) · decisão do dono pendente |
| **`saveId` reconciliado no login (B-R1)** — quem nunca logou tinha `saveId` = UUID aleatório e, no corte para `enforced:true`, tomaria **403 permanente** que re-login não conserta. `reconcileSaveId` reusa o `emailToSaveId` existente (nada de quarta cópia). Conflito de dado resolvido por **assimetria de reversão**: chave derivada vazia → migra; ocupada → a **nuvem** ganha e o local vai para backup byte a byte; a chave antiga **nunca** é apagada; nuvem indeterminada (5xx/offline) **não** migra. | `d07bb287` (merge `f56e7075`) | `cloudSave.ts` (`reconcileSaveId`), chamado em `App.tsx:811-814`; `cloudSave.reconcile.test.ts` |
| **Cloud save devolve erro TIPADO (R-3)** — antes 401/403/409/412/413/5xx colapsavam num `boolean` que o chamador nem lia. O risco nunca foi conflito: era **save perdido sem ninguém ver**. Agora há política POR CÓDIGO de `retentável` e `avisaJogador`. | idem | `cloudSave.ts` (`classifyCloudSaveStatus`, `CLOUD_SAVE_POLICY`); `cloudSave.errors.test.ts`, `GameStateContext.cloudErrors.test.tsx` |
| **`spriteGen.ts` deixa de colapsar 401 e 403.** Não era "esquecimento": ele os unia de propósito num `auth` só. 403 é `SAVE_ID` errado e **re-login NÃO conserta** — quem conserta é `reconcileSaveId`. Agora reusa o classificador do save em vez de um segundo vocabulário de erro. | `d1bbf0ff` (merge `2be666d5`) | `spriteGen.ts:30-42`, `:108-112` |
| **`RECONCILE_KEYS` saiu de `cloudSave.ts` para `storageKeys.ts`**, como tabela própria e **não** dentro de `STORAGE_KEYS`: é rastro forense de migração, não preferência. O valor das strings está travado por teste — mover a constante de arquivo não pode mudar o que já está gravado no aparelho de ninguém. | idem | `storageKeys.ts`, `storageKeys.reconcile.test.ts` |
| **Teto de cuidado do desktop virou o teto do SAVE.** Ver `docs/PLANO-DESKTOP-STEAM.md` §3c-bis. | `f6fb5f30` (merge `69f7f157`) | `desktop/renderer/src/care.ts` |

**Efeito sobre a fatia 1:** os dois itens que a `squad-alpha-runs/ROADMAP.md`
classificava como bloqueantes do corte (**B-R1** e **R-3**) estão **feitos**. O
que ainda bloqueia é só o que depende do dono (§3).

---

## 1. Segurança — auditoria de 2026-08

Rodada com o motor do `/security-review` da Anthropic, dividida em três frentes
paralelas. Cada achado abaixo foi **verificado à mão no código** antes de
entrar aqui. Filtro aplicado: só confiança ≥ 8, sem DoS, sem rate limit, sem
"falta de hardening" e sem race teórica.

### 1.1 Explorável AGORA, em produção

**Reconferido contra `e8aef62a` na consolidação de 26/08.** Referências em
**SÍMBOLO**, pela decisão de formato do topo desta página.

| # | Onde (símbolo) | O quê | Status em `e8aef62a` |
|---|---|---|---|
| SEC-1 | `denyUnlessOwner` em `functions/api/community.js` | 5 de 11 ações sem autorização nenhuma | ✅ **FECHADO EM PRODUÇÃO em 07/09/2026** — `FIREBASE_PROJECT_ID=soulmon-app` ligado no `wrangler.jsonc`. Verificado na borda: `/api/save` sem token devolve 401 `unauthenticated` |
| SEC-2 | `pidFor` / `PID_PREFIX` / `putProfile` em `functions/api/community.js` | o `saveId` era publicado como identidade social | ✅ **corrigido, e a correção MUDOU de natureza hoje** — ver N-3 abaixo |
| SEC-5 | `isAllowedPushEndpoint` em `functions/api/subscribe.js` (a trava); `costGate` na entrada | SSRF: qualquer `endpoint` aceito, worker faz `fetch` nele 4×/dia | ✅ corrigido (⚠️ o worker é deploy MANUAL — a versão rodando hoje **não é verificável por leitura**; inalterado hoje) |

#### 🆕 N-3 — o oráculo e-mail→conta morreu, e a recomendação da auditoria não teria fechado nada

**Fechado em `8ff7f7ab` / merge `d3094918`. Confirmado no código.**

O SEC-2 tinha sido corrigido publicando um `pid` **derivado** —
`SHA-256("soulmon-pub:" + saveId)`, 24 hex, "caminho só de ida". A auditoria
recomendou remover um fallback. **O agente verificou e a recomendação não
fechava o buraco**, por duas razões que só aparecem lendo:

1. O `saveId` já é `SHA-256("soulmon:" + e-mail)`, e o `pid` era hash **sem
   segredo** do `saveId`. Logo `e-mail → saveId → pid` era uma cadeia
   inteiramente derivável **offline, por qualquer um**. Tirar o fallback só
   trocaria o parâmetro que o atacante usa.
2. Pior, **o próprio diretório público JÁ era o oráculo**: bastava derivar o
   `pid` do e-mail e procurá-lo na listagem — sem nem chamar a rota que a
   recomendação mandava fechar.

**A derivação morreu.** O `pid` hoje é **aleatório**
(`crypto.getRandomValues`, 12 bytes) e o vínculo vive num índice reverso no
servidor (`pid:<pid>` → saveId, com `expirationTtl`). Os índices antigos são
aposentados sozinhos no próximo save de cada conta — não houve migração.

> **A lição, e ela é de método, não de código:** *a recomendação de uma auditoria
> pode não fechar nada*. Está registrada como lição **13** em
> `squad-alpha-runs/soulmon-02/LICOES-DE-METODO.md`.

#### 🆕 N-4 — o diretório público passa a respeitar o consentimento que já existia

**Fechado em `f1ce3848`; a aba Amigos deixou de depender dele em `9989a0c1` /
merge `08b04038`. Confirmado no código.**

Era o **B5** do `GUIA-DO-DONO.md`, listado como "decisão do dono". A
inconsistência que decidia a pergunta: a rota de **oponentes** filtrava por
`pvpEnabled` e a de **jogadores** não filtrava por nada — e o perfil é gravado
junto do cloud save, então **o jogador entrava no diretório por consequência de
salvar, não por escolha**. O produto já tinha o gate de consentimento; uma das
duas rotas o ignorava.

Hoje a ação `players` também aplica `if (!p.pvpEnabled) continue`. O que estava
exposto sem token e para qualquer origem — `name` (texto livre de 24 caracteres,
**e tem gente que digita o nome real**), nome do pet, estágio, dias jogando,
tarefas feitas e pontos, até 50 perfis por chamada com busca por parte do nome —
passa a sair só de quem ligou PvP.

⚠️ **Consequência querida e que precisa estar escrita:** a aba **Amigos** lia do
diretório público. Se ela continuasse lendo, amigo com PvP desligado sumiria da
lista do próprio amigo. Ela passou a resolver **por `pid`**, que é o
identificador que a amizade já guardava — a lista de amigos não é o diretório, e
agora as duas coisas não compartilham fonte.

#### 🆕 N-5 — a URL de sprite ganha guarda de esquema (dados **e** componentes)

**`6dde6750` / merge `7f3f6193`, estendido a dois componentes em `94d45e62` /
merge `8148f34f`. Confirmado no código e em teste.**

A URL do sprite vinha do diretório público e ia direto para `<img src>`.
`isSafeSpriteUrl` (em `src/utils/spriteLibrary.ts`) é a **função única**,
importada também por `pixelizeDataUrl` (`src/utils/spriteGen.ts`) e pelos dois
componentes. Fecha `javascript:` (inclusive `JaVaScRiPt:` e com TAB/LF no meio
do esquema), `data:` não-imagem, `http:`, `file:`, `blob:` e `//host`.

🔴 **NÃO fecha o beacon** `https://atacante.example/x.png`. Fechá-lo exige
allowlist de **HOST**, e o host do CDN do Higgsfield **não está confirmado** —
`platform.higgsfield.ai` é o host da API. **Pendência do dono** (ver
`GUIA-DO-DONO.md`): um exemplo real de URL devolvida pelo provedor fecha isto
**e** aperta a CSP de `img-src … https:` para `img-src 'self' data: <host>`.
Chutar o host **desliga a arte própria de todo mundo em silêncio** — o visor não
tem estado de erro, por decisão de spec.

#### 🆕 N-6 — Electron: trava de navegação da janela e origem no IPC

**`1ce7014c` / merge `16effec2`. Confirmado no código.**

`desktop/electron/main.js` passou a interceptar **`will-navigate` E
`will-redirect`** — os dois, porque redirecionamento de servidor (302 para outra
origem) **não passa** por `will-navigate` —, e `setWindowOpenHandler` manda link
externo para o navegador padrão. No IPC do token, a checagem é sobre
**`event.senderFrame`** e não `event.sender`: um `<iframe>` de terceiro
compartilha o `sender` com a página que o hospeda, então checar `sender` deixaria
um frame de outra origem pedir o token.

🙋 **Falta o olho humano, e é 1 minuto** — o agente não executou o Electron. Está
no `GUIA-DO-DONO.md`.

#### 🆕 N-7 — o service worker parava na requisição e não olhava a resposta

**`2299bc53` / merge `3b45df1b`. Confirmado em `public/sw.js` (`CACHE_VERSION`
= `v93`).**

O `fetch` handler saía cedo em requisição de outra origem, mas **guardava a
resposta** de caminhos que podiam ser redirecionados para fora. Hoje a checagem
é `url.origin !== self.location.origin` no ponto de entrada **e** a resposta é
inspecionada antes de entrar no cache. No mesmo merge, o updater do desktop
passou a decidir **fail-safe**.

#### 🆕 N-8 — prompt injection: o texto do jogador sai da lista de regras e vira dado delimitado

**`a9343068` / merge `4997bccb`. Confirmado em `functions/api/chat.js`.**

`customKeywords` é texto livre do usuário e entrava **no prompt de sistema**,
como se fosse regra. Hoje entra dentro de uma caixa rotulada e delimitada
(`<<<USER_STYLE>>>` … `<<<END_USER_STYLE>>>`), com `sanitizeCustomKeywords`
removendo os próprios delimitadores e qualquer coisa parecida com eles — **ele
não consegue fechar a própria caixa**. A trava de cuidado (o que a persona pode
dizer num dia ruim) vem **depois** do bloco, de propósito.

Junto: `temperature` vinha **crua do corpo** para o Groq e passou por
`clampTemperature`. Não é injeção de texto — é parâmetro de inferência sob
controle do cliente, que é a mesma família de dano.

> ⚠️ Isto **rebaixa mas não apaga** o item "Prompt injection sem consequência
> privilegiada" da seção 1.3. O argumento de lá (*nada do que o modelo responde
> vira escrita no servidor ou chamada de ferramenta*) continua de pé e continua
> sendo a razão pela qual isto nunca foi crítico. O que mudou é que o texto do
> jogador deixou de ter **status de regra**.

> **Reverificação de 2026-08-25** (`squad-alpha-runs/soulmon-01/discovery/security-escopo-e-reverificacao.md`):
> os selos ✅ desta seção mediam o CÓDIGO, não o que está em pé em produção.
> `denyUnlessOwner` delega a `authorizeSaveAccess`, que é *fail-open*
> (**`authorizeSaveAccess` em `functions/api/_auth.js`** — o endereço deste
> achado já escorregou de `:112-113` para `:116`, que é por que hoje ele é
> símbolo; **reconferido em `e8aef62a`, a linha não escorregou de novo e o
> comportamento não mudou**: sem `FIREBASE_PROJECT_ID`, devolve
> `{ ok: true, enforced: false }` sem verificar nada) — e a sonda
> `GET /api/save?id=…` sem `Authorization` devolveu
> **200** em produção. Ou seja: **a correção do SEC-1 só passa a existir quando o
> Firebase for ligado**. Doc que diz ✅ sobre segurança aberta é pior que doc
> ausente: a próxima sessão acredita nele.

**SEC-1 — o buraco central.** Só `action=profile` chama `authorizeSaveAccess`.
`friends`, `gift`, `match`, `trophies?claim=1` e `gifts?claim=1` pegam o ator do
`body.id`/`?id=` e escrevem no registro daquela conta sem prova de posse.
~~Agravante: **isso não fecha quando o `FIREBASE_PROJECT_ID` for ligado** — ao
contrário do `save.js`/`billing.js`, essas ações não consultam autenticação em
ponto nenhum.~~ **Desatualizado ao contrário** (reverificação de 2026-08-25):
hoje as seis ações passam por **`denyUnlessOwner`** em `functions/api/community.js`
(as seis chamadas — `grep -n denyUnlessOwner functions/api/community.js` acha a
família inteira; as linhas foram deixadas de fora de propósito, pela decisão de
formato do topo), então é exatamente o oposto — **só fecha quando ligar**.

Impacto concreto: roubar 20 Bits/vítima/dia emitindo presente em nome dela;
reescrever a lista de amigos de qualquer um; forjar o campeonato inteiro
(+10 pontos e +1 vitória por chamada, queimando a partida diária da vítima →
1º lugar e troféu 🥇 sem jogar); e **apagar permanentemente** troféus de season
e presentes alheios, sem caminho de reemissão.

**SEC-2 — por que o SEC-1 vira catástrofe.** `action=players` devolve `p.id`, que
**é a chave do cloud save**. Sem conta e sem autenticação dá para listar a chave
de até 300 jogadores e então `GET /api/save?id=…` (lê o save inteiro) ou
`POST` (sobrescreve). Com `Access-Control-Allow-Origin: *` isso funciona de
qualquer página aberta no navegador da vítima.

> Isso muda a natureza do risco que estava documentado como aceito. O texto
> antigo dizia "quem souber seu e-mail pode ler seu save". Na prática **ninguém
> precisa saber e-mail nenhum** — é leitura e destruição em massa.

**Correção aplicada — e ela foi REFEITA no fim do dia.**

⚠️ **Este parágrafo dizia: *"A identidade social passou a ser um `pid` derivado
(`SHA-256("soulmon-pub:" + saveId)`, 24 hex) — caminho só de ida. […] Como o pid
é derivado, não houve migração de dados."* Ficou FALSO em `d3094918`, no mesmo
dia — e a parte falsa era justamente o que dava o selo ✅.**

"Caminho só de ida" descrevia a função errada. `saveId` é
`SHA-256("soulmon:" + e-mail)` e o `pid` era hash **sem segredo** dele: a cadeia
`e-mail → saveId → pid` era derivável offline por qualquer pessoa, então o
diretório público **era** o oráculo e-mail→conta. Irreversível ≠ imprevisível.

**Hoje o `pid` é ALEATÓRIO** (`crypto.getRandomValues`, 12 bytes), e é o índice
reverso `pid:<pid>` → saveId, no servidor, que passou a ser a **única** ligação
entre os dois — não mais uma função que qualquer um recalcula. Alvos
(`friendId`, `opponentId`, `player?id=`) chegam como pid; a lista de amigos
guarda saveId internamente e sai como pid. Nada mudou no cliente: ele já tratava
o id alheio como token opaco. Os índices derivados antigos são **aposentados
sozinhos** no próximo save de cada conta (o `pid` anterior é apagado quando o
novo é gravado), então também aqui não houve migração — mas por outro motivo.

### 1.2 Latente — arma no dia em que o billing for configurado

| # | Onde (símbolo) | O quê | Status em `e8aef62a` |
|---|---|---|---|
| SEC-3 | `claimOrder` / `claimOrderAtomic` em `functions/api/_entitlements.js` | `claimOrder` não é atômico → 1 recibo vira N contas pagas | 🔴 **NÃO RESOLVIDO** — inalterado hoje. O que entrou foi **preparação**, não conserto (ver abaixo) |
| SEC-4 | `verifySteamPurchase` / `isPlayPurchaseBoundTo` em `functions/api/_billing.js` | microtransação Steam sem vínculo com o dono | ⚠️ parcial — **`PLAY_REQUIRE_ACCOUNT_BINDING` continua não ligada**; reconferido: o código lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`, e sem a variável a compra sem vínculo é **aceita** |

> **SEC-3, reverificado em `e8aef62a`.** O caminho atômico continua condicionado
> a `env.DB` (`claimOrder` desvia para `claimOrderAtomic`) e — **conferido nesta
> árvore, e é a prova dura** — **não existe binding `d1_databases` em
> `wrangler.jsonc`**. O arquivo declara `kv_namespaces` (`DIGIAPP_SAVES`,
> `PUSH_SUBSCRIPTIONS`) e mais nada. Em produção roda **sempre** o ramo do KV
> (*read-then-write* sem CAS, sobre armazenamento eventualmente consistente). O
> teste que dava o ✅ usa um `Map` em memória, fortemente consistente: a corrida
> é estruturalmente irreproduzível ali. O selo media o código, não a semântica do
> armazenamento.
> Fonte: `squad-alpha-runs/soulmon-01/discovery/security-escopo-e-reverificacao.md`.

> #### 🆕 O que entrou hoje no D1, e por que NÃO fecha o SEC-3
>
> `ff55215e` / merge `2ef54721` deu **prazo em coluna** ao recibo no D1
> (`migrations/0002_order_claims_expires_at.sql`, limpo na leitura), e
> `45b8c4cf` tirou o schema de dentro do `docs/BILLING-SETUP.md` para apontar
> para `migrations/`. Isso responde a **pendência C do dono** — *"banco não apaga
> linha sozinho, então com D1 ligado a decisão de 5 anos não se aplica ao
> recibo"*.
>
> **Mas é preparação de um caminho que nunca dispara.** Enquanto não houver
> binding de D1 no `wrangler.jsonc`, `env.DB` é `undefined`, `claimOrderAtomic`
> não roda, e a tabela `order_claims` não existe em produção. **Ligar o D1
> continua sendo o conserto do SEC-3** — e agora ele chega com a retenção já
> resolvida, em vez de abrir uma ponta nova no dia em que for ligado.
>
> ⚠️ Não confunda as duas coisas: *a migração existir* e *o caminho atômico
> rodar* são afirmações diferentes, e só a primeira é verdade hoje. Este é
> exatamente o tipo de selo que já enganou esta página antes.

**SEC-3.** O comentário no código dizia que a corrida "exige tempo de propagação
na casa dos milissegundos". **Está errado, e a estimativa era minha.** O Workers
KV é eventualmente consistente com janela de até ~60s, e o `get()` mantém cache
de borda por 60s **inclusive para chave inexistente**. Não é preciso
simultaneidade: basta as requisições caírem em colos que ainda não viram a
escrita. Um recibo de R$ 29,90 vira N contas `paid` com um `for` em `curl` por N
proxies regionais. Não é consertado ligando o Firebase — cada conta clonada
autentica legitimamente, e o `purchaseToken` nunca é vinculado a uma identidade.

O teste também dava falsa segurança: usava um `Map` em memória, que é fortemente
consistente e nunca reproduz a leitura obsoleta.

> ⚠️ **ISSO CONTINUA VALENDO — o ✅ acima é otimista** (rodada 9 de QA,
> ago/2026). O `Map` em memória segue sendo o dublê do KV, **inclusive nos
> testes escritos depois**. Ou seja: **o SEC-3 está marcado como corrigido com
> base num teste que não consegue reproduzir o ataque.** A atomicidade real
> depende do D1 `order_claims`, que **não existe** (ver
> `docs/DEPENDE-DE-VOCE.md` §3).
>
> E nenhum mutante encontra isto: mutação mede o código, não a semântica do
> armazenamento. O instrumento certo é um **KV falso com janela de consistência
> eventual configurável**. É o maior risco de dinheiro que sobrou.

**SEC-4.** `verifySteamPurchase` credita com base num `orderId` decimal vindo do
cliente, sem ticket e sem comparar o `steamid` que a própria Valve devolve. A
função irmã `verifySteamOwnership` exige ticket assinado *exatamente porque* o
SteamID é público — a assimetria é o indício. Como o `orderid` é gerado pelo
parceiro (contador/timestamp) e as respostas distinguem `not-purchased` de
`order-in-use`, o endpoint vira oráculo de enumeração: dá para varrer ids
vizinhos e resgatar a compra de outro jogador antes dele — ele paga a Valve e
não recebe nada.

### 1.3 Auditado e considerado SEGURO

Vale registrar para não reauditar à toa:

- **`_auth.js` — verificação de token Firebase está correta.** `alg` fixado em
  RS256, `aud` e `iss` ambos checados, `exp` e `iat` com tolerância limitada,
  JWKS por `kid` com TTL do `Cache-Control`, falha fechado em rotação,
  `email_verified === true` exigido. Era o achado mais temido e não existe.
- **Chave da Groq não vaza.** Host e modelo são fixos; corpo de erro upstream
  nunca volta ao cliente. Sem SSRF (nem host nem protocolo são controláveis).
- **Prompt injection sem consequência privilegiada** — nada do que o modelo
  responde vira escrita no servidor ou chamada de ferramenta. ⚠️ **Este item
  continua certo pelo motivo dele, mas era otimista sobre a ENTRADA**: até
  `4997bccb` o `customKeywords` do jogador entrava no prompt de SISTEMA com
  status de regra, e a `temperature` vinha crua do corpo. Hoje o texto vai
  delimitado e saneado, e a temperatura é `clamp`ada. Ver N-8 na seção 1.1.
- **PII do oráculo fica no cliente.** Nome completo, data, hora e local de
  nascimento vivem só no `localStorage` (`SOULMON_PROFILE`) e são consumidos
  por `generateOracle`. **Não** entram no `GameState`, não vão para `/api/save`
  nem para o perfil público. **Manter assim.**
- **`save.js`** remove `accountTier`/`credits` do POST do cliente e os reserve do
  registro `ent:` do servidor.
- **`spendCredits`** valida `Number.isInteger(amount) && amount > 0` — não dá
  para cunhar crédito com valor negativo.
- **`grantAdReward`** fica atrás de `ADMOB_SSV_ENABLED !== 'true'` → 501.
- **`closeSeason`** falha fechado sem `SEASON_ADMIN_KEY`.
- **Steam Family Sharing** já é recusado (`steamId !== ownerSteamId`).
- **Sem segredos na árvore de trabalho.** A chave anon do Supabase em
  `src/utils/supabase/` é pública por desenho (RLS) e o app não passa mais por
  lá. Todo `VITE_*` em uso é config web do Firebase, pública por desenho.

### 1.4 Segredos no histórico do git ⚠️

O commit `c47776e5` removeu `bubblewrap_build/`, que continha:

```
bubblewrap_build/android.keystore
bubblewrap_build/signing.keystore
bubblewrap_build/app-release-signed.apk
bubblewrap_build/app-release-aligned.apk
```

Remover do HEAD **não tira do histórico** — quem clonar ainda recupera.

#### ✅ Analisado em 26/08/2026 — rebaixado de "projeto" para "formulário"

`squad-alpha-runs/soulmon-02/security/keystores-vazados.md`. O que a análise
mudou, e é bastante:

- **Os keystores são do DigiApp** (`com.digipartner.digiapp`), **não do
  Soulmon**. O Soulmon builda outro package via Capacitor e o CI dele só faz
  `assembleDebug`, sem keystore de release. **Não há nada a rotacionar do lado
  do Soulmon.**
- **O DigiApp usa Play App Signing** (confirmado pelo dono). Logo a chave vazada
  é a de **upload**; a que assina o app para os usuários é da Google e **nunca
  esteve no repo**. A rotação é Play Console → Assinatura do app → *Solicitar
  troca da chave de upload*: **um formulário de ~5 min**, e os usuários não
  percebem nada.

⚠️ **O risco que sobra enquanto não trocar, declarado sem alívio:** quem tem o
keystore consegue assinar um APK que o Android aceita como **atualização
legítima do DigiApp**, instalando por cima e preservando os dados. **Não**
consegue publicar na Play — isso exige credencial de conta, que nunca esteve no
repo. **O risco é de instalação lateral, não de loja.**

E um detalhe que agrava: a senha da **outra** keystore está em texto puro num
`build.gradle` do repo. A da que importa não foi encontrada — mas JKS tem
derivação de chave fraca, então foi tratada como comprometida.

Ver seção 3.

### 🆕 1.5 Cadeia de suprimentos — a lacuna inteira que ninguém tinha auditado

Até 26/08/2026 esta página registrava, textualmente, que **a cadeia de
suprimentos inteira nunca tinha sido auditada** — dependências, CVEs, permissões
de CI, `vendor/`. Foi auditada. Documento:
`squad-alpha-runs/soulmon-02/security/auditoria-suprimentos.md`.

#### 🔴 O achado que importa: **o gate do CI estava MORTO**

**Confirmado no `ci.yml` desta árvore, com o comando colado no próprio
workflow.** Havia um step que exigia `node_modules/class-system/package.json` e
falhava com *"class-system NAO instalou"*. Ele **não podia passar nunca**: a
dependência de git saiu do `package.json` e do `package-lock.json` quando o
`vendor/` entrou (ADR-002 §1).

```
grep -c "class-system" package-lock.json  ->  0
grep -n  "class-system" package.json      ->  so o script `vendor:class-system`
ls node_modules/class-system              ->  No such file or directory
```

**A consequência é a parte grave, e ela é inferência forte a partir da ordem dos
steps** (marcada como tal): o step morto vinha **ANTES** do `tsc` e do `vitest`,
que são o motivo de o workflow existir. Um step que sempre sai com exit 1 derruba
o job ali. Ou seja: **`tsc` e `vitest` provavelmente não rodaram em push nenhum**
enquanto isso esteve de pé. O CI *parecia* proteger e não protegia.

⚠️ **E ninguém percebeu porque falha de CI vira ruído.** Um gate que sempre
reprova é um gate que alguém desliga — ou, pior, que todo mundo aprende a
ignorar. É a lição **12** de `LICOES-DE-METODO.md`: **gate morto é pior que gate
ausente**, porque gate ausente pelo menos não mente sobre cobertura.

#### O que entrou no lugar, e o resto da rodada

| O quê | Commit | Estado |
|---|---|---|
| **`node_modules` sai do rastreamento** — **19.035 arquivos** | `6e7aa3cd` / merge `aa487200` | ✅ **Confirmado**: `git ls-files node_modules \| wc -l` → **0**. O `.gitignore` já listava `node_modules/`; os arquivos estavam rastreados de antes do ignore, e ignore não desrastreia nada |
| **Integridade do `vendor/`** no lugar do gate morto | `0d41b74c` | ✅ recalcula o `sha256` do bundle contra `_provenance.json`. **Lê o BLOB do git (`git show HEAD:…`), não o arquivo do disco** — `core.autocrlf` transforma LF em CRLF no checkout do Windows e o disco dá outro hash (medido: 232.533 bytes no disco contra 226.978 no blob). Quem escrevesse isto lendo o disco criaria um teste que reprova sozinho na máquina do dono — e seria desligado na semana seguinte |
| **`permissions:` declarado** nos workflows | `0d41b74c`, `80ef844d` | ✅ mínimo por arquivo. `ci.yml` e `desktop-build.yml`: `contents: read`. **`desktop-release.yml` é o único com `contents: write`**, e precisa: criar Release é escrever no repositório |
| **Actions presas por SHA** | `0d41b74c` | ✅ ex.: `actions/checkout@11d5960a…` (v4.4.0), `actions/setup-node@49933ea5…` (v4.4.0). Tag é ponteiro móvel; SHA não |
| **`npm ci` no desktop** | `0d41b74c` | ✅ instala exatamente o lockfile, em vez de `npm install` |

#### 🆕 O step do `SIBLING_REPOS_TOKEN` foi **provado inútil** e removido

**`80ef844d` / merge `5e07e0a4`.** Havia, no `ci.yml` e no `android-build.yml`,
um step "Clonar os repos irmãos" que reescrevia `git+ssh` para HTTPS com o
`SIBLING_REPOS_TOKEN` — para uma dependência de git **que não existe mais no
lock**. Não é que fosse redundante: **não tinha o que fazer**.

⚠️ **O secret continua existindo e continua tendo dono** — o
`sync-irmaos.yml`, que de fato clona os dois repos irmãos toda semana. **O Bloco
1 do `GUIA-DO-DONO.md` continua valendo.** O que mudou é que o `npm ci` não
depende mais dele, então o deploy não quebra no dia em que o token expirar; o
sync semanal, sim.

**O custo, declarado:** se um dia voltar dependência de git no lock, o `npm ci`
vai tentar SSH e falhar em repo privado. **O conserto não é ressuscitar o
step** — é não voltar a ter dependência de git (ADR-002 §1). Se voltar mesmo
assim, o step está no histórico.

---

## 2. Estado do produto

- **Reskin visual + tema claro/escuro (ago/2026).** Paleta trocou de roxo pra
  teal/cobre (`--sm-*` em `src/index.css`, agora com variante
  `[data-theme="light"]`/`[data-theme="dark"]`). Novo `src/contexts/ThemeContext.tsx`
  (persistido em `digiapp-theme`, reaproveitando a chave do antigo seletor de
  skin) + script inline em `index.html` que aplica o tema antes do primeiro
  paint (evita FOUC) + seletor "Aparência" em Configurações. Os skins
  `win98`/`glitch` — mortos, sem nenhum botão que os ligasse — foram
  **removidos por completo** (código e CSS, ~950 linhas), não só desligados.
  Novo mascote da franquia: um corvo de cartola em pixel-art
  (`src/assets/soulmon/mascot-raven.png`, arte fornecida pelo dono, fundo
  originalmente com checkerboard opaco — removido via flood-fill antes de
  virar asset), usado no ícone do app (favicon/PWA/Android/Electron, todos
  regenerados) e como mascote em loading/onboarding/erro/estados vazios. A
  **mecânica do pet do jogador não mudou em nada** — continua gerado pelo
  oráculo por usuário; o corvo é só identidade de marca. Cobertura de temas é
  por prioridade: fundação + ~15 telas de maior uso migraram pros tokens
  novos agora (ver commit); telas secundárias (minigames, alguns painéis
  fundos) ainda têm cor fixa e migram depois.
- **Auditoria de tom e paridade executada (ago/2026).** O chat de fallback
  passou a entender e responder em PT (antes um usuário escrevendo "tô triste"
  recebia "Cheer up!" em inglês), e o pool de tristeza deixou de invalidar o
  sentimento. O prompt da IA ganhou um piso de tom inegociável e passou a
  chavear personalidade por NÍVEL — antes usava nomes do DigiApp, nenhum casava,
  e todo pet falava como "guide and mentor". O tutorial ganhou fallback local de
  tarefas (sem ele, uma falha de rede prendia o usuário numa tela obrigatória
  sem nada selecionável) e parou de ensinar HP só pelo lado da punição.
  `--sm-muted` subiu de 3,48:1 para ~4,6:1 de contraste. Confirmação do
  "Recomeçar do zero" agora diz a verdade (não apaga progresso) e virou
  "Refazer o ritual".
- **Rodada de check-up com personas (ago/2026)** — teste dirigindo o app no
  navegador com 5 personas do público (adolescente com TDAH que some e volta,
  pai com 3 min/dia, perfeccionista após um dia ruim, usuário 58+ com foco em
  acessibilidade, gamer buscando profundidade). Achado mais grave: **o checkbox
  de concluir tarefa renderizava com 2px** — as classes `w-7`/`h-7` não existem
  no `index.css` pré-compilado (footgun 1), então a ação central do app era
  praticamente invisível e impossível de acertar no dedo. Agora é um
  `<button role="checkbox">` de 44px com o círculo de 28px dentro, em tarefa,
  atividade e etapa. Junto: foco visível em todo o design system (não havia
  `:focus-visible` em lugar nenhum), notificações reescritas, e o popup da
  primeira tarefa traduzido e reescrito.
- **Notificações cobravam quem já tinha cumprido a meta.** `totalRequired` era o
  requisito do estágio, não `min(cadastradas, requisito)` — um rookie com 2
  atividades cumpria a própria meta e mesmo assim levava 3 avisos por dia
  dizendo que faltavam tarefas. Corrigido para a mesma meta de
  `computeDailyReset`. O aviso das 21h ("está preocupado! ainda dá tempo!") foi
  removido, e o das 20h parou de prometer que "metade das tarefas" evita a
  perda — o que era falso.
- **Rodada de auditoria (ago/2026)** — quatro achados, todos corrigidos:
  (1) o **ritmo de cuidado era cego a atividades recorrentes**, porque
  `completedTasks` só recebe tarefas avulsas e `lastCompletedDate` some na
  virada; agora existe `activityLog` (teto de 90). (2) O **galho previsto não
  era dito** — a página de Evolução mostrava os três atributos, mas o jogador
  tinha que inferir para onde ia; agora há uma linha com o galho e, no empate,
  quem desempata. (3) O resumo de "uma ação, várias barras" **só existia para
  tarefas**, não para atividades. (4) Dois **ramos mortos** de `digiegg/baby-i`
  na conclusão de atividade (a árvore nasce em rookie).
- **Limpeza:** 10 componentes órfãos removidos (nenhum era importado em lugar
  nenhum, nem por lazy import) e `wasDayPerfect`/`countCompletedYesterday`
  apagados — eram uma SEGUNDA cópia da regra do dia perfeito, sem nenhum
  chamador em produção mas com testes verdes, dando falsa cobertura.
- **Bug corrigido: concluir tarefa não dava nada.** `completeTask` recusava
  tarefa com `completed: true`, mas o `App` marca a tarefa no clique e só chama
  a função 3s depois — então ela SEMPRE recusava. Resultado: a tarefa não saía
  da lista, não entrava no histórico, não contava na estatística e **não rendia
  a comida**. O laço central de recompensa do jogo estava sem efeito. Anterior a
  este trabalho (presente no backup). Há teste de regressão.
- **Benchmark + Fases 1 a 4 do plano de evolução (ago/2026)** — `docs/PLANO-EVOLUCAO.md`.
  Duas rodadas de pesquisa (apps de produtividade gamificada + franquias/hardware
  Digimon, Pokémon e Palworld) viraram um plano em 5 fases. A **Fase 1 está no ar**:
  teto de 1 coração perdido por dia, perdão de ausência ≥2 dias, alívio de meio
  coração toda segunda, `perfectDays` param de decrementar, e a **masmorra não cobra
  mais da barra de HP** (nem bloqueia entrada). A virada do dia virou função pura
  (`computeDailyReset`) que o hook e o teste compartilham — antes o teste testava
  uma cópia e afirmava uma evolução automática que `MANUAL_EVOLUTION` impede.
  Depois vieram: onboarding perguntando o "porquê", relatório em modo acolhida,
  "esqueci de marcar", check-in de humor, traço de nascimento, ritmo de cuidado
  desempatando o galho, faixas e rodada semanal do Torneio, e a vitrine da
  jornada. Abertos só o modo cooperativo (precisa de backend novo) e a arte da
  decoração (não é código). Ver `docs/PLANO-EVOLUCAO.md`.
- **Palco do pet** (composição, 5 espaços, decoração) — pronto. Contrato de arte
  em `docs/PALCO-E-DECORACAO.md`. Falta só a arte de verdade (hoje são emoji).
- **Torneio** — **8** itens na aba, escada **8/12/15/20/25/40/55/70** Emblemas
  (`utils/shop.ts:359`, `TOURNAMENT_ITEMS`). A vitrine exibe os troféus de season
  realmente ganhos.
  > ⚠️ Corrigido em 26/08/2026: esta linha dizia "6 itens, escada
  > 15/20/25/40/55/70". Dois degraus baratos (8 e 12) foram acrescentados no
  > começo da escada e ninguém atualizou aqui. O `CLAUDE.md` já estava certo — o
  > registro vivo é que estava errado, que é o pior dos dois lugares para errar.
- **Compra dentro do jogo** — `UnlockAccountModal` nos dois momentos em que a
  falta é sentida (limite de criação do grátis; árvore de demonstração na página
  de Evolução), mais ritual do oráculo pós-compra que troca só a criatura.
- **Desktop (Electron)** — overlay é um controle remoto do app.
  Ver `docs/PLANO-DESKTOP-STEAM.md`.
  > ⚠️ **Correção de registro (ago/2026).** Esta linha dizia "overlay
  > **funcional**" e isso era falso desde sempre: `cloudSync.ts` mandava o `id`
  > no CORPO do `POST /api/save`, e `save.js` lia o id só da query — 400 em
  > 100% das chamadas, que o cliente traduzia para `reason: 'network'`. As três
  > únicas ações do overlay (carinho, comida, marcar tarefa) **nunca gravaram
  > nada**. Ou seja: ninguém jamais usou o overlay de ponta a ponta, e mesmo
  > assim ele estava registrado como pronto aqui e tem plano de Steam escrito.
  > Corrigido nos dois lados (cliente manda `?id=`, servidor aceita `body.id`
  > como fallback retrocompatível para as builds já instaladas), com teste
  > ligando o cliente no `onRequest` real — `desktop/renderer/src/pushCareAction.test.ts`.
  > A lição que fica não é o bug de 1 linha: é que o registro vivo afirmou
  > "funcional" sem nada nunca ter exercido o caminho.
  >
  > **Atualização de 26/08/2026 (fim do dia).** As **quatro** ações de cuidado do
  > overlay escrevem no save: carinho, comida, **banho** e **dormir/acordar**
  > (`86341fcb`). E o overlay **quase não reimplementa mais regra** — `care.ts`
  > importa `careUpdaters`, `careRules`, `careCaps`, `playerDay`, `restWindow` e
  > `poopDrain` do app. Sobrou uma cópia declarada (a derivação do `saveId`, sob
  > teste de paridade das três implementações) e uma dívida declarada: **banho é
  > a única transição que não é import**, porque não existe regra pura de banho
  > em `src/utils/` — ela mora no `App.tsx`, acoplada a estado de React. Em vez
  > de copiar, o teste **executa** `applyPoopDrain` sobre o resultado e exige que
  > ela pare de cobrar: quem julga limpeza continua sendo `poopDrain.ts`.
- **Separação do DigiApp** — inventário e ordem segura em
  `docs/SEPARACAO-DIGIAPP.md`. Limpeza de herança morta já feita.

---

## 3. Depende de você

Nada nesta seção pode ser feito por mim — precisa de conta, cartão, painel ou
decisão sua.

### 3.1 Segurança e direitos — urgente

| # | O quê | Por quê |
|---|---|---|
| ✅ | **Licença dos sprites DMC e uso dos nomes Digimon** — RESOLVIDO em 09/08/2026. Foi a opção (b): substituir por arte e nomenclatura originais. Saíram do repositório os 25 `*_dmc.png` (arte da Bandai, via `furudbat/wayland-vpets`) e os 49 `figma:asset/*` das linhas Tapirmon/Veemon/Salamon, junto com os itens de digievolução da loja, os Digimentais e o roster nominal da masmorra. `getSpriteForStage` responde sempre com arte de `src/assets/soulmon/`; save antigo cai num fallback determinístico que também usa arte nossa. Os nomes de franquia saíram até do prompt do gerador (`utils/oracle.ts`), com teste travando a ausência. Detalhes em `docs/Attributions.md`. |
| ✅ | ~~**Reroll por Créditos = resultado aleatório pago com dinheiro real**~~ — RESOLVIDO em 06/09/2026 (WP5.7). Deixou de ser sorteio: virou **Nova Leitura**, DETERMINÍSTICA sobre as 6 respostas do Oráculo (`src/utils/newReading.ts`, semente FNV-1a na ordem fixa de `ORACLE_QUESTIONS`). Não há `Math.random` no caminho, o botão fica desligado enquanto nenhuma resposta mudou, a regra é dita **antes** de cobrar e `public/termos.html` §5 foi reescrito nos dois idiomas. Com isso não é mais loot box sob a Lei 15.211/2025: o que se compra é uma releitura declarada, não uma chance. |
| 🟡 | ~~**Decidir sobre as keystores no histórico do git**~~ → **rebaixado de 🔴 para 🟡 pela análise de 26/08** (§1.4) | Os keystores são do **DigiApp**, não do Soulmon, e o DigiApp usa **Play App Signing** — a chave vazada é a de **upload**, e a rotação é um formulário de ~5 min no Play Console (Assinatura do app → *Solicitar troca da chave de upload*). **Nada a rotacionar do lado do Soulmon.** `git filter-repo` deixou de ser a opção óbvia: ele reescreve todos os commits, exige force push, quebra clones — **e não muda o risco**, porque quem já clonou já tem. O risco real é instalação lateral de um APK que o Android aceita como atualização do DigiApp; **não** é publicação na loja (isso exige credencial de conta, que nunca esteve no repo). |
| ✅ | ~~**Ligar o `FIREBASE_PROJECT_ID`**~~ — **feito em 07/09/2026** (`soulmon-app`), na ordem segura: `.env` → `npm run build` → `wrangler deploy` → só então a variável. Mora no `wrangler.jsonc`, não no painel, porque variável comum é substituída pelo arquivo a cada deploy. |

### 3.2 Lançamento

| # | O quê |
|---|---|
| 🔴 | Registrar o pacote no Firebase + baixar `google-services.json` |
| 🔴 | Criar os 4 produtos no Play Console (`soulmon.unlock.full`, 3 pacotes de crédito) |
| 🔴 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` |
| 🔴 | **`PLAY_REQUIRE_ACCOUNT_BINDING = true`** — depois de publicar o app que manda `setObfuscatedAccountId(saveId)`. É o que impede um recibo de virar N contas pagas (ver docs/BILLING-SETUP.md) |
| 🟠 | ~~Opcional:~~ banco **D1** vinculado como `DB` + tabela `order_claims`. ⚠️ **"Opcional" é otimista e a palavra sai.** Este é o conserto do **SEC-3**, que a §1.2 chama de *maior risco de dinheiro que sobrou*, e o `wrangler.jsonc` **não tem binding `d1_databases`** — conferido em `e8aef62a`. Enquanto não tiver, `env.DB` é `undefined`, `claimOrderAtomic` **nunca roda** e o resgate é read-then-write sem CAS sobre KV eventualmente consistente. ✅ **O que a squad já preparou:** `migrations/0001_order_claims.sql` e `0002_order_claims_expires_at.sql` (com o prazo em coluna, respondendo à pendência C). Falta **ligar** |
| 🔴 | URL da política de privacidade + formulário de Segurança de Dados |
| ✅ | ~~`VITE_FIREBASE_*`~~ — **feito em 07/09/2026**, no `.env` LOCAL (não no painel: são de BUILD, o Vite as inlina). Projeto `soulmon-app`. Chave conferida contra a API do Firebase, não só transcrita. |
| 🟠 | Conferir no painel do Cloudflare se já existe o projeto Pages `soulmon` — o `wrangler.jsonc` diz que sim. ⚠️ **A segunda metade desta linha era FALSA e saiu**: dizia que `capacitor.config.json` "ainda aponta o APK para `digiapp-a5e.pages.dev`". Conferido em `e8aef62a` — ele aponta para `https://soulmon.mateus-sprnd.workers.dev`, e as três fontes concordam (`capacitor.config.json`, `desktop/renderer/src/config.ts`, `desktop/electron/main.js`). É a **mesma mentira** que o `CLAUDE.md` e o `docs/PLANO-DESKTOP-STEAM.md` carregaram até 26/08 e que faria um agente decidir errado sobre deploy |
| 🐛 | 🆕 **Comentário mentiroso encontrado e NÃO consertado** (é `src/`, fora do escopo desta frente): `desktop/renderer/src/config.ts:3` diz *"A URL ainda aponta pro Pages herdado do DigiApp"* — **a linha logo abaixo é `soulmon.mateus-sprnd.workers.dev`**. É o mesmo dano de sempre: comentário que descreve um estado anterior e não fica vermelho. Conserto de 1 linha, para quem tocar `desktop/renderer/` |
| ✅ | ~~Endereço de contato do VAPID~~ — **resolvido em 07/09/2026**: o dono escolheu `mateus.sprnd@gmail.com`. É endereço de CONTATO (RFC 8292 `sub`), para onde o serviço de push escreve em caso de falha de entrega; nunca aparece para o usuário e trocá-lo não invalida subscription nenhuma. Substituir por um endereço do domínio do Soulmon quando ele existir. ⚠️ **Só vale na borda depois de um `wrangler deploy` dentro de `workers/`** — aquele worker não builda no push da `main`. |
| 🟠 | **Decidir se a Fase 4 (sensores via Health Connect) vale o custo** — só o dono pode: exige **conta de organização verificada** no Play (enforcement jan/2026; conta pessoal é bloqueador), declaração de health app, política de privacidade dedicada e consentimento LGPD art. 11 específico por finalidade, além de APK novo. A Fase 3 (Janela de Descanso + Sonhos) já roda **sem sensor nenhum**, igual na PWA e no APK — a Fase 4 é opt-in, só Android, e o plano só a previa **se** a Fase 3 provar que move retenção. Caminho técnico, se aprovada: `@capgo/capacitor-health` (único plugin Capacitor vivo em 2026 que expõe sono). **Google Fit está morrendo (APIs até o fim de 2026) — nada deve ser escrito contra ele.** |
| 🟡 | `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` no Pages (fingerprint sai do Play Console → Integridade do app) |
| 🟠 | 🆕 **Gerar um APK novo** — três pacotes estão prontos no repo e SÓ passam a valer no aparelho com um build novo do Android: **WP0.6** (`setObfuscatedAccountId`, que amarra a compra do Play ao save), **WP5.8** (preço localizado vindo do próprio Play, em vez do rótulo fixo em BRL — hoje quem está fora do Brasil vê um número errado na tela de compra) e **WP2.6** (o widget passa a mostrar constância, escudos e a oferta dos 5 minutos). O `android-build.yml` builda no push; o artefato fica em `github.com/HexerVoodoom/Soulmon/actions/runs/<id>`. ⚠️ **Só depois desse APK publicado** ligue `PLAY_REQUIRE_ACCOUNT_BINDING=true` — antes disso ele recusaria toda compra (é a linha abaixo, que continua valendo). |
| 🟡 | 🆕 **`SEASON_ADMIN_KEY` como secret do worker de push** (`wrangler secret put SEASON_ADMIN_KEY` dentro de `workers/`, com o MESMO valor que está no Pages) — a partir do WP4.18 o cron das 10h BRT do dia 1 fecha a season do Torneio e entrega os troféus 🥇🥈🥉. Sem o secret (ou sem `APP_URL`, que já vai versionado em `wrangler.toml`) o fechamento é **pulado com log**, nunca tentado às cegas — e os troféus voltam a depender de você lembrar. Exige um `wrangler deploy` dentro de `workers/`: aquele worker **não** builda no push da `main`. |
| 🟡 | **`METRICS_ADMIN_KEY` no Pages** — a rota de leitura das métricas (`functions/api/metrics.js`) é **fail-closed**: sem o secret ela responde **404**, não 401, de propósito (401 confirmaria que o endpoint existe). Ou seja: a métrica-norte está instrumentada e agregada, mas **você não consegue ler nada até definir esse segredo**. |

### 3.3 Steam

| # | O quê |
|---|---|
| 🔴 | Conta Steamworks + US$ 100 |
| 🔴 | **App ID e Depot ID** (bloqueiam o cliente Steam) |
| 🟠 | Arte da loja |
| 🟠 | Subir build a partir de uma máquina Windows. ✅ **O empacotamento em si deixou de ser incógnita** — `npm run dist:steam` rodou em 26/08/2026, EXIT=0, 274 MB (`desktop/STEAM.md`). O que falta é o `steamcmd` com o seu login de parceiro |
| 🟠 | **Ligar o Modo de Desenvolvedor do Windows** (Configurações → Privacidade e segurança → Para desenvolvedores). É **pendência de MÁQUINA, não de projeto**: o pacote `winCodeSign` do electron-builder traz dois symlinks de macOS (`libcrypto.dylib`, `libssl.dylib`) que não servem para nada num build `--win`, e criar symlink no Windows exige o Modo de Desenvolvedor. Sem ele o build inteiro morre por causa de dois arquivos irrelevantes, **depois** de já ter gerado o `.exe`. Contornado uma vez pré-extraindo o `.7z` à mão; a saída limpa é sua, porque mexe em configuração do sistema |
| 🟠 | **Preencher `author` em `desktop/package.json`.** Hoje o electron-builder avisa `author is missed`. No `--dir` é só aviso, mas o `nsis` do `npm run dist` usa o `author` como **Publisher do instalador** — é o nome que aparece no aviso do Windows e nas propriedades do `.exe`. Não preenchi porque é **identidade, não código** |
| 🟡 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID`. ⚠️ **"o SEC-4 já está corrigido" é forte demais** — a §1.2 o marca **parcial**, e a metade que falta é uma variável: `PLAY_REQUIRE_ACCOUNT_BINDING` continua não ligada, e `isPlayPurchaseBoundTo` lê `env.PLAY_REQUIRE_ACCOUNT_BINDING !== 'true'`, ou seja **sem a variável a compra sem vínculo é aceita**. O que está corrigido é o oráculo de enumeração do `orderid`. O cliente Steam ainda precisa mandar o session ticket junto do `orderId` |

### 3.4 Ordem que evita ficar fora do ar

1. Projeto Pages novo + KV novo + variáveis → conferir pela URL `*.pages.dev` do
   projeto novo, sem mexer no que está no ar.
2. Publicar o domínio próprio.
3. Só então atualizar `capacitor.config.json`, gerar APK novo e publicar.
4. Por último, aposentar o Pages antigo.

Fazer na ordem inversa (mexer no `server.url` antes de o destino existir) quebra
o app de todo mundo que já tem o APK instalado.

---

## 4. Dívidas conhecidas (aceitas por ora)

- **Emblemas ficam no save do cliente**, como os Bits — farmáveis por quem editar
  o `localStorage`. Aceitável **enquanto a aba Torneio vender só cosmético**. Há
  teste travando isso: se algum item de torneio virar vantagem de jogo, o teste
  cai, e a resposta certa é mover Emblemas para o servidor, não afrouxar o teste.
- **Validade ilegível vira "nunca expira" na ponte de login do desktop.**
  `auth-preload.js` faz `Number(payload.expiresAt) || 0`, e `main.js` lê `exp: 0`
  como sessão sem prazo (o guard só roda `if (authSession.exp && …)`). Ou seja:
  um payload com validade ausente, `NaN` ou `null` produz um token que o overlay
  nunca considera vencido. **Documentado e NÃO consertado de propósito**:
  escolher o comportamento certo (recusar? tratar como já vencido? pedir
  renovação?) é decisão, não limpeza — e o caminho ainda não roda em produção
  (§3d de `docs/PLANO-DESKTOP-STEAM.md`). Travado por teste em
  `desktop/renderer/src/authBridge.test.ts`, que documenta o ponto cego em vez
  de mascará-lo.
- **Corrida no `spendCredits`** (read-modify-write) — limitada a cobrar a menos
  do jogador, nunca a cunhar crédito. Cai junto se o SEC-3 migrar o módulo para
  Durable Objects.
- ~~**Arte da decoração são emoji.**~~ **FEITO** (ago/2026): 33 peças com PNG de
  verdade em `src/assets/decor/` + `utils/decorArt.ts`, e 8 cenários PINTADOS
  em `utils/backgrounds.ts`. Ver `docs/PALCO-E-DECORACAO.md`.
- **Duas cenas geradas ficaram sem casa**: `evolution-ritual` e `evolution-ultra`
  (1080×1920, em `_gemini_out/backgrounds/`, fora do repo). A `EvolutionCeremony`
  já tem um fundo em VÍDEO animado; trocá-lo por PNG estático seria piorar.
  Entram no dia em que a cerimônia ganhar variação por galho — aí a arte já
  existe.
- **O palco fica largo demais no desktop.** A caixa do visor acompanha a largura
  da página (≈1500px numa tela de 1920), enquanto os cinco espaços de decoração
  têm tamanho FIXO em px e posição em % — o resultado é um sofá de 56px a 16% de
  uma caixa de 1500. É anterior a este trabalho e afeta todos os cenários, mas a
  arte pintada tornou o efeito visível. A correção provável é limitar a largura
  do `.sm2-device-stage` à proporção da arte (250 × 1,85 ≈ 462px); é mudança de
  layout na tela principal, então fica para o dono decidir.
- **Cura instantânea por Créditos** é, na prática, pagar para pular o cuidado — a
  mesma crítica que Kotaku e Digital Trends fizeram ao Premium Pass do Pokémon
  Sleep. Sugestão em `docs/PLANO-EVOLUCAO.md`: reposicionar como perdão pontual
  com teto. É decisão de produto, não técnica.
- ~~**Sprite do cocô** é um blob escuro pouco legível.~~ **FEITO** (ago/2026):
  redesenhado na paleta do kit, legível em 32px.
- ~~**Os 30 slots do Dex de Sonhos são emoji do sistema.**~~ **FEITO**
  (ago/2026): 30 sprites nossos em `src/assets/soulmon/dreams/` +
  `utils/dreamArt.ts`. Era a ÚNICA coleção do jogo e a única sem arte própria.
  O `emoji` continua no `DREAM_CATALOG` de propósito — é o único glifo que cabe
  num push, onde não existe `<img>`.
- ~~**Consumíveis e FX eram emoji do sistema.**~~ **FEITO** (ago/2026): 25
  sprites novos — 8 comidas + 5 itens especiais (`utils/itemArt.ts`, chave =
  EMOJI porque `foodInventory` indexa o save assim; trocar a chave quebraria
  save, trocar só a arte não quebra nada) e 6 FX de batalha + 6 partículas de
  cuidado (`utils/fxArt.ts`, chave = o `icon` dos popups). Todo render cai no
  emoji quando não há arte — item novo nunca quebra, só nasce sem sprite.
  Lista e prompts em `D:\Soulmon\prompts\consumiveis-fx-list.md`. O que foi
  deliberadamente NÃO gerado: moeda para Bits (regra: Bits nunca têm ícone) e
  `CATEGORY_EMOJIS` (lado SVG da fronteira do Visor).
- **Quatro itens do `BACKLOG-ARTE-GERAR.md` foram declarados OBSOLETOS**
  (`A3`, `A10`, `A15`, `A16`): foram escritos antes do `PLANO-DESIGN` e pedem
  pixel art em superfícies que o §1 dele põe do lado SVG (fronteira do Visor).
  Gerá-los pagaria uma dívida que deixou de existir e criaria outra.

---

## 5. O achado estrutural do loop de QA (ago/2026)

Três rodadas de auditoria acharam 5 defeitos reais, e **nenhum era erro de
lógica**. Todos eram **fronteiras sem dono** — um lado supondo algo do outro,
com nada forçando o encontro:

| defeito | fronteira |
|---|---|
| Checkbox de 2px (`w-7`/`h-7` inexistentes) | JSX ↔ CSS pré-compilado |
| Overlay que nunca gravou (id no corpo vs. query) | cliente desktop ↔ handler HTTP |
| `save.js` sem nenhum teste | código ↔ medidor de cobertura |
| Xadrez assado em `nest-base.png` e `icon-reset.png` | asset ↔ renderer |
| Página HTML salva como `.png` | download ↔ árvore de assets |

O diagnóstico em uma frase: **a suíte media intenção, não efeito.** A prova
mecânica cabia numa linha — `vitest.config.ts` fixava `environment: 'node'`, e
**não existia um único teste que montasse um componente**. O checkbox de 2px não
"escapou" da suíte: ela era estruturalmente incapaz de vê-lo. O motivo de nunca
ter existido teste de componente também não era preguiça — os aliases
`figma:asset/*` só existiam no `vite.config.ts`, então **nenhum componente era
importável em teste**.

**O que passou a existir, e é isto que precisa ser mantido:**

- `src/test/renderEnv.tsx` — monta componente com o `index.css` REAL e mede
  estilo computado. `renderEnv.selfcheck.test.tsx` prova que o instrumento
  enxerga: `w-7`/`h-7` computam `width: auto`, `w-11` não.
- `src/index.css.contract.test.ts` — classe usada no JSX que não existe no CSS.
  ⚠️ **Variante nova precisa ser escrita aninhada (`&:hover`)**; a forma plana
  passa despercebida pelo guard.
- `src/assets/assets.contract.test.ts` — xadrez assado, arquivo não
  decodificável, pixel fora da paleta. Tem quarentena com regra de honestidade
  (o defeito precisa continuar existindo **e** o arquivo não pode estar
  importado) para a lista não virar cemitério.
- `desktop/renderer/src/pushCareAction.test.ts` — **o modelo a replicar**: liga
  o cliente no `onRequest` real, não num mock que devolve 200.

**Regra que sai disso:** todo guard novo precisa de **casos de
autoverificação** que provem que ele enxerga. Sem isso, um guard passa sempre —
pelo motivo errado. Aconteceu duas vezes nesta rodada: o guard de CSS nasceu com
13 falsos positivos (lia `,` e `:` como parte do nome da classe, e por isso
acusou `flex-shrink-0`, que nunca esteve quebrado), e uma limpeza de magenta se
declarou completa usando um critério mais frouxo que o do próprio teste.

**Previsão registrada** (`product/soulmon-01/sweeper/skeptic-review.md`): os
próximos defeitos reais serão fronteiras sem dono, não lógica em `utils/`. A
aposta nº 1 era o **APK**.

### ✅ A previsão se confirmou no primeiro APK — e em minutos

O dono instalou o artefato do CI logo depois deste deploy. Nome certo, ícone
certo, `appId` certo (`com.hexervoodoom.soulmon`) — e **abriu o DigiApp**.

Causa: o APK **não embarca o app**, carrega uma URL remota, e
`capacitor.config.json > server.url` apontava para `digiapp-a5e.pages.dev`, o
projeto Pages do repositório antigo. A mesma URL estava em mais **três**
arquivos, incluindo os dois do desktop — ou seja, **o overlay Electron lia o
save do outro projeto**. Quatro arquivos, uma verdade, e nada que os obrigasse
a concordar.

Nenhum dos 653 testes olhava para isso: cobriam o app rodando, não onde a casca
vai buscá-lo. Fronteira sem dono, exatamente a assinatura das outras cinco.

**Corrigido** para `https://soulmon.mateus-sprnd.workers.dev`, depois de
verificar no ar que o destino serve o Soulmon com o build atual
(`index-C_r_Y4yT.js`), que `/api/save` valida (400 em id inválido), que o KV
responde, que `/api/community` já devolve `pid` derivado (SEC-2 valendo) e que
o header de CSP é o novo. Era a condição que o `CLAUDE.md` exigia para
autorizar a troca.

**Travado por `src/deploy/appUrl.contract.test.ts`**, que exige as quatro
fontes concordando, proíbe endereço de outro produto, e confere que a config
gerada por `npx cap sync` não ficou para trás da raiz — o caso em que alguém
edita a raiz, esquece o sync e o build passa mesmo assim. Verificado nas duas
pontas: vermelho com a URL antiga, verde com a nova.

**Ainda é preciso um APK novo.** O APK já instalado tem a URL velha assada
dentro dele e continuará abrindo o DigiApp até ser substituído pelo build do
próximo run do CI. ✅ Confirmado pelo dono em aparelho real: o APK novo abre o
Soulmon.

### Rodada 4 — a correção virou a fronteira nova

`product/soulmon-01/sweeper/round4-audit.md`. Três defeitos, **dois deles no
código que as rodadas 1–3 acabaram de escrever**, e ambos do mesmo subtipo:
**fix aplicado por ARQUIVO em vez de por REGRA**.

| sev | defeito | fronteira |
|---|---|---|
| 🔴 | A página de Evolução previa o galho com `completedTasks + activityLog`; a cerimônia decidia só com `completedTasks`. Quem cumpre hábito por atividade recorrente via "Harmonia" e evoluía para "Vírus" — e evolução não se desfaz pela via normal | `App.tsx:2173` ↔ `App.tsx:924`, duas chamadas da mesma regra, uma atualizada |
| 🟠 | Adotar save da nuvem gravava `SAVE_ID` **antes** de `GAME_STATE`, com `setItem` cru. Storage cheio = identidade trocada sem o dado, sem reload e sem aviso; o cloud save seguinte subia o estado local antigo por cima do save do outro aparelho | os 4 call sites que substituem o save inteiro ↔ o `safeStorage` da rodada 3, que parou no provider |
| 🟠 | O teto por IP rodava **antes** do cache de borda: acerto de cache custa ~zero KV e mesmo assim gastava uma das 20 varreduras/min. Sob CGNAT/escola, 30 jogadores reais num IP levavam 429 na resposta mais barata da rota | teto de custo ↔ cache, em `community.js` |

Corrigidos, com regressão travada e **verificação nas duas pontas**
(`careHistory.contract.test.ts`, `adoptCloudSave.test.ts`, `costCeiling.test.js`).
Suíte: 662 → **685 testes**, 0 falhas.

**Fechado com número:** o crescimento do `localStorage` **não é risco** —
`completedTasks` (a única estrutura sem teto) custa ~190 kB/ano para um usuário
de 4 tarefas/dia, contra ~5 MB de cota. Mais de uma década.

**Continuam ABERTOS:** last-write-wins do cloud save entre dois aparelhos
(recomendação registrada no §6 do relatório: `savedAt` + 409 no `save.js`),
"usuário com SW antigo recebe deploy novo", e a deriva `workers/` ↔ `functions/`.

### Rodada 6 — fuzzing: a fixture que certificava uma tela branca

`product/soulmon-01/sweeper/round6-fuzz.md`. Instrumento: **teste de propriedade
sobre estado de save hostil**, e o consumidor REAL do estado em vez de um espião.

| sev | defeito | situação |
|---|---|---|
| 🔴 | Todo save que não traz `activities` (ou traz `tasks` não-array etc.) é **tela branca permanente**: `hydrateSave` só fazia `?? padrão` — não cobria `activities`/`healthPoints`/`totalXP`/atributos e não garantia TIPO nenhum. A virada do dia, que roda no mount, lançava dentro do updater. Alcançável por `adoptCloudSave`, que grava qualquer objeto simples vindo de `/api/save` | **corrigido** (`arr()`/`num()` em `hydrateSave`) |
| 🟠 | `resolveBranch` devolvia **`undefined`** (fora do próprio tipo) quando um atributo era não-finito: `Math.max` → `NaN` → lista de líderes vazia. Galho previsto indefinido na página de Evolução e `currentBranch: undefined` no save | **corrigido** (`carePattern.ts`) |
| 🟠 | **Em rookie, degenerar é ganho puro**: HP volta cheio *e* `perfectDays` é SETADO em 2 (de 4). Quem abandona o pet 3 dias progride mais que quem cumpre a rotina. Contraria "perfectDays só acumulam" | **ABERTO — decisão do dono.** Travado por teste existente que diz "for free". Fix de 3 linhas no §4 do relatório, não afrouxa nada |

**Achado sobre o aparato:** `GameStateContext.hostile.test.tsx` (rodada 2) monta
um espião que só serializa o estado — **nunca monta `useDailyReset`**. A fixture
dele, `{ perfectDays: 10 }`, passava há três rodadas certificando exatamente o
🔴 acima. É o segundo guard cego em duas rodadas (o primeiro foi
`cloudSync.test.ts`, rodada 5). Suíte: 766 → **829 testes**, 0 falhas.

**Próximo instrumento proposto: mutation testing** — o único que mede o
*detector* em vez do *detectado*, e o único que teria pego os três guards cegos
(este, o da rodada 5 e o `simulateReset` do footgun 9) de uma vez.

### Rodadas 7 e 8 — mutation testing: medindo o detector

`product/soulmon-01/sweeper/round7-mutation.md` e `round8-save-content.md`.
Instrumento: **`scripts/mutation-sweep.mjs`** (versionado, sem dependência
nova). Aplica uma mutação mecânica numa linha de produção, roda a suíte e
reverte; mutante que não deixou nada vermelho **sobreviveu** — ali o teste é
cego, ou a mutação é equivalente.

**Rodada 7** mediu **51% de sobrevivência** em 720 mutantes e corrigiu 36 —
entre eles um teste chamado *"devolve meio coração na virada de segunda"* que
não afirmava nada sobre meio coração (a expectativa era calculada com a própria
constante auditada), `AD_REWARD_CREDITS` na mesma armadilha (**dinheiro real**),
`amount <= 0` recusando gastar 1 crédito, e compra estornada nunca marcada
(debitada de novo a cada leitura de saldo, para sempre). Suíte: 829 → **863**.

**Rodada 8** atacou os dois arquivos que leem/gravam o save do jogador, onde um
defeito não dá erro — devolve um jogador **plausível e errado**:

| arquivo | antes | **depois** | sobreviventes cegos |
|---|---:|---:|---:|
| `src/contexts/GameStateContext.tsx` | 22,6 % | **83,3 %** | **0** (14 equivalentes) |
| `desktop/renderer/src/cloudSync.ts` | 27,4 % | **91,1 %** | **0** (12 equivalentes) |

A causa era uma só, e vale como regra: **carregar não é conter, montar não é
afirmar.** Os testes existentes perguntavam *"é array? é número finito? o app
sobreviveu?"* — nenhum perguntava **qual número**. Sobreviviam todos os padrões
da hidratação (um Crédito de graça por save, PvP ligado sem opt-in, pet
degenerado ressuscitando ao recarregar) e o arquivo inteiro do overlay
(`401` virando "sem conexão", `{ok:false}` virando `{ok:true}` em 8 lugares,
save sem HP mostrando **pet morto**). Suíte: 863 → **981 testes**. Nenhuma linha
de produção alterada; nenhum teste afrouxado.

**Onde o loop continua:** `functions/api/_billing.js` (40%, e é dinheiro:
compra PENDENTE pode virar válida) — o instrumento certo ali **não é mais
mutação**, é um fake do endpoint da loja no molde de `pushCareAction.test.ts`;
depois `carePattern.ts` (51%, tabela de limiares sem teste de limiar) e
`save.js` (63,9%).

### 🔴 ABERTO — `minSdkVersion = 24` é uma promessa que o app não cumpre

Descoberto porque o smoke do APK falhou e o diagnóstico mostrou
`WebViewFactory: Loading com.google.android.webview version 83.0.4103.106`.
A imagem do emulador da API 30 traz WebView 83 (Chromium de meados de 2020).
Nele o Capacitor registrou os plugins, carregou a URL certa e logou
"App started" — e o JS morreu no parse. Tela em branco, ponte nunca chamada.

**O smoke não estava com defeito: ele reproduziu um usuário real de WebView
velho.** O CI passou para API 35 para deixar de testar isso por acidente, mas o
problema de produto continua:

| recurso | usos | exige |
|---|---|---|
| `oklch()` | 87 | Chromium 111+ |
| `color-mix()` | 97 | Chromium 111+ |
| aninhamento `&:hover` | 18 | Chromium 112+ |
| `vite.config.ts` `build.target` | `'esnext'` | sem transpilação nenhuma |

`android/variables.gradle` declara `minSdkVersion = 24` (Android 7.0). Quem
instalar num aparelho com WebView desatualizado — Android 7/8/9 que não
atualiza, ROM sem Play Store, aparelho corporativo travado — **instala e vê
tela branca**, sem mensagem nenhuma. A Play Store usa o `minSdk` para decidir
quem pode instalar, então hoje ela oferece o app para gente que não consegue
usá-lo.

Três saídas, e a escolha é do dono porque muda alcance de loja:

1. **Subir o `minSdk`** para ~30 e aceitar perder aparelhos antigos. Não resolve
   sozinho: o WebView é atualizável independentemente da versão do Android, então
   um Android 11 com WebView velho continua quebrando.
2. **Tela de aviso por detecção de recurso** — um `CSS.supports('color','oklch(0 0 0)')`
   no `index.html`, antes do bundle, mostrando "seu navegador do sistema está
   desatualizado, atualize o Android System WebView" em vez de tela branca.
   É a única que cobre o caso real (WebView velho em Android novo). ⚠️ Mexe nos
   scripts inline e portanto nos hashes da CSP — `src/security/csp.test.ts`
   recalcula e vai acusar se esquecerem.
3. **Transpilar de verdade**: `build.target` para algo como `chrome87` e trocar
   `oklch`/`color-mix`/aninhamento por equivalentes. Recupera o alcance completo,
   e é de longe a mais cara — a paleta inteira está em `oklch`.

Recomendação: **(2) agora** (barata, honesta com o usuário) e (1) junto, com o
`minSdk` refletindo o que o app realmente aguenta. (3) só se houver dado de que
o público de aparelho antigo importa.
