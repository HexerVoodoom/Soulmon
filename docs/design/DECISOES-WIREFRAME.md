# Decisões de wireframe — o que o dono respondeu antes do primeiro desenho

> **Dono:** `soulmon-design-lead` (registro) · decididas pelo **dono do produto** em 13/09/2026,
> em modal, uma a uma · **Estado:** vivo — recebe uma seção por fluxo a cada `decidir`
> **Verificação:** as 20 respostas abaixo casam 1:1 com as 11 dúvidas de
> [INVENTARIO-WIREFRAMES.md](INVENTARIO-WIREFRAMES.md) §3.2 e as 9 tensões de
> [PRINCIPIOS-DE-WIREFRAME.md](PRINCIPIOS-DE-WIREFRAME.md) §14. As cinco que reabrem decisão
> de produto estão também no [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) §13.
> **Não cobre:** as decisões por fluxo (entra/volta/sai), que nascem a cada `decidir`.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este doc. Onde uma decisão abaixo
> reabre regra, o código ainda faz o antigo até alguém implementar — o wireframe desenha o
> NOVO e marca `[decisão 13/09]` no rodapé.

## 1. Estrutura dos canvases (dúvidas 1–3, 5, 9)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D1 | Sub-aba do pet (`PetPage`, `DreamDex`, `AdventureDiary`) | **Canvas próprio "Pet"** | 11º canvas; desenhado logo após Rituais (P0+). `EVO-22`→`EVO-29` migram para `PET-*` |
| D2 | Biblioteca (social, coop, presentes) | **Canvas próprio "Social"** | 12º canvas; o `soulmon-guarda-linha-vermelha` dá parecer sobre ele inteiro. `CONTA-26`→`CONTA-32` migram para `SOC-*`; o caminho de chegada continua sendo o menu |
| D3 | Posição do Onboarding | **Dividido**: funil (identidade → free/pago → objetivo → escolher personagem) em **4º**; ritual do Oráculo em **último** | Dois canvases: `onboarding-funil/` e `onboarding-oraculo/` |
| D5 | `ShopModal` variante sheet (sem `asPage`, sem caminho vivo) | **Registrar como achado, não desenhar** | `LOJA-12` → `fora`; item no STATUS como candidato a remoção |
| D9 | Offline | **Artboard offline nas quatro superfícies de rede** (Biblioteca, Torneio, chat, geração de sprite) | +4 artboards; o `OfflineSeal` continua na raiz |

Ordem final dos canvases: Home · Atividades · Rituais · **Pet** · Onboarding-funil · Evolução ·
Jogos · Loja · Estatísticas · **Social** · Conta · Fora do app · Onboarding-oráculo.

## 2. Conteúdo e estados (dúvidas 4, 6, 7, 8, 10, 11)

| # | Dúvida | Decisão | Consequência |
|---|---|---|---|
| D4 | Ramos de save antigo (`STAT-10`, `EVO-23`, `ONB-13`) | **Marcar `fora`; a conta vai ao STATUS** | Não se desenha. Apagar código continua decisão separada do dono |
| D6 | Seis superfícies sem descrição no manual (inclui o seletor de comida, P0) | **Medir no código antes de desenhar** | O cartógrafo acrescenta as subseções ao `03-FLUXO-DE-TELAS.md` §4 e troca `medição faltando` no inventário (rodada de 13/09/2026) |
| D7 | `reduced-motion` | **Artboard extra só onde a ESTRUTURA muda** (ex.: a intercalação de 3 s da evolução vira quadro estático); onde só desliga animação, nota no rodapé | |
| D8 | Idioma do artboard | **Inglês é a língua principal do wireframe** (é a base do produto — "inglês é a base, PT-BR é localização", `CLAUDE.md`). PT-BR vai como nota `PT: …` no rodapé; artboard extra só onde o comprimento muda a caixa (barra inferior, botões de largura fixa) | Corrige o handoff §5 e a regra W2 |
| D10 | Carga do dia (`isOvercommitted`) | **Linha no check-in + peça discreta no topo da lista** quando estourar; convite, sem vermelho | Aviso, nunca bloqueio (`02` §33) |
| D11 | As quatro divergências código × `CLAUDE.md` (loja 2 segmentos, `UnlockNudge` em 6 pontos, microfone vira "enviar", marco espera o gesto) | **Nenhuma reaberta: desenhar como o código faz** | O `CLAUDE.md` é corrigido pelo dono depois |

