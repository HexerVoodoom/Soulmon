# Moldura de AÇO da Hexsmith (18/11/2026, ChatGPT, alfa real, sem texto)

Arte do "Files novo" (aço com runas) que o dono escolheu para a moldura do modal da **Hexsmith** (não para a pasta de itens, que segue com `../files/`).
Fonte, prompts e tags: `E:/Soulmon-assets/files-final/` (`prompt-*.txt`, `registro.jsonl`, `montar.py`). Mock: `E:/Soulmon-wt/aprovacao/files-final-mock.png`.

| Arquivo | Tamanho | Uso |
|---|---|---|
| `aco-topo.webp` | 720 × 164 | Topo: cantos de aço, faixa de runas, placa central do título (x 155–565, y 45–145), encaixe do cristal (topo-centro, y 41), discos vazios: fechar (centro 84,5 / 91,5) e "i" (centro 635 / 90,5), diâmetro ≈ 70. |
| `aco-base.webp` | 720 × 136 | Base com cantos de aço INTEIROS e runas (faixa do meio y 83–122; 7 px de margem transparente embaixo). As laterais passam por baixo do topo e da base. |
| `aco-lado-e.webp` / `aco-lado-d.webp` | 40 × 80 | Laterais com runas, repetir em Y. |

Uso no app: `ModalFrame` com a classe `sm2-moldura-modal--aco` (via `AreaSheet moldura="aco"`, só no lote `forja.hexsmith`). Geometria em `--u` (px / 720 × 100) no bloco "MOLDURA DE AÇO" de `src/index.css`.
O ✕ e o "i" são SÓ glifos centrados nos discos que o topo já desenha (pedido do dono: sem botão redondo por cima). As abas planas (`files-aba*.webp`) e o botão redondo (`files-botao-redondo.webp`) do conjunto NÃO foram copiados.
