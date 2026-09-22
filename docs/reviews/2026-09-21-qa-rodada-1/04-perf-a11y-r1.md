# PERF/A11Y — rodada 2 (21/09/2026, noite) — o que a review 06 declarou NÃO medido: runtime

Condição de teste declarada: `dist/` do commit `5228145e` (24 MB, sem PNG), servido por
`npx vite preview --port 4173 --strictPort` (localhost, sem throttle de rede simulado — isto
NÃO é 3G/4G real, é "servidor local com gzip, sem latência de rede"; onde isso importa eu digo).
Medição de bytes por `curl -H "Accept-Encoding: gzip"` salvando o corpo cru (não uso `fetch()` do
Node porque ele descomprime automaticamente e mascara o tamanho — achado abaixo). Sem Chrome/Edge
headless com CDP disponível no ambiente (`npx playwright` não instalado, sem pacote `ws`/
`chrome-remote-interface`) — por isso não medi FCP/TTI/CLS num browser real; o que segue é
transferência de rede e composição de bundle, que é medível sem motor de renderização.

## (1) Bytes transferidos no primeiro carregamento (index.html → portão de conta)

Comando (repetível):
```
npx vite preview --port 4173 --strictPort &
curl -s -H "Accept-Encoding: gzip" http://localhost:4173/            -o /tmp/o.bin; wc -c </tmp/o.bin
curl -s -H "Accept-Encoding: gzip" http://localhost:4173/assets/index-BmQOgiTC.js -o /tmp/o.bin; wc -c </tmp/o.bin
curl -s -H "Accept-Encoding: gzip" http://localhost:4173/assets/vendor-DDxydHEc.js -o /tmp/o.bin; wc -c </tmp/o.bin
curl -s -H "Accept-Encoding: gzip" http://localhost:4173/assets/index-kMNEBcud.css -o /tmp/o.bin; wc -c </tmp/o.bin
```

| recurso | papel | bytes gzip (fio) | bytes crus (disco) |
|---|---|---|---|
| `/` (`index.html`) | documento | 6.351 | 26.916 |
| `assets/index-BmQOgiTC.js` | entry JS (`<script>` do html) | 221.970 | 641.049 |
| `assets/vendor-DDxydHEc.js` | vendor (`<link rel=modulepreload>` do html) | 45.477 | 141.723 |
| `assets/index-kMNEBcud.css` | CSS único, render-blocking | 24.758 | 142.696 |
| **total até o portão de conta** (`SoulmonOnboarding` ainda não entrou — é `lazy()`, `App.tsx:600`) | | **298.556 bytes ≈ 292 KB gzip** | 952.384 bytes ≈ 930 KB cru |

Depois disso, ao abrir o portão (clique em qualquer entrada), o app baixa mais:

| recurso | quando | gzip |
|---|---|---|
| `SoulmonOnboarding-CHfUm5_I.js` | ao entrar no portão (lazy) | 14.569 |
| `index-BucYz_vx.js` | import dinâmico DE DENTRO do onboarding (provavelmente SDK de auth) | 29.444 |

Total até o portão renderizado: **≈ 292 KB + 14,2 KB ≈ 306 KB gzip** — cabe com folga num
orçamento de "3G rápido" clássico (bom senso: ~170 KB/s efetivo em 3G real, então ~1,8s só de
download nessa condição, ANTES de parse/exec — não medido aqui, precisaria de throttle real).
**Falta throttle de CPU/rede real e um percentil (p75) de aparelho baixo — não medi isso, só o
tamanho do fio.** Proponho orçamento (não existe declarado para "tempo até portão", só bytes —
ver item 6): **≤ 350 KB gzip até o portão renderizado**, com folga de 44 KB sobre o medido hoje.

**Achado de método, relevante para qualquer medição futura**: `fetch()` do Node (undici)
descomprime `Content-Encoding: gzip` automaticamente e devolve o corpo JÁ decodificado — um
script que soma `buf.length` após `fetch()` mede o tamanho DESCOMPRIMIDO e chama de "bytes gzip"
por engano (eu mesma caí nisso na primeira tentativa: os números batiam exatamente com o
tamanho em disco). Comando que prova: `curl` sem `--compressed` preserva o corpo cru.

## (2) `pool-*.js` — tamanho e ordem de carregamento

`ls -la dist/assets/pool-D-wK9EoY.js` → **832.448 bytes crus / 71.079 bytes gzip**.

