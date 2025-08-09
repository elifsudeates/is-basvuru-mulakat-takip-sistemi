// routes/candidateRoutes.js - Kontrol et bu route var mı?
const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');

// Bu route tanımlı mı kontrol et:
router.get('/:id/interviews/full', candidateController.getCandidateInterviewsFull);

module.exports = router;