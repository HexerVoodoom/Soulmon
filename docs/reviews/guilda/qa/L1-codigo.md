# Guilda / Grupo — L1 revisão de código adversarial (29/09/2026)

Escopo: `src/components/guild/GuildSheet.tsx`, `src/components/CoopPanel.tsx`, `src/utils/community.ts` (coop*),
`src/components/nav/AreaView.tsx` + `AreaSheet.tsx` (abertura/voltar), `src/utils/areaSheetCopy.ts`, `areaNpcVoice.ts`,
`functions/api/community.js` (ações coop*, `vistaDoGrupo`), `functions/api/_coop.js`, `account.js` (export/exclusão).
Nenhum código de produto foi editado.

Contagem: **FATAL 0 · ALTO 3 · MÉDIO 7 · BAIXO 6**

Testes rodados: `npx vitest run functions/api/community src/components/CoopPanel src/components/arena src/components/play src/utils/community`
→ **12 arquivos, 148 testes, todos verdes** (só avisos "Could not parse CSS stylesheet" do jsdom).

## Camada do mapa / voltar
- A folha da Guilda é conteúdo do `AreaSheet`, que registra `useBackLayer(open, onClose)` e Escape — **o voltar do Android fecha a Guilda**. Nenhum listener próprio no `GuildSheet`/`CoopPanel` (nada a vazar). O `useEffect` de carga tem guarda `vivo`. OK.
- `GuildSheet` é um repasse puro; Arena e Hall montam a MESMA folha (cada abertura refaz `getCoop` — aceitável).

## Achados

### ALTO-1 — "apareceu hoje" e a semana usam o dia UTC do servidor, não o dia do jogador
`functions/api/community.js` › `today` / `_coop.js` › `semanaDe`, usados em `coopCheckin` e `vistaDoGrupo`.
Cenário: jogador em BRT cumpre a meta às 21:30 (00:30 UTC do dia seguinte) e marca presença; o check-in grava o dia UTC de amanhã.
Na manhã seguinte (BRT) o painel mostra "apareceu hoje" (é o mesmo dia UTC) e o botão some — ele NÃO consegue marcar o dia real;
e quem marca entre 21h e 24h de domingo BRT cai na semana ISO seguinte (progresso da semana errado). Viola a linha 🧮 do CLAUDE.md
(dia do jogador em fuso fixo, `playerDayKey(now, playerDayTz)`).
Correção mínima: cliente envia `playerDayTz` (ou o `dayKey` já calculado) no `coopCheckin`/`coop`; servidor valida o formato e
aceita apenas dia dentro de ±1 do UTC, usando-o para `includes(hoje)` e para a chave da semana. Teste com relógio 23:30 BRT.

### ALTO-2 — duplo toque em "Criar" cria dois grupos e deixa um órfão por 120 dias
`CoopPanel` › `agir` (o `disabled` só vale após o re-render) + `community.js` › `coopCreate` (checagem `grupoDe` sem CAS).
Cenário: dois toques no mesmo frame (ou duas abas) → as duas requisições passam por `grupoDe == null`, cada uma cria grupo+código;
o segundo `coopOf` vence. O primeiro grupo fica com `members:[id]`, código válido e vivo por 120 d: quem recebeu esse código
entra num grupo cujo único membro "não está lá" (o `grupoDe` do criador aponta para o outro); a exclusão de conta
(`coopLeave`) só limpa o grupo apontado, deixando o outro com o saveId do titular apagado.
Correção mínima: (cliente) `useRef` de trava síncrona em `agir`; (servidor) após `gravarGrupo`, reler `coopOf:<id>` e, se não
apontar para o grupo novo, apagar blob+código do novo e responder 409.

### ALTO-3 — `vistaDoGrupo` REESCREVE o perfil de outros membros num GET
`community.js` › `vistaDoGrupo` → `ensurePid` (faz `putProfile` + reindex quando o pid é legado).
Cenário: A abre a Guilda enquanto B (pid legado) está sincronizando o perfil (`action=profile`); A lê o perfil de B, gera pid
novo e grava de volta a cópia velha → perde a atualização de B (apelido/amigos/`giftLog`) e troca o pid público de B sem B agir
(links/convites com o pid antigo morrem). Leitura com efeito colateral sobre dado de terceiro, sem autorização dele.
Correção mínima: em `vistaDoGrupo` usar só `perfil.pid` se não-legado, senão `null` (ou o mesmo caminho só-leitura do diretório);
migração de pid só no próprio `profile` POST do dono.

### MÉDIO-1 — exportação de conta não inclui nada do grupo
`account.js` › export (`data: {...}`) — `coopGroupId` é coletado em `coletar` e listado no `plan` da exclusão, mas não sai na
exportação: nem `coopOf:<saveId>`, nem `coopCk:<gid>:<saveId>` (os dias em que a pessoa marcou presença), nem o nome do grupo.
Exportação e inventário de exclusão divergem — contra o próprio comentário "conferível contra o inventário".
Correção: acrescentar `[coopOfKey]`, `[coopCkKey]` (registro bruto) e `{ id, name }` do grupo (sem saveIds alheios).

### MÉDIO-2 — corrida sair × entrar apaga a entrada (ou o grupo inteiro)
`_coop.js` › `coopLeave` grava o blob lido no início (`gravarGrupo(env, g)`) sem reler; com 1 membro, `delete(coopKey)`.
Cenário: B entra pelo código enquanto A (único membro) sai → A apaga blob+código depois do `put` de B; B recebeu 200 (a confirmação
de `coopJoin` releu antes do delete) e na próxima abertura o grupo "evaporou". Com 2+ membros, A regrava a lista sem B.
Correção mínima: em `coopLeave` reler o grupo imediatamente antes de gravar/apagar (como `renovarPrazos`) e só apagar se a
releitura ainda estiver vazia.

