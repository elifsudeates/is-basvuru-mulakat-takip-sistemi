// controllers/mulakatController.js - Güncellenmiş ve genişletilmiş version
const sequelize = require('../config/database');
const { Mulakatlar, MulakatKatilimci, MulakatKatilimciIliskisi, Notlar, Degerlendirme, Kisi } = require('../models');

// Adaya göre mülakatları getir
exports.getMulakatByAdayId = async (req, res) => {
  const { aday_id } = req.params;

  try {
    const [result] = await sequelize.query(`
      SELECT 
        m.id AS mulakat_id,
        m.aday_id,
        m.mulakat_tarihi,
        m.planlanan_toplanti_tarihi,
        m.mulakat_tipi,
        m.created_date,

        -- Katılımcılar listesi
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', mk.id,
              'katilimci_adi', mk.katilimci_adi,
              'sicil', mk.sicil
            )
          ) FILTER (WHERE mk.id IS NOT NULL), '[]'
        ) AS katilimcilar,

        -- Notlar listesi
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', n.id,
              'sicil', n.sicil,
              'created_date', n.created_date,
              'is_deleted', n.is_deleted,
              'is_active', n.is_active,
              'not_metni', n.not_metni
            )
          ) FILTER (WHERE n.id IS NOT NULL), '[]'
        ) AS notlar_listesi,

        -- Değerlendirmeler listesi
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', d.id,
              'degerlendirme_turu', d.degerlendirme_turu,
              'sicil', d.sicil,
              'puani', d.puani,
              'created_date', d.created_date
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS degerlendirmeler

      FROM mulakatlar m
      LEFT JOIN mulakat_katilimci_iliskisi mki 
        ON m.id = mki.mulakat_id
      LEFT JOIN mulakat_katilimci mk 
        ON mki.katilimci_id = mk.id
      LEFT JOIN notlar n 
        ON m.id = n.mulakat_id
      LEFT JOIN degerlendirme d 
        ON m.id = d.mulakat_id
      WHERE m.aday_id = $1
      GROUP BY m.id
      ORDER BY m.mulakat_tarihi DESC;
    `, {
      bind: [aday_id]
    });

    res.json(result);
  } catch (err) {
    console.error('getMulakatByAdayId error:', err);
    res.status(500).json({ error: 'Mülakat verileri alınırken hata oluştu' });
  }
};

