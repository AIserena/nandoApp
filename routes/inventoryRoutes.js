const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, inventoryController.getInventory);

module.exports = router;