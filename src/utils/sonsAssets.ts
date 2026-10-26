/**
 * ASSETS DE ÁUDIO GERADOS POR IA — o manifesto e a carga preguiçosa.
 *
 * Decisão do dono em 21/09/2026 (`docs/REGISTRO-DE-DECISOES.md` §6.1, S16):
 * instalar os candidatos de IA dos eventos LONGOS e a trilha **sem** o A/B cego
 * ter rodado — "só pra gente ter pronto; depois melhoramos". Em 21/09/2026 o
 * dono confirmou: **o gerado nos três** (`playEvolve`, `playDegenerate`,
 * `playTaskComplete`) — escolha dele, não resultado do protocolo do A/B. A S10 muda de dono, não de método: o
 * procedural continua sendo o **fallback** de cada um desses três sons (se o
 * arquivo ainda não chegou, não decodificou, ou o `fetch` falhou, o som que
 * toca é o de sempre), e os cinco sons CURTOS continuam procedurais porque o
 * gerador reprovou neles (`docs/PERGUNTAS-DO-DONO.md` #10).
 *
 * Regras que este arquivo cumpre, e o teste que as trava
 * (`sonsAssets.contract.test.ts`):
 * - **S6 — zero no bundle inicial.** Nada aqui é `import`ado como asset: os
 *   arquivos vivem em `public/sounds/` e só saem da rede na PRIMEIRA chamada
 *   de `prepararAssets()`, que acontece dentro de um `play*` — ou seja, depois
 *   de um gesto, nunca no carregamento. E nenhum deles pode estar em
 *   `PRECACHE_URLS` do `public/sw.js`.
 * - **S6 — 300 KB no total.** O teste soma os bytes dos arquivos em disco.
 * - **S9 — procedência.** Hash SHA-256 casado nas duas direções: o manifesto
 *   aqui ↔ o arquivo em `public/sounds/` ↔ a linha em `docs/Attributions.md`.
 *   O guard prova procedência, nunca originalidade (S9/S15).
 * - **Loudness.** Os WAVs mestres saíram do `pos-processar.mjs` já no alvo da
 *   categoria (P-A); o bus da categoria fica em 0 dB. Por isso o buffer toca
 *   com ganho **1** e este arquivo NÃO declara alvo nenhum — a política é de
 *   `utils/loudness.ts`, dono único (footgun 9).
 * - **Formato.** WebM/Opus 48 kbps mono, codificado pelo MediaRecorder do
 *   Chrome (não há codec nesta máquina) e decodificado por `decodeAudioData`
 *   no mesmo motor. O MediaRecorder grava um pré-rolo de silêncio na cabeça:
 *   `recortarSilencio` acha o onset ao decodificar, então o som começa no
 *   gesto, não 240 ms depois.
 */
import type { CategoriaSom } from './loudness';
import type { NomeSfxCombate } from './sfxCombate';

export interface AssetDeSom {
  /** Caminho servido, relativo à origem. */
  url: string;
  /** SHA-256 do arquivo em `public/`, minúsculo. */
  sha256: string;
  /** Bytes do arquivo — para o S6 ser conferido sem abrir o arquivo. */
  bytes: number;
  categoria: CategoriaSom;
  /** Duração ÚTIL (sem o pré-rolo), em segundos — fecha os duckings D-1/D-2. */
  duracaoS: number;
  origem: 'higgsfield/seed_audio' | 'higgsfield/sonilo_music';
  /** Onde está o prompt literal (não o texto — o texto fica fora do bundle). */
  promptRef: string;
  geradoEm: '2026-09-21';
}

