/**
 * O ACERVO DE SPRITES do jogador — estado puro da geração incremental.
 *
 * Spec: `squad-alpha-runs/soulmon-02/spec-geracao-incremental.md` (revisão 3,
 * gate `gate-spec-sprite.md` em PASS). Este módulo é o dono único de:
 *
 *  - o que existe (`sprites[formId]`), que é **o gatilho inteiro** (§3.5: "a
 *    única pergunta que o gatilho faz é: `sprites[formId]` existe?");
 *  - o que falhou e quantas vezes, incluindo o estado TERMINAL por forma
 *    (`perFormLifetime: 3`, §3.4) — que é **409 `sprite-form-cap`**, e é
 *    distinto do terminal por CONTA (**402 `sprite-lifetime-cap`**);
 *  - a adoção do sprite próprio da forma ATUAL (§2.3.1): quem troca o rosto do
 *    bicho é o jogador, e a oferta expira numa virada de dia — o sprite, nunca.
 *
 * Funções PURAS: `dayKey` e `now` entram por parâmetro, sem React, sem
 * localStorage. Só a URL vai ao save (`custo-geracao-sprite.md` §4): base64 no
 * `GameState` estoura a cota de `localStorage` compartilhada com o DigiApp.
 *
 * ⚠️ **Reverter e re-sintonizar NÃO consomem teto** (gate, "Para o
 * `alpha-frontend`"): nenhuma função de adoção aqui toca `attempts`.
 */

/** Uma forma desenhada. Só metadado — o binário mora no Cache Storage. */
export interface SpriteEntry {
  /** URL do provedor (ou data URL, no caminho Gemini enquanto não houver republicação). */
  url: string;
  formId: string;
  provider?: string;
  /** Epoch ms de quando chegou. */
  at: number;
}

/**
 * Por que uma forma não tem sprite próprio. `form-cap` (409) e `lifetime-cap`
 * (402) são **contratos diferentes** e não podem ser tratados como um só:
 * o 402 é a conta inteira parando para sempre; o 409 é UMA forma que esgotou
 * as 3 tentativas dela, com as outras dez seguindo abertas.
 *
 * `auth` (401) e `identity` (403) entram com o **mesmo nome** que
 * `cloudSave.ts` e `spriteGen.ts` já usam — um terceiro dicionário para o
 * mesmo par de códigos HTTP divergiria em silêncio. Nenhum dos dois é
 * terminal: o teto não foi atingido, quem falhou foi a credencial. O 401 se
 * conserta com login; o 403 é `SAVE_ID` errado e quem conserta é
 * `reconcileSaveId` — nem login, nem retentativa.
 */
export type SpriteFailKind =
  | 'form-cap'
  | 'lifetime-cap'
  | 'daily-limit'
  | 'budget'
  | 'offline'
  | 'auth'
  | 'identity'
  | 'error';

export interface SpriteFormFailure {
  /** Tentativas que o CLIENTE contou nesta forma (o teto de verdade é do servidor). */
  attempts: number;
  /** Quantas vieram do botão "Tentar de novo" (cooldown/teto manual, §6 do custo). */
  manual: number;
  /** Última falha registrada — governa o rótulo do card. */
  kind: SpriteFailKind;
  /** Terminal: não há mais o que tentar nesta forma. */
  terminal?: 'form-cap' | 'lifetime-cap';
  lastAt: number;
}

/** A oferta de adoção da forma ATUAL (§2.3.1). Expira em uma virada de dia. */
export interface PendingTune {
  formId: string;
  /** `dayKey` do dia em que a oferta apareceu. Na virada seguinte, adota sozinho. */
  sinceDay: string;
}

export interface SpriteLibrary {
  sprites: Record<string, SpriteEntry>;
  failures: Record<string, SpriteFormFailure>;
  /** Forma atual com sprite próprio pronto e ainda não adotado. */
  pendingTune: PendingTune | null;
  /**
   * Formas em que o jogador escolheu "Voltar ao traço antigo". O sprite próprio
   * **fica no save** e pode ser sintonizado de novo — por isso é uma lista de
   * opt-out, e não um apagamento. Persistida: se fosse só de sessão, recarregar
   * a página desfaria a escolha dele em silêncio, que é o erro que o X4 derrubou.
   */
  reverted: string[];
  /**
   * Formas que o Visor adotou SOZINHO (adoção automática da virada do dia) e
   * que o jogador ainda não viu. Alimenta o selo `NOVO` (X-3).
   *
   * Mora no SAVE, e não em memória, porque o caso do achado é exatamente
   * "acordou com o rosto do bicho trocado": um flag de sessão sumiria no
   * primeiro reload e o aviso nunca alcançaria quem não abre a aba Evolução.
   */
  tunedUnseen: string[];
}

