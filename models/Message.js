const mongoose = require('mongoose');

const mentionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    startIndex: {
        type: Number,
        required: true
    },
    endIndex: {
        type: Number,
        required: true
    }
});

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    processedContent: {
        type: String,
        required: true,
        maxlength: 3000
    },
    mentions: [mentionSchema],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: String,
        required: true,
        index: true
    },
    messageType: {
        type: String,
        enum: ['public', 'direct'],
        default: 'public',
        index: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return this.messageType === 'direct';
        }
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Índices compuestos para mejor performance
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ 'mentions.user': 1, createdAt: -1 });

// Middleware para actualizar processedContent si content cambia
messageSchema.pre('save', function(next) {
    if (this.isModified('content') && !this.isModified('processedContent')) {
        this.processedContent = this.content;
    }
    next();
});

module.exports = mongoose.model('Message', messageSchema);