import mongoose, { Schema, models, model } from 'mongoose';

const BlackoutDateSchema = new Schema({
  reason: { type: String, required: true },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true }, // YYYY-MM-DD
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default models.BlackoutDate || model('BlackoutDate', BlackoutDateSchema);
