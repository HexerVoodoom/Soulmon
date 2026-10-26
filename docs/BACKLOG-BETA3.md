# Backlog 1.3.0-beta3 (pedido do dono, 25/10/2026)

Branch de integração: `versao/1.3.0-beta3` (não entra na `main` antes do QA final).
Estratégia: 8 lanes independentes por área de arquivo, executores Sonnet (effort low) em
worktree própria, sem revisão no meio; um QA único no fim (alpha-qa + alpha-fiscal-entrega).

## L1 — Masmorra e Foco
- A2 Fim da masmorra (energia/teto acabou): o Soulmon VOLTA sozinho, sem plaquinha. Na próxima abertura do app (ou na hora, se estiver aberto) um pop-up centralizado diz o que foi ganho.
- A4 Missão "completar 2 runs na masmorra" não conta direito — corrigir o gatilho.
- F2 Tirar o limite diário de camadas (`DUNGEON_DAILY_LAYERS`): só a energia limita.
- F1 Separar a sessão "Prepare to Focus" do Focus Workshop num PRÉDIO NOVO. Concluir a preparação dá uma CHAVE que libera o Focus Workshop como é hoje. Com o timer de foco rodando, a masmorra desce em background, com aviso ao usuário.

## L2 — Home, pesadelo e missões
- A1 O pesadelo não aparece sempre que deveria (suspeita: sequência de eventos do acordar — `utils/nightmareWake.ts`, fila de modais).
- A3 A missão de fazer carinho só conta quando o pet perdeu vida — deve contar todo carinho.
- G1 Sprites do estágio rookie com 50% do tamanho atual.
- G2 Home: "View All" das tarefas vira um atalho de configurações.

## L3 — Mercado e Soulsmith
- B1 Conquistas compráveis SÓ no prédio de Achievements do Mercado; a lojinha de Backgrounds não repete as conquistas (verificar e corrigir).
- B2 Soulsmith: tirar "Choices Made" (fica só o bônus total); trocar o dropdown "Redo Choice" por um botão "Reforge" que abre um modal com as opções.

## L4 — Laboratório
- C1 Biblioteca: grid de 4 colunas com os PETS vistos (não os jogadores). Tocar abre só sprite grande, nome, elemento e nome do dono; nenhuma outra interação.
- C2 Friend Circle: sugestão por prefixo enquanto digita (case-insensitive); garantir nome único entre usuários; o ícone de presente não funciona — consertar.
- (Backlog, não fazer agora) Redesenhar o Hall para caber o Friend Circle; por ora fica no Laboratório.

## L5 — Clã e Grove
- D1 Clan Hall: ocultar "Place an Item" e "Clan Buildings"; botão "Go Your Own Way" em vermelho com ícone de sair.
- D2 Grove: tirar Sow/Wave/Light/Rest; o jardim já abre direto (sem "Enter Grove" nem "Close"); manter o preview com os sprites REAIS dos jogadores; semente mostra número "x / y" além da barra; botão de entrar secundário, discreto, dentro do box do preview; aguar/defender = UMA ação por usuário, sorteada; defender leva a um combate fácil contra 3 inimigos aleatórios; tirar Yeti/corvo, mostrar só "sendo atacado".

## L6 — Match 3
- E1 Inimigos do Match 3 usam os sprites que geramos (os monstros atuais terão outra função, a decidir).
- E2 Dois especiais de setinha (linha/coluna) adjacentes, de qualquer elemento, ativam juntos e destroem linha E coluna.

## L7 — Obstacle Run
- E3 Aceleração mais rápida e teto de velocidade bem maior. Nível 2: botões Jump e Dash; dash propulsiona e destrói obstáculo; 5 cargas, coletáveis no caminho; plataformas suspensas (2 andares, caminho alternativo).

## L8 — Pedra, papel, tesoura
- E4 Área de toque maior. Nível 2: 3 pedras, 3 papéis, 3 tesouras para cada lado; usados ficam escurecidos, os do inimigo também visíveis.

# Rodada 2 (pedido do dono, 25/10/2026)

Decisões do dono (modal): jogo LinkedIn = **Patches** (+ Zip); masmorra NOVA roguelike se chama **Dungeon** e a atual vira **Endless Rift**; Créditos como prêmio só nas 3 faixas do topo do Endless Rift (50/25/10, pago pelo servidor; exceção registrada no REGISTRO-DE-DECISOES); roguelike = MVP jogável agora.

