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
