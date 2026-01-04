'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console for debugging
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-slate-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-6">
                        <AlertTriangle className="w-10 h-10 text-rose-600" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-2xl font-black text-slate-900 mb-3">
                        System Busy
                    </h1>

                    {/* User-friendly message */}
                    <p className="text-slate-600 mb-8">
                        We're experiencing a temporary issue. Please try again in a moment.
                    </p>

                    {/* Error details (only in development) */}
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl text-left">
                            <p className="text-xs font-mono text-slate-500 break-words">
                                {error.message}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={reset}
                            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Try Again
                        </button>

                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-6 rounded-2xl transition-all"
                        >
                            Go to Homepage
                        </button>
                    </div>

                    {/* Support info */}
                    <p className="text-xs text-slate-400 mt-8">
                        If the issue persists, please contact support at{' '}
                        <a href="tel:+919755553339" className="text-rose-600 hover:underline">
                            +91 9755553339
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
