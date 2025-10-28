/**
 * vulnerable_example_app.js
 *
 * A deliberately vulnerable Node.js + Express app that demonstrates:
 * - Command Injection
 * - SQL Injection
 * - Path Traversal / File Disclosure
 * - Insecure File Upload Handling
 * - Server-Side Request Forgery (SSRF)
 * - Cross-Site Scripting (XSS)
 * - Insecure use of eval / dynamic code execution
 * - Hardcoded credentials & secrets
 * - Weak crypto usage
 * - Insecure JWT handling
 * - Insecure CORS & open redirects
 *
 * PURPOSE: defensive/security testing only. Run locally in an isolated environment.
 *
 * Run (for testing only):
 *   npm init -y
 *   npm install express body-parser multer sqlite3 jsonwebtoken node-fetch
 *   node vulnerable_example_app.js
 *
 * Warning: contains insecure code. Do not expose to public networks.
 */

const express = require('express');
const bodyParser = require('body-parser');
const child_process = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch'); // SSRF demo

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/* -------------------------
   Hardcoded secrets (VULNERABLE)
   -------------------------
   - Hardcoding API keys, DB passwords, or JWT secrets is a common mistake.
*/
const HARDCODED_DB_PASSWORD = "P@ssw0rd123!";   // VULNERABLE
const JWT_SECRET = "super_secret_jwt_key_please_change"; // VULNERABLE

/* -------------------------
   Simple SQLite DB used for demo
   -------------------------
*/
const DB_FILE = "test_vuln.db";
if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT);");
  db.run("INSERT INTO users (username, password, role) VALUES ('admin', 'adminpass', 'admin')");
  db.run("INSERT INTO users (username, password, role) VALUES ('alice', 'alicepass', 'user')");
});

/* -------------------------
   Endpoint: Command injection (VULNERABLE)
   Description: takes 'name' param and uses it inside a shell command unsafely.
   Mitigation: never construct shell commands with untrusted input; use execFile or spawn with args.
*/
app.get('/cmd', (req, res) => {
  const name = req.query.name || 'world';
  // VULNERABLE: unsanitized concatenation into shell command
  const cmd = `echo Hello ${name}`;
  child_process.exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).send("error");
    res.send(`<pre>${stdout}</pre>`);
  });
});
/* Mitigation note:
   Use execFile or spawn with args, or validate strict whitelist of allowed values.
*/

/* -------------------------
   Endpoint: SQL injection (VULNERABLE)
   Description: constructs SQL using string concatenation with user input.
   Mitigation: use parameterized queries / prepared statements.
*/
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  // VULNERABLE: concatenated SQL
  const sql = `SELECT id, username, role FROM users WHERE username='${username}' AND password='${password}'`;
  db.get(sql, (err, row) => {
    if (err) return res.status(500).send("db error");
    if (!row) return res.status(401).send("invalid");
    // create JWT (insecure secret usage shown earlier)
    const token = jwt.sign({ id: row.id, username: row.username, role: row.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});
/* Mitigation note:
   Always use parameterized queries:
     db.get("SELECT ... WHERE username=? AND password=?", [username, password], cb)
*/

/* -------------------------
   Endpoint: Path traversal / file disclosure (VULNERABLE)
   Description: reads any file path provided by user.
   Mitigation: sanitize path, constrain to allowed directory, use path.normalize and check prefix.
*/
app.get('/read-file', (req, res) => {
  const rel = req.query.path || 'README.md';
  // VULNERABLE: direct use of user-provided path
  const filePath = path.join(__dirname, rel);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(404).send("not found");
    res.send(`<pre>${data}</pre>`);
  });
});
/* Mitigation note:
   Restrict to whitelist or an allowed base directory and verify resolved path starts with that base.
*/

/* -------------------------
   Endpoint: Insecure file upload (VULNERABLE)
   Description: accepts arbitrary uploads and stores them with original filename.
   Mitigation: validate file type, scan for malware, rename stored files, enforce size limits.
*/
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), (req, res) => {
  // VULNERABLE: storing file with original name allowed; no checks performed
  if (!req.file) return res.status(400).send("no file");
  const original = req.file.originalname;
  // move to 'uploads/originalname' (dangerous if original contains ../)
  const dest = path.join(__dirname, 'uploads', original);
  fs.rename(req.file.path, dest, (err) => {
    if (err) return res.status(500).send("err");
    res.send(`uploaded as ${original}`);
  });
});
/* Mitigation note:
   Always sanitize filenames, generate safe random filenames, validate MIME type and content, set strict permissions.
*/

