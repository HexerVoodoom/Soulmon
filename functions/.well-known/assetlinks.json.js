// Digital Asset Links — prova para o Android que este domínio e o app Android
// pertencem ao mesmo dono (usado por App Links / TWA).
//
// ⚠️ Os valores PADRÃO abaixo ainda são do **DigiApp**, porque este endpoint é
// servido no domínio compartilhado com ele (ver docs/SEPARACAO-DIGIAPP.md).
// Trocá-los às cegas quebraria a verificação do app que está no ar hoje, e o
// fingerprint do Soulmon depende da keystore de release — não dá para inventar.
//
// Por isso os dois campos vêm de variáveis do projeto Pages:
//
//   ASSETLINKS_PACKAGE_NAME  → com.hexervoodoom.soulmon
//   ASSETLINKS_SHA256        → SHA-256 do certificado de assinatura do release
//                              (Play Console → Configuração → Integridade do app
//                              → Certificado da chave de assinatura do app)
//
// Definidas: passa a valer o Soulmon. Ausentes: sai exatamente o que saía antes.
const DEFAULT_PACKAGE = 'com.digipartner.digiapp';
const DEFAULT_SHA256 =
  'F5:10:2B:09:7B:B3:5C:81:FA:DC:FE:AB:A9:32:E6:8D:7F:F8:50:FB:1C:71:F0:7B:29:95:CC:86:A4:AA:7B:84';

export async function onRequest({ env }) {
  const packageName = env?.ASSETLINKS_PACKAGE_NAME || DEFAULT_PACKAGE;
  const fingerprint = env?.ASSETLINKS_SHA256 || DEFAULT_SHA256;

  return new Response(JSON.stringify([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: packageName,
      sha256_cert_fingerprints: [fingerprint],
    },
  }]), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
