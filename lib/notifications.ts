import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Settings from '@/models/Settings';
import dbConnect from './dbConnect';

// Notification Types
export type NotificationType = 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'REPORT_READY' | 'COUPON_APPLIED' | 'STAFF_NEW_BOOKING' | 'OTP_VERIFICATION' | 'PARTNER_ASSIGNMENT';

interface NotificationData {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    bookingId?: string;
    testNames?: string[];
    totalAmount?: number;
    reportLink?: string;
    scheduledDate?: Date | string;
    collectionType?: string;
    otpCode?: string;
    partnerTelegramChatId?: string;
    userTelegramChatId?: string;
}

// Global Footer for all emails
const LAB_FOOTER = `
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
    <p style="margin: 0; font-weight: bold; color: #334155;">Pawar Pathology Lab</p>
    <p style="margin: 5px 0;">Link Road, Civil Lines, Betul, Madhya Pradesh - 460001</p>
    <p style="margin: 5px 0;">Contact: <a href="tel:+919755553339" style="color: #64748b; text-decoration: none;">+91 9755553339</a> | Email: <a href="mailto:support@pawarlab.com" style="color: #64748b; text-decoration: none;">support@pawarlab.com</a></p>
  </div>
`;

// 1. Setup Gmail OAuth2 Transporter
// accountType: 'REPORTS' (Default) or 'OTP'
const createTransporter = async (accountType: 'REPORTS' | 'OTP' = 'REPORTS') => {

    let clientId, clientSecret, refreshToken, userEmail;

    if (accountType === 'OTP') {
        clientId = process.env.OTP_GOOGLE_CLIENT_ID;
        clientSecret = process.env.OTP_GOOGLE_CLIENT_SECRET;
        refreshToken = process.env.OTP_GOOGLE_REFRESH_TOKEN;
        userEmail = "otppawarpathlabbetul@gmail.com";

        // Fallback for development if OTP vars aren't set yet, use Reports (Warning: Not for prod)
        if (!clientId) {
            console.warn("OTP_GOOGLE_CLIENT_ID not found, falling back to REPORTS credentials for testing.");
            clientId = process.env.REPORTS_GOOGLE_CLIENT_ID;
            clientSecret = process.env.REPORTS_GOOGLE_CLIENT_SECRET;
            refreshToken = process.env.REPORTS_GOOGLE_REFRESH_TOKEN;
            userEmail = "ReportsPawarPathLabBetul@gmail.com";
        }

    } else {
        clientId = process.env.REPORTS_GOOGLE_CLIENT_ID;
        clientSecret = process.env.REPORTS_GOOGLE_CLIENT_SECRET;
        refreshToken = process.env.REPORTS_GOOGLE_REFRESH_TOKEN;
        userEmail = "ReportsPawarPathLabBetul@gmail.com";
    }

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(`Missing OAuth2 credentials for ${accountType} account.`);
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
            if (err) {
                reject("Failed to create access token for " + accountType);
            }
            resolve(token);
        });
    });

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: userEmail,
            clientId: clientId,
            clientSecret: clientSecret,
            refreshToken: refreshToken,
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

        // OTP verification sends regardless of global settings, others check settings
        if (type !== 'OTP_VERIFICATION' && !settings) return;

        const { customerName, customerEmail, customerPhone, bookingId, testNames, totalAmount, reportLink, scheduledDate, collectionType, otpCode, partnerTelegramChatId, userTelegramChatId } = data;
        const testsString = testNames?.join(', ') || 'Tests';

        // Format Date and Time
        let formattedDate = 'N/A';
        let formattedTime = 'N/A';
        if (scheduledDate) {
            const dateObj = new Date(scheduledDate);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            } else {
                formattedDate = String(scheduledDate);
            }
        }

        const visitTypeDisplay = collectionType === 'home_collection' ? '🏠 Home Collection' : '🏥 Lab Visit';


        // B. Construct Messages
        let subject = '';
        let emailHtml = '';
        let waMessage = '';
        let telegramMessage = '';
        let accountType: 'REPORTS' | 'OTP' = 'REPORTS';

        switch (type) {
            case 'OTP_VERIFICATION':
                accountType = 'OTP';
                subject = `${otpCode} is your verification code - Pawar Pathology Lab`;
                waMessage = '';
                emailHtml = `
                    <div style="font-family: sans-serif; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto; background-color: #ffffff;">
                        <h2 style="color: #1e293b; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
                        <p style="color: #475569; text-align: center; font-size: 16px;">Use the code below to securely sign up for Pawar Pathology Lab.</p>
                        
                        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 30px 0; text-align: center;">
                            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 4px; color: #e11d48;">${otpCode}</span>
                        </div>
                        
                        <p style="color: #94a3b8; text-align: center; font-size: 14px;">This code expires in 5 minutes. If you didn't request this, please ignore this email.</p>
                        ${LAB_FOOTER}
                    </div>
                `;
                break;

            case 'STAFF_NEW_BOOKING':
                // Alert only, no patient email
                subject = '';
                emailHtml = '';
                waMessage = `🚨 *New Booking Request* 🚨\nPatient: ${customerName}\nTests: ${testsString}\nID: ${bookingId}\n_Action Required: Review in Admin Panel._`;
                telegramMessage = waMessage;
                break;

            case 'PARTNER_ASSIGNMENT':
                // New Type for Partners
                subject = '';
                emailHtml = '';
                waMessage = '';
                telegramMessage = `🤝 *New Assignment* 🤝\nBooking #${bookingId}\nPatient: ${customerName}\nTests: ${testsString}\nDate: ${formattedDate} @ ${formattedTime}\nType: ${visitTypeDisplay}\n\nPlease check your dashboard.`;
                break;

            case 'BOOKING_CONFIRMED':
                subject = `Booking Confirmed #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Hello ${customerName}, your booking #${bookingId} for ${testsString} is confirmed. Total: ₹${totalAmount}.`;
                telegramMessage = `✅ *Booking Confirmed* ✅\nHi ${customerName}, your booking #${bookingId} is confirmed.\nTests: ${testsString}\nTotal: ₹${totalAmount}`;
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
            ${LAB_FOOTER}
          </div>
        `;
                break;

            case 'REPORT_READY':
                subject = `Report Ready #${bookingId} - Pawar Pathology Lab`;
                waMessage = `Great news ${customerName}! Your report for booking #${bookingId} is ready. Download here: ${reportLink}`;
                telegramMessage = `📄 *Report Ready* 📄\nHi ${customerName}, your report for #${bookingId} is ready.\nDownload: ${reportLink}`;
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
            ${LAB_FOOTER}
          </div>
        `;
                break;

            case 'BOOKING_CANCELLED':
                subject = `Booking Cancelled #${bookingId}`;
                waMessage = `Your booking #${bookingId} has been cancelled as requested.`;
                telegramMessage = `❌ *Booking Cancelled* ❌\nBooking #${bookingId} has been cancelled.`;
                emailHtml = `
          <div style="font-family: sans-serif; padding: 20px;">
             <h2>Booking Cancelled</h2>
             <p>Your booking #${bookingId} was cancelled.</p>
             ${LAB_FOOTER}
          </div>
        `;
                break;
        }

        // C. Send Email (If enabled and content exists)
        // Ensure OTP always sends regardless of marketing toggle
        const shouldSendEmail = (type === 'OTP_VERIFICATION') || (settings?.emailEnabled && customerEmail);

        if (shouldSendEmail && customerEmail && subject && emailHtml) {
            try {
                const transporter = await createTransporter(accountType);
                await transporter.sendMail({
                    from: accountType === 'OTP'
                        ? '"Pawar Lab Security" <SecurityPawarLab@gmail.com>'
                        : '"Pawar Pathology Lab" <ReportsPawarPathLabBetul@gmail.com>',
                    to: customerEmail,
                    subject: subject,
                    html: emailHtml,
                });
                console.log(`[Notification] ${accountType} Email sent to ${customerEmail}`);
            } catch (err) {
                console.error(`[Notification] ${accountType} Email failed:`, err);
            }
        }

        // D. Send WhatsApp (Official API) - Skip for OTP
        if (settings?.whatsappEnabled && settings?.whatsappOfficialEnabled && customerPhone && process.env.WHATSAPP_TOKEN && type !== 'STAFF_NEW_BOOKING' && type !== 'OTP_VERIFICATION' && type !== 'PARTNER_ASSIGNMENT') {
            console.log(`[Notification] WhatsApp Cloud API triggered for ${customerPhone}`);
            // TODO: Implement actual WA Cloud API call here when credentials available
        }

        // E. Send Telegram (Role Based)
        if (settings?.telegramEnabled && process.env.TELEGRAM_BOT_TOKEN && type !== 'OTP_VERIFICATION') {
            const sendTelegram = async (chatId: string, txt: string) => {
                try {
                    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
                    const response = await fetch(telegramUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: txt, parse_mode: 'Markdown' })
                    });
                    if (!response.ok) {
                        const r = await response.json();
                        console.error(`[Telegram] Error: ${r.description}`);
                    }
                } catch (e) {
                    console.error('[Telegram] Fetch Error:', e);
                }
            };

            // 1. Admin Alerts
            if (settings.telegramEnabledAdmin && settings.telegramAdminChatId && (type === 'STAFF_NEW_BOOKING' || type === 'BOOKING_CANCELLED')) {
                // Admin gets new bookings and cancellations alerts
                await sendTelegram(settings.telegramAdminChatId, telegramMessage);
            }

            // 2. Partner Alerts (Direct)
            if (settings.telegramEnabledPartner && type === 'PARTNER_ASSIGNMENT' && partnerTelegramChatId) {
                await sendTelegram(partnerTelegramChatId, telegramMessage);
            }

            // 3. User Alerts (Direct)
            if (settings.telegramEnabledUser && (type === 'BOOKING_CONFIRMED' || type === 'REPORT_READY') && userTelegramChatId) {
                await sendTelegram(userTelegramChatId, telegramMessage);
            }
        }

    } catch (error) {
        console.error('[Notification] Smart Hub Error:', error);
    }
}

