const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

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
        console.log(`User ${trimmedUsername} set username`);

        io.emit('user list', users); // Send updated list

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
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        };
        io.emit('chat message', messageToSend);
    });

    socket.on('disconnect', () => {
        const disconnectedUsername = socket.username;
        if (disconnectedUsername) {
            users = users.filter(user => user !== disconnectedUsername);
            console.log(`User ${disconnectedUsername} disconnected`);
            io.emit('user list', users); // Send updated list
            io.emit('chat message', { system: true, text: `${disconnectedUsername} از چت خارج شد.` });
        } else {
            console.log('A guest disconnected');
        }
    });
});

 

