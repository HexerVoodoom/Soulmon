O relatório foi entregue ao agente que me chamou, com as onze seções pedidas, e não alterei nenhum arquivo do repositório.

Quatro achados mudam o ponto de partida da Guilda:
- **Guilda já existe como lugar do mapa.** `src/components/guild/GuildSheet.tsx` só renderiza `CoopPanel`, e a Arena e o Hall abrem a mesma folha. A Guilda é o grupo cooperativo com outro nome.
- **O teto atual é 4 membros, não ~20.** `COOP_MAX_MEMBERS = 4` em `functions/api/_coop.js`, e a copy e os testes assumem 4.
- **O nome do grupo não passa por `_redact.js` nem `_aiGuard.js`.** Só recebe `replace`, `trim` e `slice(0, 24)` em `coopCreate`, embora o `docs/PLANO-COOP.md` prometesse o contrário.
- **A Camada 3 está congelada, e o coop está listado nela.** O congelamento vale até 10 usuários com 14 dias de dado (`docs/REGISTRO-DE-DECISOES.md`, linha de §5.6, não §5.5). O commit da Guilda no mapa é de 29/09/2026, posterior à decisão.

Não existe termo canônico de grupo, guilda, horta ou vila no vocabulário da §12 de `docs/NARRATIVA-E-UNIVERSO.md`. Também não existe nenhum evento de telemetria de coop, guilda ou PvP.