// Tüm mülakatları getir
exports.getAllMulakatlar = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        m.id AS mulakat_id,
        m.aday_id,
        m.mulakat_tarihi,
        m.planlanan_toplanti_tarihi,
        m.mulakat_tipi,
        m.created_date,
        k.adi as aday_adi
      FROM mulakatlar m
      LEFT JOIN kisi k ON m.aday_id = k.id
      ORDER BY m.mulakat_tarihi DESC
    `);

    res.json(result);
  } catch (err) {
    console.error('getAllMulakatlar error:', err);
    res.status(500).json({ error: 'Mülakatlar getirilirken hata oluştu' });
  }
};

// YENİ: Mülakat oluştur
exports.createMulakat = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      aday_id,
      mulakat_tarihi,
      planlanan_toplanti_tarihi,
      mulakat_tipi,
      katilimcilar = [],
      notlar = [],
      degerlendirmeler = []
    } = req.body;

    // 1. Mülakat kaydını oluştur
    const yeniMulakat = await Mulakatlar.create({
      aday_id,
      mulakat_tarihi: mulakat_tarihi || null,
      planlanan_toplanti_tarihi: planlanan_toplanti_tarihi || null,
      mulakat_tipi: mulakat_tipi || null
    }, { transaction });

    const mulakatId = yeniMulakat.id;

    // 2. Katılımcıları bağla
    if (katilimcilar && katilimcilar.length > 0) {
      const katilimciData = katilimcilar.map(katilimciId => ({
        mulakat_id: mulakatId,
        katilimci_id: parseInt(katilimciId)
      }));
      
      await MulakatKatilimciIliskisi.bulkCreate(katilimciData, { transaction });
    }

    // 3. Notları ekle
    if (notlar && notlar.length > 0) {
      const notlarData = notlar.map(not => ({
        mulakat_id: mulakatId,
        sicil: not.sicil,
        not_metni: not.not_metni,
        is_deleted: false,
        is_active: true
      }));
      
      await Notlar.bulkCreate(notlarData, { transaction });
    }

    // 4. Değerlendirmeleri ekle
    if (degerlendirmeler && degerlendirmeler.length > 0) {
      const degerlendirmelerData = degerlendirmeler.map(deg => ({
        mulakat_id: mulakatId,
        degerlendirme_turu: deg.degerlendirme_turu || 'genel',
        sicil: deg.sicil,
        puani: parseInt(deg.puani) || 0
      }));
      
      await Degerlendirme.bulkCreate(degerlendirmelerData, { transaction });
    }

    await transaction.commit();

    // Oluşturulan mülakatı tam veriyle döndür
    const tamMulakat = await exports.getMulakatById(mulakatId);

    res.status(201).json({
      success: true,
      message: 'Mülakat başarıyla oluşturuldu',
      data: tamMulakat
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Mülakat oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mülakat oluşturulurken bir hata oluştu.',
      error: error.message
    });
  }
};

// YENİ: Mülakat güncelle
exports.updateMulakat = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const mulakatId = req.params.id;
    const {
      mulakat_tarihi,
      planlanan_toplanti_tarihi,
      mulakat_tipi,
      katilimcilar = [],
      notlar = [],
      degerlendirmeler = []
    } = req.body;

    // 1. Mülakat temel bilgilerini güncelle
    const [guncellenenSatir] = await Mulakatlar.update({
      mulakat_tarihi: mulakat_tarihi || null,
      planlanan_toplanti_tarihi: planlanan_toplanti_tarihi || null,
      mulakat_tipi: mulakat_tipi || null
    }, {
      where: { id: mulakatId },
      transaction
    });

    if (guncellenenSatir === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Güncellenecek mülakat bulunamadı.' });
    }

    // 2. Mevcut ilişkili verileri sil
    await Promise.all([
      MulakatKatilimciIliskisi.destroy({ where: { mulakat_id: mulakatId }, transaction }),
      Notlar.destroy({ where: { mulakat_id: mulakatId }, transaction }),
      Degerlendirme.destroy({ where: { mulakat_id: mulakatId }, transaction })
    ]);

    // 3. Yeni verileri ekle
    if (katilimcilar && katilimcilar.length > 0) {
      const katilimciData = katilimcilar.map(katilimciId => ({
        mulakat_id: mulakatId,
        katilimci_id: parseInt(katilimciId)
      }));
      
      await MulakatKatilimciIliskisi.bulkCreate(katilimciData, { transaction });
    }

    if (notlar && notlar.length > 0) {
      const notlarData = notlar.map(not => ({
        mulakat_id: mulakatId,
        sicil: not.sicil,
        not_metni: not.not_metni,
        is_deleted: false,
        is_active: true
      }));
      
      await Notlar.bulkCreate(notlarData, { transaction });
    }

    if (degerlendirmeler && degerlendirmeler.length > 0) {
      const degerlendirmelerData = degerlendirmeler.map(deg => ({
        mulakat_id: mulakatId,
        degerlendirme_turu: deg.degerlendirme_turu || 'genel',
        sicil: deg.sicil,
        puani: parseInt(deg.puani) || 0
      }));
      
      await Degerlendirme.bulkCreate(degerlendirmelerData, { transaction });
    }

    await transaction.commit();

    // Güncellenmiş mülakatı tam veriyle döndür
    const guncellenenMulakat = await exports.getMulakatById(mulakatId);

    res.status(200).json({
      success: true,
      message: 'Mülakat başarıyla güncellendi',
      data: guncellenenMulakat
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Mülakat güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Mülakat güncellenirken bir hata oluştu.',
      error: error.message
    });
  }
};

// YENİ: Mülakat sil
exports.deleteMulakat = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const mulakatId = req.params.id;

    // İlişkili verileri önce sil
    await Promise.all([
      MulakatKatilimciIliskisi.destroy({ where: { mulakat_id: mulakatId }, transaction }),
      Notlar.destroy({ where: { mulakat_id: mulakatId }, transaction }),
      Degerlendirme.destroy({ where: { mulakat_id: mulakatId }, transaction })
    ]);

    // Ana mülakat kaydını sil
    const silinenSatir = await Mulakatlar.destroy({
      where: { id: mulakatId },
      transaction
    });

    if (silinenSatir === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Silinecek mülakat bulunamadı.' });
    }

    await transaction.commit();
    
    res.status(204).send(); // No Content

  } catch (error) {
    await transaction.rollback();
    console.error('Mülakat silme hatası:', error);
    res.status(500).json({
      message: 'Mülakat silinirken bir hata oluştu.',
      error: error.message
    });
  }
};

// YENİ: ID'ye göre mülakat getir (helper function)
exports.getMulakatById = async (mulakatId) => {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        m.id AS mulakat_id,
        m.aday_id,
        m.mulakat_tarihi,
        m.planlanan_toplanti_tarihi,
        m.mulakat_tipi,
        m.created_date,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', mk.id,
              'katilimci_adi', mk.katilimci_adi,
              'sicil', mk.sicil
            )
          ) FILTER (WHERE mk.id IS NOT NULL), '[]'
        ) AS katilimcilar,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', n.id,
              'sicil', n.sicil,
              'created_date', n.created_date,
              'is_deleted', n.is_deleted,
              'is_active', n.is_active,
              'not_metni', n.not_metni
            )
          ) FILTER (WHERE n.id IS NOT NULL), '[]'
        ) AS notlar_listesi,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', d.id,
              'degerlendirme_turu', d.degerlendirme_turu,
              'sicil', d.sicil,
              'puani', d.puani,
              'created_date', d.created_date
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS degerlendirmeler

      FROM mulakatlar m
      LEFT JOIN mulakat_katilimci_iliskisi mki 
        ON m.id = mki.mulakat_id
      LEFT JOIN mulakat_katilimci mk 
        ON mki.katilimci_id = mk.id
      LEFT JOIN notlar n 
        ON m.id = n.mulakat_id
      LEFT JOIN degerlendirme d 
        ON m.id = d.mulakat_id
      WHERE m.id = $1
      GROUP BY m.id;
    `, {
      bind: [mulakatId]
    });

    return result[0] || null;
  } catch (error) {
    console.error('getMulakatById error:', error);
    return null;
  }
};