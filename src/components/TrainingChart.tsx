'use client';

import { useMemo, useState } from 'react';
import { TrainingControl, DISTANCES } from '@/lib/supabase';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid
} from 'recharts';
import { TrendingUp, Target, Trophy } from 'lucide-react';

interface TrainingChartProps {
    controls: TrainingControl[];
}

type FilterType = 'thisYear' | 'twoYears' | 'all';

export default function TrainingChart({ controls }: TrainingChartProps) {
    const [filterType, setFilterType] = useState<FilterType>('thisYear');
    const [selectedDistance, setSelectedDistance] = useState<number | 'all'>('all');

    // Separar controles en entrenamiento y torneos
    const { trainingControls, tournamentControls } = useMemo(() => {
        const training = controls.filter(c => c.event_type === 'training');
        const tournament = controls.filter(c => c.event_type !== 'training');
        return { trainingControls: training, tournamentControls: tournament };
    }, [controls]);

    // Función para filtrar por tiempo
    const filterByTime = (data: TrainingControl[]) => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

        // Filtrar por distancia primero
        let filtered = selectedDistance === 'all'
            ? data
            : data.filter(c => c.distance === selectedDistance);

        switch (filterType) {
            case 'thisYear':
                filtered = filtered.filter(c => new Date(c.control_date) >= startOfYear);
                break;
            case 'twoYears':
                filtered = filtered.filter(c => new Date(c.control_date) >= twoYearsAgo);
                break;
            case 'all':
                // Sin filtro de tiempo
                break;
        }

        return filtered;
    };

    // Función para mapear datos al formato del gráfico
    const mapToChartData = (data: TrainingControl[]) => {
        return data
            .sort((a, b) => new Date(a.control_date).getTime() - new Date(b.control_date).getTime())
            .map(c => ({
                date: new Date(c.control_date).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit'
                }),
                fullDate: new Date(c.control_date).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                score: c.total_score,
                distance: c.distance,
                arrowAvg: c.arrow_average,
                isRecord: c.is_academy_record,
                tournamentName: c.tournament_name,
                position: c.position,
            }));
    };

    const trainingChartData = useMemo(() => {
        return mapToChartData(filterByTime(trainingControls));
    }, [trainingControls, filterType, selectedDistance]);

    const tournamentChartData = useMemo(() => {
        return mapToChartData(filterByTime(tournamentControls));
    }, [tournamentControls, filterType, selectedDistance]);

    // Obtener distancias únicas disponibles
    const availableDistances = useMemo(() => {
        const distances = new Set(controls.map(c => c.distance));
        return Array.from(distances).sort((a, b) => a - b);
    }, [controls]);

    if (controls.length === 0) {
        return null;
    }

    const TrainingTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium">{data.fullDate}</p>
                    <p className="text-primary-500 font-bold text-lg">{data.score} pts</p>
                    <p className="text-slate-400 text-sm">
                        {data.distance}m • Avg: {data.arrowAvg}
                    </p>
                    {data.isRecord && (
                        <p className="text-yellow-400 text-xs mt-1">⭐ Récord de la Academia</p>
                    )}
                </div>
            );
        }
        return null;
    };

    const TournamentTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-yellow-500/50 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium">{data.fullDate}</p>
                    <p className="text-yellow-400 font-bold text-lg">{data.score} pts</p>
                    <p className="text-slate-400 text-sm">
                        {data.distance}m • Avg: {data.arrowAvg}
                    </p>
                    {data.tournamentName && (
                        <p className="text-yellow-300 text-xs mt-1">🏆 {data.tournamentName}</p>
                    )}
                    {data.position && (
                        <p className="text-green-400 text-xs">📍 Posición: {data.position}º</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                    Evolución
                </h3>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-4">
                {/* Filtro de tiempo */}
                <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setFilterType('thisYear')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === 'thisYear'
                            ? 'bg-primary-500 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Este año
                    </button>
                    <button
                        onClick={() => setFilterType('twoYears')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === 'twoYears'
                            ? 'bg-primary-500 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Últimos 2 años
                    </button>
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Todos
                    </button>
                </div>

                {/* Filtro de distancia */}
                <select
                    value={selectedDistance}
                    onChange={(e) => setSelectedDistance(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="bg-slate-800 border-slate-700 rounded-lg px-3 py-1.5 text-xs"
                >
                    <option value="all">Todas las distancias</option>
                    {availableDistances.map(d => (
                        <option key={d} value={d}>{d}m</option>
                    ))}
                </select>
            </div>

            {/* Gráfico de Entrenamientos */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-slate-300">Entrenamientos</span>
                    <span className="text-xs text-slate-500">({trainingChartData.length} controles)</span>
                </div>

                {trainingChartData.length > 0 ? (
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trainingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickLine={{ stroke: '#64748b' }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickLine={{ stroke: '#64748b' }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<TrainingTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{ fill: '#f97316', strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, fill: '#f97316' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[100px] flex items-center justify-center text-slate-500 text-sm bg-slate-800/30 rounded-lg">
                        No hay entrenamientos para mostrar
                    </div>
                )}
            </div>

            {/* Gráfico de Torneos */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-slate-300">Torneos</span>
                    <span className="text-xs text-slate-500">({tournamentChartData.length} controles)</span>
                </div>

                {tournamentChartData.length > 0 ? (
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={tournamentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickLine={{ stroke: '#64748b' }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickLine={{ stroke: '#64748b' }}
                                    domain={['auto', 'auto']}
                                />
                                <Tooltip content={<TournamentTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#eab308"
                                    strokeWidth={2}
                                    dot={{ fill: '#eab308', strokeWidth: 2, r: 3 }}
                                    activeDot={{ r: 5, fill: '#eab308' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[100px] flex items-center justify-center text-slate-500 text-sm bg-slate-800/30 rounded-lg">
                        No hay torneos para mostrar
                    </div>
                )}
            </div>
        </div>
    );
}
