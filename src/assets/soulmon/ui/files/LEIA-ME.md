# Arte do modal FILES (18/11/2026, ChatGPT, alfa real, sem texto)

Referência escolhida pelo dono: `E:/Soulmon-assets/referencias-files/ref3-cristal-chama-ESCOLHIDA.jpg`. Fonte, prompts e tags: `E:/Soulmon-assets/elementos-faltantes/` (`prompts/files-*.txt`, `registro.jsonl`).

| Arquivo | Tamanho | Uso |
|---|---|---|
| `files-topo.webp` | 720 × 146 | Topo da moldura: cantos com gema, cipós discretos, **encaixe vazio no centro** para o cristal, discos vazios nos cantos esquerdo (fechar) e direito (o "i"). |
| `files-base.webp` | 720 × 29 | Base da moldura (cantos com gema e cipós). |
| `files-lado-e.webp` / `files-lado-d.webp` | 25 × 35 | Laterais retas, repetir em Y (`repeat-y`). |
| `files-cristal.webp` | 256 × 301 | Cristal com chama azul, peça separada para sobrepor ao encaixe do topo. |
| `files-aba.webp` / `files-aba-ativa.webp` | 600 × ~108 | Abas inativa e ativa (3-slice horizontal: miolo liso). |
| `files-slot.webp` / `files-slot-sel.webp` | 256 × ~243 | Slot vazio da grade e selecionado (mesmo canvas e escala nos dois estados: o corpo coincide ao sobrepor). |
| `files-disquete.webp` / `files-disquete-sel.webp` | 256 × 242 | Disquete 3.5" para COMIDAS: o rótulo é um retângulo liso (x 13–86 %, y 41–85 % da peça, px 33–219 × 100–205) onde o código compõe a ilustração da comida por cima; nome "X.exe" e ×N ficam por baixo, em texto. **Rótulo ESCURECIDO (18/11/2026, pedido do dono):** o creme original foi remapeado por Pillow para o turquesa-petróleo do painel (`--sm2-viewport-bg`, ≈ rgb 14 36 35) mantendo o relevo (luminância relativa 0,6–1,15) e o contorno; metal, corpo e brilho intactos; mesmo tamanho e alfa. |

Uso no app: `components/home/Mochila.tsx` (modal Files, 18/11/2026) — `ModalFrame` com a classe `sm2-moldura-modal--files` troca as peças da moldura por estas; a geometria (em `--u`) está comentada no bloco "MODAL FILES" de `src/index.css`. Todas as peças foram usadas; nada caiu para CSS.

Moldura: mesmo método do `ModalFrame` (fatias de largura fixa 720). O topo tem o disco do "i" no canto superior direito (mesmo ornamento padrão das molduras) e outro disco no esquerdo.