export const ASSETS_DE_SOM = {
  playEvolve: {
    url: '/sounds/evolve.webm',
    sha256: 'cc8e814b51c7eb5df5a3827cde0674492e869db35f30a4fef778094dc1fc1dfe',
    bytes: 7641,
    categoria: 'marco',
    duracaoS: 1.2,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.1',
    geradoEm: '2026-09-21',
  },
  playDegenerate: {
    url: '/sounds/degenerate.webm',
    sha256: '1508cfaff0c4889152a94bf7b2735b1e03762dd3b228f7186397b89fb79d904b',
    bytes: 4498,
    categoria: 'degeneracao',
    duracaoS: 0.7,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.12',
    geradoEm: '2026-09-21',
  },
  playTaskComplete: {
    url: '/sounds/task-complete.webm',
    sha256: '798225a0dd836866b886506fa8d697fcda87e7eaafd30a783724211bff2d9520',
    bytes: 1570,
    categoria: 'conclusao',
    duracaoS: 0.2,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.7',
    geradoEm: '2026-09-21',
  },
} as const satisfies Record<string, AssetDeSom>;

export type NomeDeAsset = keyof typeof ASSETS_DE_SOM;

/** Duração do crossfade entre músicas ao trocar de superfície (tema ↔ combate ↔ pesadelo), em segundos. */
export const CROSSFADE_MUSICA_S = 1.2;

/**
 * OS 7 EFEITOS DE COMBATE vindos de BANCO GRATUITO LIVRE (pedido do dono, 20/10/2026: "o som eu não gostei muito, vê se acha
 * algum banco de dados GRATUITO"; `docs/REGISTRO-DE-DECISOES.md` §130). Substituem como PADRÃO a síntese procedural de
 * `sfxCombate.ts` (§120), que continua como FALLBACK (arquivo que não chegou/decodificou → o procedural toca naquele golpe).
 *
 * Regras (travadas por `sfxCombateLivres.contract.test.ts`):
 * - **Só licença que permite uso comercial, sem API paga**: aqui tudo é CC0 1.0 (domínio público) — Kenney (kenney.nl). Atribuição NÃO é obrigatória, mas está em `docs/Attributions.md` por boa prática.
 * - **Procedência por arquivo**: `fonte` (arquivo original, pacote, URL, autor, licença, data de acesso, SHA-256 do original).
 *   Sample sem `fonte` completa reprova o teste de contrato.
 * - **Orçamento próprio**: ≤ 40 KB por arquivo (a soma NÃO entra nos 300 KB do S6, que é dos 5 assets de IA); zero no bundle
 *   inicial (arquivos estáticos em `public/sounds/`, baixados sob demanda pela cena de luta); fora do pré-cache.
 * - **Nível**: o mestre saiu JÁ no alvo da categoria `arcade` (LUFS-M máx. 400 ms, K-weighting; true peak ≤ −1 dBTP), medido
 *   DEPOIS do encode, no arquivo decodificado pelo Chrome — por isso toca a ganho 1 e este arquivo NÃO declara alvo: os campos
 *   `medidoLufsM`/`medidoTruePeakDbtp` são o FATO medido do arquivo, e o teste os compara com `loudness.ts` (dono único).
 * - **Formato**: WebM/Opus 64 kbps mono (MediaRecorder do Chrome, como os outros sons curtos). Sem m4a: como os outros SFX
 *   curtos, quem não decodifica Opus em WebM cai no fallback procedural.
 * Trocar um som = trocar o arquivo + hash + medidas + linha da Attributions (o teste cobra as três).
 */
export interface FonteLivre {
  /** O nome do arquivo ORIGINAL no pacote. */
  arquivo: string;
  pacote: string;
  /** A página de onde veio. */
  urlOrigem: string;
  autor: string;
  licenca: 'CC0 1.0';
  urlLicenca: string;
  /** Data em que a página e a licença foram lidas e o arquivo baixado. */
  acessadoEm: string;
  /** CC0 não exige crédito; `true` obrigaria uma linha na Attributions (e o teste cobra as duas). */
  atribuicaoObrigatoria: boolean;
  /** SHA-256 do arquivo original baixado (antes de recortar/normalizar/codificar). */
  sha256Original: string;
  /** Se o asset NÃO é o original recortado/normalizado, o que foi feito (só sobre material CC0). */
  processamento?: string;
}

