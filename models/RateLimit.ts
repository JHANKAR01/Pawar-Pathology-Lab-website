import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
        unique: true, // Index for faster lookups
    },
    count: {
        type: Number,
        default: 0,
    },
    lastRequest: {
        type: Date,
        default: Date.now,
        expires: 60, // TTL index: documents expire 60 seconds after lastRequest
    },
});

// Prevent model recompilation error in development
const RateLimit = mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);

export default RateLimit;
