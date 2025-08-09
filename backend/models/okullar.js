const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Okullar = sequelize.define('okullar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    aday_id: { type: DataTypes.INTEGER, allowNull: false },
    okul_ili: { type: DataTypes.STRING(100) },
    okul_adi: { type: DataTypes.STRING(200), allowNull: false },
    okul_bolumu: { type: DataTypes.STRING(200) },
    okul_tipi: { type: DataTypes.INTEGER },
    not_ortalamasi: { type: DataTypes.DECIMAL(5, 2) },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'okullar',
    timestamps: false
});

module.exports = Okullar;