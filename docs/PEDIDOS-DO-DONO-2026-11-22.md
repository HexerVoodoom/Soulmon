# Pedidos do dono — 22/11/2026 (Registro de Demanda)

Fontes: `soulmon_especificacao_claude.md` (spec, itens 1–30) e `BACKLOG-SOULMON.md` (BL1–BL7), ambos na Área de Trabalho do dono.
Mapas código×spec (só leitura): scratchpad da sessão `mapa-spec-1/2/3.md`.

## Decisões do dono em modal (22/11/2026)

| Item | Decisão |
|---|---|
| 2.1c limite de atividades | Mantém no demo, remove na conta paga/beta (§376/§385 preservados para o demo) |
| 10.1 giros da Arena | 3 grátis por HORA e 3 por energia para todos (revoga §180 e a vantagem 5/7 do §458) |
| 10.2 temporada da Arena | Temporada própria da Arena, mensal alinhada ao mês (UTC). A 1ª vai de agora ao fim de novembro; depois Arena, Torneio e rankings viram juntos no dia 1. Escada volta ao nível 1 (0). Ranking/prêmios/histórico intocados |
| 6 Missões | Mercado NÃO tem missão diária, só semanal. Diárias ficam como estão |
| 26 Pesadelo | Vale a decisão de 16/11: cura não invoca companheiro; o `dot` do pet vira ataque extra logo após o do jogador; buff mantém. Inimigos já só usam `direct` (falta teste) |
| 12 Clan War | Cartinha no Mensageiro (sem push, `guild.semPush` mantido) + "Assistir" reproduz o combate pela semente; resultado não muda |
| 9.3 portal do Rift | Só visual no mapa; numeração, recorde e ranking intactos |
| 13 Grove | É o Bosque do Clã. Bug: a Soulmon da jogadora **Maslin** aparece rookie no Bosque mas já é ultimate (bug de exibição/estado) |
| 24.4 texto dos elementos | Squad-narrativa redige os 20 textos (PT/EN) a partir da bíblia + descritores do Oráculo; dono aprova |
| 17 favoritos de poção | Só no aparelho (localStorage) |
| 3.1b/3.2 captura rápida | Exemplo por categoria; a dica de sintaxe sai (parse segue funcionando) |
| 9.1 "From Yesterday's Adventure" | Remover em TODOS os lugares (revoga §66) |
| 7.1 Power Reducer | Chips que tiram 6 pontos de um caminho (Poder/Harmonia/Benevolência). Não afeta tarefas nem progresso de evolução; só ajusta, de forma limitada, qual caminho evolui. Não viola G-01 |
| BL3 Jornal | É o Caderno (`CadernoSheet`) |
| 25.1 slots do Evolution Center | Reabrir H1/D-E3 "O Visor" e substituir por asset por slot (squad-design antes) |
| 22 Mind Workshop | Cards de minigame NÃO precisam de botão Play (item sai) |
| 23 Bond | "Informações circulares" = anéis ao redor do sprite das formas no ramo de evolução (Evolution Center). Rhythm vai para o Profile; ficam Talent Tree e The Journey |
| 15.5/15.4b números | Squad propõe percentuais e teto de baú; dono aprova antes do merge |

### Rodada 2 (após o diagnóstico P0)

| Item | Decisão |
|---|---|
| 1 balão dourado | Bug percebido: às vezes aparece e some em ~1 s ao entrar na Home. Corrigir esse sumiço precoce |
| 9.3a ranking do Rift | Visual e posição do botão: padronizar com os outros modais de ranking. Match-3: o ranking abre direto na modalidade clicada (PvE ou PvP), sem botão interno para trocar |
| 13 Maslin | Autorizada leitura (só leitura) de `profile:`/`coopMem:` dela em produção. Sem arte no estágio atual: mostrar a última arte já alcançada, nunca o rookie por padrão |
| 15.4 baús | Aviso "teto do dia atingido" + squad propõe novos tetos para aprovação |
| 21 Priorities | Dono não lembra o caso: mensagem própria do passo + teste dos dois casos |