/* -------------------------
   Endpoint: SSRF demonstration (VULNERABLE)
   Description: fetches a provided URL (e.g., could be used to access internal-only resources).
   Mitigation: block local IP ranges, use allowlist, resolve hostnames and validate against list.
*/
app.get('/fetch-url', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("provide url");
  try {
    // VULNERABLE: directly fetching user-supplied URL
    const r = await fetch(target, { method: 'GET' });
    const text = await r.text();
    res.send(`<pre>Fetched length ${text.length}</pre>`);
  } catch (e) {
    res.status(500).send("fetch error");
  }
});
/* Mitigation note:
   Validate target against trusted hostnames; disallow private IPs and 127.0.0.1, use DNS resolution checks.
*/

/* -------------------------
   Endpoint: Reflected XSS (VULNERABLE)
   Description: reflects user-provided content into HTML without escaping.
   Mitigation: escape output or use proper templating with auto-escaping.
*/
app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // VULNERABLE: direct reflection into HTML
  res.send(`<html><body>Search results for: <b>${q}</b></body></html>`);
});
/* Mitigation note:
   Encode user data before inserting into HTML (e.g., using a proper view engine with escaping).
*/

/* -------------------------
   Endpoint: Insecure dynamic code execution (VULNERABLE)
   Description: evaluate user-provided JS expression.
   Mitigation: avoid eval; use safe expression evaluators if necessary and restrict operations.
*/
app.post('/eval', (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).send("no code");
  try {
    // VULNERABLE: direct eval of user code
    const result = eval(code);
    res.json({ result: String(result) });
  } catch (e) {
    res.status(500).send("eval error");
  }
});
/* Mitigation note:
   Never eval untrusted code. Use sandboxing or limit functionality, or remove entirely.
*/

/* -------------------------
   Endpoint: Weak crypto usage (VULNERABLE)
   Description: uses insecure hashing and predictable salts.
   Mitigation: use proven KDFs (bcrypt, scrypt, Argon2) with appropriate cost factors.
*/
const crypto = require('crypto');
app.post('/weak-hash', (req, res) => {
  const password = req.body.password || 'password';
  // VULNERABLE: simple MD5 with predictable salt
  const salt = 'static_salt_value';
  const md5 = crypto.createHash('md5').update(password + salt).digest('hex');
  res.json({ md5 });
});
/* Mitigation note:
   Use bcrypt/Argon2 with per-password random salts.
*/

/* -------------------------
   Endpoint: Insecure JWT handling (VULNERABLE)
   Description: trusts JWT blindly, uses symmetric secret with weak rotation.
   Mitigation: use strong secrets, rotate keys, validate audience/issuer, set appropriate expirations.
*/
function authenticateJWT(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).send("no auth");
  const token = auth.split(' ')[1];
  try {
    // VULNERABLE: using static secret and not checking claims
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).send("invalid token");
  }
}

app.get('/admin', authenticateJWT, (req, res) => {
  // VULNERABLE: no role check
  res.send(`Hello ${req.user.username}, you are ${req.user.role}`);
});
/* Mitigation note:
   Check roles/permissions, validate claims (iss/aud), rotate secrets, prefer asymmetric keys where appropriate.
*/

/* -------------------------
   Endpoint: Insecure CORS & open redirect (VULNERABLE)
   Description: permissive CORS; redirect to user-provided URL.
   Mitigation: only allow trusted origins, validate redirect targets.
*/
app.use((req, res, next) => {
  // VULNERABLE: wildcard CORS header
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.get('/redirect', (req, res) => {
  const to = req.query.to || '/';
  // VULNERABLE: open redirect without validation
  res.redirect(to);
});
/* Mitigation note:
   Use allowlists for CORS origins and restrict redirect targets to internal routes or validated external domains.
*/

/* -------------------------
   Misc: insecure config exposure (VULNERABLE)
   - Endpoint that dumps environment variables
   - Useful to check whether your scanners flag exposures
*/
app.get('/env', (req, res) => {
  // VULNERABLE: exposes environment variables (could include secrets in misconfigured deployments)
  res.json(process.env);
});

/* -------------------------
   Safe-ish endpoint for comparison (not vulnerable)
   This demonstrates how to do some operations safely.
*/
app.get('/safe-clone', (req, res) => {
  // Accept only whitelisted repo names (example)
  const repo = req.query.repo;
  const allowed = ['my-org/docs', 'my-org/project'];
  if (!allowed.includes(repo)) return res.status(400).send("repo not allowed");

  // Use spawn with args (no shell interpolation)
  const git = child_process.spawn('git', ['clone', '--depth', '1', `https://github.com/${repo}.git`], {
    cwd: '/tmp'
  });

  git.on('close', code => {
    res.send(`cloned status ${code}`);
  });
});

/* -------------------------
   Start server
*/
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Vulnerable demo app running at http://localhost:${PORT}`);
  console.log('Endpoints: /cmd, /login, /read-file, /upload, /fetch-url, /search, /eval, /weak-hash, /admin, /redirect, /env');
});

/* -------------------------
   END OF FILE
   -------------------------
*/
