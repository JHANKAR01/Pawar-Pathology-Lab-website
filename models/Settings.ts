
import mongoose, { Schema, Document, models, model } from 'mongoose';
import { ISettings } from '@/types';

const SettingsSchema = new Schema<ISettings & Document>(
  {
    requireVerification: {
      type: Boolean,
      default: true,
      required: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    announcement: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

/**
 * Helper method to ensure a default settings document exists.
 * Can be called during app initialization.
 */
SettingsSchema.statics.getSingleton = async function () {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  // Create default if none exists
  return await this.create({ requireVerification: true });
};

interface SettingsModel extends mongoose.Model<ISettings & Document> {
  getSingleton(): Promise<ISettings & Document>;
}

const Settings = (models.Settings as SettingsModel) || model<ISettings & Document, SettingsModel>('Settings', SettingsSchema);

export default Settings;
