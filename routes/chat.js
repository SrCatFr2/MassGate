const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Obtener mensajes de una sala con paginación
router.get('/messages/:room', auth, async (req, res) => {
    try {
        const { room } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await Message.find({ 
            room,
            deleted: { $ne: true }
        })
        .populate('sender', 'username profilePicture profilePictureType email')
        .populate('recipient', 'username profilePicture profilePictureType email')
        .populate('mentions.user', 'username profilePicture profilePictureType')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

        // Invertir el orden para mostrar del más antiguo al más nuevo
        const reversedMessages = messages.reverse();

        res.json({
            messages: reversedMessages,
            hasMore: messages.length === limit,
            currentPage: page,
            totalMessages: await Message.countDocuments({ 
                room,
                deleted: { $ne: true }
            })
        });
    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ message: 'Error obteniendo mensajes' });
    }
});

// Obtener mensajes directos entre dos usuarios
router.get('/direct/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const roomId = `dm_${[currentUserId, userId].sort().join('_')}`;

        const messages = await Message.find({ 
            room: roomId,
            messageType: 'direct',
            deleted: { $ne: true }
        })
        .populate('sender', 'username profilePicture profilePictureType email')
        .populate('recipient', 'username profilePicture profilePictureType email')
        .populate('mentions.user', 'username profilePicture profilePictureType')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

        const reversedMessages = messages.reverse();

        res.json({
            messages: reversedMessages,
            hasMore: messages.length === limit,
            currentPage: page,
            totalMessages: await Message.countDocuments({ 
                room: roomId,
                messageType: 'direct',
                deleted: { $ne: true }
            })
        });
    } catch (error) {
        console.error('Error obteniendo mensajes directos:', error);
        res.status(500).json({ message: 'Error obteniendo mensajes directos' });
    }
});

// Obtener todas las salas
router.get('/rooms', auth, async (req, res) => {
    try {
        const rooms = await Room.find({ isPrivate: false })
            .populate('createdBy', 'username profilePicture profilePictureType')
            .populate('members', 'username profilePicture profilePictureType')
            .sort({ createdAt: -1 });

        res.json(rooms);
    } catch (error) {
        console.error('Error obteniendo salas:', error);
        res.status(500).json({ message: 'Error obteniendo salas' });
    }
});

// Crear nueva sala
router.post('/rooms', auth, async (req, res) => {
    try {
        const { name, description, isPrivate = false } = req.body;

        if (!name || name.trim().length < 3) {
            return res.status(400).json({ message: 'El nombre debe tener al menos 3 caracteres' });
        }

        // Limpiar el nombre (sin espacios, caracteres especiales)
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

        const existingRoom = await Room.findOne({ name: cleanName });
        if (existingRoom) {
            return res.status(400).json({ message: 'Ya existe una sala con ese nombre' });
        }

        const room = new Room({
            name: cleanName,
            displayName: name.trim(),
            description: description?.trim() || '',
            isPrivate,
            createdBy: req.user.userId,
            members: [req.user.userId]
        });

        await room.save();
        await room.populate('createdBy', 'username profilePicture profilePictureType');

        res.status(201).json(room);
    } catch (error) {
        console.error('Error creando sala:', error);
        res.status(500).json({ message: 'Error creando sala' });
    }
});

// Obtener todos los usuarios registrados (con información de perfil)
router.get('/users', auth, async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        let query = { _id: { $ne: req.user.userId } };

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('username profilePicture profilePictureType email status customStatus isOnline lastActive createdAt')
            .sort({ username: 1 })
            .limit(limit)
            .skip(skip);

        const totalUsers = await User.countDocuments(query);

        res.json({
            users,
            hasMore: users.length === limit,
            currentPage: page,
            totalUsers
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ message: 'Error obteniendo usuarios' });
    }
});

// Buscar usuarios para menciones
router.get('/users/search', auth, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 1) {
            return res.json([]);
        }

        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: req.user.userId }
        })
        .select('username profilePicture profilePictureType')
        .limit(10)
        .sort({ username: 1 });

        res.json(users);
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        res.status(500).json({ message: 'Error buscando usuarios' });
    }
});

// Obtener menciones del usuario actual
router.get('/mentions', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const mentions = await Message.find({
            'mentions.user': req.user.userId,
            deleted: { $ne: true }
        })
        .populate('sender', 'username profilePicture profilePictureType')
        .populate('mentions.user', 'username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

        res.json({
            mentions,
            hasMore: mentions.length === limit,
            currentPage: page
        });
    } catch (error) {
        console.error('Error obteniendo menciones:', error);
        res.status(500).json({ message: 'Error obteniendo menciones' });
    }
});

// Marcar mensaje como leído
router.post('/messages/:messageId/read', auth, async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Mensaje no encontrado' });
        }

        // Aquí puedes implementar lógica para marcar como leído
        // Por ejemplo, agregar a un array de readBy

        res.json({ message: 'Mensaje marcado como leído' });
    } catch (error) {
        console.error('Error marcando mensaje como leído:', error);
        res.status(500).json({ message: 'Error marcando mensaje como leído' });
    }
});

module.exports = router;