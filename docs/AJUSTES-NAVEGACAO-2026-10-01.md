# Ajustes da navegação do dono — 01/10/2026

Fonte: navegação do dono pelo app (login → onboarding → home → settings → mapa → lojas).
Legenda: `[ ]` aberto · `[x]` feito e verificado · `[?]` depende de pergunta (ver fim).

## A. Login
- [ ] A1 Trocar chama-em-box-gradiente + texto "Soulmon" pelo logo do app (`src/assets/brand/final/logo.svg`), alta resolução — **parcial**: o `logo.svg` atual já substitui a chama-em-box no login/onboarding e no header (`5e3d3334`, `0c8f2445`); pendente de ARTE: o wordmark e o mascote oficiais em alta (`logo-wordmark.png`/`mascote.png` ainda não existem em `src/assets/brand/final/`)
- [x] A2 Trocar a fonte de título (Fredoka, redonda) — prancha de opções para o dono escolher — **Cinzel** (decisão do dono 01/10), self-host OFL em `public/fonts/` (`c2086a88`)
- [x] A3 Login Google ligado à conta da Play Store; vínculo Steam ↔ Play via conta Google

## B. Onboarding
- [x] B1 Nome do jogador vira a PRIMEIRA pergunta (antes do ritual); tirar copies explicativas embaixo
- [x] B2 Pergunta aberta → objetiva (opções fechadas)
- [x] B3 Remover "I'd rather not say right now"
- [x] B4 Todas as perguntas existentes (~20) entram, todas obrigatórias
- [x] B5 Força e dificuldade (≥1 de cada) escolhidas no onboarding
- [x] B6 "Back" padronizado: seta no canto superior esquerdo, acima do título (vale para o app inteiro)
- [x] B7 Copy "Get the Full Game" → "Get your own Soulmon" (ou similar)
- [x] B8 Card "Your Soul Creature / a creature that is only yours": X para dentro, vira botão; botão "criar a própria criatura" acima de "continue filling my character"
- [x] B9 Sprites das criaturas disponíveis mal recortados → regerar com alfa real (gpt_image_2 --background transparent) — recorte limpo dos 6 sprites (`9c10e2fa`)
- [x] B10 Remover opção de coloração
- [x] B11 "Less details" → "Name your Soulmon", fora do box, solto

## C. Home
- [x] C1 Header: logo no canto superior esquerdo; menu = três tracinhos (hambúrguer simples)
- [x] C2 Tirar espaço entre header e área do pet; subir conteúdo
- [x] C3 Pet sem box de gradiente; background padrão sempre presente
- [x] C4 Cradle/sininho bem menor
- [x] C5 Área do pet: altura fixa, sem scroll interno; balão de fala não empurra conteúdo
- [ ] C6 "How are you today": emojis → assets próprios — **interino** ligado (`9243b906`, `67e4ae14`, fronteira `MOOD_ART`); falta a folha DEFINITIVA de arte dos humores
- [x] C7 Remover descrições pequenas ("Good morning, 20 seconds and we are off" etc.)
- [x] C8 Investigar hábito "Leitura diária" que o dono não definiu (`HomeHud.tsx`)
- [x] C9 Card de hábito: explicar benefício; "Commit" → "Definir"; "o que você gostaria de melhorar" → "Definir metas"
- [x] C10 Seleção de força/dificuldade: mínimo 1 obrigatório
- [x] C11 Starting point: sem "pular"; exige meta antes de avançar
- [x] C12 Starting point "swap/keep": virar botão "Commit" que vira checkbox ao clicar
- [x] C13 Tooltip ao tocar energia/coração: como ganha e como perde
- [x] C14 Ícone do mapinha na home (direita inferior) com o círculo do mercado

## D. Lista de tarefas (home)
- [x] D1 Ao concluir: card com glow e animação descendo (não "teleportar")
- [x] D2 Remover botão pena/editar; editar = tocar ícone da esquerda
- [x] D3 Remover tracejado + bolinha (não comunica)
- [x] D4 Catálogo: busca vira lupa no canto; sem barra de scroll horizontal nos filtros
- [x] D5 Catálogo: tirar emojis-ícone; rever fonte
- [x] D6 Botão "adicionar" mais baixo (altura)

## E. Chat com o Soulmon
- [x] E1 Digitar direto, sem abrir caixa dentro de caixa
- [x] E2 Ocultar a copy "If you're going through…" (guardar texto para outro lugar)
- [x] E3 Campo vazio = microfone; com texto = enviar

## F. Inventário / recompensas / banho
- [x] F1 Ícone saquinho → mochila
- [x] F2 Modal de recompensa: mais claro (fundo claro), sem box gradiente, item direto, botão "Equipar" além de "Good morning" — e desde 01/10 o sonho DÁ a decoração gêmea e o Equipar aparece sempre (`6c71c5da`)
- [ ] F3 Sofá (e itens com recorte ruim) → regerar com alfa real — pendente de ARTE: sofá/estante + as 12 decorações com alfa real
- [x] F4 Ícone de banho (mão jogando água + balão do pet) refeito; chuveirinho do menu fica

