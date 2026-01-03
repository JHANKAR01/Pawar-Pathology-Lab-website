import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        return /^\d{10}$/.test(v);
      },
      message: 'Phone number must be exactly 10 digits.'
    }
  },
  role: { type: String, enum: ['admin', 'partner', 'patient'], default: 'patient' },
  operationalRole: { type: String, default: 'none' },
  address: String,
  isVerified: { type: Boolean, default: false },
  needsProfileCompletion: { type: Boolean, default: false }
}, { timestamps: true });

export default models.User || model('User', UserSchema);