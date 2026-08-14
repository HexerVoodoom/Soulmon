# Spec — direção visual pixel-art (referências v1.2)

> Escrito pelo orquestrador a partir das referências que o dono enviou na sessão de
> 2026-08-14. Os agentes NÃO conseguem ver essas imagens; esta spec é a fonte da verdade
> textual. As folhas em `docs/ui-refs/*.png` são as versões que estão em disco.

## O que as referências mostram

**Ref A — splash / tela de carregamento (vertical, 768×1360).**
Fundo teal muito escuro com textura de ruído. Moldura completa de **cano de cobre** com
junções em cotovelo nos 4 cantos, **cristais ciano brilhando** nos cantos, e **vinhas/folhas
verdes** enroladas no cano (assimétricas, mais densas no topo-esquerda e topo-direita).
Logo "SOUL/MON": "SOUL" em letras vazadas com contorno ciano neon e brilho, "MON" em cobre
sólido com contorno escuro; uma **chama ciano** sai de trás do logo; abaixo, **trilhas de
circuito** ciano descendo como chuva de dados. Barra de progresso segmentada ciano dentro de
moldura de cobre, com `LOADING DATA...` acima e `SOUL_LINK ESTABLISHED` num chip abaixo.
No rodapé, três **cristais grandes** em pedestais de pedra ligados por correntes. Silhuetas
escuras de criaturas ao fundo, quase invisíveis. `VERSION 1.2` no topo.

**Ref B — UI Design Kit v1.2 (768×1360).** Painel único dividido em seções com títulos em
caixa alta ciano:
- **Palette & Typography**: `#0B3A40` (teal profundo), `#6EFFF8` (neon), `#C68642` (cobre),
  `#1E9EFE` (elétrico), `#0D0D0D` (sombra). Duas fontes bitmap: ciano com brilho para
  títulos, cobre/dourado para números e corpo. Caixa alta, serifa zero, contorno preto de 1px.
- **Buttons & States**: Normal / Hover / Active / Disabled, em Small / Medium / Large.
  Moldura de cobre com cantos chanfrados, preenchimento teal escuro; *hover* ganha borda
  ciano, *active* fica com preenchimento ciano sólido e texto escuro, *disabled* dessatura
  para cinza. Variantes com ícone à esquerda (Map, Bag, Inventory, Quests).
- **Icons & Items**: grade de ~20 ícones, cada um num **quadrado com moldura de cobre** e
  fundo teal — casa, perfil, mapa, alvo, saída, pena, chama, moeda, gema, fogo, poção,
  engrenagem, livro, engrenagem dourada, portal roxo, frasco verde, armadura vermelha,
  caveira, poção, X vermelho.
- **Progress Bars & Gauges**: HP **segmentado** (blocos discretos, não barra lisa) em ciano
  e em vermelho, cada um com ícone à esquerda; barra lisa azul; **XP** com régua numerada
  (0/50/100/150). Bloco **SOUL LINK**: grafo de nós — losangos de cristal ligados por linhas
  ciano brilhantes, um nó central maior.
- **Windows & Dialogues**: janela de inventário com barra de título ("INVENTORY"), botões
  minimizar/fechar, e **grade de slots vazios**. Toast "Achievement Unlocked" com cristal.
- **HUD elements**: minimapa, retrato, fila de slots.

**Ref C — Home com a UI aplicada (768×1360).** É o alvo funcional.
- **Topo**: chama ciano + "SOUL MON" à esquerda; à direita dois medidores rotulados
  `SOUL ENERGY` (ícone de chama) e `SOUL CRYSTAL` (ícone de cristal), cada um numa cápsula
  de cobre com o número.
- **Corpo esquerdo**: a **árvore de evolução como grafo vertical** — nós losangulares de
  cristal ligados por linhas; nós futuros escurecidos/apagados, o nó atual com **anel ciano
  brilhante** e o pet (grifo cobre) pousado nele. Fundo com circuito ciano tênue.
- **Corpo direito**: card **"DAILY RITUALS"** com moldura de cobre, cada linha = ícone +
  nome + subtítulo entre parênteses + **barra de progresso segmentada** + checkbox quadrado
  de cobre (marcado = check ciano). Botão largo `START CHALLENGE` embaixo.
- **Rodapé**: nav de 3 itens (HOME / COMMUNITY / SHOP), item ativo em ciano com brilho.

**Ref D, E, F — ícones de atributo e tela de detalhe.** Confirmam que os três atributos do
jogo têm ícone próprio: **Harmonia** (espiral dupla teal/cobre dentro de coroa de louros,
64×64), **Poder** (triângulo ciano neon com chama e cristal, moldura de cano nos cantos),
**Benevolência** (árvore-mãos segurando gota + coração). A tela de detalhe mostra: título
`ÍCONES & ITENS`, fileira de ícones emoldurados, o atributo grande num card, nome em caixa
alta + descrição entre parênteses ("Doador de Vida e Compaixão"), e **nav inferior em PT**:
Casa · Livro de Tarefas · Saco de Inventário · Mapa · Perfil.