export interface AssetDeSfxLivre {
  /** O item do pedido do dono. */
  id: 'D-86' | 'D-87' | 'D-88' | 'D-89' | 'D-90' | 'D-91' | 'D-92';
  url: string;
  sha256: string;
  bytes: number;
  categoria: 'arcade';
  /** Duração ÚTIL do arquivo decodificado, em segundos (teto do pedido: efeitos ≤ 1,2 s; vitória/derrota ≤ 2 s). */
  duracaoS: number;
  /** LUFS-M máx. do arquivo decodificado (fato medido, não alvo). */
  medidoLufsM: number;
  /** True peak do arquivo decodificado, dBTP (fato medido). */
  medidoTruePeakDbtp: number;
  fonte: FonteLivre;
}

const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const KENNEY = (pacote: string, slug: string, arquivo: string, sha256Original: string): FonteLivre => ({
  arquivo, pacote, urlOrigem: `https://kenney.nl/assets/${slug}`, autor: 'Kenney Vleugels (Kenney.nl)', licenca: 'CC0 1.0',
  urlLicenca: CC0_URL, acessadoEm: '2026-10-20', atribuicaoObrigatoria: false, sha256Original,
});

export const SFX_DE_COMBATE_LIVRES = {
  playAttack: {
    id: 'D-86', url: '/sounds/sfx-combate-attack.webm', categoria: 'arcade', duracaoS: 0.352, medidoLufsM: -25.03, medidoTruePeakDbtp: -10.77,
    sha256: '75c2ed92348f009ec55ba247b33d931a68a2c3f795d2c67945f85fcd60b4eab8', bytes: 3212,
    fonte: KENNEY('RPG Audio', 'rpg-audio', 'knifeSlice.ogg', '4cd96dc630bed9840c15f1dd2306da2cc56a4da26a5d3f1a03c5a7265ac5e54f'),
  },
  playDefend: {
    id: 'D-87', url: '/sounds/sfx-combate-defend.webm', categoria: 'arcade', duracaoS: 0.415, medidoLufsM: -24.98, medidoTruePeakDbtp: -3.33,
    sha256: '618c762eea231ec47cee8cfb6d18608424589a4d1d8a8cf86203dc77dd4538c1', bytes: 3698,
    fonte: KENNEY('Impact Sounds', 'impact-sounds', 'impactPlate_medium_000.ogg', 'b670d30452983369771081319c268475edaaafe782bf4e8d70bd7eef09d8823c'),
  },
  playAttackRanged: {
    id: 'D-88', url: '/sounds/sfx-combate-attack-ranged.webm', categoria: 'arcade', duracaoS: 0.415, medidoLufsM: -24.97, medidoTruePeakDbtp: -10.6,
    sha256: '6c5ce452751423a312893b8d67d3daa2d3df3cb90562992062665767ea215ab1', bytes: 3698,
    // 21/10/2026 (§162): o dono ouviu 3 candidatos CC0 e escolheu o zap de energia da Kenney para o golpe à distância (o "plim" de
    // `magical_3` e o "push" do §152 saíram).
    fonte: {
      ...KENNEY('Sci-Fi Sounds', 'sci-fi-sounds', 'laserLarge_002.ogg', 'e5e0b6ccc4d5720c8174a3e5b7cc6f9be3057352a89cbb2e99a00efc6fe5cc11'),
      processamento: 'derivado: leitura com velocidade 0,85x (meio tom abaixo), passa-baixa 5 kHz, recorte de 0,5 s com fade-in de 3 ms e fade-out em cosseno de 0,25 a 0,50 s',
    },
  },
  playCharge: {
    id: 'D-89', url: '/sounds/sfx-combate-charge.webm', categoria: 'arcade', duracaoS: 1.191, medidoLufsM: -25.02, medidoTruePeakDbtp: -13.53,
    sha256: 'c82e917f312b19f34b01b7eabca2b330fae5fc38accf0f62642229ef870ad576', bytes: 10016,
    // 20/10/2026: o dono quis "algo como o KI do Dragon Ball" (energia que sobe). Não há um sample CC0 pronto disso, então o
    // zumbido de motor CC0 da Kenney é tocado com a velocidade subindo (tom sobe), brilho crescente e envelope em crescendo.
    fonte: {
      ...KENNEY('Sci-Fi Sounds', 'sci-fi-sounds', 'spaceEngine_001.ogg', 'ee53af299758b664c086d9ca99efecb41168596ea9fb1c5c24ac4389f94aea6b'),
      processamento: 'derivado: leitura com velocidade 0,7x→1,7x (curva quadrática), passa-baixa que abre, crescendo (u^2) de 1,2 s',
    },
  },
  playSpecial: {
    id: 'D-90', url: '/sounds/sfx-combate-special.webm', categoria: 'arcade', duracaoS: 0.715, medidoLufsM: -24.97, medidoTruePeakDbtp: -11.39,
    sha256: 'e3ec62f3c969c43958ca0475d36f9c7c4d4a844f6e6825005dcfe183c2a1ecc3', bytes: 6128,
    fonte: KENNEY('Sci-Fi Sounds', 'sci-fi-sounds', 'explosionCrunch_000.ogg', '4b597d658d0ae101f0a030fbeea5fc3a4292ab85f017470a8254a8e7959cbd69'),
  },
  playVictory: {
    id: 'D-91', url: '/sounds/sfx-combate-victory.webm', categoria: 'arcade', duracaoS: 1.134, medidoLufsM: -25.0, medidoTruePeakDbtp: -11.91,
    sha256: '3bad651252787f25852c21c9e3a57223fbd91bd86af090e2fa0d53282526093f', bytes: 9530,
    fonte: KENNEY('Music Jingles', 'music-jingles', 'jingles_HIT15.ogg', 'e2929ad1acb0ff929f2367eb06d4a57d3c543be9f5a8b6a7fad7e44e440474e1'),
  },
  playDefeat: {
    id: 'D-92', url: '/sounds/sfx-combate-defeat.webm', categoria: 'arcade', duracaoS: 1.494, medidoLufsM: -24.97, medidoTruePeakDbtp: -12.76,
    sha256: '4c39dd150f05105fdb1bdc4a506078d5e2f277c47cbe8c7688b059015985087f', bytes: 12446,
    fonte: KENNEY('Music Jingles', 'music-jingles', 'jingles_STEEL07.ogg', '206b5cb18870c1faa393047cb857eda28441b9682380c9eb5910119ea04c2ece'),
  },
} as const satisfies Record<NomeSfxCombate, AssetDeSfxLivre>;

