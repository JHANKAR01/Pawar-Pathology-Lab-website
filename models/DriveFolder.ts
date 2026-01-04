import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IDriveFolder extends Document {
    monthKey: string; // e.g., "2026-JAN"
    parentFolderId: string;
    dailyFolders: {
        date: string; // e.g., "01", "02"
        folderId: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const DriveFolderSchema = new Schema<IDriveFolder>(
    {
        monthKey: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        parentFolderId: {
            type: String,
            required: true
        },
        dailyFolders: [
            {
                date: { type: String, required: true },
                folderId: { type: String, required: true }
            }
        ]
    },
    { timestamps: true }
);

export default models.DriveFolder || model<IDriveFolder>('DriveFolder', DriveFolderSchema);
