
import mongoose, { Schema, Document, models, model } from 'mongoose';

/**
 * ISettings Interface
 * Represents global application configuration.
 * Designed as a Singleton (we typically only fetch the first document).
 */
export interface ISettings extends Document {
  requireVerification: boolean; // Controls if reports need Admin approval before patient can view
  maintenanceMode: boolean;     // Emergency kill-switch for the app
  announcement?: string;        // Global banner message text
}

const SettingsSchema = new Schema<ISettings>(
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
SettingsSchema.statics.getSingleton = async function() {
  const settings = await this.findOne();
  if (settings) {
    return settings;
  }
  // Create default if none exists
  return await this.create({ requireVerification: true });
};

const Settings = models.Settings || model<ISettings>('Settings', SettingsSchema);

export default Settings;
