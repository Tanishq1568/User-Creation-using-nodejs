const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

app.listen(8000, () => {
    console.log("Starting Server");
});

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true 
    
}));

const mongo = new MongoClient("mongodb://0.0.0.0:27017");

app.get("/", (req, res) => {
    res.render("login", { error: null }); 
});

app.get("/signup", (req, res) => {
    res.render("Signup");
});

app.get("/forgot-password", (req, res) => {
    res.render("ForgotPassword");
});

app.get('/deleteaccount', (req, res) => {
    res.render('DeleteAccount');
});

app.get("/home", (req, res) => {
    const email = req.query.email || "user@example.com";
    res.render("home", { userEmail: email });
});

// Signup
app.post("/signup", async (req, res) => {
    let connection = await mongo.connect();
    let database = await connection.db("nodejs");
    let collection = await database.collection("users");

    await collection.insertOne(req.body);
    res.redirect("/");
});
//home 
app.post("/", async (req, res) => {
    const { email, password } = req.body;

    try {
        let connection = await mongo.connect();
        let database = await connection.db("nodejs");
        let collection = await database.collection("users");

        const user = await collection.findOne({ email: email, password: password });

        if (user) {
            res.redirect(`/home?email=${email}`);
        } else {
            res.render("login", { error: "Invalid email or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});
//deleteaccount
app.post("/deleteaccount", async (req, res) => {
    let connection = await mongo.connect();
    let database = connection.db("nodejs");
    let collection = database.collection("users");

    const { email, password } = req.body;

    const user = await collection.findOne({ email, password });

    if (user) {
        await collection.deleteOne({ email, password });
        return res.redirect("/deleteaccount?success=true");
    } else {
        return res.send("Invalid credentials. Account not found.");
    }
});

// Forgot Password
app.post("/forgot-password", async (req, res) => {
    const { email, newpassword, confirmpassword } = req.body;

    let connection = await mongo.connect();
    let database = connection.db("nodejs");
    let collection = database.collection("users");

    const user = await collection.findOne({ email });

    if (!user) {
        return res.render("ForgotPassword", { error: "Email not found", success: null });
    }

    if (newpassword !== confirmpassword) {
        return res.render("ForgotPassword", { error: "Passwords do not match", success: null });
    }

    await collection.findOneAndUpdate(
        { email },
        { $set: { password: newpassword } }
    );

    return res.redirect("/forgot-password?success=true");
});


