const express = require('express');
const router = express.Router();
const barangController = require('../controllers/barangController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, barangController.getAllBarang);

module.exports = router;