## G. Menu e Settings
- [x] G1 Ocultar "Oracle" e "Redo the ritual" do menu
- [x] G2 Seções em accordion fechado (só título); mais espaçamento; contorno mais claro
- [x] G3 "Your Plan: Full" → selo de conta Full (compra única)
- [x] G4 Remover campo de e-mail/sign-in (login Google já feito)
- [x] G5 "Your Data": tirar copies; ícone "?" na linha que revela as duas explicações
- [x] G6 Notificações ativadas por padrão
- [x] G7 Personalidade do Soulmon derivada do onboarding (força × fraqueza, contrabalancear), com base nos agentes de psicologia
- [x] G8 Auto sleep + rest window: modal na 1ª abertura do 2º dia (manhã), configurável ali
- [x] G9 Explicar "Restore Purchases" ao dono (resposta no fim)

## H. Mapa e lojas
- [x] H1 Ajuste fino: Exploração ↓, Hall ↓, Games ↓, Arena →, Laboratório ↓ (Mercado fica)
- [x] H2 Casinha do mapa (esq. inferior) com o círculo do mercado
- [x] H3 Loja: background não pode ficar sobre o texto dos itens
- [x] H4 Modal de loja: X no canto superior esquerdo, acima do NPC
- [x] H5 Revisar nomes e textos dos NPCs — e as bancas de Itens/Decoração ganharam nome: Lamela e Lasca (`f911cfaa`)
- [x] H6 Faixa título/fechar/filtro sem vão (conteúdo passa por trás no scroll)
- [x] H7 Item já ganho não aparece na loja
- [x] H8 Comprar sem recurso → modal explicando como conseguir o recurso
- [x] H9 Achievements: mostrar item que ganha + como ganhar
- [x] H10 Exploração: reposicionar prédios
- [x] H11 Dungeon: tirar linha 2-3-4-5; copy "losing any cost…/minigame beats today" abaixo do "Enter the Dungeon"
- [x] H12 Stroll (floresta/oceano/…): cards fechados, separados, com título criativo
- [x] H13 Games: redistribuir prédios; "Run" → "Play"
- [x] H14 Botões de ação: primário em todos (Game Hall, Mind Workshop…)
- [x] H15 Arena: treino + duelo no mesmo espaço; feira no outro
- [x] H16 Laboratório: prédios maiores, observatório significativamente maior, outros dois descem
- [x] H17 Biblioteca do Hall: só Soulmons que o usuário viu; prédios maiores
- [ ] H18 Backgrounds de Hall e Laboratório refeitos no padrão de Arena/Exploração/Mercado/Jogos — pendente de ARTE: fundos de Hall e Laboratório

## I. Transversal
- [x] I1 Padronização de botões (primário/secundário) no app todo
- [x] I2 Separação de cards nas lojas/telas internas (hoje tudo misturado)
- [x] I3 Voltar sempre no canto superior esquerdo

## J. Metas de quem já joga
- [x] J1 Metas obrigatórias também para quem já joga — confirmado 01/10: o convite do catálogo (`needsCatalogOnboarding`, `CatalogOnboardingFlow`) abre para todo save sem `catalogOnboardingSeenAt`, sem "pular" (C11) e com mínimo 1 de cada (C10)

## Respostas do dono (01/10/2026)
- A2 fonte: prancha com 2 direções — **serifa arcana** (Cinzel/Cormorant…) e **display com personalidade** (Unbounded/Syne…). Dono escolhe na prancha.
- A3 contas: **login Google amarrado à conta Play agora; vínculo Steam só documentado** para depois.
- B4 perguntas: **Oráculo + perfil + metas** (força/dificuldade, meta inicial), todas objetivas e obrigatórias.
- G7 personalidade: **automática, sem troca** — some das Settings.
- G9 "Restore Purchases": restaura compras já feitas na conta da loja (Play) em aparelho novo/reinstalação; não cobra nada. Com login Google amarrado, pode ficar automático e o botão vira só fallback.
- A1 logo + mascote oficiais entregues pelo dono (01/10): wordmark pixel "SOUL" turquesa com chama / "MON" cobre, e o corvo de máscara de bico com cartola e lanterna turquesa. Originais em `E:\Soulmon-assets\out\ajustes-20261001\logo-mascote\`; recorte com alfa real → `src/assets/brand/final/logo-wordmark.png` e `mascote.png`. Usar o wordmark no login (A1) e no header da Home (C1). A tipografia do wordmark (serifa pixel) orienta a escolha de fonte do A2.
- **Decisões de 01/10/2026 (rodada 2), já na branch `feat/ajustes-1001-rodada2`:**
  - A2 fonte: **Cinzel** para título/display/wordmark de texto (corpo segue Rubik). Self-host, OFL em `docs/Attributions.md`; a Fredoka saiu do bundle.
  - F2 sonho: **o sonho DÁ a decoração gêmea** (entra no inventário, idempotente) e o "Equipar" aparece sempre nesse caso, equipando na hora. A alternativa que perdeu ("só equipar se já tiver") está no `REGISTRO-DE-DECISOES.md` §5.6.
  - B4 teste longo: **as 20 respostas ficam no save também no grátis** (`GameState.soulTestAnswers`); quem comprar depois não responde de novo — o upgrade pula o teste. Declarado em `public/privacidade.html` §2 (PT e EN), `PRIVACY_VERSION` 2026-10-01.
  - H5 NPCs: banca de Itens = **Lamela, a mascate** (criatura-cogumelo); banca de Decoração = **Lasca, a marceneira** (panda-vermelha). Grom segue anfitrião da área.
  - Metas obrigatórias para quem já joga: **já estava assim**, confirmado (J1).