/** Teto de peso por efeito de combate livre, em bytes. */
export const TETO_BYTES_SFX_LIVRE = 40 * 1024;

const buffers = new Map<string, AudioBuffer>();
const emCurso = new Map<string, Promise<AudioBuffer | null>>();

/** Limiar de onset: −60 dBFS. Abaixo disso é o pré-rolo do MediaRecorder. */
const LIMIAR_ONSET = 0.001;

export function recortarSilencio(ctx: BaseAudioContext, buf: AudioBuffer): AudioBuffer {
  const d = buf.getChannelData(0);
  let ini = 0;
  while (ini < d.length && Math.abs(d[ini]) < LIMIAR_ONSET) ini++;
  if (ini === 0 || ini >= d.length) return buf;
  const n = buf.length - ini;
  const out = ctx.createBuffer(buf.numberOfChannels, n, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    out.copyToChannel(buf.getChannelData(c).subarray(ini), c);
  }
  return out;
}

/**
 * Baixa e decodifica UM asset. Nunca lança: qualquer falha devolve `null` e o
 * chamador fica no procedural. Idempotente — a segunda chamada devolve a mesma
 * promessa ou o buffer já pronto.
 */
export function carregarAsset(ctx: BaseAudioContext, asset: Pick<AssetDeSom, 'url'>): Promise<AudioBuffer | null> {
  const pronto = buffers.get(asset.url);
  if (pronto) return Promise.resolve(pronto);
  const andando = emCurso.get(asset.url);
  if (andando) return andando;
  if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') return Promise.resolve(null);
  const p = fetch(asset.url)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(ab => ctx.decodeAudioData(ab))
    .then(buf => {
      const rec = recortarSilencio(ctx, buf);
      buffers.set(asset.url, rec);
      return rec;
    })
    .catch(() => null)
    .finally(() => emCurso.delete(asset.url));
  emCurso.set(asset.url, p);
  return p;
}

