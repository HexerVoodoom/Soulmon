// Digital Asset Links — prova para o Android que este domínio e o app Android
// pertencem ao mesmo dono (usado por App Links / TWA).
//
// ⚠️ **Este endpoint declarava o pacote do DIGIAPP como padrão**, com o
// fingerprint dele, e o comentário justificava assim: "este endpoint é servido
// no domínio compartilhado com ele; trocar às cegas quebraria a verificação do
// app que está no ar hoje".
//
// O domínio não é mais compartilhado — a URL de produção do Soulmon é própria
// desde a migração —, e o efeito do padrão era afirmar, no nosso domínio, que
// **outro app** tem permissão para tratar os nossos links. Uma declaração
// falsa de propriedade, servida publicamente.
//
// A regra nova é simples: **na dúvida, não declarar nada.** Sem o fingerprint
// o endpoint responde uma lista VAZIA, que é o que "nenhum app verificado"
// significa em Digital Asset Links — os links deixam de abrir direto no app e
// mais nada. Um vínculo ausente é um inconveniente; um vínculo mentindo é um
// problema de segurança.
//
// Para ligar o App Link do Soulmon, defina no projeto Pages:
//
//   ASSETLINKS_SHA256  → SHA-256 do certificado de assinatura do release
//                        (Play Console → Configuração → Integridade do app →
//                         Certificado da chave de assinatura do app)
//
// `ASSETLINKS_PACKAGE_NAME` continua existindo para um pacote diferente do
// padrão (build interno, sabor de teste), mas o padrão agora é o nosso.
const DEFAULT_PACKAGE = 'com.hexervoodoom.soulmon';

export async function onRequest({ env }) {
  const packageName = env?.ASSETLINKS_PACKAGE_NAME || DEFAULT_PACKAGE;
  const fingerprint = env?.ASSETLINKS_SHA256;

  // Sem fingerprint não há o que provar. Lista vazia, 200 — o Android trata
  // como "nenhuma associação", que é a verdade.
  const alvos = fingerprint
    ? [{
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: [fingerprint],
      },
    }]
    : [];

  return new Response(JSON.stringify(alvos), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
