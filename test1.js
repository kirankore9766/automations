
const express = require("express");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(express.json());

// --------------------------------------------------
// ❌ HIGH: Blocking Event Loop (Sync File Read)
app.get("/read-file", (req, res) => {
  const data = fs.readFileSync("large-file.txt", "utf8"); // blocks event loop
  res.send(data);
});

// --------------------------------------------------
// ❌ HIGH: Infinite / Heavy Loop (CPU Spike)
app.get("/cpu", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 1e9; i++) { // extreme CPU usage
    sum += i;
  }
  res.send("CPU work done: " + sum);
});

// --------------------------------------------------
// ❌ HIGH: Crypto in Request Thread
app.get("/hash", (req, res) => {
  crypto.pbkdf2Sync("password", "salt", 1000000, 64, "sha512");
  res.send("Hash created");
});

// --------------------------------------------------
// ❌ HIGH: N+1 Database Calls (Simulated)
app.get("/users", async (req, res) => {
  let users = [];

  for (let i = 1; i <= 1000; i++) {
    // simulate DB call per user
    users.push({ id: i, name: "User " + i });
  }

  res.send(users);
});

// --------------------------------------------------
// ❌ MEDIUM: No Pagination (Huge Response)
app.get("/logs", (req, res) => {
  const logs = [];

  for (let i = 0; i < 500000; i++) {
    logs.push({ id: i, message: "Log message" });
  }

  res.send(logs); // massive payload
});

// --------------------------------------------------
// ❌ MEDIUM: Memory Leak (Global Array)
let cache = [];

app.get("/cache", (req, res) => {
  cache.push(new Array(100000).fill("leak")); // never cleared
  res.send("Cache size: " + cache.length);
});

// --------------------------------------------------
// ❌ MEDIUM: Recalculating Same Data Repeatedly
app.get("/stats", (req, res) => {
  function heavyCalc() {
    let x = 0;
    for (let i = 0; i < 1e7; i++) {
      x += Math.sqrt(i);
    }
    return x;
  }

  res.send({
    a: heavyCalc(),
    b: heavyCalc(),
    c: heavyCalc()
  });
});

// --------------------------------------------------
// ❌ MEDIUM: No Compression Enabled
app.get("/big-text", (req, res) => {
  let text = "";
  for (let i = 0; i < 100000; i++) {
    text += "This is a large response ";
  }
  res.send(text);
});

// --------------------------------------------------
// ❌ LOW: Excessive Console Logging
app.get("/debug", (req, res) => {
  for (let i = 0; i < 10000; i++) {
    console.log("Debug log", i);
  }
  res.send("Logged");
});

// --------------------------------------------------
// ❌ LOW: Inefficient String Concatenation in Loop
app.get("/string", (req, res) => {
  let str = "";
  for (let i = 0; i < 50000; i++) {
    str += i; // inefficient
  }
  res.send("Done");
});

// --------------------------------------------------
// ❌ LOW: Unnecessary JSON Parsing
app.get("/parse", (req, res) => {
  const obj = JSON.parse(JSON.stringify(req.body));
  res.send(obj);
});

// --------------------------------------------------
// ❌ LOW: No Caching Headers
app.get("/nocache", (req, res) => {
  res.send("No cache headers set");
});

// --------------------------------------------------
// ❌ LOW: No Graceful Shutdown / Connection Handling
app.listen(3000, () => {
  console.log("Performance-issue app running on port 3000");
});