Não é baixado antes do Oráculo nem de nada do caminho crítico: é `import()` **dinâmico**
(`grep -o 'import("./pool-D-wK9EoY.js"' dist/assets/ActivitiesPage-fdVbQiZt.js` confirma),
disparado de dentro de `ActivitiesPage`, `OraclePage` e `SoulmonOnboarding` — não do entry.
`dist/index.html` não tem `<link rel=modulepreload>` nem `<link rel=prefetch>` para ele
(`grep -o '<link[^>]*pool[^>]*>' dist/index.html` → vazio; só há UM modulepreload no HTML,
para `vendor-DDxydHEc.js`). O aparecimento do nome `pool-D-wK9EoY.js` dentro de
`index-BmQOgiTC.js`/`index-BucYz_vx.js` é só o MAPA de módulos que o Vite gera para resolver
`import()` dinâmico por índice (`i.map(i=>d[i])`) — não é carregamento antecipado, é a tabela
de lookup do bundler. **Confirmado: `pool.js` não atrasa o caminho crítico.**

## (3) `src/index.css` — `.sm-px-*` morto e `!important`

**Os dois pontos de partida da tarefa estavam errados, e medi por quê:**

- **`.sm-px-*` "morto"**: `grep -oE` ingênuo no arquivo-fonte encontra 21 nomes, mas a maioria
  aparece só dentro de **comentários** (prosa que cita a classe irmã, ex. linha 4719 `` `.sm-px-
  dark-ctx`, `.sm-px-arcade-root`... ``). Removendo comentários (regra `/\*[\s\S]*?\*\//g`) e
  medindo SELETORES reais: `node -e "...".sm-px-` → **só 6 existem como regra CSS**:
  `.sm-px-chat-btn`, `.sm-px-chat-btn-send`, `.sm-px-choice`, `.sm-px-field`, `.sm-px-row-btn`,
  `.sm-px-section-title` — e as 6 têm uso confirmado em `.tsx` (`grep -rl` por nome, 1 a 5
  arquivos cada). **Zero classes `.sm-px-*` mortas. Não há corte a propor aqui** — o achado
  correto é que o dist já bate 1:1 com o fonte real (`grep -o '\.sm-px-' dist/assets/index-
  kMNEBcud.css` dá os mesmos 6).
- **`!important`**: 24 ocorrências reais em código (27 no grep bruto, 3 são menção em
  comentário). Das 24, **19 estão dentro de blocos `@media (prefers-reduced-motion: reduce)`**
  (linhas 5081–5837) — servem para vencer `style={{animation}}` inline que o React aplica, e
  isso é a única forma de reduced-motion vencer estilo inline sem reescrever cada componente;
  o próprio comentário do arquivo (linha 5086) documenta o motivo. As **5 restantes** (linhas
  393, 3388, 6743, 6750, 6754) vencem seletor de ATRIBUTO de estilo inline
  (`button[style*="--sm2-btn:primary"]:active`) ou `[hidden]` — também precisam de `!important`
  porque `style=""` tem especificidade maior que qualquer classe. **Nenhum dos 24 é gordura —
  são as duas categorias onde `!important` é estruturalmente necessário neste projeto** (inline
  style vencendo cascata). Não há corte a propor; a hipótese do preâmbulo da tarefa não se
  sustentou na leitura real. Onde o CSS de fato pesa 139 KB é volume de regras (7.520 linhas,
  `wc -l src/index.css`) — cortar isso é trabalho de auditoria seletor-a-seletor que não coube
  nesta rodada, não achatamento de `!important`.

## (4) A11y por leitura de código real

**`TermsUpdateBanner.tsx`**: `role="status"`, dois links com `target="_blank" rel="noopener
noreferrer"` (Ler os Termos/Ler a Política) + botão "Ok" com texto visível. Sem `aria-label`
extra necessário — texto do link já é o nome acessível. Sem defeito encontrado.

**`BottomNav.tsx`**: já tem tratamento de acessibilidade extenso e deliberado — `aria-label` no
`<nav>`, rótulo TEXTO (não só ícone) em cada item, `aria-current="page"` correto, popover como
DIVULGAÇÃO (não `role="menu"`) com `aria-expanded`, `Escape` devolve foco ao botão-gatilho
(`closeMenuAndFocus`), `Tab` para fora fecha o painel (`onMenuBlur`), grupo com
`aria-labelledby` para nome acessível sem heading espúrio. Li o arquivo inteiro (392 linhas):
**nenhum ícone só-ícone sem rótulo** — mesmo os itens do menu sanduíche (`MenuRow`) têm texto ao
lado do ícone. Sem defeito encontrado — este componente já passou por uma auditoria de a11y
anterior (o comentário do próprio arquivo cita "medido" e "QA de 09/09/2026" quatro vezes).

