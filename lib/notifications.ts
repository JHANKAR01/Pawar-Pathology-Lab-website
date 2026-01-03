import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Settings from '@/models/Settings';
import dbConnect from './dbConnect';

// Notification Types
export type NotificationType = 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'REPORT_READY' | 'COUPON_APPLIED';

interface NotificationData {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    bookingId?: string;
    testNames?: string[];
    totalAmount?: number;
    reportLink?: string;
}

// 1. Setup Gmail OAuth2 Transporter
const createTransporter = async () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
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
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
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

        const { customerName, customerEmail, customerPhone, bookingId, testNames, totalAmount, reportLink } = data;
        const testsString = testNames?.join(', ') || 'Tests';

        // B. Construct Messages
        let subject = '';
        let emailHtml = '';
        let waMessage = '';

        switch (type) {
            case 'BOOKING_CONFIRMED':
                subject = `Booking Confirmed #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Hello ${customerName}, your booking #${bookingId} for ${testsString} is confirmed. Total: ₹${totalAmount}.`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #e11d48;">Booking Confirmed!</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for choosing Pawar Pathology Lab. Your booking <strong>#${bookingId}</strong> has been confirmed.</p>
            <p><strong>Tests:</strong> ${testsString}</p>
            <p><strong>Total Due:</strong> ₹${totalAmount}</p>
            <br/>
            <a href="${getWhatsAppLink(customerPhone || '', 'Hi, I have a question about my booking #' + bookingId)}" 
               style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Chat with us on WhatsApp
            </a>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Pawar Pathology Lab | Betul, MP</p>
          </div>
        `;
                break;

            case 'REPORT_READY':
                subject = `Report Ready #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Great news ${customerName}! Your report for booking #${bookingId} is ready. Download here: ${reportLink}`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #059669;">Your Report is Ready!</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>The report for your recent visit (Booking #${bookingId}) is now available for download.</p>
            <br/>
            <a href="${reportLink}" 
               style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Download Secure Report
            </a>
            <br/><br/>
            <p>If you have questions, chat with our pathologist directly:</p>
            <a href="${getWhatsAppLink(customerPhone || '', 'Hi, I have a question about my report #' + bookingId)}" 
               style="color: #25D366; font-weight: bold; text-decoration: none;">
               Chat on WhatsApp
            </a>
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

        // C. Send Email (If enabled)
        if (settings.emailEnabled && customerEmail && process.env.GOOGLE_CLIENT_ID) {
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
        if (settings.whatsappEnabled && settings.whatsappOfficialEnabled && customerPhone && process.env.WHATSAPP_TOKEN) {
            // Placeholder for Cloud API - assumes standard template structure
            // In a real scenario, we'd POST to graph.facebook.com
            console.log(`[Notification] WhatsApp Cloud API triggered for ${customerPhone}`);
        }

        // E. Send Telegram (Staff Alerts)
        if (settings.telegramEnabled && settings.telegramAdminChatId && process.env.TELEGRAM_BOT_TOKEN) {
            const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
            const text = `🚨 *New Alert* 🚨\nType: ${type}\n${waMessage}`; // Reuse WA message text for brevity

            await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: settings.telegramAdminChatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            }).catch(err => console.error('[Notification] Telegram failed:', err));
        }

    } catch (error) {
        console.error('[Notification] Smart Hub Error:', error);
    }
}
