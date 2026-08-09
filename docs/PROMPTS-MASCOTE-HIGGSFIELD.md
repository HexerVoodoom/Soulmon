# Prompts do mascote para o Higgsfield

Os cinco conceitos da sessão de agosto/2026, prontos para gerar. Cada um tem o
prompt em inglês, o comando montado e o PNG de referência já desenhado.

> **Nada aqui foi gerado no Higgsfield.** Os cinco sprites em `docs/mascote/`
> foram **desenhados por código** (`scripts/gen-mascot-*.mjs`: geometria +
> PNG escrito à mão com zlib/CRC32, zero dependência), porque
> `platform.higgsfield.ai` está **fora da allowlist de egresso** do ambiente de
> agente. Este documento existe para o momento em que isso for liberado.

---

## 0. Duas regras que não se quebram

### 0.1 Nenhum nome de franquia no prompt — nunca

Os conceitos abaixo nasceram de referências que você citou (Pokémon, Digimon,
Chrono Cross, Monster Rancher, Ragnarok, Warcraft, Palworld). **Os nomes ficaram
fora.** Cada referência foi lida e traduzida em traço descritivo.

Isso não é preciosismo: pedir "inspirado em X" convida o gerador a devolver algo
perto demais de personagem registrado, e o resultado vai para o app de um usuário
real. Foi a causa da limpeza de IP do commit `1b14d2b8`, está registrado em
`docs/Attributions.md`, e **há teste travando a ausência desses nomes** em
`utils/oracle.ts`. Se você editar um prompt daqui, mantenha a regra.

### 0.2 Prompt curto vence

Registrado em `utils/oracle.ts` como template validado em teste real do dono:
frase longa ("wielding X to Y", blocos extras de bioma/tipo) gera sprite **pior**.
A descrição é uma **lista curta de traços**, não uma frase corrida.

---

## 1. Preparo

```bash
# CLI
curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
higgsfield auth login          # interativo, uma vez
higgsfield account status      # confirma sessão
```

Faltam **duas** coisas neste ambiente, e as duas são de dono:

| # | O quê | Como conferir |
|---|---|---|
| 1 | **Liberar `platform.higgsfield.ai`** na política de rede do ambiente | `node scripts/gen-decor.mjs --check` |
| 2 | **Credencial de plataforma** (`HF_*`) ou login do CLI | mesmo comando; hoje acusa `AUSENTES` |

**Modelo:** `nano_banana_2` para os sprites (é o default de personagem/cartoon e
aceita imagem de referência). `gpt_image_2` só para arte de marca em alta
fidelidade — pôster, capa de loja.

---

## 2. O caminho mais forte: gerar COM a referência

Os PNGs já existem e carregam a forma exata. Passar o desenho como referência dá
"o meu sprite, renderizado direito" em vez de uma criatura nova — que é
exatamente o que se quer aqui, já que a forma foi decidida por análise.

```bash
higgsfield generate create nano_banana_2 --wait \
  --image docs/mascote/cub-48.png \
  --prompt "<o prompt da opção, abaixo>"
```

Sem `--image` o gerador inventa do zero. Use assim só quando quiser **explorar**
alternativas; para consolidar uma direção, sempre com referência.

---

## 3. Os cinco prompts

Todos partem do bloco de estilo da casa. Duas variantes de estilo:

- **`[FLAT]`** — o template de `utils/oracle.ts`, usado pelos pets gerados:
  `no shading, no outlines, no anti-aliasing`
- **`[SPRITE]`** — com contorno e sombreado, como as 6 linhas da masmorra
  (`src/assets/soulmon/lines/`) e como os desenhos desta sessão

O mascote provavelmente quer **`[SPRITE]`** (mais presença de marca); os pets
gerados continuam em `[FLAT]`.

---

### A — o Louco (`mascot-48.png`)

*A alma antes do oráculo: sem elemento, sem galho, sem forma seguinte.*

```
Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background:
a small round fluffy spirit, two short horn-like ears, calm half-lidded dot eyes,
tiny flat mouth. Flat off-white and pale lavender colors with indigo accents,
no shading, no outlines, no anti-aliasing.
```

```bash
higgsfield generate create nano_banana_2 --wait --image docs/mascote/mascot-48.png \
  --prompt "Retro virtual-pet sprite, 16x16 pixel art, no background, transparent background: a small round fluffy spirit, two short horn-like ears, calm half-lidded dot eyes, tiny flat mouth. Flat off-white and pale lavender colors with indigo accents, no shading, no outlines, no anti-aliasing."
```

---

### B — o encouraçado (`brute-48.png`)

*Síntese dos 12 monstros favoritos. Candidato a criatura-símbolo, não a mascote.*

```
Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background:
a hunched armored saurian brute, thick plated carapace, one blunt bone horn,
short upward tusks, segmented tail, exposed soft pale underbelly, heavy brow over
a single glowing eye. Flat steel blue-grey colors with amber accents,
no anti-aliasing.
```

```bash
higgsfield generate create nano_banana_2 --wait --image docs/mascote/brute-48.png \
  --prompt "Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background: a hunched armored saurian brute, thick plated carapace, one blunt bone horn, short upward tusks, segmented tail, exposed soft pale underbelly, heavy brow over a single glowing eye. Flat steel blue-grey colors with amber accents, no anti-aliasing."
```

---

### C — a síntese (`cub-48.png`) ← melhor candidato a mascote

