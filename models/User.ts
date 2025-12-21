
import mongoose, { Schema, Document, models, model } from 'mongoose';
import { UserRole } from '@/types';

export interface IUser extends Document {
  username: string;
  name: string;
  password?: string;
  role: UserRole;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false }, // select: false to hide by default
    role: { type: String, enum: Object.values(UserRole), required: true },
  },
  { timestamps: true }
);

// Note: In a real app, you'd add a pre-save hook for password hashing
// UserSchema.pre('save', async function(next) { ... });

const User = models.User || model<IUser>('User', UserSchema);
export default User;
