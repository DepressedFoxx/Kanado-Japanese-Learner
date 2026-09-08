// Run without cloud credentials or paid requests.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const filename = path.resolve("apps/web/app/api/speech/route.ts");
const source = fs.readFileSync(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const routeModule = new Module(filename, module);
routeModule.filename = filename;
routeModule.paths = Module._nodeModulePaths(path.dirname(filename));
routeModule._compile(compiled, filename);

const { POST } = routeModule.exports;
const originalFetch = global.fetch;
const originalKey = process.env.GOOGLE_TTS_API_KEY;

function request(body, origin = "http://localhost:3000") {
  return {
    headers: new Headers({ origin }),
    nextUrl: { origin: "http://localhost:3000" },
    json: async () => body,
  };
}

async function run() {
  delete process.env.GOOGLE_TTS_API_KEY;

  assert.equal((await POST(request({ text: "こんにちは" }))).status, 503);
  assert.equal((await POST(request({ text: "" }))).status, 400);
  assert.equal((await POST(request({ text: "a".repeat(301) }))).status, 400);
  assert.equal(
    (await POST(request({ text: "test" }, "https://other.example"))).status,
    403,
  );

  process.env.GOOGLE_TTS_API_KEY = "test-key";
  let calls = 0;

  global.fetch = async (url, options) => {
    calls++;
    assert.equal(
      url,
      "https://texttospeech.googleapis.com/v1/text:synthesize",
    );
    assert.equal(options.headers["X-Goog-Api-Key"], "test-key");
    assert.equal(JSON.parse(options.body).voice.languageCode, "ja-JP");
    return Response.json({ audioContent: "SUQz" });
  };

  const results = await Promise.all([
    POST(request({ text: "こんにちは" })),
    POST(request({ text: "こんにちは" })),
  ]);

  assert.equal(calls, 1, "concurrent requests deduplicate");
  assert.equal((await results[0].json()).provider, "google");
  assert.equal((await POST(request({ text: "こんにちは" }))).status, 200);
  assert.equal(calls, 1, "repeat uses cache");

  global.fetch = async () => new Response("", { status: 403 });
  assert.equal((await POST(request({ text: "失敗" }))).status, 502);

  console.log(
    "Speech checks passed: validation, missing key, origin, Google request, deduplication, cache, upstream error.",
  );
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;

    if (originalKey === undefined) {
      delete process.env.GOOGLE_TTS_API_KEY;
    } else {
      process.env.GOOGLE_TTS_API_KEY = originalKey;
    }
  });
