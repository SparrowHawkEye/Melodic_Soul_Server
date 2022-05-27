const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4vm44.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log(uri);
/* 
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}
 */
async function run() {
  try {
    await client.connect();
    const productsCollection = client
      .db("sparrow-manufacturer")
      .collection("products");
    const ordersCollection = client
      .db("sparrow-manufacturer")
      .collection("orders");
    const reviewsCollection = client
      .db("sparrow-manufacturer")
      .collection("reviews");

    const userCollection = client
      .db("sparrow-manufacturer")
      .collection("users");

    //**GET Products Tools */

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    //**GET Reviews */
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    //**post Reviews */

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    //**GET A Specific Product */

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);

      //**Create Orders */
      /* 
      app.post("/orders", async (req, res) => {
        const orders = req.body;
        const query = 
      }); */

      //* Getting Users  */
      /*   app.get("/user", async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      }); */

      //**Creating Users */
      /* 
      app.put("/user/:email", async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        console.log(user);
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        res.send(result, token);
      }); */
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Manufacturer Portal is Running");
});

app.listen(port, () => {
  console.log(`Manufacturer App Listening to Port ${port}`);
});
