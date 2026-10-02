# Ajustes da navegação do dono — rodada 3, 02/10/2026

Fonte: navegação do dono pelo APK já logado (Pesadelo, Home, Mercado, Masmorra, Passeio, Laboratório, Arena).
Continuação de `AJUSTES-NAVEGACAO-2026-10-01.md`. Legenda: `[ ]` aberto · `[x]` feito e verificado · `[?]` depende de resposta.

## A. Entrada e onboarding
- [x] A1 O app abre SEMPRE em inglês, inclusive antes da pergunta de idioma (hoje já abre em PT-BR)
- [x] A2 Portão com UM botão só: "Continuar com Google" — conta existente entra direto, conta nova é criada
- [x] A3 Os termos vêm DEPOIS do login: criou/entrou → precisa aceitar os termos para avançar para o app
- [x] A4 Títulos do onboarding usam a fonte de texto corrido (Rubik), não a display Cinzel — legibilidade

## B. Home
- [x] B1 Mostrar só o nome do Soulmon (sai a palavra "companheiro"); o nome fica no topo, junto do logo
- [x] B2 Navegação: mapinha da Home vai para o canto SUPERIOR direito; casinha do Mapa para o SUPERIOR esquerdo; menu sanduíche vai para a esquerda, onde hoje fica o logo [?]
- [x] B3 Botão "Evoluir" mais dramático, centralizado no alto da área do pet, com acabamento na identidade (imagem própria — arte no documento de prompts)
- [~] B4 (dispensado pelo dono) Animação da evolução alterna entre frames iguais (parece piscar sem sentido) — corrigir [?]
- [x] B5 Ícone do microfone/enviar: mais fino e no azul da identidade (o mesmo do traço do input)
- [x] B6 Água do chuveiro: menos transparente e cai mais para baixo

## C. Pesadelo e combate
- [x] C1 Card do pesadelo: brilhos com branco em volta do recorte e uma bolinha roxa → usar uma das criaturas que já temos
- [x] C2 O sistema de TORCIDA revisto para o combate não aparece na Arena nem no Pesadelo → ligar — torcida por toques + gauge no Torneio, Pesadelo e Masmorra (REGISTRO §20); Duelo da Arena e dosagem do especial em PERGUNTAS-DO-DONO TORC-1..4

## D. Mercado e decoração
- [x] D1 Comprar item pede um modal de confirmação (vale também para a troca de Créditos)
- [x] D2 Decoração: deixar claro limite de itens, restrições e se algum fundo é exigido; idealmente qualquer decoração em qualquer fundo — regra REAL no REGISTRO §19 (dependência de fundo é de arte, mantida; [?] dono)

## E. Masmorra
- [x] E1 Texto longo vai para um "?" (toque lê)
- [x] E2 "Descer mais fundo" só libera andar já alcançado antes; não dá para pular pagando

## F. Passeio / Travessias
- [x] F1 Cada travessia ganha ícone/ilustração além do título
- [x] F2 Depois de escolher: separar bem o card que mudou; a tela mostra só a travessia em uso; o modal com todas continua acessível
- [x] F3 Tirar o botão "deixa pra depois"; entra "recuar" [?]
- [x] F4 Tocar em "Fiz" dá feedback e deixa clara a recompensa
- [x] F5 Uma travessia pode ser feita todo dia

## G. Laboratório, Guilda e Arena
- [x] G1 Laboratório / Meu Soulmon / Observatório: tirar o Soulmon do box com gradiente (fica solto)
- [x] G2 Estatísticas saem de Configurações e vão para o Laboratório — saiu a linha do menu; o opt-out de telemetria fica em Configurações [?]
- [x] G3 Missão da Guilda: NPC trocado para a Bastia (REGISTRO §19) [?]

- [x] G4 Arena: explicar/clarear a "feira"; aumentar os prédios do duelo e do torneio

## Rodada 4 — APK testado (02/10/2026, tarde)
Fonte: navegação do dono no APK logado, após a rodada 3 publicada.
- [x] H1 Idioma: escolhido num MODAL logo na abertura; depois cai no login; a tela "Before we start" (termos) NÃO pede idioma de novo
- [x] H2 Fonte: o onboarding inteiro está com a fonte arredondada antiga; títulos em peso menor, na mesma fonte do texto corrido (caçar qualquer `Fredoka`/inline residual)
- [x] H3 BUG: login Google numa conta que já existia NÃO restaurou o save (cai no onboarding de novo) — investigar adoção do save em nuvem após o login
- [ ] H4 (PNG do Pyraka cortado no próprio arquivo — precisa de arte nova; prompt no documento do dono; "Acache" não identificado) Sprites das criaturas da escolha do onboarding cortados (Pyraka e outra, principalmente) — conferir os 6 e corrigir
- [x] H5 Home: tirar o logo do topo (fica ☰ · nome · Mapa)
- [x] H6 Home: barra de texto do chat ocupa toda a largura
- [x] H7 Home: scroll só da área abaixo do Soulmon; header e área do pet FIXOS
- [x] H8 Home: área do Soulmon sem risco delimitando; borda inferior em fade de gradiente discreto (igual à de cima); tirar o ninho/cradle; Soulmon, energia, vitalidade e ícones de dormir/banho DENTRO da área (no background dela)
- [x] H9 Navegação: ícone do Mapa/casinha/X no topo esquerdo sempre na MESMA posição (a da casinha, que está boa), inclusive dentro das folhas dos prédios; a casinha voltar ao brilho anterior (escureceu)
- [x] H10 Jogos: prédios maiores; trocar os ícones de pedra/papel/tesoura
- [x] H11 BUG: o NPC alterna entre aberturas do mesmo lote (ex. Lab › Evolution Line mostra Quill ou Vesca) — tem que ser FIXO por lote, em todos os lotes
- [x] H12 Conquistas (Achievements): prédio errado (torre alta e estreita fica pequena) — trocar por prédio mais largo, ou ampliar até a base preencher o espaço e trocar de lugar com a Decoração (torre grande ao fundo); auditar os demais lotes por proporção
- [x] H13 PvP: o toggle "Join PvP" não funciona → remover o toggle; o personagem já nasce no PvP
- [x] H14 Combate: o dono não viu a torcida na Arena → levar a torcida por toques também ao Duelo da Arena (TORC-2) e garantir que o Torneio abre

## Respostas do dono
_(preencher)_
