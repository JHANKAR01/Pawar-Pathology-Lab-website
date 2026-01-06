
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger' | 'warning' | 'success';
    children?: React.ReactNode;
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
    children
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'danger': return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', btn: 'bg-red-500 hover:bg-red-600' };
            case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', btn: 'bg-amber-500 hover:bg-amber-600' };
            case 'success': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', btn: 'bg-emerald-500 hover:bg-emerald-600' };
            default: return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', btn: 'bg-blue-500 hover:bg-blue-600' };
        }
    };

    const styles = getVariantStyles();
    const Icon = styles.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                    >
                        <div className={`p-6 border-b border-slate-100 flex gap-4 ${styles.bg}`}>
                            <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm ${styles.color}`}>
                                <Icon size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-900">{title}</h3>
                                <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">{description}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors self-start text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {children}

                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm uppercase tracking-wide"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all text-sm uppercase tracking-wide transform active:scale-95 ${styles.btn}`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CustomModal;
