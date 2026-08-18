# Status do Soulmon — registro vivo

Documento único de acompanhamento. **Se algo importante for decidido, descoberto
ou concluído, registre aqui**, senão se perde entre sessões.

- Estado do código e do que está no ar → seções 1 e 2
- **O que depende de você (dono do projeto)** → seção 3
- Dívidas conhecidas que ainda não valem o custo → seção 4

Última atualização: **regra "ícone nunca dentro de box" (18/ago/2026,
madrugada)** — direção do dono, vale no app INTEIRO (registrada no
CLAUDE.md): nada de moldura/placa/chanfro em volta de ícone; o ícone aparece
GRANDE e pelado. Aplicado em: nav inferior (26→36px, placa preenchida do
ativo virou SUBLINHADO ciano — barra não é caixa, e mantém uma pista de
seleção que não é só cor), fileira Itens/Banho/Dormir (moldura da actionbar
saiu, 30→42px), botões do chat (moldura saiu, 20→30px). A barra inferior
subiu 68→80px pra caber o ícone grande com rótulo (token
`--sm-bottomnav-h`, o dock do chat acompanha sozinho). Confirmado no mesmo
passe: `.sm-pet-sticky` (pet fixo, só a lista rola) segue funcionando — o
dono pediu de novo, mas já estava no ar; harness de screenshot novo em
`scratchpad/shot.mjs` mede o sticky em vez de confiar no olho.

Antes disso: **o gesto oculto virou o LOGO inteiro (18/ago/2026,
madrugada)** — o dono pediu ("mergeia esse toggle com o corvo no título"):
corvo + wordmark "SOULMON" agora são um wrapper único, e é ele o alvo do
long-press. Alvo maior acerta mais fácil no dedo. Como o alvo passou a
incluir texto, entrou `userSelect: none` + `WebkitTouchCallout: none` (segurar
texto no mobile abriria seleção/menu e comeria o gesto). Achado ao testar, e
anotado em `docs/ORACULO.md`: a intro tem animação de entrada e, antes de
assentar, o logo fica em OUTRA posição com `pointer-events: none` — medir
cedo faz o teste reprovar um gesto que funciona (`document.fonts.ready` não
basta; espere ~3s).

Antes disso: **atalho oculto pro modo debug (18/ago/2026, madrugada)**
— o dono perguntou onde ficava o checkbox de modo debug e, ao saber que
`OraclePage.tsx` não tem NENHUM ponto de entrada no app real, pediu um jeito
de chegar lá pela tela de intro que aparece na captura que ele mandou. Como
essa tela é a primeira coisa que todo jogador real vê, perguntei antes de
mexer: o dono confirmou que queria um atalho ESCONDIDO só pra ele, não um
controle visível pra qualquer um. Implementado como gesto: segurar o mascote
da intro por ~1.8s (`SoulmonOnboarding.tsx`) abre a `OraclePage` por cima,
já com o checkbox de modo debug pré-marcado (`initialDebugMode`, prop nova),
com um botão "Fechar" pra voltar. Toque curto (< 1.8s) não faz nada — testado
com Playwright (hold abre, toque curto não abre, Fechar volta pra intro).
Ver `docs/ORACULO.md` (rodada 11).

Antes disso: **modo debug na geração de imagem (17/ago/2026,
madrugada)** — pedido do dono: uma versão com "custo 0" que entrega o prompt
em vez de gerar sozinho no Higgsfield. `OraclePage.tsx` (ferramenta interna,
sem nav) já tinha um botão "Prompts" sem custo separado do "Gerar imagens"
(que chama a API paga); agora tem um checkbox "🐛 Modo debug" que faz o
PRÓPRIO botão de gerar nunca chamar a API quando ligado — zero chamada de
rede, não um limite que ainda bateria nela. Ver `docs/ORACULO.md`
(rodada 10).

Antes disso: **classe real no prompt de sprite (17/ago/2026, noite)**
— o dono achou um prompt de exemplo mais genérico que o anterior e pediu
mais detalhe: a classe (arquétipo do class-system), mas SÓ no prompt de
imagem, nunca em texto que o jogador vê. `pipeline.ts` virou `async` (só
ele — `generateOracle` continua síncrono) pra computar
`computeClassTitle(fichaByStage.ultra)` — constante nos 11 prompts, mesmo
tratamento que os outros traços de identidade — e passar o nome EN como um
4º traço do prompt (`OracleInput.promptClassFlavor`, novo campo, só o
pipeline preenche). Cogitado e descartado: sincronizar os arquétipos num
snapshot pra evitar o `async` — o casamento de condição real depende de
`niveisEfetivos` de elementos DERIVADOS, que só o motor real deriva certo;
reimplementar seria o footgun 9 que as outras integrações evitaram. Teste
novo confere as duas pontas: a palavra da classe aparece no `imagePrompt`
de toda forma, nunca em `description`/`bio`. Ver `docs/ORACULO.md`
(rodada 9).

Antes disso: **sufixo "-mon" removido dos nomes (17/ago/2026, noite)**
— o dono pediu um exemplo real de ponta a ponta e notou: toda criatura
terminava em "-mon" (`rookieName` etc. em `oracle.ts`). Achado ao investigar:
combinado com os prefixos de linha (War/Chaos/Zeed no Vírus, Omega no Mega
Vírus, Omni no Ultra), isso soletrava nomes REAIS de outra franquia —
WarGreymon, e o pior, Omegamon/Omnimon (a fusão dos 3 Megas, exatamente o
conceito do Ultra aqui). Mesmo tipo de risco que já tirou os 74 sprites da
Bandai do projeto, só que na camada de TEXTO. Corrigido: nenhum sufixo fixo
em nenhum estágio; `Omni` (Ultra) virou `Triune` ("três em um", mesmo
conceito, sem o nome emprestado). Teste que fixava o prefixo antigo
atualizado. Ver `docs/ORACULO.md` (rodada 8).

Antes disso: **classe da criatura (17/ago/2026, noite)** — pedido do
dono: "senti falta de ter também a classe da criatura, gerada a partir do que
ela faz, suas skills, talvez talentos e também de seus elementos". Achado:
o class-system já tem exatamente esse conceito — **arquétipos** (79 no
registro, `registry/arquetipos.ts`), identidades que EMERGEM de elemento +
escola + recurso, nunca escolhidas. `ficha/classTitle.ts` chama o motor real
(`calcularProgressao`, mesmo import dinâmico das skills) e escolhe o
arquétipo mais específico entre os que a ficha desbloqueou (pleno → diluído
"Aspirante a X" → fallback genérico pelo elemento dominante). Medido em 24
perfis: rookie nunca bate arquétipo pleno, mega e ultra batem em 100% —
mesma escada da cascata de pares. Nome PT vem AO VIVO do motor (zero cópia);
EN é tradução própria por id, com teste de paridade contra os 79 ids reais.
Extraído `ficha/realEngine.ts` (Personagem + progressão real), compartilhado
entre poder de skill e classe. Persistido no save (`soulmonClassTitles`).
**Decisão do dono no mesmo dia: não aparece pro jogador** — `PetPage.tsx`
computa e cacheia a classe, mas não renderiza o rótulo; infraestrutura fica
pronta pra um dia mostrar, sem custo de exibir nada agora. Ver
`docs/ORACULO.md` (rodada 7).

