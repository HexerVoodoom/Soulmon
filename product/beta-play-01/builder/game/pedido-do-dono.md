# Pedido do dono (voz, 11/10/2026) — Masmorra e Salão de Jogos

Transcrição literal (a frase "se ele sair, ele cancela ela" é erro de reconhecimento: o sentido é NÃO cancelar):

> Na dungeon tem em cima "Layer 1", depois na frente "1 de 6". Embaixo, na direita, "Layer 1" de novo. Deixa só "Layer 1 de 6", só precisa dessa. Tá lento. Vamos botar um fast forward no canto inferior direito, pra velocidade 2x, 3x, ou 1x, pra acelerar. E não precisa do usuário carregar o especial, deixa ele carregar o especial direto sozinho. Quando dropar algum item, aparece um modalzinho com o ícone do item falando o que dropou. E a dungeon é o seguinte: eu quero que o jogador possa sair da dungeon e deixar ela acontecendo. Se ele sair, ele não cancela, depois ele volta e teve o avanço ali — a menos que ele mande o Soulmon pra alguma outra função, não pode porque ele tá na dungeon. Aí ele tem que tirar da dungeon pra mandar pra outra missão, ou pra evoluir, ou qualquer outra coisa que envolva de fato o Soulmon. Mesmo na home: quando ele tiver na dungeon, ele não tá na home. Aí põe uma plaquinha: "Estou na dungeon, volto logo" ou algo assim. Aqui no Game Hall também pode criar um jogo tipo Candy Crush mesmo. Pode usar assets que a gente já tem pra fazer isso.

Decisão e limites: `docs/REGISTRO-DE-DECISOES.md` §36 (branch `feat/beta-masmorra-minijogo`).

Screenshots (390×844, Chrome headless contra o dev server, save semeado em `localStorage`):

| Arquivo | O que mostra |
|---|---|
| `g01-hud-camada-luta-1x.png` | HUD: UM indicador "Camada 1 · luta 1 de 6"; Pausar à esquerda, avanço rápido 1× no canto inferior direito |
| `g02-avanco-rapido-2x.png` | Avanço rápido em 2× (botão preenchido) |
| `g03-modal-de-drop.png` | Modalzinho de drop: ícone + "Coraçãozinho" + ×1, a luta segue por trás |
| `g04-sair-da-tela.png` | O × da luta: "Sair da tela? Ele continua descendo sozinho…" com Ficar / Sair / Retirar da masmorra |
| `g05-enquanto-esteve-fora.png` | Cartão ao voltar: o que a descida rendeu fora da tela |
| `g05b-fim-sozinha-8-camadas.png` | Descida que acabou sozinha por energia depois de 2 h fora (8 camadas) |
| `g06-home-plaquinha.png` | Home: pet some, plaquinha "Estou na masmorra, volto logo" |
| `g07-aviso-ocupado.png` | Tocar na plaquinha: "Ele está na masmorra" com Retirar da masmorra / Deixar lá |
| `g08-passeio-bloqueado.png` | Tentar o Passeio com ele na masmorra: o mesmo aviso, dizendo o que o jogador queria fazer |
| `g09-home-restaurada.png` | Depois de "Retirar da masmorra": pet de volta e o que rendeu (3 camadas, Bits) |
| `g10-salao-card-combina3.png` | Salão de Jogos: o terceiro card, Combina 3 |
| `g11-match3-tabuleiro.png` | Combina 3: tabuleiro 7×7 de ícones de elemento |
| `g12-match3-cascata.png` | Cascata em andamento (peças novas caindo) |
| `g13-match3-especial.png` | Peça especial (setas) depois de uma linha de 4 |
