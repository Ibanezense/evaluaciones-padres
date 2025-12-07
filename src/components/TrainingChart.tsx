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
import { TrendingUp, Filter } from 'lucide-react';

interface TrainingChartProps {
    controls: TrainingControl[];
}

type FilterType = 'recent' | 'best' | 'all';

export default function TrainingChart({ controls }: TrainingChartProps) {
    const [filterType, setFilterType] = useState<FilterType>('recent');
    const [selectedDistance, setSelectedDistance] = useState<number | 'all'>('all');

    const chartData = useMemo(() => {
        if (controls.length === 0) return [];

        // Filtrar por distancia si está seleccionada
        let filtered = selectedDistance === 'all'
            ? controls
            : controls.filter(c => c.distance === selectedDistance);

        // Aplicar filtro de tipo
        const now = new Date();
        const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 1);

        switch (filterType) {
            case 'recent':
                // Últimos 4 meses
                filtered = filtered.filter(c => new Date(c.control_date) >= fourMonthsAgo);
                break;
            case 'best':
                // Top 16 mejores puntajes del último año
                const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                filtered = filtered
                    .filter(c => new Date(c.control_date) >= oneYearAgo)
                    .sort((a, b) => b.total_score - a.total_score)
                    .slice(0, 16)
                    .sort((a, b) => new Date(a.control_date).getTime() - new Date(b.control_date).getTime());
                break;
            case 'all':
                // Todos, pero limitar a 16 más recientes para no saturar
                filtered = filtered.slice(0, 16);
                break;
        }

        // Ordenar por fecha ascendente para el gráfico
        return filtered
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
            }));
    }, [controls, filterType, selectedDistance]);

    // Obtener distancias únicas disponibles
    const availableDistances = useMemo(() => {
        const distances = new Set(controls.map(c => c.distance));
        return Array.from(distances).sort((a, b) => a - b);
    }, [controls]);

    if (controls.length === 0) {
        return null;
    }

    const CustomTooltip = ({ active, payload }: any) => {
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
                        onClick={() => setFilterType('recent')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === 'recent'
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        4 meses
                    </button>
                    <button
                        onClick={() => setFilterType('best')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filterType === 'best'
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        16 mejores
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

            {/* Gráfico */}
            {chartData.length > 0 ? (
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickLine={{ stroke: '#64748b' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                tickLine={{ stroke: '#64748b' }}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#f97316' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[240px] flex items-center justify-center text-slate-400">
                    No hay datos para mostrar con estos filtros
                </div>
            )}

            <div className="text-xs text-slate-500 text-center mt-2">
                {chartData.length} puntos mostrados
            </div>
        </div>
    );
}