### MÉDIO-3 — jogador sem login vê "não deu para falar com o servidor" e um formulário que nunca funciona
`CoopPanel` › `useEffect` (catch → `setGroup(null)` + erro de rede) + `denyUnlessOwner` (401/400 para save anônimo).
Cenário: jogador demo/sem conta abre a Guilda: mensagem falsa de rede, e "Criar"/"Entrar" ficam ativos e falham com
"Não deu certo agora". Correção: `call` expor o status; 401/403 → texto "Entre com sua conta para ter um grupo" (PT/EN) e
esconder os formulários.

### MÉDIO-4 — falha de carga é tratada como "sem grupo"
Mesmo `useEffect`: erro transitório vira `group=null`, e a tela convida a CRIAR grupo a quem já tem um; o clique volta
"Você já está num grupo" sem caminho para recarregar. Correção: estado `erro-de-carga` separado com botão "Tentar de novo".

### MÉDIO-5 — erros do servidor sem tradução específica
`CoopPanel` › `agir`: `join collision` (o próprio servidor diz "tente de novo"), `no group` (grupo apagado por outro membro
enquanto a tela estava aberta), `invalid name`, `try again`, `account-deleted` e `429` caem na frase genérica; em `no group`
a tela continua mostrando o grupo morto. Correção: mapear `no group` → recarregar (`getCoop`) e `429` → frase de espera.

### MÉDIO-6 — tela fica com grupo velho: sem refetch ao reabrir / voltar ao app
`CoopPanel` só busca no mount. Com a folha aberta (ou o app em segundo plano) os check-ins dos outros e a virada da semana
não aparecem; a virada da semana com a folha aberta mostra o progresso da semana anterior. Correção: refetch em
`visibilitychange` (com guarda `document.hidden`) — sem timer.

### MÉDIO-7 — o gate "meta do dia cumprida" é só do cliente
`coopCheckin` não confere nada; qualquer POST marca presença. Declarado de propósito no comentário do bloco (não há economia
ligada). Registrar como risco aceito: se §5.2 (recompensa do grupo) for decidido, isto vira ALTO. Sem correção agora.

### BAIXO-1 — `setTimeout` do "copiado" não é limpo no unmount
`CoopPanel` (botão de copiar). Fechar a folha em <2s → `setState` em componente desmontado (inofensivo no React 18, mas é o
padrão que o projeto proíbe em outros lugares). Correção: `useRef` do timer + limpeza no cleanup.

### BAIXO-2 — `agir` faz `setGroup/setErro/setOcupado` após unmount
Fechar a folha durante a requisição. Mesma correção: ref `vivo` compartilhada com o efeito.

### BAIXO-3 — `role="status"` montado junto com o conteúdo não é anunciado
`CoopPanel` (meta batida). Região viva que nasce já preenchida normalmente não é lida; e ao marcar o check-in que bate a meta ela
aparece junto. Correção: container `role=status` sempre montado, texto entra depois.

### BAIXO-4 — "Criar um grupo" é `<label>` fazendo papel de título
A11y: o leitor anuncia como rótulo do campo (correto), mas não há heading da seção; e o `role="progressbar"` não tem
`aria-valuetext` ("3 de 10 nesta semana" / "3 of 10 this week"). Correção: `aria-valuetext` bilíngue.

### BAIXO-5 — código inválido de 8 chars com caracteres fora do alfabeto
Campo aceita `0/O/1/I` (o alfabeto os exclui); digitar "O" no lugar de "0"... o botão habilita e o servidor responde "código
não existe". Correção: normalizar `0→O`? não — o alfabeto não tem nenhum dos dois; filtrar `[^A-HJ-NP-Z2-9]` no `onChange`.

### BAIXO-6 — `semanaDe`/`today` recalculados em chamadas diferentes da mesma requisição
`lerCheckins` e `gravarCheckins` chamam `semanaDe()` separadamente; uma requisição que atravessa a virada (00:00 UTC de segunda)
pode ler semana N e gravar semana N+1 com os dias da N. Janela de ms, correção trivial: calcular uma vez e passar.

## O que os testes NÃO cobrem
- Fuso/dia do jogador no check-in (ALTO-1); virada de dia UTC ≠ dia local.
- Criação concorrente / duplo toque (ALTO-2); corrida sair×entrar (MÉDIO-2) — só join×join e checkin×checkin estão cobertos.
- `vistaDoGrupo` com membro de pid legado (efeito colateral de escrita, ALTO-3).
- Exportação de conta com grupo (MÉDIO-1); exclusão de conta com grupo está só no inventário, não em teste de `coop`.
- 401/sem login e falha de carga no `CoopPanel` (MÉDIO-3/4); erros `no group`, `join collision`, 429.
- Voltar do Android fechando a folha da Guilda especificamente (há teste genérico de Escape no `areaShell`, nenhum com `lotId='guilda'`);
  `arenaSheets`/`playArea` só passam `guild` como prop, nenhum abre a Guilda.
- Unmount durante ação/timer (BAIXO-1/2); `aria-valuetext`.
- Rate limit das ações coop (usam o teto LEVE 120/min/IP — suficiente contra força bruta de código de ~40 bits, mas sem teste).
