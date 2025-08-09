const { Kisi, Okullar, Tecrubeler, Sertifikalar, Beceriler, Mulakatlar, MulakatKatilimciIliskisi, Notlar, Degerlendirme } = require('../models');
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');

// Tüm adayları getir (Filtreleme ile)
exports.getAllKisiler = async (req, res) => {
    try {
        const {
            text,
            cities,
            positions,
            gender,
            departments,
            hasInterview,
            noInterview,
            disabledOnly,
            minScore,
            maxScore
        } = req.body;
        
        const limit = parseInt(req.body.limit ?? '10', 10);
        const offset = parseInt(req.body.offset ?? '0', 10);

        const whereClause = {};
        const includeClause = [];

        // Metin araması
        if (text && text.trim()) {
            whereClause[Op.or] = [
                { adi: { [Op.iLike]: `%${text.trim()}%` } },
                { basvurdugu_pozisyon: { [Op.iLike]: `%${text.trim()}%` } },
                { sehri: { [Op.iLike]: `%${text.trim()}%` } },
                { mail: { [Op.iLike]: `%${text.trim()}%` } }
            ];
        }

        // Şehir filtresi
        if (cities && cities.trim()) {
            const cityArray = cities.split(',').map(c => c.trim()).filter(c => c);
            if (cityArray.length > 0) {
                whereClause.sehri = { [Op.in]: cityArray };
            }
        }

        // Pozisyon filtresi
        if (positions && positions.trim()) {
            const positionArray = positions.split(',').map(p => p.trim()).filter(p => p);
            if (positionArray.length > 0) {
                whereClause.basvurdugu_pozisyon = { [Op.in]: positionArray };
            }
        }

        // Cinsiyet filtresi
        if (gender && gender.trim()) {
            whereClause.cinsiyet = gender.trim();
        }

        // Engellilik filtresi
        if (disabledOnly === 'true' || disabledOnly === true) {
            whereClause.engellilik = true;
        }

        // Bölüm filtresi
        if (departments && departments.trim()) {
            const deptArray = departments.split(',').map(d => d.trim()).filter(d => d);
            if (deptArray.length > 0) {
                includeClause.push({
                    model: Okullar,
                    as: 'okullar',
                    where: { okul_bolumu: { [Op.in]: deptArray } },
                    required: true
                });
            }
        }

        // Mülakat filtresi
        if (hasInterview === 'true' || hasInterview === true) {
            includeClause.push({
                model: Mulakatlar,
                as: 'mulakatlar',
                required: true
            });
        } else if (noInterview === 'true' || noInterview === true) {
            const interviewedCandidateIds = await sequelize.query(`
                SELECT DISTINCT aday_id FROM mulakatlar
            `, { type: sequelize.QueryTypes.SELECT });
            
            const interviewedIds = interviewedCandidateIds.map(row => row.aday_id);
            
            if (interviewedIds.length > 0) {
                whereClause.id = { [Op.notIn]: interviewedIds };
            }
        }

        // Puan filtresi
        let scoreFilteredIds = null;
        if ((minScore && minScore !== '') || (maxScore && maxScore !== '')) {
            const min = minScore || 0;
            const max = maxScore || 100;
            
            const scoreQuery = `
                SELECT DISTINCT m.aday_id 
                FROM mulakatlar m 
                INNER JOIN degerlendirme d ON m.id = d.mulakat_id 
                WHERE d.puani BETWEEN $1 AND $2
            `;
            
            const [scoreResults] = await sequelize.query(scoreQuery, {
                bind: [min, max]
            });
            
            scoreFilteredIds = scoreResults.map(r => r.aday_id);
            
            if (scoreFilteredIds.length > 0) {
                whereClause.id = whereClause.id 
                    ? { [Op.and]: [whereClause.id, { [Op.in]: scoreFilteredIds }] }
                    : { [Op.in]: scoreFilteredIds };
            } else {
                return res.status(200).json({
                    kisiler: [],
                    totalCount: [{ length: 0 }]
                });
            }
        }

        // Ana sorgu
        const { count, rows } = await Kisi.findAndCountAll({
            where: whereClause,
            include: includeClause.length > 0 ? includeClause : [
                { model: Okullar, as: 'okullar', required: false },
                { model: Tecrubeler, as: 'tecrubeler', required: false },
                { model: Sertifikalar, as: 'sertifikalar', required: false },
                { model: Beceriler, as: 'beceriler', required: false },
                { model: Mulakatlar, as: 'mulakatlar', required: false }
            ],
            limit: limit,
            offset: offset,
            order: [['created_date', 'DESC']],
            distinct: true
        });

        // Toplam kayıt sayısı
        const totalCount = await Kisi.findAll({
            attributes: ['id', 'adi', 'sehri', 'basvurdugu_pozisyon', 'okudugu_bolum'],
            include: [
                { model: Okullar, as: 'okullar', attributes: ['okul_bolumu'], required: false }
            ]
        });

        res.status(200).json({
            kisiler: rows,
            totalCount: [totalCount]
        });

    } catch (error) {
        console.error('getAllKisiler error:', error);
        res.status(500).json({
            message: "Adaylar getirilirken bir hata oluştu.",
            error: error.message
        });
    }
};
// ID'ye göre aday getir
exports.getKisiById = async (req, res) => {
    try {
        const kisi = await Kisi.findByPk(req.params.id, {
            include: [
                { model: Okullar, as: 'okullar' },
                { model: Tecrubeler, as: 'tecrubeler' },
                { model: Sertifikalar, as: 'sertifikalar' },
                { model: Beceriler, as: 'beceriler', include: [{ association: 'tur' }] },
                { model: Mulakatlar, as: 'mulakatlar' }
            ]
        });
        if (!kisi) {
            return res.status(404).json({ message: "Aday bulunamadı." });
        }
        res.status(200).json(kisi);
    } catch (error) {
        res.status(500).json({ message: "Aday getirilirken bir hata oluştu.", error: error.message });
    }
};

