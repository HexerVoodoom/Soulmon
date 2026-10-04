# Ajustes do dono — rodada 7, 04/10/2026

Fonte: navegação do dono pelo APK depois da rodada 6. Legenda: `[ ]` aberto · `[x]` feito e verificado · `[?]` depende de resposta.
Faixas: M = Missões/Travessias · I = InfoTip e Laboratório · J = Jogos e carregamento · A = Arena/Torneio.

## M — Passeio / Travessias / Missões
- [x] M1 Chip "Where it goes today › Mirror Home, low grass…" parece botão e ninguém entende → remover/explicar
- [x] M2 Depois de ESCOLHER a travessia ("Choose this one") o modal muda: some "Where it goes today", fica só a travessia e a tarefa
- [x] M3 Tirar texto longo ("On the map, once you mark I did it, forest opens on the next night strolls…")
- [x] M4 Tirar "Step back"; entra TIMER de 24 h: escolheu, não troca; não fez em 24 h → perde a missão e escolhe outra no dia seguinte; fez → "OK" e conclui
- [x] M5 Efeito de celebração ao concluir travessia, missão e a meta/tarefa do dia — feito: Celebration no "Fiz" (testado) e na meta do dia (só tsc, sem teste de comportamento)
- [x] M6 REGISTRO das travessias já feitas (em algum lugar do Passeio)
- [x] M7 Tirar o botão "Hide crossings"
- [x] M8 Ícone de Missões na Home, perto do minimapa (canto superior direito) → lista de missões do usuário — feito: ícone sob o Mapa abre a folha de missões (sem conferência visual)
- [x] M9 Ícone de quest: "?" AMARELO (o "?" azul de ajuda sai — ver I1)

## I — InfoTip e Laboratório
- [x] I1 Ícone de informação passa a ser "i" (não "?"), cinza claro (não azul)
- [?] I2 (parcial: Passeio, Renascimento, Descanso, Diário; faltam páginas e listas) UM só InfoTip por modal, no canto superior direito, que explica TUDO daquele modal (Conquistas, Diário, Coleção de sonhos, Passeio…)
- [x] I3 Evolution Tree: "Where they are heading" — círculo em volta do pet com a COR do ramo (Ascendente amarelo, Harmonia azul, Poder verde); card sem moldura/barra lateral colorida
- [x] I4 Trocar a progressão em barrinhas por NÚMERO; juntar com "Evolution Branches": Poder/Harmonia/Benevolência com o número dentro, lado a lado
- [x] I5 Glow no ramo que lidera: Poder verde, Harmonia azul, Benevolência dourado
- [?] I6 "O loading tem que atualizar" (indicador de carregando do Laboratório)
- [x] I7 Adventure Diary: modal de TELA CHEIA com o fundo, o Soulmon na cena e a historinha; o ícone no Laboratório fica como está

## J — Jogos, carregamento e NPC
- [?] J1 (feito, sem conferência no aparelho) Lista de masmorras e TODOS os jogos demoram ("Opening…") → medir e acelerar (prefetch/skeleton)
- [x] J2 Texto "máquina de escrever" do NPC só na PRIMEIRA vez que aquele NPC fala; depois carrega tudo de uma vez
- [?] J3 (feito, sem conferência no aparelho) Obstacle Run em TELA CHEIA
- [?] J4 (feito, sem conferência no aparelho) Fundo do Eco está ruim
- [x] J5 Refúgio: o personagem é bom, mas a casinha não combina → prédio com água (prompt de arte para o dono)
- [x] J6 Botões "Hold while breathing…" (Briefing com o pet): ao segurar o botão ENCHE da esquerda p/ direita e ESVAZIA no ritmo da bolha, enquanto o toque durar

## A — Arena / Torneio
- [x] A1 Faixas passam a ser as clássicas: Madeira, Bronze, Prata, Ouro, Platina, Diamante, Mestre
- [x] A2 Ícone da aba de Quest do Torneio ("!") a repensar (usar o "?" amarelo, M9)
- [x] A3 BUG: ao derrotar o inimigo na Arena ele fica transparente e TRAVA — não avança
- [x] A4 "Tier" esvazia em algum momento do combate — investigar se faz sentido; explicar ou corrigir
- [x] A5 Ataque FÍSICO: só o corte (sem splash/"crash"); o splash é só do dano à distância
- [x] A6 Verificar se o inimigo nunca usa ataque físico (só mágico) — bug ou só aquele inimigo
- [x] A7 Tirar o "?" de dentro do combate; explicação fica no modal anterior
- [x] A8 A Feira: explicar melhor (dono continua sem entender)
- [x] A9 Pergunta do dono: diferença entre Duelo e Torneio → responder por texto
- [ ] A10 "No opponents available" → NPCs com os assets existentes (depois; só prompt se faltar arte)

## Arte (prompts para o dono)
- [x] P1 Prédio do Refúgio com água · [ ] P2 fundo do Eco · [ ] P3 NPCs/prédios novos que as faixas acima exigirem
