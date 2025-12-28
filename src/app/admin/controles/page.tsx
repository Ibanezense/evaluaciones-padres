'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, TrainingControl, Student } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Loader2,
    User,
    Edit,
    Target,
    ChevronRight
} from 'lucide-react';

export default function ControlesPage() {
    const [controls, setControls] = useState<(TrainingControl & { student?: Student })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadControls();
    }, []);

    const loadControls = async () => {
        try {
            const { data } = await supabase
                .from('training_controls')
                .select('*, student:students(*)')
                .order('control_date', { ascending: false })
                .limit(100);
            setControls(data || []);
        } catch (err) {
            console.error('Error loading controls:', err);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar por fecha
    const groupedControls = controls.reduce((acc, control) => {
        const date = control.control_date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(control);
        return acc;
    }, {} as Record<string, typeof controls>);

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
                <h1 className="text-2xl font-bold text-white">Controles de Entrenamiento</h1>
                <Link
                    href="/admin/control/nuevo"
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Control
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{controls.length}</p>
                    <p className="text-sm text-slate-400">Total Controles</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">
                        {controls.length > 0
                            ? (controls.reduce((sum, c) => sum + c.arrow_average, 0) / controls.length).toFixed(1)
                            : 0}
                    </p>
                    <p className="text-sm text-slate-400">Promedio por Flecha</p>
                </div>
                <div className="glass-card p-4 text-center col-span-2 lg:col-span-1">
                    <p className="text-3xl font-bold text-blue-500">
                        {Object.keys(groupedControls).length}
                    </p>
                    <p className="text-sm text-slate-400">Días con Controles</p>
                </div>
            </div>

            {/* Lista de controles agrupados por fecha */}
            {Object.keys(groupedControls).length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No hay controles registrados</p>
                    <Link href="/admin/control/nuevo" className="btn btn-primary mt-4 inline-flex">
                        <Plus className="w-5 h-5" />
                        Crear primer control
                    </Link>
                </div>
            ) : (
                Object.entries(groupedControls).map(([date, dateControls]) => (
                    <div key={date} className="mb-6">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">
                            {format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                        </h3>
                        <div className="glass-card overflow-hidden">
                            <div className="divide-y divide-slate-700/50">
                                {dateControls.map((control) => (
                                    <Link
                                        key={control.id}
                                        href={`/admin/control/${control.id}`}
                                        className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
                                    >
                                        {control.student?.photo_url ? (
                                            <img
                                                src={control.student.photo_url}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                <User className="w-5 h-5 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {control.student?.first_name} {control.student?.last_name}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {control.distance}m · {control.arrows_count} flechas
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-primary-500">
                                                {control.total_score}
                                            </p>
                                            <p className="text-xs text-slate-400">puntos</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-500" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
