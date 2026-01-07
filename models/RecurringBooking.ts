import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IRecurringBooking extends Document {
    userId?: mongoose.Schema.Types.ObjectId;
    patientName: string;
    contactNumber?: string;
    email?: string;
    bookedByEmail?: string; // To track who created it
    tests: {
        id: string;
        title: string;
        price: number;
        category: string;
    }[];
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfMonth?: number; // 1-31 (for monthly)
    dayOfWeek?: number; // 0-6 (for weekly)
    nextRunDate: Date;
    status: 'active' | 'paused' | 'cancelled';
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const RecurringBookingSchema = new Schema<IRecurringBooking>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        patientName: { type: String, required: true },
        contactNumber: { type: String },
        email: { type: String },
        bookedByEmail: { type: String },
        tests: [{
            id: { type: String },
            title: { type: String },
            price: { type: Number },
            category: { type: String }
        }],
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            required: true
        },
        dayOfMonth: { type: Number, min: 1, max: 31 },
        dayOfWeek: { type: Number, min: 0, max: 6 },
        nextRunDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['active', 'paused', 'cancelled'],
            default: 'active'
        },
        address: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    { timestamps: true }
);

export default models.RecurringBooking || model<IRecurringBooking>('RecurringBooking', RecurringBookingSchema);
