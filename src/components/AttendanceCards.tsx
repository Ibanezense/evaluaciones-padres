'use client';

import { ClassAttendance, ATTENDANCE_STATUS, AttendanceStatus } from '@/lib/supabase';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarClock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendanceCardsProps {
    attendances: ClassAttendance[];
    totalClasses: number;
    showEmpty?: boolean;
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

export default function AttendanceCards({ attendances, totalClasses, showEmpty = true }: AttendanceCardsProps) {
    // Ordenar por fecha
    const sortedAttendances = [...attendances].sort((a, b) =>
        new Date(a.class_date).getTime() - new Date(b.class_date).getTime()
    );

    // Calcular cuántas cards mostrar (basado en total_classes o attendances existentes)
    const cardsToShow = Math.max(totalClasses, attendances.length);

    if (cardsToShow === 0 && showEmpty) {
        return (
            <div className="text-center py-8 text-slate-500">
                <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay clases programadas</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedAttendances.map((attendance) => (
                <div
                    key={attendance.id}
                    className={`rounded-lg border-2 p-3 ${statusColors[attendance.status]}`}
                >
                    {/* Fecha */}
                    <div className="flex items-center gap-1 text-white font-medium mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-sm">
                            {format(parseISO(attendance.class_date), "d MMM", { locale: es })}
                        </span>
                    </div>

                    {/* Hora */}
                    {attendance.class_time && (
                        <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
                            <Clock className="w-3 h-3" />
                            <span>{attendance.class_time.slice(0, 5)}</span>
                        </div>
                    )}

                    {/* Estado */}
                    <div className={`flex items-center gap-1 text-xs font-medium ${statusTextColors[attendance.status]}`}>
                        {statusIcons[attendance.status]}
                        <span>{ATTENDANCE_STATUS[attendance.status]}</span>
                    </div>
                </div>
            ))}

            {/* Cards vacías para clases pendientes de programar */}
            {showEmpty && Array.from({ length: Math.max(0, totalClasses - attendances.length) }).map((_, i) => (
                <div
                    key={`empty-${i}`}
                    className="rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/30 p-3 flex items-center justify-center min-h-[80px]"
                >
                    <span className="text-xs text-slate-600">Sin programar</span>
                </div>
            ))}
        </div>
    );
}
