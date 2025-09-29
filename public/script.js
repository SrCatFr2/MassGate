// Variables globales
let socket;
let currentUser = null;
let currentRoom = null;
let currentChatType = null;
let currentRecipient = null;
let typingTimeout;
let connectedUsers = new Map();
let allUsers = [];
let allRooms = [];
let currentUserProfile = null;
let mentionSuggestions = [];
let isLoadingMessages = false;

// Elementos del DOM - Autenticación
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

// Elementos del DOM - Chat
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar');
const mobileOverlay = document.getElementById('mobile-overlay');
const userInfo = document.getElementById('user-info');
const userMenuBtn = document.getElementById('user-menu-btn');
const userDropdown = document.getElementById('user-dropdown');
const globalSearch = document.getElementById('global-search');
const searchResults = document.getElementById('search-results');

// Elementos de navegación
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

// Elementos de contenido
const roomsList = document.getElementById('rooms-list');
const usersList = document.getElementById('users-list');
const dmList = document.getElementById('dm-list');
const usersSearch = document.getElementById('users-search');
const dmSearch = document.getElementById('dm-search');
const onlineCount = document.getElementById('online-count');

// Elementos de chat
const welcomeScreen = document.getElementById('welcome-screen');
const chatArea = document.getElementById('chat-area');
const welcomeUsername = document.getElementById('welcome-username');
const headerUsername = document.getElementById('header-username');
const headerUserAvatar = document.getElementById('header-user-avatar');
const currentChatTitle = document.getElementById('current-chat-title');
const chatDescription = document.getElementById('chat-description');
const chatAvatar = document.getElementById('chat-avatar');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// Modales
const roomModal = document.getElementById('room-modal');
const createRoomBtn = document.getElementById('create-room-btn');
const createRoomForm = document.getElementById('create-room-form');
const profileModal = document.getElementById('profile-modal');
const pictureModal = document.getElementById('picture-modal');

// Variables para menciones
let mentionDropdown = null;
let currentMentionQuery = '';
let selectedMentionIndex = -1;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user.username) {
        currentUser = user;
        showChatSection();
        initializeSocket();
    }

    initializeEventListeners();
    createParticles();
    setupMentionSystem();
});

// Event Listeners
function initializeEventListeners() {
    // Autenticación
    showRegisterBtn?.addEventListener('click', switchToRegister);
    showLoginBtn?.addEventListener('click', switchToLogin);
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    // UI
    mobileMenuBtn?.addEventListener('click', toggleSidebar);
    closeSidebarBtn?.addEventListener('click', closeSidebarMobile);
    mobileOverlay?.addEventListener('click', closeSidebarMobile);
    userMenuBtn?.addEventListener('click', toggleUserDropdown);
    document.addEventListener('click', handleOutsideClick);

    // Navegación
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Búsqueda
    globalSearch?.addEventListener('input', handleGlobalSearch);
    usersSearch?.addEventListener('input', handleUsersSearch);
    dmSearch?.addEventListener('input', handleDMSearch);

    // Chat
    messageInput?.addEventListener('keydown', handleMessageKeydown);
    messageInput?.addEventListener('input', handleMessageInput);
    sendBtn?.addEventListener('click', sendMessage);

    // Modal de sala
    createRoomBtn?.addEventListener('click', openRoomModal);
    createRoomForm?.addEventListener('submit', handleCreateRoom);

    // Perfil
    document.getElementById('profile-btn')?.addEventListener('click', openProfileModal);
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('change-picture-btn')?.addEventListener('click', openPictureModal);
    document.getElementById('remove-picture-btn')?.addEventListener('click', removeProfilePicture);

    // Cambio de foto
    document.getElementById('picture-file')?.addEventListener('change', handleFilePreview);
    document.getElementById('upload-file-btn')?.addEventListener('click', uploadProfilePicture);
    document.getElementById('upload-url-btn')?.addEventListener('click', uploadProfilePictureURL);

    // Cerrar modales con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
            closeMentionDropdown();
        }
    });

    // Scroll infinito en mensajes
    messagesContainer?.addEventListener('scroll', handleMessagesScroll);
}

// Sistema de menciones
function setupMentionSystem() {
    // Crear dropdown para menciones
    mentionDropdown = document.createElement('div');
    mentionDropdown.className = 'mention-dropdown';
    mentionDropdown.style.display = 'none';
    document.body.appendChild(mentionDropdown);
}

