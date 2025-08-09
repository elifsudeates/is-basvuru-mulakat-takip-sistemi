const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mulakatlar = sequelize.define('mulakatlar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    aday_id: { type: DataTypes.INTEGER, allowNull: false },
    mulakat_tarihi: { type: DataTypes.DATE },
    planlanan_toplanti_tarihi: { type: DataTypes.DATE },
    mulakat_tipi: { type: DataTypes.STRING(50) },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'mulakatlar',
    timestamps: false
});

module.exports = Mulakatlar;