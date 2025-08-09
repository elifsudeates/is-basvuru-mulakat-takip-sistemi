const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tecrubeler = sequelize.define('tecrubeler', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    aday_id: { type: DataTypes.INTEGER, allowNull: false },
    sirket_adi: { type: DataTypes.STRING(200), allowNull: false },
    giris_tarihi: { type: DataTypes.DATE },
    cikis_tarihi: { type: DataTypes.DATE },
    pozisyonu: { type: DataTypes.STRING(200) },
    sirket_referansi: { type: DataTypes.STRING(500) },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'tecrubeler',
    timestamps: false
});

module.exports = Tecrubeler;