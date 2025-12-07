'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Student, TechnicalEvaluation, TrainingControl, Profile, Duel, DuelSet } from '@/lib/supabase';
import AdminControlHistory from '@/components/AdminControlHistory';
import DuelHistory from '@/components/DuelHistory';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Users,
    ClipboardCheck,
    Loader2,
    CheckCircle,
    XCircle,
    Search,
    Eye,
    Edit,
    User,
    UserPlus,
    Target,
    UserCheck,
    Copy,
    Check,
    Swords
} from 'lucide-react';

interface ProfileWithStudents extends Profile {
    profile_students?: { student: Student }[];
}

export default function AdminPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [evaluations, setEvaluations] = useState<(TechnicalEvaluation & { student?: Student })[]>([]);
    const [controls, setControls] = useState<(TrainingControl & { student?: Student })[]>([]);
    const [duels, setDuels] = useState<(Duel & { student?: Student; opponent_student?: Student; sets?: DuelSet[] })[]>([]);
    const [profiles, setProfiles] = useState<ProfileWithStudents[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'controls' | 'duels' | 'evaluations' | 'students' | 'tutors'>('controls');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('is_active', true)
                .order('first_name');

            setStudents(studentsData || []);

            const { data: evalData } = await supabase
                .from('technical_evaluations')
                .select('*, student:students(*)')
                .order('evaluation_date', { ascending: false })
                .limit(50);

            setEvaluations(evalData || []);

            const { data: controlsData } = await supabase
                .from('training_controls')
                .select('*, student:students(*)')
                .order('control_date', { ascending: false })
                .limit(50);

            setControls(controlsData || []);

            // Cargar perfiles con sus estudiantes asociados
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*, profile_students(student:students(*))')
                .order('first_name');

            setProfiles(profilesData || []);

            // Cargar duelos
            const { data: duelsData } = await supabase
                .from('duels')
                .select(`
                    *,
                    student:students!duels_student_id_fkey(*),
                    opponent_student:students!duels_opponent_student_id_fkey(*),
                    sets:duel_sets(*)
                `)
                .order('duel_date', { ascending: false })
                .limit(50);

            setDuels(duelsData || []);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredStudents = students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredEvaluations = evaluations.filter(e => {
        const student = e.student as Student;
        return `${student?.first_name} ${student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredControls = controls.filter(c => {
        const student = c.student as Student;
        return `${student?.first_name} ${student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredProfiles = profiles.filter(p =>
        `${p.first_name || ''} ${p.last_name || ''} ${p.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Panel de Administración
                    </h1>
                    <p className="text-slate-400">
                        Gestiona evaluaciones, controles y tutores
                    </p>
                </header>

                {/* Botones de acción */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <Link href="/admin/control/nuevo" className="btn btn-primary text-sm py-2">
                        <Target className="w-4 h-4" />
                        Control
                    </Link>
                    <Link href="/admin/duelo/nuevo" className="btn btn-secondary text-sm py-2">
                        <Swords className="w-4 h-4" />
                        Duelo
                    </Link>
                    <Link href="/admin/nueva" className="btn btn-secondary text-sm py-2">
                        <ClipboardCheck className="w-4 h-4" />
                        Eval.
                    </Link>
                    <Link href="/admin/alumno/nuevo" className="btn btn-secondary text-sm py-2">
                        <UserPlus className="w-4 h-4" />
                        Alumno
                    </Link>
                </div>

                {/* Buscador global */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs ${activeTab === 'controls'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Controles</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('duels')}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs ${activeTab === 'duels'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Swords className="w-4 h-4" />
                        <span className="hidden sm:inline">Duelos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('evaluations')}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs ${activeTab === 'evaluations'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <ClipboardCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Eval.</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs ${activeTab === 'students'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Alumnos</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tutors')}
                        className={`flex-1 py-2.5 px-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 text-xs ${activeTab === 'tutors'
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Tutores</span>
                    </button>
                </div>

                {/* Contenido */}
                {activeTab === 'controls' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Controles Recientes
                            </h3>
                            <span className="text-sm text-slate-400">
                                {filteredControls.length} registro(s)
                            </span>
                        </div>
                        <AdminControlHistory controls={filteredControls} />
                    </div>
                )}

                {activeTab === 'duels' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Duelos Recientes
                            </h3>
                            <span className="text-sm text-slate-400">
                                {duels.length} registro(s)
                            </span>
                        </div>
                        <DuelHistory duels={duels} showStudent={true} showEditButton={true} />
                    </div>
                )}

                {activeTab === 'evaluations' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Evaluaciones Recientes
                            </h3>
                            <span className="text-sm text-slate-400">
                                {filteredEvaluations.length} resultado(s)
                            </span>
                        </div>

                        {filteredEvaluations.length === 0 ? (
                            <div className="glass-card p-6 text-center">
                                <p className="text-slate-400">No hay evaluaciones que mostrar</p>
                            </div>
                        ) : (
                            filteredEvaluations.map((evaluation) => {
                                const student = evaluation.student as Student;
                                return (
                                    <div key={evaluation.id} className="glass-card p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                {student?.photo_url ? (
                                                    <img
                                                        src={student.photo_url}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {student?.first_name} {student?.last_name}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {format(parseISO(evaluation.evaluation_date), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${evaluation.is_passed
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                {evaluation.is_passed ? (
                                                    <CheckCircle className="w-4 h-4" />
                                                ) : (
                                                    <XCircle className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                                            <Link
                                                href={`/admin/editar/${evaluation.id}`}
                                                className="btn btn-secondary flex-1 py-2 text-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Editar
                                            </Link>
                                            <Link
                                                href={`/admin/preview/${student?.id}`}
                                                className="btn btn-secondary flex-1 py-2 text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ver
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Alumnos
                            </h3>
                            <span className="text-sm text-slate-400">
                                {filteredStudents.length} alumno(s)
                            </span>
                        </div>

                        {filteredStudents.map((student) => (
                            <div key={student.id} className="glass-card p-4">
                                <div className="flex items-center gap-3">
                                    {student.photo_url ? (
                                        <img
                                            src={student.photo_url}
                                            alt={student.first_name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium truncate">
                                            {student.first_name} {student.last_name}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {student.level} • {student.discipline}
                                        </p>
                                    </div>

                                    <div className={`w-2 h-2 rounded-full ${student.is_active ? 'bg-green-500' : 'bg-red-500'}`} />

                                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded font-mono">
                                        {student.access_code || '------'}
                                    </span>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/admin/alumno/${student.id}`}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Editar alumno"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/admin/preview/${student.id}`}
                                            className="p-2 text-slate-400 hover:text-primary-400 hover:bg-slate-700 rounded-lg transition-colors"
                                            title="Ver perfil"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tutors' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">
                                Padres / Tutores
                            </h3>
                            <span className="text-sm text-slate-400">
                                {filteredProfiles.length} tutor(es)
                            </span>
                        </div>

                        {filteredProfiles.length === 0 ? (
                            <div className="glass-card p-6 text-center">
                                <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400 mb-2">No hay tutores registrados</p>
                                <p className="text-xs text-slate-500">
                                    Los tutores se crean desde Supabase y se vinculan a estudiantes
                                </p>
                            </div>
                        ) : (
                            filteredProfiles.map((profile) => {
                                const studentCount = profile.profile_students?.length || 0;
                                const students = profile.profile_students?.map(ps => ps.student).filter(Boolean) || [];

                                return (
                                    <div key={profile.id} className="glass-card p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                                                <UserCheck className="w-6 h-6 text-primary-400" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {profile.first_name || profile.full_name || 'Sin nombre'} {profile.last_name || ''}
                                                </p>
                                                <p className="text-sm text-slate-400 truncate">
                                                    {profile.email || profile.phone || 'Sin contacto'}
                                                </p>
                                                {studentCount > 0 && (
                                                    <p className="text-xs text-primary-400 mt-1">
                                                        {studentCount} alumno(s): {students.map(s => s?.first_name).join(', ')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Código de acceso con botón copiar */}
                                            {profile.access_code ? (
                                                <button
                                                    onClick={() => copyToClipboard(profile.access_code!)}
                                                    className="flex items-center gap-2 px-3 py-2 bg-primary-500/20 hover:bg-primary-500/30 rounded-lg transition-colors group"
                                                    title="Copiar código"
                                                >
                                                    <span className="text-sm font-mono text-primary-400">
                                                        {profile.access_code}
                                                    </span>
                                                    {copiedCode === profile.access_code ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-slate-400 group-hover:text-primary-400" />
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-500 px-3 py-2">
                                                    Sin código
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
