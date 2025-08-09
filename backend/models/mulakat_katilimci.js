const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MulakatKatilimci = sequelize.define('mulakat_katilimci', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    katilimci_adi: { type: DataTypes.STRING(200), allowNull: false },
    sicil: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'mulakat_katilimci',
    timestamps: false
});

module.exports = MulakatKatilimci;