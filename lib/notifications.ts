import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Settings from '@/models/Settings';
import dbConnect from './dbConnect';

// Notification Types
export type NotificationType = 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'REPORT_READY' | 'COUPON_APPLIED' | 'STAFF_NEW_BOOKING';

interface NotificationData {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    bookingId?: string;
    testNames?: string[];
    totalAmount?: number;
    reportLink?: string;
    scheduledDate?: Date | string;
    collectionType?: string;
}

// 1. Setup Gmail OAuth2 Transporter
const createTransporter = async () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.REPORTS_GOOGLE_CLIENT_ID,
        process.env.REPORTS_GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.REPORTS_GOOGLE_REFRESH_TOKEN
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token");
            }
            resolve(token);
        });
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: "ReportsPawarPathLabBetul@gmail.com",
            clientId: process.env.REPORTS_GOOGLE_CLIENT_ID,
            clientSecret: process.env.REPORTS_GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.REPORTS_GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken as string,
        },
    });

    return transporter;
};

// 2. WhatsApp Deep Link Generator
const getWhatsAppLink = (phone: string, text: string) => {
    // Remove non-digit chars
    const cleanPhone = phone.replace(/\D/g, '');
    // Ensure country code if missing (Basic assumption: India +91)
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
};

// 3. Main Notification Function
export async function sendSmartNotification(
    type: NotificationType,
    data: NotificationData
) {
    try {
        // A. Check Settings
        await dbConnect();
        const settings = await Settings.getSingleton();
        if (!settings) return; // Should not happen

        const { customerName, customerEmail, customerPhone, bookingId, testNames, totalAmount, reportLink, scheduledDate, collectionType } = data;
        const testsString = testNames?.join(', ') || 'Tests';

        // Format Date and Time if available
        let formattedDate = 'N/A';
        let formattedTime = 'N/A';
        if (scheduledDate) {
            const dateObj = new Date(scheduledDate);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else {
                // Fallback if it's already a formatted string but ideally it shouldn't hit here if we pass Date objects
                formattedDate = String(scheduledDate);
            }
        }

        const visitTypeDisplay = collectionType === 'home_collection' ? '🏠 Home Collection' : '🏥 Lab Visit';


        // B. Construct Messages
        let subject = '';
        let emailHtml = '';
        let waMessage = '';

        switch (type) {
            case 'STAFF_NEW_BOOKING':
                // Alert only, no patient email
                subject = '';
                emailHtml = '';
                waMessage = `🚨 *New Booking Request* 🚨\nPatient: ${customerName}\nTests: ${testsString}\nID: ${bookingId}\n_Action Required: Review in Admin Panel._`;
                break;

            case 'BOOKING_CONFIRMED':
                subject = `Booking Confirmed #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Hello ${customerName}, your booking #${bookingId} for ${testsString} is confirmed. Total: ₹${totalAmount}.`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e11d48; text-align: center;">Booking Confirmed!</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for choosing Pawar Pathology Lab. Your booking <strong>#${bookingId}</strong> has been officially confirmed.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                 <p style="margin: 5px 0;"><strong>📍 Visit Type:</strong> ${visitTypeDisplay}</p>
                <p style="margin: 5px 0;"><strong>🔬 Tests:</strong> ${testsString}</p>
                <p style="margin: 5px 0;"><strong>💰 Total Due:</strong> ₹${totalAmount}</p>
            </div>

            <br/>
            <div style="text-align: center;">
                <a href="${getWhatsAppLink(customerPhone || '', 'Hi, I have a question about my booking #' + bookingId)}" 
                   style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                   Chat with us on WhatsApp
                </a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px; text-align: center;">Pawar Pathology Lab | Betul, MP</p>
          </div>
        `;
                break;

            case 'REPORT_READY':
                subject = `Report Ready #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Great news ${customerName}! Your report for booking #${bookingId} is ready. Download here: ${reportLink}`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669; text-align: center;">Your Report is Ready!</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>The report for your recent visit (Booking #${bookingId}) is now available for download.</p>
            <br/>
            <div style="text-align: center;">
                <a href="${reportLink}" 
                   style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                   Download Secure Report
                </a>
            </div>
            <br/><br/>
            <p>If you have questions, chat with our pathologist directly:</p>
            <div style="text-align: center;">
                <a href="${getWhatsAppLink(customerPhone || '', 'Hi, I have a question about my report #' + bookingId)}" 
                   style="color: #25D366; font-weight: bold; text-decoration: none;">
                   Chat on WhatsApp
                </a>
            </div>
          </div>
        `;
                break;

            case 'BOOKING_CANCELLED':
                subject = `Booking Cancelled #${bookingId}`;
                waMessage = `Your booking #${bookingId} has been cancelled as requested.`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
             <h2>Booking Cancelled</h2>
             <p>Your booking #${bookingId} was cancelled.</p>
          </div>
        `;
                break;
        }

        // C. Send Email (If enabled and content exists)
        if (settings.emailEnabled && customerEmail && subject && emailHtml && process.env.REPORTS_GOOGLE_CLIENT_ID) {
            try {
                const transporter = await createTransporter();
                await transporter.sendMail({
                    from: '"Pawar Pathology Lab" <ReportsPawarPathLabBetul@gmail.com>',
                    to: customerEmail,
                    subject: subject,
                    html: emailHtml,
                });
                console.log(`[Notification] Email sent to ${customerEmail}`);
            } catch (err) {
                console.error('[Notification] Email failed:', err);
            }
        }

        // D. Send WhatsApp (Official API)
        if (settings.whatsappEnabled && settings.whatsappOfficialEnabled && customerPhone && process.env.WHATSAPP_TOKEN && type !== 'STAFF_NEW_BOOKING') {
            // Placeholder for Cloud API - assumes standard template structure
            // In a real scenario, we'd POST to graph.facebook.com
            // Note: STAFF_NEW_BOOKING is strictly internal, so we skip patient WA
            console.log(`[Notification] WhatsApp Cloud API triggered for ${customerPhone}`);
        }

        // E. Send Telegram (Staff Alerts)
        if (settings.telegramEnabled && settings.telegramAdminChatId && process.env.TELEGRAM_BOT_TOKEN) {
            const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            // Use specific alert message for staff booking, else reuse the WA message or a generic one
            const text = type === 'STAFF_NEW_BOOKING' ? waMessage : `*Alert: ${type}*\n${waMessage}`;

            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: settings.telegramAdminChatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            });

            const result = await response.json();
            if (!response.ok) {
                console.error(`[Notification] Telegram API Error: ${result.description}`);
            } else {
                console.log(`[Notification] Telegram alert delivered to Chat ID: ${settings.telegramAdminChatId}`);
            }

        } else {
            // Debug log mostly for development, cleaner production logs
            if (process.env.NODE_ENV === 'development') {
                console.log('[Notification] Telegram skipped. Settings:', {
                    enabled: settings.telegramEnabled,
                    hasId: !!settings.telegramAdminChatId,
                    hasToken: !!process.env.TELEGRAM_BOT_TOKEN
                });
            }
        }

    } catch (error) {
        console.error('[Notification] Smart Hub Error:', error);
    }
}