## 3. As nove tensões pesquisa × decisão (T1–T9)

Cinco foram **reabertas** pelo dono — são decisões de produto novas e estão no
`REGISTRO-DE-DECISOES.md` §13 com a alternativa que perdeu e o gatilho de revisão. Quatro
mantidas.

| # | Tema | Decisão do dono (13/09/2026) | Para o wireframe |
|---|---|---|---|
| T1 | Paywall no reveal | **REABERTA: oferta no reveal** | O reveal ganha a oferta — **dispensável pelo próprio card, largura parcial, container igual ao não-comercial, "agora não" com o peso do primário** (padrão Garmin, `PRINCIPIOS` §8). Sem tabela free × pago, sem preço riscado, sem contagem |
| T2 | Contador do dia no widget | **REABERTA: mostrar o contador** | O widget desenha "N de M" — **só quando ≥ 1 feita** e nunca com verbo de cobrança; a faixa de constância continua. Implementar exige mudar `widgetSemCobranca.contract.test.ts` e a linha do `CLAUDE.md` |
| T3 | "FOMO saudável" (live-ops rotativo) | **Segue a pesquisa** | Visita/conteúdo rotativo semanal **que aparece por tempo mas nunca tira o que já foi ganho** — a proibição #15 ("última chance", FOMO que tira) continua valendo na copy: nada de contagem regressiva nem "expira". Desenhar como ritual, não como tranca |
| T4 | Card compartilhável mensal | **REABERTA: card mensal também** | Dois gatilhos: evolução (existente) e mês fechado — ambos com **piso** (nenhum campo em zero) |
| T5 | Estoque de escudos | **REABERTA: visível sempre, inclusive zero** | Seção "o que você tem" na lista/estatísticas mostra os escudos como posse (leitura Yazio, `MOB §15.5`), zero incluído, **sem placar nem "faltam"** |
| T6 | Prestígio visual (D4: o que dói perder) | **Prestígio visível; escudo NÃO quebra a aura** | A aura de 28 dias (`steadyWindow`) aparece; dia protegido por escudo conta como feito. O que dói perder continua sendo só o coração (teto 1/dia) |
| T7 | Criatura do amigo no estágio real | **Mantido o veto (#21)** | Amigo aparece como é, sem escada nem rank ao lado do seu |
| T8 | Psicométrico invisível | **Mantido invisível** | Nome e descrição no reveal; nada de eixo nem "porque" |
| T9 | Valor antes de cadastro | **Mantido: conta primeiro, com o porquê visível** | A tela de conta desenha o valor (o que a conta guarda, a promessa) ANTES do campo, e o caminho "entrar depois" onde a regra permitir |

## 4. O que muda nos documentos por causa disto

- `HANDOFF-WIREFRAMES.md` §4 (ordem: +Pet, +Social, Onboarding em dois), §5 (inglês principal),
  §8 (as cinco reaberturas saem de "não se reabre").
- `INVENTARIO-WIREFRAMES.md`: `LOJA-12` e os três ramos de save → `fora`; ids `PET-*` e
  `SOC-*`; +4 artboards offline; as seis medições (rodada do cartógrafo).
- `PRINCIPIOS-DE-WIREFRAME.md` §14: coluna "decisão do dono 13/09" apontando para cá.
- `REGISTRO-DE-DECISOES.md` §13: as cinco reaberturas.
- `.claude/skills/squad-design/METODO.md` W2: inglês principal.
