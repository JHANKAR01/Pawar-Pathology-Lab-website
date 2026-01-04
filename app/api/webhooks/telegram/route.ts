import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Booking from '@/models/Booking';

export async function POST(request: Request) {
    try {
        await dbConnect();

        const body = await request.json();

        // Telegram webhook structure: body.message.text contains the command
        const message = body.message;

        if (!message || !message.text || !message.from) {
            return NextResponse.json({ ok: true }); // Acknowledge but ignore
        }

        const chatId = message.from.id;
        const text = message.text;
        const userName = message.from.first_name || 'User';

        // Check if it's a /start command with booking ID
        if (text.startsWith('/start ')) {
            const bookingId = text.substring(7).trim(); // Extract token after "/start "

            if (!bookingId) {
                return NextResponse.json({ ok: true });
            }

            // 1. Find the booking
            const booking = await Booking.findById(bookingId);

            if (!booking) {
                // Send error message to user
                await sendTelegramMessage(chatId, '❌ Invalid or expired link. Please contact support.');
                return NextResponse.json({ ok: true });
            }

            // 2. Find the associated user (patient)
            const user = await User.findOne({ email: booking.email });

            if (!user) {
                await sendTelegramMessage(chatId, '❌ User account not found. Please contact support.');
                return NextResponse.json({ ok: true });
            }

            // 3. Save Chat ID to user account
            user.telegramChatId = chatId.toString();
            await user.save();

            // 4. Send success message
            const welcomeMessage = `Hello ${user.name || userName} ji! 🙏\n\n✅ Your account is now linked with *Pawar Pathology Lab*.\n\nYou will receive real-time updates and reports here automatically.\n\n📄 Booking #${bookingId} confirmed!`;

            await sendTelegramMessage(chatId, welcomeMessage);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: true }); // Always return 200 to Telegram
    }
}

// Helper function to send Telegram messages
async function sendTelegramMessage(chatId: number | string, text: string) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.error('[Telegram] Bot token not configured');
        return;
    }

    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const result = await response.json();
            console.error(`[Telegram] Send failed: ${result.description}`);
        }
    } catch (e) {
        console.error('[Telegram] Fetch error:', e);
    }
}
