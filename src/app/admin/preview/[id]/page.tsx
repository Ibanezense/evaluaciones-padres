'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, Student, TechnicalEvaluation, TrainingControl, Duel, DuelSet, Badge, StudentBadge, BADGE_CATEGORIES, MEMBERSHIP_STATUS, ClassAttendance } from '@/lib/supabase';
import StudentCard from '@/components/StudentCard';
import EvaluationRadarChart from '@/components/EvaluationRadarChart';
import EvaluationHistory from '@/components/EvaluationHistory';
import TrainingControlHistory from '@/components/TrainingControlHistory';
import TrainingStats from '@/components/TrainingStats';
import TrainingChart from '@/components/TrainingChart';
import DuelHistory from '@/components/DuelHistory';
import DuelStats from '@/components/DuelStats';
import BadgeAssignModal from '@/components/BadgeAssignModal';
import StudentFormModal from '@/components/StudentFormModal';
import AttendanceCardAdmin from '@/components/AttendanceCardAdmin';
import { ArrowLeft, Loader2, Eye, TrendingUp, Target, ClipboardCheck, Plus, Edit, Swords, Award, X, Calendar, Hash, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PreviewAlumnoPage() {
    const router = useRouter();
    const params = useParams();
    const studentId = params.id as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [evaluations, setEvaluations] = useState<TechnicalEvaluation[]>([]);
    const [controls, setControls] = useState<TrainingControl[]>([]);
    const [duels, setDuels] = useState<(Duel & { sets?: DuelSet[], opponent_student?: Student })[]>([]);
    const [studentBadges, setStudentBadges] = useState<(StudentBadge & { badge: Badge })[]>([]);
    const [selectedEvaluation, setSelectedEvaluation] = useState<TechnicalEvaluation | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const [activeSection, setActiveSection] = useState<'controls' | 'duels' | 'evaluations' | 'badges' | 'attendance'>('controls');
    const [loading, setLoading] = useState(true);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [attendances, setAttendances] = useState<ClassAttendance[]>([]);

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

            // Cargar badges
            const { data: badgesData } = await supabase
                .from('student_badges')
                .select('*, badge:badges(*)')
                .eq('student_id', studentId)
                .order('awarded_at', { ascending: false });

            setStudentBadges(badgesData || []);

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

    const handleRemoveBadge = async (studentBadgeId: string) => {
        try {
            await supabase
                .from('student_badges')
                .delete()
                .eq('id', studentBadgeId);

            setStudentBadges(prev => prev.filter(sb => sb.id !== studentBadgeId));
        } catch (err) {
            console.error('Error removing badge:', err);
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
            {/* Container: mobile centrado, desktop usa todo el ancho */}
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Volver</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-full text-sm">
                            <Eye className="w-4 h-4" />
                            Vista Previa
                        </div>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Editar
                        </button>
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

                {/* Información de Membresía */}
                <div className="glass-card p-4 mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${student.membership_status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : student.membership_status === 'debt'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-slate-600/50 text-slate-400'
                                }`}>
                                {MEMBERSHIP_STATUS[student.membership_status] || 'Sin estado'}
                            </div>
                            {student.membership_start_date && (
                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                    <Calendar className="w-4 h-4" />
                                    Desde: {format(parseISO(student.membership_start_date), "d MMM yyyy", { locale: es })}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-sm">
                                <span className="text-slate-400">Clases: </span>
                                <span className={`font-bold ${student.remaining_classes <= 2 ? 'text-red-400' : 'text-primary-400'}`}>
                                    {student.remaining_classes}
                                </span>
                                <span className="text-slate-500">/{student.total_classes}</span>
                            </div>
                        </div>
                    </div>
                </div>

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
                    <button
                        onClick={() => setActiveSection('badges')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === 'badges'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Award className="w-5 h-5" />
                        Badges
                        {studentBadges.length > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {studentBadges.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSection('attendance')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${activeSection === 'attendance'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <CalendarClock className="w-5 h-5" />
                        Asist.
                        {attendances.length > 0 && (
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                {attendances.length}
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
                            isAdmin={true}
                        />
                    </div>
                )}

                {activeSection === 'badges' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary-500" />
                                Badges del Alumno
                            </h3>
                            <button
                                onClick={() => setShowBadgeModal(true)}
                                className="btn btn-primary py-2 px-3 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Asignar Badge
                            </button>
                        </div>

                        {studentBadges.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">Este alumno no tiene badges asignados</p>
                                <p className="text-sm text-slate-500 mt-2">
                                    Usa el botón "Asignar Badge" para agregar logros
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {studentBadges.map((sb) => (
                                    <div
                                        key={sb.id}
                                        className="glass-card p-4 text-center relative group"
                                        title={sb.badge?.description || sb.badge?.name}
                                    >
                                        <button
                                            onClick={() => handleRemoveBadge(sb.id)}
                                            className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Quitar badge"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div
                                            className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3"
                                            style={{
                                                backgroundColor: sb.badge?.color_hex
                                                    ? `${sb.badge.color_hex}20`
                                                    : 'rgba(249, 115, 22, 0.2)',
                                                borderColor: sb.badge?.color_hex || '#f97316',
                                                borderWidth: '2px'
                                            }}
                                        >
                                            {sb.badge?.icon_url ? (
                                                <img
                                                    src={sb.badge.icon_url}
                                                    alt=""
                                                    className="w-10 h-10 object-contain"
                                                />
                                            ) : (
                                                <Award
                                                    className="w-8 h-8"
                                                    style={{ color: sb.badge?.color_hex || '#f97316' }}
                                                />
                                            )}
                                        </div>
                                        <p className="text-white text-sm font-medium mb-1 line-clamp-2">
                                            {sb.badge?.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {format(parseISO(sb.awarded_at), "d MMM yyyy", { locale: es })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Sección Asistencia */}
                {activeSection === 'attendance' && (
                    <div className="space-y-4">
                        {/* Header con botón agregar */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Asistencia ({student.remaining_classes}/{student.total_classes} restantes)
                            </h3>
                            <button
                                onClick={async () => {
                                    const today = new Date().toISOString().split('T')[0];
                                    const { data, error } = await supabase
                                        .from('class_attendances')
                                        .insert({
                                            student_id: studentId,
                                            class_date: today,
                                            status: 'reserved'
                                        })
                                        .select()
                                        .single();

                                    if (!error && data) {
                                        setAttendances(prev => [...prev, data].sort((a, b) =>
                                            new Date(a.class_date).getTime() - new Date(b.class_date).getTime()
                                        ));
                                    }
                                }}
                                className="btn btn-primary text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Clase
                            </button>
                        </div>

                        {/* Grid de cards */}
                        {attendances.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {attendances.map((attendance) => (
                                    <AttendanceCardAdmin
                                        key={attendance.id}
                                        attendance={attendance}
                                        onUpdate={(updated) => {
                                            setAttendances(prev => prev.map(a =>
                                                a.id === updated.id ? updated : a
                                            ));
                                        }}
                                        onDelete={(id) => {
                                            setAttendances(prev => prev.filter(a => a.id !== id));
                                        }}
                                        onRemainingClassesChange={(delta) => {
                                            if (student) {
                                                setStudent({
                                                    ...student,
                                                    remaining_classes: Math.max(0, student.remaining_classes + delta)
                                                });
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card p-8 text-center">
                                <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No hay clases programadas</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Agrega clases para registrar asistencia
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal para asignar badge */}
            {showBadgeModal && (
                <BadgeAssignModal
                    studentId={studentId}
                    assignedBadgeIds={studentBadges.map(sb => sb.badge_id)}
                    onClose={() => setShowBadgeModal(false)}
                    onAssigned={() => {
                        setShowBadgeModal(false);
                        loadData();
                    }}
                />
            )}

            {/* Modal para editar alumno */}
            <StudentFormModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSaved={(updatedStudent) => {
                    setStudent(updatedStudent);
                    setShowEditModal(false);
                }}
                student={student}
            />
        </main>
    );
}
