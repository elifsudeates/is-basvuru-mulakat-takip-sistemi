const express = require('express');
const router = express.Router();
const kisiController = require('../controllers/kisiController');

router.route('/getAllUser')
    .post(kisiController.getAllKisiler)
router.route('/postUser')
    .post(kisiController.createKisi);

router.route('/:id')
    .get(kisiController.getKisiById)
    .put(kisiController.updateKisi)
    .delete(kisiController.deleteKisi);

module.exports = router;