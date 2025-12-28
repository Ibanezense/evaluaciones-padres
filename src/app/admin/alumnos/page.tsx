'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Student } from '@/lib/supabase';
import StudentFormModal from '@/components/StudentFormModal';
import {
    Plus,
    Search,
    Eye,
    Edit,
    User,
    Loader2,
    Trash2,
    AlertTriangle
} from 'lucide-react';

export default function AlumnosPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Estados para el modal de formulario
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const { data } = await supabase
                .from('students')
                .select('*')
                .order('first_name')
                .order('last_name');
            setStudents(data || []);
        } catch (err) {
            console.error('Error loading students:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (studentId: string) => {
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

            if (error) throw error;

            setStudents(prev => prev.filter(s => s.id !== studentId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Error deleting student:', err);
            alert('Error al eliminar el alumno. Puede tener registros asociados.');
        } finally {
            setDeleting(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingStudent(null);
        setShowFormModal(true);
    };

    const handleOpenEdit = (student: Student) => {
        setEditingStudent(student);
        setShowFormModal(true);
    };

    const handleStudentSaved = (savedStudent: Student) => {
        if (editingStudent) {
            // Actualizar en la lista
            setStudents(prev => prev.map(s => s.id === savedStudent.id ? savedStudent : s));
        } else {
            // Agregar a la lista
            setStudents(prev => [...prev, savedStudent]);
        }
        setShowFormModal(false);
        setEditingStudent(null);
    };

    // Función para obtener el estado del alumno
    const getStudentStatus = (student: Student) => {
        if (!student.is_active) {
            return { label: 'Inactivo', color: 'bg-slate-500', textColor: 'text-slate-300' };
        }
        return { label: 'Activo', color: 'bg-green-500', textColor: 'text-green-300' };
    };

    const filteredStudents = students
        .filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.dni.includes(searchTerm)
        )
        .sort((a, b) => {
            const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
            const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });

    const activeStudents = filteredStudents.filter(s => s.is_active);
    const inactiveStudents = filteredStudents.filter(s => !s.is_active);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const StudentRow = ({ student, isInactive = false }: { student: Student; isInactive?: boolean }) => {
        const status = getStudentStatus(student);

        return (
            <div className={`p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors ${isInactive ? 'opacity-60' : ''}`}>
                {/* Foto */}
                {student.photo_url ? (
                    <img
                        src={student.photo_url}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-slate-400" />
                    </div>
                )}

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-white truncate">
                            {student.first_name} {student.last_name}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.textColor}`}>
                            {status.label}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400">
                        {student.level} · {student.discipline} · {student.assigned_distance}m
                    </p>
                </div>

                {/* Info adicional (visible en desktop) */}
                <div className="hidden lg:block text-right">
                    <p className="text-sm text-slate-300">DNI: {student.dni}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-1">
                    <Link
                        href={`/admin/preview/${student.id}`}
                        className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                        title="Ver perfil"
                    >
                        <Eye className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-2 text-slate-400 hover:text-primary-400 transition-colors"
                        title="Editar"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(student.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Alumnos</h1>
                <button
                    onClick={handleOpenCreate}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Alumno
                </button>
            </div>

            {/* Buscador */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{students.length}</p>
                    <p className="text-sm text-slate-400">Total</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">{students.filter(s => s.is_active).length}</p>
                    <p className="text-sm text-slate-400">Activos</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-blue-500">{students.filter(s => s.discipline === 'RECURVO').length}</p>
                    <p className="text-sm text-slate-400">Recurvo</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-purple-500">{students.filter(s => s.discipline === 'COMPUESTO').length}</p>
                    <p className="text-sm text-slate-400">Compuesto</p>
                </div>
            </div>

            {/* Lista de alumnos activos */}
            <div className="glass-card overflow-hidden mb-6">
                <div className="p-4 border-b border-slate-700/50">
                    <h2 className="font-semibold text-white">Alumnos Activos ({activeStudents.length})</h2>
                </div>
                <div className="divide-y divide-slate-700/50">
                    {activeStudents.length === 0 ? (
                        <p className="p-4 text-center text-slate-400">No hay alumnos activos</p>
                    ) : (
                        activeStudents.map((student) => (
                            <StudentRow key={student.id} student={student} />
                        ))
                    )}
                </div>
            </div>

            {/* Lista de alumnos inactivos */}
            {inactiveStudents.length > 0 && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50">
                        <h2 className="font-semibold text-slate-400">Alumnos Inactivos ({inactiveStudents.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {inactiveStudents.map((student) => (
                            <StudentRow key={student.id} student={student} isInactive />
                        ))}
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="glass-card p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4 text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
                        </div>
                        <p className="text-slate-300 mb-6">
                            ¿Estás seguro de que deseas eliminar este alumno? Esta acción no se puede deshacer y eliminará todos sus registros asociados.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Eliminando...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de formulario de alumno */}
            <StudentFormModal
                isOpen={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingStudent(null);
                }}
                onSaved={handleStudentSaved}
                student={editingStudent}
            />
        </div>
    );
}
