'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, ClassAttendance, Student, ATTENDANCE_STATUS, AttendanceStatus } from '@/lib/supabase';
import {
    Users,
    UserCheck,
    Target,
    ClipboardCheck,
    Swords,
    Award,
    Loader2,
    TrendingUp,
    Calendar,
    ArrowRight,
    CalendarClock,
    User,
    Clock
} from 'lucide-react';

interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    totalTutors: number;
    totalControls: number;
    totalEvaluations: number;
    totalDuels: number;
    totalBadges: number;
    recentControlsCount: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [todayAttendances, setTodayAttendances] = useState<(ClassAttendance & { student: Student })[]>([]);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Cargar estadísticas en paralelo
            const [
                { count: totalStudents },
                { count: activeStudents },
                { count: totalTutors },
                { count: totalControls },
                { count: totalEvaluations },
                { count: totalDuels },
                { count: totalBadges },
            ] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['PADRE', 'TUTOR']),
                supabase.from('training_controls').select('*', { count: 'exact', head: true }),
                supabase.from('technical_evaluations').select('*', { count: 'exact', head: true }),
                supabase.from('duels').select('*', { count: 'exact', head: true }),
                supabase.from('badges').select('*', { count: 'exact', head: true }),
            ]);

            // Controles de los últimos 7 días
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const { count: recentControlsCount } = await supabase
                .from('training_controls')
                .select('*', { count: 'exact', head: true })
                .gte('control_date', weekAgo.toISOString());

            setStats({
                totalStudents: totalStudents || 0,
                activeStudents: activeStudents || 0,
                totalTutors: totalTutors || 0,
                totalControls: totalControls || 0,
                totalEvaluations: totalEvaluations || 0,
                totalDuels: totalDuels || 0,
                totalBadges: totalBadges || 0,
                recentControlsCount: recentControlsCount || 0,
            });

            // Cargar asistencias de hoy
            const today = new Date().toISOString().split('T')[0];
            const { data: todayData } = await supabase
                .from('class_attendances')
                .select('*, student:students(*)')
                .eq('class_date', today)
                .order('class_time', { ascending: true });

            setTodayAttendances(todayData || []);
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
        );
    }

    const quickLinks = [
        { href: '/admin/alumnos', label: 'Alumnos', icon: Users, count: stats?.activeStudents, color: 'text-blue-500' },
        { href: '/admin/tutores', label: 'Tutores', icon: UserCheck, count: stats?.totalTutors, color: 'text-green-500' },
        { href: '/admin/controles', label: 'Controles', icon: Target, count: stats?.totalControls, color: 'text-orange-500' },
        { href: '/admin/evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck, count: stats?.totalEvaluations, color: 'text-purple-500' },
        { href: '/admin/duelos', label: 'Duelos', icon: Swords, count: stats?.totalDuels, color: 'text-red-500' },
        { href: '/admin/badges', label: 'Badges', icon: Award, count: stats?.totalBadges, color: 'text-yellow-500' },
    ];

    const quickActions = [
        { href: '/admin/alumno/nuevo', label: 'Nuevo Alumno', icon: Users },
        { href: '/admin/control/nuevo', label: 'Nuevo Control', icon: Target },
        { href: '/admin/nueva', label: 'Nueva Evaluación', icon: ClipboardCheck },
        { href: '/admin/duelo/nuevo', label: 'Nuevo Duelo', icon: Swords },
    ];

    return (
        <div className="p-4 lg:p-6">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                    Panel de Administración
                </h1>
                <p className="text-slate-400">
                    Bienvenido al centro de control de Absolute Archery
                </p>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.activeStudents}</p>
                            <p className="text-xs text-slate-400">Alumnos Activos</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.recentControlsCount}</p>
                            <p className="text-xs text-slate-400">Controles (7 días)</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.totalEvaluations}</p>
                            <p className="text-xs text-slate-400">Evaluaciones</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Award className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.totalBadges}</p>
                            <p className="text-xs text-slate-400">Badges</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asistencia de Hoy */}
            {todayAttendances.length > 0 && (
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-primary-500" />
                            Asistencia de Hoy ({todayAttendances.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {todayAttendances.map((att) => (
                            <div
                                key={att.id}
                                className={`glass-card p-3 border-l-4 ${att.status === 'attended' ? 'border-l-green-500' :
                                        att.status === 'missed' ? 'border-l-red-500' :
                                            att.status === 'cancelled' ? 'border-l-yellow-500' :
                                                'border-l-blue-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Foto */}
                                    {att.student?.photo_url ? (
                                        <img src={att.student.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/admin/preview/${att.student_id}`}
                                            className="text-sm font-medium text-white hover:text-primary-400 truncate block"
                                        >
                                            {att.student?.first_name} {att.student?.last_name}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            {att.class_time && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {att.class_time.slice(0, 5)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Status buttons */}
                                    <div className="flex gap-1">
                                        {(['attended', 'missed', 'cancelled'] as AttendanceStatus[]).map((status) => (
                                            <button
                                                key={status}
                                                onClick={async () => {
                                                    await supabase
                                                        .from('class_attendances')
                                                        .update({ status })
                                                        .eq('id', att.id);
                                                    setTodayAttendances(prev => prev.map(a =>
                                                        a.id === att.id ? { ...a, status } : a
                                                    ));
                                                }}
                                                className={`w-8 h-8 rounded-full text-xs font-bold ${att.status === status
                                                        ? status === 'attended' ? 'bg-green-500 text-white'
                                                            : status === 'missed' ? 'bg-red-500 text-white'
                                                                : 'bg-yellow-500 text-black'
                                                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                    }`}
                                                title={ATTENDANCE_STATUS[status]}
                                            >
                                                {status === 'attended' ? '✓' : status === 'missed' ? '✗' : 'C'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-slate-700/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center group-hover:bg-primary-500/30 transition-colors">
                                <action.icon className="w-6 h-6 text-primary-500" />
                            </div>
                            <span className="text-sm text-slate-300 text-center">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Module Links */}
            <section>
                <h2 className="text-lg font-semibold text-white mb-4">Módulos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="glass-card p-4 flex items-center gap-4 hover:bg-slate-700/50 transition-colors group"
                        >
                            <div className={`w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center`}>
                                <link.icon className={`w-6 h-6 ${link.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-white">{link.label}</p>
                                <p className="text-sm text-slate-400">{link.count} registros</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-primary-500 transition-colors" />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
