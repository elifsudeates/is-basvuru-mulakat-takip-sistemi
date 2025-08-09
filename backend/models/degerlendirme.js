const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Degerlendirme = sequelize.define('degerlendirme', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mulakat_id: { type: DataTypes.INTEGER, allowNull: false },
    degerlendirme_turu: { type: DataTypes.STRING(20) },
    sicil: { type: DataTypes.STRING(50), allowNull: false },
    puani: { type: DataTypes.INTEGER },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'degerlendirme',
    timestamps: false
});

module.exports = Degerlendirme;