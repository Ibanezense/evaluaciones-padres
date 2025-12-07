'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Duel, DuelSet, Student, EVENT_TYPES, TOURNAMENT_STAGES, formatDuelScore } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ChevronDown,
    ChevronUp,
    Swords,
    Edit,
    User,
    Trophy,
    Target,
    Medal
} from 'lucide-react';

interface DuelHistoryProps {
    duels: (Duel & { student?: Student; opponent_student?: Student; sets?: DuelSet[] })[];
    showStudent?: boolean;  // Si mostrar el nombre del alumno (para vista admin)
    showEditButton?: boolean;  // Si mostrar botón de editar
}

export default function DuelHistory({ duels, showStudent = true, showEditButton = false }: DuelHistoryProps) {
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

    const getOpponentName = (duel: Duel & { opponent_student?: Student }) => {
        if (duel.opponent_type === 'internal' && duel.opponent_student) {
            return `${duel.opponent_student.first_name} ${duel.opponent_student.last_name}`;
        }
        return duel.opponent_name || 'Oponente';
    };

    if (duels.length === 0) {
        return (
            <div className="glass-card p-6 text-center">
                <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No hay duelos registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Swords className="w-5 h-5 text-primary-500" />
                    Historial de Duelos
                </h3>
                <span className="text-sm text-slate-400">
                    {duels.length} duelo(s)
                </span>
            </div>

            {duels.map((duel) => {
                const isExpanded = expandedId === duel.id;
                const isTournament = duel.event_type !== 'training';
                const isWin = duel.result === 'win';

                return (
                    <div
                        key={duel.id}
                        className={`glass-card overflow-hidden transition-all ${isWin ? 'border-green-500/30' : 'border-red-500/30'
                            }`}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleExpand(duel.id)}
                            className="w-full p-4 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                {/* Indicador de resultado */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isWin ? 'bg-green-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <span className="text-2xl">{isWin ? '✅' : '❌'}</span>
                                </div>

                                <div>
                                    {/* Alumno (si se muestra) */}
                                    {showStudent && duel.student && (
                                        <div className="text-xs text-slate-400 mb-1">
                                            {duel.student.first_name} {duel.student.last_name}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white font-medium">
                                            vs {getOpponentName(duel)}
                                        </span>
                                        {duel.opponent_type === 'internal' && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                                Academia
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap mt-1">
                                        <span className="text-sm text-slate-400">
                                            {format(parseISO(duel.duel_date), "d MMM yyyy", { locale: es })}
                                        </span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <span className="text-sm text-slate-400">{duel.distance}m</span>

                                        {isTournament && (
                                            <>
                                                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                                    <Medal className="w-3 h-3" />
                                                    {EVENT_TYPES[duel.event_type]?.replace('Torneo ', '') || 'Torneo'}
                                                </span>
                                                {duel.tournament_stage && (
                                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                                                        {TOURNAMENT_STAGES[duel.tournament_stage]}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatDuelScore(duel.our_set_points, duel.opponent_set_points, duel.is_shoot_off)}
                                    </div>
                                    {duel.is_shoot_off && (
                                        <div className="text-xs text-yellow-400">Shoot-Off</div>
                                    )}
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
                                {isTournament && duel.tournament_name && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                        <div className="text-xs text-slate-400 mb-1">Torneo</div>
                                        <div className="text-white font-medium">{duel.tournament_name}</div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-yellow-400">
                                                {EVENT_TYPES[duel.event_type]}
                                            </span>
                                            {duel.tournament_stage && (
                                                <span className="text-xs text-white">
                                                    • Etapa: {TOURNAMENT_STAGES[duel.tournament_stage]}
                                                </span>
                                            )}
                                            {duel.tournament_position && (
                                                <span className="text-xs text-white">
                                                    • Posición: {formatPosition(duel.tournament_position)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Sets */}
                                {duel.sets && duel.sets.length > 0 && (
                                    <div className="mb-4">
                                        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                                            Detalle de Sets
                                        </div>
                                        <div className="space-y-2">
                                            {duel.sets.sort((a, b) => a.set_number - b.set_number).map((set) => (
                                                <div
                                                    key={set.id || set.set_number}
                                                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2"
                                                >
                                                    <span className="text-sm text-slate-400">Set {set.set_number}</span>
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-medium ${set.our_score > set.opponent_score ? 'text-green-400' :
                                                            set.our_score < set.opponent_score ? 'text-red-400' : 'text-yellow-400'
                                                            }`}>
                                                            {set.our_score} - {set.opponent_score}
                                                        </span>
                                                        <span className="text-sm text-slate-500">
                                                            ({set.our_set_points}-{set.opponent_set_points})
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Shoot-off */}
                                {duel.is_shoot_off && duel.our_shoot_off_score !== null && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                                        <div className="text-xs text-yellow-400 mb-2">Shoot-Off (5-5)</div>
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">
                                                    {duel.our_shoot_off_score}
                                                    {duel.our_shoot_off_is_x && <span className="text-yellow-400 ml-1">X</span>}
                                                </div>
                                                <div className="text-xs text-slate-400">Nuestro</div>
                                            </div>
                                            <div className="text-slate-600">vs</div>
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-white">
                                                    {duel.opponent_shoot_off_score}
                                                    {duel.opponent_shoot_off_is_x && <span className="text-yellow-400 ml-1">X</span>}
                                                </div>
                                                <div className="text-xs text-slate-400">Oponente</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Puntaje total */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">Puntaje Total Nuestro</div>
                                        <div className="text-lg font-semibold text-primary-500">{duel.our_total_score}</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">Puntaje Total Oponente</div>
                                        <div className="text-lg font-semibold text-white">{duel.opponent_total_score}</div>
                                    </div>
                                </div>

                                {/* Botón de editar */}
                                {showEditButton && (
                                    <Link
                                        href={`/admin/duelo/${duel.id}`}
                                        className="btn btn-secondary w-full py-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar Duelo
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
