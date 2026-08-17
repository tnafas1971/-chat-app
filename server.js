const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// تنظیم پورت: Railway به صورت داینامیک پورت را تعیین می‌کند
const PORT = process.env.PORT || 8080;

// مسیر فایل‌های استاتیک (CSS, JS, index.html)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// سوکت‌ها
io.on('connection', (socket) => {
    console.log('a user connected');
});

// گوش دادن روی پورت صحیح
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
