'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Student, TechnicalEvaluation, TrainingControl, Duel, DuelSet } from '@/lib/supabase';
import StudentCard from '@/components/StudentCard';
import EvaluationRadarChart from '@/components/EvaluationRadarChart';
import EvaluationHistory from '@/components/EvaluationHistory';
import TrainingControlHistory from '@/components/TrainingControlHistory';
import TrainingStats from '@/components/TrainingStats';
import TrainingChart from '@/components/TrainingChart';
import DuelHistory from '@/components/DuelHistory';
import DuelStats from '@/components/DuelStats';
import { ArrowLeft, Loader2, Eye, TrendingUp, Target, ClipboardCheck, Plus, Edit, Swords } from 'lucide-react';

export default function PreviewAlumnoPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [evaluations, setEvaluations] = useState<TechnicalEvaluation[]>([]);
    const [controls, setControls] = useState<TrainingControl[]>([]);
    const [duels, setDuels] = useState<(Duel & { sets?: DuelSet[], opponent_student?: Student })[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<TechnicalEvaluation | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeSection, setActiveSection] = useState<'controls' | 'duels' | 'evaluations'>('controls');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [studentId]);

    const loadData = async () => {
        try {
            // Cargar datos del alumno
            const { data: studentData } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            setStudent(studentData);

            // Cargar evaluaciones
            const { data: evaluationsData } = await supabase
                .from('technical_evaluations')
                .select('*')
                .eq('student_id', studentId)
                .order('evaluation_date', { ascending: false });

            setEvaluations(evaluationsData || []);

            if (evaluationsData && evaluationsData.length > 0) {
                setSelectedEvaluation(evaluationsData[0]);
            }

            // Cargar controles de entrenamiento
            const { data: controlsData } = await supabase
                .from('training_controls')
                .select('*')
                .eq('student_id', studentId)
                .order('control_date', { ascending: false });

            setControls(controlsData || []);

            // Cargar duelos
            const { data: duelsData } = await supabase
                .from('duels')
                .select(`
                    *,
                    opponent_student:opponent_student_id(id, first_name, last_name, photo_url),
                    sets:duel_sets(*)
                `)
                .eq('student_id', studentId)
                .order('duel_date', { ascending: false });

            setDuels(duelsData || []);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPreviousEvaluation = () => {
        if (!selectedEvaluation) return null;
        const currentIndex = evaluations.findIndex(e => e.id === selectedEvaluation.id);
        return currentIndex < evaluations.length - 1 ? evaluations[currentIndex + 1] : null;
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    if (!student) {
        return (
            <main className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-6 text-center">
                    <p className="text-red-400 mb-4">Alumno no encontrado</p>
                    <button onClick={() => router.back()} className="btn btn-primary">
                        Volver
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Volver</span>
                    </button>

                    <div className="flex items-center gap-2 bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-full text-sm">
                        <Eye className="w-4 h-4" />
                        Vista Previa
                    </div>
                </header>

                {/* Banner informativo */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-sm text-blue-400 text-center">
                    Vista como padre • Código: <strong>{student.access_code}</strong>
                </div>

                {/* Botones de acciones admin */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <Link
                        href={`/admin/control/nuevo?studentId=${student.id}`}
                        className="btn btn-primary text-sm py-2"
                    >
                        <Target className="w-4 h-4" />
                        Control
                    </Link>
                    <Link
                        href={`/admin/duelo/nuevo?studentId=${student.id}`}
                        className="btn btn-secondary text-sm py-2"
                    >
                        <Swords className="w-4 h-4" />
                        Duelo
                    </Link>
                    <Link
                        href={`/admin/nueva?studentId=${student.id}`}
                        className="btn btn-secondary text-sm py-2"
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        Eval.
                    </Link>
                    <Link
                        href={`/admin/alumno/${student.id}`}
                        className="btn btn-secondary text-sm py-2"
                    >
                        <Edit className="w-4 h-4" />
                        Editar
                    </Link>
                </div>

                {/* Tarjeta del alumno */}
                <StudentCard student={student} />

                {/* Tabs de sección */}
                <div className="flex gap-2 my-6">
                    <button
                        onClick={() => setActiveSection('controls')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === 'controls'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Target className="w-5 h-5" />
                        Controles
                        {controls.length > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {controls.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSection('duels')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === 'duels'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Swords className="w-5 h-5" />
                        Duelos
                        {duels.length > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {duels.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSection('evaluations')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === 'evaluations'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <ClipboardCheck className="w-5 h-5" />
                        Eval.
                        {evaluations.length > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {evaluations.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Contenido según sección activa */}
                {activeSection === 'controls' && (
                    <div className="space-y-6">
                        <TrainingStats controls={controls} />
                        <TrainingChart controls={controls} />
                        <TrainingControlHistory controls={controls} />
                    </div>
                )}

                {activeSection === 'duels' && (
                    <div className="space-y-6">
                        <DuelStats duels={duels} />
                        <DuelHistory duels={duels} showStudent={false} showEditButton={true} />
                    </div>
                )}

                {activeSection === 'evaluations' && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary-500" />
                                    <span className="text-slate-300 text-sm">Última evaluación</span>
                                </div>
                                {evaluations.length > 1 && (
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={showComparison}
                                            onChange={(e) => setShowComparison(e.target.checked)}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-slate-400">Comparar</span>
                                    </label>
                                )}
                            </div>
                            <EvaluationRadarChart
                                evaluation={selectedEvaluation}
                                showComparison={showComparison}
                                previousEvaluation={getPreviousEvaluation()}
                            />
                        </div>

                        <EvaluationHistory
                            evaluations={evaluations}
                            onSelectEvaluation={setSelectedEvaluation}
                            selectedId={selectedEvaluation?.id}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
