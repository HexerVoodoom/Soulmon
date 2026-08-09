# Brief de arte — decoração do palco

Documento de produção para gerar as 14 peças de decoração que hoje são emoji.
Escrito para que a geração comece assim que houver acesso a um gerador de
imagem, sem precisar redescobrir o contrato.

**O contrato técnico completo está em `docs/PALCO-E-DECORACAO.md`.** Este
arquivo é a lista de compras + o prompt-base.

---

## O que é o palco

O box do pet é uma **composição**, não um canto onde jogar ícones. Duas regras
estruturais mandam em tudo:

- **Linha do chão única**: `GROUND_Y = 74%` da altura do palco (250px), que é
  exatamente onde os pés do sprite do pet caem. Peça apoiada no chão tem que
  encostar nessa linha.
- **Cada espaço tem tamanho FIXO em px** (`DECOR_SLOTS` em
  `src/utils/petStage.ts`). **A arte é desenhada PARA a caixa** — nada é
  redimensionado depois.

### Os cinco espaços

| Espaço | Caixa (px) | Ancoragem | O que vai ali |
|---|---|---|---|
| `rug` | **104 × 16** | deitado no chão, centro | tapete — o pet anda POR CIMA |
| `floor-left` | **56 × 56** | apoiado no chão | peça grande: sofá, estante, fogueira, barraca |
| `trophy` | **46 × 50** | apoiado no chão | vitrine de conquistas |
| `floor-right` | **48 × 52** | apoiado no chão | peça pequena: luminária, planta, pedra |
| `wall` | **56 × 40** | pendurado, acima da cabeça | quadro, estandarte, mural |

Nada fica no centro exato do chão (é por onde o pet anda) nem colado nas bordas
(o box arredondado corta).

---

## Estilo

Referência viva: os sprites em `src/assets/soulmon/` — pixel art de v-pet,
paleta limitada, contorno escuro. (A referência anterior eram os `*_dmc.png`,
arte de terceiro que **saiu do repositório**; ver `docs/Attributions.md`. Não
use arte de franquia como referência de estilo aqui — o resultado vai parecer
com ela.)

- **Pixel art**, com pixels legíveis no tamanho final. Nada de anti-aliasing
  suave: a peça vai aparecer em 48–56px e precisa ler nesse tamanho.
- **Fundo transparente** (PNG com alpha). Sem sombra projetada no arquivo — o
  palco já tem a sua.
- **Contorno escuro** de 1px em volta da silhueta, para a peça se destacar de
  qualquer cenário (há 11 cenários à venda, claros e escuros).
- **Luz vinda de cima**, neutra. A peça é vista quase de frente, levemente de
  cima — a mesma perspectiva dos sprites do pet.
- **Paleta contida**: 4 a 6 cores por peça, mais o contorno.

---

## As 14 peças

`fits` diz em que cenário a peça aparece: `indoor` (interior), `outdoor`
(aberto) ou `any` (qualquer um). Peça que não combina com o cenário não é
desenhada — a loja explica em vez de sumir em silêncio.

### Compradas com Bits

| id | Espaço · caixa | fits | Peça | Direção de arte |
|---|---|---|---|---|
| `furn-sofa` | floor-left · 56×56 | indoor | Sofá Pixel | sofá de dois lugares, de frente, almofadas visíveis, tecido em tom quente |
| `furn-chair` | floor-left · 56×56 | indoor | Poltrona | poltrona de orelha, mais estreita que o sofá, encosto alto |
| `furn-books` | floor-left · 56×56 | indoor | Estante de Livros | estante de 3 prateleiras, lombadas coloridas, madeira |
| `furn-lamp` | floor-right · 48×52 | indoor | Luminária | luminária de pé, cúpula acesa em amarelo suave, base fina |
| `furn-rug` | rug · 104×16 | indoor | Tapete de Patinhas | tapete oval visto de cima em forte perspectiva (só 16px de altura), patinhas estampadas, franja nas pontas |
| `furn-plant` | floor-right · 48×52 | any | Vaso de Planta | vaso de barro com folhagem larga, folhas em dois tons de verde |
| `furn-picture` | wall · 56×40 | any | Quadro do Soulmon | moldura retangular com um retrato genérico de criatura dentro, sem identificar espécie |
| `furn-campfire` | floor-left · 56×56 | outdoor | Fogueira | gravetos cruzados, chama em laranja/amarelo, pedras em volta da base |
| `furn-tent` | floor-left · 56×56 | outdoor | Barraca | barraca triangular de camping, abertura escura, estacas |
| `furn-rock` | floor-right · 48×52 | outdoor | Pedra | pedra arredondada com musgo no topo, dois tons de cinza |

