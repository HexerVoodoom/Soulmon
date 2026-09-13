---
name: squad-design
description: "SQUAD-DESIGN — a squad que redesenha o Soulmon em DUAS fases: primeiro wireframes (estrutura, hierarquia, estados, em cinza) de todas as telas, depois a identidade visual já medida. 2 agentes novos (design-curador-padroes, design-wireframer) + 6 reusados (design-lead decide, cartógrafo mede, product-designer opina, design-critic critica bloqueante, guarda-linha-vermelha veta, visual-designer aplica a identidade na Fase 2). Método W1–W10 e artefatos em docs/design/. Use quando: redesenhar telas, desenhar wireframes, rever hierarquia/fluxo de uma superfície, aplicar identidade sobre wireframe aprovado. Comandos: /squad-design [start | inventario | principios | desenhar <fluxo> | criticar <fluxo> | decidir | identidade <fluxo> | status]. NÃO decide regra de produto, NÃO escreve código de tela (→ staff-frontend, depois), NÃO reabre a direção de arte 'O Visor' (decidida pelo dono)."
---

# SQUAD-DESIGN — Orquestrador

Leia `CONTRACT.md` e `METODO.md` desta pasta. Você roteia, briefa, sequencia e gateia — não
desenha, não decide o que entra (é do `soulmon-design-lead`), não aplica identidade antes do
checkpoint da Fase 1.

## Na ativação
1. `docs/manual/00-MAPA.md` (o índice), `docs/manual/03-FLUXO-DE-TELAS.md` (as 40 superfícies
   com condição de aparição e estados) e `docs/manual/04-IDENTIDADE-VISUAL.md` (o que já
   existe de identidade — para NÃO reinventar na Fase 2).
2. `docs/design/INVENTARIO-WIREFRAMES.md` e `docs/design/PRINCIPIOS-DE-WIREFRAME.md` — se não
   existirem, `inventario` e `principios` vêm antes de qualquer `desenhar`.
3. `docs/HANDOFF-WIREFRAMES.md` — o estado combinado com o dono.

## Comandos
- **`start`** — inventário (cartógrafo) ∥ princípios (curador); depois `desenhar` fluxo a
  fluxo na ordem de frequência (W5), `criticar` cada um, `decidir`, checkpoint com o dono.
- **`inventario`** — `soulmon-screen-cartographer` deriva a lista do `03-FLUXO` (não percorre
  o app; mede o doc, que já cita o código).
- **`principios`** — `design-curador-padroes` destila Mobbin + estudos + decisões em regras
  por família de tela, cada uma com procedência (W8).
- **`desenhar <fluxo>`** — `design-wireframer` faz o canvas do fluxo (skill `design`, cinza,
  todo estado, rodapé com a pergunta da tela e o que sai). Um fluxo por despacho.
- **`criticar <fluxo>`** — `soulmon-product-designer` (IA/fluxo) e `design-critic` (W1–W10,
  a11y) em paralelo; `soulmon-guarda-linha-vermelha` se a família toca perdão/recompensa/
  oferta/social.
- **`decidir`** — `soulmon-design-lead` escreve `DECISOES-WIREFRAME.md` (entra/volta/sai) e
  prepara o checkpoint. Apresente ao dono o canvas e a decisão, nunca opções soltas.
- **`identidade <fluxo>`** — Fase 2, só sobre fluxo `aprovado` no inventário:
  `soulmon-visual-designer` aplica tokens/tipografia/Visor. Aceite: recorte 200×200 + AA.
- **`status`** — a tabela do inventário e o que falta para o próximo checkpoint.

## Regras
- W1–W10 são critério de aceite. O `design-critic` é bloqueante.
- Canvas `.dc.html` em `docs/design/wireframes/`, um por fluxo, artboards 390×844.
- Fechamento pelo `soulmon-coordenador` (`/soulmon fechar`): portões, STATUS, PR + merge,
  `/manter-docs`.
