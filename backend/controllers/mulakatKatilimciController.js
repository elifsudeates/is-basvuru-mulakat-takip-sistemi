const { MulakatKatilimci } = require('../models');

exports.getAllKatilimcilar = async (req, res) => {
    try {
        const katilimcilar = await MulakatKatilimci.findAll();
        res.status(200).json(katilimcilar);
    } catch (error) {
        res.status(500).json({ message: "Katılımcılar getirilirken bir hata oluştu.", error: error.message });
    }
};

exports.createKatilimci = async (req, res) => {
    try {
        const yeniKatilimci = await MulakatKatilimci.create(req.body);
        res.status(201).json(yeniKatilimci);
    } catch (error) {
        res.status(500).json({ message: "Katılımcı oluşturulurken bir hata oluştu.", error: error.message });
    }
};