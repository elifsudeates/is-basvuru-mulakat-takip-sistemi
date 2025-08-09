const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Beceriler = sequelize.define('beceriler', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    aday_id: { type: DataTypes.INTEGER, allowNull: false },
    beceri_turu_id: { type: DataTypes.INTEGER, allowNull: false },
    beceri_adi: { type: DataTypes.STRING(200), allowNull: false },
    beceri_seviyesi: { type: DataTypes.STRING(50) },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'beceriler',
    timestamps: false
});

module.exports = Beceriler;