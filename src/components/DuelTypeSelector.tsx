'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, Trophy, Target, X } from 'lucide-react';

interface DuelTypeSelectorProps {
    studentId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function DuelTypeSelector({ studentId, isOpen, onClose }: DuelTypeSelectorProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleSelect = (type: 'training' | 'tournament') => {
        const baseUrl = type === 'training'
            ? '/admin/duelo/nuevo'
            : '/admin/duelo/torneo';

        const url = studentId ? `${baseUrl}?studentId=${studentId}` : baseUrl;
        router.push(url);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative glass-card p-6 max-w-md w-full animate-fade-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <Swords className="w-10 h-10 text-primary-500 mx-auto mb-2" />
                    <h2 className="text-xl font-bold text-white">Nuevo Duelo</h2>
                    <p className="text-sm text-slate-400">¿Qué tipo de duelo vas a registrar?</p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                    {/* Training option */}
                    <button
                        onClick={() => handleSelect('training')}
                        className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-primary-500/50 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                                <Target className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Entrenamiento</h3>
                                <p className="text-sm text-slate-400">Duelo de práctica en la academia</p>
                            </div>
                        </div>
                    </button>

                    {/* Tournament option */}
                    <button
                        onClick={() => handleSelect('tournament')}
                        className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-yellow-500/50 transition-all text-left group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">Torneo</h3>
                                <p className="text-sm text-slate-400">Registra todos los duelos de un torneo</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
