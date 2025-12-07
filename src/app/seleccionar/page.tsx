'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Student } from '@/lib/supabase';
import { Loader2, User, ArrowRight, Target } from 'lucide-react';

export default function SeleccionarPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        const studentIdsJson = sessionStorage.getItem('studentIds');

        if (!studentIdsJson) {
            router.push('/');
            return;
        }

        try {
            const studentIds = JSON.parse(studentIdsJson) as string[];

            if (studentIds.length === 0) {
                router.push('/');
                return;
            }

            // Si solo hay un estudiante, ir directo al dashboard
            if (studentIds.length === 1) {
                const { data: student } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', studentIds[0])
                    .single();

                if (student) {
                    sessionStorage.setItem('studentId', student.id);
                    sessionStorage.setItem('studentName', `${student.first_name} ${student.last_name}`);
                    router.push('/dashboard');
                }
                return;
            }

            // Cargar todos los estudiantes
            const { data } = await supabase
                .from('students')
                .select('*')
                .in('id', studentIds)
                .order('first_name');

            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const selectStudent = (student: Student) => {
        sessionStorage.setItem('studentId', student.id);
        sessionStorage.setItem('studentName', `${student.first_name} ${student.last_name}`);
        router.push('/dashboard');
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

    return (
        <main className="min-h-screen p-4 pb-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 mb-4">
                        <Target className="w-8 h-8 text-primary-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Selecciona un alumno
                    </h1>
                    <p className="text-slate-400">
                        Elige el perfil que deseas ver
                    </p>
                </header>

                {/* Grid de alumnos */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {students.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => selectStudent(student)}
                            className="glass-card p-5 flex items-center gap-4 hover:border-primary-500/50 transition-all group text-left"
                        >
                            {/* Foto */}
                            {student.photo_url ? (
                                <img
                                    src={student.photo_url}
                                    alt={student.first_name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                                    <User className="w-8 h-8 text-slate-400" />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-slate-400">
                                    {student.level} • {student.discipline}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Distancia: {student.assigned_distance}m
                                </p>
                            </div>

                            {/* Flecha */}
                            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-primary-500 transition-colors" />
                        </button>
                    ))}
                </div>

                {/* Botón salir */}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-white text-sm"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </main>
    );
}
