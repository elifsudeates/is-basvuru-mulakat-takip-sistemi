const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notlar = sequelize.define('notlar', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mulakat_id: { type: DataTypes.INTEGER, allowNull: false },
    sicil: { type: DataTypes.STRING(50), allowNull: false },
    not_metni: { type: DataTypes.TEXT },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'notlar',
    timestamps: false
});

module.exports = Notlar;