'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Student, TechnicalEvaluation, EVALUATION_CRITERIA, EvaluationCriterion } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    User,
    Trash2
} from 'lucide-react';

export default function EditarEvaluacionPage() {
    const router = useRouter();
    const params = useParams();
    const evaluationId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [evaluatorName, setEvaluatorName] = useState('');
    const [evaluationDate, setEvaluationDate] = useState('');
    const [scores, setScores] = useState<Record<EvaluationCriterion, number>>({
        stance: 5,
        draw: 5,
        grip: 5,
        anchor: 5,
        release: 5,
        expansion: 5,
        follow_through: 5,
        safety: 5,
    });
    const [isPassed, setIsPassed] = useState(false);
    const [strengths, setStrengths] = useState('');
    const [areasToImprove, setAreasToImprove] = useState('');
    const [goals, setGoals] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadEvaluation();
    }, [evaluationId]);

    const loadEvaluation = async () => {
        try {
            // Cargar evaluación con datos del alumno
            const { data, error: evalError } = await supabase
                .from('technical_evaluations')
                .select('*, student:students(*)')
                .eq('id', evaluationId)
                .single();

            if (evalError) throw evalError;

            const evaluation = data as TechnicalEvaluation & { student: Student };
            setStudent(evaluation.student);
            setEvaluatorName(evaluation.evaluator_name);
            setEvaluationDate(evaluation.evaluation_date.split('T')[0]);
            setScores({
                stance: evaluation.stance || 0,
                draw: evaluation.draw || 0,
                grip: evaluation.grip || 0,
                anchor: evaluation.anchor || 0,
                release: evaluation.release || 0,
                expansion: evaluation.expansion || 0,
                follow_through: evaluation.follow_through || 0,
                safety: evaluation.safety || 0,
            });
            setIsPassed(evaluation.is_passed);
            setStrengths(evaluation.strengths || '');
            setAreasToImprove(evaluation.areas_to_improve || '');
            setGoals(evaluation.goals || '');

        } catch (err) {
            console.error('Error loading evaluation:', err);
            setError('Error al cargar la evaluación');
        } finally {
            setLoading(false);
        }
    };

    const calculateAverage = () => {
        const values = Object.values(scores);
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const handleScoreChange = (key: EvaluationCriterion, value: number) => {
        setScores(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const { error: updateError } = await supabase
                .from('technical_evaluations')
                .update({
                    evaluation_date: evaluationDate,
                    evaluator_name: evaluatorName.trim(),
                    stance: scores.stance,
                    draw: scores.draw,
                    grip: scores.grip,
                    anchor: scores.anchor,
                    release: scores.release,
                    expansion: scores.expansion,
                    follow_through: scores.follow_through,
                    safety: scores.safety,
                    score_total: Math.round(calculateAverage() * 10),
                    is_passed: isPassed,
                    strengths: strengths.trim(),
                    areas_to_improve: areasToImprove.trim(),
                    goals: goals.trim() || null,
                })
                .eq('id', evaluationId);

            if (updateError) throw updateError;

            router.push('/admin');
        } catch (err) {
            console.error('Error updating evaluation:', err);
            setError('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error: deleteError } = await supabase
                .from('technical_evaluations')
                .delete()
                .eq('id', evaluationId);

            if (deleteError) throw deleteError;
            router.push('/admin');
        } catch (err) {
            console.error('Error deleting evaluation:', err);
            setError('Error al eliminar la evaluación');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    if (error && !student) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-6 text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={() => router.back()} className="btn btn-primary">
                        Volver
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        Editar Evaluación
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Info del alumno */}
                    {student && (
                        <div className="glass-card p-4">
                            <div className="flex items-center gap-3">
                                {student.photo_url ? (
                                    <img
                                        src={student.photo_url}
                                        alt=""
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                                        <User className="w-6 h-6 text-slate-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-medium">
                                        {student.first_name} {student.last_name}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {student.level} • {student.discipline}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Datos de la evaluación */}
                    <div className="glass-card p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Evaluador
                            </label>
                            <input
                                type="text"
                                value={evaluatorName}
                                onChange={(e) => setEvaluatorName(e.target.value)}
                                placeholder="Nombre del evaluador"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha de evaluación
                            </label>
                            <input
                                type="date"
                                value={evaluationDate}
                                onChange={(e) => setEvaluationDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Puntajes */}
                    <div className="glass-card p-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Puntuaciones (0-10)
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(EVALUATION_CRITERIA).map(([key, label]) => (
                                <div key={key}>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm text-slate-300">{label}</label>
                                        <span className="text-lg font-bold text-primary-500">
                                            {scores[key as EvaluationCriterion]}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={scores[key as EvaluationCriterion]}
                                        onChange={(e) => handleScoreChange(
                                            key as EvaluationCriterion,
                                            parseInt(e.target.value)
                                        )}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Promedio */}
                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Promedio</span>
                                <span className="text-2xl font-bold text-primary-500">
                                    {calculateAverage().toFixed(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estado de aprobación */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Estado de la evaluación
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPassed(true)}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${isPassed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <CheckCircle className="w-5 h-5" />
                                Aprobado
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPassed(false)}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${!isPassed
                                        ? 'bg-red-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                <XCircle className="w-5 h-5" />
                                Pendiente
                            </button>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="glass-card p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fortalezas
                            </label>
                            <textarea
                                value={strengths}
                                onChange={(e) => setStrengths(e.target.value)}
                                placeholder="Aspectos positivos del alumno..."
                                rows={2}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Áreas de mejora
                            </label>
                            <textarea
                                value={areasToImprove}
                                onChange={(e) => setAreasToImprove(e.target.value)}
                                placeholder="Aspectos a trabajar..."
                                rows={2}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Objetivos (opcional)
                            </label>
                            <textarea
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                                placeholder="Metas para la próxima evaluación..."
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Botones */}
                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn btn-primary w-full disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Guardar Cambios
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn btn-secondary w-full text-red-400 border-red-500/30 hover:border-red-500"
                        >
                            <Trash2 className="w-5 h-5" />
                            Eliminar Evaluación
                        </button>
                    </div>
                </form>

                {/* Modal de confirmación de eliminación */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                        <div className="glass-card p-6 max-w-sm w-full animate-fade-in">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                ¿Eliminar evaluación?
                            </h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn flex-1 bg-red-500 text-white hover:bg-red-600"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Eliminar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