Antes disso: **contraste do tema escuro (17/ago/2026, noite)** —
feedback ao vivo do dono: "troca o nome pet por Soulmon e olha esse
contraste aí, em fundo escuro tem que ser texto branco". (1) A aba "Pet" virou
"Soulmon" (`App.tsx`). (2) O contraste era um bug REAL, não só percepção: o
scaffold shadcn importado do Figma define `body { color: var(--foreground) }`,
e `--foreground` só troca de valor sob a classe `.dark` — que este app NUNCA
aplica (o tema alterna via `[data-theme]` no `<html>`). Resultado: todo texto
sem `color` próprio herdava `--foreground` sempre no valor CLARO
(`oklch(.145 0 0)`, quase preto) mesmo com o tema escuro ativo. Pego por
amostragem de PIXEL na página do Pet (não só `getComputedStyle` — o preview
visual enganava, o cinza quase-preto sobre o verde bem escuro do card ainda
parecia "vagamente legível" no screenshot pequeno): nome da criatura, descrição
por forma e nome da skill renderizavam em `rgb(10,10,10)` sobre
`rgb(23,58,55)`. `body` agora usa os tokens de verdade (`--sm-bg`/`--sm-ink`),
que já respondem a `[data-theme="dark"]` — `--background`/`--foreground`
continuam intactos para quem os usa via `.bg-background`/`.text-foreground`
explícito (alguns modais em `components/ui/`). Ver footgun 10 em "Footguns".

