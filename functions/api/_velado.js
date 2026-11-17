/**
 * Espelho MÍNIMO da forma BB no servidor (Onboarding Velado, D3/D5; plano §4/§7).
 * Pages Functions não importam de `src/`: o que o app decide em `src/utils/bbStage.ts`
 * e o servidor também precisa recusar (Duelo PvP e Guilda validam o estágio aqui) é
 * copiado e travado por `velado.parity.test.js`.
 *
 * Interruptor `ONBOARDING_VELADO` (var/secret, `1`/`true`/…): DESLIGADO por padrão.
 * INÍCIO BB (17/11/2026, REGISTRO §472): todo save novo nasce BB, com ou sem o interruptor. A recusa segue o ID do
 * estágio (como no app): save que não é BB (todos os de antes) nunca é recusado; save BB é recusado sempre.
 */
import { flagOn } from './_killSwitch.js';

export const BB_STAGE = 'bb';

export const isOnboardingVelado = env => flagOn(env?.ONBOARDING_VELADO);

/**
 * Recusa MOTIVADA (padrão de `rebirthRefusal`): `'bb-locked'` quando o estágio do jogador é BB; `null` caso contrário.
 * `env` fica na assinatura (contrato dos chamadores); desde o Início BB a decisão não depende do interruptor.
 * @param {unknown} _env @param {unknown} evolutionStage
 * @returns {'bb-locked' | null}
 */
export function bbRefusal(_env, evolutionStage) {
  return evolutionStage === BB_STAGE ? 'bb-locked' : null;
}

/** Corpo de erro padrão (voz do Soulmon: sem culpa). */
export const BB_LOCKED_MESSAGE = {
  pt: 'Seu Velado ainda está pequeno demais para isto. Cresça o Vínculo e deixe-o evoluir.',
  en: 'Your Veiled one is still too small for this. Grow your Bond and let it evolve.',
};

/**
 * Interruptor POR PESSOA (plano §7): lista de testers em `env.ONBOARDING_VELADO_TESTERS` — HASHES
 * (sha256 hex de `velado-tester:<email normalizado>`), separados por vírgula/espaço; nunca e-mail.
 * Vazia/ausente = ninguém. Somar com o global é feito pelo cliente (global OU tester).
 */
export async function veladoTesterHash(email) {
  const data = new TextEncoder().encode(`velado-tester:${String(email ?? '').trim().toLowerCase()}`);
  const d = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function isVeladoTester(env, email) {
  const lista = String(env?.ONBOARDING_VELADO_TESTERS ?? '').toLowerCase().split(/[\s,]+/).filter(Boolean);
  if (!email || lista.length === 0) return false;
  return lista.includes(await veladoTesterHash(email));
}

/**
 * BB PERSONALIZADO SÓ NO NASCIMENTO (dono, 17/11/2026; REGISTRO §472). Decide, pelo save da nuvem, se uma geração de
 * `formId: 'bb'` ainda é o nascimento. Recusa (`'bb-birth-only'`) só com PROVA de que o nascimento já passou:
 *  · pediu desenho NOVO do BB (`regenerate`/`regenPaid`): o BB não tem reroll;
 *  · o save já tem arte de BB (`spriteLibrary.sprites.bb`: o do pool do grátis, ou o exclusivo já adotado);
 *  · o save já saiu do BB (`unlockedEvolutions` tem `bb` e o estágio não é mais `bb`);
 *  · o save nasceu antes do BB (tem criatura/inicial e nunca teve `bb` em `unlockedEvolutions`).
 * Save ausente (ainda não sincronizou) ou em `bb` sem arte = nascimento: a 1ª tentativa e o retry de uma FALHA passam.
 * Geração bem-sucedida grava o cache `sprite:img:<id>:bb`, e pedido sem `regenerate` devolve o cache (zero IA).
 * Espelho: `src/utils/inicioBB.ts` (`recusaGeracaoBB`), paridade em `velado.parity.test.js`.
 * @param {unknown} state @param {{ regenerar?: boolean }} [opts]
 * @returns {'bb-birth-only' | null}
 */
export function recusaGeracaoBB(state, opts = {}) {
  if (opts.regenerar) return 'bb-birth-only';
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  const s = /** @type {Record<string, any>} */ (state);
  const unlocked = Array.isArray(s.unlockedEvolutions) ? s.unlockedEvolutions : [];
  const sprites = s.spriteLibrary && typeof s.spriteLibrary === 'object' ? s.spriteLibrary.sprites : null;
  if (sprites && typeof sprites === 'object' && sprites[BB_STAGE] && typeof sprites[BB_STAGE].url === 'string' && sprites[BB_STAGE].url) return 'bb-birth-only';
  if (unlocked.includes(BB_STAGE) && s.evolutionStage !== BB_STAGE) return 'bb-birth-only';
  const temCriatura = (Array.isArray(s.soulmonStages) && s.soulmonStages.length > 0) || (typeof s.demoCharacterId === 'string' && s.demoCharacterId.length > 0);
  if (temCriatura && !unlocked.includes(BB_STAGE) && s.evolutionStage !== BB_STAGE) return 'bb-birth-only';
  return null;
}

/** Corpo de erro da recusa (voz do Soulmon: calma, sem culpa). Aditivo: cliente antigo trata como falha e cai no pool. */
export const BB_BIRTH_ONLY_MESSAGE = {
  pt: 'A primeira forma só é desenhada no nascimento. As próximas formas podem ser só suas.',
  en: 'The first form is only drawn at birth. The next forms can be yours alone.',
};
