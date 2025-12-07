'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TechnicalEvaluation } from '@/lib/supabase';
import EvaluationRadarChart from '@/components/EvaluationRadarChart';
import EvaluationHistory from '@/components/EvaluationHistory';
import { Loader2, ClipboardCheck, Activity, List, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TecnicaPage() {
    const [evaluations, setEvaluations] = useState<TechnicalEvaluation[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<TechnicalEvaluation | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'radar' | 'history'>('radar');
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            router.push('/');
            return;
        }
        loadEvaluations(studentId);
    }, [router]);

    const loadEvaluations = async (studentId: string) => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('technical_evaluations')
                .select('*')
                .eq('student_id', studentId)
                .order('evaluation_date', { ascending: false });

            setEvaluations(data || []);
            if (data && data.length > 0) {
                setSelectedEvaluation(data[0]);
            }
        } catch (err) {
            console.error('Error loading evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    const passedCount = evaluations.filter(e => e.is_passed).length;

    return (
        <main className="p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-blue-400" />
                        Evaluaciones Técnicas
                    </h1>
                    <p className="text-sm text-slate-400">
                        {evaluations.length} evaluaciones • {passedCount} aprobadas
                    </p>
                </header>

                {/* Tabs de vista */}
                <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-lg p-1">
                    <button
                        onClick={() => setActiveView('radar')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeView === 'radar'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Activity className="w-4 h-4" />
                        Análisis
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeView === 'history'
                            ? 'bg-blue-500 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <List className="w-4 h-4" />
                        Historial
                    </button>
                </div>

                {/* Contenido */}
                {evaluations.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <ClipboardCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-2">Sin evaluaciones técnicas</p>
                        <p className="text-xs text-slate-500">
                            Aquí aparecerán las evaluaciones de técnica
                        </p>
                    </div>
                ) : (
                    <>
                        {activeView === 'radar' && (
                            <div className="animate-fade-in space-y-4">
                                {/* Selector de evaluación */}
                                <div className="glass-card p-4">
                                    <label className="block text-sm text-slate-400 mb-2">
                                        Seleccionar evaluación:
                                    </label>
                                    <select
                                        value={selectedEvaluation?.id || ''}
                                        onChange={(e) => {
                                            const eval_ = evaluations.find(ev => ev.id === e.target.value);
                                            setSelectedEvaluation(eval_ || null);
                                        }}
                                        className="w-full"
                                    >
                                        {evaluations.map((ev) => (
                                            <option key={ev.id} value={ev.id}>
                                                {format(parseISO(ev.evaluation_date), "d 'de' MMMM, yyyy", { locale: es })}
                                                {ev.is_passed ? ' ✓' : ''}
                                            </option>
                                        ))}
                                    </select>

                                    {evaluations.length > 1 && (
                                        <label className="flex items-center gap-2 mt-3 text-sm text-slate-400">
                                            <input
                                                type="checkbox"
                                                checked={showComparison}
                                                onChange={(e) => setShowComparison(e.target.checked)}
                                                className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                            />
                                            Comparar con anterior
                                        </label>
                                    )}
                                </div>

                                {/* Estado de la evaluación */}
                                {selectedEvaluation && (
                                    <div className={`glass-card p-4 flex items-center justify-between ${selectedEvaluation.is_passed
                                        ? 'border-green-500/30'
                                        : 'border-yellow-500/30'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            {selectedEvaluation.is_passed ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-yellow-400" />
                                            )}
                                            <span className={selectedEvaluation.is_passed ? 'text-green-400' : 'text-yellow-400'}>
                                                {selectedEvaluation.is_passed ? 'Aprobado' : 'En progreso'}
                                            </span>
                                        </div>
                                        <span className="text-sm text-slate-400">
                                            por {selectedEvaluation.evaluator_name}
                                        </span>
                                    </div>
                                )}

                                {/* Gráfico radar */}
                                {selectedEvaluation && (
                                    <div className="glass-card p-4">
                                        <EvaluationRadarChart
                                            evaluation={selectedEvaluation}
                                            previousEvaluation={showComparison && evaluations.length > 1
                                                ? evaluations.find(e => e.id !== selectedEvaluation.id)
                                                : undefined}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeView === 'history' && (
                            <div className="animate-fade-in">
                                <EvaluationHistory evaluations={evaluations} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
