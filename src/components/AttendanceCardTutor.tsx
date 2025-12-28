'use client';

import { useState } from 'react';
import { supabase, ClassAttendance, ATTENDANCE_STATUS, AttendanceStatus, BowType } from '@/lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarClock, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Horarios disponibles
const AVAILABLE_TIMES = [
    { value: '10:00', label: '10:00 AM' },
    { value: '11:30', label: '11:30 AM' },
    { value: '13:00', label: '1:00 PM' },
];

interface AttendanceCardTutorProps {
    attendance: ClassAttendance;
    bowType: BowType;
    onUpdate?: (updated: ClassAttendance) => void;
}

const statusColors: Record<AttendanceStatus, string> = {
    reserved: 'border-blue-500 bg-blue-500/10',
    attended: 'border-green-500 bg-green-500/10',
    missed: 'border-red-500 bg-red-500/10',
    cancelled: 'border-yellow-500 bg-yellow-500/10',
};

const statusIcons: Record<AttendanceStatus, React.ReactNode> = {
    reserved: <CalendarClock className="w-4 h-4 text-blue-400" />,
    attended: <CheckCircle className="w-4 h-4 text-green-400" />,
    missed: <XCircle className="w-4 h-4 text-red-400" />,
    cancelled: <AlertCircle className="w-4 h-4 text-yellow-400" />,
};

const statusTextColors: Record<AttendanceStatus, string> = {
    reserved: 'text-blue-400',
    attended: 'text-green-400',
    missed: 'text-red-400',
    cancelled: 'text-yellow-400',
};

// Formatear hora para display
const formatTimeDisplay = (time: string | null) => {
    if (!time) return '--:--';
    const found = AVAILABLE_TIMES.find(t => t.value === time.slice(0, 5));
    return found ? found.label : time.slice(0, 5);
};

export default function AttendanceCardTutor({ attendance, bowType, onUpdate }: AttendanceCardTutorProps) {
    const [saving, setSaving] = useState(false);
    const [localDate, setLocalDate] = useState(attendance.class_date);
    const [localTime, setLocalTime] = useState(attendance.class_time?.slice(0, 5) || '');

    // Solo puede editar si tiene arco (propio o asignado) Y el estado es "reservada"
    const canEdit = (bowType === 'own' || bowType === 'assigned') && attendance.status === 'reserved';

    const handleDateChange = async (newDate: string) => {
        if (!canEdit) return;
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
            onUpdate?.({ ...attendance, ...data });
        } catch (err) {
            console.error('Error updating date:', err);
            setLocalDate(attendance.class_date);
        } finally {
            setSaving(false);
        }
    };

    const handleTimeChange = async (newTime: string) => {
        if (!canEdit) return;
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
            onUpdate?.({ ...attendance, ...data });
        } catch (err) {
            console.error('Error updating time:', err);
            setLocalTime(attendance.class_time?.slice(0, 5) || '');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`rounded-lg border-2 p-3 ${statusColors[attendance.status]} relative`}>
            {saving && (
                <div className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                </div>
            )}

            {/* Fecha */}
            <div className="mb-2">
                {canEdit ? (
                    <input
                        type="date"
                        value={localDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-full text-sm bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-white font-medium cursor-pointer"
                        style={{ colorScheme: 'dark' }}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-white font-medium">
                            {format(parseISO(attendance.class_date), "dd/MM/yyyy", { locale: es })}
                        </span>
                    </div>
                )}
            </div>

            {/* Hora */}
            <div className="mb-3">
                {canEdit ? (
                    <select
                        value={localTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="w-full text-sm bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-slate-300 cursor-pointer"
                    >
                        <option value="" className="bg-slate-800">Seleccionar hora</option>
                        {AVAILABLE_TIMES.map(t => (
                            <option key={t.value} value={t.value} className="bg-slate-800">
                                {t.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">
                            {formatTimeDisplay(attendance.class_time)}
                        </span>
                    </div>
                )}
            </div>

            {/* Estado (solo lectura para tutores) */}
            <div className={`flex items-center gap-1 text-xs font-medium ${statusTextColors[attendance.status]}`}>
                {statusIcons[attendance.status]}
                <span>{ATTENDANCE_STATUS[attendance.status]}</span>
            </div>

            {/* Indicador de editable */}
            {canEdit && (
                <div className="absolute top-1 right-1">
                    <span className="text-[10px] text-slate-500">✎</span>
                </div>
            )}
        </div>
    );
}
