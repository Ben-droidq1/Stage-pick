import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, "users.json");

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
  await writeFile(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.url === "/api/users" && req.method === "GET") {
    const users = await readUsers();
    sendJson(res, 200, { users });
    return;
  }

  if (req.url === "/api/users" && req.method === "POST") {
    try {
      const body = await readBody(req);
      const fullName = String(body.fullName ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const authProvider = String(body.authProvider ?? "email").trim();

      if (!fullName || !email) {
        sendJson(res, 400, {
          error: "fullName and email are required",
        });
        return;
      }

      const users = await readUsers();
      const duplicate = users.find((user) => user.email === email);

      if (duplicate) {
        sendJson(res, 409, {
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

      sendJson(res, 201, { user });
    } catch (error) {
      sendJson(res, 400, { error: error.message || "Unable to save user" });
    }

    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

const port = process.env.PORT || 3001;

server.listen(port, () => {
  console.log(`User API listening on http://localhost:${port}`);
});
