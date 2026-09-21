# HANDOFF — o eixo sonoro do Soulmon, para a sessão que vai executar

> Escrito em 21/09/2026 pela sessão da Fase 2 (identidade). Serve para uma sessão NOVA
> retomar a SQUAD-SOM sem redescobrir nada. Não decide nada de som: aponta o que já está
> decidido, o que mudou desde então e o que ainda é do dono.

## 1. O que está decidido (não reabra)

- **`docs/SOM.md`** é o guia; **S1..S16** em `docs/REGISTRO-DE-DECISOES.md` §6.1 são as decisões (não existe S14; dizia S13 até 21/09/2026)
  canônicas. Três mordem em código: **R-CAT** (categoria vem do EVENTO, nunca do nível medido),
  **R-EX** (um gesto, uma fonte — `tocarNa` em `src/utils/audioBus.ts`), **R-NOVA** (toda
  superfície nova nasce muda; régua `src/utils/cortes.contract.test.ts`). **D11**: som só por
  gesto, checado no chamador. Alvo de loudness só em `src/utils/loudness.ts` (guard reprova cópia).
- **S1**: a fonte do som NOVO é geração por IA (Higgsfield `seed_audio`). **S10**: enquanto o A/B
  cego não roda, o **procedural é a solução VIGENTE** (8 sons em `src/utils/sounds.ts`,
  calibrados contra a escada) ⚠️ **"zero byte de asset" ficou FALSO em 21/09/2026**: o S16
  instalou cinco `.webm` em `public/sounds/`, e três sons preferem o asset com o
  procedural como fallback (`playComAsset`). "O procedural venceu" é frase proibida — o outro
  lado nunca entrou em campo.
- **S6**: 300 KB no total, zero no bundle inicial. `dist/` é commitado: byte é permanente.
- **S13**: o contrato adaptativo E0–E6 (trilha em camadas) fica CONGELADO até haver ≥2 camadas
  reais no repo E o dono ter ligado a trilha por gesto. Só **E0** e a chave separada da trilha
  valem hoje.
- O run `som-01` já rodou as 6 fases (08–09/09/2026). Artefatos em `squad-alpha-runs/som-01/`
  (**não versionado** — existe só nesta máquina; confira com `ls` antes de qualquer coisa).

## 2. O que mudou desde o run `som-01`

| Mudança | Consequência para o som |
|---|---|
| **Crédito no gerador**: a conta Higgsfield tem **~480 cr** (21/09/2026; era 0,45 em 09/09) | O bloqueio (1) da §7 do `SOM.md` **caiu**. O gatilho de `pacote-prompts.md` §0 pode disparar — depois do item (2) abaixo |
| **Fase 2 identidade fechada** (tese "O Visor": pixel só dentro do vidro; 14 canvases em `docs/design/DECISOES-WIREFRAME.md` §18–§31) | Todo evento sonoro tem hoje uma superfície desenhada com FX visual próprio (`animArt`, `gainArt`, `attackFxArt`). O som de um evento acompanha o FX desse evento — o `spotting` do `inventario-sonoro.md` §1 continua válido, mas confira contra o artboard |
| **Bíblia narrativa** (`docs/NARRATIVA-E-UNIVERSO.md`): registro diegético na VOZ, declarado na MOLDURA; leis L1–L12; elemento `som` = "vibra, é percebido pelo ar antes de ser visto"; mundo = **a Malha**, fagulha, arcano-tech | Som novo obedece às leis como a copy: **nada que cobre** (L1/L6), nada avaliativo de manhã, som de HP/degeneração não pode soar como punição (a spec já dizia isso — agora tem lei). O território tímbrico "vínculo" do §5.1 do inventário ganha vocabulário: fagulha, Malha, assentamento |
| `narrativa.contract.test.ts` trava vocabulário vetado em fonte | Nome de asset/manifesto de som também é fonte: nada de `digi*`, `tamer`, etc. |
| `SoundsSettings`/sons nas Configurações foram redesenhados no canvas Conta (§29) | Onde a pessoa liga/desliga som e trilha já existe em `FormKit` (`SwitchRow`); a chave da trilha separada de `SOUND_MUTED` (S13) entra ali |
| `ArenaGame.tsx` reintroduziu sons cortados (achado que criou R-NOVA) | Conferir `cortes.contract.test.ts` verde antes de começar |

## 3. O que ainda é do dono (perguntar ANTES de gerar)

1. **Termos comerciais da saída do `seed_audio`** — §13.2 do Higgsfield nega garantia de
   originalidade e põe o *rights clearance* no usuário. Como `dist/` é commitado, o byte fica no
   histórico para sempre. **Sem "sim" explícito do dono, não se baixa nem um WAV para o repo**
   (gerar e ouvir fora do repo, em `E:/`, é permitido).
2. **Política de loja sobre áudio gerado por IA** (Play/Steam) — declarar ou não.
3. Som próprio da Arena · o que fica no lugar do som do carinho (C-4) · alvo da classe
   **Degeneração** (a spec não tem a linha — `pos-processar.mjs` RECUSA; `ab-piloto.md` §4.2).

Se o dono já respondeu 1–3 em outro lugar, está em `docs/REGISTRO-DE-DECISOES.md` §6.1 ou em
`docs/STATUS.md` §3 — procure antes de perguntar.

## 4. O que executar, na ordem

1. Ler `docs/SOM.md` inteiro, depois `.claude/skills/squad-som/SKILL.md` (o cabeçalho diz o que
   NÃO refazer) e `squad-alpha-runs/som-01/prototyper/pacote-prompts.md` **§0** (o gatilho,
   passo a passo literal).
2. Perguntas do §3 acima ao dono, em modal, **antes** de qualquer geração.
3. Com o "sim": `pacote-prompts.md` §0 passos 1–6 — gerar os 12 prompts (`--sample-rate 48000`,
   `--format wav`), pós-processar cada um (`pos-processar.mjs`; 4 `[PASS]` ou não entra),
   montar o **A/B cego** pelo protocolo de `ab-piloto.md` §8 (não reescrever), com o dono como
   ouvinte. O A/B é a premissa do run inteiro: ele decide S1×S10.
4. Resultado do A/B → registrar em `REGISTRO-DE-DECISOES.md` §6.1 (gatilho da S10 está escrito
   lá: IA vence em ≥2 de 3 pares → procedural volta a ser provisório; empata/perde → S1 cai para
   SFX). Só então instalar o que venceu, dentro do S6, com atribuição em `docs/Attributions.md`
   no MESMO commit em que o arquivo nasce.
5. Pendências técnicas do engenheiro (não bloqueiam o A/B, entram na mesma rodada): flake do gate
   (1 em 11 — persistir diagnóstico ao falhar), **O-5** (sons cortados entram na medição), **O-7**
   (`FORA_DO_AC1` discorda do filtro `/^g[1-7]-/`).
6. Fechar: `tsc` ×3, `vitest` inteiro (a suíte de som mora em `src/`), `npm run build`,
   `CACHE_VERSION` +1 se entrar asset, STATUS, `/manter-docs auto`.

## 5. Armadilhas que já custaram (leia `SOM.md` §8)

`ffmpeg` não existe nesta máquina (medidor é Node puro) · gate exige Chromium (`driver-chrome.mjs`)
· baseline em Node diverge do Chromium (1,44–1,76 dB) — medir no motor real · fonte estocástica só
se afere sobre N ≥ 12 · `playPoopAlert`/`playMenuOpen` exportados com 0 call-sites · teste de som
tem de morar em `src/` · temporários em `E:/`, nunca em `C:/` · commit por caminho, nunca
`git add -A`.
