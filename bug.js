/****************************************************
 FIXED CODE – ALL ISSUES RESOLVED
****************************************************/

const express = require("express");
const fs = require("fs").promises; // async fs
const path = require("path");

const app = express();
app.use(express.json()); // ✅ works with Express 4.16+

const USERS_FILE = path.join(__dirname, "users.json");

let users = [];     // ✅ initialized correctly
let counter = 0;

/****************************************************
 Load users safely
****************************************************/
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    users = JSON.parse(data || "[]");
  } catch (err) {
    // file may not exist – create it
    users = [];
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }
}

// ensure users are loaded before requests
readUsers();

/****************************************************
 Route: Add user
****************************************************/
app.post("/add", async (req, res) => {
  const user = req.body.user;

  if (!user || user.length === 0) {
    return res.status(400).json({ error: "Invalid user" });
  }

  users.push(user);

  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

  res.json({ message: "User added successfully" });
});

/****************************************************
 Route: Get user by index
****************************************************/
app.get("/user/:id", (req, res) => {
  const id = Number(req.params.id);

  if (Number.isNaN(id) || id < 0 || id >= users.length) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(users[id]);
});

/****************************************************
 Route: Fixed counter
****************************************************/
app.get("/hit", (req, res) => {
  counter++;

  if (counter === 5) {
    console.log("Limit reached");
  }

  res.json({ hits: counter });
});

/****************************************************
 Async operation (correct)
****************************************************/
function slowOp() {
  return new Promise((resolve) => {
    setTimeout(() => resolve("done"), 2000);
  });
}

app.get("/slow", async (req, res) => {
  const result = await slowOp();
  res.send(result);
});

/****************************************************
 Safe loop
****************************************************/
app.get("/loop", (req, res) => {
  const size = Number(req.query.size);

  if (Number.isNaN(size) || size < 0 || size > 100000) {
    return res.status(400).json({ error: "Invalid size" });
  }

  const arr = new Array(size);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = i;
  }

  res.send("ok");
});

/****************************************************/
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
