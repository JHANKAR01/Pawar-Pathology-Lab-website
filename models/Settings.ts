
import mongoose, { Schema, Document, models, model } from 'mongoose';
import { ISettings } from '@/types';

const SettingsSchema = new Schema<ISettings & Document>(
  {
    // Global App Control
    appControl: {
      requireVerification: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
      maintenanceModeUser: { type: Boolean, default: false },
      maintenanceModePartner: { type: Boolean, default: false },
      blockSundays: { type: Boolean, default: true },
      recurringBookingsEnabled: { type: Boolean, default: false }, // New Toggle
    },
    // Logistics & Fencing
    logistics: {
      serviceRadius: { type: Number, default: 10 },
      locationFencingEnabled: { type: Boolean, default: false },
      distanceType: { type: String, enum: ['road', 'displacement'], default: 'displacement' },
    },
    // Smart Notification Hub
    notifications: {
      smsEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: true },
      whatsappOfficialEnabled: { type: Boolean, default: false },
      telegramEnabled: { type: Boolean, default: false },
      telegramAdminChatId: { type: String, default: '' },
      toggles: {
        admin: { type: Boolean, default: false },
        partner: { type: Boolean, default: false },
        user: { type: Boolean, default: false },
      }
    },
    // Infrastructure
    drive: {
      lastProvisionedDate: { type: Date },
      autoProvisionEnabled: { type: Boolean, default: false }
    },
    // Security & Limits
    rateLimit: {
      ipRequestsPerMinute: { type: Number, default: 60 },
      globalRequestsPerMinute: { type: Number, default: 1000 }
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
  return await this.create({
    appControl: { requireVerification: true, maintenanceMode: false, blockSundays: true },
    logistics: { serviceRadius: 10, distanceType: 'displacement' },
    notifications: { smsEnabled: true, emailEnabled: true, whatsappEnabled: true },
    rateLimit: { ipRequestsPerMinute: 60, globalRequestsPerMinute: 1000 }
  });
};

interface SettingsModel extends mongoose.Model<ISettings & Document> {
  getSingleton(): Promise<ISettings & Document>;
}

const Settings = (models.Settings as SettingsModel) || model<ISettings & Document, SettingsModel>('Settings', SettingsSchema);

export default Settings;
