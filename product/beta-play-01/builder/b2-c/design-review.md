# Frente C (beta-2): resumos e modais — o que pedir ao alpha-design-critic

Branch `feat/b2-resumos-modais` (base `release/beta-2`). Screenshots antes/depois nesta pasta (`antes-*.png`, `depois-*.png`),
tiradas com o dev server do Vite + Chrome headless (500x900 @2x, tema escuro) sobre um harness descartável (não vai no PR).
O quadro de tremor (`depois-02`) é um frame congelado da animação; o movimento em si precisa de olho humano no aparelho.

## O que mudou (por item do backlog)

| Item | Antes | Depois | Imagens |
|---|---|---|---|
| 4.2/4.4 resumo | um diálogo central único com tudo (linhas, notas, aventura, humor, convite) | uma folha (ModalSheet) por seção: tarefas, corações, aventura, hoje | antes-01; depois-01..05 |
| 4.2 corações | texto "all there!/loosened" | fileira de 3 corações; o cobrado treme, quebra, vira preto | depois-02 (tremor), 03 (preto), 04 (reabrir, sem animação) |
| 4.3 aventura | card pequeno "From today's adventure · new" | folha própria com o NPC do Passeio (Brume), `New` dourado, bloco Missão/Destino | depois-05, 05b (PT) |
| 5.1 Passeio | bloco "Passeio livre" + 3 propostas; card ativo em duas etapas | só as propostas (missão + destino em destaque dourado discreto); card ativo com a missão em cima e o destino logo abaixo | antes-08/09; depois-08/09 |
| 7.1/13.1 novo prédio | diálogo central com busto | mesmo bottom sheet dos prédios/mercado (`AreaSheet`), NPC no terço de cima | antes-07; depois-07 |
| 7.2 level-up | caixa dourada com vidro, sunburst rígido, 5 linhas de texto | sem caixa, glow difuso, `Now Open` + nomes, setas sem corte | antes-06; depois-06 |
| 7.3 metas | `Assumir` por item, nasce desmarcado | `Add tasks to list`, tudo marcado, desmarca-se o que não quer | antes-10; depois-10 |

## Perguntas ao critic (em ordem de importância)

1. **Resumo em 3–4 folhas é demais?** Cada seção virou um passo com "Continuar". O dono pediu "um modal por seção", mas o custo é
   2–3 toques extras todo dia. Alternativa a avaliar: manter 3 folhas e fundir `hoje` (humor/convite) na dos corações.
2. **Folha dos corações vazia embaixo.** A fileira de 3 corações + uma linha deixa a folha baixa e o botão colado. Vale altura mínima ou
   um respiro? (o `ModalSheet` é por conteúdo; o `AreaSheet` é 2/3 da tela fixo).
3. **Coração preto = filtro CSS (`grayscale(1) brightness(.2)`) sobre o ícone `hp`**, sem arte nova. Lê bem como "preto" sobre o fundo
   escuro `#0f2a2a`? O contorno azul-marinho do ícone some. Se não lê, pedir ao squad de arte um coração preto de verdade.
4. **Tremor + quebra**: 650 ms de tremor e 350 ms de quebra (escala 1.25 → .92 com flash). Duração/ritmo certos? Não ficou "punitivo"
   para o dia ruim (L1/L4 da bíblia: constata, não pune)? Movimento reduzido pula direto para o preto.
5. **`New` dourado** (`--sm2-gold-fill` com `--sm2-on-gold`): contraste ok nos dois temas? Destino em `--sm2-gold-ink`: o mesmo dourado do
   `New` em dois pesos diferentes está coerente ou compete?
6. **Bloco Missão/Destino** na folha da aventura: a hierarquia (missão normal, destino dourado 600) deixa claro que a missão
   justifica o destino sem escrever "porque"? Ou precisa de um conector visual?
7. **Folha do novo prédio**: o corpo ficou quase vazio (kicker + 2 botões); o texto vive no balão do NPC, um por toque. Aceitável ou o
   balão deve virar texto dentro da folha?
8. **Level-up**: o glow (cian→dourado, 420 px, blur 10) ficou "difuso" o bastante e sem competir com o número? O `Now Open` em
   Silkscreen dourado + nomes em branco está legível a 14 px? O ícone das três setas está alinhado ao `LV 5` (centro)?
9. **Checkbox da meta**: usa a `CheckRow` do kit, que hoje é ciano (o bronze das caixas é da frente A / `.sm2-form-check`). Confirmar que
   herda o bronze quando a frente A fechar, sem override local.
10. **PT-BR**: títulos de seção (`Corações`, `Da aventura de ontem`, `Hoje`) e `Missão/Destino`, `Agora aberto`, `Adicionar tarefas à lista`.

## Fora do que foi pedido (decisões a confirmar)

- O "Passeio livre" (escolher destino sem missão) perdeu o botão: o destino agora é sempre o da missão. `setDestination` segue na lógica;
  quem não escolhe missão passeia para a última região definida/casa, como antes. Se o dono quiser o destino livre de volta, é um chip
  no card de proposta, não um bloco.
- Notas dos corações (maré, devolução, queda de forma) foram para a folha dos corações; notas de tarefa/meta ficam na de tarefas.
- `Evolution path` saiu também do modo acolhida (`Path kept`).
