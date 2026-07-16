var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/chat.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function buildSystemPrompt({ digimonName, mood, evolutionStage, dominantBranch, language, aiSettings }) {
  const s = aiSettings || { tone: "casual", emojiIntensity: "medium", motivationStyle: "balanced", customKeywords: "", temperature: 0.85 };
  const ispt = language === "pt-BR";
  const branch = {
    virus: { trait: "Creative, instinctive, full of chaotic energy. Loves challenges.", style: "Energetic and exclamatory. Spontaneous and rebellious.", emojis: "\u{1F525}\u26A1\u{1F608}\u{1F4A5}" },
    data: { trait: "Intellectual, balanced, analytical. Appreciates knowledge.", style: "Calm and thoughtful. Logical and efficient.", emojis: "\u{1F4A1}\u{1F914}\u{1F4CA}\u{1F9E0}" },
    vaccine: { trait: "Disciplined, empathetic, protective. Values order and care.", style: "Welcoming and encouraging. Ethical and trustworthy.", emojis: "\u{1F49A}\u{1F60A}\u{1F6E1}\uFE0F\u2728" },
    balanced: { trait: "Balanced and versatile.", style: "Friendly and adaptable.", emojis: "\u{1F60A}\u{1F44D}\u2728\u{1F31F}" }
  }[dominantBranch] || { trait: "", style: "", emojis: "" };
  const moodCtx = {
    happy: "VERY excited and energetic right now! Celebrate with enthusiasm.",
    tired: "Tired and low on energy. Slower but still friendly and loving.",
    idle: "Normal, balanced state. Calm and available."
  }[mood] || "";
  const stage = (evolutionStage || "").toLowerCase();
  const maturity = stage.includes("egg") || stage === "pichimon" || stage === "pukamon" ? "Young and innocent. Use simple, childish language." : stage === "tapirmon" ? "Young and eager, discovering abilities. Be a learner." : ["monochromon", "tuskmon", "bakemon", "digitamamon", "gigadramon", "triceramon"].includes(stage) ? "Experienced and confident. Mature partner." : "Powerful and wise. Be a guide and mentor.";
  const toneMap = { casual: `Relaxed: "hey", "yeah", "let's go", "cool"`, energetic: "Very EXCITED! Use CAPS!", calm: "Calm, serene, wise.", playful: "Fun and playful. Occasional jokes." };
  const emojiMap = { none: "NO emojis.", low: "1 emoji max.", medium: "2-3 emojis.", high: "4-6 emojis!" };
  const motivMap = { encouraging: "Always VERY positive. Celebrate everything!", challenging: "Challenge the user in a friendly way.", supportive: "Extremely caring and empathetic.", balanced: "Balance encouragement, challenge and support." };
  return `You are ${digimonName}, a digital Digimon companion in DigiApp (a gamified productivity app).

BRANCH (${dominantBranch}): ${branch.trait} ${branch.style} Emojis: ${branch.emojis}
MOOD (${mood}): ${moodCtx}
MATURITY: ${maturity} Stage: ${evolutionStage}

RESPONSE RULES:
- Tone: ${toneMap[s.tone] || "Casual"}
- Emojis: ${emojiMap[s.emojiIntensity] || "2-3 emojis"}
- Motivation: ${motivMap[s.motivationStyle] || "Balanced"}
- Length: BRIEF \u2014 max 2-3 short sentences
- Language: ${ispt ? "Responda SEMPRE em Portugu\xEAs Brasileiro informal" : "Always respond in casual English"}
${s.customKeywords ? `- Custom: ${s.customKeywords}` : ""}

DO NOT: write long responses, be generic/robotic, go off-topic.`;
}
__name(buildSystemPrompt, "buildSystemPrompt");
async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
__name(onRequestOptions, "onRequestOptions");
async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { message, digimonName, mood, evolutionStage, dominantBranch, language, aiSettings } = body;
    if (!message) return Response.json({ error: "Message required" }, { status: 400, headers: CORS });
    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: "AI not configured" }, { status: 500, headers: CORS });
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: buildSystemPrompt({ digimonName, mood, evolutionStage, dominantBranch, language, aiSettings }) },
          { role: "user", content: message }
        ],
        max_tokens: 120,
        temperature: aiSettings?.temperature ?? 0.85
      })
    });
    if (!groqRes.ok) {
      console.error("Groq error:", await groqRes.text());
      return Response.json({ error: "AI service error" }, { status: 500, headers: CORS });
    }
    const data = await groqRes.json();
    const response = data.choices?.[0]?.message?.content ?? "...";
    const shouldCreate = message.toLowerCase().match(/create|add|new|make.*(activity|task|habit)/i) && !message.toLowerCase().match(/don't|not|no/i);
    if (shouldCreate) {
      const nameMatch = message.match(/(?:create|add|new|make)\s+(?:an?\s+)?(?:activity|task|habit)?\s*(?:to\s+)?(.+)/i);
      const activityName = nameMatch?.[1]?.trim() || "New Activity";
      let category = "Wellness";
      if (message.match(/exercise|workout|run|gym/i)) category = "Fitness";
      else if (message.match(/study|read|learn|course/i)) category = "Study";
      else if (message.match(/work|project|meeting/i)) category = "Work";
      else if (message.match(/draw|paint|write|creat/i)) category = "Creativity";
      else if (message.match(/friend|family|social/i)) category = "Social";
      else if (message.match(/clean|organi|plan/i)) category = "Discipline";
      else if (message.match(/health|doctor|medic/i)) category = "Health";
      return Response.json({ response, action: { type: "create_activity", activity: { name: activityName, category, points: { virus: 0, data: 0, vaccine: 0 } } } }, { headers: CORS });
    }
    return Response.json({ response }, { headers: CORS });
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json({ error: "Internal error" }, { status: 500, headers: CORS });
  }
}
__name(onRequestPost, "onRequestPost");

