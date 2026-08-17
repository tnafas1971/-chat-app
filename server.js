const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// --- بخش عیب‌یابی (برای اینکه بفهمیم مشکل کجاست) ---
app.get('/debug', (req, res) => {
    const files = fs.readdirSync(__dirname);
    res.send(`
        <h3>Debug Info:</h3>
        <p><strong>Current Directory:</strong> ${__dirname}</p>
        <p><strong>Files found in Root:</strong> ${JSON.stringify(files)}</p>
        <hr>
        <p>Try visiting <a href="/">Home Page</a></p>
    `);
});

// تنظیم پوشه استاتیک (ابتدا پوشه public و سپس پوشه اصلی)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// مسیر اصلی: تلاش برای پیدا کردن index.html در هر دو مکان
app.get('/', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send('<h1>404 - File Not Found</h1><p>index.html not found in root or public folder.</p>');
    }
});

// --- منطق Socket.io ---
let onlineUsers = 0;

io.on('connection', (socket) => {
    onlineUsers++;
    io.emit('userCount', onlineUsers);
    console.log('A user connected');

    socket.on('message', (data) => {
        // data: { user: 'Name', text: 'Hello', replyTo: 'Name' }
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        io.emit('userCount', onlineUsers);
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Directory: ${__dirname}`);
});
