import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'partner', 'patient'], default: 'patient' },
  operationalRole: { type: String, default: 'none' },
  phone: String,
  email: { type: String, required: true, unique: true },
  address: String
}, { timestamps: true });

export default models.User || model('User', UserSchema);