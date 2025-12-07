'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrainingControl, Student, EVENT_TYPES } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronDown,
    ChevronUp,
    Trophy,
    Target,
    Edit,
    User,
    Medal
} from 'lucide-react';

interface AdminControlHistoryProps {
    controls: (TrainingControl & { student?: Student })[];
}

export default function AdminControlHistory({ controls }: AdminControlHistoryProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatPosition = (pos: number) => {
        if (pos === 1) return '🥇 1°';
        if (pos === 2) return '🥈 2°';
        if (pos === 3) return '🥉 3°';
        return `${pos}°`;
    };

    if (controls.length === 0) {
        return (
            <div className="glass-card p-6 text-center">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay controles registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {controls.map((control) => {
                const isExpanded = expandedId === control.id;
                const student = control.student;
                const isTournament = control.event_type && control.event_type !== 'training';

                return (
                    <div
                        key={control.id}
                        className={`glass-card overflow-hidden ${isTournament ? 'border-yellow-500/30' : ''}`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleExpand(control.id)}
                            className="w-full p-4 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                {/* Foto del alumno */}
                                {student?.photo_url ? (
                                    <img
                                        src={student.photo_url}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white font-medium">
                                            {student?.first_name} {student?.last_name}
                                        </span>
                                        {isTournament && (
                                            <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                                <Medal className="w-3 h-3" />
                                                {EVENT_TYPES[control.event_type as keyof typeof EVENT_TYPES]?.replace('Torneo ', '') || 'Torneo'}
                                            </span>
                                        )}
                                        {control.position && (
                                            <span className="text-xs text-white font-bold">
                                                {formatPosition(control.position)}
                                            </span>
                                        )}
                                        {control.is_academy_record && (
                                            <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                                <Trophy className="w-3 h-3" />
                                                Récord
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {format(parseISO(control.control_date), "d 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xl font-bold text-primary-500">{control.total_score}</div>
                                    <div className="text-xs text-slate-400">{control.distance}m</div>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </div>
                        </button>

                        {/* Detalles expandidos */}
                        {isExpanded && (
                            <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 animate-fade-in">
                                {/* Info de torneo */}
                                {isTournament && control.tournament_name && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                        <div className="text-xs text-slate-400 mb-1">Torneo</div>
                                        <div className="text-white font-medium">{control.tournament_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-yellow-400">
                                                {EVENT_TYPES[control.event_type as keyof typeof EVENT_TYPES]}
                                            </span>
                                            {control.position && (
                                                <span className="text-xs text-white">
                                                    • Posición: {formatPosition(control.position)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">M1</div>
                                        <div className="text-lg font-semibold text-white">{control.m1_score}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">M2</div>
                                        <div className="text-lg font-semibold text-white">{control.m2_score}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">Flechas</div>
                                        <div className="text-lg font-semibold text-white">{control.arrows_count}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">Arrow Avg</div>
                                        <div className="text-lg font-semibold text-primary-500">{control.arrow_average}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">10+X</div>
                                        <div className="text-lg font-semibold text-yellow-400">{control.tens_plus_x}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">X</div>
                                        <div className="text-lg font-semibold text-yellow-400">{control.x_count}</div>
                                    </div>
                                    {control.red_percentage !== null && (
                                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-slate-400 mb-1">% Rojo</div>
                                            <div className="text-lg font-semibold text-red-400">{control.red_percentage}%</div>
                                        </div>
                                    )}
                                    {control.yellow_percentage !== null && (
                                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                            <div className="text-xs text-slate-400 mb-1">% Amarillo</div>
                                            <div className="text-lg font-semibold text-yellow-400">{control.yellow_percentage}%</div>
                                        </div>
                                    )}
                                </div>

                                {/* Botón de editar */}
                                <Link
                                    href={`/admin/control/${control.id}`}
                                    className="btn btn-secondary w-full py-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar Control
                                </Link>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