### Rodada 3 (operação)

- Disco: node_modules reais de 21 worktrees parados apagados e worktree `qa-r4-fix` removido (consulta às sessões ativas antes). Worktrees novos vão para `E:\Soulmon-wt\`.
- P6: acesso ao ChatGPT liberado de novo; salvar downloads direto em `E:\Soulmon-assets\<lote>`.
- §316c REVOGADO: botões padrão de modal (sm2Button) ganham arte própria.

### Rodada 4

- Categoria nova **Focus & Work / Foco e Trabalho**: junta o Focus atual e o trabalho. Learning continua separada. O id antigo é aceito na leitura, com migração idempotente.
- PR #1093 mergeado (`12a33a164`) pela orquestradora, com autorização do dono. O #1024 é mergeado quando o CI ficar todo verde.

### Rodada 5 (23/11/2026)

- **Termos vetados afrouxados** (confirmado pelo dono em modal): *"pode usar Morte SEMPRE. não precisa ter esses pudores assim, é pra +18. não vamos falar em coisas muito sensíveis como suicídio e abuso sexual, mas isso nem faz parte do contexto, então pode afrouxar essas regras aí de termos vetados."* Vetados só: suicídio, automutilação e abuso sexual. Vale para textos e prompts de arte. Bíblia atualizada (`NARRATIVA-E-UNIVERSO` §5.12, §12, §17 item 11).
- **Modais da Home que não recolhem:** o pedido era SÓ sobre a Mochila/pasta (Arquivos), PR #1127. Fenda, Ver tudo e intersticiais ficam como estão.
- **4 elementos combinados novos:** fantasma = morte+vida+tempo, morto-vivo = morte+vida+vileza, sangue = vida+vileza+água, fúria = fogo+vigor+vileza; receitas aprovadas, rookies no pool comum e regravação de 2 hashes aceitas (PR #1129). Texto próprio deles aguarda decisão do dono; descrições com arcanas valem só para os 20 base.
- **Fonte dos 20 textos:** `docs/REFERENCIA-ARCANAS-PERSONA3.md` (só o texto descritivo entra).
- **Item Cristal Fundador / Founder Crystal** (decorativo, `furn-cristal-fundador`): aprovado pelo dono, em qualquer cenário (`fits: any`), nunca à venda, sempre aceso (modo `sempre` em `decorLuz.ts`: nunca escurece nem apaga com o pet dormindo; halo turquesa depois do véu da noite) e com fogo turquesa animado em tira de 5 quadros. Código, arte final (168 e folha 5×168) e testes entram no PR `feat/cristal-fundador`. **Pendente:** a entrega por progressão (Fundo/Moldura/Retrato/Cristal) aguarda decisões do dono; hoje o item só existe para quem o receber por concessão futura.
- **Dívida do dist paga** (#1125, #1128, #1131): folga de JS ~71 KB; partir o corpo do `App.tsx` fica no REGISTRO §499.
- **Hexsmith: custo em poções 3 → 1** (pedido do dono, 23/11/2026): só o HEX de elemento (garra etc.); coroa/luvas, Bits e fragmentos não mudam; peças já forjadas não mudam. REGISTRO §502.
- **Descritores dos 4 elementos novos limpos** (dono, modal, 23/11/2026): elemento puro, sem folha/gema/coração de luz/coroa de osso herdados; root do Hemolisk = Tarrasque bebê (só o rookie). REGISTRO §505.
- **Conjunto Founder, PR 1 (infra)** (decisão do dono, 23/11/2026): 4 prêmios — Fundo, Moldura, Retrato e Cristal Fundador — por **dias acumulados com ≥1 tarefa concluída** (não consecutivos): 1 dia = Fundo, 2 = Moldura, 3 = Retrato, 5 = Cristal. Sai o marco de Champion e a "1ª tarefa". Vale para todos; **quem já tem conta recebe os 4 de uma vez na primeira carga** (idempotente); contas novas progridem pelos dias; sem backfill por histórico. **Concedente dev** só para o e-mail do dono (rota `fundadorGrant` + botão no Painel de GM). REGISTRO §509. O aviso/popup de prêmio na UI fica para o PR 2.

## Pacotes

| Pacote | Itens | Modelo executor |
|---|---|---|
| P0 Diagnóstico | 1 balão, 9.3a ranking Rift, 10.1a Draw Again, 11 Torneio lento, 13 Maslin no Bosque, 15.4a baús, 21 Priorities, 25.2b forma equipada na geração | Sonnet (investigação, causa raiz antes de corrigir) |
| P1 Backlog pendente | BL1 PR #1093 (conflito + CI), BL5 menores, PR #1024 molduras + BL4/27.2 margens | Sonnet |
| P2 Home e produtividade | 2, 3, 4, 5, BL3 Caderno | Sonnet |
| P3 Mercado, jogos, exploração | 6 semanais, 7.2, 7.3, 7.4 (copy/hierarquia), 8 ordem, 9.1, 9.3 | Sonnet |
| P4 Combate | 10.1, 10.2, 26, 12 | Sonnet (paridade cliente/servidor) |
| P5 Progressão e coleção | 15.2, 15.3, 15.5, 16.2, 17, 19, 20, 23, 24 | Sonnet |
| P6 Arte | ícones de categoria, Habit×Task, chips Power Reducer, Exchanger, cards de Games, Rift (camada/portal/botões), Draw Again, luvas da Hacksmith, cards do Bosque, slots do Evolution Center, BL2b | squad-design revisa → ChatGPT (Haiku dirige a GUI) |
| P7 Design System | 27.x auditoria + Design Guide documentado | Sonnet |

Adiados: 9.2 Dungeon, 14 Clan Hall, 22 botão Play. Já feitos: BL2a (#1092), 15.1 arte dos cenários, 18 falas aprovadas.

Regras de execução: dúvida só em modal; branch/worktree por pacote no D: com junction para `D:\nm-cache\node_modules`; merge só com todos os checks verdes; PT/EN; compat de save; módulo novo entra em `docs/manual/06-REFERENCIA`.

## Rodada 5 — Popups centrais (pedido do dono, 23/11/2026)

Palavras do dono: "Modal de pop up tá bem ruim. Precisa ter altura mínima maior, mais margem interna para respiro e borda própria, com menos folha, mais tecnológica, mais cristal, mais minimalista, mas bordas arredondadas. Precisa de margem externa também."

**Inventário** (`ModalSheet placement="center"`, moldura `MOLDURA_HOME_DIALOGOS`): App (inline), AppUpdateGate, BonusTaskIntroModal, DailyReportModal (3), DayGoalsModal, DungeonPotionsModal, DungeonReturnModal ("Back from the Rift"), EvolutionStatsModal, MailboxSheet (2), Match3Game, PlayReviewModal, WakeToEnter, CatalogOnboardingFlow (2), ArenaCuraModal, FeiraEventoSheet, FeiraLojaSheet, ArcadeModal, TicketBuyModal, BlockedActionModal; mais `RitualDialog` (`RitualKit`, mesma moldura).

- Etapa 2 (feita, só layout): altura mínima `min(70u, 80dvh)`, respiro interno = `--sm2-moldura-pad-t/x/b` + folga (texto não encosta na placa nem no botão), margem externa 16 → 24 px.
- Etapa 3 (feita): moldura `cristal` (9-slice slice 225 + placa de bronze em 3 partes), aprovada pelo dono em 23/11; `ModalSheet placement=center` usa `ModalFrame variante="cristal"`. `RitualDialog` (RitualKit) segue na moldura padrão.

**Rodada 5 (cont.) — popup com título inline (teste A/B, 23/11):** `ModalSheet titulo="inline"` (padrão segue `placa`): sem placa de bronze; ✕ redondo (44 px, fio de cobre) no canto superior DIREITO e o título logo abaixo, dentro do modal, até 2 linhas, sem truncar. Aplicado nos popups pequenos de resultado/aviso: `DungeonPotionsModal`, `DungeonReturnModal`, `BlockedActionModal`, `ArenaCuraModal`. Os demais popups e os modais de prédio/sheets ficam na placa. Exceção ao contrato "fechar à esquerda" só para esta variante (com `onBack` volta à placa). Comparação lado a lado: `D:\Soulmon\comparacao-popup-placa-vs-inline.jpg`.

**Rodada 5 (ajuste, 23/11):** popups `titulo="inline"`: o ✕ perde o círculo (só o glifo, cobre, área de toque 44 px); `DungeonPotionsModal`: ✕/Esc/véu SÓ FECHAM (`onClose`), confirmar é só o botão. Título inline mantido nos 4 popups pequenos; placa nos demais.

**Rodada 5 (bug, 23/11): Perfil sem voltar.** Causa: no `ModalSheet` de baixo com moldura (`SheetFrame`), a linha do ✕/voltar ficava sob a arte do topo (z 2) e sumia atrás de cipó/cristal (reproduzido em 360 px: "Edit profile", aberto por Configurações › Perfil). Correção: linha `sm2-modal-fechar-linha` sobe (z 4) e cai no vão entre o cristal do canto e a placa; vale para TODA folha de baixo com moldura. Auditoria das páginas do menu: Configurações e Oráculo usam o `AreaTopBar` (voltar em círculo, ok); o defeito era das folhas com moldura. Teste: `ModalSheet.voltarVisivel.render.test.tsx`.

**Rodada 5 (bug, 23/11): erro ao abrir o APK.** Tela de erro agora traz mensagem+versão+build (também no feedback), Recarregar limpa SW/caches, chunk velho recarrega uma vez. REGISTRO §508.

**Rodada 5 (processo, 23/11): `dist/` fora dos PRs.** PR de feature/arte/fix não inclui `dist/` (o Cloudflare builda); um PR `chore(dist): rebuild` por lote sob o lock `D:\locks\heavy` roda os guards de bytes/entrada/swCache contra o build real; exceção para PRs de bytes/performance. Ver REGISTRO §507.

**Rodada 5 (ajuste, 23/11): Fantasma sem ampulheta.** O Fantasma (Spectrel) deixa de ser elemento de tempo para o motivo de ampulheta/relógio no prompt de sprite (`ehElementoDeTempo` exclui `fantasma`); tempo puro e demais compostos mantêm. REGISTRO §507. Teste em `motivoTempo.test.ts`.

**Rodada 5 (arte, 23/11): sprites do lote 5 aprovados.** O dono aprovou os 12 sprites (4 rookies + 4 champions + 4 ultimates) e os 8 nomes: Spectrel→Spectrane→Spectrarch (fantasma), Revenox→Revenoxar→Revenolord (morto-vivo), Hemolisk→Hemocarax→Hemocolossa (sangue), Furiosk→Furiozar→Furiotitan (fúria). Instalados em `novos-arquivo/combinados/` e `combinados-formas/`, registrados por `buildFormasLote5`; faltam só ícones, FX, poções/chips e cenários (P6). REGISTRO §510.

**Rodada 5 (Conjunto Fundador, PR 2/2, 23/11): aviso por popup central.** Ao ganhar prêmio(s) do conjunto: conta existente vê UM popup com os 4; conta nova vê um popup por marco (1/2/3/5 dias) com arte, nome, "Ganho por constância: N dias." e "Equipar" (fundo/moldura/retrato) + "Fechar". Campo novo `fundadorAvisados` impede repetir. REGISTRO §511.
