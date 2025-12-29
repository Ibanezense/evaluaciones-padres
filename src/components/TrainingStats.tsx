'use client';

import { useMemo } from 'react';
import { TrainingControl, DISTANCES, EVENT_TYPES } from '@/lib/supabase';
import { Trophy, TrendingUp, Target, Award, Medal } from 'lucide-react';

interface TrainingStatsProps {
    controls: TrainingControl[];
}

export default function TrainingStats({ controls }: TrainingStatsProps) {
    const stats = useMemo(() => {
        if (controls.length === 0) return null;

        const now = new Date();
        const thisYear = now.getFullYear();
        const lastYear = thisYear - 1;

        // Filtrar controles por año
        const thisYearControls = controls.filter(c =>
            new Date(c.control_date).getFullYear() === thisYear
        );
        const lastYearControls = controls.filter(c =>
            new Date(c.control_date).getFullYear() === lastYear
        );

        // Filtrar torneos (no entrenamientos)
        const tournaments = controls.filter(c => c.event_type && c.event_type !== 'training' && c.position);
        const thisYearTournaments = tournaments.filter(c =>
            new Date(c.control_date).getFullYear() === thisYear
        );
        const lastYearTournaments = tournaments.filter(c =>
            new Date(c.control_date).getFullYear() === lastYear
        );

        // MEJOR puntaje de cada periodo (no suma)
        const thisYearBest = thisYearControls.length > 0
            ? Math.max(...thisYearControls.map(c => c.total_score))
            : 0;
        const lastYearBest = lastYearControls.length > 0
            ? Math.max(...lastYearControls.map(c => c.total_score))
            : 0;
        const careerBest = Math.max(...controls.map(c => c.total_score));

        // PROMEDIO de Arrow Average por periodo
        const thisYearAvgArrow = thisYearControls.length > 0
            ? thisYearControls.reduce((sum, c) => sum + c.arrow_average, 0) / thisYearControls.length
            : 0;
        const lastYearAvgArrow = lastYearControls.length > 0
            ? lastYearControls.reduce((sum, c) => sum + c.arrow_average, 0) / lastYearControls.length
            : 0;
        const careerAvgArrow = controls.reduce((sum, c) => sum + c.arrow_average, 0) / controls.length;

        // Mejor posición en torneos por periodo
        const getBestPosition = (tournamentList: TrainingControl[]) => {
            if (tournamentList.length === 0) return null;
            const sorted = tournamentList.sort((a, b) => (a.position || 999) - (b.position || 999));
            return sorted[0];
        };

        const thisYearBestPos = getBestPosition(thisYearTournaments);
        const lastYearBestPos = getBestPosition(lastYearTournaments);
        const careerBestPos = getBestPosition(tournaments);

        // Comparación porcentual con año anterior (mejor puntaje)
        const bestChange = lastYearBest > 0
            ? ((thisYearBest - lastYearBest) / lastYearBest) * 100
            : 0;

        // Mejores puntajes por distancia
        const bestByDistance: Record<number, TrainingControl> = {};
        controls.forEach(c => {
            if (!bestByDistance[c.distance] || c.total_score > bestByDistance[c.distance].total_score) {
                bestByDistance[c.distance] = c;
            }
        });

        // Récords del alumno
        const records = controls.filter(c => c.is_academy_record);

        // Último control
        const lastControl = controls[0];

        // Conteo de torneos
        const tournamentCount = tournaments.length;

        return {
            thisYear: {
                best: thisYearBest,
                avgArrow: thisYearAvgArrow.toFixed(2),
                count: thisYearControls.length,
                bestPosition: thisYearBestPos,
            },
            lastYear: {
                best: lastYearBest,
                avgArrow: lastYearAvgArrow.toFixed(2),
                count: lastYearControls.length,
                bestPosition: lastYearBestPos,
            },
            career: {
                best: careerBest,
                avgArrow: careerAvgArrow.toFixed(2),
                count: controls.length,
                bestPosition: careerBestPos,
            },
            changes: {
                best: bestChange.toFixed(1),
            },
            bestByDistance,
            records,
            lastControl,
            tournamentCount,
        };
    }, [controls]);

    if (!stats) {
        return null;
    }

    const formatPosition = (pos: number) => {
        if (pos === 1) return '🥇 1°';
        if (pos === 2) return '🥈 2°';
        if (pos === 3) return '🥉 3°';
        return `${pos}°`;
    };

    return (
        <div className="space-y-4">
            {/* Resumen rápido */}
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    Resumen
                </h3>

                {stats.lastControl && (
                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-slate-400">Último puntaje</span>
                            {stats.lastControl.event_type && stats.lastControl.event_type !== 'training' ? (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                    Torneo
                                </span>
                            ) : (
                                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                                    Entrenamiento
                                </span>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-2xl font-bold text-primary-500">{stats.lastControl.total_score}</span>
                                <span className="text-slate-400 ml-2">pts a {stats.lastControl.distance}m</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-slate-400">Arrow Avg</div>
                                <div className="text-lg font-semibold text-white">{stats.lastControl.arrow_average}</div>
                            </div>
                        </div>
                        {stats.lastControl.event_type && stats.lastControl.event_type !== 'training' && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                    Etapa Clasificatoria
                                </span>
                                {stats.lastControl.position && (
                                    <span className="text-xs text-white">
                                        Posición: {formatPosition(stats.lastControl.position)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Mejor puntaje por periodo */}
                <div className="mb-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Mejor Puntaje
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="glass-card p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Este año</div>
                            <div className="text-2xl font-bold text-primary-500">{stats.thisYear.best || '-'}</div>
                            <div className="text-xs text-slate-500 mt-1">{stats.thisYear.count} ctrl</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Año pasado</div>
                            <div className="text-2xl font-bold text-white">{stats.lastYear.best || '-'}</div>
                            <div className="text-xs text-slate-500 mt-1">{stats.lastYear.count} ctrl</div>
                        </div>
                        <div className="glass-card p-4 text-center border border-yellow-500/30">
                            <div className="text-xs text-yellow-400 mb-2">Carrera</div>
                            <div className="text-2xl font-bold text-yellow-400">{stats.career.best}</div>
                            <div className="text-xs text-slate-500 mt-1">{stats.career.count} ctrl</div>
                        </div>
                    </div>
                </div>

                {/* Arrow Average promedio por periodo */}
                <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary-500" />
                        Arrow Average (Promedio)
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="glass-card p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Este año</div>
                            <div className="text-xl font-bold text-primary-500">{stats.thisYear.count > 0 ? stats.thisYear.avgArrow : '-'}</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Año pasado</div>
                            <div className="text-xl font-bold text-white">{stats.lastYear.count > 0 ? stats.lastYear.avgArrow : '-'}</div>
                        </div>
                        <div className="glass-card p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Carrera</div>
                            <div className="text-xl font-bold text-white">{stats.career.avgArrow}</div>
                        </div>
                    </div>
                </div>

                {/* Cambio porcentual */}
                {stats.lastYear.count > 0 && stats.thisYear.count > 0 && (
                    <div className="mt-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${parseFloat(stats.changes.best) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {parseFloat(stats.changes.best) >= 0 ? '↑' : '↓'}
                            {Math.abs(parseFloat(stats.changes.best))}% mejor puntaje vs año anterior
                        </span>
                    </div>
                )}
            </div>

            {/* Mejores posiciones en torneos */}
            {stats.tournamentCount > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                        <Medal className="w-5 h-5 text-yellow-500" />
                        Mejor Posición en Torneos
                    </h3>
                    <div className="text-xs text-blue-400 mb-4">
                        📋 Etapa Clasificatoria
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Este año */}
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Este año</div>
                            {stats.thisYear.bestPosition ? (
                                <>
                                    <div className="text-2xl font-bold text-primary-500">
                                        {formatPosition(stats.thisYear.bestPosition.position!)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        a {stats.thisYear.bestPosition.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>

                        {/* Año pasado */}
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 text-center">
                            <div className="text-xs text-slate-400 mb-2">Año pasado</div>
                            {stats.lastYear.bestPosition ? (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {formatPosition(stats.lastYear.bestPosition.position!)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        a {stats.lastYear.bestPosition.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>

                        {/* Carrera */}
                        <div className="bg-slate-800/80 backdrop-blur-sm border border-yellow-500/40 rounded-xl p-4 text-center">
                            <div className="text-xs text-yellow-400 mb-2">Carrera</div>
                            {stats.career.bestPosition ? (
                                <>
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {formatPosition(stats.career.bestPosition.position!)}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        a {stats.career.bestPosition.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>
                    </div>

                    {stats.career.bestPosition && (
                        <div className="mt-3 text-center text-xs text-slate-400">
                            {stats.career.bestPosition.tournament_name}
                        </div>
                    )}
                </div>
            )}


            {/* Récords de la Academia - Mejores puntajes por distancia */}
            {Object.keys(stats.bestByDistance).length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        Récords de la Academia
                    </h3>

                    <div className="space-y-2">
                        {Object.entries(stats.bestByDistance)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([distance, record]) => (
                                <div
                                    key={distance}
                                    className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                                >
                                    <div>
                                        <div className="text-lg font-bold text-yellow-400">{record.total_score} pts</div>
                                        <div className="text-sm text-slate-400">
                                            {distance}m • {new Date(record.control_date).toLocaleDateString('es-ES')}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-400">Arrow Avg</div>
                                        <div className="text-white font-medium">{record.arrow_average}</div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