### Compradas com Emblemas (aba Torneio — só cosmético, é regra)

| id | Espaço · caixa | fits | Peça | Direção de arte |
|---|---|---|---|---|
| `furniture-champion-banner` | wall · 56×40 | any | Estandarte do Campeão | flâmula pendurada, dourada com detalhe escuro, ponta em V |
| `furniture-medal-wall` | wall · 56×40 | any | Mural de Medalhas | placa de madeira com 3 medalhas penduradas por fitas |
| `furniture-trophy-shelf` | trophy · 46×50 | any | Estante de Troféus | estante de 2 prateleiras **vazia** — o jogo desenha os troféus reais por cima |
| `furniture-podium` | trophy · 46×50 | any | Pódio | pódio de 3 degraus (2º–1º–3º) **vazio** — os troféus reais entram por cima |

> ⚠️ **`furniture-trophy-shelf` e `furniture-podium` têm que sair VAZIOS.** Esses
> dois espaços exibem os troféus de season realmente ganhos (🥇🥈🥉) desenhados
> por cima da peça. Arte com troféu embutido criaria troféu falso — exatamente o
> que a regra de "nada de conquista fabricada" existe para evitar.

---

## Prompt-base

Trocar `<PEÇA>` pela direção de arte da tabela e `<L>×<A>` pelo tamanho da caixa.

```
16-bit pixel art sprite of <PEÇA>, drawn as a single object on a fully
transparent background, no shadow, no ground line, no scenery.
Front view, very slightly from above. Limited palette of 4-6 colors plus a
dark 1px outline around the silhouette. Crisp hard-edged pixels, no
anti-aliasing, no gradients, no blur. Even neutral lighting from above.
The object must be fully readable at <L>×<A> pixels.
Retro virtual-pet toy aesthetic, in the style of late-90s LCD creature games.
```

Para o tapete (`furn-rug`), acrescentar ao prompt:

```
Extreme foreshortening: the object is lying flat on the ground, seen at a
shallow angle, occupying a very wide and short area.
```

---

## Como gerar

`scripts/gen-decor.mjs` já carrega as 14 peças com o prompt-base montado e
dispara tudo pelo CLI da Higgsfield:

```bash
npx --yes @higgsfield/cli auth login     # uma vez, interativo
node scripts/gen-decor.mjs               # gera as 14 em src/assets/decor/
node scripts/gen-decor.mjs furn-sofa     # ou só uma peça
node scripts/gen-decor.mjs --dry-run     # imprime os prompts, não gera
```

> ⚠️ Isto **não roda dentro do sandbox de agente**: a política de rede do
> ambiente responde 403 no CONNECT para `higgsfield.ai`. Rode na máquina do
> dono, ou libere o host na configuração de rede do ambiente
> (https://code.claude.com/docs/en/claude-code-on-the-web).

---

## Depois de gerar

1. Recortar/redimensionar cada peça para a caixa exata da tabela e salvar como
   PNG com alpha em `src/assets/decor/<id>.png`.
2. Ligar a arte no item da loja — a estrutura já aceita PNG (ver
   `docs/PALCO-E-DECORACAO.md`); hoje o `icon` é emoji e o `displayIcon` é um
   ícone lucide.
3. **Conferir sobre pelo menos um cenário claro e um escuro** dos 11 à venda —
   é o que o contorno escuro existe para resolver.
4. Screenshot antes de declarar pronto (convenção do `CLAUDE.md`).
5. Lembrar que o `dist/` é commitado: PNG grande entra duas vezes no
   repositório. O build converte para WebP, então manter os fontes enxutos.

---

## Uma ressalva honesta

Arte gerada fora deste contrato — tamanho errado, fundo não transparente,
perspectiva diferente da dos sprites — vai ficar **pior que os emoji atuais**,
porque o emoji ao menos é consistente consigo mesmo. Se uma peça não sair boa no
tamanho final, é melhor deixá-la como emoji do que forçar. A régua é o teste do
passo 3: sobre um cenário claro e um escuro, no tamanho real, sem zoom.