function handleMessageKeydown(e) {
    if (mentionDropdown && mentionDropdown.style.display === 'block') {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigateMentions(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigateMentions(-1);
                break;
            case 'Enter':
                e.preventDefault();
                selectMention();
                return;
            case 'Escape':
                e.preventDefault();
                closeMentionDropdown();
                return;
        }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleMessageInput(e) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    // Detectar @ para menciones
    const beforeCursor = value.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
        currentMentionQuery = mentionMatch[1];
        showMentionDropdown(e.target);
        searchUsers(currentMentionQuery);
    } else {
        closeMentionDropdown();
    }

    // Indicador de escritura
    if (currentRoom) {
        socket.emit('typing', { room: currentRoom });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('stopTyping', { room: currentRoom });
        }, 1000);
    }
}

async function searchUsers(query) {
    if (!query) {
        mentionSuggestions = allUsers.slice(0, 5);
    } else {
        mentionSuggestions = allUsers.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    updateMentionDropdown();
}

function showMentionDropdown(inputElement) {
    const rect = inputElement.getBoundingClientRect();
    mentionDropdown.style.display = 'block';
    mentionDropdown.style.position = 'fixed';
    mentionDropdown.style.left = rect.left + 'px';
    mentionDropdown.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    mentionDropdown.style.zIndex = '1000';
    selectedMentionIndex = -1;
}

function updateMentionDropdown() {
    if (!mentionSuggestions.length) {
        closeMentionDropdown();
        return;
    }

    mentionDropdown.innerHTML = mentionSuggestions.map((user, index) => {
        const avatarHtml = user.profilePicture && user.profilePictureType !== 'default' 
            ? `<img src="${user.profilePicture}" alt="${user.username}">`
            : `<div class="mention-avatar-fallback">${user.username.charAt(0).toUpperCase()}</div>`;

        return `
            <div class="mention-item ${index === selectedMentionIndex ? 'selected' : ''}" data-index="${index}">
                <div class="mention-avatar">${avatarHtml}</div>
                <div class="mention-info">
                    <div class="mention-username">@${user.username}</div>
                    <div class="mention-status">${user.isOnline ? 'En línea' : 'Desconectado'}</div>
                </div>
            </div>
        `;
    }).join('');

    // Agregar event listeners
    mentionDropdown.querySelectorAll('.mention-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            selectedMentionIndex = index;
            selectMention();
        });
    });
}

function navigateMentions(direction) {
    selectedMentionIndex += direction;
    if (selectedMentionIndex < 0) {
        selectedMentionIndex = mentionSuggestions.length - 1;
    } else if (selectedMentionIndex >= mentionSuggestions.length) {
        selectedMentionIndex = 0;
    }
    updateMentionDropdown();
}

function selectMention() {
    if (selectedMentionIndex >= 0 && mentionSuggestions[selectedMentionIndex]) {
        const selectedUser = mentionSuggestions[selectedMentionIndex];
        const input = messageInput;
        const value = input.value;
        const cursorPos = input.selectionStart;

        const beforeCursor = value.substring(0, cursorPos);
        const afterCursor = value.substring(cursorPos);

        // Reemplazar la mención parcial con la completa
        const mentionMatch = beforeCursor.match(/@(\w*)$/);
        if (mentionMatch) {
            const newBeforeCursor = beforeCursor.replace(/@(\w*)$/, `@${selectedUser.username} `);
            const newValue = newBeforeCursor + afterCursor;

            input.value = newValue;
            input.setSelectionRange(newBeforeCursor.length, newBeforeCursor.length);
        }
    }

    closeMentionDropdown();
}

function closeMentionDropdown() {
    if (mentionDropdown) {
        mentionDropdown.style.display = 'none';
    }
    selectedMentionIndex = -1;
}

// Funciones de autenticación
function switchToRegister(e) {
    e.preventDefault();
    loginFormContainer.classList.remove('active');
    registerFormContainer.classList.add('active');

    setTimeout(() => {
        registerFormContainer.querySelector('input').focus();
    }, 300);
}

function switchToLogin(e) {
    e.preventDefault();
    registerFormContainer.classList.remove('active');
    loginFormContainer.classList.add('active');

    setTimeout(() => {
        loginFormContainer.querySelector('input').focus();
    }, 300);
}

