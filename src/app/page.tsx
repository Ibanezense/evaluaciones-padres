'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, Student, Profile } from '@/lib/supabase';

export default function LoginPage() {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const code = accessCode.toUpperCase();

            // 1. Buscar primero en profiles (padres/tutores)
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, role')
                .eq('access_code', code)
                .single();

            if (profile) {
                // Obtener estudiantes asociados a este perfil
                const { data: relations } = await supabase
                    .from('profile_students')
                    .select('student_id, student:students(*)')
                    .eq('profile_id', profile.id);

                const students = relations?.map((r: any) => r.student).filter(Boolean) as Student[] || [];

                if (students.length === 0) {
                    setError('No hay alumnos asociados a este código');
                    setLoading(false);
                    return;
                }

                // Guardar datos del perfil
                sessionStorage.setItem('profileId', profile.id);
                sessionStorage.setItem('profileName', `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
                sessionStorage.setItem('studentIds', JSON.stringify(students.map(s => s.id)));

                if (students.length === 1) {
                    // Solo un hijo: ir directo al dashboard
                    sessionStorage.setItem('studentId', students[0].id);
                    sessionStorage.setItem('studentName', `${students[0].first_name} ${students[0].last_name}`);
                    router.push('/dashboard');
                } else {
                    // Múltiples hijos: ir a página de selección
                    router.push('/seleccionar');
                }
                return;
            }

            // 2. Fallback: buscar en students (alumnos mayores de edad)
            const { data: student, error: studentError } = await supabase
                .from('students')
                .select('id, first_name, last_name')
                .eq('access_code', code)
                .eq('is_active', true)
                .single();

            if (studentError || !student) {
                setError('Código de acceso inválido');
                setLoading(false);
                return;
            }

            // Alumno encontrado directamente
            sessionStorage.setItem('studentId', student.id);
            sessionStorage.setItem('studentName', `${student.first_name} ${student.last_name}`);
            sessionStorage.setItem('studentIds', JSON.stringify([student.id]));
            router.push('/dashboard');

        } catch {
            setError('Error al verificar el código');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4">
            {/* Logo y título */}
            <div className="text-center mb-8 animate-fade-in">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-500/20 mb-4 animate-pulse-glow">
                    <img src="/logo.png" alt="Absolute Archery" className="w-20 h-20 rounded-full" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Absolute Archery
                </h1>
                <p className="text-slate-400">
                    Academia y Club de Tiro con Arco
                </p>
            </div>

            {/* Formulario */}
            <div className="glass-card p-6 w-full max-w-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="accessCode" className="block text-sm font-medium text-slate-300 mb-2">
                            Código de Acceso
                        </label>
                        <input
                            id="accessCode"
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                            placeholder="Ingresa tu código"
                            className="text-center text-lg tracking-widest uppercase"
                            maxLength={8}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || accessCode.length < 4}
                        className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                Acceder
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-8 text-sm text-slate-500 text-center">
                El código de acceso fue proporcionado por la academia
            </p>
        </main>
    );
}
