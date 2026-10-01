# Ajustes da navegação do dono — 01/10/2026

Fonte: navegação do dono pelo app (login → onboarding → home → settings → mapa → lojas).
Legenda: `[ ]` aberto · `[x]` feito e verificado · `[?]` depende de pergunta (ver fim).

## A. Login
- [ ] A1 Trocar chama-em-box-gradiente + texto "Soulmon" pelo logo do app (`src/assets/brand/final/logo.svg`), alta resolução
- [ ] A2 Trocar a fonte de título (Fredoka, redonda) — prancha de opções para o dono escolher [?]
- [ ] A3 Login Google ligado à conta da Play Store; vínculo Steam ↔ Play via conta Google [?]

## B. Onboarding
- [ ] B1 Nome do jogador vira a PRIMEIRA pergunta (antes do ritual); tirar copies explicativas embaixo
- [ ] B2 Pergunta aberta → objetiva (opções fechadas)
- [ ] B3 Remover "I'd rather not say right now"
- [ ] B4 Todas as perguntas existentes (~20) entram, todas obrigatórias [?]
- [ ] B5 Força e dificuldade (≥1 de cada) escolhidas no onboarding
- [ ] B6 "Back" padronizado: seta no canto superior esquerdo, acima do título (vale para o app inteiro)
- [ ] B7 Copy "Get the Full Game" → "Get your own Soulmon" (ou similar)
- [ ] B8 Card "Your Soul Creature / a creature that is only yours": X para dentro, vira botão; botão "criar a própria criatura" acima de "continue filling my character"
- [ ] B9 Sprites das criaturas disponíveis mal recortados → regerar com alfa real (gpt_image_2 --background transparent)
- [ ] B10 Remover opção de coloração
- [ ] B11 "Less details" → "Name your Soulmon", fora do box, solto

## C. Home
- [ ] C1 Header: logo no canto superior esquerdo; menu = três tracinhos (hambúrguer simples)
- [ ] C2 Tirar espaço entre header e área do pet; subir conteúdo
- [ ] C3 Pet sem box de gradiente; background padrão sempre presente
- [ ] C4 Cradle/sininho bem menor
- [ ] C5 Área do pet: altura fixa, sem scroll interno; balão de fala não empurra conteúdo
- [ ] C6 "How are you today": emojis → assets próprios
- [ ] C7 Remover descrições pequenas ("Good morning, 20 seconds and we are off" etc.)
- [ ] C8 Investigar hábito "Leitura diária" que o dono não definiu (`HomeHud.tsx`)
- [ ] C9 Card de hábito: explicar benefício; "Commit" → "Definir"; "o que você gostaria de melhorar" → "Definir metas"
- [ ] C10 Seleção de força/dificuldade: mínimo 1 obrigatório
- [ ] C11 Starting point: sem "pular"; exige meta antes de avançar
- [ ] C12 Starting point "swap/keep": virar botão "Commit" que vira checkbox ao clicar
- [ ] C13 Tooltip ao tocar energia/coração: como ganha e como perde
- [ ] C14 Ícone do mapinha na home (direita inferior) com o círculo do mercado

## D. Lista de tarefas (home)
- [ ] D1 Ao concluir: card com glow e animação descendo (não "teleportar")
- [ ] D2 Remover botão pena/editar; editar = tocar ícone da esquerda
- [ ] D3 Remover tracejado + bolinha (não comunica)
- [ ] D4 Catálogo: busca vira lupa no canto; sem barra de scroll horizontal nos filtros
- [ ] D5 Catálogo: tirar emojis-ícone; rever fonte
- [ ] D6 Botão "adicionar" mais baixo (altura)

## E. Chat com o Soulmon
- [ ] E1 Digitar direto, sem abrir caixa dentro de caixa
- [ ] E2 Ocultar a copy "If you're going through…" (guardar texto para outro lugar)
- [ ] E3 Campo vazio = microfone; com texto = enviar

