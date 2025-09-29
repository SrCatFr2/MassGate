const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Servir archivos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/justchat')
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io para chat en tiempo real
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

// Usuarios conectados con información completa
const connectedUsers = new Map();

// Middleware de autenticación para Socket.IO
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            throw new Error('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.profilePicture = user.profilePicture;
        socket.profilePictureType = user.profilePictureType;
        socket.userEmail = user.email;

        next();
    } catch (err) {
        console.error('Socket auth error:', err.message);
        next(new Error('Authentication error'));
    }
});

io.on('connection', async (socket) => {
    console.log(`🟢 Usuario ${socket.username} conectado`);

    // Agregar usuario a la lista de conectados con información completa
    connectedUsers.set(socket.userId, {
        id: socket.userId,
        username: socket.username,
        socketId: socket.id,
        profilePicture: socket.profilePicture,
        profilePictureType: socket.profilePictureType,
        email: socket.userEmail,
        lastActive: new Date()
    });

    // Notificar a todos los usuarios conectados
    io.emit('userConnected', {
        users: Array.from(connectedUsers.values())
    });

    // Enviar lista de todos los usuarios registrados al usuario que se conecta
    socket.emit('allUsersUpdate', await getAllUsers());

    // Unirse a una sala
    socket.on('joinRoom', async (roomName) => {
        try {
            socket.join(roomName);
            socket.currentRoom = roomName;
            console.log(`📝 ${socket.username} se unió a la sala ${roomName}`);

            // Notificar a otros en la sala
            socket.to(roomName).emit('userJoinedRoom', {
                username: socket.username,
                room: roomName
            });
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Error uniéndose a la sala' });
        }
    });

    // Mensaje en sala pública
    socket.on('publicMessage', async (data) => {
        try {
            console.log('📨 Mensaje público recibido:', data);

            if (!data.content || !data.room) {
                throw new Error('Contenido o sala faltante');
            }

            // Procesar menciones en el mensaje
            const processedContent = await processMentions(data.content);

            const message = new Message({
                content: data.content,
                processedContent: processedContent.content,
                mentions: processedContent.mentions,
                sender: socket.userId,
                room: data.room,
                messageType: 'public'
            });

            await message.save();
            await message.populate('sender', 'username profilePicture profilePictureType email');
            await message.populate('mentions.user', 'username profilePicture profilePictureType');

            const messageData = {
                _id: message._id,
                content: message.content,
                processedContent: message.processedContent,
                mentions: message.mentions,
                sender: {
                    _id: message.sender._id,
                    username: message.sender.username,
                    profilePicture: message.sender.profilePicture,
                    profilePictureType: message.sender.profilePictureType,
                    email: message.sender.email
                },
                room: message.room,
                messageType: message.messageType,
                createdAt: message.createdAt
            };

            console.log('📤 Enviando mensaje a sala:', data.room);
            io.to(data.room).emit('newMessage', messageData);

            // Enviar notificaciones de ping a usuarios mencionados
            if (processedContent.mentions.length > 0) {
                processedContent.mentions.forEach(mention => {
                    const mentionedUser = connectedUsers.get(mention.user.toString());
                    if (mentionedUser && mentionedUser.id !== socket.userId) {
                        io.to(mentionedUser.socketId).emit('pingNotification', {
                            message: messageData,
                            mentionedBy: socket.username,
                            room: data.room
                        });
                    }
                });
            }

        } catch (error) {
            console.error('Error enviando mensaje público:', error);
            socket.emit('error', { message: 'Error enviando mensaje: ' + error.message });
        }
    });

    // Mensaje directo
    socket.on('directMessage', async (data) => {
        try {
            console.log('💬 Mensaje directo recibido:', data);

            if (!data.content || !data.recipientId) {
                throw new Error('Contenido o destinatario faltante');
            }

            const recipient = await User.findById(data.recipientId);
            if (!recipient) {
                socket.emit('error', { message: 'Usuario no encontrado' });
                return;
            }

            // Procesar menciones en el mensaje
            const processedContent = await processMentions(data.content);

            const message = new Message({
                content: data.content,
                processedContent: processedContent.content,
                mentions: processedContent.mentions,
                sender: socket.userId,
                recipient: data.recipientId,
                room: `dm_${[socket.userId, data.recipientId].sort().join('_')}`,
                messageType: 'direct'
            });

            await message.save();
            await message.populate('sender', 'username profilePicture profilePictureType email');
            await message.populate('recipient', 'username profilePicture profilePictureType email');
            await message.populate('mentions.user', 'username profilePicture profilePictureType');

            const messageData = {
                _id: message._id,
                content: message.content,
                processedContent: message.processedContent,
                mentions: message.mentions,
                sender: {
                    _id: message.sender._id,
                    username: message.sender.username,
                    profilePicture: message.sender.profilePicture,
                    profilePictureType: message.sender.profilePictureType,
                    email: message.sender.email
                },
                recipient: {
                    _id: message.recipient._id,
                    username: message.recipient.username,
                    profilePicture: message.recipient.profilePicture,
                    profilePictureType: message.recipient.profilePictureType,
                    email: message.recipient.email
                },
                room: message.room,
                messageType: message.messageType,
                createdAt: message.createdAt
            };

            // Enviar a ambos usuarios (emisor y receptor)
            socket.emit('newDirectMessage', messageData);

            const recipientUser = connectedUsers.get(data.recipientId);
            if (recipientUser) {
                io.to(recipientUser.socketId).emit('newDirectMessage', messageData);

                // Notificación de mensaje directo
                io.to(recipientUser.socketId).emit('dmNotification', {
                    message: messageData,
                    from: socket.username
                });
            }

        } catch (error) {
            console.error('Error enviando mensaje directo:', error);
            socket.emit('error', { message: 'Error enviando mensaje directo: ' + error.message });
        }
    });

    // Usuario escribiendo
    socket.on('typing', (data) => {
        if (data && data.room) {
            socket.to(data.room).emit('userTyping', {
                username: socket.username,
                room: data.room,
                userId: socket.userId
            });
        }
    });

    socket.on('stopTyping', (data) => {
        if (data && data.room) {
            socket.to(data.room).emit('userStoppedTyping', {
                username: socket.username,
                room: data.room,
                userId: socket.userId
            });
        }
    });

    // Solicitar lista de usuarios
    socket.on('requestUsersList', async () => {
        try {
            const users = await getAllUsers();
            socket.emit('allUsersUpdate', users);
        } catch (error) {
            console.error('Error getting users list:', error);
        }
    });

    // Actualización de perfil
    socket.on('profileUpdated', async (updatedProfile) => {
        try {
            // Actualizar información del usuario conectado
            const userConnection = connectedUsers.get(socket.userId);
            if (userConnection) {
                userConnection.username = updatedProfile.username;
                userConnection.profilePicture = updatedProfile.profilePicture;
                userConnection.profilePictureType = updatedProfile.profilePictureType;
                connectedUsers.set(socket.userId, userConnection);
            }

            // Actualizar información del socket
            socket.username = updatedProfile.username;
            socket.profilePicture = updatedProfile.profilePicture;
            socket.profilePictureType = updatedProfile.profilePictureType;

            // Notificar a todos los usuarios de la actualización
            io.emit('userConnected', {
                users: Array.from(connectedUsers.values())
            });

            // Enviar lista actualizada de todos los usuarios
            const allUsers = await getAllUsers();
            io.emit('allUsersUpdate', allUsers);

        } catch (error) {
            console.error('Error updating profile in socket:', error);
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log(`🔴 Usuario ${socket.username} desconectado`);
        connectedUsers.delete(socket.userId);

        io.emit('userDisconnected', {
            users: Array.from(connectedUsers.values()),
            disconnectedUser: {
                id: socket.userId,
                username: socket.username
            }
        });
    });

    // Manejo de errores
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Función para obtener todos los usuarios registrados
async function getAllUsers() {
    try {
        const users = await User.find({})
            .select('username profilePicture profilePictureType email createdAt lastActive')
            .sort({ username: 1 });

        return users.map(user => ({
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            profilePictureType: user.profilePictureType,
            email: user.email,
            isOnline: connectedUsers.has(user._id.toString()),
            createdAt: user.createdAt,
            lastActive: user.lastActive
        }));
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

// Función para procesar menciones (@usuario)
async function processMentions(content) {
    try {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let processedContent = content;
        let match;

        // Encontrar todas las menciones
        while ((match = mentionRegex.exec(content)) !== null) {
            const username = match[1];
            const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

            if (user) {
                mentions.push({
                    user: user._id,
                    username: user.username,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                });

                // Reemplazar la mención en el contenido procesado
                processedContent = processedContent.replace(
                    match[0], 
                    `<span class="mention" data-user-id="${user._id}">@${user.username}</span>`
                );
            }
        }

        return {
            content: processedContent,
            mentions: mentions
        };
    } catch (error) {
        console.error('Error processing mentions:', error);
        return {
            content: content,
            mentions: []
        };
    }
}

// Manejo de errores del servidor
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Manejo de errores de Socket.IO
io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 Accede a: http://localhost:${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado');
        mongoose.connection.close(false, () => {
            console.log('✅ Conexión MongoDB cerrada');
            process.exit(0);
        });
    });
});