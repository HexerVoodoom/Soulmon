# Story PR7 — Vínculo como level do usuário: talentos e gates (run `combate-v3-01`, Builder)

## O que construir
O Vínculo (`bondLevelFor`) é o level do usuário. Cada level dá 1 ponto de talento, gasto numa árvore PvP/PvE/Comércio que nunca dá para completar. Uma tabela única de gates define o Vínculo mínimo de Arena/PvP, Torneio, andares altos e Renascimento.

## Por quê
§2.8: o level do usuário é o Vínculo. Reusar o Vínculo evita um segundo level (`arquitetura-camadas` alternativa 1, rejeitada).

## Símbolos donos
- `src/utils/talents.ts` › `talentPointsFor(bondLevel)` + `functions/api/_talents.js`. Persistido só `talentPicks: string[]`.
- `src/utils/gates.ts` › `gateFor(feature, bondLevel)`. `meetsPvpBond` vira uma entrada dela. Espelho em `community.js`.
- `src/utils/bond.ts` (invariantes 3 e §6), `bond.test.ts`, `bond.recompensas.test.ts`.
- `src/utils/combate/` › `bonus()`: o teto `min(soma, 5%)` do PR1 recebe a parcela do talento.
- `src/utils/rebirthGate.ts`.
- `functions/api/save.js` + fuzz2 (campo `talentPicks`).
- `docs/REGISTRO-DE-DECISOES.md`: revogação com as alternativas que perderam.

## Decisões do dono aplicadas
- §2.8: revogam-se "recompensa do Vínculo só cosmética" e "escada de gates é grind". Isso fica registrado, e o invariante é **reescrito**, não contornado.
- §2.9: ~5% também no PvP.
- §2.10: Renascimento = pago + Vínculo, e o Vínculo nunca é pago.
- §6: `copy.semFomo`, sem cobrança.
- O Vínculo nunca desce (`bond.ts` invariante 1).
- Comércio = só preço/ganho de moeda ganha, sem % (default do gate).

## Critérios de aceite
1. `talentPointsFor(L)` = L (ou o declarado). Um vetor de picks inválido é **descartado** no servidor, não corrigido. **Prova de vermelho:** com 1 pick a mais que os pontos, o teste reprova.
2. Árvore "nunca suficiente": o total de nós custa > os pontos do Vínculo máximo. O teste lê os dois do módulo.
3. **Teto de 5% não empilhável:** com todos os picks + bônus fictício de equipamento/Renascimento, `bonus()` ≤5% (razão das médias, HP×3, N declarado). **Prova de vermelho:** sem teto, ≥+20%.
4. Gates: uma só tabela, `gates.parity.test.js` verde, e nenhum `bondLevel >=` solto fora de `gates.ts` (teste de grep).
5. Copy de gate e de talento passa no `copy.semFomo.contract.test.ts`. **Prova de vermelho:** "faltam só N!" reprova.
6. `bond.test.ts` reescrito para o invariante 3 novo. O REGISTRO ganha uma entrada com as alternativas perdidas. O PR mostra o diff do invariante.
7. Save: `talentPicks` é saneado em `save.js` e na hidratação, e o fuzz2 sobe exatamente +1.
8. PvP aplica o talento pelo canal do PR5, com paridade verde.
9. tsc, vitest e build verdes.

## Estados de UI
Árvore vazia (0 pontos), pontos disponíveis, todos gastos, gate fechado (texto neutro com o Vínculo pedido), erro ao salvar pick (desfaz local), offline (pick pendente, validado no sync).

## Verificação
```
npx vitest run src/utils/talents src/utils/gates src/utils/bond functions/api && npm run build
```

## Não-objetivos
Equipamento (PR8), slots pagos do Comércio (PR8), preço do Renascimento.

## Dependências
PR5 (canal de bônus no PvP), PR4 (gates de andar), PR2.

## Riscos
- D7: gate de Masmorra × "sem gate de entrada". Só andares **altos** recebem gate. O andar 1 continua livre (teste).
- Respec de talento não foi decidido. Default: sem respec. Pergunta ao dono.
