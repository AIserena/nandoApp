const express = require('express');
const createMasterDataController = require('../controllers/masterDataController');
const { verifyToken } = require('../middlewares/authMiddleware');

function requireAdmin(req, res, next) {
    if (String(req.user?.role || '').toLowerCase() !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin yang dapat mengelola master data.' });
    }
    next();
}

function createMasterDataRouter(entity) {
    const controller = createMasterDataController(entity);
    const router = express.Router();

    router.use(verifyToken);
    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', requireAdmin, controller.create);
    router.put('/:id', requireAdmin, controller.update);
    router.delete('/:id', requireAdmin, controller.delete);

    return router;
}

module.exports = createMasterDataRouter;
