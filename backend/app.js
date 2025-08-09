require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models'); // models/index.js'i çağırır
const mainRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ana API rotası
app.use('/api', mainRoutes);

// Hoşgeldin mesajı
app.get('/', (req, res) => {
    res.json({ message: 'İş Başvuru Takip Sistemi API\'sine hoş geldiniz.' });
});

// Veritabanı senkronizasyonu ve sunucuyu başlatma
// db.sequelize.sync({ force: true }) // DİKKAT: 'force: true' tüm tabloları siler ve yeniden oluşturur. Sadece geliştirme başında kullanılır.
db.sequelize.authenticate()
    .then(() => {
        console.log('Veritabanı bağlantısı başarıyla kuruldu.');
        app.listen(PORT, () => {
            console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
        });
    })
    .catch(err => {
        console.error('Veritabanına bağlanılamadı:', err);
    });