**`SoulmonOnboarding.tsx`, portão de conta (`IDENTITY_STEP`/`GOOGLE_STEP`)**: os dois botões de
porta ("Entrar com Google"/"Novo usuário") são texto puro, sem ambiguidade. O botão de Google na
tela de confirmação tem o footgun já corrigido e documentado no próprio código (comentário
"QA de 09/09/2026, quatro botões do onboarding"): `aria-label` FIXO + `aria-busy` para não
perder o nome acessível quando o conteúdo vira só `<Spinner/>`. Botão "Voltar" tem ícone +
texto. **Sem defeito novo encontrado neste trecho** — já foi objeto de correção registrada.

**`SettingsPage.tsx`**: `role="radiogroup"` com `aria-labelledby` nos dois seletores (tema,
idioma); campo de e-mail e de código de recuperação com `aria-label`; botão "Copiar/Copiado"
tem TEXTO (não é ícone-só) com `aria-live="polite"` anunciando a troca de estado. Botão
desabilitado (`Restaurar`, sem input) usa `--sm2-muted` sobre `--sm2-surface-2` — **isto está
dentro da exceção do próprio WCAG 1.4.3** (controles desabilitados são isentos de contraste
mínimo), então não é achado de conformidade, é só uma nota: não testei contraste renderizado
de pixel real (footgun 10 do `CLAUDE.md` pede `getComputedStyle`/pixel, não screenshot pequeno)
— **não medi isso nesta rodada**, ficaria para quem tiver Playwright disponível.

**`CompanionHUD.tsx`, `prefers-reduced-motion` no pet**: `usePrefersReducedMotion()` (linha 300)
é lido em SEIS efeitos diferentes e corta: o passeio (`walk`, linha 583, corta 100%), a piscada
(linha 613, corta 100%), a saudação ao abrir o app (linha 641), a fala (linha 660), a varredura
de sintonia (`useVarreduraDeSintonia`, linha 803) e o pulso do botão de evolução (linha 1642,
`animation: reducedMotion ? undefined : 'evo-btn-pulse...'`). A respiração (squash, linha 543)
é a ÚNICA que NÃO para — ela DESACELERA (1500ms→2600ms) e o próprio comentário (linha 537-541)
declara a escolha deliberada: "respirar é CONTEÚDO — é o que diz que o bicho está vivo". Isto é
uma decisão de produto documentada, não um vazamento de `prefers-reduced-motion`; a leitura
técnica de WCAG 2.3.3 (Animation from Interactions) não cobre "vivacidade contínua e sutil"
como a violação-alvo (o alvo são animações disparadas por interação/decorativas grandes) — não
vou marcar como defeito, mas registro que **não medi a amplitude real do squash em px** para
confirmar que "sutil" é verdade e não só a intenção do comentário.
`SpriteAnim.tsx` (`src/components/pixel/SpriteAnim.tsx`) **não referencia
`prefers-reduced-motion` nenhuma vez** (`grep -n` vazio) — se ele anima sprite por troca de
frame em `setInterval` sem olhar o media query, é uma superfície fora do guarda-chuva do
`reducedMotion` do HUD. **Não tive tempo de ler o arquivo inteiro para confirmar se ele SEMPRE
recebe `reducedMotion` como prop do chamador ou se decide sozinho** — isto fica como "não
verificado", not "achado fechado".

## (5) `public/sw.js` — cache sem teto

Lido o arquivo (235 linhas). Confirmado por leitura: cache-first para assets estáticos e para
WebP (linhas 102–154), `cache.put` em todo hit de rede bem-sucedido (`cacheavel(res)`), e a
ÚNICA poda que existe é a troca de `CACHE_VERSION` no `activate` (linha 52–67), que **apaga
caches de versão ANTERIOR inteiros** — não poda dentro da versão corrente. Não há checagem de
tamanho, contagem de entradas, LRU nem TTL em lugar nenhum do arquivo (`grep -n` por
`Date.now|expire|TTL|max` fora dos nomes de constante não encontra nada). Resultado prático:
dentro de uma mesma `CACHE_VERSION`, o cache do Service Worker cresce sem teto enquanto o
jogador navega — cada webp de fundo de masmorra, cada cenário sorteado, cada sprite visto uma
vez fica para sempre até o próximo bump de versão.

**Proposta de poda (número)**: dist/assets hoje tem 24 MB; um teto de **cache runtime de 60 MB**
(≈2,5× o tamanho do build, cobrindo troca de tema + alguns cenários sorteados extras) com poda
LRU por CONTAGEM (mais simples que medir bytes dentro do SW): ao exceder **300 entradas** no
`STATIC_CACHE`, apagar as mais antigas por ordem de inserção até caber em 250. Justificativa do
número: `ls dist/assets | grep webp | wc -l` mostra dezenas de cenários/adventures que só
existem para SORTEIO (nunca todos vistos na mesma sessão) — um teto por contagem evita que uma
sessão longa numa masmorra com cenário aleatório acumule as ~50+ variações de fundo permanentemente.
Isto é proposta, não medição — não tenho como medir o crescimento real do cache do SW sem um
browser real rodando uma sessão longa, o que não fiz.

