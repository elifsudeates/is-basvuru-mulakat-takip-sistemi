const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kisi = sequelize.define('kisi', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    adi: { type: DataTypes.STRING(200), allowNull: false },
    dogum_tarihi: { type: DataTypes.DATE },
    sehri: { type: DataTypes.STRING(100) },
    telefon_no: { type: DataTypes.STRING(20) },
    mail: { type: DataTypes.STRING(150) },
    okudugu_bolum: { type: DataTypes.STRING(200) },
    basvurdugu_pozisyon: { type: DataTypes.STRING(200) },
    description: { type: DataTypes.TEXT },
    cinsiyet: { type: DataTypes.STRING(10) },
    askerlik_durumu: { type: DataTypes.STRING(50) },
    engellilik: { type: DataTypes.BOOLEAN, defaultValue: false },
    engellilik_orani: { type: DataTypes.INTEGER },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'kisi',
    timestamps: false
});

module.exports = Kisi;