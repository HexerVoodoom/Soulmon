import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { handleTranscribeRequest } from "./transcribe.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7de212d9/health", (c) => {
  return c.json({ status: "ok" });
});

// Chat endpoint using Groq AI
/* ⚠️ AQUI HAVIA UM SEGUNDO `/chat`, e ele foi apagado em 07/09/2026.
 *
 * Era uma implementação PARALELA do chat do pet — prompt de sistema próprio
 * (que ainda dizia "YOUR ROLE IN DIGIAPP"), herdada do fork —, e o app nunca a
 * chamava: o chat de verdade é `functions/api/chat.js`, na Cloudflare.
 *
 * O problema não era a duplicação, era o que ela NÃO tinha. A versão real
 * carrega o bloco `NEVER` com precedência declarada, a redação de entrada
 * (`_redact.js`), o `CONTEXT_SCHEMA` com allowlist, testes de injeção de
 * prompt e o `_aiGuard` (teto de custo por conta e global). Esta tinha ZERO
 * disso, sem autenticação, publicada — um endpoint de LLM aberto, pagável por
 * quem achasse a URL.
 *
 * Footgun 9 na forma mais cara: a cópia não estava só divergindo, estava sem
 * as travas que a original ganhou depois. `transcribe` fica — esse o app usa
 * de verdade (`ChatBox.tsx`). */

// Transcribe endpoint using Groq Whisper API
app.post("/make-server-7de212d9/transcribe", handleTranscribeRequest);

Deno.serve(app.fetch);