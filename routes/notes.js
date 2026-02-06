const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// @route   GET api/notes
// @desc    Get all notes for a specific user
// @access  Private
router.get("/", auth, async (req, res) => {
  console.log(req.session);

  try {
    const notes = await pool.query(
      "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(notes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/notes
// @desc    Add a new note
// @access  Private
router.post("/", auth, async (req, res) => {
  const { title, body, favourite } = req.body;

  try {
    const newNote = await pool.query(
      "INSERT INTO notes (user_id, title, body, favourite) VALUES ($1, $2, $3, $4) RETURNING * ",
      [req.user.id, title, body, favourite],
    );
    res
      .status(201)
      .json({ msg: "Note created successfully", note: newNote.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT api/notes/:id
// @desc    Update a note
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { title, body, favourite } = req.body;

  try {
    const updatedNote = await pool.query(
      "UPDATE notes SET title = $1, body = $2, updated_at = CURRENT_TIMESTAMP, favourite = $3 WHERE id = $4 AND user_id = $5 RETURNING * ",
      [title, body, favourite, id, req.user.id],
    );

    if (updatedNote.rows.length === 0) {
      return res
        .status(404)
        .json({ msg: "Note not found or user not authorized" });
    }

    res.json({ msg: "Note updated successfully", note: updatedNote.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNote = await pool.query(
      "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING * ",
      [id, req.user.id],
    );

    if (deletedNote.rows.length === 0) {
      return res
        .status(404)
        .json({ msg: "Note not found or user not authorized" });
    }

    res.json({ msg: "Note deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
