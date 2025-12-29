'use client';

import { Student } from '@/lib/supabase';
import { User, Calendar, Target, Ruler, Weight } from 'lucide-react';
import { differenceInYears, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface StudentCardProps {
    student: Student;
}

export default function StudentCard({ student }: StudentCardProps) {
    // Parsear fecha de nacimiento de forma segura
    let birthDate: Date | null = null;
    if (student.birth_date) {
        // Extraer solo la parte de fecha (YYYY-MM-DD) y parsear como local
        const dateOnly = student.birth_date.split('T')[0];
        birthDate = new Date(dateOnly + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
    }
    const isValidDate = birthDate && !isNaN(birthDate.getTime());
    const age = isValidDate ? differenceInYears(new Date(), birthDate!) : null;
    const formattedBirthDate = isValidDate ? format(birthDate!, "d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha';

    return (
        <div className="glass-card p-4 sm:p-6 animate-fade-in">
            {/* Header con foto y nombre */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                    {student.photo_url ? (
                        <img
                            src={student.photo_url}
                            alt={`${student.first_name} ${student.last_name}`}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-primary-500"
                        />
                    ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-primary-500">
                            <User className="w-10 h-10 text-slate-400" />
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-primary-500 rounded-full p-1.5">
                        <Target className="w-4 h-4 text-white" />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {student.first_name} {student.last_name}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {student.level}
                    </p>
                </div>
            </div>

            {/* Datos personales y deportivos */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Edad */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <User className="w-3.5 h-3.5" />
                        Edad
                    </div>
                    <p className="text-white font-semibold">{age !== null ? `${age} años` : '--'}</p>
                </div>

                {/* Fecha de nacimiento */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Nacimiento
                    </div>
                    <p className="text-white font-semibold text-sm">{formattedBirthDate}</p>
                </div>

                {/* División */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Target className="w-3.5 h-3.5" />
                        División
                    </div>
                    <p className="text-white font-semibold capitalize">{student.discipline.toLowerCase()}</p>
                </div>

                {/* Distancia */}
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Ruler className="w-3.5 h-3.5" />
                        Distancia
                    </div>
                    <p className="text-white font-semibold">{student.assigned_distance}m</p>
                </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex flex-wrap gap-2">
                    {student.dominant_hand && (
                        <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                            Mano: {student.dominant_hand}
                        </span>
                    )}
                    {student.dominant_eye && (
                        <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                            Ojo: {student.dominant_eye}
                        </span>
                    )}
                    {student.own_equipment && (
                        <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                            Equipo propio
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