/** Teto de tentativas por forma — espelha `AI_LIMITS.sprite.perFormLifetime`
 *  (`functions/api/_aiGuard.js`). O servidor é a autoridade; isto é o
 *  disjuntor local que evita gastar uma chamada que já se sabe recusada. */
export const SPRITE_FORM_ATTEMPT_CAP = 3;
/** Botão manual: 3 por forma, vitalício (`custo-geracao-sprite.md` §6). */
export const SPRITE_MANUAL_RETRY_CAP = 3;
/** Cooldown do botão manual, em ms (idem §6). */
export const SPRITE_MANUAL_COOLDOWN_MS = 60_000;

// ── F-1: allowlist de ESQUEMA da URL do sprite ──────────────────────────────
//
// **O caminho, confirmado ponta a ponta** (`auditoria-cliente.md` F-1):
// `POST /api/save` (fail-open hoje — N-1 da `auditoria-rotas.md`) →
// `normalizeSpriteLibrary` → `GameStateContext` → `displaySprite` →
// `<img src>` em `CompanionHUD.tsx` (tela principal, TODA sessão) e em
// `EvolutionPath.tsx` (aba Evolução). Quem escreve o save escreve a URL que o
// navegador da vítima vai buscar.
//
// **Isto NÃO é XSS, e o rótulo importa.** Em `<img src>` não executa
// `javascript:`, não executa `data:text/html`, e SVG com `<script>` dentro
// também não — SVG só roteia script em contexto de documento (`<object>`,
// `<iframe>`, navegação direta). `<img>` não é sink de navegação. Chamar isto
// de XSS seria falso positivo, e quem lesse depois gastaria pânico no lugar
// errado.
//
// **O que é, então: BEACON.** Uma URL sob controle do atacante dispara um GET
// a cada render e entrega IP, User-Agent, `Accept-Language` e um carimbo de
// hora — sinal de presença por vítima. E o visor **não tem estado de erro por
// spec** (`spec-geracao-incremental.md` §2.1: a reserva é o piso, nunca um
// erro), então uma URL que jamais responde não produz **nenhum** sinal visível.
// Como mora no save da nuvem, sobrevive a logout, troca de aparelho e
// reinstalação. Subestimar também é erro.
//
// **Os esquemas que passam, e o porquê de cada um:**
//
//  - `data:image/{png,jpeg,jpg,gif,webp,avif};base64,` — **caminho Gemini**,
//    que é real: `functions/api/generate-sprite.js:137` devolve
//    `data:${mime};base64,${inline.data}`. E é também o formato de saída do
//    Pixelador (`pixelizeDataUrl` → `canvas.toDataURL('image/png')`). Bloquear
//    `data:` desligaria o Gemini inteiro em silêncio. `svg+xml` fica **de
//    fora** de propósito: nenhum caminho legítimo produz SVG, e recusar o que
//    ninguém usa é gratuito.
//  - `https://` — **caminho Higgsfield**, o provedor primário
//    (`HF_BASE = 'https://platform.higgsfield.ai'`), que devolve URL remota.
//
// **O que NÃO passa, e o porquê:** `javascript:`/`vbscript:` (inertes aqui,
// mas não há motivo nenhum para guardar um no save); `data:` de qualquer tipo
// que não seja imagem; `http:` (texto claro — nenhum provedor nosso usa, e a
// página é https, então seria mixed content de todo jeito); `file:`;
// `blob:` (a CSP permite, mas **hoje nenhum código nosso cria** blob de
// sprite — quando o Cache Storage virar origem de URL, entra aqui com teste);
// e `//host` (relativo a esquema: herda https e vaza igual).
//
// **LIMITE CONHECIDO, declarado de propósito:** `https://atacante.example/x.png`
// **ainda passa**. Fechar o beacon por completo exige allowlist de **HOST**, e
// o host do provedor é pergunta em aberto na auditoria. Próximo passo, com
// dono: fixar o host aqui e fechar o `img-src ... https:` do `_headers`.
const SPRITE_URL_PERMITIDA = /^(?:https:\/\/[^/?#\s]+(?:[/?#]|$)|data:image\/(?:png|jpe?g|gif|webp|avif);base64,)/i;

/**
 * A URL pode virar `<img src>`? Guarda ÚNICA — `normalizeSpriteLibrary`,
 * `recordSprite` e `spriteGen.loadImage` compartilham esta função em vez de
 * cada um ter o seu dicionário de esquema, que é o mesmo motivo pelo qual
 * `SpriteFailKind` empresta os nomes de `cloudSave.ts`: duas listas para a
 * mesma decisão divergem em silêncio.
 *
 * A limpeza antes do teste não é firula: o navegador **apara** espaço e
 * controles C0 nas pontas do atributo e **ignora** TAB/LF/CR dentro do
 * esquema, então `java<TAB>script:` e `<LF>javascript:` chegam ao parser como
 * `javascript:`. Testar a string crua deixaria os dois passarem.
 */
export function isSafeSpriteUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const limpa = url.replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
  return SPRITE_URL_PERMITIDA.test(limpa);
}

// ── F-1 (lado dos componentes): o ramo do ASSET EMPACOTADO ────────────────
//
// A Biblioteca e o perfil de outro jogador fazem
// `src={p.spriteUrl ?? getSpriteForStage(p.stage)}`. Os dois lados dessa
// expressao tem PROCEDENCIA OPOSTA:
//
//  - `p.spriteUrl` e campo EXTRA do tipo `LibraryEntry`/`PlayerDetailModal`.
//    O tipo `DirectoryPlayer` de `community.ts` nao o declara, mas
//    `setPlayers(r.players ?? [])` entra num estado `LibraryEntry[]` e o
//    excedente do JSON viaja junto: um `players[]` hostil vindo do KV
//    (`GET /api/players`) carrega `spriteUrl` igualzinho ao NPC local. Mesmo
//    beacon do F-1, por um diretorio PUBLICO que qualquer um alimenta.
//  - `getSpriteForStage(...)` e `DUNGEON_LINE_SPRITES` sao asset EMPACOTADO
//    pelo Vite. Verificado no `dist/` deste worktree: o bundle referencia
//    `/assets/ignar-rookie-C6FBPY0e.png` — caminho ABSOLUTO de raiz, same
//    origin (`base` e o padrao `/`). Sob vitest/dev o mesmo import resolve
//    para `/src/assets/soulmon/rookie.png` — mesma forma, outro prefixo.
//
// Por isso `isSafeSpriteUrl` sozinha NAO serve nestes dois pontos: ela so
// conhece `https:` e `data:image/*`, e recusaria a arte de reserva — o que
// apagaria o sprite em silencio, porque o visor nao tem estado de erro por
// spec. `isSafeSpriteSrc` e a guarda de `<img src>` desses dois lugares:
// `isSafeSpriteUrl` OU caminho de raiz same-origin.
//
// O ramo relativo e estreito de proposito: UMA barra no inicio, e a proxima
// nao pode ser `/` nem `\`. `//host` herda o esquema da pagina e vaza o mesmo
// beacon; `/\host` o parser de URL do navegador trata como `//host`. Os dois
// ficam de fora. Um caminho de raiz que passa nao consegue sair da origem, que
// e exatamente o que o beacon precisa.
//
// `isSafeSpriteUrl` NAO foi afrouxada: o ramo novo mora aqui, e o save
// (`normalizeSpriteLibrary`, `recordSprite`, `loadImage`) continua com a
// allowlist estreita de antes.
const CAMINHO_DE_RAIZ = /^\/(?![/\\])/;

/** A URL pode virar `<img src>` num ponto que TAMBEM exibe asset do Vite? */
export function isSafeSpriteSrc(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  // A limpeza vem ANTES dos dois testes, e nao entre eles: `isSafeSpriteUrl` e
  // um type predicate (`url is string`), entao um `if (isSafeSpriteUrl(x))` com
  // `return` no ramo verdadeiro estreita `x` para `never` no resto da funcao, e
  // o `tsc` recusa qualquer `.replace` depois. Chamar a guarda ja com o texto
  // limpo resolve os dois lados — a limpeza dela e idempotente.
  const limpa = url.replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
  return isSafeSpriteUrl(limpa) || CAMINHO_DE_RAIZ.test(limpa);
}

export function emptySpriteLibrary(): SpriteLibrary {
  return { sprites: {}, failures: {}, pendingTune: null, reverted: [], tunedUnseen: [] };
}

/**
 * Normaliza o que veio do save (localStorage OU nuvem — os dois são dado não
 * confiável). Campo novo sempre com fallback `?? padrão`, regra do `CLAUDE.md`.
 */
export function normalizeSpriteLibrary(raw: unknown): SpriteLibrary {
  const lib = emptySpriteLibrary();
  if (!raw || typeof raw !== 'object') return lib;
  const r = raw as Partial<SpriteLibrary>;
  if (r.sprites && typeof r.sprites === 'object') {
    for (const [formId, entry] of Object.entries(r.sprites)) {
      // F-1: `typeof url === 'string'` sozinho deixava passar qualquer
      // esquema. A entrada recusada simplesmente NÃO entra no acervo — e
      // cair na arte de reserva é o piso do Invariante nº 1, nunca um erro.
      if (entry && typeof entry === 'object' && isSafeSpriteUrl((entry as SpriteEntry).url)) {
        const e = entry as SpriteEntry;
        lib.sprites[formId] = {
          url: e.url,
          formId,
          provider: typeof e.provider === 'string' ? e.provider : undefined,
          at: Number.isFinite(e.at) ? e.at : 0,
        };
      }
    }
  }
  if (r.failures && typeof r.failures === 'object') {
    for (const [formId, f] of Object.entries(r.failures)) {
      if (!f || typeof f !== 'object') continue;
      const v = f as SpriteFormFailure;
      lib.failures[formId] = {
        attempts: Number.isFinite(v.attempts) ? Math.max(0, v.attempts) : 0,
        manual: Number.isFinite(v.manual) ? Math.max(0, v.manual) : 0,
        kind: (v.kind ?? 'error') as SpriteFailKind,
        terminal: v.terminal === 'form-cap' || v.terminal === 'lifetime-cap' ? v.terminal : undefined,
        lastAt: Number.isFinite(v.lastAt) ? v.lastAt : 0,
      };
    }
  }
  if (r.pendingTune && typeof r.pendingTune === 'object'
      && typeof r.pendingTune.formId === 'string' && typeof r.pendingTune.sinceDay === 'string') {
    lib.pendingTune = { formId: r.pendingTune.formId, sinceDay: r.pendingTune.sinceDay };
  }
  lib.reverted = Array.isArray(r.reverted) ? r.reverted.filter(id => typeof id === 'string') : [];
  lib.tunedUnseen = Array.isArray(r.tunedUnseen) ? r.tunedUnseen.filter(id => typeof id === 'string') : [];
  return lib;
}

/** `sprites[formId]` existe? É a ÚNICA pergunta do gatilho (§3.5). */
export function hasSprite(lib: SpriteLibrary, formId: string): boolean {
  return Boolean(lib.sprites[formId]);
}

/**
 * O sprite a EXIBIR nesta forma — `null` significa "usa a arte de reserva"
 * (`getSpriteForStage`), que é o piso do Invariante nº 1 e **nunca é erro**.
 *
 * Devolve `null` também quando o próprio existe mas ainda não foi adotado
 * (`pendingTune`) ou o jogador voltou ao traço antigo (`reverted`).
 */
export function displaySprite(lib: SpriteLibrary, formId: string): SpriteEntry | null {
  if (lib.pendingTune?.formId === formId) return null;
  if (lib.reverted.includes(formId)) return null;
  return lib.sprites[formId] ?? null;
}

/** A conta parou de vez? (402 em qualquer forma vale para a conta inteira.) */
/**
 * O acervo ainda não desenhou NADA — é a ocasião A (`birthBatch`), o lote de
 * nascimento de quem acabou de criar a árvore (achado **F-1** do gate).
 *
 * Por que a pergunta é esta e não "quem é você": a ocasião A dependia de um
 * `GET /api/whoami` que **não existe e não tem dono**, e por isso nunca foi
 * ligada — quem paga chegava ao reveal e via a mesma arte de reserva do demo
 * grátis. O acervo responde a mesma pergunta com o que já está no save:
 *
 *  - quem NÃO paga não chega aqui (o `enabled` do hook corta quem não tem
 *    árvore própria, e o servidor recusa em `requirePaidTier` antes de
 *    qualquer IA — o tier nunca foi decidido no cliente);
 *  - gasto duplicado não é risco: `birthBatch` filtra por `hasSprite` e
 *    `isFormCapped`, então com o acervo povoado ele devolve `null` sozinho.
 *
 * O que se perde em relação ao `whoami`: um pagante ANTIGO que perdesse o
 * acervo inteiro seria tratado como recém-nascido — e receberia um lote a que
 * já tinha direito, dentro do vitalício de 26. Imprecisão de rótulo, não de
 * dinheiro. O `whoami` segue como dívida do desktop (ADR §2-4).
 */
export function isNewbornLibrary(lib: SpriteLibrary): boolean {
  return Object.keys(lib.sprites).length === 0;
}

export function isAccountCapped(lib: SpriteLibrary): boolean {
  return Object.values(lib.failures).some(f => f.terminal === 'lifetime-cap');
}

/** Esta FORMA esgotou as 3 tentativas dela? (409 — não desliga as outras.) */
export function isFormCapped(lib: SpriteLibrary, formId: string): boolean {
  return lib.failures[formId]?.terminal === 'form-cap';
}

/**
 * Registra um sprite que chegou.
 *
 * `adopt: 'now'` = ocasião A e formas FUTURAS (chegam caladas). `adopt: 'ask'`
 * = a forma ATUAL depois da cerimônia (ocasião C): a troca do rosto do bicho é
 * do jogador (§2.3.1), então vira `pendingTune`.
 */
export function recordSprite(
  lib: SpriteLibrary,
  entry: SpriteEntry,
  opts: { adopt: 'now' | 'ask'; dayKey?: string },
): SpriteLibrary {
  // F-1, segunda porta: a resposta do servidor entra aqui SEM passar pela
  // normalização (`useSpriteGeneration.ts` grava `url: image` direto), e só
  // seria validada no reload seguinte. Mesma guarda, mesmo lugar da decisão.
  if (!isSafeSpriteUrl(entry.url)) return lib;
  const sprites = { ...lib.sprites, [entry.formId]: { ...entry } };
  const failures = { ...lib.failures };
  delete failures[entry.formId];
  const next: SpriteLibrary = {
    ...lib,
    sprites,
    failures,
    reverted: lib.reverted.filter(id => id !== entry.formId),
  };
  if (opts.adopt === 'ask') {
    next.pendingTune = { formId: entry.formId, sinceDay: opts.dayKey ?? '' };
  }
  return next;
}

/** Registra uma falha. 409 e 402 gravam terminais DIFERENTES — de propósito. */
export function recordFailure(
  lib: SpriteLibrary,
  formId: string,
  kind: SpriteFailKind,
  opts: { manual?: boolean; at?: number } = {},
): SpriteLibrary {
  const prev = lib.failures[formId];
  // Offline não consome nada (`custo-geracao-sprite.md` §6): nem tentativa, nem
  // teto. A chamada não chegou a acontecer.
  const consumes = kind !== 'offline';
  const failure: SpriteFormFailure = {
    attempts: (prev?.attempts ?? 0) + (consumes ? 1 : 0),
    manual: (prev?.manual ?? 0) + (opts.manual && consumes ? 1 : 0),
    kind,
    terminal:
      kind === 'form-cap' ? 'form-cap'
      : kind === 'lifetime-cap' ? 'lifetime-cap'
      : prev?.terminal,
    lastAt: opts.at ?? Date.now(),
  };
  return { ...lib, failures: { ...lib.failures, [formId]: failure } };
}

/**
 * O botão "Tentar de novo" pode aparecer? Nunca em estado terminal — botão que
 * sempre falha é pior que botão ausente (`custo-geracao-sprite.md` §9).
 */
export function canManualRetry(
  lib: SpriteLibrary,
  formId: string,
  now: number = Date.now(),
): boolean {
  if (hasSprite(lib, formId)) return false;
  if (isAccountCapped(lib) || isFormCapped(lib, formId)) return false;
  const f = lib.failures[formId];
  if (!f) return true;
  if (f.manual >= SPRITE_MANUAL_RETRY_CAP) return false;
  if (f.attempts >= SPRITE_FORM_ATTEMPT_CAP) return false;
  return now - f.lastAt >= SPRITE_MANUAL_COOLDOWN_MS;
}

// ── Adoção do sprite próprio da forma ATUAL (§2.3.1) ────────────────────────
// NENHUMA destas funções mexe em `failures`: sintonizar, reverter e
// re-sintonizar não chamam geração, logo não consomem teto nenhum.

/**
 * Adota o sprite próprio desta forma.
 *
 * `auto: true` é a adoção da VIRADA DO DIA, que acontece sem gesto nenhum do
 * jogador — e é ela que precisa deixar rastro (`tunedUnseen`), porque quem nunca
 * abre a aba Evolução acordava com o rosto do bicho trocado sem nenhum aviso
 * (achado **X-3**). O toque do próprio jogador não marca: ele já viu.
 */
export function tuneVisor(
  lib: SpriteLibrary,
  formId: string,
  opts: { auto?: boolean } = {},
): SpriteLibrary {
  return {
    ...lib,
    pendingTune: lib.pendingTune?.formId === formId ? null : lib.pendingTune,
    reverted: lib.reverted.filter(id => id !== formId),
    tunedUnseen: opts.auto
      ? (lib.tunedUnseen.includes(formId) ? lib.tunedUnseen : [...lib.tunedUnseen, formId])
      : lib.tunedUnseen.filter(id => id !== formId),
  };
}

/** O jogador finalmente viu o selo `NOVO` desta forma. */
export function markTuneSeen(lib: SpriteLibrary, formId: string): SpriteLibrary {
  if (!lib.tunedUnseen.includes(formId)) return lib;
  return { ...lib, tunedUnseen: lib.tunedUnseen.filter(id => id !== formId) };
}

/** "Voltar ao traço antigo" — devolve a reserva sem apagar o sprite pago. */
export function revertVisor(lib: SpriteLibrary, formId: string): SpriteLibrary {
  if (!hasSprite(lib, formId)) return lib;
  return {
    ...lib,
    pendingTune: lib.pendingTune?.formId === formId ? null : lib.pendingTune,
    reverted: lib.reverted.includes(formId) ? lib.reverted : [...lib.reverted, formId],
    // Reverter é um gesto: o jogador viu.
    tunedUnseen: lib.tunedUnseen.filter(id => id !== formId),
  };
}

/**
 * A oferta expirou? (§2.3.1: "se o card continuar sem toque até a **próxima
 * virada de dia**, a adoção acontece sozinha".) O sprite nunca expira — só a
 * oferta de escolher o momento.
 */
export function autoTuneDue(lib: SpriteLibrary, dayKey: string): string | null {
  const p = lib.pendingTune;
  if (!p) return null;
  return p.sinceDay && p.sinceDay !== dayKey ? p.formId : null;
}

/** Estados de card da página de Evolução (§2.2). */
export type SpriteCardState =
  | 'PROPRIO'
  | 'GERANDO'
  | 'NOVO'
  | 'RESERVA'
  | 'RESERVA_VESPERA'
  | 'RESERVA_FINAL'
  | 'OFFLINE'
  | 'DISTANTE'
  | 'A_SINTONIZAR';

export interface CardStateContext {
  /** Formas com lote vivo agora. */
  generating: readonly string[];
  /** A forma-destino da próxima evolução já pode acontecer (faltam <= 1). */
  imminent: boolean;
  /** Esta forma já teve ocasião? (Falso = `DISTANTE`, sem botão.) */
  reachable: boolean;
  online: boolean;
  /** Selo NOVO ainda não visto — controlado por quem chama (some ao ver). */
  unseen?: boolean;
}

/**
 * O estado do card, e ele é UM só. A ordem das perguntas é a regra: o terminal
 * de conta (402) e o de forma (409) mandam mais que "ainda estou gerando",
 * porque sem isso um card ficaria pulsando para sempre por algo que já parou.
 */
export function cardState(lib: SpriteLibrary, formId: string, ctx: CardStateContext): SpriteCardState {
  if (lib.pendingTune?.formId === formId) return 'A_SINTONIZAR';
  if (hasSprite(lib, formId)) return ctx.unseen ? 'NOVO' : 'PROPRIO';
  if (isAccountCapped(lib) || isFormCapped(lib, formId)) return 'RESERVA_FINAL';
  if (ctx.generating.includes(formId)) return 'GERANDO';
  if (!ctx.reachable) return 'DISTANTE';
  if (!ctx.online) return 'OFFLINE';
  // Sem sprite, sem lote vivo e alcançável: reserva. A variante VÉSPERA existe
  // só porque a evolução está iminente — é quando o "Tentar de novo" deixa de
  // ser link discreto e vira botão de texto real (§2.2).
  return ctx.imminent ? 'RESERVA_VESPERA' : 'RESERVA';
}
