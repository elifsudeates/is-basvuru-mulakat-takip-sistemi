const express = require('express');
const router = express.Router();
const mulakatKatilimciController = require('../controllers/mulakatKatilimciController');

router.route('/')
    .get(mulakatKatilimciController.getAllKatilimcilar)
    .post(mulakatKatilimciController.createKatilimci);

module.exports = router;