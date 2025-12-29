'use client';

import { useState } from 'react';
import { supabase, ClassAttendance, ATTENDANCE_STATUS, AttendanceStatus, Student } from '@/lib/supabase';
import { Calendar, Clock, Trash2, User, Loader2 } from 'lucide-react';
import { parseISO, getDay } from 'date-fns';
import { toast } from 'sonner';

// Horarios por día de la semana
const WEEKDAY_TIMES = [
    { value: '08:30', label: '8:30 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:30', label: '11:30 AM' },
];

const WEEKEND_TIMES = [
    { value: '10:00', label: '10:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '13:00', label: '1:00 PM' },
];

// Función para obtener horarios según la fecha
const getAvailableTimes = (dateString: string) => {
    const date = parseISO(dateString);
    const dayOfWeek = getDay(date); // 0 = Domingo, 6 = Sábado
    return (dayOfWeek === 0 || dayOfWeek === 6) ? WEEKEND_TIMES : WEEKDAY_TIMES;
};

interface AttendanceCardAdminProps {
    attendance: ClassAttendance;
    student?: Student;
    showStudent?: boolean;
    onUpdate: (updated: ClassAttendance) => void;
    onDelete?: (id: string) => void;
    onRemainingClassesChange?: (delta: number) => void;
}

const statusColors: Record<AttendanceStatus, string> = {
    reserved: 'border-blue-500 bg-blue-500/10',
    attended: 'border-green-500 bg-green-500/10',
    missed: 'border-red-500 bg-red-500/10',
    cancelled: 'border-yellow-500 bg-yellow-500/10',
};

export default function AttendanceCardAdmin({
    attendance,
    student,
    showStudent = false,
    onUpdate,
    onDelete,
    onRemainingClassesChange
}: AttendanceCardAdminProps) {
    const [saving, setSaving] = useState(false);
    const [localDate, setLocalDate] = useState(attendance.class_date);
    const [localTime, setLocalTime] = useState(attendance.class_time?.slice(0, 5) || '');
    const [localStatus, setLocalStatus] = useState<AttendanceStatus>(attendance.status);

    // Calcular cambio en remaining_classes al cambiar estado
    const calculateRemainingDelta = (oldStatus: AttendanceStatus, newStatus: AttendanceStatus): number => {
        const consumesClass = (s: AttendanceStatus) => s === 'attended' || s === 'missed';
        const oldConsumes = consumesClass(oldStatus);
        const newConsumes = consumesClass(newStatus);

        if (!oldConsumes && newConsumes) return -1; // Se consume una clase
        if (oldConsumes && !newConsumes) return 1;  // Se devuelve una clase
        return 0;
    };

    const handleStatusChange = async (newStatus: AttendanceStatus) => {
        if (newStatus === localStatus) return;

        setSaving(true);
        try {
            const delta = calculateRemainingDelta(localStatus, newStatus);

            // Actualizar asistencia
            const { data, error } = await supabase
                .from('class_attendances')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', attendance.id)
                .select()
                .single();

            if (error) throw error;

            // Actualizar remaining_classes si cambió
            if (delta !== 0) {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('remaining_classes, total_classes')
                    .eq('id', attendance.student_id)
                    .single();

                if (studentData) {
                    // Calcular nuevo valor, no menor que 0 ni mayor que total_classes
                    const newRemaining = Math.min(
                        studentData.total_classes,
                        Math.max(0, studentData.remaining_classes + delta)
                    );

                    await supabase
                        .from('students')
                        .update({ remaining_classes: newRemaining })
                        .eq('id', attendance.student_id);

                    // Notificar al componente padre si hay callback
                    onRemainingClassesChange?.(delta);
                }
            }

            setLocalStatus(newStatus);
            onUpdate({ ...attendance, ...data });
            toast.success(`Estado cambiado a ${ATTENDANCE_STATUS[newStatus]}`);
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error('Error al cambiar el estado');
        } finally {
            setSaving(false);
        }
    };

    const handleDateChange = async (newDate: string) => {
        setLocalDate(newDate);

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('class_attendances')
                .update({
                    class_date: newDate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', attendance.id)
                .select()
                .single();

            if (error) throw error;
            onUpdate({ ...attendance, ...data });
            toast.success('Fecha actualizada');
        } catch (err) {
            console.error('Error updating date:', err);
            setLocalDate(attendance.class_date);
            toast.error('Error al actualizar fecha');
        } finally {
            setSaving(false);
        }
    };

    const handleTimeChange = async (newTime: string) => {
        setLocalTime(newTime);

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('class_attendances')
                .update({
                    class_time: newTime || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', attendance.id)
                .select()
                .single();

            if (error) throw error;
            onUpdate({ ...attendance, ...data });
            toast.success('Hora actualizada');
        } catch (err) {
            console.error('Error updating time:', err);
            setLocalTime(attendance.class_time?.slice(0, 5) || '');
            toast.error('Error al actualizar hora');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!confirm('¿Eliminar esta clase?')) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('class_attendances')
                .delete()
                .eq('id', attendance.id);

            if (error) throw error;

            // Si la clase estaba consumida, devolver al contador
            if (localStatus === 'attended' || localStatus === 'missed') {
                onRemainingClassesChange?.(1);
            }

            onDelete(attendance.id);
            toast.success('Clase eliminada');
        } catch (err) {
            console.error('Error deleting attendance:', err);
            toast.error('Error al eliminar clase');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`rounded-lg border-2 p-3 ${statusColors[localStatus]} relative`}>
            {saving && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                </div>
            )}

            {/* Info del estudiante (si se muestra) */}
            {showStudent && student && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.first_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                        </div>
                    )}
                    <span className="text-sm font-medium text-white">{student.first_name} {student.last_name}</span>
                </div>
            )}

            {/* Fecha */}
            <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                    type="date"
                    value={localDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="text-xs bg-transparent border-none p-0 text-white w-full"
                />
            </div>

            {/* Hora - Selector de 3 opciones */}
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                    value={localTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="text-xs bg-transparent border-none p-0 text-slate-300 w-full"
                >
                    <option value="" className="bg-slate-800">Seleccionar</option>
                    {getAvailableTimes(localDate).map(t => (
                        <option key={t.value} value={t.value} className="bg-slate-800">
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-2 gap-1">
                {(Object.entries(ATTENDANCE_STATUS) as [AttendanceStatus, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => handleStatusChange(key)}
                        disabled={saving}
                        className={`py-1 px-2 rounded text-xs font-medium transition-colors ${localStatus === key
                            ? key === 'attended' ? 'bg-green-500 text-white'
                                : key === 'missed' ? 'bg-red-500 text-white'
                                    : key === 'cancelled' ? 'bg-yellow-500 text-black'
                                        : 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Botón eliminar */}
            {onDelete && (
                <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 transition-colors"
                    title="Eliminar clase"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