// YENİ: Gelişmiş aday oluşturma metodu (mülakatlarla birlikte)
exports.createKisi = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const {
            // Ana aday bilgileri
            adi, mail, telefon_no, dogum_tarihi, cinsiyet, 
            basvurdugu_pozisyon, sehri, okudugu_bolum, askerlik_durumu,
            engellilik, engellilik_orani, description,
            
            // İlişkili veriler
            okullar = [],
            tecrubeler = [],
            beceriler = [],
            sertifikalar = [],
            mulakatlar = [] // YENİ: Mülakatlar
        } = req.body;

        console.log('Creating candidate with data:', {
            adi,
            educationCount: okullar.length,
            experienceCount: tecrubeler.length,
            skillsCount: beceriler.length,
            certificatesCount: sertifikalar.length,
            interviewsCount: mulakatlar.length // YENİ
        });

        // 1. Ana aday kaydını oluştur
        const yeniKisi = await Kisi.create({
            adi,
            mail,
            telefon_no,
            dogum_tarihi,
            cinsiyet,
            basvurdugu_pozisyon,
            sehri,
            okudugu_bolum,
            askerlik_durumu,
            engellilik: !!engellilik,
            engellilik_orani: engellilik ? engellilik_orani : null,
            description
        }, { transaction });

        const adayId = yeniKisi.id;

        // 2. Eğitim bilgilerini ekle
        if (okullar && okullar.length > 0) {
            const okullarData = okullar.map(okul => ({
                aday_id: adayId,
                okul_adi: okul.okul_adi,
                okul_bolumu: okul.okul_bolumu,
                okul_ili: okul.okul_ili,
                okul_tipi: okul.okul_tipi ? parseInt(okul.okul_tipi) : null,
                not_ortalamasi: okul.not_ortalamasi ? parseFloat(okul.not_ortalamasi) : null
            }));
            
            await Okullar.bulkCreate(okullarData, { transaction });
            console.log(`${okullarData.length} eğitim kaydı eklendi`);
        }

        // 3. İş deneyimlerini ekle
        if (tecrubeler && tecrubeler.length > 0) {
            const tecrubelerData = tecrubeler.map(tecrube => ({
                aday_id: adayId,
                sirket_adi: tecrube.sirket_adi,
                pozisyonu: tecrube.pozisyonu,
                giris_tarihi: tecrube.giris_tarihi || null,
                cikis_tarihi: tecrube.cikis_tarihi || null,
                sirket_referansi: tecrube.sirket_referansi
            }));
            
            await Tecrubeler.bulkCreate(tecrubelerData, { transaction });
            console.log(`${tecrubelerData.length} deneyim kaydı eklendi`);
        }

        // 4. Becerileri ekle
        if (beceriler && beceriler.length > 0) {
            const becerilerData = beceriler.map(beceri => ({
                aday_id: adayId,
                beceri_turu_id: beceri.beceri_turu_id ? parseInt(beceri.beceri_turu_id) : 1,
                beceri_adi: beceri.beceri_adi,
                beceri_seviyesi: beceri.beceri_seviyesi
            }));
            
            await Beceriler.bulkCreate(becerilerData, { transaction });
            console.log(`${becerilerData.length} beceri kaydı eklendi`);
        }

        // 5. Sertifikaları ekle
        if (sertifikalar && sertifikalar.length > 0) {
            const sertifikalarData = sertifikalar.map(sertifika => ({
                aday_id: adayId,
                sertifika_adi: sertifika.sertifika_adi,
                alinma_tarihi: sertifika.alinma_tarihi || null,
                gecerliligi: sertifika.gecerliligi || null
            }));
            
            await Sertifikalar.bulkCreate(sertifikalarData, { transaction });
            console.log(`${sertifikalarData.length} sertifika kaydı eklendi`);
        }

        // 6. YENİ: Mülakatları ekle
        if (mulakatlar && mulakatlar.length > 0) {
            for (const mulakat of mulakatlar) {
                // Mülakat kaydını oluştur
                const yeniMulakat = await Mulakatlar.create({
                    aday_id: adayId,
                    mulakat_tarihi: mulakat.mulakat_tarihi || null,
                    planlanan_toplanti_tarihi: mulakat.planlanan_toplanti_tarihi || null,
                    mulakat_tipi: mulakat.mulakat_tipi || null
                }, { transaction });

                const mulakatId = yeniMulakat.id;

                // Katılımcıları bağla
                if (mulakat.katilimcilar && mulakat.katilimcilar.length > 0) {
                    const katilimciData = mulakat.katilimcilar.map(katilimciId => ({
                        mulakat_id: mulakatId,
                        katilimci_id: parseInt(katilimciId)
                    }));
                    
                    await MulakatKatilimciIliskisi.bulkCreate(katilimciData, { transaction });
                }

                // Notları ekle
                if (mulakat.notlar && mulakat.notlar.length > 0) {
                    const notlarData = mulakat.notlar.map(not => ({
                        mulakat_id: mulakatId,
                        sicil: not.sicil,
                        not_metni: not.not_metni,
                        is_deleted: false,
                        is_active: true
                    }));
                    
                    await Notlar.bulkCreate(notlarData, { transaction });
                }

                // Değerlendirmeleri ekle
                if (mulakat.degerlendirmeler && mulakat.degerlendirmeler.length > 0) {
                    const degerlendirmelerData = mulakat.degerlendirmeler.map(deg => ({
                        mulakat_id: mulakatId,
                        degerlendirme_turu: deg.degerlendirme_turu || 'genel',
                        sicil: deg.sicil,
                        puani: parseInt(deg.puani) || 0
                    }));
                    
                    await Degerlendirme.bulkCreate(degerlendirmelerData, { transaction });
                }
            }
            
            console.log(`${mulakatlar.length} mülakat kaydı eklendi`);
        }

        // Transaction'ı commit et
        await transaction.commit();

        // Tam veriyi geri döndür
        const tamVeri = await Kisi.findByPk(adayId, {
            include: [
                { model: Okullar, as: 'okullar' },
                { model: Tecrubeler, as: 'tecrubeler' },
                { model: Sertifikalar, as: 'sertifikalar' },
                { model: Beceriler, as: 'beceriler', include: [{ association: 'tur' }] },
                { model: Mulakatlar, as: 'mulakatlar' }
            ]
        });

        console.log(`Aday başarıyla oluşturuldu: ${adi} (ID: ${adayId})`);
        
        res.status(201).json({
            success: true,
            message: 'Aday tüm detaylarıyla başarıyla oluşturuldu',
            data: tamVeri,
            summary: {
                educationCount: okullar.length,
                experienceCount: tecrubeler.length,
                skillsCount: beceriler.length,
                certificatesCount: sertifikalar.length,
                interviewsCount: mulakatlar.length // YENİ
            }
        });

    } catch (error) {
        // Hata durumunda rollback
        await transaction.rollback();
        
        console.error('Aday oluşturma hatası:', error);
        
        res.status(500).json({
            success: false,
            message: "Aday oluşturulurken bir hata oluştu.",
            error: error.message,
            details: error.stack
        });
    }
};
// YENİ: Gelişmiş aday güncelleme metodu (mülakatlarla birlikte)
exports.updateKisi = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const adayId = req.params.id;
        const {
            // Ana aday bilgileri
            adi, mail, telefon_no, dogum_tarihi, cinsiyet, 
            basvurdugu_pozisyon, sehri, okudugu_bolum, askerlik_durumu,
            engellilik, engellilik_orani, description,
            
            // İlişkili veriler
            okullar = [],
            tecrubeler = [],
            beceriler = [],
            sertifikalar = [],
            mulakatlar = [] // YENİ: Mülakatlar
        } = req.body;

        console.log('Updating candidate:', adayId);

        // 1. Ana aday bilgilerini güncelle
        const [guncellenenSatirSayisi] = await Kisi.update({
            adi, mail, telefon_no, dogum_tarihi, cinsiyet, 
            basvurdugu_pozisyon, sehri, okudugu_bolum, askerlik_durumu,
            engellilik: !!engellilik,
            engellilik_orani: engellilik ? engellilik_orani : null,
            description
        }, {
            where: { id: adayId },
            transaction
        });

        if (guncellenenSatirSayisi === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "Güncellenecek aday bulunamadı." });
        }

        // 2. Mevcut ilişkili verileri sil
        await Promise.all([
            Okullar.destroy({ where: { aday_id: adayId }, transaction }),
            Tecrubeler.destroy({ where: { aday_id: adayId }, transaction }),
            Beceriler.destroy({ where: { aday_id: adayId }, transaction }),
            Sertifikalar.destroy({ where: { aday_id: adayId }, transaction })
        ]);

        // YENİ: Mevcut mülakatları ve ilişkili verileri sil
        const mevcutMulakatlar = await Mulakatlar.findAll({
            where: { aday_id: adayId },
            attributes: ['id'],
            transaction
        });

        const mulakatIds = mevcutMulakatlar.map(m => m.id);

        if (mulakatIds.length > 0) {
            await Promise.all([
                Degerlendirme.destroy({ where: { mulakat_id: { [Op.in]: mulakatIds } }, transaction }),
                Notlar.destroy({ where: { mulakat_id: { [Op.in]: mulakatIds } }, transaction }),
                MulakatKatilimciIliskisi.destroy({ where: { mulakat_id: { [Op.in]: mulakatIds } }, transaction }),
                Mulakatlar.destroy({ where: { aday_id: adayId }, transaction })
            ]);
        }

        // 3. Yeni verileri ekle
        if (okullar && okullar.length > 0) {
            const okullarData = okullar.map(okul => ({
                aday_id: adayId,
                okul_adi: okul.okul_adi,
                okul_bolumu: okul.okul_bolumu,
                okul_ili: okul.okul_ili,
                okul_tipi: okul.okul_tipi ? parseInt(okul.okul_tipi) : null,
                not_ortalamasi: okul.not_ortalamasi ? parseFloat(okul.not_ortalamasi) : null
            }));
            await Okullar.bulkCreate(okullarData, { transaction });
        }

        if (tecrubeler && tecrubeler.length > 0) {
            const tecrubelerData = tecrubeler.map(tecrube => ({
                aday_id: adayId,
                sirket_adi: tecrube.sirket_adi,
                pozisyonu: tecrube.pozisyonu,
                giris_tarihi: tecrube.giris_tarihi || null,
                cikis_tarihi: tecrube.cikis_tarihi || null,
                sirket_referansi: tecrube.sirket_referansi
            }));
            await Tecrubeler.bulkCreate(tecrubelerData, { transaction });
        }

        if (beceriler && beceriler.length > 0) {
            const becerilerData = beceriler.map(beceri => ({
                aday_id: adayId,
                beceri_turu_id: beceri.beceri_turu_id ? parseInt(beceri.beceri_turu_id) : 1,
                beceri_adi: beceri.beceri_adi,
                beceri_seviyesi: beceri.beceri_seviyesi
            }));
            await Beceriler.bulkCreate(becerilerData, { transaction });
        }

        if (sertifikalar && sertifikalar.length > 0) {
            const sertifikalarData = sertifikalar.map(sertifika => ({
                aday_id: adayId,
                sertifika_adi: sertifika.sertifika_adi,
                alinma_tarihi: sertifika.alinma_tarihi || null,
                gecerliligi: sertifika.gecerliligi || null
            }));
            await Sertifikalar.bulkCreate(sertifikalarData, { transaction });
        }

        // YENİ: Mülakatları ekle
        if (mulakatlar && mulakatlar.length > 0) {
            for (const mulakat of mulakatlar) {
                // Mülakat kaydını oluştur
                const yeniMulakat = await Mulakatlar.create({
                    aday_id: adayId,
                    mulakat_tarihi: mulakat.mulakat_tarihi || null,
                    planlanan_toplanti_tarihi: mulakat.planlanan_toplanti_tarihi || null,
                    mulakat_tipi: mulakat.mulakat_tipi || null
                }, { transaction });

                const mulakatId = yeniMulakat.id;

                // Katılımcıları bağla
                if (mulakat.katilimcilar && mulakat.katilimcilar.length > 0) {
                    const katilimciData = mulakat.katilimcilar.map(katilimciId => ({
                        mulakat_id: mulakatId,
                        katilimci_id: parseInt(katilimciId)
                    }));
                    
                    await MulakatKatilimciIliskisi.bulkCreate(katilimciData, { transaction });
                }

                // Notları ekle
                if (mulakat.notlar && mulakat.notlar.length > 0) {
                    const notlarData = mulakat.notlar.map(not => ({
                        mulakat_id: mulakatId,
                        sicil: not.sicil,
                        not_metni: not.not_metni,
                        is_deleted: false,
                        is_active: true
                    }));
                    
                    await Notlar.bulkCreate(notlarData, { transaction });
                }

                // Değerlendirmeleri ekle
                if (mulakat.degerlendirmeler && mulakat.degerlendirmeler.length > 0) {
                    const degerlendirmelerData = mulakat.degerlendirmeler.map(deg => ({
                        mulakat_id: mulakatId,
                        degerlendirme_turu: deg.degerlendirme_turu || 'genel',
                        sicil: deg.sicil,
                        puani: parseInt(deg.puani) || 0
                    }));
                    
                    await Degerlendirme.bulkCreate(degerlendirmelerData, { transaction });
                }
            }
            
            console.log(`${mulakatlar.length} mülakat kaydı güncellendi`);
        }

        await transaction.commit();

        // Güncellenmiş tam veriyi getir
        const guncellenenKisi = await Kisi.findByPk(adayId, {
            include: [
                { model: Okullar, as: 'okullar' },
                { model: Tecrubeler, as: 'tecrubeler' },
                { model: Sertifikalar, as: 'sertifikalar' },
                { model: Beceriler, as: 'beceriler', include: [{ association: 'tur' }] },
                { model: Mulakatlar, as: 'mulakatlar' }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Aday başarıyla güncellendi',
            data: guncellenenKisi
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Aday güncelleme hatası:', error);
        res.status(500).json({ 
            success: false,
            message: "Aday güncellenirken bir hata oluştu.", 
            error: error.message 
        });
    }
};

// Aday silme
exports.deleteKisi = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const adayId = req.params.id;

        // İlişkili verileri önce sil (Foreign Key constraint için)
        await Promise.all([
            Okullar.destroy({ where: { aday_id: adayId }, transaction }),
            Tecrubeler.destroy({ where: { aday_id: adayId }, transaction }),
            Beceriler.destroy({ where: { aday_id: adayId }, transaction }),
            Sertifikalar.destroy({ where: { aday_id: adayId }, transaction }),
            // Mülakatlar ve ilgili verileri de silinecek (CASCADE ile)
            sequelize.query(`DELETE FROM degerlendirme WHERE mulakat_id IN (SELECT id FROM mulakatlar WHERE aday_id = $1)`, {
                bind: [adayId],
                transaction
            }),
            sequelize.query(`DELETE FROM notlar WHERE mulakat_id IN (SELECT id FROM mulakatlar WHERE aday_id = $1)`, {
                bind: [adayId],
                transaction
            }),
            sequelize.query(`DELETE FROM mulakat_katilimci_iliskisi WHERE mulakat_id IN (SELECT id FROM mulakatlar WHERE aday_id = $1)`, {
                bind: [adayId],
                transaction
            }),
            Mulakatlar.destroy({ where: { aday_id: adayId }, transaction })
        ]);

        // Ana aday kaydını sil
        const silinenSatirSayisi = await Kisi.destroy({
            where: { id: adayId },
            transaction
        });

        if (silinenSatirSayisi === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "Silinecek aday bulunamadı." });
        }

        await transaction.commit();
        
        console.log(`Aday ve tüm ilişkili verileri silindi: ID ${adayId}`);
        res.status(204).send(); // No Content

    } catch (error) {
        await transaction.rollback();
        console.error('Aday silme hatası:', error);
        res.status(500).json({ 
            message: "Aday silinirken bir hata oluştu.", 
            error: error.message 
        });
    }
};