/****************************************************
 INTENTIONALLY BAD PERFORMANCE Node.js server
 FOR CODE REVIEW EXERCISES ONLY
****************************************************/

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ❌ global growing array – memory leak risk
let logs = [];

// ❌ unindexed data set
let users = [];

// ❌ repeatedly loads file into memory unnecessarily
function loadUsersSync() {
  const filePath = path.join(__dirname, "users.json");

  // ❌ blocking I/O call
  const fileData = fs.readFileSync(filePath, "utf8");

  // ❌ unnecessary parsing 
  return JSON.parse(fileData);
}

// ❌ expensive CPU loop (blocks event loop)
function doExpensiveLoop() {
  let sum = 0;
  for (let i = 0; i < 999999999; i++) {
    sum += i * i;
  }
  return sum;
}

// ❌ memory grows forever – logs never cleared
setInterval(() => {
  logs.push(Date.now());
  console.log("Log pushed. Count:", logs.length);
}, 1000);

/***************************************************
 Load users every request (very bad)
***************************************************/
app.get("/slow-users", (req, res) => {
  // ❌ redundant disk read
  const loadedUsers = loadUsersSync();

  users = loadedUsers;

  // ❌ returns full dataset (no pagination)
  res.json(users);
});

/***************************************************
 Bad login implementation
***************************************************/
app.post("/login", express.json(), (req, res) => {
  const { username } = req.body;

  // ❌ expensive CPU work before lookup
  doExpensiveLoop();

  // ❌ O(n) linear search + no indexing
  const found = users.find((u) => u.username === username);

  if (!found) {
    return res.status(404).send("User not found");
  }
  res.send("Ok");
});

/***************************************************
 Returns logs array (unbounded memory)
***************************************************/
app.get("/logs", (req, res) => {
  // ❌ memory keeps growing
  res.json(logs);
});

/***************************************************
 Server start
***************************************************/
app.listen(PORT, () => {
  console.log("BAD PERFORMANCE server running", PORT);
});
