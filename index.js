const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET);

//middleware

app.use(cors());
/* app.use(
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
); */

app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4vm44.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

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

 // ** Payment Collection*/
    const paymentsCollection = client
      .db("sparrow-manufacturer")
      .collection("payments");

    //**Verify Admin */

    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    // ** Payment Intent*/

    app.post("/create-payment-intent", async (req, res) => {
      const order = req.body;
      const total = order.total;
      const amount = total * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //**GET Products Tools */

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productsCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    //** POST Products */
    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
    /////////////////////// Reviews Start //////////////////////
    //**GET Reviews */
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    //**POST Reviews */

    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });
    /////////////////////// Reviews End //////////////////////

    /////////////////////// ORDERS Start //////////////////////
    //**get Orders */
    app.get("/orders", async (req, res) => {
      const query = {};
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });
    //**post Orders */
    app.post("/orders", async (req, res) => {
      const review = req.body;
      const result = await ordersCollection.insertOne(review);
      res.send(result);
    });
    // ** My  Orders*/
    app.get("/myOrders", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const cursor = ordersCollection.find(query);
      const myOrders = await cursor.toArray();
      res.send(myOrders);
    });

    //** Update User Profile */

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const data = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: data,
      };
      const updateProfile = await userCollection.updateOne(filter, updateDoc);
      res.send(updateProfile);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const userProfile = await userCollection.findOne({ email: email });
      res.send(userProfile);
    });
    /* app.put("/profiles/:email", async (req, res) => {
      const email = req.params.email;
      const profile = req.body;
      console.log(profile);
      const filter = { email: email };
      const updatedDoc = {
        $set: profile,
      };
      const updatedProfile = await userCollection.updateOne(filter, updatedDoc);
      console.log(updatedProfile);
      res.send(updatedProfile);
    }); */

    // ** Payment PATCH*/

    app.patch("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedOrders = await ordersCollection.updateOne(
        filter,
        updatedDoc
      );
      const result = await paymentsCollection.insertOne(payment);
      res.send(updatedOrders);
    });

    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });

    // ** Delete myOrders From DB*/

    app.delete("/myOrders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);
      res.send(result);
    });

    // ** Delete orders From DB by Admin*/

    app.delete("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(filter);

      res.send(result);
    });

    /////////////////////// ORDERS Finish //////////////////////
    //**GET A Specific Product */

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);
    });
    //**>> Users Collection << */

    //* Getting Users  */
    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    //**Creating Users */

    app.put("/userData/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
      );
      res.send({ result, token });
    });

    //**>> Users error << */

    //* Getting admin  */
    app.get("/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
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
