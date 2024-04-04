const express = require("express");
const { authController2 } = require("./main.service");
const app = express();

app.use(express.json());

app.post("/auth", authController2);

app.listen(8234, () => {
  console.log("Server started on port 8234");
});
