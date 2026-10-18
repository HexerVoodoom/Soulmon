# Pedido de revisão ao alpha-design-critic — frente A (Home, atividades, cenário)

Branch `feat/b2-home-atividades`. Capturas em esta pasta: `antes-*` (base `release/beta-2`) e `depois-*`. Preview 390×844, tema escuro, EN. Não disparei nenhum agente; isto é o que eu pediria.

## 1. Checkbox bronze (2.2) — a decisão que mais precisa de olho
- Bronze = `--sm2-check-fill`, alias de `--sm2-gold-fill` (#A2641F claro / #D9A05B escuro). Não existe token "bronze" no sistema; o ouro-cobre do visor é o mais próximo. Pergunta: o dono quer ESTE tom (cobre queimado, igual ao selo "Dia completo") ou um bronze mais escuro/fosco? Se for outro, é uma linha em `index.css` (`--sm2-check-fill`).
- Contraste do glifo `on-check` sobre o fill nos dois temas (claro: branco sobre #A2641F; escuro: #04211F sobre #D9A05B). Medir com o validador de contraste.
- Estado PARCIAL do pai (`aria-checked="mixed"`, borda bronze + traço). É invenção minha: a spec só pede "pai não conclui direto". Está legível em 24px? Alternativa: anel de progresso.
- O checkbox do pai é inerte, mas tocar abre os filhos (affordance). Isso se lê como "botão morto"? Alternativa: tocar não fazer nada e só o chevron abrir.

## 2. Perda do selo de tipo (tarefa/hábito)
Saiu o ícone `task_alt`/`event_repeat` da esquerda (o checkbox ocupa o lugar; `Tasks`/`Habits` já separam). Consequência: **editar** passou a ser o NOME (botão sem moldura), não mais o ícone da esquerda (decisão D2 de 01/10). Verificar: o nome parece tocável? Alvo de 44 de altura está garantido pela linha (min 56), mas a affordance é só o cursor/foco.

## 3. Hierarquia pai/filho
- Filhos recuados 52px (alinhados ao texto do pai), sem linha-guia. Em listas longas a árvore lê bem ou precisa de guia vertical fina?
- Chevron discreto (20px, `muted`) à direita. Aceitável como "controle discreto"? A recolha automática ao concluir tudo é invisível (sem animação, de propósito: não criei keyframe novo).

## 4. Cabeçalho Today / Goal (2.4)
- `Today` cromado = degradê vertical tinta→muted→tinta→muted por `background-clip: text`. Em fundo escuro lê quase como cinza liso; "cromado discreto" foi entregue ou ficou invisível demais? Reserva: `color: var(--sm2-ink)` onde não há `background-clip`.
- `Goal N` numa pílula de linha fina, separada da contagem (`1/5` em ouro). Separação suficiente para não confundir "5 atividades" com "meta 4"? PT: `Meta`. Oculto se a meta é 0.
- Valor exibido = `dailyTotal` (meta do dia ponderada por esforço, a mesma do selo "Dia completo"), não contagem de itens. Pode surpreender: meta 4 com 5 itens listados. Vale um rótulo/tooltip? (Eu não pus texto explicativo: o briefing pede minimalismo.)

## 5. Lista de hoje e View all (2.1, 2.3)
- Rótulos de seção `TASKS`/`HABITS` (xs, caixa alta, `muted`) dentro da lista: bastam como hierarquia?
- `View all →` fica sozinho no fim da lista, alinhado à direita, em `primary-ink`. Descobrível sem competir com o `+`?
- Tela cheia: sem título visível (só seta e `View today`); o nome acessível é "All activities". Falta título ou o contexto basta?
- Em `View all`, tarefa com início futuro aparece com tracejado + "starts Oct 19" (inerte); recorrência fora do dia fica `dimmed`. Dá para entender por que não dá para marcar?
- Gesto: horizontal em qualquer direção abre; na tela cheia, deslizar para a direita volta. Sem feedback visual de arrasto (sem animação nova). Aceitável ou o dono espera a tela acompanhando o dedo?

## 6. Cenário (2.5, 3.2, 3.3)
- Linha ciano divisória: era parte da ARTE pintada (todos os 19 cenários têm a faixa escura sob o chão em `GROUND_Y`). Removi com máscara em degradê na camada da arte + composição 20px mais baixa. Conferir os OUTROS cenários (floresta, deserto, neve, lava…) — só validei o quarto padrão. Em cenário de chão claro (deserto/neve) o degradê para o fundo escuro pode parecer pesado.
- HUD (HP/energia) e os 3 cuidados dentro do cenário: 36px de desenho, alvo 44 (invisível), ícones 24 (degrau da escala). "Reduzir discretamente": está discreto o bastante ou ainda pesa? Sobreposição com o rabo/pés do pet quando ele anda até o canto direito.
- Balão de fala: agora sobreposto no topo (3 linhas, reticências). Pode cobrir a janela redonda do quarto por ~5s. Aceitável? O "Evoluir" (z 30) fica acima do balão.
- Encaixes de fome e timer (`statsSlots`): reservados, sem desenho. Frente B decide o visual; sugiro texto `xs` na tinta do visor, sem caixa.

## 7. Não verificado visualmente
Tema claro; 360×740 e 412×915; PWA instalada; Android real; leitor de tela; `prefers-reduced-motion` (não adicionei movimento novo).