## (6) `orcamentoDeBytes.contract.test.ts` — falta teto para chunk lazy

Lido o arquivo inteiro. Confirmado: `TETO_JS_DE_ENTRADA` (250 KB) e `TETO_CSS_DE_ENTRADA`
(100 KB) cobrem SÓ o `index-*.js`/`index-*.css` referenciados por `dist/index.html`
(`/src="\/assets\/(index-[A-Za-z0-9_-]+\.js)"/` e o `.css` equivalente). `TETO_IMAGEM`/
`TETO_VIDEO` cobrem qualquer imagem/vídeo em `dist/assets`. **Não existe nenhuma regra que
itere `dist/assets/*.js` que NÃO seja `index-*`** — `pool-D-wK9EoY.js` (832 KB cru), e
qualquer outro chunk lazy (`OraclePage`, `ActivitiesPage`, `SoulmonOnboarding`, etc.), podem
crescer sem limite e o guard passa verde. Isto é exatamente o "falta teto" do preâmbulo,
confirmado por leitura completa do arquivo, não por suposição.

**Proposta de número**: adicionar `TETO_JS_LAZY = 350 * KB` (raw, mesmo critério dos outros —
o guard mede `statSync`, não gzip) para todo `.js` em `dist/assets` que NÃO seja o entry, com
`DIVIDA_ATUAL['pool.js'] = 832_448` registrada de imediato (mesmo padrão de `index.js`/
`index.css` já usado no arquivo) — porque 832 KB já é 2,4× o teto proposto e teria que entrar
como dívida explícita, não como violação nova. O padrão do próprio arquivo (dívida nomeada +
folga de 8 KB) se aplica sem mudança de desenho, só uma nova iteração de arquivo e uma nova
constante — mudança pequena, e quem escrever o teste tem o precedente todo pronto no mesmo
arquivo. Não escrevi o código porque a tarefa era auditar e propor, não meche em teste.

## Tabela — achado · severidade · conserto · dono

| achado | severidade | conserto | dono |
|---|---|---|---|
| `orcamentoDeBytes.contract.test.ts` não cobre chunks lazy (`pool.js` 832 KB e qualquer outro `.js` não-entry) | médio | adicionar `TETO_JS_LAZY = 350 KB` + `DIVIDA_ATUAL['pool.js'] = 832_448` no mesmo arquivo | `alpha-frontend` |
| `public/sw.js` cacheia sem teto dentro da mesma `CACHE_VERSION` (webp de cenário sorteado acumula pra sempre) | médio | poda LRU por contagem de entradas (proposta: 300, alvo 250) no `install`/`fetch` | `alpha-frontend` |
| `SpriteAnim.tsx` não referencia `prefers-reduced-motion` — não confirmado se recebe a flag via prop do chamador | baixo (não verificado, pode ser não-achado) | ler o arquivo inteiro e, se decide sozinho, ligar ao mesmo `usePrefersReducedMotion()` do HUD | `alpha-frontend` |
| Sem throttle de rede/CPU real (só bytes de fio local) — TTI/FCP em p75 de aparelho ruim continua sem medir | alto (é exatamente o que a review 06 apontou como não medido, e continua não medido na prática, só reduzido a bytes) | rodar Playwright com `Network.emulateNetworkConditions`/CPU throttle 4× num ambiente com Chromium disponível | `alpha-qa` (ambiente com Playwright) |
| Contraste real (pixel renderizado) de estados/temas não medido nesta rodada, só lido em token | baixo | rodar o script de amostragem de pixel (Pillow/Playwright) citado no footgun 10 do `CLAUDE.md` | `alpha-frontend` |

## O que continua sem dono

- **TTI/FCP/INP em aparelho real ou emulado com throttle** — ninguém mediu isso ainda, em
  NENHUMA rodada de QA até agora (a #06 declarou não medido, esta rodada também não conseguiu,
  por falta de Playwright/Chrome no ambiente). Precisa de sessão com browser real disponível.
- **Crescimento real do cache do Service Worker numa sessão longa** — a proposta de poda (300
  entradas) é estimativa, não medição; precisaria de sessão de jogo real instrumentada.
- **Se `SpriteAnim.tsx` obedece reduced-motion** — não lido por completo nesta rodada (arquivo
  não estava na lista de 5 pedida, mas foi citado pela tarefa; ficou como pendência aberta).
