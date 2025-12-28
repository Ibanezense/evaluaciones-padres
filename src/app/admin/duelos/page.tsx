'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Duel, DuelSet, Student } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Plus,
    Loader2,
    User,
    Swords,
    ChevronRight,
    Trophy
} from 'lucide-react';

type DuelWithDetails = Duel & {
    student?: Student;
    opponent_student?: Student;
    sets?: DuelSet[];
};

export default function DuelosPage() {
    const [duels, setDuels] = useState<DuelWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDuels();
    }, []);

    const loadDuels = async () => {
        try {
            const { data } = await supabase
                .from('duels')
                .select(`
                    *,
                    student:students!duels_student_id_fkey(*),
                    opponent_student:students!duels_opponent_id_fkey(*),
                    sets:duel_sets(*)
                `)
                .order('duel_date', { ascending: false })
                .limit(100);
            setDuels(data || []);
        } catch (err) {
            console.error('Error loading duels:', err);
        } finally {
            setLoading(false);
        }
    };

    const getWinner = (duel: DuelWithDetails) => {
        if (!duel.sets || duel.sets.length === 0) return null;
        const studentSets = duel.sets.filter(s => s.our_set_points > s.opponent_set_points).length;
        const opponentSets = duel.sets.filter(s => s.opponent_set_points > s.our_set_points).length;
        if (studentSets > opponentSets) return 'student';
        if (opponentSets > studentSets) return 'opponent';
        return 'tie';
    };

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
                <h1 className="text-2xl font-bold text-white">Duelos</h1>
                <Link
                    href="/admin/duelo/nuevo"
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Duelo
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-500">{duels.length}</p>
                    <p className="text-sm text-slate-400">Total Duelos</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-3xl font-bold text-yellow-500">
                        {duels.filter(d => {
                            const winner = getWinner(d);
                            return winner === 'student' || winner === 'opponent';
                        }).length}
                    </p>
                    <p className="text-sm text-slate-400">Con Ganador</p>
                </div>
            </div>

            {/* Lista de duelos */}
            {duels.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <Swords className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No hay duelos registrados</p>
                    <Link href="/admin/duelo/nuevo" className="btn btn-primary mt-4 inline-flex">
                        <Plus className="w-5 h-5" />
                        Crear primer duelo
                    </Link>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="divide-y divide-slate-700/50">
                        {duels.map((duel) => {
                            const winner = getWinner(duel);
                            return (
                                <Link
                                    key={duel.id}
                                    href={`/admin/duelo/${duel.id}`}
                                    className="p-4 hover:bg-slate-800/50 transition-colors block"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">
                                            {format(parseISO(duel.duel_date), "d MMM yyyy", { locale: es })}
                                        </span>
                                        <span className="text-sm text-slate-400">
                                            {duel.distance}m
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Jugador 1 */}
                                        <div className={`flex-1 flex items-center gap-3 ${winner === 'student' ? 'text-yellow-400' : 'text-white'}`}>
                                            {duel.student?.photo_url ? (
                                                <img
                                                    src={duel.student.photo_url}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">
                                                    {duel.student?.first_name} {duel.student?.last_name}
                                                </p>
                                            </div>
                                            {winner === 'student' && <Trophy className="w-5 h-5" />}
                                        </div>

                                        <span className="text-slate-500 font-bold">VS</span>

                                        {/* Jugador 2 */}
                                        <div className={`flex-1 flex items-center gap-3 justify-end ${winner === 'opponent' ? 'text-yellow-400' : 'text-white'}`}>
                                            {winner === 'opponent' && <Trophy className="w-5 h-5" />}
                                            <div className="min-w-0 flex-1 text-right">
                                                <p className="font-medium truncate">
                                                    {duel.opponent_student?.first_name || duel.opponent_name} {duel.opponent_student?.last_name || ''}
                                                </p>
                                            </div>
                                            {duel.opponent_student?.photo_url ? (
                                                <img
                                                    src={duel.opponent_student.photo_url}
                                                    alt=""
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
