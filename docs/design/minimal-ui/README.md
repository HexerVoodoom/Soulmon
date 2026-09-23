# Minimal UI — a nova arquitetura Home + Mapa (23/09/2026)

Proposta aprovada pelo dono, rodada a rodada, em 23/09/2026 com a SQUAD-Minimal-UI (instância da SQUAD-Alpha).
**Ainda não está no código.** Este diretório guarda o que foi decidido e o plano para implementar.

## Onde está cada coisa

| O quê | Onde | Por que fora do git |
|---|---|---|
| Mocks navegáveis (HTML) de todas as telas e estados | `D:\Soulmon\product\squad-minimal-ui\propostas\` (índice em `index.html`) | 36 MB de PNG/HTML com fonte embutida; mesmo precedente dos artefatos da squad-alpha |
| Arte gerada (originais, alfa real) | `E:\Soulmon-assets\iso-20260923\` | assets de trabalho; entram em `src/assets/` só quando implementados |
| Plano de implementação | [PLANO-IMPLEMENTACAO.md](PLANO-IMPLEMENTACAO.md) | — |
| Fila de geração e custo em créditos | [BACKLOG-CREDITOS.md](BACKLOG-CREDITOS.md) | — |

Para ver os mocks: servir a pasta de propostas (`npx serve D:/Soulmon/product/squad-minimal-ui/propostas`,
configuração `propostas-mui` em `.claude/launch.json` da raiz `D:\Soulmon`) e abrir `/`.

## O que o dono decidiu (23/09/2026)

1. **Duas telas de topo: Home e Mapa.** A barra inferior de 5 abas sai. Na Home, um único ícone de mapa no canto
   inferior direito; no Mapa, um único ícone de casa no canto inferior esquerdo.
2. **Home no estilo Pokémon Sleep** (abordagem B, venceu a do Duolingo): logo no topo, menu só ícone, faixa de cenário
   de ponta a ponta com o pet grande, HP/EN e 3 cuidados (mochila, lua/sol, banho) dentro da faixa, lista das
   tarefas do dia com botão de adicionar, e a barra de texto do chat **sempre aberta** embaixo, no formato de
   terminal `>_` (o `_` pisca junto do `>`).
3. **Itens se usam arrastando até o pet** (drag and drop), não tocando. Comida vai para dentro da mochila;
   a mochila tem abas (comida e chips · especiais).
4. **Mapa isométrico com 6 áreas**, cada uma abre sua própria tela: Mercado (caverna mecânica), Jogos
   (cogumelo), Arena (rocha de cristal), Exploração (portal etéreo), Laboratório (árvore — é a Evolução) e Hall
   (templo, social — escopo ainda aberto).
5. **Dentro de cada área, construções isométricas** que abrem um modal (bottom-sheet) com altura mínima; o NPC
   da loja aparece **atrás/acima** do modal. Mercado: Itens, Decoração, Background, Conquistas, cada um com abas
   por moeda (Conquistas filtra por categoria). Arena: Torneio (faixas + missões) e Duelo. Exploração: Masmorra
   e Corrida do Dino. Jogos: Pedra-Papel-Tesoura.
6. **Um NPC por área e por loja interna**, busto em pixel art com contorno preto, profissão explícita, criatura e
   elemento ligados ao prédio. Nomes provisórios (Grom, Vultrak, Brisa, Pipo, Lumi) — decisão do dono.
7. **Estética**: arcano-tech de sempre (teal escuro, cobre, cristais de alma, chamas turquesa), construções da
   linha "v4" (cada uma de um material: máquina, planta, mineral, etéreo). Toda arte com transparência sai com
   alfa real (`gpt_image_2 --background transparent`) — regra máxima do dono.
8. **Voltar** de qualquer área para o Mapa: setinha dentro de um círculo, canto superior esquerdo; título da área
   centralizado.

## Tensões com regras já escritas (precisam de decisão antes de codar)

- **"Ícone NUNCA dentro de box"** (CLAUDE.md, UI): os 3 cuidados da Home e o voltar em círculo usam fundo/anel.
- **"Pixel art só dentro do visor"** (`/squad-arte`): construções, NPCs e ícones pixel saem do visor.
- **Moeda do Torneio**: o jogo chama de **Emblemas** (`emblems`); os mocks usam **Honra**.
- **Configurações, Oráculo, Biblioteca e Créditos** moram hoje no menu hambúrguer da barra inferior; com a barra
  fora, passam para o menu (ícone) da Home.
