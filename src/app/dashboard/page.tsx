'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Student, TrainingControl, TechnicalEvaluation } from '@/lib/supabase';
import StudentCard from '@/components/StudentCard';
import { Loader2, RefreshCw, Target, ClipboardCheck, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardHomePage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [lastControl, setLastControl] = useState<TrainingControl | null>(null);
    const [lastEvaluation, setLastEvaluation] = useState<TechnicalEvaluation | null>(null);
    const [controlCount, setControlCount] = useState(0);
    const [evaluationCount, setEvaluationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            router.push('/');
            return;
        }
        loadData(studentId);
    }, [router]);

    const loadData = async (studentId: string) => {
        try {
            setLoading(true);

            // Cargar datos del alumno
            const { data: studentData } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            setStudent(studentData);

            // Cargar último control
            const { data: controls, count: controlsCount } = await supabase
                .from('training_controls')
                .select('*', { count: 'exact' })
                .eq('student_id', studentId)
                .order('control_date', { ascending: false })
                .limit(1);

            if (controls && controls.length > 0) {
                setLastControl(controls[0]);
            }
            setControlCount(controlsCount || 0);

            // Cargar última evaluación
            const { data: evaluations, count: evalsCount } = await supabase
                .from('technical_evaluations')
                .select('*', { count: 'exact' })
                .eq('student_id', studentId)
                .order('evaluation_date', { ascending: false })
                .limit(1);

            if (evaluations && evaluations.length > 0) {
                setLastEvaluation(evaluations[0]);
            }
            setEvaluationCount(evalsCount || 0);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/');
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
                <div className="glass-card p-6 text-center max-w-sm">
                    <p className="text-red-400 mb-4">Alumno no encontrado</p>
                    <button onClick={handleLogout} className="btn btn-primary">
                        Volver al inicio
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-slate-400 text-sm">Bienvenido 👋</p>
                        <h1 className="text-xl font-bold text-white">
                            {student.first_name}
                        </h1>
                    </div>
                    <button
                        onClick={() => loadData(student.id)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </header>

                {/* Card del alumno compacta */}
                <div className="glass-card p-4 mb-4">
                    <div className="flex items-center gap-4">
                        {student.photo_url ? (
                            <img
                                src={student.photo_url}
                                alt={student.first_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary-500"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-primary-500">
                                <span className="text-2xl font-bold text-primary-400">
                                    {student.first_name[0]}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-white">
                                {student.first_name} {student.last_name}
                            </h2>
                            <p className="text-sm text-slate-400">
                                {student.level} • {student.discipline}
                            </p>
                            <p className="text-xs text-primary-400">
                                Distancia: {student.assigned_distance}m
                            </p>
                        </div>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        onClick={() => router.push('/dashboard/controles')}
                        className="glass-card p-4 text-left hover:border-primary-500/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-5 h-5 text-primary-500" />
                            <span className="text-sm text-slate-400">Controles</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{controlCount}</p>
                        <p className="text-xs text-slate-500">registros</p>
                    </button>

                    <button
                        onClick={() => router.push('/dashboard/tecnica')}
                        className="glass-card p-4 text-left hover:border-primary-500/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardCheck className="w-5 h-5 text-blue-400" />
                            <span className="text-sm text-slate-400">Evaluaciones</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{evaluationCount}</p>
                        <p className="text-xs text-slate-500">técnicas</p>
                    </button>
                </div>

                {/* Último control */}
                {lastControl && (
                    <div className="glass-card p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Target className="w-4 h-4 text-primary-500" />
                                Último Control
                            </h3>
                            <span className="text-xs text-slate-500">
                                {format(parseISO(lastControl.control_date), "d MMM", { locale: es })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-3xl font-bold text-primary-500">
                                    {lastControl.total_score}
                                </span>
                                <span className="text-slate-400 ml-2">pts</span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-400">{lastControl.distance}m</p>
                                <p className="text-xs text-slate-500">
                                    Avg: {lastControl.arrow_average}
                                </p>
                            </div>
                        </div>
                        {lastControl.is_academy_record && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                                <Trophy className="w-3 h-3" />
                                Récord de academia
                            </div>
                        )}
                    </div>
                )}

                {/* Última evaluación */}
                {lastEvaluation && (
                    <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <ClipboardCheck className="w-4 h-4 text-blue-400" />
                                Última Evaluación
                            </h3>
                            <span className="text-xs text-slate-500">
                                {format(parseISO(lastEvaluation.evaluation_date), "d MMM", { locale: es })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${lastEvaluation.is_passed
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {lastEvaluation.is_passed ? '✓ Aprobado' : 'En progreso'}
                            </div>
                            <p className="text-sm text-slate-400">
                                por {lastEvaluation.evaluator_name}
                            </p>
                        </div>
                    </div>
                )}

                {/* Mensaje si no hay datos */}
                {!lastControl && !lastEvaluation && (
                    <div className="glass-card p-6 text-center">
                        <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Aún no hay registros</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Los controles y evaluaciones aparecerán aquí
                        </p>
                    </div>
                )}

                {/* Botón salir */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-6 py-3 text-slate-400 hover:text-white text-sm transition-colors"
                >
                    Cerrar sesión
                </button>
            </div>
        </main>
    );
}
