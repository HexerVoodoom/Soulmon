# Plano: molduras modulares e fundos dos modais (pedido do dono, 17/11/2026)

Estratégia e prompts planejados no Opus; execução em Sonnet (inventário, prompts por NPC, pós-processo) e Haiku (GUI do ChatGPT). Referência visual: print do modal "Mind Workshop" enviado pelo dono (madeira escura trançada, cantos com cristal turquesa, cipós finos de cobre/folha, placa de título em metal, miolo de pedra com runas em brilho fraco).

## Ordem de entrega (prioridade sobre os demais assets, exceto o Pódio)
1. **Kit de moldura** (aprovação do dono antes de qualquer fundo).
2. **Modais dos NPCs/prédios**: 1 fundo por NPC/prédio (inventário em `docs/modais/INVENTARIO-NPC-PREDIO.md`).
3. **Modais da Home** (fila central, `docs/FILA-DE-MODAIS.md`).
4. **Todos os demais modais**.
Cada etapa vai ao dono para aprovação **antes** de a próxima começar; o que o dono reprovar volta ao ChatGPT, não se improvisa com recortes (veto de 13/11 a molduras feitas de recortes).

## Kit de moldura (sem deformar; só repetir e emendar)
Peças, todas com **alfa real** (ChatGPT, uma imagem por conversa nova, `--background transparent`; nunca chroma), 1024 px de lado maior, na mesma luz (topo-esquerda):
| Peça | Uso | Regra |
|---|---|---|
| `canto` | 4 cantos (espelhado por código/Pillow) | cristal turquesa escuro + cipó; encaixa em haste de 96 px de espessura |
| `haste-h` | repetida na horizontal | **tileável**: bordas esquerda/direita idênticas; sem ornamento único no meio |
| `haste-v` | repetida na vertical | gerada à parte (rotacionar quebra a luz) |
| `emenda` | disco/medalhão que cobre a junção entre hastes e marca meio de lado longo | simétrico, sobrepõe 24 px de cada lado |
| `placa-titulo` | tampa de título (extremos + miolo esticável por haste curta) | miolo vazio para texto |
| `miolo-tile` | fundo base do painel: pedra com runas fracas | tileável, baixo contraste, usado em 8–12% de opacidade |
Pós-processo (Sonnet, Pillow): tornar a haste realmente tileável (crossfade 15% nas pontas), validar costura repetindo 4× e abrindo a imagem, gerar espelhados, exportar WebP em `E:\Soulmon-assets\modais-moldura\kit-v1\`, `registro.jsonl` + `meta.json` com prompt e tags (regra de 09/11). Instalação no repo só após aprovação.

### Prompt base do kit (EN, substituir [PEÇA])
"Game UI frame piece for a dark-fantasy cozy RPG mobile modal: [PEÇA]. Dark carved wood with thin twisted vines, small copper accents, deep dark turquoise glowing crystal gems, tiny leaves used sparingly, hand-painted 2D game-asset style, crisp edges, soft top-left light. Same material and palette as the reference image. Transparent background. No text, no characters, no drop shadow outside the piece. [REGRAS DA TABELA]." Anexar sempre o print do dono como referência de estilo (identidade UI = USAR bloco de identidade; sem engrenagem).

### Ajuste do dono (17/11/2026): identidade mecânico-digital
Os cantos podem ficar só com cristal e cipó, **mas as hastes (barras de alongamento) levam a identidade**: placas de cobre aparafusadas, canos de cobre finos e linhas de circuito digital correndo ao longo da barra, com pontos de luz turquesa; a `emenda` também (placa de cobre com nó de circuito). O `miolo-tile` e os fundos ganham uma **malha digital** muito tênue (linhas de circuito/grade, brilho turquesa fraco) por baixo da pedra e das runas. Continua valendo: sem engrenagem, tudo ligado por cabo, e a malha do fundo discreta (opacidade final baixa). Vale também para as hastes do kit dos cards.

### MUDANÇA DE ROTA (17/11/2026): o kit v1 montado ficou "bem ruim"; vale a referência do dono
O dono reprovou a composição do kit v1 e pediu algo **bem mais parecido com o print do Mind Workshop**, autorizando explicitamente **usar o próprio print: remover o conteúdo e recortar os assets dele** (modal, cards dos minijogos e qualquer conteúdo interno). Isso revoga o veto de 13/11 a "recortes" para este caso.
Rota nova: (A) recortar direto do print (CPU, já) → protótipo 9-slice (`border-image`) do modal e do card; (B) quando o PC estiver livre, pedir ao ChatGPT que **edite o print removendo todo o conteúdo** (modal vazio e card vazio, em alta resolução) e fatiar dali em 9-slice. O kit v1 (cantos/hastes geradas) fica de reserva.

## Kit de moldura dos CARDS (pedido do dono, 17/11/2026)
Mesma família do kit dos modais (mesmo material, paleta e luz), mas **menor e mais fina**, para cards de jogo/atividade como os do "Mind Workshop" (arte no topo, placa de nome embaixo, placa de pergaminho com a descrição, pílula de recompensa). Mesmo método: alfa real, 1 imagem por conversa, referência = o print do dono.
| Peça | Uso |
|---|---|
| `card-canto` | 4 cantos (espelhado), cristal turquesa pequeno, borda de ~40 px |
| `card-haste-h` / `card-haste-v` | bordas repetíveis, tileáveis, finas (~28 px) |
| `card-badge` | selo quadrado do canto superior (número/nível), com cristal |
| `card-placa-nome` | faixa de metal/madeira com pontas em chanfro, miolo vazio para o título |
| `card-placa-desc` | placa de pergaminho/pedra clara para a descrição, miolo vazio, pontas simples |
| `card-pilula` | pílula escura para recompensa ("up to" + moeda), miolo vazio |
Saída: `E:\Soulmon-assets\modais-moldura\kit-card-v1\`. Vem depois do kit dos modais ser enviado, no mesmo lote de aprovação.

## Fundos por NPC/prédio
- 1 por NPC/prédio, retrato 9:20, **discreto**: pouca luz, sem texto, sem personagem, sem rosto, centro calmo (o conteúdo do modal vai por cima), uso em **opacidade 10–18%** (o asset sai opaco; a baixa opacidade é do CSS).
- Cena = interior/entorno do prédio visto de longe e desfocado, paleta do prédio + um acento turquesa; **acento Soulmon sutil** (1–2 cristais ou fio de circuito), nunca em todos.
- Prompt-modelo: "Soft, dim, out-of-focus background plate of [LOCAL DO PRÉDIO], vertical 9:20, very low contrast, dark teal and [COR DO PRÉDIO] palette, subtle depth, no text, no characters, no UI, calm empty center for overlaid content. Hand-painted 2D game background style."
- Prompts finais por prédio saem do inventário (agente Sonnet), com tags para o Banco de Assets.

## Decisões do dono (17/11/2026, em modal)
- Fundos: **26 próprios, um por lote**, começando por 3–4 de amostra para aprovação.
- Arquivo e Círculo de Amigos **herdam** o fundo do lote-pai.
- Perfil: fundo genérico discreto (turquesa + malha digital).
- Telas cheias **entram agora**: Fenda, Calabouço, mapa do Soulsmith e Arena livre ganham fundo próprio e moldura de tela cheia (total: 30 fundos). Como não passam por `AreaSheet`, o inventário precisa de 4 linhas novas e a moldura é aplicada no componente de cada tela.

## Decisões do dono (17/11/2026, tarde)
- **Fundo customizado por NPC/prédio APROVADO** (as 4 amostras agradaram). A **pedra com runas e circuito** (`E:\Soulmon-assets\modais-moldura\bg-pedra-runas.png`, enviada pelo dono) fica para modais **genéricos ou sem prédio específico** (inclui o Perfil: sai a linha `perfil-generico`).
- **A moldura tem de ser SÓ moldura**: o painel editado traz o miolo preenchido e isso estraga a integração com o fundo. Todo kit final = moldura com **centro transparente** (9-slice), o fundo entra por baixo por CSS.

## Referência da Home: pasta "Files" (bottom sheet)
Print do dono em `E:\Soulmon-assets\modais-moldura\referencia-home-pasta-files.png`: sheet que sobe de baixo, borda superior com filete de cobre, alça, título em serifa dourada, abas (Food and Chips / Specials / Materials), grade de itens em cards escuros. Para a etapa 3 (Home): a moldura de sheet precisa de **haste superior + alça + cantos superiores** (a base é cortada pela tela), e o fundo do corpo recebe a malha digital tênue em vez de cor lisa. Os cards de item usam o kit de cards.

## Execução
- ChatGPT desktop pelo Haiku (monitor separado, aguardar o dono liberar o PC), salvar e **apagar a conversa**; limpar uploads a cada ~50 gerações.
- Passa pela squad-design e entra em `docs/ASSETS-A-GERAR.md` antes de gerar.
- Aprovação: enviar lotes ao dono (SendUserFile) — kit primeiro, depois 3–4 fundos de amostra, depois o resto.
- Código dos modais (CSS 9-slice por hastes repetidas) só depois da aprovação do kit.
