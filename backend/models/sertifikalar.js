const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sertifikalar = sequelize.define('sertifikalar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    aday_id: { type: DataTypes.INTEGER, allowNull: false },
    sertifika_adi: { type: DataTypes.STRING(200), allowNull: false },
    gecerliligi: { type: DataTypes.DATE },
    alinma_tarihi: { type: DataTypes.DATE },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'sertifikalar',
    timestamps: false
});

module.exports = Sertifikalar;