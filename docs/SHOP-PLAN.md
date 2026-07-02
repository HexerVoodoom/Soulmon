# Loja de pontos 🎖️ — v1 IMPLEMENTADA (chips, emblemas, cenários) — ideias futuras abaixo

Os minijogos da página Atividades acumulam `gamePoints` (GameState, cloud-synced).
Este documento guarda a direção combinada com o dono do projeto para a futura loja.

## Ganho atual (balanceamento v1)

| Jogo | Pontos | Ritmo aproximado |
|---|---|---|
| ⚔️ Masmorra | 4/6/8/10/12 por inimigo + 10 bônus de clear (máx. 50/run) | ~5 min/run completa, alta habilidade |
| 🦖 Dino | floor(score/100) por corrida (score ≈ 10/s) | ~6 pts/min de corrida boa |
| ✊ PPT | 5 por partida vencida (melhor de 5) | ~40s/partida, sorte (~50%) |

## Itens planejados (ideias do dono, estilo Digimon World 1)

1. **Itens equipáveis que influenciam a PRÓXIMA evolução**
   - Ex.: *Fantasia de Monzaemon* — equipável no nível champion; ao digivolver, vira Monzaemon.
   - *Digimentals*, *Banana de Aço* etc. — pesquisar a lista de itens de evolução do
     Digimon World 1 (PSX) como referência de nomes/efeitos.
   - Mecânica: item equipado (novo campo `equippedItem` no GameState) tem prioridade
     sobre o cálculo normal de galho na hora da evolução em `useDailyReset`/`getNextEvolution`.
2. **Chips de atributo** — compram pontos de vacina/vírus/dado para manipular o
   resultado da evolução independente das tarefas feitas (soma em
   `attributesSinceLastEvolution`).
3. **Skins temáticas para o app** — novos temas além de default/win98/glitch
   (o tema já é um enum; skin comprada desbloqueia opção nas Configurações).
4. **Backgrounds para o box do Digimon** — alternativas ao `bgCyberpunk` do
   CompanionHUD (campo `equippedBackground`, mapa de assets).

## Preços (proposta inicial — validar com o dono)

- Background: 30–60 🎖️ · Skin de app: 100 🎖️ · Chip de atributo: 40 🎖️ (+3 no atributo)
- Item de evolução (muda a próxima digivolução): 150–250 🎖️ conforme raridade.
- Referência de renda: jogador ativo ganha ~30–60 🎖️/dia.

## Regras ao implementar

- Loja = nova aba/card na página Atividades (ou seção própria).
- Compras/equipados vão no GameState (sincronizar via cloud save; fallback `?? []`).
- Atualizar GuideModal/HelpModal e a tabela do CLAUDE.md.