async function handleLogin(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    submitBtn.classList.add('loading');
    btnText.style.opacity = '0';
    btnLoader.style.opacity = '1';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;

            submitBtn.classList.add('success');
            setTimeout(() => {
                showChatSection();
                initializeSocket();
                showNotification('¡Bienvenido de vuelta!', 'success');
            }, 800);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        submitBtn.classList.add('error');
        showNotification(error.message || 'Error de conexión', 'error');

        setTimeout(() => {
            submitBtn.classList.remove('loading', 'error');
            btnText.style.opacity = '1';
            btnLoader.style.opacity = '0';
        }, 2000);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    submitBtn.classList.add('loading');
    btnText.style.opacity = '0';
    btnLoader.style.opacity = '1';

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;

            submitBtn.classList.add('success');
            setTimeout(() => {
                showChatSection();
                initializeSocket();
                showNotification('¡Cuenta creada exitosamente!', 'success');
            }, 800);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        submitBtn.classList.add('error');
        showNotification(error.message || 'Error de conexión', 'error');

        setTimeout(() => {
            submitBtn.classList.remove('loading', 'error');
            btnText.style.opacity = '1';
            btnLoader.style.opacity = '0';
        }, 2000);
    }
}

function handleLogout() {
    if (socket) {
        socket.disconnect();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    chatSection.style.opacity = '0';
    setTimeout(() => {
        chatSection.style.display = 'none';
        authSection.style.display = 'block';
        chatSection.style.opacity = '1';
        currentUser = null;
        showNotification('Sesión cerrada', 'info');
    }, 300);
}

// Funciones de UI
function showChatSection() {
    authSection.style.display = 'none';
    chatSection.style.display = 'block';
    chatSection.style.opacity = '0';

    setTimeout(() => {
        chatSection.style.opacity = '1';
        headerUsername.textContent = currentUser.username;
        welcomeUsername.textContent = currentUser.username;
        updateUserAvatar(headerUserAvatar, currentUser);
        loadInitialData();
    }, 100);
}

function toggleSidebar() {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('show');
}

function closeSidebarMobile() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('show');
}

function toggleUserDropdown(e) {
    e.stopPropagation();
    userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
}

function handleOutsideClick(e) {
    if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
        userDropdown.style.display = 'none';
    }

    if (!searchResults.contains(e.target) && !globalSearch.contains(e.target)) {
        hideSearchResults();
    }

    if (mentionDropdown && !mentionDropdown.contains(e.target) && !messageInput.contains(e.target)) {
        closeMentionDropdown();
    }
}

function switchTab(tabName) {
    navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === `${tabName}-tab`);
    });
}

