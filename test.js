// vulnerable.js
app.post("/update", (req, res) => {
  Object.assign({}, req.body);
});
