const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/materialsController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/status', ctrl.setStatus);

module.exports = router;
