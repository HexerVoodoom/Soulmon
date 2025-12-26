import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { handleChatRequest } from "./chat.tsx";
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
app.post("/make-server-7de212d9/chat", handleChatRequest);

// Transcribe endpoint using Groq Whisper API
app.post("/make-server-7de212d9/transcribe", handleTranscribeRequest);

Deno.serve(app.fetch);