'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, TechnicalEvaluation, Student } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Loader2,
    User,
    CheckCircle,
    XCircle,
    ChevronRight,
    ClipboardCheck
} from 'lucide-react';

export default function EvaluacionesPage() {
    const [evaluations, setEvaluations] = useState<(TechnicalEvaluation & { student?: Student })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvaluations();
    }, []);

    const loadEvaluations = async () => {
        try {
            const { data } = await supabase
                .from('technical_evaluations')
                .select('*, student:students(*)')
                .order('evaluation_date', { ascending: false })
                .limit(100);
            setEvaluations(data || []);
        } catch (err) {
            console.error('Error loading evaluations:', err);
        } finally {
            setLoading(false);
        }
    };

    const passedCount = evaluations.filter(e => e.is_passed).length;
    const avgScore = evaluations.length > 0
        ? Math.round(evaluations.reduce((sum, e) => sum + (e.score_total || 0), 0) / evaluations.length)
        : 0;

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
                <h1 className="text-2xl font-bold text-white">Evaluaciones Técnicas</h1>
                <Link
                    href="/admin/nueva"
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Evaluación
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{evaluations.length}</p>
                    <p className="text-sm text-slate-400">Total</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-green-500">{passedCount}</p>
                    <p className="text-sm text-slate-400">Aprobadas</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-red-500">{evaluations.length - passedCount}</p>
                    <p className="text-sm text-slate-400">Pendientes</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-blue-500">{avgScore}</p>
                    <p className="text-sm text-slate-400">Puntaje Prom.</p>
                </div>
            </div>

            {/* Lista de evaluaciones */}
            {evaluations.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <ClipboardCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No hay evaluaciones registradas</p>
                    <Link href="/admin/nueva" className="btn btn-primary mt-4 inline-flex">
                        <Plus className="w-5 h-5" />
                        Crear primera evaluación
                    </Link>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="divide-y divide-slate-700/50">
                        {evaluations.map((evaluation) => (
                            <Link
                                key={evaluation.id}
                                href={`/admin/editar/${evaluation.id}`}
                                className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
                            >
                                {evaluation.student?.photo_url ? (
                                    <img
                                        src={evaluation.student.photo_url}
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
                                        {evaluation.student?.first_name} {evaluation.student?.last_name}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {format(parseISO(evaluation.evaluation_date), "d MMM yyyy", { locale: es })}
                                        {evaluation.evaluator_name && ` · ${evaluation.evaluator_name}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-primary-500">
                                            {evaluation.score_total || '-'}
                                        </p>
                                    </div>
                                    {evaluation.is_passed ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    )}
                                    <ChevronRight className="w-5 h-5 text-slate-500" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
