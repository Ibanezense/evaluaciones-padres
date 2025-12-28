'use client';

import { useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Loader2, X, User, Mail, Phone, Save } from 'lucide-react';

interface CreateTutorModalProps {
    onClose: () => void;
    onSuccess: (newTutor: Profile) => void;
}

export default function CreateTutorModal({ onClose, onSuccess }: CreateTutorModalProps) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const generateAccessCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        if (!fullName.trim()) {
            setError('El nombre es obligatorio');
            setSaving(false);
            return;
        }

        try {
            // Generar código de acceso
            const accessCode = generateAccessCode();

            // Preparar datos - generamos el ID porque la tabla no tiene default
            const newProfileData = {
                id: crypto.randomUUID(),
                full_name: fullName.trim(),
                first_name: fullName.trim().split(' ')[0], // Aproximación
                last_name: fullName.trim().split(' ').slice(1).join(' ') || '', // Aproximación
                email: email.trim() || null,
                phone: phone.trim() || null,
                role: 'CLIENTE',
                access_code: accessCode
            };

            const { data, error: insertError } = await supabase
                .from('profiles')
                .insert([newProfileData])
                .select()
                .single();

            if (insertError) throw insertError;

            onSuccess(data as Profile);
        } catch (err: any) {
            console.error('Error creating tutor:', err);
            setError(err.message || 'Error al crear el tutor');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="glass-card max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <User className="w-6 h-6 text-primary-500" />
                    Nuevo Tutor / Padre
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre completo *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Nombre y apellido"
                                style={{ paddingLeft: '2.5rem' }}
                                autoFocus
                            />
                            <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@ejemplo.com"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                            <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Teléfono
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+51 999 999 999"
                                style={{ paddingLeft: '2.5rem' }}
                            />
                            <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-400">
                        El código de acceso se generará automáticamente al guardar.
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary flex-1"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar Tutor
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
