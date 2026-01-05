
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
    },
    smsEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    serviceRadius: { type: Number, default: 10 },
    locationFencingEnabled: { type: Boolean, default: false },
    distanceType: { type: String, enum: ['road', 'displacement'], default: 'displacement' }, // Added distanceType
    blockSundays: { type: Boolean, default: true },

    // Detailed Maintenance
    maintenanceModeUser: { type: Boolean, default: false },
    maintenanceModePartner: { type: Boolean, default: false },

    // Smart Notification Hub
    whatsappEnabled: { type: Boolean, default: true },
    whatsappOfficialEnabled: { type: Boolean, default: false }, // Default false (link only)
    telegramEnabled: { type: Boolean, default: false },
    telegramAdminChatId: { type: String, default: '' },

    // Role-based Telegram Toggles
    telegramEnabledAdmin: { type: Boolean, default: false },
    telegramEnabledPartner: { type: Boolean, default: false },
    telegramEnabledUser: { type: Boolean, default: false },

    // Drive Provisioning
    lastProvisionedDate: { type: Date },
    autoProvisionEnabled: { type: Boolean, default: false }
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
