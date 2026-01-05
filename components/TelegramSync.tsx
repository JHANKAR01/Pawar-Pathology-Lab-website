'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TelegramSync({ isConnected }: { isConnected: boolean }) {
    const [loading, setLoading] = useState(false);

    const handleSync = async () => {
        setLoading(true);
        try {
            // 1. Request a temporary sync token from our backend
            const res = await fetch('/api/users/telegram-token', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate token');

            // 2. Redirect to Telegram Bot with Deep Link
            // Format: https://t.me/BotUsername?start=sync_{token}
            const botUsername = 'PawarPathologyLabBetulBot';
            // Ideally fetched from env/settings via the API response to be robust
            const finalBotName = data.botUsername || botUsername;

            const deepLink = `https://t.me/${finalBotName}?start=sync_${data.token}`;

            // Open in new tab
            window.open(deepLink, '_blank');

            toast.success('Opening Telegram...', {
                description: 'Please press "START" in the Telegram app to complete syncing.'
            });

        } catch (error: any) {
            toast.error('Sync Failed', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (isConnected) {
        return (
            <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <Send size={16} />
                <span>Telegram Connected</span>
            </div>
        );
    }

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center gap-2 bg-[#0088cc] text-white px-5 py-2.5 rounded-xl hover:bg-[#0077b5] transition-all font-bold text-sm shadow-lg shadow-sky-900/20 disabled:opacity-70"
        >
            <Send size={16} />
            {loading ? 'Opening...' : 'Connect Telegram'}
        </button>
    );
}
