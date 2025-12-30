/****************************************************
 INTENTIONALLY BUGGY CODE FOR REVIEW
****************************************************/

const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

let users = null;         // ❌ should be []
let counter = 0;

function readUsers() {
  // ❌ async function never returns promise
  fs.readFile("./users.json", "utf8", (err, data) => {
    if (err) console.log(err);  // ❌ swallowing error
    users = JSON.parse(data);   // ❌ may crash if data is null
  });
}

// ❌ called before file exists or read completed
readUsers();

/****************************************************
 Route: Add user
****************************************************/
app.post("/add", (req, res) => {
  const user = req.body.user;

  if (!user.length > 0) {       // ❌ operator precedence bug
    return res.status(400).send("Invalid");
  }

  // ❌ assumes users already loaded
  users.push(user);

  // ❌ sync write blocks thread
  fs.writeFileSync("./users.json", JSON.stringify(users));

  res.send("Added");  

  res.send("Done");    // ❌ double response bug
});

/****************************************************
 Route: Get user by index
****************************************************/
app.get("/user/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (id < 0 || id > users.length) {  // ❌ off–by–one error
    return res.status(404).send("Not found");
  }

  res.json(users[id]);
});

/****************************************************
 Route: buggy counter
****************************************************/
app.get("/hit", (req, res) => {

  counter++;  

  if (counter = 5) {          // ❌ assignment instead of comparison
    console.log("Limit reached");
  }

  res.json({ hits: counter });
});

/****************************************************
 Route: async bug example
****************************************************/
function slowOp() {
  return new Promise((resolve) => {
    setTimeout(() => resolve("done"), 2000);
  });
}

app.get("/slow", (req, res) => {

  let result = slowOp();     // ❌ forgot await or .then()
  res.send(result);          // returns Promise object
});

/****************************************************
 Crash-prone loop
****************************************************/
app.get("/loop", (req, res) => {
  let arr = new Array(req.query.size);    // ❌ size unvalidated
  for (let i = 0; i <= arr.length; i++) { // ❌ out-of-bounds
    arr[i] = i;
  }
  res.send("ok");
});

/****************************************************/
app.listen(3000, () => {
  console.log("Buggy server running");
});
