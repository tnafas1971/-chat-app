const express = require('express');
const app = express();
const http = require('http').createServer(app);
const socketIo = require('socket.io');
const path = require('path');

// تنظیم فایل‌های استاتیک (HTML, CSS, JS) از داخل پوشه public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// مسیر اصلی برای ارسال فایل index.html که در پوشه public قرار دارد
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// تنظیم Socket.io روی همان سروری که express اجرا می‌شود
const io = socketIo(http);

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// استفاده از پورت سیستم یا پورت ۳۰۰۰ در حالت لوکال
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Serving static files from: ${publicPath}`);
});
