# L3 — QA de experiência da Guilda (app rodando, ponta a ponta)

29/09/2026. Só-leitura: nenhum código de produto foi editado; `dist/` do repositório ficou intocado.

**Método.** Build de `HEAD` (`6abc35c1`) extraído com `git archive` para o scratchpad e buildado com `npm run build` ali (motivo: a árvore é compartilhada e outro agente rodou `git checkout -- dist` no meio do meu build, deixando um `dist/` velho — a primeira rodada foi descartada). `vite preview` (xdg-open falso) + Playwright/Chromium, 390×844, `hasTouch`. Save semeado por `addInitScript` (`soulmon_state_v1` + flags de onboarding, `catalogOnboardingSeenAt`); `/api/guild*` e o resto de `/api/*` mockados por `page.route` com um **servidor de estado** (vista no formato de `vistaDaGuilda`: `memberId`, `presence[]`, `raid`, `mine`, `gestures`, `gestureReceived`; erros 401/429/500/aborto/HTML/offline; resgate com falha de rede no 1º `guildClaim`).

**Matriz.** 35 estados × {pt-BR, en-US} × {claro, escuro} com auditoria de DOM em cada um (alvos < 44 px, texto cortado, `{n}`, "faltam", ícone em box, overflow horizontal, dígitos, PT em EN e o inverso) e contraste **medido por pixel** (Footgun 10) no texto da folha. Estados: sem guilda, carregando, criar (ok/500), entrar (ok/inválido/cheia/colisão/já em outra/429/nome), guilda de 1/2/4/5/12, os 5 estágios do Bosque (+ estágio 0), fio (meta não cumprida / cumprida / firmado), gestos (enviado / recebido ≤4 / recebido roda de 2), Feira (aberta / ferida / rodada feita / dissipada / recuou / semana passada dissipada / resgate / solo / sem guilda), 401, 429, 500, aborto, offline. Jornadas 1–8 abaixo em pt-claro, com EN-escuro nas que mudam de copy.

## Resultado das jornadas

| J | Jornada | Resultado |
|---|---|---|
| 1 | Descobrir (Mapa → Hall → lote "Salão da Guilda"/Marla) → criar → copiar código → sair | Funciona. Copiar entrega `ABCD2345` no clipboard e anuncia "Copiado". Sair é um toque. Falha: quem não tem conta cai num beco (A1) e o vazio não mostra o que se ganha (M1). |
| 2 | Segundo jogador entra por código | Funciona; campo só aceita o alfabeto (`abcd-234` → `ABCD234`), botão inerte até 8 (sem dica — B4). Erros com copy própria: inválido, cheia, colisão, 429, nome, já em outra (mostra a roda). |
| 3 | Cumprir a meta **no app de verdade** (marcar o hábito na Home) → Salão → "Firmar meu fio" → "O seu fio firmou hoje." | Funciona (servidor recebeu `guildThread`; sem o hábito marcado o botão não existe e nada cobra). Fila empilhada medida: **relatório diário → check-in → `groveMilestone` → (depois) o resto**, e o aviso "Novo estágio do bosque: Copa." já está na Home por trás. Ordem correta. |
| 4 | Feira: golpe → resultado → resgate (falha de rede, depois ok) → Concha → cenário da roda | Golpe: "A sua rodada chegou até ele." e o botão some. Resgate: 1º claim aborta → "Sem conexão. Nada mudou." + botão continua; 2º ok → "4 Emblemas colhidos" + Concha; save recebeu **4 Emblemas uma vez** e `trophy-concha-mare`. "Do bosque" no Background e na Decoração equipam (`aria-pressed`) e o Home passa a mostrar o cenário. |
| 5 | Sair e voltar | Sair limpa e volta ao formulário; guilda reaberta traz tudo (mock). |
| 6 | Voltar do Android | Folha → Hall → Mapa → Home, uma camada por vez (via `popstate`). Cerimônia não é camada (B6). O `backButton` do Capacitor não roda em Chromium. |
| 7 | Movimento reduzido | Nenhuma animação ativa na folha (`sm2-grove-bob` some); sem redução, as criaturas balançam a 1,6 s. Cerimônia sem `sm-milestone-pop`; a pausa continua (espera o botão). |
| 8 | Teclado e foco | Tab cicla dentro da folha (fundo `inert`), anel de foco 2 px `rgb(11,111,104)` em todos; Escape fecha e devolve o foco ao lote. Perde o foco ao enviar um gesto (M6). |

## Tabela estado/jornada × achado

