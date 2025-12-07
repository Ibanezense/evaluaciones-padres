'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, TrainingControl, Duel, DuelSet, Student } from '@/lib/supabase';
import TrainingControlHistory from '@/components/TrainingControlHistory';
import TrainingStats from '@/components/TrainingStats';
import TrainingChart from '@/components/TrainingChart';
import DuelHistory from '@/components/DuelHistory';
import DuelStats from '@/components/DuelStats';
import { Loader2, Target, TrendingUp, BarChart3, Swords, List } from 'lucide-react';

type MainTab = 'clasificatorias' | 'duelos';
type SubView = 'stats' | 'chart' | 'history';

export default function ControlesPage() {
    const [student, setStudent] = useState<Student | null>(null);
    const [controls, setControls] = useState<TrainingControl[]>([]);
    const [duels, setDuels] = useState<(Duel & { sets?: DuelSet[], opponent_student?: Student })[]>([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState<MainTab>('clasificatorias');
    const [subView, setSubView] = useState<SubView>('stats');
    const router = useRouter();

    useEffect(() => {
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            router.push('/');
            return;
        }
        loadData(studentId);
    }, [router]);

    const loadData = async (studentId: string) => {
        try {
            setLoading(true);

            // Cargar estudiante
            const { data: studentData } = await supabase
                .from('students')
                .select('*')
                .eq('id', studentId)
                .single();

            setStudent(studentData);

            // Cargar controles
            const { data: controlsData } = await supabase
                .from('training_controls')
                .select('*')
                .eq('student_id', studentId)
                .order('control_date', { ascending: false });

            setControls(controlsData || []);

            // Cargar duelos
            const { data: duelsData } = await supabase
                .from('duels')
                .select(`
                    *,
                    opponent_student:opponent_student_id(id, first_name, last_name, photo_url),
                    sets:duel_sets(*)
                `)
                .eq('student_id', studentId)
                .order('duel_date', { ascending: false });

            setDuels(duelsData || []);

        } catch (err) {
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 pb-24">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <header className="mb-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary-500" />
                        Controles
                    </h1>
                    {student && (
                        <p className="text-sm text-slate-400">
                            {student.first_name} {student.last_name}
                        </p>
                    )}
                </header>

                {/* Tabs principales: Clasificatorias / Duelos */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => { setMainTab('clasificatorias'); setSubView('stats'); }}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${mainTab === 'clasificatorias'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            }`}
                    >
                        <Target className="w-5 h-5" />
                        Clasificatorias
                    </button>
                    <button
                        onClick={() => { setMainTab('duelos'); setSubView('stats'); }}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${mainTab === 'duelos'
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                            }`}
                    >
                        <Swords className="w-5 h-5" />
                        Duelos
                    </button>
                </div>

                {/* Contenido según tab principal */}
                {mainTab === 'clasificatorias' && (
                    <>
                        {/* Sub-tabs para Clasificatorias */}
                        <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-lg p-1">
                            <button
                                onClick={() => setSubView('stats')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${subView === 'stats'
                                        ? 'bg-primary-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Resumen
                            </button>
                            <button
                                onClick={() => setSubView('chart')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${subView === 'chart'
                                        ? 'bg-primary-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Gráfico
                            </button>
                            <button
                                onClick={() => setSubView('history')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${subView === 'history'
                                        ? 'bg-primary-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                Historial
                            </button>
                        </div>

                        {/* Contenido Clasificatorias */}
                        {controls.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 mb-2">Sin controles registrados</p>
                                <p className="text-xs text-slate-500">
                                    Aquí aparecerán los resultados de entrenamientos y torneos
                                </p>
                            </div>
                        ) : (
                            <>
                                {subView === 'stats' && (
                                    <div className="animate-fade-in">
                                        <TrainingStats controls={controls} />
                                    </div>
                                )}
                                {subView === 'chart' && (
                                    <div className="glass-card p-4 animate-fade-in">
                                        <TrainingChart controls={controls} />
                                    </div>
                                )}
                                {subView === 'history' && (
                                    <div className="animate-fade-in">
                                        <TrainingControlHistory controls={controls} />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {mainTab === 'duelos' && (
                    <>
                        {/* Sub-tabs para Duelos */}
                        <div className="flex gap-1 mb-4 bg-slate-800/50 rounded-lg p-1">
                            <button
                                onClick={() => setSubView('stats')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${subView === 'stats'
                                        ? 'bg-primary-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Estadísticas
                            </button>
                            <button
                                onClick={() => setSubView('history')}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${subView === 'history'
                                        ? 'bg-primary-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                Historial
                            </button>
                        </div>

                        {/* Contenido Duelos */}
                        {duels.length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <Swords className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 mb-2">Sin duelos registrados</p>
                                <p className="text-xs text-slate-500">
                                    Los duelos aparecerán aquí cuando el entrenador los registre
                                </p>
                            </div>
                        ) : (
                            <>
                                {subView === 'stats' && (
                                    <div className="animate-fade-in">
                                        <DuelStats duels={duels} />
                                    </div>
                                )}
                                {subView === 'history' && (
                                    <div className="animate-fade-in">
                                        <DuelHistory duels={duels} showStudent={false} showEditButton={false} />
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