/** O buffer se JÁ estiver decodificado; `null` = toca o procedural desta vez. */
export function assetPronto(nome: NomeDeAsset): AudioBuffer | null {
  return buffers.get(ASSETS_DE_SOM[nome].url) ?? null;
}

/** O buffer do efeito de combate livre, se JÁ decodificado; `null` = toca o procedural (fallback) desta vez. */
export function sfxLivrePronto(nome: NomeSfxCombate): AudioBuffer | null {
  return buffers.get(SFX_DE_COMBATE_LIVRES[nome].url) ?? null;
}

let sfxLivresPreparados = false;
/** Baixa e decodifica os 7 efeitos de combate (idempotente; nunca rejeita; falha → fica no procedural). */
export function prepararSfxLivres(ctx: BaseAudioContext): Promise<void> {
  if (sfxLivresPreparados) return Promise.resolve();
  sfxLivresPreparados = true;
  return Promise.all(
    (Object.keys(SFX_DE_COMBATE_LIVRES) as NomeSfxCombate[]).map(n => carregarAsset(ctx, SFX_DE_COMBATE_LIVRES[n])),
  ).then(() => undefined);
}

let preparado = false;
/**
 * Dispara a carga dos três SFX de uma vez, na primeira chamada. É chamada de
 * dentro de `play()` — depois do gate de mudo e do gesto — e não espera nada.
 */
export function prepararAssets(ctx: BaseAudioContext): void {
  if (preparado) return;
  preparado = true;
  for (const nome of Object.keys(ASSETS_DE_SOM) as NomeDeAsset[]) void carregarAsset(ctx, ASSETS_DE_SOM[nome]);
}

/** Só para teste: esquece tudo o que foi carregado. */
export function esquecerAssets(): void {
  buffers.clear();
  emCurso.clear();
  preparado = false;
  sfxLivresPreparados = false;
}

/** Toca um buffer já no alvo: ganho 1, sem oferta de nível (footgun 9). */
export function tocarBuffer(ctx: BaseAudioContext, destino: AudioNode, buf: AudioBuffer): number {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(destino);
  src.start(ctx.currentTime);
  return buf.duration;
}

/**
 * A MÚSICA-TEMA DO JOGO — "Stone Hall Decay" (decisão do dono, 07/10/2026,
 * `docs/REGISTRO-DE-DECISOES.md` §6.1, S17).
 *
 * É a música que o dono gerou no Suno e pediu como tema. Ela é DIFERENTE dos
 * assets acima em três pontos, e cada um tem teste (`sonsAssets.contract.test.ts`):
 * - **Fora do S6 de 300 KB**: são 3,9 MB de origem (≈2,4 MB por formato depois de
 *   transcodada), e o S6 foi escrito para SFX/camadas. O orçamento dela é o
 *   próprio: ≤ 2,5 MB POR FORMATO, **zero no bundle inicial** (nada importa o
 *   arquivo; ele sai da rede só depois do primeiro gesto) e fora do pré-cache.
 * - **Dois formatos, um por suporte** (`canPlayType`): Opus em WebM (Chrome,
 *   Android WebView, Firefox) e AAC em M4A (Safari/iOS). Ambos saem do MESMO
 *   mestre, no mesmo ganho — o alvo de loudness é o da trilha, de
 *   `utils/loudness.ts` (dono único); este arquivo não declara alvo nenhum.
 * - **Streaming, não buffer**: 3m40 decodificados seriam ~70 MB de PCM na RAM de
 *   um celular. Toca num `<audio>` ligado ao `busTema` (`utils/tema.ts`).
 * Procedência (S9): a origem é "gerada no Suno pelo dono"; o plano pago foi DECLARADO pelo dono em 19/10/2026, mas
 * falta o print da página do plano — pendência escrita em `docs/Attributions.md`. Este arquivo NÃO afirma licença; o
 * guard prova procedência, nunca originalidade nem licença.
 */