// Socket.io mejorado
function initializeSocket() {
    const token = localStorage.getItem('token');

    socket = io({
        auth: { token: token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('🟢 Conectado al servidor');
        showNotification('Conectado al servidor', 'success');
    });

    socket.on('disconnect', () => {
        console.log('🔴 Desconectado del servidor');
        showNotification('Desconectado del servidor', 'warning');
    });

    socket.on('reconnect', () => {
        console.log('🔄 Reconectado al servidor');
        showNotification('Reconectado al servidor', 'success');
        // Recargar datos
        if (currentRoom) {
            socket.emit('joinRoom', currentRoom);
        }
    });

    socket.on('newMessage', (message) => {
        console.log('📨 Nuevo mensaje recibido:', message);
        if (currentRoom === message.room && currentChatType === 'public') {
            displayMessage(message);

            // Reproducir sonido de notificación si no es propio mensaje
            if (message.sender._id !== currentUser.id) {
                playNotificationSound();
            }
        }
    });

    socket.on('newDirectMessage', (message) => {
        console.log('💬 Nuevo mensaje directo:', message);
        const dmRoom = `dm_${[currentUser.id, currentRecipient].sort().join('_')}`;
        if (currentRoom === dmRoom && currentChatType === 'direct') {
            displayMessage(message);

            if (message.sender._id !== currentUser.id) {
                playNotificationSound();
            }
        }
        updateDMList();
    });

    socket.on('pingNotification', (data) => {
        console.log('📢 Ping recibido:', data);
        showPingNotification(data);
        playPingSound();
    });

    socket.on('dmNotification', (data) => {
        console.log('💌 Notificación DM:', data);
        showDMNotification(data);
        playNotificationSound();
    });

    socket.on('userConnected', (data) => {
        updateConnectedUsers(data.users);
    });

    socket.on('userDisconnected', (data) => {
        updateConnectedUsers(data.users);
    });

    socket.on('allUsersUpdate', (users) => {
        allUsers = users;
        updateAllUsersDisplay();
    });

    socket.on('userTyping', (data) => {
        if (data.room === currentRoom && data.userId !== currentUser.id) {
            showTypingIndicator(data.username);
        }
    });

    socket.on('userStoppedTyping', (data) => {
        if (data.room === currentRoom && data.userId !== currentUser.id) {
            hideTypingIndicator();
        }
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        showNotification(error.message || 'Error de conexión', 'error');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        showNotification('Error de conexión al servidor', 'error');
    });
}

// Funciones de notificaciones
function showPingNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'ping-notification';
    notification.innerHTML = `
        <div class="ping-header">
            <i class="fas fa-at"></i>
            <span>Te mencionaron en ${data.room}</span>
        </div>
        <div class="ping-content">
            <strong>${data.mentionedBy}:</strong> ${data.message.content}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Hacer clic para ir al mensaje
    notification.addEventListener('click', () => {
        if (data.room !== currentRoom) {
            joinRoom(data.room);
        }
        notification.remove();
    });
}

function showDMNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'dm-notification';
    notification.innerHTML = `
        <div class="dm-header">
            <i class="fas fa-envelope"></i>
            <span>Mensaje directo de ${data.from}</span>
        </div>
        <div class="dm-content">
            ${data.message.content}
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);

    // Hacer clic para abrir DM
    notification.addEventListener('click', () => {
        startDirectMessage(data.message.sender._id, data.message.sender.username);
        notification.remove();
    });
}

function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeS');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
    } catch (error) {
        console.log('Error reproduciendo sonido:', error);
    }
}

function playPingSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvGUgBDuO0/LNeS');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('No se pudo reproducir ping:', e));
    } catch (error) {
        console.log('Error reproduciendo ping:', error);
    }
}

// Funciones de carga de datos
async function loadInitialData() {
    try {
        await Promise.all([
            loadRooms(),
            loadAllUsers(),
            loadProfile()
        ]);

        // Unirse a sala general por defecto
        if (allRooms.length > 0) {
            const generalRoom = allRooms.find(room => room.name === 'general') || allRooms[0];
            joinRoom(generalRoom.name);
        }

    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error cargando datos', 'error');
    }
}

async function loadRooms() {
    try {
        const response = await fetch('/api/chat/rooms', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            allRooms = await response.json();
            displayRooms();
        }
    } catch (error) {
        console.error('Error cargando salas:', error);
    }
}

