const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// authController.login harus terdefinisi sebagai fungsi
router.post('/login', authController.login);

module.exports = router;