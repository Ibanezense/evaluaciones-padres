'use client';

import { useState } from 'react';
import { TrainingControl, EVENT_TYPES } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronDown,
    ChevronUp,
    Trophy,
    Target,
    Medal
} from 'lucide-react';

interface TrainingControlHistoryProps {
    controls: TrainingControl[];
    onSelectControl?: (control: TrainingControl) => void;
    selectedId?: string;
}

export default function TrainingControlHistory({
    controls,
    onSelectControl,
    selectedId
}: TrainingControlHistoryProps) {
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
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary-500" />
                    Historial de Puntajes
                </h3>
                <span className="text-sm text-slate-400">
                    {controls.length} registro(s)
                </span>
            </div>

            {controls.map((control) => {
                const isExpanded = expandedId === control.id;
                const isSelected = selectedId === control.id;
                const isTournament = control.event_type && control.event_type !== 'training';

                return (
                    <div
                        key={control.id}
                        className={`glass-card overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary-500' : ''
                            } ${isTournament ? 'border-yellow-500/30' : ''}`}
                    >
                        {/* Header - Siempre visible */}
                        <button
                            onClick={() => {
                                toggleExpand(control.id);
                                onSelectControl?.(control);
                            }}
                            className="w-full p-4 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-primary-500">
                                        {control.total_score}
                                    </div>
                                    <div className="text-xs text-slate-400">pts</div>
                                </div>
                                <div className="border-l border-slate-700 pl-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white font-medium">
                                            {control.distance}m
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

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm text-slate-400">Arrow Avg</div>
                                    <div className="text-white font-medium">{control.arrow_average}</div>
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
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
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

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
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

                                {control.evaluator_name && (
                                    <div className="mt-3 text-sm text-slate-400">
                                        Evaluador: {control.evaluator_name}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