export interface FormatoDoTema {
  url: string;
  /** Valor para `canPlayType`. */
  mime: string;
  sha256: string;
  bytes: number;
}

/** O que o player de streaming (`streamMusica.ts`) precisa saber de uma música: o tema e as de combate têm a mesma forma. */
export interface ManifestoDeMusica {
  nome: string;
  /** Duração do mestre, em segundos. */
  duracaoS: number;
  /** Silêncio entre o fim da faixa e a volta, em segundos. */
  pausaEntreVoltasS: number;
  /** Fade-in de cada volta, em segundos. */
  fadeInS: number;
  origem: string;
  geradoEm: string;
  formatos: readonly FormatoDoTema[];
}

export const TEMA_DO_JOGO = {
  nome: 'Stone Hall Decay',
  /** Duração do mestre, em segundos (o mesmo nos dois formatos, ±1 frame). */
  duracaoS: 227.48,
  /** Silêncio entre o fim da faixa (que já termina em fade) e a volta, em segundos. */
  pausaEntreVoltasS: 30,
  /** Fade-in de cada volta, em segundos — o fim é o fade da própria faixa. */
  fadeInS: 2,
  origem: 'suno/fornecida-pelo-dono',
  geradoEm: '2026-10-19',
  formatos: [
    {
      url: '/sounds/tema-stone-hall-decay.webm',
      mime: 'audio/webm; codecs="opus"',
      sha256: '65944d0daf3ed90f979f3471686f80d7b3d1dc71ca0fd6f36ec8fb6c54eed31e',
      bytes: 2296694,
    },
    {
      url: '/sounds/tema-stone-hall-decay.m4a',
      mime: 'audio/mp4; codecs="mp4a.40.2"',
      sha256: '01edff65c7f84dc2c96caf96d29b8e697a541927f217da79e4ae934e5837c371',
      bytes: 2555598,
    },
  ],
} as const satisfies ManifestoDeMusica;

/**
 * AS MÚSICAS DE COMBATE em streaming (decisão do dono, 19/10/2026, `docs/REGISTRO-DE-DECISOES.md` §102): "Stone Hall
 * Combat" toca na Masmorra, na Arena, no Torneio e no Duelo; "Stone Hall Nightmare" toca no Pesadelo. Mesma forma do
 * tema (streaming num `<audio>`, formato por suporte, fora do S6 de 300 KB, ≤ 2,5 MB por formato, fora do pré-cache), e a
 * mesma ressalva de procedência: geradas no Suno do dono, plano pago DECLARADO por ele em 19/10/2026, falta o print do
 * plano (`docs/Attributions.md`); nenhuma licença é afirmada aqui. O nível é de `utils/loudness.ts`
 * (`TRIM_MUSICAS_DE_COMBATE_DB`); este arquivo não declara alvo nenhum.
 */
