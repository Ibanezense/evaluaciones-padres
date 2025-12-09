'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Badge, BADGE_CATEGORIES, BadgeCategory } from '@/lib/supabase';
import {
    ArrowLeft,
    Plus,
    Edit,
    Award,
    Loader2,
    Search
} from 'lucide-react';

export default function BadgesAdminPage() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');

    useEffect(() => {
        loadBadges();
    }, []);

    const loadBadges = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('badges')
                .select('*')
                .order('category')
                .order('rank_order')
                .order('name');

            if (error) throw error;
            setBadges(data || []);
        } catch (err) {
            console.error('Error loading badges:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredBadges = badges.filter(badge => {
        const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            badge.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || badge.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Agrupar badges por categoría
    const badgesByCategory = filteredBadges.reduce((acc, badge) => {
        const cat = badge.category || 'meta';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
    }, {} as Record<string, Badge[]>);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin"
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Award className="w-6 h-6 text-primary-500" />
                            Catálogo de Badges
                        </h1>
                        <p className="text-sm text-slate-400">
                            {badges.length} badge(s) en total
                        </p>
                    </div>
                    <Link
                        href="/admin/badges/nuevo"
                        className="btn btn-primary py-2 px-4"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo
                    </Link>
                </header>

                {/* Filtros */}
                <div className="flex gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar badge..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-40"
                    >
                        <option value="">Todas</option>
                        {Object.entries(BADGE_CATEGORIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Listado por categoría */}
                {Object.keys(badgesByCategory).length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">No hay badges</p>
                        <p className="text-sm text-slate-500">
                            Crea el primer badge para comenzar
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(BADGE_CATEGORIES).map(([catKey, catLabel]) => {
                            const catBadges = badgesByCategory[catKey];
                            if (!catBadges || catBadges.length === 0) return null;

                            return (
                                <div key={catKey}>
                                    <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
                                        {catLabel} ({catBadges.length})
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {catBadges.map((badge) => (
                                            <div
                                                key={badge.id}
                                                className="glass-card p-4 flex items-center gap-4"
                                            >
                                                {/* Icono */}
                                                <div
                                                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{
                                                        backgroundColor: badge.color_hex
                                                            ? `${badge.color_hex}20`
                                                            : 'rgba(249, 115, 22, 0.2)',
                                                        borderColor: badge.color_hex || '#f97316',
                                                        borderWidth: '2px'
                                                    }}
                                                >
                                                    {badge.icon_url ? (
                                                        <img
                                                            src={badge.icon_url}
                                                            alt={badge.name}
                                                            className="w-10 h-10 object-contain"
                                                        />
                                                    ) : (
                                                        <Award
                                                            className="w-8 h-8"
                                                            style={{ color: badge.color_hex || '#f97316' }}
                                                        />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">
                                                        {badge.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        {badge.code}
                                                    </p>
                                                    {badge.description && (
                                                        <p className="text-xs text-slate-400 truncate mt-1">
                                                            {badge.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Orden */}
                                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                                    #{badge.rank_order}
                                                </span>

                                                {/* Editar */}
                                                <Link
                                                    href={`/admin/badges/${badge.id}`}
                                                    className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Editar badge"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
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
