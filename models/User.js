const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePicture: {
        type: String,
        default: null
    },
    profilePictureType: {
        type: String,
        enum: ['upload', 'url', 'default'],
        default: 'default'
    },
    status: {
        type: String,
        enum: ['online', 'away', 'busy', 'invisible'],
        default: 'online'
    },
    customStatus: {
        type: String,
        maxlength: 100,
        default: ''
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    settings: {
        notifications: {
            mentions: { type: Boolean, default: true },
            directMessages: { type: Boolean, default: true },
            sounds: { type: Boolean, default: true }
        },
        privacy: {
            showOnlineStatus: { type: Boolean, default: true },
            allowDirectMessages: { type: Boolean, default: true }
        }
    }
});

// Índice de texto para búsqueda
userSchema.index({ username: 'text', email: 'text' });

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Actualizar lastActive al guardar
userSchema.pre('save', function(next) {
    if (this.isOnline) {
        this.lastActive = new Date();
    }
    next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener datos públicos del usuario
userSchema.methods.getPublicProfile = function() {
    return {
        _id: this._id,
        username: this.username,
        profilePicture: this.profilePicture,
        profilePictureType: this.profilePictureType,
        status: this.status,
        customStatus: this.customStatus,
        isOnline: this.isOnline,
        lastActive: this.lastActive,
        createdAt: this.createdAt
    };
};

// Método para obtener perfil completo (solo para el mismo usuario)
userSchema.methods.getFullProfile = function() {
    return {
        _id: this._id,
        username: this.username,
        email: this.email,
        profilePicture: this.profilePicture,
        profilePictureType: this.profilePictureType,
        status: this.status,
        customStatus: this.customStatus,
        isOnline: this.isOnline,
        lastActive: this.lastActive,
        createdAt: this.createdAt,
        settings: this.settings
    };
};

module.exports = mongoose.model('User', userSchema);