async function loadAllUsers() {
    try {
        const response = await fetch('/api/chat/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            allUsers = data.users || data;
            updateAllUsersDisplay();
        }
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

async function loadProfile() {
    try {
        const response = await fetch('/api/profile/me', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            currentUserProfile = await response.json();
            currentUser = { ...currentUser, ...currentUserProfile };
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserAvatar(headerUserAvatar, currentUser);
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

function displayRooms() {
    if (!roomsList) return;

    roomsList.innerHTML = allRooms.map(room => `
        <div class="room-item" onclick="joinRoom('${room.name}')">
            <div class="room-info">
                <div class="room-name"># ${room.displayName || room.name}</div>
                <div class="room-description">${room.description || 'Sin descripción'}</div>
            </div>
            <div class="room-members">${room.members?.length || 0} miembros</div>
        </div>
    `).join('');
}

function updateAllUsersDisplay() {
    if (!usersList) return;

    // Filtrar usuarios válidos (con username)
    const validUsers = allUsers.filter(user => user && user.username);
    const onlineUsers = validUsers.filter(user => user.isOnline);
    const offlineUsers = validUsers.filter(user => !user.isOnline);

    if (onlineCount) {
        onlineCount.textContent = onlineUsers.length;
    }

    usersList.innerHTML = `
        ${onlineUsers.length > 0 ? `
            <div class="users-section">
                <div class="users-section-title">En línea (${onlineUsers.length})</div>
                ${onlineUsers.map(user => createUserElement(user, true)).filter(html => html).join('')}
            </div>
        ` : ''}

        ${offlineUsers.length > 0 ? `
            <div class="users-section">
                <div class="users-section-title">Desconectados (${offlineUsers.length})</div>
                ${offlineUsers.map(user => createUserElement(user, false)).filter(html => html).join('')}
            </div>
        ` : ''}
    `;
}

function createUserElement(user, isOnline) {
    // Verificar que el usuario tenga datos básicos
    if (!user || !user.username) {
        return '';
    }

    const avatarHtml = user.profilePicture && user.profilePictureType !== 'default' 
        ? `<img src="${user.profilePicture}" alt="${user.username}">`
        : `<div class="user-avatar-fallback">${user.username.charAt(0).toUpperCase()}</div>`;

    return `
        <div class="user-item ${isOnline ? 'online' : 'offline'}" onclick="startDirectMessage('${user._id}', '${user.username}')">
            <div class="user-avatar">
                ${avatarHtml}
                <div class="user-status ${isOnline ? 'online' : 'offline'}"></div>
            </div>
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-last-seen">
                    ${isOnline ? 'En línea' : `Desconectado ${formatLastSeen(user.lastActive)}`}
                </div>
            </div>
        </div>
    `;
}

function updateConnectedUsers(users) {
    connectedUsers.clear();
    users.forEach(user => {
        connectedUsers.set(user.id, user);
    });

    // Actualizar estado online en allUsers
    allUsers = allUsers.map(user => ({
        ...user,
        isOnline: connectedUsers.has(user._id)
    }));

    updateAllUsersDisplay();
}

// Funciones de chat
async function joinRoom(roomName) {
    try {
        currentRoom = roomName;
        currentChatType = 'public';
        currentRecipient = null;

        // Emitir evento de unirse a sala
        socket.emit('joinRoom', roomName);

        // Actualizar UI
        welcomeScreen.style.display = 'none';
        chatArea.style.display = 'flex';

        const room = allRooms.find(r => r.name === roomName);
        currentChatTitle.textContent = `# ${room?.displayName || roomName}`;
        chatDescription.textContent = room?.description || 'Sala pública';

        // Limpiar mensajes y cargar nuevos
        messagesContainer.innerHTML = '';
        await loadMessages(roomName);

        // Cerrar sidebar en móvil
        closeSidebarMobile();

        // Enfocar input
        messageInput.focus();

    } catch (error) {
        console.error('Error uniéndose a sala:', error);
        showNotification('Error uniéndose a la sala', 'error');
    }
}

async function startDirectMessage(userId, username) {
    try {
        currentRoom = `dm_${[currentUser.id, userId].sort().join('_')}`;
        currentChatType = 'direct';
        currentRecipient = userId;

        // Actualizar UI
        welcomeScreen.style.display = 'none';
        chatArea.style.display = 'flex';

        const user = allUsers.find(u => u._id === userId);
        currentChatTitle.textContent = `@ ${username}`;
        chatDescription.textContent = user?.isOnline ? 'En línea' : 'Desconectado';

        // Actualizar avatar del chat
        if (user) {
            updateUserAvatar(chatAvatar, user);
        }

        // Limpiar mensajes y cargar conversación
        messagesContainer.innerHTML = '';
        await loadDirectMessages(userId);

        // Cerrar sidebar en móvil
        closeSidebarMobile();

        // Enfocar input
        messageInput.focus();

    } catch (error) {
        console.error('Error iniciando mensaje directo:', error);
        showNotification('Error iniciando conversación', 'error');
    }
}

async function loadMessages(roomName) {
    if (isLoadingMessages) return;

    try {
        isLoadingMessages = true;

        const response = await fetch(`/api/chat/messages/${roomName}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            data.messages.forEach(message => displayMessage(message, false));
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
    } finally {
        isLoadingMessages = false;
    }
}

async function loadDirectMessages(userId) {
    if (isLoadingMessages) return;

    try {
        isLoadingMessages = true;

        const response = await fetch(`/api/chat/direct/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            const data = await response.json();
            data.messages.forEach(message => displayMessage(message, false));
            scrollToBottom();
        }
    } catch (error) {
        console.error('Error cargando mensajes directos:', error);
    } finally {
        isLoadingMessages = false;
    }
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !currentRoom) return;

    const messageData = { content, room: currentRoom };

    if (currentChatType === 'direct') {
        messageData.recipientId = currentRecipient;
        socket.emit('directMessage', messageData);
    } else {
        socket.emit('publicMessage', messageData);
    }

    messageInput.value = '';
}

function displayMessage(message, animate = true) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.sender._id === currentUser.id ? 'own' : ''}`;

    if (animate) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
    }

    const avatarHtml = message.sender.profilePicture && message.sender.profilePictureType !== 'default' 
        ? `<img src="${message.sender.profilePicture}" alt="${message.sender.username}">`
        : `<div class="message-avatar-fallback">${message.sender.username.charAt(0).toUpperCase()}</div>`;

    // Procesar contenido con menciones
    let processedContent = message.processedContent || message.content;

    messageElement.innerHTML = `
        <div class="message-avatar">
            ${avatarHtml}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${message.sender.username}</span>
                <span class="message-time">${formatTime(message.createdAt)}</span>
            </div>
            <div class="message-text">${processedContent}</div>
        </div>
    `;

    messagesContainer.appendChild(messageElement);

    if (animate) {
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 100);
    }

    scrollToBottom();
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Funciones de búsqueda
function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    if (!query) {
        hideSearchResults();
        return;
    }

    const results = [];

    // Buscar salas
    allRooms.forEach(room => {
        if (room.name.toLowerCase().includes(query) || 
            (room.displayName && room.displayName.toLowerCase().includes(query))) {
            results.push({
                type: 'room',
                data: room,
                title: `# ${room.displayName || room.name}`,
                subtitle: room.description || 'Sala pública'
            });
        }
    });

    // Buscar usuarios
    allUsers.forEach(user => {
        if (user.username.toLowerCase().includes(query)) {
            results.push({
                type: 'user',
                data: user,
                title: `@ ${user.username}`,
                subtitle: user.isOnline ? 'En línea' : 'Desconectado'
            });
        }
    });

    displaySearchResults(results);
}

