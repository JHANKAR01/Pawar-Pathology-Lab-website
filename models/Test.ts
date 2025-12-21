import mongoose, { Schema, models, model } from 'mongoose';

const TestSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  testCode: String,
  description: String
}, { timestamps: true });

export default models.Test || model('Test', TestSchema);