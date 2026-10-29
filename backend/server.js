import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render (and most hosts) have a read-only app directory, so the user store
// lives wherever DATA_DIR points. Mount a persistent disk there in production,
// otherwise the file is wiped on every deploy/restart.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const USERS_FILE = path.join(DATA_DIR, "users.json");

// "*" allows any origin (fine for local dev). In production set CORS_ORIGIN to
// the deployed frontend, e.g. "https://stagepick.vercel.app,http://localhost:5173".
const ALLOWED_ORIGINS = String(process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function corsHeaders(req) {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes("*")) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }

  // No Origin header means a same-origin or non-browser client: nothing to allow.
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
  };
}

async function readUsers() {
  try {
    const raw = await readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeUsers([]);
      return [];
    }

    throw error;
  }
}

async function writeUsers(users) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function sendJson(req, res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...corsHeaders(req),
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  // Render pings this to decide whether the instance is healthy.
  if (req.url === "/health" && req.method === "GET") {
    sendJson(req, res, 200, {
      status: "ok",
      uptime: Math.round(process.uptime()),
    });
    return;
  }

  if (req.url === "/" && req.method === "GET") {
    sendJson(req, res, 200, {
      service: "stagepick-api",
      routes: ["GET /health", "GET /api/users", "POST /api/users"],
    });
    return;
  }

  if (req.url === "/api/users" && req.method === "GET") {
    const users = await readUsers();
    sendJson(req, res, 200, { users });
    return;
  }

  if (req.url === "/api/users" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const fullName = String(body.fullName ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const authProvider = String(body.authProvider ?? "email").trim();

      if (!fullName || !email) {
        sendJson(req, res, 400, {
          error: "fullName and email are required",
        });
        return;
      }

      const users = await readUsers();
      const duplicate = users.find((user) => user.email === email);

      if (duplicate) {
        sendJson(req, res, 409, {
          error: "A user with that email already exists",
        });
        return;
      }

      const user = {
        id: randomUUID(),
        fullName,
        email,
        authProvider,
        createdAt: new Date().toISOString(),
      };

      users.push(user);
      await writeUsers(users);

      sendJson(req, res, 201, { user });
    } catch (error) {
      sendJson(req, res, 400, { error: error.message || "Unable to save user" });
    }

    return;
  }

  sendJson(req, res, 404, { error: "Not found" });
});

const port = Number(process.env.PORT) || 3001;

server.listen(port, "0.0.0.0", () => {
  console.log(`User API listening on http://0.0.0.0:${port}`);
  console.log(`Users file: ${USERS_FILE}`);
  console.log(`CORS origins: ${ALLOWED_ORIGINS.join(", ")}`);
});

// Render sends SIGTERM before replacing an instance; finish in-flight requests.
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  });
}
