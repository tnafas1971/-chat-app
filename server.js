const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// --- بخش رفع مشکل Not Found ---
// اول پوشه public را چک می‌کند، اگر نبود پوشه اصلی را چک می‌کند
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// تعریف مسیر اصلی به صورت اجباری
app.get('/', (req, res) => {
    // اول سعی می‌کند index.html را از پوشه public باز کند
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    // اگر نبود، از پوشه اصلی باز می‌کند
    const rootIndex = path.join(__dirname, 'index.html');

    // بررسی وجود فایل‌ها برای جلوگیری از خطای Not Found
    const fs = require('fs');
    if (fs.existsSync(publicIndex)) {
        res.sendFile(publicIndex);
    } else if (fs.existsSync(rootIndex)) {
        res.sendFile(rootIndex);
    } else {
        res.status(404).send('خطا: فایل index.html پیدا نشد! لطفاً ساختار فایل‌های خود را بررسی کنید.');
    }
});
// -------------------------------

let users = [];

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('set username', (username, callback) => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            return callback({ status: 'error', message: 'نام کاربری نمی‌تواند خالی باشد.' });
        }
        if (users.includes(trimmedUsername)) {
            return callback({ status: 'error', message: 'این نام کاربری قبلاً گرفته شده است.' });
        }
        socket.username = trimmedUsername;
        users.push(trimmedUsername);
        io.emit('user list', users);
        socket.emit('chat message', { system: true, text: `به چت‌روم خوش آمدی، ${trimmedUsername}!` });
        socket.broadcast.emit('chat message', { system: true, text: `${trimmedUsername} وارد چت شد.` });
        callback({ status: 'ok', username: trimmedUsername });
    });

    socket.on('chat message', (msgData) => {
        const senderUsername = socket.username || 'کاربر ناشناس';
        const messageToSend = {
            user: senderUsername,
            text: msgData.text,
            replyTo: msgData.replyTo || null,
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        io.emit('chat message', messageToSend);
    });

    socket.on('disconnect', () => {
        const disconnectedUsername = socket.username;
        if (disconnectedUsername) {
            users = users.filter((user) => user !== disconnectedUsername);
            io.emit('user list', users);
            io.emit('chat message', { system: true, text: `${disconnectedUsername} از چت خارج شد.` });
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
