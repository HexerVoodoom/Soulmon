# Frente D (beta-2) — o que pedir ao `alpha-design-critic`

Branch `feat/b2-mercado-jogos`. Capturas em `product/beta-play-01/builder/b2-d/` (390x844, @2x, PT-BR; sufixo `-en` quando em inglês).
`antes-*` = `release/beta-2` sem a frente D; `depois-*` = com ela. Sem aparelho Android real: tudo medido no navegador (Edge, viewport de celular).

## O que olhar (por item do backlog)

| Item | Captura | Pergunta ao crítico |
|---|---|---|
| 8.1 descrição do chip | `depois-mercado-item-folha` | `+3 Poder` basta como "nome, efeito, valor"? O nome fica no título da folha e o preço abaixo. |
| 8.2 pré-visualização | `depois-mercado-item-folha`, `depois-mercado-item-preview` | A miniatura de 40 px dentro da folha (alvo de 44) é descobrível? Faltou um sinal (lupa) de que ela amplia? Nos cenários o gesto é o mesmo. |
| 9.1 Salão de Jogos | `antes-area-jogos` x `depois-salao`; `antes/depois-area-jogos` | Espaçamento de 16 px entre cards basta? Bota (Corrida) e punho (PPT) leem como "jogo" aos 32 px? Posição Salão x Ateliê **mantida** (o #316 já a moveu e o guard H11 trava: 52% é o teto sem a área de toque encostar no Ateliê). |
| 9.3 Arena | `antes-area-arena` x `depois-area-arena` | Torneio (esquerda) e Arena livre (direita) em tablados separados: a Arena livre pode descer ~3 pontos para assentar no centro do losango? |
| 9.3 folha da Arena livre | `depois-arena-livre` | Sem elemento/golpes sobrou só o poder + adversários: o poder sozinho é ruído? |
| 9.4 carregando | `depois-perfil` (frame de carregamento da folha, antes do conteúdo) | Visor parado + uma palavra, sem legenda dupla. Comunica atividade sem ocupar espaço? O erro (frase + "Tentar de novo") só existe no componente (teste), não há tela real que o dispare ainda. |
| 10.1 ícones de categoria | `depois-lab-stats-b` | Os PNG `icon-cat-*` a 24 px leem bem ao lado do texto? |
| 10.2 árvore aberta | `depois-lab-stats-b` | O cartão de resumo saiu (a árvore já abre com a mesma linha). Concorda? |
| 10.3 abas da Evolução | `antes-lab-evolucao-b` x `depois-lab-evolucao-b` | Sublinhado de 2 px, separadores e rótulo inteiro. As abas inativas em `muted` (o glifo mantém a cor do caminho) estão contrastadas o bastante? O deslize lateral na área da árvore é descobrível? |
| 11 Perfil | `depois-perfil-mapa`, `depois-perfil` (e `-en`) | Posição no piso hexagonal de baixo (50%/92%); duas cartas; ícones de arte existente. A carta "Como luta" tem 5 linhas: cabe ou passa de longa? |
| 12 humor | `depois-humor` (se capturado) | Ícones de 40 px em alvos de 64 + nome do humor escolhido sob a fileira. |

## Pedidos de ARTE (não fiz arte nova; usei o que já existia)

1. **Sprite próprio do prédio Perfil** (hoje: `lote-jogos-mente-akasha.png`, um santuário cristalino sem uso). Quadrado, alfa real, ~300 px, no estilo dos lotes do Laboratório.
2. **Busto de NPC próprio do Perfil** (hoje: o da Oriel, `npc-f-sacerdotisa`, que o Santuário deixou em 07/10).
3. **Ícones dedicados** para "Atributo principal" (Força / Resistência / Agilidade) e "Tipo de ataque" (corpo a corpo / à distância): hoje halter, escudo, raio, punho e alvo reaproveitados.
4. **Ícone dedicado** para a Corrida com obstáculos e para o Pedra-papel-tesoura (hoje: bota e punho reaproveitados). O velociraptor e a tesoura saíram a pedido do dono.

## Riscos que a revisão deve julgar

- A troca livre do Combina 3 **gasta movimento** mesmo sem pontuar (default da squad; senão a partida não tem fim). Se o dono quiser "só a que pontua gasta", é decisão de balanceamento.
- O loading mudou o `ScreenSkeleton` (usado em ~45 pontos): a palavra única e a altura de 96 px podem ter deslocado layouts que contavam com 220 px.
- Nada de altura/contraste foi medido por ferramenta de acessibilidade; só os alvos de toque (>= 44) estão travados por teste.
