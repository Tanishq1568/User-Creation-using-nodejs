require("dotenv").config();

const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 8000;

const mongo = new MongoClient(process.env.MONGO_URI);

async function connectDB() {
  try {
    await mongo.connect();
    await mongo.db("admin").command({ ping: 1 });
    console.log("MongoDB Atlas Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:");
    console.error(err);
  }
}

connectDB();

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("login", { error: null });
});

app.get("/signup", (req, res) => {
  res.render("Signup");
});

app.get("/forgot-password", (req, res) => {
  res.render("ForgotPassword", {
    error: null,
    success: null
  });
});

app.get("/deleteaccount", (req, res) => {
  res.render("DeleteAccount");
});

app.get("/home", (req, res) => {
  const email = req.query.email || "user@example.com";
  res.render("home", { userEmail: email });
});

app.post("/signup", async (req, res) => {
  try {
    const database = mongo.db("nodejs");
    const collection = database.collection("users");

    const existingUser = await collection.findOne({
      email: req.body.email
    });

    if (existingUser) {
      return res.send("Email already registered");
    }

    await collection.insertOne(req.body);

    res.redirect("/");
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send(err.message);
  }
});

app.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    const database = mongo.db("nodejs");
    const collection = database.collection("users");

    const user = await collection.findOne({
      email,
      password
    });

    if (user) {
      return res.redirect(`/home?email=${email}`);
    }

    res.render("login", {
      error: "Invalid email or password"
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send(err.message);
  }
});

app.post("/deleteaccount", async (req, res) => {
  try {
    const { email, password } = req.body;

    const database = mongo.db("nodejs");
    const collection = database.collection("users");

    const user = await collection.findOne({
      email,
      password
    });

    if (!user) {
      return res.send("Invalid credentials. Account not found.");
    }

    await collection.deleteOne({
      email,
      password
    });

    res.redirect("/deleteaccount?success=true");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).send(err.message);
  }
});

app.post("/forgot-password", async (req, res) => {
  try {
    const { email, newpassword, confirmpassword } = req.body;

    const database = mongo.db("nodejs");
    const collection = database.collection("users");

    const user = await collection.findOne({ email });

    if (!user) {
      return res.render("ForgotPassword", {
        error: "Email not found",
        success: null
      });
    }

    if (newpassword !== confirmpassword) {
      return res.render("ForgotPassword", {
        error: "Passwords do not match",
        success: null
      });
    }

    await collection.updateOne(
      { email },
      {
        $set: {
          password: newpassword
        }
      }
    );

    res.render("ForgotPassword", {
      error: null,
      success: "Password updated successfully"
    });
  } catch (err) {
    console.error("Password Update Error:", err);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});