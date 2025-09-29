const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload, processImage, deleteOldImage } = require('../config/upload');
const validator = require('validator');

const router = express.Router();

// Obtener perfil del usuario
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user.getFullProfile());
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error obteniendo perfil' });
    }
});

// Obtener perfil público de otro usuario
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user.getPublicProfile());
    } catch (error) {
        console.error('Error obteniendo perfil público:', error);
        res.status(500).json({ message: 'Error obteniendo perfil público' });
    }
});

// Actualizar foto de perfil por archivo
router.post('/picture/upload', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se recibió ningún archivo' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Eliminar imagen anterior si existe
        if (user.profilePictureType === 'upload' && user.profilePicture) {
            await deleteOldImage(user.profilePicture);
        }

        // Procesar nueva imagen
        const imagePath = await processImage(req.file.buffer, req.user.userId);

        // Actualizar usuario
        user.profilePicture = imagePath;
        user.profilePictureType = 'upload';
        await user.save();

        const updatedProfile = user.getFullProfile();

        res.json({
            message: 'Foto de perfil actualizada exitosamente',
            profilePicture: imagePath,
            profilePictureType: 'upload',
            user: updatedProfile
        });
    } catch (error) {
        console.error('Error subiendo foto:', error);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'El archivo es demasiado grande. Máximo 2MB.' });
        }
        res.status(500).json({ message: error.message });
    }
});

// Actualizar foto de perfil por URL
router.post('/picture/url', auth, async (req, res) => {
    try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: 'URL de imagen requerida' });
        }

        // Validar que sea una URL válida
        if (!validator.isURL(imageUrl)) {
            return res.status(400).json({ message: 'URL no válida' });
        }

        // Verificar que la URL sea de una imagen
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const hasImageExtension = imageExtensions.some(ext => 
            imageUrl.toLowerCase().includes(ext)
        );

        const allowedDomains = ['imgur.com', 'cloudinary.com', 'githubusercontent.com', 'discord.com', 'discordapp.com'];
        const hasAllowedDomain = allowedDomains.some(domain => imageUrl.includes(domain));

        if (!hasImageExtension && !hasAllowedDomain) {
            return res.status(400).json({ 
                message: 'La URL debe ser de una imagen válida o de un dominio permitido' 
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Eliminar imagen anterior si era subida
        if (user.profilePictureType === 'upload' && user.profilePicture) {
            await deleteOldImage(user.profilePicture);
        }

        // Actualizar usuario
        user.profilePicture = imageUrl;
        user.profilePictureType = 'url';
        await user.save();

        const updatedProfile = user.getFullProfile();

        res.json({
            message: 'Foto de perfil actualizada exitosamente',
            profilePicture: imageUrl,
            profilePictureType: 'url',
            user: updatedProfile
        });
    } catch (error) {
        console.error('Error actualizando foto por URL:', error);
        res.status(500).json({ message: 'Error actualizando foto de perfil' });
    }
});

// Eliminar foto de perfil
router.delete('/picture', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Eliminar imagen si era subida
        if (user.profilePictureType === 'upload' && user.profilePicture) {
            await deleteOldImage(user.profilePicture);
        }

        // Resetear a default
        user.profilePicture = null;
        user.profilePictureType = 'default';
        await user.save();

        const updatedProfile = user.getFullProfile();

        res.json({
            message: 'Foto de perfil eliminada exitosamente',
            profilePicture: null,
            profilePictureType: 'default',
            user: updatedProfile
        });
    } catch (error) {
        console.error('Error eliminando foto:', error);
        res.status(500).json({ message: 'Error eliminando foto de perfil' });
    }
});

// Actualizar información del perfil
router.put('/update', auth, async (req, res) => {
    try {
        const { username, customStatus, status } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar username si se proporciona
        if (username && username.trim().length >= 3) {
            const trimmedUsername = username.trim();

            // Verificar si el username ya existe (si es diferente al actual)
            if (trimmedUsername !== user.username) {
                const existingUser = await User.findOne({ 
                    username: trimmedUsername,
                    _id: { $ne: req.user.userId }
                });

                if (existingUser) {
                    return res.status(400).json({ 
                        message: 'El nombre de usuario ya está en uso' 
                    });
                }

                user.username = trimmedUsername;
            }
        }

        // Actualizar estado personalizado
        if (customStatus !== undefined) {
            user.customStatus = customStatus.trim().substring(0, 100);
        }

        // Actualizar estado
        if (status && ['online', 'away', 'busy', 'invisible'].includes(status)) {
            user.status = status;
        }

        await user.save();
        const updatedProfile = user.getFullProfile();

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: updatedProfile
        });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error actualizando perfil' });
    }
});

// Actualizar configuraciones
router.put('/settings', auth, async (req, res) => {
    try {
        const { notifications, privacy } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (notifications) {
            user.settings.notifications = { ...user.settings.notifications, ...notifications };
        }

        if (privacy) {
            user.settings.privacy = { ...user.settings.privacy, ...privacy };
        }

        await user.save();

        res.json({
            message: 'Configuraciones actualizadas exitosamente',
            settings: user.settings
        });
    } catch (error) {
        console.error('Error actualizando configuraciones:', error);
        res.status(500).json({ message: 'Error actualizando configuraciones' });
    }
});

module.exports = router;