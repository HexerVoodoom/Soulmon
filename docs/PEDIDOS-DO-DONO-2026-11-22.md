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
