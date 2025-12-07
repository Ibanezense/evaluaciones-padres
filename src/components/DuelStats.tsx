'use client';

import { useMemo, useState } from 'react';
import { Duel, EVENT_TYPES } from '@/lib/supabase';
import { Trophy, TrendingUp, Target, Users, Medal, Swords } from 'lucide-react';

interface DuelStatsProps {
    duels: Duel[];
}

type DuelCategory = 'official' | 'training';
type Period = 'thisYear' | 'lastYear' | 'career';

export default function DuelStats({ duels }: DuelStatsProps) {
    const [category, setCategory] = useState<DuelCategory>('official');
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisYear');

    // Separar duelos oficiales y de entrenamiento
    const officialDuels = useMemo(() =>
        duels.filter(d => d.event_type !== 'training'), [duels]
    );

    const trainingDuels = useMemo(() =>
        duels.filter(d => d.event_type === 'training'), [duels]
    );

    const currentDuels = category === 'official' ? officialDuels : trainingDuels;

    const stats = useMemo(() => {
        if (currentDuels.length === 0) return null;

        const now = new Date();
        const thisYear = now.getFullYear();
        const lastYear = thisYear - 1;

        // Filtrar duelos por año
        const thisYearDuels = currentDuels.filter(d =>
            new Date(d.duel_date).getFullYear() === thisYear
        );
        const lastYearDuels = currentDuels.filter(d =>
            new Date(d.duel_date).getFullYear() === lastYear
        );

        // Función para calcular stats de un periodo
        const calculatePeriodStats = (periodDuels: Duel[]) => {
            const wins = periodDuels.filter(d => d.result === 'win').length;
            const losses = periodDuels.filter(d => d.result === 'loss').length;
            const total = wins + losses;

            const shootOffDuels = periodDuels.filter(d => d.is_shoot_off);
            const shootOffWins = shootOffDuels.filter(d => d.result === 'win').length;
            const shootOffLosses = shootOffDuels.filter(d => d.result === 'loss').length;

            // Mejor ranking en torneos (solo para oficiales)
            const tournaments = periodDuels.filter(d =>
                d.event_type !== 'training' && d.tournament_position !== null
            );
            const bestRanking = tournaments.length > 0
                ? tournaments.reduce((best, d) =>
                    d.tournament_position! < (best?.tournament_position || Infinity) ? d : best
                    , tournaments[0])
                : null;

            return {
                wins,
                losses,
                total,
                winRate: total > 0 ? (wins / total * 100) : 0,
                shootOffWins,
                shootOffLosses,
                shootOffTotal: shootOffWins + shootOffLosses,
                shootOffWinRate: (shootOffWins + shootOffLosses) > 0
                    ? (shootOffWins / (shootOffWins + shootOffLosses) * 100) : 0,
                bestRanking,
            };
        };

        // Calcular oponentes más frecuentes
        const opponentMap = new Map<string, { name: string; wins: number; losses: number; total: number }>();

        currentDuels.forEach(d => {
            const name = d.opponent_type === 'internal' && d.opponent_student_id
                ? d.opponent_student_id
                : d.opponent_name || 'Desconocido';

            const displayName = d.opponent_name || 'Oponente interno';

            if (!opponentMap.has(name)) {
                opponentMap.set(name, { name: displayName, wins: 0, losses: 0, total: 0 });
            }

            const opponent = opponentMap.get(name)!;
            opponent.total += 1;
            if (d.result === 'win') opponent.wins += 1;
            else opponent.losses += 1;
        });

        const opponents = Array.from(opponentMap.values());
        const mostFaced = opponents.sort((a, b) => b.total - a.total)[0] || null;
        const mostWinsAgainst = opponents.sort((a, b) => b.wins - a.wins)[0] || null;
        const mostLossesAgainst = opponents.sort((a, b) => b.losses - a.losses)[0] || null;

        return {
            thisYear: calculatePeriodStats(thisYearDuels),
            lastYear: calculatePeriodStats(lastYearDuels),
            career: calculatePeriodStats(currentDuels),
            opponents: {
                mostFaced,
                mostWinsAgainst,
                mostLossesAgainst,
            },
        };
    }, [currentDuels]);

    // Componente de gráfico de pastel simple con SVG
    const PieChart = ({
        wins,
        losses,
        title,
        winLabel = 'Ganados',
        lossLabel = 'Perdidos',
    }: {
        wins: number;
        losses: number;
        title: string;
        winLabel?: string;
        lossLabel?: string;
    }) => {
        const total = wins + losses;
        if (total === 0) {
            return (
                <div className="text-center text-slate-500 py-4">
                    Sin datos
                </div>
            );
        }

        const winPercentage = wins / total;
        const winAngle = winPercentage * 360;

        const getArcPath = (startAngle: number, endAngle: number, radius: number = 50) => {
            const start = polarToCartesian(60, 60, radius, endAngle);
            const end = polarToCartesian(60, 60, radius, startAngle);
            const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
            return [
                "M", 60, 60,
                "L", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                "Z"
            ].join(" ");
        };

        const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
            const rad = (angle - 90) * Math.PI / 180;
            return {
                x: cx + r * Math.cos(rad),
                y: cy + r * Math.sin(rad)
            };
        };

        return (
            <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-white text-center mb-3">{title}</h4>
                <div className="flex items-center justify-center gap-4">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="#ef4444" opacity="0.3" />
                        {wins > 0 && (
                            <path
                                d={getArcPath(0, winAngle)}
                                fill="#22c55e"
                            />
                        )}
                        <circle cx="60" cy="60" r="25" fill="#1e293b" />
                        <text x="60" y="65" textAnchor="middle" className="fill-white text-lg font-bold">
                            {Math.round(winPercentage * 100)}%
                        </text>
                    </svg>
                    <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-slate-400">{winLabel}:</span>
                            <span className="text-white font-medium">{wins}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 opacity-50"></div>
                            <span className="text-slate-400">{lossLabel}:</span>
                            <span className="text-white font-medium">{losses}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const formatPosition = (pos: number) => {
        if (pos === 1) return '🥇 1°';
        if (pos === 2) return '🥈 2°';
        if (pos === 3) return '🥉 3°';
        return `${pos}°`;
    };

    // Si no hay duelos en ninguna categoría
    if (duels.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Pestañas Oficiales / Entrenamiento */}
            <div className="glass-card p-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    Estadísticas de Duelos
                </h3>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => { setCategory('official'); setSelectedPeriod('thisYear'); }}
                        className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${category === 'official'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Trophy className="w-4 h-4" />
                        Torneos
                        {officialDuels.length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === 'official' ? 'bg-black/20' : 'bg-white/10'
                                }`}>
                                {officialDuels.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setCategory('training'); setSelectedPeriod('thisYear'); }}
                        className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${category === 'training'
                                ? 'bg-primary-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Target className="w-4 h-4" />
                        Entrenamiento
                        {trainingDuels.length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === 'training' ? 'bg-white/20' : 'bg-white/10'
                                }`}>
                                {trainingDuels.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Si no hay datos para la categoría seleccionada */}
                {!stats && (
                    <div className="text-center py-8 text-slate-400">
                        <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Sin duelos de {category === 'official' ? 'torneos' : 'entrenamiento'}</p>
                    </div>
                )}

                {stats && (
                    <>
                        {/* Selector de periodo */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setSelectedPeriod('thisYear')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'thisYear'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                Este Año
                            </button>
                            <button
                                onClick={() => setSelectedPeriod('lastYear')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'lastYear'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                Año Anterior
                            </button>
                            <button
                                onClick={() => setSelectedPeriod('career')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === 'career'
                                        ? 'bg-slate-700 text-white'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                    }`}
                            >
                                Carrera
                            </button>
                        </div>

                        {/* Resumen rápido */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                <div className="text-xs text-slate-400 mb-1">Matches</div>
                                <div className="text-xl font-bold">
                                    <span className="text-green-400">{stats[selectedPeriod].wins}</span>
                                    <span className="text-slate-500"> / </span>
                                    <span className="text-red-400">{stats[selectedPeriod].losses}</span>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                <div className="text-xs text-slate-400 mb-1">Tie Breaks</div>
                                <div className="text-xl font-bold">
                                    <span className="text-green-400">{stats[selectedPeriod].shootOffWins}</span>
                                    <span className="text-slate-500"> / </span>
                                    <span className="text-red-400">{stats[selectedPeriod].shootOffLosses}</span>
                                </div>
                            </div>
                        </div>

                        {/* Gráficos de pastel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <PieChart
                                wins={stats[selectedPeriod].wins}
                                losses={stats[selectedPeriod].losses}
                                title="Matches"
                            />
                            <PieChart
                                wins={stats[selectedPeriod].shootOffWins}
                                losses={stats[selectedPeriod].shootOffLosses}
                                title="Tie Breaks (Shoot-Off)"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Mejor ranking - Solo para oficiales */}
            {category === 'official' && stats && (
                <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Medal className="w-5 h-5 text-yellow-500" />
                        Mejor Ranking en Torneos
                    </h3>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Este año</div>
                            {stats.thisYear.bestRanking ? (
                                <>
                                    <div className="text-xl font-bold text-primary-500">
                                        {formatPosition(stats.thisYear.bestRanking.tournament_position!)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        a {stats.thisYear.bestRanking.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Año pasado</div>
                            {stats.lastYear.bestRanking ? (
                                <>
                                    <div className="text-xl font-bold text-white">
                                        {formatPosition(stats.lastYear.bestRanking.tournament_position!)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        a {stats.lastYear.bestRanking.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-400 mb-1">Carrera</div>
                            {stats.career.bestRanking ? (
                                <>
                                    <div className="text-xl font-bold text-yellow-400">
                                        {formatPosition(stats.career.bestRanking.tournament_position!)}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        a {stats.career.bestRanking.distance}m
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg text-slate-600">-</div>
                            )}
                        </div>
                    </div>

                    {stats.career.bestRanking && (
                        <div className="mt-3 text-center text-xs text-slate-400">
                            {stats.career.bestRanking.tournament_name}
                        </div>
                    )}
                </div>
            )}

            {/* Oponentes frecuentes */}
            {stats && stats.opponents.mostFaced && (
                <div className="glass-card p-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-500" />
                        Rivales Frecuentes
                        <span className="text-xs text-slate-400 font-normal">
                            ({category === 'official' ? 'Torneos' : 'Entrenamiento'})
                        </span>
                    </h3>

                    <div className="space-y-3">
                        {stats.opponents.mostFaced && (
                            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                                <div>
                                    <div className="text-xs text-slate-400">Más enfrentado</div>
                                    <div className="text-white font-medium">{stats.opponents.mostFaced.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-slate-400">{stats.opponents.mostFaced.total} duelos</div>
                                    <div className="text-xs">
                                        <span className="text-green-400">{stats.opponents.mostFaced.wins}W</span>
                                        <span className="text-slate-500"> - </span>
                                        <span className="text-red-400">{stats.opponents.mostFaced.losses}L</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {stats.opponents.mostWinsAgainst && stats.opponents.mostWinsAgainst.wins > 0 && (
                            <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-3">
                                <div>
                                    <div className="text-xs text-green-400">Más victorias contra</div>
                                    <div className="text-white font-medium">{stats.opponents.mostWinsAgainst.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-green-400">{stats.opponents.mostWinsAgainst.wins}</div>
                                    <div className="text-xs text-slate-400">victorias</div>
                                </div>
                            </div>
                        )}

                        {stats.opponents.mostLossesAgainst && stats.opponents.mostLossesAgainst.losses > 0 && (
                            <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-3">
                                <div>
                                    <div className="text-xs text-red-400">Más derrotas contra</div>
                                    <div className="text-white font-medium">{stats.opponents.mostLossesAgainst.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-red-400">{stats.opponents.mostLossesAgainst.losses}</div>
                                    <div className="text-xs text-slate-400">derrotas</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
