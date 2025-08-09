// routes/index.js - Düzeltilmiş version
const express = require('express');
const router = express.Router();

const kisiRoutes = require('./kisiRoutes');
const mulakatRoutes = require('./mulakatRoutes');
const mulakatKatilimciRoutes = require('./mulakatKatilimciRoutes');
const candidateRoutes = require('./candidateRoutes');

// Ana route tanımlamaları
router.use('/kisiler', kisiRoutes);
router.use('/mulakatlar', mulakatRoutes);  // Bu satır önemli!
router.use('/katilimcilar', mulakatKatilimciRoutes);
router.use('/candidates', candidateRoutes);

module.exports = router;