Antes disso: **descrição por forma + poder real da skill (17/ago/2026,
noite)** — feedback ao vivo do dono testando o app: (1) a descrição por forma
só falava do FÍSICO, faltava o comportamento ("o que ele faz") — agora soma
uma frase real do papel+alinhamento dominante (`behaviorSentence`, extraída do
`personalitySummary` que já existia só na ferramenta interna); (2) o custo das
skills era um rótulo fixo por tipo — `ficha/realSkillPower.ts` chama o motor
DE VERDADE do class-system (`calcularSkill`, import dinâmico) e mostra um
`poder` real ao lado, verificado crescendo do rookie ao ultra e da básica pra
especial. Também no Class-System (PR #8 de lá): sinergia de alvo único
(fogo→vileza etc.) agora alimenta a cascata de destravamento — sinergia de
LEQUE (vida→5 primais) fica de fora de propósito, senão reabria o exploit que
a rodada 2 fechou — e a lista de investimento mostra os derivados "em
progresso" (passivos acumulando, ainda sem poder pontuar direto). Ver
`docs/ORACULO.md` (rodada 5).

Antes disso: **revisão profunda do oráculo (17/ago/2026, tarde)** — a
pedido do dono ("cada usuário com personagem único, interessante e fiel").
Medição com 200 perfis reais achou e as correções fecharam: (1) NOMES — a
colisão de baseName caiu de 20,5% para **1,5%** (mais bits da identidade,
RNG dedicado, bancos dobrados, 4 padrões de composição; estilo intocado);
(2) PAPÉIS no caminho só-6 — alcance caiu de 46% para 12–22% e suporte subiu
de 5% para 18–22% (recalibração validada em 3 seeds, direções de fidelidade
intactas); (3) IDENTIDADES FANTASMA — sombra/água/pântano/akasha/gelo agora
todos ≥3–4% (piso compensando o racha das perguntas de reino). Fidelidade
confirmada forte: respostas opostas mudam a identidade 10/10, todos os 6
traços movem eixos em direções coerentes; bestiário sem concentração
(top-10 = 10,5%). No Class-System, auditoria adversarial da cascata rendeu
9 achados corrigidos (PR #5 — medidor de orçamento cobrava pontos crus,
custo em paridade com os pais {1,2,3,4}, invariantes de aridade/pressa
refechados na curva inteira, taxonomy.json v2 como contrato de máquina). O
Besti-rio- ganhou superfície de máquina (PR #3 — export canônico com
procedência + AGENTS.md; uso principal = servir este pipeline). Custo do
par espelhado no Soulmon (CUSTO_PONTO_PAR 3→2) e snapshot re-sincronizado.

**QA rodada 2 (17/ago/2026)** — dois buracos medidos e fechados. (1)
**Paridade dos diais**: mutar `CUSTO_PONTO_PAR` de 2 para 3 não derrubava
NENHUM teste (1253/1253 verdes) — os fixtures da cascata medem comportamento
(passivos/destrave) e preço não entra em cascata nenhuma, então o dial podia
divergir do class-system em silêncio (footgun 9). O sync agora copia o bloco
`geracoes` do `taxonomy.json` v2 para o snapshot e `cascata.parity.test.ts`
afirma os QUATRO diais (divisor, limiar, custo base, custo do par) contra ele;
verificado por mutação: cada um dos 4 agora mata teste. (2) No Class-System,
**a armadilha de retrancar**: com a lava destravada, investir 1 ponto direto e
depois baixar um componente retrancava o par — o ponto continuava cobrando
orçamento e não sobrava nenhum `−` na tela (só "Resetar", que apaga a build).
Agora existe `desinvestirElemento` no motor e a tabela lista `alocaveis` ∪
{derivados com ponto direto}, os travados só com `−`.

Antes disso: **alocação geracional + página do Pet (17/ago/2026)** —
rodada 2 da fusão, a pedido do dono: (1) o class-system ganhou a CASCATA
geracional (PR HexerVoodoom/Class-System#5 — ponto direto só em base; 5+5→1
passivo no par; 10 passivos destravam alocação direta; peso de geração como
CUSTO {1,3,10,30}, não multiplicador); (2) a ficha do Soulmon distribui por
essa regra com orçamento próprio de elementos (30/60/120/300/500) e
especialização progressiva — medido: rookie–ultimate só bases, mega chega
"quase destravando", ultra compra o par em ~73% dos perfis (réplica gen-2 com
teste de PARIDADE contra fixtures do motor real, gerados no sync); (3) o
bestiário ganhou LINHAGEM com continuidade de espécie (uma inspiração por
estágio; 86,8% das transições preservam a família, travessia rara por
sobreposição); (4) cada estágio ganhou o par de skills básica/especial
derivado da ficha (a especial do ultra usa o PAR comprado — ex.: "Fúria de
Prisma"); (5) página nova do **Pet** (chip Evolução | Pet | Estatísticas):
formas já desbloqueadas (nunca futuras), a descrição por forma que existia no
save e nunca era renderizada, e as duas skills — verificada com Playwright em
PT e EN. Decisão de arquitetura confirmada pelo dono: dados por SNAPSHOT
embarcado (não API).

Antes disso: **fusão class-system + bestiário no oráculo (ago/2026)** —
o pipeline completo agora distribui os pontos do usuário na ficha do
class-system (constelação ancorando os 17 elementos, 65 talentos cientes de
pré-requisito, 11 profissões), captura o companheiro pela mecânica real e
busca a criatura-inspiração num pool de 2.000 do corpus canônico do
Besti-rio- — com cobertura TOTAL travada por simulação e o nome da inspiração
proibido em prompt por teste. Dados por snapshot com SHA
(`npm run sync:oracle-data`). Pendência do dono: mergear
`claude/canonical-classification` na main do Besti-rio- (o pool aponta para a
branch até lá). Ver `docs/ORACULO.md`.

Antes disso: **UI rodada 6 (15/ago/2026)** — cinco passadas de QA de
design sobre a rodada 5: guardrail de moeda restaurado em Estatísticas (Bits
sem ícone, fonte de calculadora), relatório diário/modais de tarefa/batalha da
Masmorra no kit, Dino sem vazio, barra do ritual segmentada, varredura do tema
claro e closeup das quinas. Relatório: `product/soulmon-01/ui/align-round6.md`;
prompts de arte ganharam A15–A16.

Antes disso: **UI rodada 5 (15/ago/2026)** — os primitivos legados
`.sm-btn`/`.sm-card` passaram a desenhar o kit pixel (chanfro + cobre + banda
de quina), o que converteu de uma vez onboarding, tutorial, modais, popover do
menu e o topo da Evolução; backdrops roxos viraram teal, os vazamentos de roxo
de Torneio/PPT/Masmorra saíram, e o fundo de circuito da Ref C entrou por CSS.
Relatório: `product/soulmon-01/ui/align-round5.md`. O que falta é ARTE —
prompts prontos em `docs/BACKLOG-ARTE-GERAR.md` (itens A9–A14 novos).
⚠️ Registro de ambiente: os 6 testes de `GameStateContext.storage.test.tsx`
falham em sandbox Linux (o mock de storage cheio não dispara quota no jsdom de
lá) — **pré-existente**, falha idêntica no commit base; nos ambientes das
rodadas anteriores passavam.

Antes disso: **novo motor do oráculo (ago/2026)** — o teste de
personalidade do repositório `teste-personalidade` virou a LEITURA do oráculo do
Soulmon (`src/utils/soulProfile/`), no lugar do signo por faixa de datas, do
ascendente chutado de 2 em 2 horas e das 6 perguntas do quiz antigo. A metade
criativa (`utils/oracle.ts`: arquétipo, famílias, as 11 formas, prompts de
sprite) não foi tocada, e o caminho legado segue inteiro para quem já tinha
perfil salvo. Detalhes e o porquê de cada decisão em `docs/ORACULO.md`.

Antes disso: **loop de QA multi-agente (ago/2026)** — 3 rodadas, suíte de
379 → 600 testes, mais uma frente de aplicação da UI pixel-art. Ver
`product/soulmon-01/` para os relatórios de cada rodada. O achado estrutural
está resumido na seção 5 abaixo e é o que vale ler primeiro.

Antes disso: auditoria de segurança multi-agente (3 agentes, escopo
dinheiro / auth+dados / IA+push+segredos).

---

## 1. Segurança — auditoria de 2026-08

Rodada com o motor do `/security-review` da Anthropic, dividida em três frentes
paralelas. Cada achado abaixo foi **verificado à mão no código** antes de
entrar aqui. Filtro aplicado: só confiança ≥ 8, sem DoS, sem rate limit, sem
"falta de hardening" e sem race teórica.

### 1.1 Explorável AGORA, em produção

| # | Onde | O quê | Status |
|---|---|---|---|
| SEC-1 | `functions/api/community.js` | 5 de 11 ações sem autorização nenhuma | ✅ corrigido |
| SEC-2 | `functions/api/community.js:122` | o `saveId` é publicado como identidade social | ✅ corrigido |
| SEC-5 | `functions/api/subscribe.js:33` | SSRF: qualquer `endpoint` aceito, worker faz `fetch` nele 4×/dia | ✅ corrigido |

**SEC-1 — o buraco central.** Só `action=profile` chama `authorizeSaveAccess`.
`friends`, `gift`, `match`, `trophies?claim=1` e `gifts?claim=1` pegam o ator do
`body.id`/`?id=` e escrevem no registro daquela conta sem prova de posse.
Agravante: **isso não fecha quando o `FIREBASE_PROJECT_ID` for ligado** — ao
contrário do `save.js`/`billing.js`, essas ações não consultam autenticação em
ponto nenhum.

Impacto concreto: roubar 20 Bits/vítima/dia emitindo presente em nome dela;
reescrever a lista de amigos de qualquer um; forjar o campeonato inteiro
(+10 pontos e +1 vitória por chamada, queimando a partida diária da vítima →
1º lugar e troféu 🥇 sem jogar); e **apagar permanentemente** troféus de season
e presentes alheios, sem caminho de reemissão.

**SEC-2 — por que o SEC-1 vira catástrofe.** `action=players` devolve `p.id`, que
**é a chave do cloud save**. Sem conta e sem autenticação dá para listar a chave
de até 300 jogadores e então `GET /api/save?id=…` (lê o save inteiro) ou
`POST` (sobrescreve). Com `Access-Control-Allow-Origin: *` isso funciona de
qualquer página aberta no navegador da vítima.

> Isso muda a natureza do risco que estava documentado como aceito. O texto
> antigo dizia "quem souber seu e-mail pode ler seu save". Na prática **ninguém
> precisa saber e-mail nenhum** — é leitura e destruição em massa.

**Correção aplicada.** A identidade social passou a ser um `pid` derivado
(`SHA-256("soulmon-pub:" + saveId)`, 24 hex) — caminho só de ida. O índice
reverso `pid:<pid>` → saveId vive no servidor e é o único jeito de resolver um
alvo. Alvos (`friendId`, `opponentId`, `player?id=`) chegam como pid; a lista de
amigos guarda saveId internamente e sai como pid. Nada mudou no cliente: ele já
tratava o id alheio como token opaco. Como o pid é derivado, não houve migração
de dados — o índice reverso se preenche sozinho no próximo salvamento de cada
jogador.

### 1.2 Latente — arma no dia em que o billing for configurado

| # | Onde | O quê | Status |
|---|---|---|---|
| SEC-3 | `functions/api/_entitlements.js:132` | `claimOrder` não é atômico → 1 recibo vira N contas pagas | ✅ corrigido |
| SEC-4 | `functions/api/_billing.js:311` | microtransação Steam sem vínculo com o dono | ✅ corrigido |

**SEC-3.** O comentário no código dizia que a corrida "exige tempo de propagação
na casa dos milissegundos". **Está errado, e a estimativa era minha.** O Workers
KV é eventualmente consistente com janela de até ~60s, e o `get()` mantém cache
de borda por 60s **inclusive para chave inexistente**. Não é preciso
simultaneidade: basta as requisições caírem em colos que ainda não viram a
escrita. Um recibo de R$ 29,90 vira N contas `paid` com um `for` em `curl` por N
proxies regionais. Não é consertado ligando o Firebase — cada conta clonada
autentica legitimamente, e o `purchaseToken` nunca é vinculado a uma identidade.

O teste também dava falsa segurança: usava um `Map` em memória, que é fortemente
consistente e nunca reproduz a leitura obsoleta.

> ⚠️ **ISSO CONTINUA VALENDO — o ✅ acima é otimista** (rodada 9 de QA,
> ago/2026). O `Map` em memória segue sendo o dublê do KV, **inclusive nos
> testes escritos depois**. Ou seja: **o SEC-3 está marcado como corrigido com
> base num teste que não consegue reproduzir o ataque.** A atomicidade real
> depende do D1 `order_claims`, que **não existe** (ver
> `docs/DEPENDE-DE-VOCE.md` §3).
>
> E nenhum mutante encontra isto: mutação mede o código, não a semântica do
> armazenamento. O instrumento certo é um **KV falso com janela de consistência
> eventual configurável**. É o maior risco de dinheiro que sobrou.

**SEC-4.** `verifySteamPurchase` credita com base num `orderId` decimal vindo do
cliente, sem ticket e sem comparar o `steamid` que a própria Valve devolve. A
função irmã `verifySteamOwnership` exige ticket assinado *exatamente porque* o
SteamID é público — a assimetria é o indício. Como o `orderid` é gerado pelo
parceiro (contador/timestamp) e as respostas distinguem `not-purchased` de
`order-in-use`, o endpoint vira oráculo de enumeração: dá para varrer ids
vizinhos e resgatar a compra de outro jogador antes dele — ele paga a Valve e
não recebe nada.

### 1.3 Auditado e considerado SEGURO

Vale registrar para não reauditar à toa:

- **`_auth.js` — verificação de token Firebase está correta.** `alg` fixado em
  RS256, `aud` e `iss` ambos checados, `exp` e `iat` com tolerância limitada,
  JWKS por `kid` com TTL do `Cache-Control`, falha fechado em rotação,
  `email_verified === true` exigido. Era o achado mais temido e não existe.
- **Chave da Groq não vaza.** Host e modelo são fixos; corpo de erro upstream
  nunca volta ao cliente. Sem SSRF (nem host nem protocolo são controláveis).
- **Prompt injection sem consequência privilegiada** — nada do que o modelo
  responde vira escrita no servidor ou chamada de ferramenta.
- **PII do oráculo fica no cliente.** Nome completo, data, hora e local de
  nascimento vivem só no `localStorage` (`SOULMON_PROFILE`) e são consumidos
  por `generateOracle`. **Não** entram no `GameState`, não vão para `/api/save`
  nem para o perfil público. **Manter assim.**
- **`save.js`** remove `accountTier`/`credits` do POST do cliente e os reserve do
  registro `ent:` do servidor.
- **`spendCredits`** valida `Number.isInteger(amount) && amount > 0` — não dá
  para cunhar crédito com valor negativo.
- **`grantAdReward`** fica atrás de `ADMOB_SSV_ENABLED !== 'true'` → 501.
- **`closeSeason`** falha fechado sem `SEASON_ADMIN_KEY`.
- **Steam Family Sharing** já é recusado (`steamId !== ownerSteamId`).
- **Sem segredos na árvore de trabalho.** A chave anon do Supabase em
  `src/utils/supabase/` é pública por desenho (RLS) e o app não passa mais por
  lá. Todo `VITE_*` em uso é config web do Firebase, pública por desenho.

### 1.4 Segredos no histórico do git ⚠️

O commit `c47776e5` removeu `bubblewrap_build/`, que continha:

```
bubblewrap_build/android.keystore
bubblewrap_build/signing.keystore
bubblewrap_build/app-release-signed.apk
bubblewrap_build/app-release-aligned.apk
```

Remover do HEAD **não tira do histórico** — quem clonar ainda recupera. Ver
seção 3.

---

## 2. Estado do produto

- **Reskin visual + tema claro/escuro (ago/2026).** Paleta trocou de roxo pra
  teal/cobre (`--sm-*` em `src/index.css`, agora com variante
  `[data-theme="light"]`/`[data-theme="dark"]`). Novo `src/contexts/ThemeContext.tsx`
  (persistido em `digiapp-theme`, reaproveitando a chave do antigo seletor de
  skin) + script inline em `index.html` que aplica o tema antes do primeiro
  paint (evita FOUC) + seletor "Aparência" em Configurações. Os skins
  `win98`/`glitch` — mortos, sem nenhum botão que os ligasse — foram
  **removidos por completo** (código e CSS, ~950 linhas), não só desligados.
  Novo mascote da franquia: um corvo de cartola em pixel-art
  (`src/assets/soulmon/mascot-raven.png`, arte fornecida pelo dono, fundo
  originalmente com checkerboard opaco — removido via flood-fill antes de
  virar asset), usado no ícone do app (favicon/PWA/Android/Electron, todos
  regenerados) e como mascote em loading/onboarding/erro/estados vazios. A
  **mecânica do pet do jogador não mudou em nada** — continua gerado pelo
  oráculo por usuário; o corvo é só identidade de marca. Cobertura de temas é
  por prioridade: fundação + ~15 telas de maior uso migraram pros tokens
  novos agora (ver commit); telas secundárias (minigames, alguns painéis
  fundos) ainda têm cor fixa e migram depois.
- **Auditoria de tom e paridade executada (ago/2026).** O chat de fallback
  passou a entender e responder em PT (antes um usuário escrevendo "tô triste"
  recebia "Cheer up!" em inglês), e o pool de tristeza deixou de invalidar o
  sentimento. O prompt da IA ganhou um piso de tom inegociável e passou a
  chavear personalidade por NÍVEL — antes usava nomes do DigiApp, nenhum casava,
  e todo pet falava como "guide and mentor". O tutorial ganhou fallback local de
  tarefas (sem ele, uma falha de rede prendia o usuário numa tela obrigatória
  sem nada selecionável) e parou de ensinar HP só pelo lado da punição.
  `--sm-muted` subiu de 3,48:1 para ~4,6:1 de contraste. Confirmação do
  "Recomeçar do zero" agora diz a verdade (não apaga progresso) e virou
  "Refazer o ritual".
- **Rodada de check-up com personas (ago/2026)** — teste dirigindo o app no
  navegador com 5 personas do público (adolescente com TDAH que some e volta,
  pai com 3 min/dia, perfeccionista após um dia ruim, usuário 58+ com foco em
  acessibilidade, gamer buscando profundidade). Achado mais grave: **o checkbox
  de concluir tarefa renderizava com 2px** — as classes `w-7`/`h-7` não existem
  no `index.css` pré-compilado (footgun 1), então a ação central do app era
  praticamente invisível e impossível de acertar no dedo. Agora é um
  `<button role="checkbox">` de 44px com o círculo de 28px dentro, em tarefa,
  atividade e etapa. Junto: foco visível em todo o design system (não havia
  `:focus-visible` em lugar nenhum), notificações reescritas, e o popup da
  primeira tarefa traduzido e reescrito.
- **Notificações cobravam quem já tinha cumprido a meta.** `totalRequired` era o
  requisito do estágio, não `min(cadastradas, requisito)` — um rookie com 2
  atividades cumpria a própria meta e mesmo assim levava 3 avisos por dia
  dizendo que faltavam tarefas. Corrigido para a mesma meta de
  `computeDailyReset`. O aviso das 21h ("está preocupado! ainda dá tempo!") foi
  removido, e o das 20h parou de prometer que "metade das tarefas" evita a
  perda — o que era falso.
- **Rodada de auditoria (ago/2026)** — quatro achados, todos corrigidos:
  (1) o **ritmo de cuidado era cego a atividades recorrentes**, porque
  `completedTasks` só recebe tarefas avulsas e `lastCompletedDate` some na
  virada; agora existe `activityLog` (teto de 90). (2) O **galho previsto não
  era dito** — a página de Evolução mostrava os três atributos, mas o jogador
  tinha que inferir para onde ia; agora há uma linha com o galho e, no empate,
  quem desempata. (3) O resumo de "uma ação, várias barras" **só existia para
  tarefas**, não para atividades. (4) Dois **ramos mortos** de `digiegg/baby-i`
  na conclusão de atividade (a árvore nasce em rookie).
- **Limpeza:** 10 componentes órfãos removidos (nenhum era importado em lugar
  nenhum, nem por lazy import) e `wasDayPerfect`/`countCompletedYesterday`
  apagados — eram uma SEGUNDA cópia da regra do dia perfeito, sem nenhum
  chamador em produção mas com testes verdes, dando falsa cobertura.
- **Bug corrigido: concluir tarefa não dava nada.** `completeTask` recusava
  tarefa com `completed: true`, mas o `App` marca a tarefa no clique e só chama
  a função 3s depois — então ela SEMPRE recusava. Resultado: a tarefa não saía
  da lista, não entrava no histórico, não contava na estatística e **não rendia
  a comida**. O laço central de recompensa do jogo estava sem efeito. Anterior a
  este trabalho (presente no backup). Há teste de regressão.
- **Benchmark + Fases 1 a 4 do plano de evolução (ago/2026)** — `docs/PLANO-EVOLUCAO.md`.
  Duas rodadas de pesquisa (apps de produtividade gamificada + franquias/hardware
  Digimon, Pokémon e Palworld) viraram um plano em 5 fases. A **Fase 1 está no ar**:
  teto de 1 coração perdido por dia, perdão de ausência ≥2 dias, alívio de meio
  coração toda segunda, `perfectDays` param de decrementar, e a **masmorra não cobra
  mais da barra de HP** (nem bloqueia entrada). A virada do dia virou função pura
  (`computeDailyReset`) que o hook e o teste compartilham — antes o teste testava
  uma cópia e afirmava uma evolução automática que `MANUAL_EVOLUTION` impede.
  Depois vieram: onboarding perguntando o "porquê", relatório em modo acolhida,
  "esqueci de marcar", check-in de humor, traço de nascimento, ritmo de cuidado
  desempatando o galho, faixas e rodada semanal do Torneio, e a vitrine da
  jornada. Abertos só o modo cooperativo (precisa de backend novo) e a arte da
  decoração (não é código). Ver `docs/PLANO-EVOLUCAO.md`.
- **Palco do pet** (composição, 5 espaços, decoração) — pronto. Contrato de arte
  em `docs/PALCO-E-DECORACAO.md`. Falta só a arte de verdade (hoje são emoji).
- **Torneio** — 6 itens na aba, escada 15/20/25/40/55/70 Emblemas. A vitrine
  exibe os troféus de season realmente ganhos.
- **Compra dentro do jogo** — `UnlockAccountModal` nos dois momentos em que a
  falta é sentida (limite de criação do grátis; árvore de demonstração na página
  de Evolução), mais ritual do oráculo pós-compra que troca só a criatura.
- **Desktop (Electron)** — overlay é um controle remoto do app.
  Ver `docs/PLANO-DESKTOP-STEAM.md`.
  > ⚠️ **Correção de registro (ago/2026).** Esta linha dizia "overlay
  > **funcional**" e isso era falso desde sempre: `cloudSync.ts` mandava o `id`
  > no CORPO do `POST /api/save`, e `save.js` lia o id só da query — 400 em
  > 100% das chamadas, que o cliente traduzia para `reason: 'network'`. As três
  > únicas ações do overlay (carinho, comida, marcar tarefa) **nunca gravaram
  > nada**. Ou seja: ninguém jamais usou o overlay de ponta a ponta, e mesmo
  > assim ele estava registrado como pronto aqui e tem plano de Steam escrito.
  > Corrigido nos dois lados (cliente manda `?id=`, servidor aceita `body.id`
  > como fallback retrocompatível para as builds já instaladas), com teste
  > ligando o cliente no `onRequest` real — `desktop/renderer/src/pushCareAction.test.ts`.
  > A lição que fica não é o bug de 1 linha: é que o registro vivo afirmou
  > "funcional" sem nada nunca ter exercido o caminho.
- **Separação do DigiApp** — inventário e ordem segura em
  `docs/SEPARACAO-DIGIAPP.md`. Limpeza de herança morta já feita.

---

## 3. Depende de você

Nada nesta seção pode ser feito por mim — precisa de conta, cartão, painel ou
decisão sua.

### 3.1 Segurança e direitos — urgente

| # | O quê | Por quê |
|---|---|---|
| ✅ | **Licença dos sprites DMC e uso dos nomes Digimon** — RESOLVIDO em 09/08/2026. Foi a opção (b): substituir por arte e nomenclatura originais. Saíram do repositório os 25 `*_dmc.png` (arte da Bandai, via `furudbat/wayland-vpets`) e os 49 `figma:asset/*` das linhas Tapirmon/Veemon/Salamon, junto com os itens de digievolução da loja, os Digimentais e o roster nominal da masmorra. `getSpriteForStage` responde sempre com arte de `src/assets/soulmon/`; save antigo cai num fallback determinístico que também usa arte nossa. Os nomes de franquia saíram até do prompt do gerador (`utils/oracle.ts`), com teste travando a ausência. Detalhes em `docs/Attributions.md`. |
| 🟠 | **Reroll por Créditos = resultado aleatório pago com dinheiro real** | `monetization.ts:76` + `oracle.ts` (`Math.random()`). Atenuante forte: todo pet gerado é mecanicamente equivalente — é identidade, não poder. Mas a Lei 15.211/2025 (ECA Digital) vale desde 17/03/2026, houve condenação de R$ 333M em jun/2026, e o Pokémon GO teve incubadoras removidas no Brasil. Pode bastar deixar explícito que os resultados são equivalentes. |
| 🔴 | **Decidir sobre as keystores no histórico do git** | Se o repositório for público, ou se essas chaves ainda assinam algo na Play Store: rotacionar a chave de upload no Play Console e/ou limpar o histórico com `git filter-repo` (reescreve todos os commits, exige force push e quebra clones). Posso preparar o comando; a decisão de reescrever histórico é sua. |
| 🟠 | **Ligar o `FIREBASE_PROJECT_ID`** | É o que fecha `save.js`, `billing.js` e `entitlements.js`. **Só depois** que `VITE_FIREBASE_*` estiver configurado e o build do desktop com login tiver saído — ligar antes derruba o login de todo mundo. |

### 3.2 Lançamento

| # | O quê |
|---|---|
| 🔴 | Registrar o pacote no Firebase + baixar `google-services.json` |
| 🔴 | Criar os 4 produtos no Play Console (`soulmon.unlock.full`, 3 pacotes de crédito) |
| 🔴 | Conta de serviço do Google Play → `GOOGLE_PLAY_SERVICE_ACCOUNT` e `ANDROID_PACKAGE_NAME` |
| 🔴 | **`PLAY_REQUIRE_ACCOUNT_BINDING = true`** — depois de publicar o app que manda `setObfuscatedAccountId(saveId)`. É o que impede um recibo de virar N contas pagas (ver docs/BILLING-SETUP.md) |
| 🟡 | Opcional: banco **D1** vinculado como `DB` + tabela `order_claims`, para o resgate de comprovante ser atômico em vez de best-effort |
| 🔴 | URL da política de privacidade + formulário de Segurança de Dados |
| 🟠 | `VITE_FIREBASE_*` no projeto Pages (e o `FIREBASE_PROJECT_ID` **por último**) |
| 🟠 | Conferir no painel do Cloudflare se já existe o projeto Pages `soulmon` — o `wrangler.jsonc` diz que sim, mas `capacitor.config.json` ainda aponta o APK para `digiapp-a5e.pages.dev` |
| 🟡 | Endereço de contato do VAPID (`workers/push-scheduler.js` → `CONTACT`) — hoje é `contact@digiapp.app`; precisa ser um que você controle |
| 🟡 | `ASSETLINKS_PACKAGE_NAME` e `ASSETLINKS_SHA256` no Pages (fingerprint sai do Play Console → Integridade do app) |

### 3.3 Steam

| # | O quê |
|---|---|
| 🔴 | Conta Steamworks + US$ 100 |
| 🔴 | **App ID e Depot ID** (bloqueiam o cliente Steam) |
| 🟠 | Arte da loja |
| 🟠 | Subir build a partir de uma máquina Windows |
| 🟡 | `STEAM_PUBLISHER_KEY` e `STEAM_APP_ID` (o SEC-4 já está corrigido; o cliente Steam precisa mandar o session ticket junto do `orderId`) |

### 3.4 Ordem que evita ficar fora do ar

1. Projeto Pages novo + KV novo + variáveis → conferir pela URL `*.pages.dev` do
   projeto novo, sem mexer no que está no ar.
2. Publicar o domínio próprio.
3. Só então atualizar `capacitor.config.json`, gerar APK novo e publicar.
4. Por último, aposentar o Pages antigo.

Fazer na ordem inversa (mexer no `server.url` antes de o destino existir) quebra
o app de todo mundo que já tem o APK instalado.

---

## 4. Dívidas conhecidas (aceitas por ora)

- **Emblemas ficam no save do cliente**, como os Bits — farmáveis por quem editar
  o `localStorage`. Aceitável **enquanto a aba Torneio vender só cosmético**. Há
  teste travando isso: se algum item de torneio virar vantagem de jogo, o teste
  cai, e a resposta certa é mover Emblemas para o servidor, não afrouxar o teste.
- **Corrida no `spendCredits`** (read-modify-write) — limitada a cobrar a menos
  do jogador, nunca a cunhar crédito. Cai junto se o SEC-3 migrar o módulo para
  Durable Objects.
- **Arte da decoração são emoji.** A estrutura já aceita PNG; ver
  `docs/PALCO-E-DECORACAO.md`.
- **Arte da decoração** ainda é emoji. O brief de produção está pronto e a
  geração virou um comando (`node scripts/gen-decor.mjs`, 14 peças) — falta só
  rodar num lugar com acesso a `higgsfield.ai`: a política de rede do sandbox de
  agente responde **403 no CONNECT** para esse host, então não dá pra gerar de
  dentro de uma sessão. Brief em
  `docs/BRIEF-ARTE-DECORACAO.md` (14 peças, caixa em px, prompt-base).
- **Cura instantânea por Créditos** é, na prática, pagar para pular o cuidado — a
  mesma crítica que Kotaku e Digital Trends fizeram ao Premium Pass do Pokémon
  Sleep. Sugestão em `docs/PLANO-EVOLUCAO.md`: reposicionar como perdão pontual
  com teto. É decisão de produto, não técnica.
- **Sprite do cocô** (`src/assets/9087038…png`) é um blob escuro pouco legível.
  Anterior a este trabalho.

---

## 5. O achado estrutural do loop de QA (ago/2026)

Três rodadas de auditoria acharam 5 defeitos reais, e **nenhum era erro de
lógica**. Todos eram **fronteiras sem dono** — um lado supondo algo do outro,
com nada forçando o encontro:

| defeito | fronteira |
|---|---|
| Checkbox de 2px (`w-7`/`h-7` inexistentes) | JSX ↔ CSS pré-compilado |
| Overlay que nunca gravou (id no corpo vs. query) | cliente desktop ↔ handler HTTP |
| `save.js` sem nenhum teste | código ↔ medidor de cobertura |
| Xadrez assado em `nest-base.png` e `icon-reset.png` | asset ↔ renderer |
| Página HTML salva como `.png` | download ↔ árvore de assets |

O diagnóstico em uma frase: **a suíte media intenção, não efeito.** A prova
mecânica cabia numa linha — `vitest.config.ts` fixava `environment: 'node'`, e
**não existia um único teste que montasse um componente**. O checkbox de 2px não
"escapou" da suíte: ela era estruturalmente incapaz de vê-lo. O motivo de nunca
ter existido teste de componente também não era preguiça — os aliases
`figma:asset/*` só existiam no `vite.config.ts`, então **nenhum componente era
importável em teste**.

**O que passou a existir, e é isto que precisa ser mantido:**

- `src/test/renderEnv.tsx` — monta componente com o `index.css` REAL e mede
  estilo computado. `renderEnv.selfcheck.test.tsx` prova que o instrumento
  enxerga: `w-7`/`h-7` computam `width: auto`, `w-11` não.
- `src/index.css.contract.test.ts` — classe usada no JSX que não existe no CSS.
  ⚠️ **Variante nova precisa ser escrita aninhada (`&:hover`)**; a forma plana
  passa despercebida pelo guard.
- `src/assets/assets.contract.test.ts` — xadrez assado, arquivo não
  decodificável, pixel fora da paleta. Tem quarentena com regra de honestidade
  (o defeito precisa continuar existindo **e** o arquivo não pode estar
  importado) para a lista não virar cemitério.
- `desktop/renderer/src/pushCareAction.test.ts` — **o modelo a replicar**: liga
  o cliente no `onRequest` real, não num mock que devolve 200.

**Regra que sai disso:** todo guard novo precisa de **casos de
autoverificação** que provem que ele enxerga. Sem isso, um guard passa sempre —
pelo motivo errado. Aconteceu duas vezes nesta rodada: o guard de CSS nasceu com
13 falsos positivos (lia `,` e `:` como parte do nome da classe, e por isso
acusou `flex-shrink-0`, que nunca esteve quebrado), e uma limpeza de magenta se
declarou completa usando um critério mais frouxo que o do próprio teste.

**Previsão registrada** (`product/soulmon-01/sweeper/skeptic-review.md`): os
próximos defeitos reais serão fronteiras sem dono, não lógica em `utils/`. A
aposta nº 1 era o **APK**.

### ✅ A previsão se confirmou no primeiro APK — e em minutos

O dono instalou o artefato do CI logo depois deste deploy. Nome certo, ícone
certo, `appId` certo (`com.hexervoodoom.soulmon`) — e **abriu o DigiApp**.

Causa: o APK **não embarca o app**, carrega uma URL remota, e
`capacitor.config.json > server.url` apontava para `digiapp-a5e.pages.dev`, o
projeto Pages do repositório antigo. A mesma URL estava em mais **três**
arquivos, incluindo os dois do desktop — ou seja, **o overlay Electron lia o
save do outro projeto**. Quatro arquivos, uma verdade, e nada que os obrigasse
a concordar.

Nenhum dos 653 testes olhava para isso: cobriam o app rodando, não onde a casca
vai buscá-lo. Fronteira sem dono, exatamente a assinatura das outras cinco.

**Corrigido** para `https://soulmon.mateus-sprnd.workers.dev`, depois de
verificar no ar que o destino serve o Soulmon com o build atual
(`index-C_r_Y4yT.js`), que `/api/save` valida (400 em id inválido), que o KV
responde, que `/api/community` já devolve `pid` derivado (SEC-2 valendo) e que
o header de CSP é o novo. Era a condição que o `CLAUDE.md` exigia para
autorizar a troca.

**Travado por `src/deploy/appUrl.contract.test.ts`**, que exige as quatro
fontes concordando, proíbe endereço de outro produto, e confere que a config
gerada por `npx cap sync` não ficou para trás da raiz — o caso em que alguém
edita a raiz, esquece o sync e o build passa mesmo assim. Verificado nas duas
pontas: vermelho com a URL antiga, verde com a nova.

**Ainda é preciso um APK novo.** O APK já instalado tem a URL velha assada
dentro dele e continuará abrindo o DigiApp até ser substituído pelo build do
próximo run do CI. ✅ Confirmado pelo dono em aparelho real: o APK novo abre o
Soulmon.

### Rodada 4 — a correção virou a fronteira nova

`product/soulmon-01/sweeper/round4-audit.md`. Três defeitos, **dois deles no
código que as rodadas 1–3 acabaram de escrever**, e ambos do mesmo subtipo:
**fix aplicado por ARQUIVO em vez de por REGRA**.

| sev | defeito | fronteira |
|---|---|---|
| 🔴 | A página de Evolução previa o galho com `completedTasks + activityLog`; a cerimônia decidia só com `completedTasks`. Quem cumpre hábito por atividade recorrente via "Harmonia" e evoluía para "Vírus" — e evolução não se desfaz pela via normal | `App.tsx:2173` ↔ `App.tsx:924`, duas chamadas da mesma regra, uma atualizada |
| 🟠 | Adotar save da nuvem gravava `SAVE_ID` **antes** de `GAME_STATE`, com `setItem` cru. Storage cheio = identidade trocada sem o dado, sem reload e sem aviso; o cloud save seguinte subia o estado local antigo por cima do save do outro aparelho | os 4 call sites que substituem o save inteiro ↔ o `safeStorage` da rodada 3, que parou no provider |
| 🟠 | O teto por IP rodava **antes** do cache de borda: acerto de cache custa ~zero KV e mesmo assim gastava uma das 20 varreduras/min. Sob CGNAT/escola, 30 jogadores reais num IP levavam 429 na resposta mais barata da rota | teto de custo ↔ cache, em `community.js` |

Corrigidos, com regressão travada e **verificação nas duas pontas**
(`careHistory.contract.test.ts`, `adoptCloudSave.test.ts`, `costCeiling.test.js`).
Suíte: 662 → **685 testes**, 0 falhas.

**Fechado com número:** o crescimento do `localStorage` **não é risco** —
`completedTasks` (a única estrutura sem teto) custa ~190 kB/ano para um usuário
de 4 tarefas/dia, contra ~5 MB de cota. Mais de uma década.

**Continuam ABERTOS:** last-write-wins do cloud save entre dois aparelhos
(recomendação registrada no §6 do relatório: `savedAt` + 409 no `save.js`),
"usuário com SW antigo recebe deploy novo", e a deriva `workers/` ↔ `functions/`.

### Rodada 6 — fuzzing: a fixture que certificava uma tela branca

`product/soulmon-01/sweeper/round6-fuzz.md`. Instrumento: **teste de propriedade
sobre estado de save hostil**, e o consumidor REAL do estado em vez de um espião.

| sev | defeito | situação |
|---|---|---|
| 🔴 | Todo save que não traz `activities` (ou traz `tasks` não-array etc.) é **tela branca permanente**: `hydrateSave` só fazia `?? padrão` — não cobria `activities`/`healthPoints`/`totalXP`/atributos e não garantia TIPO nenhum. A virada do dia, que roda no mount, lançava dentro do updater. Alcançável por `adoptCloudSave`, que grava qualquer objeto simples vindo de `/api/save` | **corrigido** (`arr()`/`num()` em `hydrateSave`) |
| 🟠 | `resolveBranch` devolvia **`undefined`** (fora do próprio tipo) quando um atributo era não-finito: `Math.max` → `NaN` → lista de líderes vazia. Galho previsto indefinido na página de Evolução e `currentBranch: undefined` no save | **corrigido** (`carePattern.ts`) |
| 🟠 | **Em rookie, degenerar é ganho puro**: HP volta cheio *e* `perfectDays` é SETADO em 2 (de 4). Quem abandona o pet 3 dias progride mais que quem cumpre a rotina. Contraria "perfectDays só acumulam" | **ABERTO — decisão do dono.** Travado por teste existente que diz "for free". Fix de 3 linhas no §4 do relatório, não afrouxa nada |

**Achado sobre o aparato:** `GameStateContext.hostile.test.tsx` (rodada 2) monta
um espião que só serializa o estado — **nunca monta `useDailyReset`**. A fixture
dele, `{ perfectDays: 10 }`, passava há três rodadas certificando exatamente o
🔴 acima. É o segundo guard cego em duas rodadas (o primeiro foi
`cloudSync.test.ts`, rodada 5). Suíte: 766 → **829 testes**, 0 falhas.

**Próximo instrumento proposto: mutation testing** — o único que mede o
*detector* em vez do *detectado*, e o único que teria pego os três guards cegos
(este, o da rodada 5 e o `simulateReset` do footgun 9) de uma vez.

### Rodadas 7 e 8 — mutation testing: medindo o detector

`product/soulmon-01/sweeper/round7-mutation.md` e `round8-save-content.md`.
Instrumento: **`scripts/mutation-sweep.mjs`** (versionado, sem dependência
nova). Aplica uma mutação mecânica numa linha de produção, roda a suíte e
reverte; mutante que não deixou nada vermelho **sobreviveu** — ali o teste é
cego, ou a mutação é equivalente.

**Rodada 7** mediu **51% de sobrevivência** em 720 mutantes e corrigiu 36 —
entre eles um teste chamado *"devolve meio coração na virada de segunda"* que
não afirmava nada sobre meio coração (a expectativa era calculada com a própria
constante auditada), `AD_REWARD_CREDITS` na mesma armadilha (**dinheiro real**),
`amount <= 0` recusando gastar 1 crédito, e compra estornada nunca marcada
(debitada de novo a cada leitura de saldo, para sempre). Suíte: 829 → **863**.

**Rodada 8** atacou os dois arquivos que leem/gravam o save do jogador, onde um
defeito não dá erro — devolve um jogador **plausível e errado**:

| arquivo | antes | **depois** | sobreviventes cegos |
|---|---:|---:|---:|
| `src/contexts/GameStateContext.tsx` | 22,6 % | **83,3 %** | **0** (14 equivalentes) |
| `desktop/renderer/src/cloudSync.ts` | 27,4 % | **91,1 %** | **0** (12 equivalentes) |

A causa era uma só, e vale como regra: **carregar não é conter, montar não é
afirmar.** Os testes existentes perguntavam *"é array? é número finito? o app
sobreviveu?"* — nenhum perguntava **qual número**. Sobreviviam todos os padrões
da hidratação (um Crédito de graça por save, PvP ligado sem opt-in, pet
degenerado ressuscitando ao recarregar) e o arquivo inteiro do overlay
(`401` virando "sem conexão", `{ok:false}` virando `{ok:true}` em 8 lugares,
save sem HP mostrando **pet morto**). Suíte: 863 → **981 testes**. Nenhuma linha
de produção alterada; nenhum teste afrouxado.

**Onde o loop continua:** `functions/api/_billing.js` (40%, e é dinheiro:
compra PENDENTE pode virar válida) — o instrumento certo ali **não é mais
mutação**, é um fake do endpoint da loja no molde de `pushCareAction.test.ts`;
depois `carePattern.ts` (51%, tabela de limiares sem teste de limiar) e
`save.js` (63,9%).

### 🔴 ABERTO — `minSdkVersion = 24` é uma promessa que o app não cumpre

Descoberto porque o smoke do APK falhou e o diagnóstico mostrou
`WebViewFactory: Loading com.google.android.webview version 83.0.4103.106`.
A imagem do emulador da API 30 traz WebView 83 (Chromium de meados de 2020).
Nele o Capacitor registrou os plugins, carregou a URL certa e logou
"App started" — e o JS morreu no parse. Tela em branco, ponte nunca chamada.

**O smoke não estava com defeito: ele reproduziu um usuário real de WebView
velho.** O CI passou para API 35 para deixar de testar isso por acidente, mas o
problema de produto continua:

| recurso | usos | exige |
|---|---|---|
| `oklch()` | 87 | Chromium 111+ |
| `color-mix()` | 97 | Chromium 111+ |
| aninhamento `&:hover` | 18 | Chromium 112+ |
| `vite.config.ts` `build.target` | `'esnext'` | sem transpilação nenhuma |

`android/variables.gradle` declara `minSdkVersion = 24` (Android 7.0). Quem
instalar num aparelho com WebView desatualizado — Android 7/8/9 que não
atualiza, ROM sem Play Store, aparelho corporativo travado — **instala e vê
tela branca**, sem mensagem nenhuma. A Play Store usa o `minSdk` para decidir
quem pode instalar, então hoje ela oferece o app para gente que não consegue
usá-lo.

Três saídas, e a escolha é do dono porque muda alcance de loja:

1. **Subir o `minSdk`** para ~30 e aceitar perder aparelhos antigos. Não resolve
   sozinho: o WebView é atualizável independentemente da versão do Android, então
   um Android 11 com WebView velho continua quebrando.
2. **Tela de aviso por detecção de recurso** — um `CSS.supports('color','oklch(0 0 0)')`
   no `index.html`, antes do bundle, mostrando "seu navegador do sistema está
   desatualizado, atualize o Android System WebView" em vez de tela branca.
   É a única que cobre o caso real (WebView velho em Android novo). ⚠️ Mexe nos
   scripts inline e portanto nos hashes da CSP — `src/security/csp.test.ts`
   recalcula e vai acusar se esquecerem.
3. **Transpilar de verdade**: `build.target` para algo como `chrome87` e trocar
   `oklch`/`color-mix`/aninhamento por equivalentes. Recupera o alcance completo,
   e é de longe a mais cara — a paleta inteira está em `oklch`.

Recomendação: **(2) agora** (barata, honesta com o usuário) e (1) junto, com o
`minSdk` refletindo o que o app realmente aguenta. (3) só se houver dado de que
o público de aparelho antigo importa.
