# Beta12, frente GJ (balões dourados §G e tarefas linkadas §J): decisões e notas

Execução em 12/11/2026 pela frente GJ (worktree `b12-gj`, branch `feat/beta12-gj`). Todas as respostas recomendadas do backlog (Q1 a Q9) foram seguidas.

## §G, balões dourados
- **Sinal "Bosque sob ataque" NÃO exigiu servidor.** O `claPlantio` já devolve `underAttack` (planta de pé, não madura, atacada e sem proteção hoje). O hook `useGroveAtaque` só o lê (mesmas regras do `useGroveWatch`: só com memória de roda no aparelho, sem timer, chunk preguiçoso). Intervalo mínimo de 60 s entre consultas; relê ao voltar à Home. Nada de `functions/api` mudou, então a frente sai pela web.
- **Destino do Bosque:** `hall` > lote `grove`, sem pré-requisito. O portão das tarefas (`tendGate`, a fala da Lilia) continua DENTRO do Bosque, ao tentar defender; o balão só encaminha.
- **Achado da volta:** a volta da missão deixou de abrir o encontro (Mercador / Feira de verdade) sozinha. O encontro fica guardado em `achadoPendente` (memória do App) e o balão dourado o abre ao toque. Se o app for fechado antes do toque, o balão some e o encontro segue acessível pela sala da Feira (como já era). O toast de Bits do "achado" simples não mudou.
- **Fenda:** o toque abre o aviso existente ("Ele está na masmorra") com "Ir à Fenda"; o dia só é gravado ao ESCOLHER ir (`irAFenda`).
- **Persistência:** `GameState.balaoDourado` (chaves `balaoDourado:<tipo>:<AAAA-MM-DD>`), só o dia corrente (as de outros dias caem na gravação). Dia = `playerDayIso` (dia do jogador).
- **Falas:** fixas, calmas e sem número. A variação por personalidade (item B) entra depois por `balaoDouradoText`; não havia o que consumir ainda (G8 parcial).
- **Layout:** mesma faixa do balão comum, `z 25`, cede a vez enquanto o pet fala. Não toca o ponto de montagem do `ChatBox`.

## §J, tarefas linkadas
- **Id do Foco:** o backlog dizia `building:forja.foco`; o `BuildingId` real é `forja.oficina`, então o recurso é `building:forja.oficina`.
- **Mapa leve** `src/data/catalogResources.ts` (fora do chunk de entrada) + campo `resource` no catálogo; o contrato `catalogResources.contract.test.ts` mantém os dois iguais. Sono e água ficam sem link.
- **Check automático:** `autoCheck` no App grava a chave `<dia>|<id>` (`GameState.tarefaAuto`) ANTES de marcar e marca pelo mesmo `handleToggleActivityCompletion` (opção `{ auto: true }` só omite o Desfazer; a tag é o aviso). Gatilhos: passos (efeito sobre `steps`/meta/permissão), Caderno (o mesmo evento "registro novo" de `handleCaderno`), Foco (`FocusBoard.onFocusCycle` agora leva o id da tarefa da sessão; só `habit:<id>` de hábito de foco adotado marca).
- **Tag "Tarefa":** `TaskAutoTag` em `NoticeToast.tsx` (8 s, borda arredondada dourada, checkbox marcado, `pointer-events: none`); espera qualquer intersticial (`interstitial === 'welcome'`), uma por vez.
- **Não feito:** mostrar a fonte "Health Connect" na linha (o app não sabe se a leitura veio do Health Connect ou do contador do aparelho); revisão do `stepsConsentCopy` para cobrir "mostrar na tarefa e marcar sozinho" (texto de consentimento mexe em conformidade Play/LGPD: fica para o dono aprovar, ANTES de pedir a permissão de novo).
- **`steps.ts` regra 1** ganhou a nota da revisão do dono.

## Para o orquestrador consolidar
- `GameStateContext.hydrate.fuzz2.qa.test.tsx`: contagem de campos 185 → 187 (`balaoDourado`, `tarefaAuto`). Outras frentes que somem campos conflitam nesse número: somar no merge.
- `docs/manual/06-REFERENCIA/utils.md` e `hooks-contexts-types.md` ganharam as entradas dos 3 módulos novos (`docsManual.contract` cobra).
- Orçamento de bytes (`dist/` commitado) não foi remedido: o App cresceu poucos KB de fonte; remedir no build da beta12.