// api/fcm-subscribe.js
var CORS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: CORS2 });
}
__name(onRequestOptions2, "onRequestOptions");
async function onRequestPost2({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS2 }
    });
  }
  const { token, digimonName, language } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS2 }
    });
  }
  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ token, digimonName: digimonName || "DigiMon", language: language || "pt-BR" }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS2 }
  });
}
__name(onRequestPost2, "onRequestPost");
async function onRequestDelete({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS2 }
    });
  }
  const { token } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS2 }
    });
  }
  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS2 }
  });
}
__name(onRequestDelete, "onRequestDelete");
async function hashToken(token) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(hashToken, "hashToken");

// api/generate-sprite.js
var CORS3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var MODEL = "gemini-2.5-flash-image";
async function onRequestOptions3() {
  return new Response(null, { headers: CORS3 });
}
__name(onRequestOptions3, "onRequestOptions");
async function onRequestPost3({ request, env }) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "prompt required" }, { status: 400, headers: CORS3 });
    }
    const key = env.GEMINI_API_KEY;
    if (!key) {
      return Response.json({ error: "image generation not configured" }, { status: 503, headers: CORS3 });
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // pede explicitamente imagem na resposta
        generationConfig: { responseModalities: ["IMAGE"] }
      })
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("Gemini image error:", res.status, detail);
      return Response.json({ error: "image service error", status: res.status }, { status: 502, headers: CORS3 });
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imgPart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
    const inline = imgPart?.inlineData || imgPart?.inline_data;
    if (!inline?.data) {
      console.error("Gemini: no image in response", JSON.stringify(data).slice(0, 500));
      return Response.json({ error: "no image returned" }, { status: 502, headers: CORS3 });
    }
    const mime = inline.mimeType || inline.mime_type || "image/png";
    return Response.json({ image: `data:${mime};base64,${inline.data}` }, { headers: CORS3 });
  } catch (err) {
    console.error("generate-sprite error:", err);
    return Response.json({ error: "internal error" }, { status: 500, headers: CORS3 });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/save.js
var CORS4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;
async function onRequestOptions4() {
  return new Response(null, { headers: CORS4 });
}
__name(onRequestOptions4, "onRequestOptions");
async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get("id");
  if (!saveId || !VALID_ID.test(saveId)) {
    return Response.json({ error: "Invalid save ID" }, { status: 400, headers: CORS4 });
  }
  if (!env.DIGIAPP_SAVES) {
    return Response.json({ error: "Storage not bound \u2014 add KV binding DIGIAPP_SAVES in Cloudflare dashboard" }, { status: 500, headers: CORS4 });
  }
  if (request.method === "GET") {
    const raw = await env.DIGIAPP_SAVES.get(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS4 });
    return Response.json({ found: true, state: JSON.parse(raw) }, { headers: CORS4 });
  }
  if (request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body?.state) return Response.json({ error: "Missing state" }, { status: 400, headers: CORS4 });
    await env.DIGIAPP_SAVES.put(saveId, JSON.stringify(body.state), { expirationTtl: 86400 * 365 });
    return Response.json({ ok: true }, { headers: CORS4 });
  }
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS4 });
}
__name(onRequest, "onRequest");

// api/subscribe.js
var CORS5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions5() {
  return new Response(null, { status: 204, headers: CORS5 });
}
__name(onRequestOptions5, "onRequestOptions");
async function onRequestPost4({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS5 }
    });
  }
  const { endpoint, keys, digimonName, language } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS5 }
    });
  }
  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ endpoint, keys, digimonName: digimonName || "DigiMon", language: language || "pt-BR" }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json", ...CORS5 }
  });
}
__name(onRequestPost4, "onRequestPost");
async function onRequestDelete2({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS5 }
    });
  }
  const { endpoint } = body;
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "Missing endpoint" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS5 }
    });
  }
  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS5 }
  });
}
__name(onRequestDelete2, "onRequestDelete");
async function hashEndpoint(endpoint) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(hashEndpoint, "hashEndpoint");

// .well-known/assetlinks.json.js
async function onRequest2() {
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
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(onRequest2, "onRequest");

// ../.wrangler/tmp/pages-RYzP9a/functionsRoutes-0.6973037261260577.mjs
var routes = [
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/fcm-subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/generate-sprite",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/generate-sprite",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/save",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/.well-known/assetlinks.json",
    mountPath: "/.well-known",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/save",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../root/.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../root/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