function displaySearchResults(results) {
    if (!searchResults) return;

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No se encontraron resultados</div>';
    } else {
        searchResults.innerHTML = results.map(result => `
            <div class="search-result" onclick="handleSearchResult('${result.type}', '${result.data._id || result.data.name}', '${result.data.username || result.data.name}')">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-subtitle">${result.subtitle}</div>
            </div>
        `).join('');
    }

    searchResults.style.display = 'block';
}

function handleSearchResult(type, id, name) {
    if (type === 'room') {
        joinRoom(name);
    } else if (type === 'user') {
        startDirectMessage(id, name);
    }

    hideSearchResults();
    globalSearch.value = '';
}

function hideSearchResults() {
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

function handleUsersSearch(e) {
    const query = e.target.value.toLowerCase();
    const userItems = document.querySelectorAll('#users-list .user-item');

    userItems.forEach(item => {
        const username = item.querySelector('.user-name').textContent.toLowerCase();
        item.style.display = username.includes(query) ? 'flex' : 'none';
    });
}

function handleDMSearch(e) {
    const query = e.target.value.toLowerCase();
    const dmItems = document.querySelectorAll('#dm-list .dm-item');

    dmItems.forEach(item => {
        const username = item.querySelector('.dm-name').textContent.toLowerCase();
        item.style.display = username.includes(query) ? 'flex' : 'none';
    });
}

// Funciones de indicadores
function showTypingIndicator(username) {
    if (typingIndicator) {
        typingIndicator.textContent = `${username} está escribiendo...`;
        typingIndicator.style.display = 'block';
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// Funciones de modales
function openRoomModal() {
    if (roomModal) {
        roomModal.style.display = 'flex';
        document.getElementById('room-name').focus();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

async function handleCreateRoom(e) {
    e.preventDefault();

    const name = document.getElementById('room-name').value;
    const description = document.getElementById('room-description').value;

    try {
        const response = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, description })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Sala creada exitosamente', 'success');
            closeAllModals();
            await loadRooms();
            joinRoom(data.name);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error creando sala', 'error');
    }
}

// Funciones de perfil
function openProfileModal() {
    if (profileModal && currentUserProfile) {
        document.getElementById('profile-username').value = currentUserProfile.username || '';
        document.getElementById('profile-status').value = currentUserProfile.customStatus || '';
        profileModal.style.display = 'flex';
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const username = document.getElementById('profile-username').value;
    const customStatus = document.getElementById('profile-status').value;

    try {
        const response = await fetch('/api/profile/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ username, customStatus })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = { ...currentUser, ...data.user };
            currentUserProfile = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));

            headerUsername.textContent = currentUser.username;
            updateUserAvatar(headerUserAvatar, currentUser);

            // Notificar al socket sobre la actualización
            socket.emit('profileUpdated', {
                username: currentUser.username,
                profilePicture: currentUser.profilePicture,
                profilePictureType: currentUser.profilePictureType
            });

            showNotification('Perfil actualizado exitosamente', 'success');
            closeAllModals();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error actualizando perfil', 'error');
    }
}

function openPictureModal() {
    if (pictureModal) {
        pictureModal.style.display = 'flex';
    }
}

function handleFilePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('picture-preview');

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

async function uploadProfilePicture() {
    const fileInput = document.getElementById('picture-file');
    const file = fileInput.files[0];

    if (!file) {
        showNotification('Selecciona un archivo', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
        const response = await fetch('/api/profile/picture/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.profilePicture = data.profilePicture;
            currentUser.profilePictureType = data.profilePictureType;
            localStorage.setItem('user', JSON.stringify(currentUser));

            updateUserAvatar(headerUserAvatar, currentUser);

            socket.emit('profileUpdated', {
                username: currentUser.username,
                profilePicture: currentUser.profilePicture,
                profilePictureType: currentUser.profilePictureType
            });

            showNotification('Foto actualizada exitosamente', 'success');
            closeAllModals();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error subiendo foto', 'error');
    }
}

async function uploadProfilePictureURL() {
    const url = document.getElementById('picture-url').value;

    if (!url) {
        showNotification('Ingresa una URL', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/profile/picture/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ imageUrl: url })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.profilePicture = data.profilePicture;
            currentUser.profilePictureType = data.profilePictureType;
            localStorage.setItem('user', JSON.stringify(currentUser));

            updateUserAvatar(headerUserAvatar, currentUser);

            socket.emit('profileUpdated', {
                username: currentUser.username,
                profilePicture: currentUser.profilePicture,
                profilePictureType: currentUser.profilePictureType
            });

            showNotification('Foto actualizada exitosamente', 'success');
            closeAllModals();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error actualizando foto', 'error');
    }
}

async function removeProfilePicture() {
    try {
        const response = await fetch('/api/profile/picture', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            currentUser.profilePicture = null;
            currentUser.profilePictureType = 'default';
            localStorage.setItem('user', JSON.stringify(currentUser));

            updateUserAvatar(headerUserAvatar, currentUser);

            socket.emit('profileUpdated', {
                username: currentUser.username,
                profilePicture: currentUser.profilePicture,
                profilePictureType: currentUser.profilePictureType
            });

            showNotification('Foto eliminada exitosamente', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        showNotification(error.message || 'Error eliminando foto', 'error');
    }
}

// Funciones de utilidad
function updateUserAvatar(element, user) {
    if (!element) return;

    if (user.profilePicture && user.profilePictureType !== 'default') {
        element.innerHTML = `<img src="${user.profilePicture}" alt="${user.username}">`;
    } else {
        element.innerHTML = `<div class="avatar-fallback">${user.username.charAt(0).toUpperCase()}</div>`;
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
}

function formatLastSeen(timestamp) {
    if (!timestamp) return 'hace tiempo';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return 'ahora';
    if (diffInMinutes < 60) return `hace ${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `hace ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `hace ${diffInDays}d`;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Funciones de efectos visuales
function createParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

function handleMessagesScroll(e) {
    // Implementar scroll infinito si es necesario
    if (e.target.scrollTop === 0 && !isLoadingMessages) {
        // Cargar más mensajes antiguos
        loadMoreMessages();
    }
}

async function loadMoreMessages() {
    // Implementar carga de más mensajes
    console.log('Cargando más mensajes...');
}

async function updateDMList() {
    // Implementar actualización de lista de mensajes directos
    console.log('Actualizando lista de DMs...');
}

// Cerrar modales con click fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAllModals();
    }
});

// Manejar teclas globales
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
        closeMentionDropdown();
    }

    // Ctrl/Cmd + K para búsqueda rápida
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        globalSearch?.focus();
    }
});