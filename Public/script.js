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

// Login Logic
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

// Chat Logic
socket.on('chat message', (data) => {
    const messageElement = document.createElement('li');
    
    if (data.system) {
        messageElement.classList.add('system-message');
        messageElement.innerText = data.text;
    } else {
        const isMyMessage = data.user === currentUser;
        messageElement.classList.add(isMyMessage ? 'my-message' : 'other-message');
        messageElement.setAttribute('data-message-id', data.id); // For potential future use

        let messageContent = '';

        // Reply preview
        if (data.replyTo) {
            messageContent += `<div class="reply-preview">
                                <strong>پاسخ به ${data.replyTo.user}:</strong> ${data.replyTo.text.substring(0, 50)}${data.replyTo.text.length > 50 ? '...' : ''}
                             </div>`;
        }
        
        messageContent += `<strong>${data.user}:</strong> ${data.text}`;

        messageElement.innerHTML = messageContent;

        // Add reply button for other users' messages
        if (!isMyMessage) {
            const replyBtn = document.createElement('button');
            replyBtn.innerText = 'پاسخ';
            replyBtn.classList.add('reply-btn');
            // Pass relevant data for replying
            replyBtn.onclick = () => startReply(data.id, data.user, data.text);
            messageElement.appendChild(replyBtn);
        }

        // Add time if available
        if (data.time) {
            const timeSpan = document.createElement('span');
            timeSpan.classList.add('message-time');
            timeSpan.innerText = data.time;
            messageElement.appendChild(timeSpan);
        }
    }
    
    messagesList.appendChild(messageElement);
    messagesList.scrollTop = messagesList.scrollHeight; // Scroll to bottom
});

socket.on('user list', (users) => {
    onlineCountSpan.innerText = users.length;
    onlineUsersList.innerHTML = ''; // Clear existing list
    users.forEach(user => {
        const li = document.createElement('li');
        li.innerText = user;
        onlineUsersList.appendChild(li);
    });
});

// Send message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = msgInput.value;
    if (text.trim()) {
        const messageData = { text: text };
        if (replyingTo) {
            // Include replyTo details in the message
            messageData.replyTo = { user: replyingTo.user, text: replyingTo.text, id: replyingTo.id };
        }
        socket.emit('chat message', messageData);
        cancelReply(); // Clear reply state
    }
    msgInput.value = ''; // Clear input field
    msgInput.focus();
});

// Start reply action
function startReply(messageId, messageUser, messageText) {
    replyingTo = { id: messageId, user: messageUser, text: messageText };
    // Display who the reply is for
    replyingToUserSpan.innerText = `${messageUser}: "${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}"`;
    replyContainer.classList.remove('hidden');
    msgInput.focus();
}

// Cancel reply action
function cancelReply() {
    replyingTo = null;
    replyContainer.classList.add('hidden');
    replyingToUserSpan.innerText = '';
}

cancelReplyBtn.addEventListener('click', cancelReply);

// Focus input field when clicking main chat area
messagesList.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT' && e.target.id !== 'cancel-reply') {
        msgInput.focus();
    }
});

// Initial state: hide chat form, show login overlay
chatForm.style.display = 'none';
