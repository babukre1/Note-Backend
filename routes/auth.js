const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../db");

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post("/signup", async (req, res) => {
  const { username, fullname, password } = req.body;

  try {
    let user = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (user.rows.length > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await pool.query(
      "INSERT INTO users (username, fullname, password) VALUES ($1, $2, $3) RETURNING id, username, fullname",
      [username, fullname, hashedPassword],
    );

    req.session.user = {
      id: user.rows[0].id,
      username: user.rows[0].username,
      fullname: user.rows[0].fullname,
    };

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    let result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const userData = result.rows[0]; // Capture the actual user row
    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Assign actual values to session
    req.session.user = {
      id: userData.id,
      username: userData.username,
      fullname: userData.fullname,
    };

    req.session.save((err) => {
      if (err) return res.status(500).json({ msg: "Session save failed" });
      return res.json({ msg: "Logged in successfully" });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth/me
// @desc    Get logged in user
// @access  Private
router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ msg: "Not authenticated" });
  }
});

// @route   GET api/auth/logout
// @desc    Logout user
// @access  Private
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ msg: "Could not log out, please try again" });
    }
    res.json({ msg: "Logged out successfully" });
  });
});

module.exports = router;


router.put("/editMyProfile", auth, async (req, res) => {
  const { fullname, username } = req.body;
  try {
    const updatedUser = await pool.query(
      "UPDATE users SET fullname = $1, username = $2 WHERE id = $3 RETURNING id, username, fullname, role",
      [fullname, username, req.user.id], // req.user.id comes from your adminAuth middleware
    );
    res.json({ msg: "Profile updated", user: updatedUser.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});