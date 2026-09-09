// Shim mínimo de tipos do runtime de Workers/Pages Functions.
//
// Por que um shim e não `@cloudflare/workers-types`: o pacote não está
// instalado e acrescentá-lo mexeria em `package.json`/`package-lock.json` —
// dependência nova por causa de UMA propriedade não se paga. Aqui declaramos
// só o que o código realmente usa e que o lib DOM não conhece.
//
// `caches.default` é a cache de borda da Cloudflare (não existe na Web API
// padrão) — usada em `functions/api/community.js`.
interface CacheStorage {
  default: Cache;
}

// `KVNamespace` é o binding de KV, usado no JSDoc de `functions/api/_kv.js`
// (`kv(env)`, o acessor único do namespace). Sem esta declaração o typecheck de
// servidor quebra com TS2304 em três linhas daquele arquivo — foi o que o
// `refactor(kv)` deixou para trás ao introduzir o acessor, e o CI vinha
// vermelho na `main` por isso.
//
// Só os métodos que este repositório chama de verdade, pelo mesmo critério
// escrito no topo deste arquivo: `get`, `getWithMetadata`, `put`, `delete` e
// `list`. Assinaturas frouxas de propósito — a régua aqui é pegar nome de
// binding errado e chamada inexistente, não reimplementar
// `@cloudflare/workers-types`.
interface KVNamespace {
  get(key: string, options?: any): Promise<any>;
  getWithMetadata(key: string, options?: any): Promise<{ value: any; metadata: any }>;
  put(key: string, value: any, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: any): Promise<{ keys: Array<{ name: string; metadata?: any }>; list_complete: boolean; cursor?: string }>;
}