| # | Estado / jornada | Achado | Sev. | Evidência | Correção mínima |
|---|---|---|---|---|---|
| A1 | J1 · 401 (sem login / demo) | "Entre na sua conta para chegar a uma roda." sem botão, sem `UnlockNudge`, sem caminho para a conta — e sem "tentar de novo". É o estado de quem chega **sem conta** (o caso do jogador novo do J1). A copy `guild.erro.demo` não foi implementada (`impl-notas-front.md` §4). | ALTO | `05-est-pt-claro-401-sem-acao` | Passar `accountTier`/`onUnlock` até a folha e trocar o 401 por texto + `UnlockNudge` (motivo próprio de telemetria); mínimo: botão que abre Configurações/login. |
| M1 | J1 · sem guilda | O vazio é só texto + dois formulários. O plano §5 promete "Clareira vazia no visor"; **não há visor**. Quem chega não vê o que ganha (bosque que cresce); a única explicação é a fala da Marla, meio atrás da folha, e "roda/clareira" não são definidas. Entende-se "criar" pelo botão, não o porquê. | MÉDIO | `01-j1-pt-claro-sem-guilda`, `02-j1-en-escuro-sem-guilda` | Desenhar o `GroveVisor` da Clareira (estágio 0, sem criatura de outro) acima do formulário, como o plano manda. |
| M2 | J4 · Feira **ferida** | O estado `ferido` só existe como menos barras no visor. Texto e `aria-label` ("Fenômeno da semana: Névoa") idênticos aos da aberta: não há copy, e quem não enxerga o visor nunca sabe. | MÉDIO | `18-j4-pt-claro-feira-ferida-sem-copy` (comparar com `pt-light-feira-aberta` no scratchpad) | Uma linha `guild.feira.ferido` (sem número, sem "faltam") e `aria-label` do visor com o estado. |
| M3 | Gestos recebidos | Chegam "em lote ao abrir", mas ficam em y≈553 de uma folha de 423 px (n=4) / 481 (n=2): **abaixo da dobra** e sem aviso no topo. Quem abre a folha não vê o que recebeu. | MÉDIO | `17-gestos-pt-claro-recebidos-abaixo-da-dobra` | Subir a linha recebida para logo abaixo do estágio (ou mover a fileira de gestos acima da lista da roda). |
| M4 | J4 · cenário da roda | "Do bosque" fica **no fim** da lista do Background, depois de ~20 cenários da loja e das missões; a cerimônia diz "Já está em Background" sem dizer onde. Na Decoração (lista curta) é visível. | MÉDIO | `21-j4-pt-claro-da-sua-roda-no-fim-da-lista`, `22-j4-pt-claro-concha-equipada` | Renderizar "Do bosque" no TOPO do Background quando houver item. |
| M5 | Roda de 2+ (regressão do L1 #15) | "Seguir o próprio caminho" exigiria rolar: altura útil 423 px × conteúdo 747 (n=2) / 846 (n=4) / 1200 (n=12) — o visor, os gestos e o Mural que a B1 trouxe desfizeram o fechamento do L1 #15. Alcançável, mas 2–3 telas abaixo (com 12, depois de 12 nomes + gestos + código + Mural). | MÉDIO | `09-roda-pt-claro-4-membros`, `10-roda-pt-claro-12-membros-fim-da-folha` | Sair dentro de Ajustes fixo no rodapé da folha, ou fileira de nomes compacta (grade) para 5–12. |
| M6 | J8 · teclado nos gestos | Enter num gesto o marca enviado e **desabilita** o botão; o foco vai para a raiz da folha (`DIV` 342×846, sem anel). Quem navega por teclado perde o lugar (o L1 #24 "foco em body" foi resolvido, mas cai no contêiner). | MÉDIO | `23-teclado-pt-claro-foco-no-gesto` | Manter o botão focável com `aria-disabled` (ou mover o foco para o próximo gesto/região de status). |
| B1 | Bosque estágio 0/1 e 5–12 | Estágio 0 (roda nova de 1): chão escuro liso com uma criatura e quase nada mais (placeholder em gradiente); não há título do estágio. Com 5–12 o visor mostra só a sua criatura: uma roda de 12 parece uma pessoa sozinha. Não achei texto "triste"; a percepção é de vazio visual. | BAIXO | `07-bosque-pt-claro-estagio0-solo`, `08-bosque-pt-claro-estagio1-clareira-3` | Arte real dos `bg-guild-*` (fila `cenario`) e um título "Clareira" já no estágio 0. |
| B2 | Feira · resgate | "O fenômeno se desfez diante da roda." aparece **duas vezes** (cartão do resgate + linha acima do visor). | BAIXO | `19-j4-pt-claro-resgate-falha-de-rede` | Omitir a linha do visor quando o cartão de resgate estiver aberto. |
| B3 | Mural | Estágios que este aparelho não presenciou aparecem como palavras soltas ("Clareira", "Ramagem"…) sem data ao lado de um com data. | BAIXO | `10-roda-pt-claro-12-membros-fim-da-folha` | Omitir os sem data ou dar-lhes uma linha própria ("desde antes de você"). |
| B4 | J2 · código curto (L1 #7, **não fechado**) | Com < 8 caracteres o botão fica inerte sem dizer por quê (Criar sem nome, idem). | BAIXO | — (`entrar` no scratchpad) | `aria-describedby` com "8 caracteres". |
| B5 | Folha vs. tela (L1 #31, aberto) | A folha termina ~40 px acima do fim da tela; faixa verde-clara vazia em todos os estados. | BAIXO | qualquer captura | Chrome compartilhado: só levar ao design. |
| B6 | J6 · cerimônia | A cerimônia não é camada do `backStack`: no navegador o voltar sai da página (`about:blank`), no Android o Home ignora o voltar. Só fecha pelo botão — coerente com "espera o gesto". | BAIXO | — (`j6` no scratchpad) | Nada; registrar como decisão. |
| B7 | Gestos recebidos | As linhas "Alguém deixou uma luz." usam o mesmo estilo das linhas de nome, logo abaixo de "Carla": lidas como membros. | BAIXO | `17-gestos-pt-claro-recebidos-abaixo-da-dobra` | Estilo `sm2-lib-s` + ícone do gesto. |
| B8 | Gestos, primeira vez | Três botões (Aceno/Luz/Descanso) sem título visível: nada diz que são anônimos e para a roda inteira (só o `aria-label`). | BAIXO | `17-…`, `23-…` | Título/linha curta acima da fileira. |
| B9 | Feira sem guilda | A folha "Feira" abre o mesmo formulário de criar/entrar, sem dizer o que é a Feira. | BAIXO | `pt-light-feira-sem-guilda` (scratchpad) | Uma linha da Feira acima do formulário. |

### Verificados e **sem achado**

- **Contraste por pixel** no texto da folha (todos os estados): menor razão 5,32 (pt-claro, "no bosque hoje" 12 px), 5,74 (en-claro), 7,05 (pt-escuro), 7,41 (en-escuro). Nenhum abaixo de 4,5.
- **Alvos ≥ 44 px**: zero exceções nos 4 temas/idiomas e nos 35 estados (Fechar 44×44; gestos 100×56; copiar 44×44; ajustes 44×44; CTAs 48).
- **Ícone em box**: nenhum. **Número por pessoa**: nenhum (só "N na roda", datas e "4/2 Emblemas" da regra). **HP/dano/"faltam"/cobrança**: nenhuma ocorrência em nenhum texto (regex em todos os estados). **`{n}` vazando**: nenhum. **PT em EN / EN em PT**: nenhum (o "Roda" achado em EN é o nome do mock).
- **Texto cortado/sobreposição**: nome de guilda de 24 "W", nome de membro de 36 letras e 36 "W": truncam com reticências, "· você" fica visível, sem scroll horizontal (`sw 374 = cw 374`).
- **Movimento reduzido**, **offline** (selo "SEM SINAL" a 64 px, sem cobrir o título; alerta "Sem conexão. Nada mudou." e botão preservado), **429/500/aborto/HTML** (alerta + "Tentar de novo", sem formulário falso).
- **Fio**: nunca aparece antes da meta de coração; sem "faltam"; firmado vira frase.

### L1 (`L1-experiencia.md`): o que está fechado

Fechados e confirmados rodando: **#4** nome longo · **#10** 409 "já em uma roda" mostra a roda · **#11/#23** colisão e rede com copy própria · **#14** "· você" fora da parte truncável · **#16** falha de leitura ≠ sem roda (com "Tentar de novo") · **#22** selo offline desceu · **#24** Tab preso/`inert`/foco devolvido ao lote no Escape (com a ressalva M6) · **#25** Fechar 44. **Não fechados**: **#7** (B4), **#31** (B5). **Regrediu**: **#15** (M5).

## Contagem por severidade

- FATAL: 0
- ALTO: 1 (A1)
- MÉDIO: 6 (M1–M6)
- BAIXO: 9 (B1–B9)

## O que não foi verificado e por quê

- **Servidor e login reais**: tudo é mock; nenhum 403/410, nenhuma virada de semana/fuso, nada de KV.
- **APK/WebView**: `backButton` do Capacitor, safe-area e teclado virtual não existem em Chromium; o voltar foi medido pelo `popstate`.
- **Leitor de tela**: só atributos (`role`, `aria-*`) e o texto do `role=status`; nada foi ouvido.
- **Arte final**: os cenários `bg-guild-*` e os FX da Feira são placeholders (gradiente/barras de glitch); "legibilidade do palco" e "estágio 1 parecer triste" valem só para o placeholder. As criaturas dos outros são linhas nossas por hash (o servidor não manda linha).
- **Contraste por pixel** só no texto da folha; visor, cerimônia, Home e aviso não foram medidos. Cerimônia/fila só em pt-claro (e en-escuro na cerimônia); as capturas `j3-fila-*` foram tiradas com movimento reduzido ligado (a última rodada sobrescreveu as normais; o visual é o mesmo).
- **`navigator.share`** ("Compartilhar") não existe em Chromium desktop: o botão não foi desenhado e não pôde ser exercitado.
- O build é de `HEAD`; textos com edição não commitada de outro agente (ex.: "Alguém deixou um gesto para a roda.") podem diferir da árvore de trabalho.
- Lateral, fora do escopo: um save semeado com `category: 'health'` (minúsculo) derruba o app na ErrorBoundary ("Algo deu errado") — erro do meu seed (o tipo é `'Health'`), não reproduzível por fluxo normal; e o botão de microfone aparece na Home neste build (CLAUDE.md diz que sem `SUPABASE_*` ele não é desenhado) — não investiguei o ambiente do build.
