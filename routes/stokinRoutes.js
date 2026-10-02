const express = require('express');
const router = express.Router();
const stokinController = require('../controllers/stokinController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, stokinController.getAllStokIn);
router.get('/:noStokIn', verifyToken, stokinController.getStokInById);
router.post('/', verifyToken, stokinController.createStokIn);

module.exports = router;