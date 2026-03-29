
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// --------------------------------------------------
let users = []; // initialize to empty array

app.get("/users", (req, res) => {
  const total = Array.isArray(users) ? users.length : 0;
  res.send("Total users: " + total);
});

// --------------------------------------------------
app.get("/read", async (req, res) => {
  try {
    const data = await fs.promises.readFile("missing-file.txt", "utf8");
    res.send(data);
  } catch (err) {
    console.error("read-file error:", err);
    res.status(500).send("Failed to read file");
  }
});

// --------------------------------------------------
// ❌ HIGH BUG: Infinite loop (CPU hang)
app.get("/loop", (req, res) => {
  let i = 0;
  while (i >= 0) { // ❌ never ends
    i++;
  }
  res.send("Done");
});

// --------------------------------------------------
// ❌ HIGH BUG: Multiple responses sent
app.get("/double-response", (req, res) => {
  res.send("First response");
  res.send("Second response"); // ❌ Error: headers already sent
});

// --------------------------------------------------
// ❌ MEDIUM BUG: Off-by-one error
app.get("/array", (req, res) => {
  const arr = [1, 2, 3];
  for (let i = 0; i <= arr.length; i++) { // ❌ should be <
    console.log(arr[i]); // undefined access
  }
  res.send("Check console");
});

// --------------------------------------------------
// ❌ MEDIUM BUG: Wrong condition check
app.get("/age", (req, res) => {
  const age = req.query.age;

  if (age = 18) { // ❌ assignment instead of comparison
    res.send("Adult");
  } else {
    res.send("Minor");
  }
});

// --------------------------------------------------
// ❌ MEDIUM BUG: Missing return in function
function isEven(num) {
  if (num % 2 === 0) {
    return true;
  }
  // ❌ missing return false
}

app.get("/even", (req, res) => {
  res.send(isEven(3)); // undefined
});

// --------------------------------------------------
// ❌ MEDIUM BUG: Async function not awaited
app.get("/async", async (req, res) => {
  function fetchData() {
    return new Promise(resolve =>
      setTimeout(() => resolve("Data loaded"), 1000)
    );
  }

  const data = fetchData(); // ❌ missing await
  res.send(data); // Promise object
});

// --------------------------------------------------
// ❌ LOW BUG: Type coercion issue
app.get("/sum", (req, res) => {
  const a = req.query.a;
  const b = req.query.b;
  res.send(a + b); // "2" + "3" = "23"
});

// --------------------------------------------------
// ❌ LOW BUG: Incorrect default value
app.get("/limit", (req, res) => {
  const limit = req.query.limit || 10;
  res.send("Limit: " + limit); // limit=0 ignored
});

// --------------------------------------------------
// ❌ LOW BUG: Variable shadowing
let count = 10;

app.get("/count", (req, res) => {
  let count = count + 1; // ❌ ReferenceError
  res.send(count);
});

// --------------------------------------------------
// ❌ LOW BUG: Missing break in switch
app.get("/role", (req, res) => {
  const role = req.query.role;

  switch (role) {
    case "admin":
      res.send("Admin");
    case "user":
      res.send("User"); // ❌ fall-through
    default:
      res.send("Guest");
  }
});

// --------------------------------------------------
// ❌ LOW BUG: Incorrect JSON response
app.get("/json", (req, res) => {
  res.send("{ name: 'test' }"); // ❌ invalid JSON
});

// --------------------------------------------------
// ❌ LOW BUG: Server starts without required config
app.listen(3000);
