const sequelize = require('../config/database');
const BeceriTuru = require('./beceri_turu');
const Kisi = require('./kisi');
const Okullar = require('./okullar');
const Tecrubeler = require('./tecrubeler');
const Sertifikalar = require('./sertifikalar');
const Beceriler = require('./beceriler');
const MulakatKatilimci = require('./mulakat_katilimci');
const Mulakatlar = require('./mulakatlar');
const MulakatKatilimciIliskisi = require('./mulakat_katilimci_iliskisi');
const Notlar = require('./notlar');
const Degerlendirme = require('./degerlendirme');

// Kişi ve diğer tablolar arasındaki ilişkiler (One-to-Many)
Kisi.hasMany(Okullar, { foreignKey: 'aday_id', as: 'okullar' });
Okullar.belongsTo(Kisi, { foreignKey: 'aday_id' });

Kisi.hasMany(Tecrubeler, { foreignKey: 'aday_id', as: 'tecrubeler' });
Tecrubeler.belongsTo(Kisi, { foreignKey: 'aday_id' });

Kisi.hasMany(Sertifikalar, { foreignKey: 'aday_id', as: 'sertifikalar' });
Sertifikalar.belongsTo(Kisi, { foreignKey: 'aday_id' });

Kisi.hasMany(Beceriler, { foreignKey: 'aday_id', as: 'beceriler' });
Beceriler.belongsTo(Kisi, { foreignKey: 'aday_id' });

Kisi.hasMany(Mulakatlar, { foreignKey: 'aday_id', as: 'mulakatlar' });
Mulakatlar.belongsTo(Kisi, { foreignKey: 'aday_id', as: 'aday' });

// Beceri ve Beceri Türü ilişkisi
BeceriTuru.hasMany(Beceriler, { foreignKey: 'beceri_turu_id' });
Beceriler.belongsTo(BeceriTuru, { foreignKey: 'beceri_turu_id', as: 'tur' });

// Mülakatlar ve ilişkili tablolar
Mulakatlar.hasMany(Notlar, { foreignKey: 'mulakat_id', as: 'notlar' });
Notlar.belongsTo(Mulakatlar, { foreignKey: 'mulakat_id', as: 'mulakat' });

Mulakatlar.hasMany(Degerlendirme, { foreignKey: 'mulakat_id', as: 'degerlendirmeler' });
Degerlendirme.belongsTo(Mulakatlar, { foreignKey: 'mulakat_id', as: 'mulakat' });

// Mülakat ve Katılımcı arasındaki Çoka-Çok (Many-to-Many) ilişki
Mulakatlar.belongsToMany(MulakatKatilimci, {
    through: MulakatKatilimciIliskisi,
    foreignKey: 'mulakat_id',
    otherKey: 'katilimci_id',
    as: 'katilimcilar'
});

MulakatKatilimci.belongsToMany(Mulakatlar, {
    through: MulakatKatilimciIliskisi,
    foreignKey: 'katilimci_id',
    otherKey: 'mulakat_id',
    as: 'mulakatlar'
});

// YENİ: İlişki tablosu için doğrudan ilişkiler
MulakatKatilimciIliskisi.belongsTo(Mulakatlar, { foreignKey: 'mulakat_id', as: 'mulakat' });
MulakatKatilimciIliskisi.belongsTo(MulakatKatilimci, { foreignKey: 'katilimci_id', as: 'katilimci' });

Mulakatlar.hasMany(MulakatKatilimciIliskisi, { foreignKey: 'mulakat_id', as: 'katilimci_iliskileri' });
MulakatKatilimci.hasMany(MulakatKatilimciIliskisi, { foreignKey: 'katilimci_id', as: 'mulakat_iliskileri' });

const db = {
    sequelize,
    BeceriTuru,
    Kisi,
    Okullar,
    Tecrubeler,
    Sertifikalar,
    Beceriler,
    MulakatKatilimci,
    Mulakatlar,
    MulakatKatilimciIliskisi,
    Notlar,
    Degerlendirme
};

module.exports = db;