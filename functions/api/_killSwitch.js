// KILL-SWITCHES do beta (release/beta-1, 11/10/2026) — `docs/BETA-CONTINGENCIA.md` §0.
//
// Duas vars do Worker, sem segredo, ligadas pelo dono no painel/`wrangler.toml`
// quando algo der errado no beta fechado:
//   · BILLING_DISABLED — o servidor recusa NOVAS compras (pedido que ainda não é
//     desta conta). Restaurar/reconciliar o que a conta JÁ tem continua valendo:
//     desligar a loja não pode tirar de ninguém o que foi pago. A compra recusada
//     não é reconhecida, então a Play a estorna sozinha em 3 dias.
//   · CHAT_DISABLED — `/api/chat` responde 503 `chat-disabled` antes de gastar
//     cota; o app cai nas respostas locais do pet.
// `/api/config` expõe os dois para a UI esconder os botões; o servidor é quem
// garante (a UI pode estar velha, em cache, ou ser um `curl`).

const LIGADO = /^(1|true|yes|on|sim)$/i;

/** Var "ligada"? Aceita 1/true/yes/on/sim (sem caixa); qualquer outra coisa = desligada. */
export function flagOn(value) {
  return typeof value === 'string' ? LIGADO.test(value.trim()) : value === true || value === 1;
}

export const isBillingDisabled = env => flagOn(env?.BILLING_DISABLED);
export const isChatDisabled = env => flagOn(env?.CHAT_DISABLED);

/** Mensagem amigável (voz do Soulmon: encoraja, nunca cobra). */
export const BILLING_DISABLED_MESSAGE = {
  pt: 'A lojinha está fechada por um tempinho enquanto ajeitamos umas coisas. Nada foi cobrado — tente de novo mais tarde.',
  en: 'The shop is closed for a little while as we tidy things up. Nothing was charged — please try again later.',
};
export const CHAT_DISABLED_MESSAGE = {
  pt: 'Estou descansando a cabeça por um tempinho — sigo por aqui com as respostas simples.',
  en: "I'm resting my head for a little while — I'm still here with simple replies.",
};
