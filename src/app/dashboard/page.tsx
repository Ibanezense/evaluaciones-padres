'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Student, TrainingControl, TechnicalEvaluation, Badge, StudentBadge, MEMBERSHIP_STATUS, ClassAttendance } from '@/lib/supabase';
import StudentCard from '@/components/StudentCard';
import AttendanceCardTutor from '@/components/AttendanceCardTutor';
import { Loader2, RefreshCw, Target, ClipboardCheck, TrendingUp, Trophy, Calendar, Award, ChevronRight, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardHomePage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [lastControl, setLastControl] = useState<TrainingControl | null>(null);
    const [lastEvaluation, setLastEvaluation] = useState<TechnicalEvaluation | null>(null);
    const [recentBadges, setRecentBadges] = useState<(StudentBadge & { badge: Badge })[]>([]);
    const [controlCount, setControlCount] = useState(0);
    const [evaluationCount, setEvaluationCount] = useState(0);
    const [attendances, setAttendances] = useState<ClassAttendance[]>([]);
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

            // Cargar últimos 5 badges
            const { data: badgesData } = await supabase
                .from('student_badges')
                .select('*, badge:badges(*)')
                .eq('student_id', studentId)
                .order('awarded_at', { ascending: false })
                .limit(5);

            setRecentBadges(badgesData || []);

            // Cargar asistencias
            const { data: attendancesData } = await supabase
                .from('class_attendances')
                .select('*')
                .eq('student_id', studentId)
                .order('class_date', { ascending: true });

            setAttendances(attendancesData || []);

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
                    {/* Membresía */}
                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${student.membership_status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : student.membership_status === 'debt'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-slate-600/50 text-slate-400'
                            }`}>
                            {MEMBERSHIP_STATUS[student.membership_status] || 'Sin estado'}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            {student.membership_start_date && (
                                <span className="text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(parseISO(student.membership_start_date), "d MMM", { locale: es })}
                                </span>
                            )}
                            <span className="text-slate-400">
                                Clases: <span className={`font-bold ${student.remaining_classes <= 2 ? 'text-red-400' : 'text-primary-400'}`}>{student.remaining_classes}</span>/{student.total_classes}
                            </span>
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
                            <span className="text-sm text-slate-400">Puntajes</span>
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

                {/* Últimos logros */}
                <div
                    className="glass-card p-4 mb-4 cursor-pointer hover:border-primary-500/50 transition-colors"
                    onClick={() => router.push('/dashboard/badges')}
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            Últimos logros
                        </h3>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                    {recentBadges.length > 0 ? (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {recentBadges.map((sb) => (
                                <div
                                    key={sb.id}
                                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{
                                        backgroundColor: sb.badge?.color_hex
                                            ? `${sb.badge.color_hex}20`
                                            : 'rgba(249, 115, 22, 0.2)',
                                        borderColor: sb.badge?.color_hex || '#f97316',
                                        borderWidth: '1px'
                                    }}
                                    title={sb.badge?.description ? `${sb.badge.name}: ${sb.badge.description}` : sb.badge?.name}
                                >
                                    {sb.badge?.icon_url ? (
                                        <img
                                            src={sb.badge.icon_url}
                                            alt={sb.badge.name}
                                            className="w-8 h-8 object-contain"
                                        />
                                    ) : (
                                        <Award
                                            className="w-7 h-7"
                                            style={{ color: sb.badge?.color_hex || '#f97316' }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Cuando consiga sus primeros badges, aparecerán aquí.
                        </p>
                    )}
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

                {/* Mis Clases - Asistencia */}
                {student.total_classes > 0 && (
                    <div className="glass-card p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <CalendarClock className="w-4 h-4 text-primary-500" />
                                Mis Clases
                            </h3>
                            <span className="text-xs text-slate-500">
                                {student.remaining_classes}/{student.total_classes} restantes
                            </span>
                        </div>
                        {attendances.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {attendances.map((attendance) => (
                                    <AttendanceCardTutor
                                        key={attendance.id}
                                        attendance={attendance}
                                        bowType={student.bow_type || 'none'}
                                        onUpdate={(updated) => {
                                            setAttendances(prev => prev.map(a =>
                                                a.id === updated.id ? updated : a
                                            ));
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 text-center py-4">
                                Tus clases programadas aparecerán aquí
                            </p>
                        )}
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
