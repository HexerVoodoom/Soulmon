export async function onRequest() {
  return new Response(JSON.stringify([{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.digipartner.digiapp",
      "sha256_cert_fingerprints": [
        "F5:10:2B:09:7B:B3:5C:81:FA:DC:FE:AB:A9:32:E6:8D:7F:F8:50:FB:1C:71:F0:7B:29:95:CC:86:A4:AA:7B:84"
      ]
    }
  }]), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
