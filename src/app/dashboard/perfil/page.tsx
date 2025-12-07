'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Student } from '@/lib/supabase';
import StudentCard from '@/components/StudentCard';
import { Loader2, User, LogOut, Calendar, Award, Target, MapPin } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PerfilPage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            router.push('/');
            return;
        }
        loadStudent(studentId);
    }, [router]);

    const loadStudent = async (studentId: string) => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            setStudent(data);
        } catch (err) {
            console.error('Error loading student:', err);
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

    const age = differenceInYears(new Date(), parseISO(student.birth_date));

    return (
        <main className="p-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-6 h-6 text-primary-500" />
                        Perfil del Alumno
                    </h1>
                </header>

                {/* Foto y nombre */}
                <div className="glass-card p-6 text-center mb-4">
                    {student.photo_url ? (
                        <img
                            src={student.photo_url}
                            alt={student.first_name}
                            className="w-28 h-28 rounded-full object-cover border-4 border-primary-500 mx-auto mb-4"
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-full bg-slate-700 flex items-center justify-center border-4 border-primary-500 mx-auto mb-4">
                            <span className="text-4xl font-bold text-primary-400">
                                {student.first_name[0]}{student.last_name[0]}
                            </span>
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-white">
                        {student.first_name} {student.last_name}
                    </h2>
                    <p className="text-slate-400">{age} años</p>
                </div>

                {/* Información deportiva */}
                <div className="glass-card p-4 space-y-4 mb-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        Información Deportiva
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                                <Award className="w-5 h-5 text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Nivel</p>
                                <p className="text-white font-medium">{student.level}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Disciplina</p>
                                <p className="text-white font-medium">{student.discipline}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Distancia</p>
                                <p className="text-white font-medium">{student.assigned_distance}m</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Nacimiento</p>
                                <p className="text-white font-medium">
                                    {format(parseISO(student.birth_date), "d MMM yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalles adicionales */}
                <div className="glass-card p-4 space-y-3 mb-4">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        Detalles
                    </h3>

                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400">Mano dominante</span>
                        <span className="text-white">{student.dominant_hand || 'No especificado'}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400">Ojo dominante</span>
                        <span className="text-white">{student.dominant_eye || 'No especificado'}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                        <span className="text-slate-400">Equipo propio</span>
                        <span className={student.own_equipment ? 'text-green-400' : 'text-slate-400'}>
                            {student.own_equipment ? 'Sí' : 'No'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="text-slate-400">Género</span>
                        <span className="text-white">{student.gender}</span>
                    </div>
                </div>

                {/* Botón salir */}
                <button
                    onClick={handleLogout}
                    className="btn btn-secondary w-full text-red-400 border-red-500/30 hover:border-red-500"
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </button>
            </div>
        </main>
    );
}
