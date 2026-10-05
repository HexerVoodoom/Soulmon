# Story PR5 — PvP/Torneio no núcleo v3 com paridade e clamp (run `combate-v3-01`, Builder)

## O que construir
O duelo do Torneio, incluindo o treino contra NPC, é decidido no servidor (`_duel.js`) pelo mesmo núcleo do cliente. A seed vem do servidor e os `combatStats` são recalculados e clampados no servidor. O cliente só exibe.

## Por quê
Esta é a superfície com o maior risco de trapaça e de dessincronia. Fica depois de PvE porque reaproveita o núcleo já exercitado e o `_soulXP.js` do PR2, que é necessário para o clamp S1.

## Símbolos donos
- `functions/api/_duel.js`: `simulateDuel`, `duelStats`, `STAGE_POWER`, `DUEL_HP_BASE`, `DUEL_DMG_SPREAD`, `DUEL_SPECIAL_MULT`, `DUEL_ENERGY_*`.
- O núcleo precisa existir em JS para o servidor: um espelho `functions/api/_combate.js` **ou** o import do mesmo módulo, decidido no PR (preferir fonte única, padrão `energia.ts` → `_duel.js`).
- `src/utils/tournamentNpcs.ts` › `npcAtk`; `TournamentPage.tsx`; `DuelScreen.tsx`.

## Decisões do dono aplicadas
- §5: paridade cliente/servidor travada por teste.
- §2.3 S1: `save.js` e `_duel.js` clampam `combatStats` (teto = base + ganho máx × dias de conta do servidor).
- §2.4: empate é resultado válido, e sai o desempate por %HP/seed.
- §2.9: o bônus de 5% vale **também** no PvP (decisão consciente, ~90% de vitória entre iguais). Até o PR7/PR8 o bônus é 0.
- §2.10: AR(1) com a seed do servidor.
- §4: duração PvP ~35–42 s.
- §23.4: o NPC é treino (não conta partida); `npcAtk ×0,85` vira "−N pontos".
- A torcida só soma, com teto `DUEL_CHEER_WINDOWS × DUEL_TAPS_CAP`.

## Critérios de aceite
1. **Paridade:** `duel.parity.test.js` dá o mesmo log de golpes e o mesmo vencedor no cliente e no servidor para N seeds × amostra de perfis vinda do módulo.
2. **Seed:** o servidor gera a seed, o cliente não consegue escolhê-la, e o teste de request forjado mostra a seed ignorada.
3. **Clamp S1:** um perfil com `combatStats` acima do teto é clampado ao teto (o valor é corrigido, não rejeitado), e um perfil válido passa intacto. **Prova de vermelho:** sem clamp, o teste com stats ×10 vence 100% e reprova.
4. `duelStats` deixa de usar `attrSum/50` (N17), para não ficar com duas fontes. Teste de grep.
5. Empate: o resultado `draw` existe, e Honra/pontos não sobem para nenhum lado. Teste da rota.
6. Duração mediana PvP entre 35 e 42 s (N declarado).
7. NPC: o treino segue sem contar partida (§23.4), e o teste existente continua verde.
8. tsc (app + server), vitest e build verdes.

## Estados de UI
Aguardando servidor (carregando), erro de rede (luta não acontece, nada é cobrado), offline (só treino local, rotulado), vitória, derrota, empate.

## Verificação
```
npx tsc -p tsconfig.server.json && npx vitest run functions/api src/utils/tournamentNpcs && npm run build
```

## Não-objetivos
Talentos PvP (PR7), equipamento (PR8), nome do especial (PR9), matchmaking/ranking.

## Dependências
PR1, PR2 (`_soulXP.js` para o teto). PR3 é recomendado (adaptador), mas não obrigatório.

## Riscos
- O teto S1 depende de "dias de conta do servidor". Se o servidor não tiver o histórico, o clamp vira teto do estágio (`levelCapFor`). Declarar no PR.
- 5% → ~90% de vitória (maior risco do gate). Aqui só se prepara o canal do bônus; o valor entra no PR7/PR8.
