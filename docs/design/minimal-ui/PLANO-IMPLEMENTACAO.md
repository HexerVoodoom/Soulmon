# Plano de implementação — Home + Mapa (23/09/2026)

Levantamento do que é preciso para a arquitetura aprovada no [README.md](README.md) funcionar de ponta a ponta
no app real. Mapeado contra o código em `7e1fa45d`. Nada disto está implementado ainda.

Ordem pensada para cada fatia ir para a `main` sozinha, com `tsc`/`vitest`/`build` verdes.

## 0. Decisões do dono antes de codar (bloqueiam fatias específicas)

| # | Decisão | Bloqueia |
|---|---|---|
| D1 | Exceção à regra "ícone nunca dentro de box" para os 3 cuidados e o voltar em círculo (ou redesenhar sem anel) | F2, F3 |
| D2 | Pixel art fora do visor (construções, NPCs, ícones) — exceção à regra da `/squad-arte` | F3, F4 |
| D3 | Moeda do Torneio: manter **Emblemas** no texto (recomendado — é o nome do campo e da regra) ou renomear para Honra | F5 |
| D4 | Escopo do Hall (hoje stub): Biblioteca/comunidade entra lá? | F6 |
| D5 | Nomes definitivos dos NPCs; onde entram a gata e o caranguejo | F4 (só texto) |
| D6 | Onde moram Configurações, Oráculo, Estatísticas, Créditos, Guia (menu ícone da Home) | F1 |

## F1 — Navegação: duas telas de topo

- `ViewType` (`src/components/BottomNav.tsx`) e `currentView` (`App.tsx`): trocar as 5 abas por
  `home | map | area:<mercado|jogos|arena|exploracao|laboratorio|hall>`.
- Remover a `BottomNav`; Home ganha o link do mapa (canto inferior direito), o Mapa ganha o da casa.
- Menu ícone da Home abre folha com os itens que moravam no hambúrguer da nav (D6).
- Botão voltar do Android (Capacitor `backButton`): área → mapa → home.
- **Testes que quebram e precisam ser reescritos, não apagados**: `BottomNav.render`, `navRotulo`, `iconScale.contract`,
  `iconInventory`, `foundation.render`.

## F2 — Home (abordagem B)

- `CompanionHUD`: faixa de cenário de ponta a ponta, pet grande, HP/EN embaixo à esquerda, 3 cuidados embaixo à
  direita (mochila, lua/sol, banho). Brincar e carinho seguem no gesto sobre o pet.
- Lista de tarefas do dia (reaproveita `DailyRituals`) com contador feito/total e **botão +** que abre o
  `CreateModal` existente.
- `ChatBox` sempre aberto, formato `>_` com cursor piscando à esquerda (some ao digitar).
- **Mochila** (folha nova): abas "Comida e chips" / "Especiais", dados de `foodInventory`.
- **Arrastar item até o pet** (pointer events; fantasma segue o dedo; folha desce durante o arrasto; soltar sobre o pet
  chama o `handleFeed` atual → `specialItemUse`/`careRules`). Tocar sem arrastar não usa. Precisa de alternativa
  acessível (teclado/leitor de tela: botão "usar" no foco do item).
- Estados: HP/EN baixos, dia completo, dormindo, pet respondendo, mochila vazia (mocks em `home/estados/`).
- **Testes**: `CompanionHUD.*` e `emojiSuportado`.

## F3 — Mapa

- Tela nova `MapPage`: fundo 9:16 cobrindo (`object-fit: cover` centrado), 6 construções posicionadas em % do fundo,
  cada uma um botão com rótulo curto; saldo das moedas num menu discreto.
- Cantinho inferior esquerdo levemente escurecido, casa com brilho leve.
- Assets: `bg-mapa` + 6 zonas v4 → `src/assets/soulmon/mapa/` em WebP (o build converte).

## F4 — Molde de área + NPCs

- Componente `AreaScene`: fundo, título centralizado, voltar em círculo, construções que abrem `AreaSheet`.
- `AreaSheet`: bottom-sheet com `min-height`, NPC da loja atrás/acima, sobe o bastante para não ficar baixo demais.
- NPC anfitrião com balão de fala grande (a fala sai do `petVoice`/copy PT+EN, não inventada no componente).
- Assets: 9 NPCs de `npcs/final` → `src/assets/soulmon/npcs/`.

## F5 — Áreas, uma por fatia

| Área | Conteúdo | Vem de |
|---|---|---|
| Mercado | 4 modais: Itens, Decoração, Background (abas por moeda), Conquistas (filtro por categoria) | `ShopModal` quebrado por segmento; Conquistas = `missions.ts` |
| Arena | Torneio (faixas, ranking, Emblemas, missões semanais, loja de Emblemas) + Duelo | `TournamentPage`, `tournamentTiers`, `weeklyMissions`, `ArenaGame` |
| Exploração | Masmorra + Corrida do Dino | `DungeonGame`, Dino de `ActivitiesPage` |
| Jogos | Pedra-papel-tesoura | `ActivitiesPage` |
| Laboratório | a página de Evolução com o topo novo | `EvolutionPath` |
| Hall | stub até D4 | `LibraryPage`? |

Regras que continuam valendo: as três moedas nunca se misturam visualmente (`currencies.ts`), a aba de Emblemas só vende
cosmético, Glitchtama nunca à venda, Coraçãozinho fora da vitrine. **Testes**: `ShopModal.*`.

## F6 — Fechamento

- `assets.contract` (todo asset referenciado existe e é nosso).
- Copy PT+EN de tudo que é novo; `narrativa.contract` para vocabulário.
- Rodar `/manter-docs`: `03-FLUXO-DE-TELAS.md` muda por inteiro, `INVENTARIO-WIREFRAMES.md` ganha as telas novas.
- `CACHE_VERSION` em `public/sw.js`.
- Screenshot Playwright de cada tela antes de declarar pronto.

## Arte que ainda falta

A fila e o custo estão em [BACKLOG-CREDITOS.md](BACKLOG-CREDITOS.md) (17 peças, ~110 créditos + margem). F1–F4
não dependem dela; F5 usa placeholder onde a peça não chegou (fundos de Arena/Laboratório/Hall, ícones de item,
insígnias, moedas).
