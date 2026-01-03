import mongoose, { Schema, models, model } from 'mongoose';

const OTPSchema = new Schema({
    email: { type: String, required: true },
    code: { type: String, required: true },
    purpose: {
        type: String,
        enum: ['signup', 'password_reset'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' }
    },
    verified: { type: Boolean, default: false }
}, { timestamps: true });

export default models.OTP || model('OTP', OTPSchema);