## F. Inventário / recompensas / banho
- [ ] F1 Ícone saquinho → mochila
- [ ] F2 Modal de recompensa: mais claro (fundo claro), sem box gradiente, item direto, botão "Equipar" além de "Good morning"
- [ ] F3 Sofá (e itens com recorte ruim) → regerar com alfa real
- [ ] F4 Ícone de banho (mão jogando água + balão do pet) refeito; chuveirinho do menu fica

## G. Menu e Settings
- [ ] G1 Ocultar "Oracle" e "Redo the ritual" do menu
- [ ] G2 Seções em accordion fechado (só título); mais espaçamento; contorno mais claro
- [ ] G3 "Your Plan: Full" → selo de conta Full (compra única)
- [ ] G4 Remover campo de e-mail/sign-in (login Google já feito)
- [ ] G5 "Your Data": tirar copies; ícone "?" na linha que revela as duas explicações
- [ ] G6 Notificações ativadas por padrão
- [ ] G7 Personalidade do Soulmon derivada do onboarding (força × fraqueza, contrabalancear), com base nos agentes de psicologia [?]
- [ ] G8 Auto sleep + rest window: modal na 1ª abertura do 2º dia (manhã), configurável ali
- [ ] G9 Explicar "Restore Purchases" ao dono (resposta no fim)

## H. Mapa e lojas
- [ ] H1 Ajuste fino: Exploração ↓, Hall ↓, Games ↓, Arena →, Laboratório ↓ (Mercado fica)
- [ ] H2 Casinha do mapa (esq. inferior) com o círculo do mercado
- [ ] H3 Loja: background não pode ficar sobre o texto dos itens
- [ ] H4 Modal de loja: X no canto superior esquerdo, acima do NPC
- [ ] H5 Revisar nomes e textos dos NPCs
- [ ] H6 Faixa título/fechar/filtro sem vão (conteúdo passa por trás no scroll)
- [ ] H7 Item já ganho não aparece na loja
- [ ] H8 Comprar sem recurso → modal explicando como conseguir o recurso
- [ ] H9 Achievements: mostrar item que ganha + como ganhar
- [ ] H10 Exploração: reposicionar prédios
- [ ] H11 Dungeon: tirar linha 2-3-4-5; copy "losing any cost…/minigame beats today" abaixo do "Enter the Dungeon"
- [ ] H12 Stroll (floresta/oceano/…): cards fechados, separados, com título criativo
- [ ] H13 Games: redistribuir prédios; "Run" → "Play"
- [ ] H14 Botões de ação: primário em todos (Game Hall, Mind Workshop…)
- [ ] H15 Arena: treino + duelo no mesmo espaço; feira no outro
- [ ] H16 Laboratório: prédios maiores, observatório significativamente maior, outros dois descem
- [ ] H17 Biblioteca do Hall: só Soulmons que o usuário viu; prédios maiores
- [ ] H18 Backgrounds de Hall e Laboratório refeitos no padrão de Arena/Exploração/Mercado/Jogos

## I. Transversal
- [ ] I1 Padronização de botões (primário/secundário) no app todo
- [ ] I2 Separação de cards nas lojas/telas internas (hoje tudo misturado)
- [ ] I3 Voltar sempre no canto superior esquerdo

## Respostas do dono (01/10/2026)
- A2 fonte: prancha com 2 direções — **serifa arcana** (Cinzel/Cormorant…) e **display com personalidade** (Unbounded/Syne…). Dono escolhe na prancha.
- A3 contas: **login Google amarrado à conta Play agora; vínculo Steam só documentado** para depois.
- B4 perguntas: **Oráculo + perfil + metas** (força/dificuldade, meta inicial), todas objetivas e obrigatórias.
- G7 personalidade: **automática, sem troca** — some das Settings.
- G9 "Restore Purchases": restaura compras já feitas na conta da loja (Play) em aparelho novo/reinstalação; não cobra nada. Com login Google amarrado, pode ficar automático e o botão vira só fallback.
