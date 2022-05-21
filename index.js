const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("Manufacturer Portal is Running");
});

app.listen(port, () => {
  console.log(`Manufacturer App Listening to Port ${port}`);
});
