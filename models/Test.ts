
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ITest extends Document {
  title: string;
  price: number;
  category: string;
}

const TestSchema = new Schema<ITest>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true }
);

const Test = models.Test || model<ITest>('Test', TestSchema);
export default Test;
