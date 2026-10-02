const express = require('express');
const router = express.Router();
const penjualanController = require('../controllers/penjualanController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, penjualanController.getAllPenjualan);
router.get('/:noPenjualan', verifyToken, penjualanController.getPenjualanById);
router.post('/', verifyToken, penjualanController.createPenjualan);

module.exports = router;