## Como isso encosta no produto real (não é redesenho livre)

- A paleta **já é a do projeto**: o reskin de ago/2026 trocou roxo por teal/cobre nos
  tokens `--sm-*` de `src/index.css`. Isto é aplicação, não um novo rebrand.
- **Poder / Harmonia / Benevolência são os três galhos de evolução reais** do jogo
  (`utils/oracle.ts`, ritmo de cuidado desempata). Os ícones têm lugar de verdade na página
  de Evolução e no card de atributos — não são decoração.
- `SOUL ENERGY` = a barra de energia (requisito de tarefas do estágio).
  `SOUL CRYSTAL` = **Créditos** (moeda de dinheiro real) — **atenção ao guardrail**: as três
  moedas (Bits, Emblemas, Créditos) nunca podem se confundir visualmente, e Bits têm estilo
  próprio obrigatório (fonte de calculadora, sem ícone, `utils/currencies.ts`). Um HUD que
  mostre "SOUL CRYSTAL" com o mesmo cristal usado em outro lugar reintroduz o bug que já
  aconteceu. Há testes travando as fronteiras.
- `DAILY RITUALS` = as tarefas/atividades. O checkbox quadrado de cobre **precisa manter
  44×44 de alvo de toque** — foi corrigido nesta mesma rodada, depois de ter renderizado com
  2px em produção.
- A árvore de evolução como grafo é a página de Evolução, que hoje já mostra galho previsto
  e critério de desempate.

## Assets: o que já existe e o que falta

**Já em `src/assets/soulmon/` (gerados, a maioria SEM componente ligado):**
- `buttons/` — 12 PNGs: normal/hover/active/disabled × small/medium/large + `button-inactive-frame`
- `icons/` — ~60 ícones no estilo emoldurado (home, profile, map, gem, coin, flame, gear,
  lock, skull, potion, bell, clock, trash, search, globe, categorias de tarefa, jogos…)
- `progress/` — `bar-hp-segmented-cyan`, `bar-hp-segmented-red`, `bar-smooth-blue`, `bar-smooth-xp-cyan`
- `windows/` — `window-inventory-frame`
- `lines/` — as 6 linhas de criatura; `mascot-raven`; `bg/` de masmorra e torneio

**Ligado no código hoje: praticamente nada** — só `BottomNav.tsx` consome ícones
(`utils/iconRegistry.ts` documenta o resto como "gerado mas solto no bundle").
**Esse é o trabalho principal: ligar, não gerar.**

**Falta gerar:**
1. **Moldura modular de cano + vinha** em peças 9-slice (cantos, laterais, junções) — a
   folha `ref-asset-sheet-v1.png` traz "Modular Frame & Pipework" como *desenho*, não como
   peças recortadas.
2. **Fonte bitmap.** As referências usam fonte pixel caixa-alta. Decisão pendente: fonte
   livre (Press Start 2P / Silkscreen / m5x7, checar licença para uso comercial) ou arte.
   Sem isso a tela nunca "parece" a referência, por mais certo que esteja o resto.
3. **Ícones dos 3 atributos** (Poder / Harmonia / Benevolência) em 64×64 com alfa.
4. **Berço do pet** (`nest-base.png`) — o arquivo atual tinha xadrez assado nos pixels;
   recuperado por algoritmo nesta sessão, mas sobrou resíduo atrás da fumaça. Regerar limpo.
5. **Nós do grafo Soul Link** (cristal aceso / apagado / anel ativo) e as linhas.
6. **Barra de progresso segmentada** em variante fina para as linhas de ritual.

## Regras de implementação (não negociáveis neste repo)

1. `src/index.css` é Tailwind v4 **pré-compilado**. Classe utilitária que não está lá **não
   aplica nada**. Regra nova vai no fim do arquivo, e **variantes precisam ser aninhadas**
   (`&:hover`) — a forma plana passa despercebida pelo guard `src/index.css.contract.test.ts`.
2. Todo texto nasce em **EN** com par **PT-BR** (`language === 'pt-BR' ? … : …`).
3. Alvo de toque de ação primária ≥ 44px, `:focus-visible` presente.
4. Tema claro **e** escuro. As referências são escuras; o app tem os dois, e o tema claro
   não pode virar um tema escuro mal contrastado.
5. Nada de arte ou nome de franquia (`docs/Attributions.md`, há teste travando).
6. Asset shipado não pode ter fundo xadrez assado nem ser 100% opaco quando deveria ter
   alfa — foi um bug real encontrado nesta rodada.

## Critério de pronto

Screenshot do app ao lado da Ref C, mesma viewport, e a diferença legível é de **conteúdo**
(nomes de tarefa, criatura do usuário), não de **linguagem visual** (moldura, botão, barra,
tipografia, paleta, densidade).