## M1 — Onboarding
- Sugestões de tarefa/hábito no onboarding vêm da lista de hábitos do(s) foco(s) que o usuário marcou (ex.: sono → hábitos de sono), com os ícones que já existem para eles.

## M2 — Área do Soulmon "digital"
- A mochila volta a ser uma PASTA (ícone/rótulo). Dormir/acordar vira apagar/acender a luz do display. Banho não muda.

## M3 — Reorganizar prédios
- Exploração: prédios de se organizar e fazer tarefas + o Refúgio (sai de Games). Games: o jogo "for fun" + o Mind Workshop (jogos com efeito cognitivo).

## M4 — Perfil e Biblioteca
- Perfil explica o impacto de cada campo (personalidade, main attribute etc.).
- Card "How they fight": linha 1 = elemento + ataque básico; linha 2 = elemento + nome + efeito do especial. Mostrar sempre, mesmo quando o elemento do especial é igual ao do básico.
- Biblioteca não tem presente/doação (isso fica só no Friend Circle); só mostra os pets.

## M5 — Mind Workshop
- Fica o Pet Cycle (repetir a ordem). Os outros jogos saem e entram **Zip** e **Patches** (versões dos jogos do LinkedIn).

## M6 — Endless Rift (a masmorra atual)
- Renomear a masmorra atual para Endless Rift (EN/PT), mantendo o avanço sem teto.
- Score mensal que reinicia todo mês. Três faixas de recompensa por profundidade: 1) material; 2) mais Bits; 3) recompensa ligada ao score (competitivo). Ranking mensal; as 3 faixas do topo ganham Créditos (50/25/10) pagos pelo servidor no fechamento do mês.

## M7 — Dungeon (nova, roguelike, MVP)
- A cada passo, 3 caminhos aleatórios: combate, quebra-cabeça, minigame, ferramenta de Exploração (só recursos de Games e Exploração). De tempo em tempo combate obrigatório, cada vez mais difícil; após cada desafio vencido, escolhe 1 bônus que dura a incursão. 8 desafios por andar, 3 andares por dia. Perdeu o combate = fim da incursão do dia. Reset diário sem os bônus. Ranking.

## M8 — Ranking dos minigames
- Ranking em todos os minigames (servidor decide, por jogo).

## Assets pendentes
- M2: glifo `folder` (pasta) e `lightbulb` (lâmpada) não estão no subset de ícones (`styles/tokens.md`). Provisório: pasta = `inventory_2`, luz = `dark_mode` (apagar) / `light_mode` (acender). Trocar quando entrarem no subset.

# Rodada 3 (pedido do dono, 25/10/2026)

Decisões (modal): simulados parecem reais mas NUNCA levam prêmio (flag `simulated`); sprites dos simulados em fila para quando houver crédito; página GM em rota web protegida; bullet hell = **Soul Barrage**.

## M9 — Soul Barrage (bullet hell vertical)
- Soulmon na base, tela rola para cima, inimigos descendo; desviar ou atacar; ataque ranged CONTÍNUO pelo elemento do Soulmon (`fx-<el>-orb`); move-se para se posicionar; fases com dificuldade crescente; score SEMANAL. Inimigos do roster M10 com progressão rookie→champion→ultimate→mega.
- Obstacle Run: o dash usa o sprite de ataque FÍSICO do elemento (`fx-<el>-slash`).

## M10 — Roster de todos os elementos (inclusive combinados), progressão por estágio, tudo no bestiário/Biblioteca.
## M11 — 50 usuários simulados com perfis de comportamento (frequência, jogo preferido, competitividade), ativos em rankings/PvP; flag `simulated`, pulados em prêmio; sprites via API em fila.
## M12 — Página GM `/gm/soulmons` (sprite, nome, e-mail).
## M13 — Menu de criar: filtro de categoria/área mostra pontos de Poder/Harmonia/Benevolência.
## M14 — Balanço dos elementos (Luz frequente demais, sprites monocromáticos amarelos): medir por simulação e corrigir.

Assets: ver `docs/PROMPTS-BETA3.md` (36 reaproveitados, 19 prompts novos).

## Calabouço (RogueDungeon)
- Calabouço: ferramenta de Exploração (backlog, decisão do dono 25/10/2026); manter Eco.
