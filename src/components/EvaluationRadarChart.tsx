'use client';

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { EVALUATION_CRITERIA, TechnicalEvaluation } from '@/lib/supabase';

interface EvaluationRadarChartProps {
    evaluation: TechnicalEvaluation | null;
    showComparison?: boolean;
    previousEvaluation?: TechnicalEvaluation | null;
}

export default function EvaluationRadarChart({
    evaluation,
    showComparison = false,
    previousEvaluation
}: EvaluationRadarChartProps) {
    if (!evaluation) {
        return (
            <div className="glass-card p-6 flex items-center justify-center h-[300px]">
                <p className="text-slate-400">No hay evaluaciones registradas</p>
            </div>
        );
    }

    const data = Object.entries(EVALUATION_CRITERIA).map(([key, label]) => ({
        subject: label,
        current: evaluation[key as keyof TechnicalEvaluation] as number || 0,
        previous: previousEvaluation ? (previousEvaluation[key as keyof TechnicalEvaluation] as number || 0) : undefined,
        fullMark: 10,
    }));

    return (
        <div className="glass-card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
                Evaluación Técnica
            </h3>
            <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid
                            stroke="rgba(148, 163, 184, 0.2)"
                            strokeDasharray="3 3"
                        />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            tickLine={false}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 10]}
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            tickCount={6}
                            axisLine={false}
                        />
                        {showComparison && previousEvaluation && (
                            <Radar
                                name="Anterior"
                                dataKey="previous"
                                stroke="#64748b"
                                fill="#64748b"
                                fillOpacity={0.2}
                                strokeWidth={1}
                                strokeDasharray="4 4"
                            />
                        )}
                        <Radar
                            name="Actual"
                            dataKey="current"
                            stroke="#f97316"
                            fill="#f97316"
                            fillOpacity={0.4}
                            strokeWidth={2}
                            dot={{ fill: '#f97316', strokeWidth: 0, r: 4 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: '#f8fafc',
                            }}
                            formatter={(value: number, name: string) => [
                                `${value}/10`,
                                name === 'current' ? 'Actual' : 'Anterior'
                            ]}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Leyenda */}
            <div className="flex justify-center gap-6 mt-2 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-slate-400">Evaluación actual</span>
                </div>
                {showComparison && previousEvaluation && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-500" />
                        <span className="text-slate-400">Anterior</span>
                    </div>
                )}
            </div>
        </div>
    );
}