export const MUSICAS_DE_COMBATE = {
  combate: {
    nome: 'Stone Hall Combat',
    duracaoS: 197.88,
    /** Respiro curto: combate não fica 30 s mudo entre voltas. */
    pausaEntreVoltasS: 4,
    fadeInS: 2,
    origem: 'suno/fornecida-pelo-dono',
    geradoEm: '2026-10-19',
    formatos: [
      {
        url: '/sounds/musica-combate.webm',
        mime: 'audio/webm; codecs="opus"',
        sha256: 'f94ea91cf3d8a32059889c87c678c37a19270ad3b95a6b49f7707fe05ca954f5',
        bytes: 1849637,
      },
      {
        url: '/sounds/musica-combate.m4a',
        mime: 'audio/mp4; codecs="mp4a.40.2"',
        sha256: 'c2dfe0323d17ecd73551489eada3ead9e7eae5d81cec1f4c6676255250a9c16e',
        bytes: 2241408,
      },
    ],
  },
  pesadelo: {
    nome: 'Stone Hall Nightmare',
    duracaoS: 217.2,
    pausaEntreVoltasS: 4,
    fadeInS: 3,
    origem: 'suno/fornecida-pelo-dono',
    geradoEm: '2026-10-19',
    formatos: [
      {
        url: '/sounds/musica-pesadelo.webm',
        mime: 'audio/webm; codecs="opus"',
        sha256: 'bb897ebe3e968a7e2e328404c5bb77ea2ef4504c840489487475f641b09275b2',
        bytes: 2055285,
      },
      {
        url: '/sounds/musica-pesadelo.m4a',
        mime: 'audio/mp4; codecs="mp4a.40.2"',
        sha256: '5d0e1d504fc65db592551f2f85735facf2579a041d3d450e2d0b5829e7d7986d',
        bytes: 2454316,
      },
    ],
  },
  masmorra: {
    nome: 'Dungeon Theme',
    duracaoS: 223.61,
    /** Exploração: respiro maior que o do combate, menor que o do tema da Home. */
    pausaEntreVoltasS: 8,
    fadeInS: 2,
    origem: 'fornecida-pelo-dono',
    geradoEm: '2026-10-26',
    formatos: [
      {
        url: '/sounds/tema-masmorra.webm',
        mime: 'audio/webm; codecs="opus"',
        sha256: 'ea353da8e38522988b86e1c9f8d27a555f22640e5141d819df824aa5a72b7d4e',
        bytes: 1949094,
      },
      {
        url: '/sounds/tema-masmorra.m4a',
        mime: 'audio/mp4; codecs="mp4a.40.2"',
        sha256: 'e6b953b34855b80beb31b11367e3d03ad7c36894dafc597ab561764d51e8e93f',
        bytes: 1843435,
      },
    ],
  },
  evolucao: {
    nome: 'Evolution Theme',
    duracaoS: 29.93,
    /** Cerimônia: toca uma vez; o silêncio é quase o do tema; a cerimônia fecha antes da volta. */
    pausaEntreVoltasS: 29,
    fadeInS: 0.5,
    origem: 'fornecida-pelo-dono',
    geradoEm: '2026-10-26',
    formatos: [
      {
        url: '/sounds/tema-evolucao.webm',
        mime: 'audio/webm; codecs="opus"',
        sha256: '10d71c42f45d2151d274146689870fe4444603bf5fca16dcf4aadd8ec694bdd1',
        bytes: 246207,
      },
      {
        url: '/sounds/tema-evolucao.m4a',
        mime: 'audio/mp4; codecs="mp4a.40.2"',
        sha256: 'ed4c4bba983aebc7eb176105fb76a875fd5d5e65f86cfe57f132fec17283fe95',
        bytes: 246944,
      },
    ],
  },
  meditacao: {
    nome: 'Meditation Theme',
    duracaoS: 223.13,
    pausaEntreVoltasS: 8,
    fadeInS: 3,
    origem: 'fornecida-pelo-dono',
    geradoEm: '2026-10-26',
    formatos: [
      {
        url: '/sounds/tema-meditacao.webm',
        mime: 'audio/webm; codecs="opus"',
        sha256: 'adbe6971b8b05a74994e41708bdd73626813b6b9eee7a182e41683c99cd0dff7',
        bytes: 1995439,
      },
      {
        url: '/sounds/tema-meditacao.m4a',
        mime: 'audio/mp4; codecs="mp4a.40.2"',
        sha256: 'd286a6798c804d97f27b297f939c6bd2ba0a97276554edc6890a953456b50520',
        bytes: 1839911,
      },
    ],
  },
} as const satisfies Record<'combate' | 'pesadelo' | 'masmorra' | 'evolucao' | 'meditacao', ManifestoDeMusica>;

export type MusicaDeCombate = keyof typeof MUSICAS_DE_COMBATE;
