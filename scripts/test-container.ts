const CONTAINER_NAME = "n8n-cli-test";
const N8N_IMAGE = "n8nio/n8n";
const DEFAULT_PORT = 5678;
const HEALTH_CHECK_TIMEOUT = 120000;
const HEALTH_CHECK_INTERVAL = 2000;
const ENCRYPTION_KEY = "n8n-cli-test-key-1234567890abcdef";

interface N8nInstance {
  baseUrl: string;
  apiKey: string;
}

async function containerExists(): Promise<boolean> {
  const proc = Bun.spawnSync(["docker", "inspect", CONTAINER_NAME]);
  return proc.exitCode === 0;
}

async function stopContainer(): Promise<void> {
  const exists = await containerExists();
  if (!exists) return;

  Bun.spawnSync(["docker", "stop", CONTAINER_NAME]);
  Bun.spawnSync(["docker", "rm", "-f", CONTAINER_NAME]);
}

async function waitForN8n(baseUrl: string): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < HEALTH_CHECK_TIMEOUT) {
    try {
      const response = await fetch(`${baseUrl}/rest/settings`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const text = await response.text();
        try {
          JSON.parse(text);
          return;
        } catch {
          // n8n still starting up
        }
      }
    } catch {
    }
    await new Promise(r => setTimeout(r, HEALTH_CHECK_INTERVAL));
  }

  throw new Error("n8n container failed to start within timeout");
}

function toBase64Url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function deriveJwtSecret(): Promise<string> {
  // n8n derives the JWT secret from encryptionKey the same way as jwt.service.js:
  // 1. Take every other character (even indices)
  // 2. SHA-256 hash it, return as hex string
  let baseKey = '';
  for (let i = 0; i < ENCRYPTION_KEY.length; i += 2) {
    baseKey += ENCRYPTION_KEY[i];
  }
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(baseKey));
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateApiKey(userId: string, scopes: string[]): Promise<string> {
  const jwtSecret = await deriveJwtSecret();

  const header = toBase64Url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({
    sub: userId, iss: "n8n", aud: "public-api",
    jti: crypto.randomUUID(), iat: Math.floor(Date.now() / 1000),
  })));

  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${toBase64Url(sig)}`;
}

async function insertApiKeyInDb(apiKey: string, userId: string, scopes: string[]): Promise<void> {
  const id = Math.random().toString(36).substring(2, 18);
  const scopesJson = JSON.stringify(scopes).replace(/'/g, "\\'");
  const now = new Date().toISOString().replace("T", " ").replace("Z", "");

  const script = `
const sqlite3 = require('/usr/local/lib/node_modules/n8n/node_modules/sqlite3');
const db = new sqlite3.Database('/home/node/.n8n/database.sqlite');
db.run(
  "INSERT INTO user_api_keys (id, userId, label, apiKey, scopes, audience, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ["${id}", "${userId}", "test-key", "${apiKey}", '${scopesJson}', "public-api", "${now}", "${now}"],
  (err) => { if (err) { console.error(err); process.exit(1); } db.close(); }
);
`;

  const proc = Bun.spawnSync(["docker", "exec", CONTAINER_NAME, "node", "-e", script]);
  if (proc.exitCode !== 0) {
    throw new Error(`Failed to insert API key into DB: ${new TextDecoder().decode(proc.stderr)}`);
  }
}

async function setupApiKeyViaApi(baseUrl: string): Promise<string> {
  const setupRes = await fetch(`${baseUrl}/rest/owner/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@test.local",
      password: "Admin1234!",
      firstName: "Admin",
      lastName: "User",
    }),
  });

  if (!setupRes.ok) {
    throw new Error(`Owner setup failed: ${setupRes.status} ${await setupRes.text()}`);
  }

  const setupData = await setupRes.json() as { data: { id: string; globalScopes: string[] } };
  const userId = setupData.data.id;
  const scopes = setupData.data.globalScopes.filter(s => /^[a-zA-Z]+:[a-zA-Z]+$/.test(s));

  const apiKey = await generateApiKey(userId, scopes);
  await insertApiKeyInDb(apiKey, userId, scopes);

  return apiKey;
}

async function startN8nContainer(): Promise<N8nInstance> {
  await stopContainer();

  const port = DEFAULT_PORT;
  const baseUrl = `http://localhost:${port}`;

  const proc = Bun.spawnSync([
    "docker", "run", "-d",
    "--name", CONTAINER_NAME,
    "-p", `${port}:5678`,
    "-e", "WEBHOOK_URL=http://localhost:5678",
    "-e", "N8N_PUBLIC_API_ENABLED=true",
    "-e", `N8N_ENCRYPTION_KEY=${ENCRYPTION_KEY}`,
    N8N_IMAGE
  ]);

  if (proc.exitCode !== 0) {
    throw new Error("Failed to start n8n container");
  }

  await waitForN8n(baseUrl);
  const apiKey = await setupApiKeyViaApi(baseUrl);

  return { baseUrl, apiKey };
}

export async function runWithTestContainer<T>(
  fn: (instance: N8nInstance) => Promise<T>
): Promise<T> {
  const instance = await startN8nContainer();
  
  try {
    return await fn(instance);
  } finally {
    await stopContainer();
  }
}

export { stopContainer, startN8nContainer, CONTAINER_NAME };
