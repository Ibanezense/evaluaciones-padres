'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Profile, Student } from '@/lib/supabase';
import CreateTutorModal from '@/components/CreateTutorModal';
import {
    Plus,
    Search,
    User,
    Loader2,
    Copy,
    Check,
    Users
} from 'lucide-react';

interface ProfileWithStudents extends Profile {
    profile_students?: { student: Student }[];
}

export default function TutoresPage() {
    const [profiles, setProfiles] = useState<ProfileWithStudents[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showTutorModal, setShowTutorModal] = useState(false);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            // Primero obtenemos los perfiles con rol PADRE o sin filtro de rol específico
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('first_name');

            if (error) {
                console.error('Error querying profiles:', error);
            }

            // Filtrar solo los que tienen rol PADRE o el rol creado por CreateTutorModal
            const tutorProfiles = (data || []).filter(
                p => p.role === 'PADRE' || p.role === 'TUTOR' || p.role === 'CLIENTE'
            );

            // Cargar estudiantes asociados para cada perfil
            const profilesWithStudents = await Promise.all(
                tutorProfiles.map(async (profile) => {
                    const { data: relData } = await supabase
                        .from('profile_students')
                        .select('student_id, students(id, first_name, last_name, photo_url)')
                        .eq('profile_id', profile.id);

                    return {
                        ...profile,
                        profile_students: relData?.map(r => ({ student: r.students })) || []
                    };
                })
            );

            setProfiles(profilesWithStudents);
        } catch (err) {
            console.error('Error loading profiles:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyAccessCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredProfiles = profiles.filter(p =>
        `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.access_code?.includes(searchTerm.toUpperCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Tutores</h1>
                <button
                    onClick={() => setShowTutorModal(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Tutor
                </button>
            </div>

            {/* Buscador */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{profiles.length}</p>
                    <p className="text-sm text-slate-400">Total Tutores</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">
                        {profiles.filter(p => p.profile_students && p.profile_students.length > 0).length}
                    </p>
                    <p className="text-sm text-slate-400">Con Alumnos</p>
                </div>
            </div>

            {/* Lista de tutores */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-slate-700/50">
                    <h2 className="font-semibold text-white">Listado de Tutores ({filteredProfiles.length})</h2>
                </div>
                {filteredProfiles.length === 0 ? (
                    <p className="p-4 text-center text-slate-400">No hay tutores registrados</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredProfiles.map((profile) => (
                            <div key={profile.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-primary-500/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <User className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white">
                                            {profile.first_name || profile.full_name || 'Sin nombre'} {profile.last_name || ''}
                                        </p>
                                        {profile.email && (
                                            <p className="text-sm text-slate-400 truncate">{profile.email}</p>
                                        )}
                                        {profile.phone && (
                                            <p className="text-sm text-slate-400">{profile.phone}</p>
                                        )}

                                        {/* Código de acceso */}
                                        {profile.access_code && (
                                            <button
                                                onClick={() => copyAccessCode(profile.access_code!)}
                                                className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-primary-500/20 text-primary-400 rounded text-sm font-mono hover:bg-primary-500/30 transition-colors"
                                            >
                                                {copiedCode === profile.access_code ? (
                                                    <>
                                                        <Check className="w-3 h-3" />
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        {profile.access_code}
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {/* Alumnos asociados */}
                                        {profile.profile_students && profile.profile_students.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {profile.profile_students.map((rel) => (
                                                    rel.student && (
                                                        <Link
                                                            key={rel.student.id}
                                                            href={`/admin/alumno/${rel.student.id}`}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-full text-xs text-slate-300 hover:bg-slate-600 transition-colors"
                                                        >
                                                            <Users className="w-3 h-3" />
                                                            {rel.student.first_name} {rel.student.last_name}
                                                        </Link>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para crear tutor */}
            {showTutorModal && (
                <CreateTutorModal
                    onClose={() => setShowTutorModal(false)}
                    onSuccess={(newTutor) => {
                        setProfiles(prev => [...prev, { ...newTutor, profile_students: [] }]);
                        setShowTutorModal(false);
                    }}
                />
            )}
        </div>
    );
}