*Camada mascote das franquias vizinhas. Passou no teste de 16 px e em cinza.*

```
Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background:
a small round fluffy cub, very long upright ears with pink inner, fluffy neck
ruff, head larger than body, calm half-lidded eyes, pink cheeks, tiny paws,
small tuft tail. Flat warm cream colors with violet and soft pink accents,
no anti-aliasing.
```

```bash
higgsfield generate create nano_banana_2 --wait --image docs/mascote/cub-48.png \
  --prompt "Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background: a small round fluffy cub, very long upright ears with pink inner, fluffy neck ruff, head larger than body, calm half-lidded eyes, pink cheeks, tiny paws, small tuft tail. Flat warm cream colors with violet and soft pink accents, no anti-aliasing."
```

---

### D — dragão de terra (`terra-48.png`)

*Briefing direto do dono. Lê como pet inicial / linha jogável, não como mascote.*

```
Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background:
a cute chubby dragon, long ears, soft round body, small snout with nostrils,
tiny horns, rocky plated shell on its back with outward spikes, long claws,
bright wide eyes, friendly open smile. Flat golden yellow and earth brown colors,
no anti-aliasing.
```

```bash
higgsfield generate create nano_banana_2 --wait --image docs/mascote/terra-48.png \
  --prompt "Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background: a cute chubby dragon, long ears, soft round body, small snout with nostrils, tiny horns, rocky plated shell on its back with outward spikes, long claws, bright wide eyes, friendly open smile. Flat golden yellow and earth brown colors, no anti-aliasing."
```

---

### E — a fusão (`fusion-48.png`)

*A criatura macia CARREGANDO a armadura como concha — algo que veste, não que é.*

```
Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background:
a small round fluffy creature wearing a segmented mineral shell on its back with
outward spikes, very long upright ears with pink inner, fluffy neck ruff, tiny
snout, small blunt horns, calm half-lidded eyes, pink cheeks, short rounded claws.
Flat warm cream colors with violet-grey shell and soft pink accents,
no anti-aliasing.
```

```bash
higgsfield generate create nano_banana_2 --wait --image docs/mascote/fusion-48.png \
  --prompt "Retro virtual-pet sprite, 32x32 pixel art, no background, transparent background: a small round fluffy creature wearing a segmented mineral shell on its back with outward spikes, very long upright ears with pink inner, fluffy neck ruff, tiny snout, small blunt horns, calm half-lidded eyes, pink cheeks, short rounded claws. Flat warm cream colors with violet-grey shell and soft pink accents, no anti-aliasing."
```

---

## 4. Depois de escolher: as quatro poses

O mascote precisa de **quatro** poses, não vinte — está em `MASCOTE-PRINCIPAL.md`
§5 e é restrição de produção, não de estilo: se pose nova for cara, ele não
aparece o suficiente.

Troque só o trecho de ação, mantendo todo o resto do prompt idêntico e passando
sempre a **mesma** imagem de referência:

| Pose | Onde aparece | Trecho a inserir |
|---|---|---|
| Idle | HUD, ícone | `standing still, facing forward` |
| Cumprimento | retorno de ausência, 1ª abertura | `one small paw raised in a gentle wave` |
| Quieto | pet dormindo, offline | `eyes closed, sitting quietly` |
| Apresentando | revelação do oráculo | `both small paws open, presenting something` |

---

## 5. Escalas

| Escala | Para quê | O que sobrevive |
|---|---|---|
| **512 px** | ícone da Play Store, capa Steam, marca | tudo |
| **48 px** | HUD, loja, palco | corpo, orelhas, olhos, boca, partícula |
| **16 px** | favicon, widget Android, ícone do APK | **só** corpo + orelhas + olhos + partícula |

O de **16 px se desenha à mão, não se reduz.** Foi testado nesta sessão: escalar
o de 48 destruiu olho e boca e o resultado lia como caveira. Vale para o que sair
do Higgsfield também.

---

## 6. Conferir antes de aceitar

1. **Fundo é transparente mesmo?** Geradores costumam devolver fundo branco.
2. **Passa em cinza?** Converta e olhe: se a silhueta some, o design não passou.
3. **Reduz para 16 px?** Se não, redesenhe o ícone à mão — não force o resize.
4. **Não ficou parecido demais com personagem existente?** É a checagem que o
   prompt sozinho não garante. Olhe com olhos de quem conhece as franquias.
5. **A cor de acento não invadiu o sistema de tipos?** `ALIGNMENT_ACCENT`
   (`utils/oracle.ts`) reserva **vermelho** = Vírus, **ciano** = Data,
   **dourado** = Vacina. O mascote não pode usar nenhuma das três, ou passa a
   parecer que tem tipo — e ter tipo é estar num galho.

---

## 7. Uma ressalva sobre gerar o mascote

Para as **linhas da masmorra** e a **decoração**, gerador é a ferramenta certa:
volume e variedade.

Para o **mascote**, não inteiramente. A forma precisa ser idêntica em toda escala
e em todo redesenho — é o critério "desenhável de memória" de
`MASCOTE-PRINCIPAL.md` §3. Gerador probabilístico não entrega isso.

O caminho recomendado: **gerar para explorar, travar em código o que for
escolhido.** É o que os `scripts/gen-mascot-*.mjs` já fazem — rodar de novo
produz o mesmo pixel, sempre.
