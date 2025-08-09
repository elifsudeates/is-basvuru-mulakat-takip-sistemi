const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MulakatKatilimciIliskisi = sequelize.define('mulakat_katilimci_iliskisi', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mulakat_id: { type: DataTypes.INTEGER, allowNull: false },
    katilimci_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'mulakat_katilimci_iliskisi',
    timestamps: false
});

module.exports = MulakatKatilimciIliskisi;