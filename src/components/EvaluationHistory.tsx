'use client';

import { TechnicalEvaluation, EVALUATION_CRITERIA } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { useState } from 'react';

interface EvaluationHistoryProps {
    evaluations: TechnicalEvaluation[];
    onSelectEvaluation?: (evaluation: TechnicalEvaluation) => void;
    selectedId?: string;
}

export default function EvaluationHistory({
    evaluations,
    onSelectEvaluation,
    selectedId
}: EvaluationHistoryProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (evaluations.length === 0) {
        return (
            <div className="glass-card p-6 text-center">
                <p className="text-slate-400">No hay evaluaciones registradas aún</p>
            </div>
        );
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">
                Historial de Evaluaciones
            </h3>

            {evaluations.map((evaluation, index) => {
                const isExpanded = expandedId === evaluation.id;
                const isSelected = selectedId === evaluation.id;
                const date = format(parseISO(evaluation.evaluation_date), "d 'de' MMMM, yyyy", { locale: es });

                // Calcular promedio de las 8 calificaciones
                const scores = [
                    evaluation.stance,
                    evaluation.draw,
                    evaluation.grip || 0,
                    evaluation.anchor,
                    evaluation.release,
                    evaluation.expansion || 0,
                    evaluation.follow_through,
                    evaluation.safety || 0,
                ];
                const average = scores.reduce((a, b) => a + b, 0) / scores.length;

                return (
                    <div
                        key={evaluation.id}
                        className={`glass-card overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-primary-500' : ''
                            }`}
                    >
                        {/* Header - clickeable */}
                        <button
                            onClick={() => {
                                toggleExpand(evaluation.id);
                                onSelectEvaluation?.(evaluation);
                            }}
                            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${evaluation.is_passed
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {evaluation.is_passed ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <XCircle className="w-5 h-5" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{date}</p>
                                    <p className="text-sm text-slate-400">
                                        Promedio: {average.toFixed(1)}/10
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${evaluation.is_passed ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {evaluation.is_passed ? 'Aprobado' : 'Pendiente'}
                                </span>
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''
                                    }`} />
                            </div>
                        </button>

                        {/* Contenido expandido */}
                        {isExpanded && (
                            <div className="border-t border-slate-700/50 p-4 animate-fade-in">
                                {/* Evaluador */}
                                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                                    <User className="w-4 h-4" />
                                    Evaluador: <span className="text-white">{evaluation.evaluator_name}</span>
                                </div>

                                {/* Grid de puntajes */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {Object.entries(EVALUATION_CRITERIA).map(([key, label]) => {
                                        const score = evaluation[key as keyof TechnicalEvaluation] as number || 0;
                                        const getScoreColor = (s: number) => {
                                            if (s >= 8) return 'text-green-400';
                                            if (s >= 6) return 'text-yellow-400';
                                            return 'text-red-400';
                                        };

                                        return (
                                            <div
                                                key={key}
                                                className="bg-slate-800/50 rounded-lg p-2 text-center"
                                            >
                                                <p className="text-xs text-slate-400 mb-1">{label}</p>
                                                <p className={`text-lg font-bold ${getScoreColor(score)}`}>
                                                    {score}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Fortalezas y áreas de mejora */}
                                <div className="space-y-3">
                                    {evaluation.strengths && (
                                        <div>
                                            <p className="text-xs text-green-400 font-medium mb-1">Fortalezas</p>
                                            <p className="text-sm text-slate-300 bg-green-500/10 rounded-lg p-2">
                                                {evaluation.strengths}
                                            </p>
                                        </div>
                                    )}

                                    {evaluation.areas_to_improve && (
                                        <div>
                                            <p className="text-xs text-yellow-400 font-medium mb-1">Áreas de mejora</p>
                                            <p className="text-sm text-slate-300 bg-yellow-500/10 rounded-lg p-2">
                                                {evaluation.areas_to_improve}
                                            </p>
                                        </div>
                                    )}

                                    {evaluation.goals && (
                                        <div>
                                            <p className="text-xs text-primary-400 font-medium mb-1">Objetivos</p>
                                            <p className="text-sm text-slate-300 bg-primary-500/10 rounded-lg p-2">
                                                {evaluation.goals}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
