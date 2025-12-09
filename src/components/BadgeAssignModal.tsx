'use client';

import { useState, useEffect } from 'react';
import { supabase, Badge, BADGE_CATEGORIES } from '@/lib/supabase';
import {
    X,
    Award,
    Loader2,
    Search,
    Check
} from 'lucide-react';

interface BadgeAssignModalProps {
    studentId: string;
    assignedBadgeIds: string[];
    onClose: () => void;
    onAssigned: () => void;
}

export default function BadgeAssignModal({
    studentId,
    assignedBadgeIds,
    onClose,
    onAssigned
}: BadgeAssignModalProps) {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

    useEffect(() => {
        loadBadges();
    }, []);

    const loadBadges = async () => {
        try {
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

    const handleAssign = async () => {
        if (!selectedBadgeId) return;

        setAssigning(true);
        setError('');
        try {
            const { error: insertError } = await supabase
                .from('student_badges')
                .insert({
                    student_id: studentId,
                    badge_id: selectedBadgeId
                });

            if (insertError) {
                console.error('Insert error:', insertError);
                setError(insertError.message || 'Error al asignar badge');
                return;
            }
            onAssigned();
        } catch (err: any) {
            console.error('Error assigning badge:', err);
            setError(err.message || 'Error inesperado');
        } finally {
            setAssigning(false);
        }
    };

    // Filtrar badges disponibles (no asignados aún)
    const availableBadges = badges.filter(badge => {
        const isAssigned = assignedBadgeIds.includes(badge.id);
        const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            badge.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || badge.category === filterCategory;
        return !isAssigned && matchesSearch && matchesCategory;
    });

    // Agrupar por categoría
    const badgesByCategory = availableBadges.reduce((acc, badge) => {
        const cat = badge.category || 'meta';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
    }, {} as Record<string, Badge[]>);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="glass-card w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-500" />
                        Asignar Badge
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="p-4 space-y-3 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar badge..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 py-2 text-sm w-full"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full py-2 text-sm"
                    >
                        <option value="">Todas las categorías</option>
                        {Object.entries(BADGE_CATEGORIES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                {/* Lista de badges */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : availableBadges.length === 0 ? (
                        <div className="text-center py-8">
                            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">
                                {badges.length === assignedBadgeIds.length
                                    ? 'El alumno ya tiene todos los badges disponibles'
                                    : 'No hay badges que coincidan con tu búsqueda'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(BADGE_CATEGORIES).map(([catKey, catLabel]) => {
                                const catBadges = badgesByCategory[catKey];
                                if (!catBadges || catBadges.length === 0) return null;

                                return (
                                    <div key={catKey}>
                                        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                            {catLabel}
                                        </h3>
                                        <div className="space-y-2">
                                            {catBadges.map((badge) => (
                                                <button
                                                    key={badge.id}
                                                    onClick={() => setSelectedBadgeId(
                                                        selectedBadgeId === badge.id ? null : badge.id
                                                    )}
                                                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${selectedBadgeId === badge.id
                                                        ? 'bg-primary-500/20 border-2 border-primary-500'
                                                        : 'bg-slate-800/50 border-2 border-transparent hover:border-slate-600'
                                                        }`}
                                                >
                                                    {/* Icono */}
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{
                                                            backgroundColor: badge.color_hex
                                                                ? `${badge.color_hex}20`
                                                                : 'rgba(249, 115, 22, 0.2)'
                                                        }}
                                                    >
                                                        {badge.icon_url ? (
                                                            <img
                                                                src={badge.icon_url}
                                                                alt=""
                                                                className="w-7 h-7 object-contain"
                                                            />
                                                        ) : (
                                                            <Award
                                                                className="w-6 h-6"
                                                                style={{ color: badge.color_hex || '#f97316' }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 text-left">
                                                        <p className="text-white text-sm font-medium">
                                                            {badge.name}
                                                        </p>
                                                        {badge.description && (
                                                            <p className="text-xs text-slate-400 line-clamp-1">
                                                                {badge.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Check si está seleccionado */}
                                                    {selectedBadgeId === badge.id && (
                                                        <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50 space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-secondary flex-1"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={!selectedBadgeId || assigning}
                            className="btn btn-primary flex-1 disabled:opacity-50"
                        >
                            {assigning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Asignando...
                                </>
                            ) : (
                                <>
                                    <Award className="w-4 h-4" />
                                    Asignar Badge
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
