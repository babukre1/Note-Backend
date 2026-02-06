require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const db = require("./db");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: true, // or your specific IP
    credentials: true, // REQUIRED for sessions/cookies
  }),
);

app.use(express.json());
app.set('trust proxy', 1);
// 3. Session (Must be BEFORE routes)
app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: false, // Session only saves if we add data to it
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Define Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/", (req, res) => {
  res.send("Notes API is running!");
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ message: 'Connected to Neon!', time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database connection error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
