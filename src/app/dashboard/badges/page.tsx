'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Badge, StudentBadge, BADGE_CATEGORIES, BadgeCategory } from '@/lib/supabase';
import { Loader2, Award, ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BadgesPage() {
    const [badges, setBadges] = useState<(StudentBadge & { badge: Badge })[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            router.push('/');
            return;
        }
        loadBadges(studentId);
    }, [router]);

    const loadBadges = async (studentId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('student_badges')
                .select('*, badge:badges(*)')
                .eq('student_id', studentId)
                .order('awarded_at', { ascending: false });

            if (error) throw error;
            setBadges(data || []);
        } catch (err) {
            console.error('Error loading badges:', err);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar badges por categoría
    const badgesByCategory = badges.reduce((acc, sb) => {
        const cat = sb.badge?.category || 'meta';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(sb);
        return acc;
    }, {} as Record<string, (StudentBadge & { badge: Badge })[]>);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="p-4 pb-24">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="w-6 h-6 text-primary-500" />
                        Badges / Logros
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Aquí puedes ver todos los logros conseguidos en evaluaciones, entrenamientos, duelos y torneos.
                    </p>
                </header>

                {/* Resumen */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Total de badges</p>
                            <p className="text-3xl font-bold text-primary-500">{badges.length}</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <Award className="w-10 h-10 text-primary-500" />
                        </div>
                    </div>
                </div>

                {/* Estado vacío */}
                {badges.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">Todavía no tiene badges</p>
                        <p className="text-sm text-slate-500">
                            A medida que vaya logrando objetivos en sus entrenamientos, evaluaciones y torneos, aparecerán aquí sus logros.
                        </p>
                    </div>
                ) : (
                    /* Badges agrupados por categoría */
                    <div className="space-y-6">
                        {Object.entries(BADGE_CATEGORIES).map(([catKey, catLabel]) => {
                            const catBadges = badgesByCategory[catKey];
                            if (!catBadges || catBadges.length === 0) return null;

                            return (
                                <div key={catKey}>
                                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                        {catLabel}
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {catBadges.map((sb) => (
                                            <div
                                                key={sb.id}
                                                className="glass-card p-4 text-center cursor-help"
                                                title={sb.badge?.description || sb.badge?.name}
                                            >
                                                {/* Icono */}
                                                <div
                                                    className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3"
                                                    style={{
                                                        backgroundColor: sb.badge?.color_hex
                                                            ? `${sb.badge.color_hex}20`
                                                            : 'rgba(249, 115, 22, 0.2)',
                                                        borderColor: sb.badge?.color_hex || '#f97316',
                                                        borderWidth: '2px'
                                                    }}
                                                >
                                                    {sb.badge?.icon_url ? (
                                                        <img
                                                            src={sb.badge.icon_url}
                                                            alt=""
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    ) : (
                                                        <Award
                                                            className="w-8 h-8"
                                                            style={{ color: sb.badge?.color_hex || '#f97316' }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Nombre */}
                                                <p className="text-white text-sm font-medium mb-1 line-clamp-2">
                                                    {sb.badge?.name}
                                                </p>

                                                {/* Fecha */}
                                                <p className="text-xs text-slate-500">
                                                    {format(parseISO(sb.awarded_at), "d MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
