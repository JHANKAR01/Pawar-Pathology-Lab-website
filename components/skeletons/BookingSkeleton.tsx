import React from 'react';
import { motion } from 'framer-motion';

export default function BookingSkeleton() {
    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    {/* Booking ID & Date */}
                    <div className="flex gap-2">
                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                    </div>
                    {/* Patient Name */}
                    <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
                </div>
                {/* Status Badge */}
                <div className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
            </div>

            <div className="space-y-2 pt-2">
                {/* Test Items */}
                <div className="h-4 w-full max-w-[200px] bg-slate-100 rounded animate-pulse" />
                <div className="h-4 w-full max-w-[150px] bg-slate-100 rounded animate-pulse" />
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                {/* Avatar / Assignee */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                </div>
                {/* Price */}
                <div className="h-5 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
        </div>
    );
}
