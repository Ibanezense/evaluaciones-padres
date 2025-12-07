'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, Student, EVALUATION_CRITERIA, EvaluationCriterion } from '@/lib/supabase';
import {
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    User
} from 'lucide-react';

export default function NuevaEvaluacionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedStudentId = searchParams.get('studentId');

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState(preselectedStudentId || '');
    const [evaluatorName, setEvaluatorName] = useState('');
    const [evaluationDate, setEvaluationDate] = useState(
        new Date().toISOString().split('T')[0]
    );
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
    const [error, setError] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const { data } = await supabase
                .from('students')
                .select('id, first_name, last_name, photo_url')
                .eq('is_active', true)
                .order('first_name');

            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
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

        if (!selectedStudentId) {
            setError('Selecciona un alumno');
            return;
        }
        if (!evaluatorName.trim()) {
            setError('Ingresa el nombre del evaluador');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const { error: insertError } = await supabase
                .from('technical_evaluations')
                .insert({
                    student_id: selectedStudentId,
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
                });

            if (insertError) throw insertError;

            router.push('/admin');
        } catch (err) {
            console.error('Error saving evaluation:', err);
            setError('Error al guardar la evaluación');
        } finally {
            setSaving(false);
        }
    };

    const selectedStudent = students.find(s => s.id === selectedStudentId);

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
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
                        Nueva Evaluación
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selector de alumno */}
                    <div className="glass-card p-4">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Alumno
                        </label>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full"
                            required
                        >
                            <option value="">Seleccionar alumno...</option>
                            {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name}
                                </option>
                            ))}
                        </select>

                        {selectedStudent && (
                            <div className="mt-3 flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                                {selectedStudent.photo_url ? (
                                    <img
                                        src={selectedStudent.photo_url}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                        <User className="w-5 h-5 text-slate-400" />
                                    </div>
                                )}
                                <span className="text-white">
                                    {selectedStudent.first_name} {selectedStudent.last_name}
                                </span>
                            </div>
                        )}
                    </div>

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

                    {/* Botón guardar */}
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
                                Guardar Evaluación
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    );
}
