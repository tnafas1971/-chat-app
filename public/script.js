const socket = io();

const messagesList = document.getElementById('messages-list');
const onlineUsersList = document.getElementById('online-users-list');
const onlineCountSpan = document.getElementById('online-count');
const msgInput = document.getElementById('msg-input');
const chatForm = document.getElementById('chat-form');
const currentUserDisplay = document.getElementById('current-user-display');
const loginOverlay = document.getElementById('login-overlay');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const replyContainer = document.getElementById('reply-container');
const replyingToUserSpan = document.getElementById('replying-to-user');
const cancelReplyBtn = document.getElementById('cancel-reply');

let currentUser = '';
let replyingTo = null; // { user: '...', text: '...', id: '...' }

// --- Login Logic ---
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value;
    if (!username.trim()) return alert('لطفاً نام کاربری را وارد کنید.');

    socket.emit('set username', username, (response) => {
        if (response.status === 'ok') {
            currentUser = response.username;
            currentUserDisplay.innerText = `شما: ${currentUser}`;
            loginOverlay.classList.add('hidden');
            chatForm.style.display = 'flex';
            console.log('Login successful:', currentUser);
        } else {
            alert(`ورود ناموفق: ${response.message}`);
        }
    });
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// --- Core Display Function (Standardized for New & Old messages) ---
function displayMessage(data) {
    const messageElement = document.createElement('li');
    
    if (data.system) {
        messageElement.classList.add('system-message');
        messageElement.innerText = data.text;
    } else {
        const isMyMessage = data.user === currentUser;
        messageElement.classList.add(isMyMessage ? 'my-message' : 'other-message');

        let messageContent = '';

        // Reply preview
        if (data.replyTo) {
            // چک می‌کنیم اگر replyTo به صورت آبجکت بود (پیام قدیمی) یا رشته (پیام جدید)
            const replyUser = typeof data.replyTo === 'object' ? data.replyTo.user : data.replyTo;
            const replyText = typeof data.replyTo === 'object' ? data.replyTo.text : '';
            
            messageContent += `<div class="reply-preview">
                                <strong>پاسخ به ${replyUser}:</strong> ${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}
                             </div>`;
        }
        
        messageContent += `<strong>${data.user}:</strong> ${data.text}`;
        messageElement.innerHTML = messageContent;

        // Add reply button for other users' messages
        if (!isMyMessage) {
            const replyBtn = document.createElement('button');
            replyBtn.innerText = 'پاسخ';
            replyBtn.classList.add('reply-btn');
            // استفاده از id پیام برای پاسخ دادن (در سرور ما فعلاً id نداریم، پس از متن یا کاربر استفاده می‌کنیم)
            replyBtn.onclick = () => startReply(data.user, data.user, data.text);
            messageElement.appendChild(replyBtn);
        }

        // Add time
        if (data.time) {
            const timeSpan = document.createElement('span');
            timeSpan.classList.add('message-time');
            timeSpan.innerText = data.time;
            messageElement.appendChild(timeSpan);
        }
    }
    
    messagesList.appendChild(messageElement);
    messagesList.scrollTop = messagesList.scrollHeight;
}

// --- Socket Listeners ---

// 1. دریافت پیام‌های قدیمی از سرور
socket.on('message history', (oldMessages) => {
    oldMessages.forEach((msg) => {
        displayMessage(msg);
    });
});

// 2. دریافت پیام‌های جدید (هم سیستمی و هم چت)
socket.on('chat message', (data) => {
    displayMessage(data);
});

// 3. لیست کاربران
socket.on('user list', (users) => {
    onlineCountSpan.innerText = users.length;
    onlineUsersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerText = user;
        onlineUsersList.appendChild(li);
    });
});

// --- Chat Logic ---

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = msgInput.value;
    if (text.trim()) {
        const messageData = { text: text };
        if (replyingTo) {
            messageData.replyTo = { 
                user: replyingTo.user, 
                text: replyingTo.text 
            };
        }
        socket.emit('chat message', messageData);
        cancelReply();
    }
    msgInput.value = '';
    msgInput.focus();
});

function startReply(id, messageUser, messageText) {
    replyingTo = { id: id, user: messageUser, text: messageText };
    replyingToUserSpan.innerText = `${messageUser}: "${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}"`;
    replyContainer.classList.remove('hidden');
    msgInput.focus();
}

function cancelReply() {
    replyingTo = null;
    replyContainer.classList.add('hidden');
    replyingToUserSpan.innerText = '';
}

cancelReplyBtn.addEventListener('click', cancelReply);

messagesList.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.id !== 'cancel-reply') {
        msgInput.focus();
    }
});

// Initial state
chatForm.style.display = 'none';
