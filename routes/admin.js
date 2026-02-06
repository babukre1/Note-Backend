const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const adminAuth = require('../middleware/adminAuth');

// @route   POST api/admin/users
// @desc    Create a new user (Admin only)
// @access  Private (Admin)
router.post('/users', adminAuth, async (req, res) => {
    const { username, fullname, password, role } = req.body;

    try {
        let user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = await pool.query(
            'INSERT INTO users (username, fullname, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, fullname, role',
            [username, fullname, hashedPassword, role || 'user'] // Default to 'user' if not provided
        );
        res.status(201).json({ msg: 'User created successfully', user: user.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/admin/users/:id/password
// @desc    Update a user's password (Admin only)
// @access  Private (Admin)
router.put('/users/:id/password', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    try {
        let user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);

        res.json({ msg: 'User password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user (Admin only)
// @access  Private (Admin)
router.delete('/users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

        if (deletedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/admin/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await pool.query('SELECT id, username, fullname, role, created_at FROM users ORDER BY created_at DESC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
