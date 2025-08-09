// controllers/candidateController.js - Tam versiyonu
const sequelize = require('../config/database');

/**
 * GET /api/candidates/:id/interviews/full
 * Adayın tüm mülakat detaylarını getir (katılımcılar, notlar, değerlendirmeler dahil)
 */
exports.getCandidateInterviewsFull = async (req, res) => {
  try {
    const candidateId = Number(req.params.id);
    if (!Number.isFinite(candidateId)) {
      return res.status(400).json({ message: 'Invalid candidate id' });
    }

    const sql = `
      WITH iv AS (
        SELECT m.*
        FROM mulakatlar m
        WHERE m.aday_id = $1
        ORDER BY COALESCE(m.mulakat_tarihi, m.created_date) DESC NULLS LAST
      )
      SELECT
        iv.id,
        iv.aday_id,
        iv.mulakat_tarihi,
        iv.planlanan_toplanti_tarihi,
        iv.mulakat_tipi,
        iv.created_date,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', mk.id,
                'katilimci_adi', mk.katilimci_adi,
                'sicil', mk.sicil
              ) ORDER BY mk.id
            )
            FROM mulakat_katilimci_iliskisi mki
            JOIN mulakat_katilimci mk ON mki.katilimci_id = mk.id
            WHERE mki.mulakat_id = iv.id
          ),
          '[]'::json
        ) AS katilimcilar,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', n.id,
                'mulakat_id', n.mulakat_id,
                'sicil', n.sicil,
                'not_metni', n.not_metni,
                'is_deleted', COALESCE(n.is_deleted, false),
                'is_active', COALESCE(n.is_active, true),
                'created_date', n.created_date
              ) ORDER BY n.created_date, n.id
            )
            FROM notlar n
            WHERE n.mulakat_id = iv.id
              AND COALESCE(n.is_deleted, false) = false
              AND COALESCE(n.is_active, true) = true
          ),
          '[]'::json
        ) AS notlar,

        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', d.id,
                'mulakat_id', d.mulakat_id,
                'degerlendirme_turu', d.degerlendirme_turu,
                'sicil', d.sicil,
                'puani', d.puani,
                'created_date', d.created_date
              ) ORDER BY d.created_date, d.id
            )
            FROM degerlendirme d
            WHERE d.mulakat_id = iv.id
          ),
          '[]'::json
        ) AS degerlendirmeler

      FROM iv;
    `;

    const [rows] = await sequelize.query(sql, {
      bind: [candidateId]
    });

    return res.json(rows);
  } catch (err) {
    console.error('getCandidateInterviewsFull error:', err);
    return res.status(500).json({ 
      message: 'Failed to load candidate interviews.', 
      error: err.message 
    });
  }
};