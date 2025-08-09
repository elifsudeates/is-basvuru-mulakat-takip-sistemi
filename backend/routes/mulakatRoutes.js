// routes/mulakatRoutes.js - Düzeltilmiş ve genişletilmiş version
const express = require('express');
const router = express.Router();
const mulakatController = require('../controllers/mulakatController');

// Tüm mülakatları getir
router.get('/', mulakatController.getAllMulakatlar);

// YENİ: Mülakat oluştur
router.post('/', mulakatController.createMulakat);

// Adaya göre mülakatları getir
router.get('/aday/:aday_id', mulakatController.getMulakatByAdayId);

// YENİ: Tek mülakat getir (ID ile)
router.get('/:id', async (req, res) => {
  try {
    const mulakat = await mulakatController.getMulakatById(req.params.id);
    if (!mulakat) {
      return res.status(404).json({ message: 'Mülakat bulunamadı.' });
    }
    res.json(mulakat);
  } catch (error) {
    res.status(500).json({ 
      message: 'Mülakat getirilirken hata oluştu.', 
      error: error.message 
    });
  }
});

// YENİ: Mülakat güncelle
router.put('/:id', mulakatController.updateMulakat);

// YENİ: Mülakat sil
router.delete('/:id', mulakatController.deleteMulakat);

module.exports = router;