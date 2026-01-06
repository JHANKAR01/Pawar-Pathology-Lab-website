'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'default' | 'success';
    isLoading?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
                    icon: <AlertTriangle className="w-6 h-6" />
                };
            case 'success':
                return {
                    iconBg: 'bg-emerald-100',
                    iconColor: 'text-emerald-600',
                    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
                    icon: <CheckCircle className="w-6 h-6" />
                };
            default:
                return {
                    iconBg: 'bg-clinical-rose-light',
                    iconColor: 'text-clinical-rose',
                    confirmBtn: 'bg-clinical-rose hover:bg-clinical-rose-dark shadow-rose',
                    icon: <AlertTriangle className="w-6 h-6" />
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    onClick={isLoading ? undefined : onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 md:p-8 overflow-hidden"
                >
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-14 h-14 ${styles.iconBg} ${styles.iconColor} rounded-2xl flex items-center justify-center mb-6`}>
                            {styles.icon}
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                            {description}
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 py-3 px-4 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${styles.confirmBtn}`}
                            >
                                {isLoading ? 'Processing...' : confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CustomModal;
