const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BeceriTuru = sequelize.define('beceri_turu', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'beceri_turu',
    timestamps: false
});

module.exports = BeceriTuru;